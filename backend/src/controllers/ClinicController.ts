import { Elysia, t } from "elysia";
import { jwt } from "@elysiajs/jwt";
import { cookie } from "@elysiajs/cookie";
import { PrismaClient } from "@prisma/client";
import { ClinicService } from "../services/ClinicService";
import { RolePermissionsMiddleware } from "../middleware/RolePermissionsMiddleware";
import { SecurityService } from "../graphql/security";

const prisma = new PrismaClient();
const rolePermissions = new RolePermissionsMiddleware();

// Validation schemas
const createVisitModel = t.Object({
  patientId: t.String(),
  appointmentId: t.Optional(t.String()),
  chief_complaint: t.Optional(t.String()),
  diagnosis: t.Optional(t.String()),
  notes: t.Optional(t.String())
});

const upsertVitalsModel = t.Object({
  visitId: t.String(),
  heightCm: t.Optional(t.Number()),
  weightKg: t.Optional(t.Number()),
  tempC: t.Optional(t.Number()),
  sbp: t.Optional(t.Number()),
  dbp: t.Optional(t.Number()),
  hr: t.Optional(t.Number()),
  rr: t.Optional(t.Number()),
  spo2: t.Optional(t.Number()),
  bmi: t.Optional(t.Number())
});

const createQueueTicketModel = t.Object({
  visitId: t.String(),
  station: t.Union([
    t.Literal("triage"),
    t.Literal("doctor"),
    t.Literal("pharmacy"),
    t.Literal("cashier")
  ]),
  priority: t.Optional(t.Number())
});

const linkOrderModel = t.Object({
  visitId: t.String(),
  orderId: t.String()
});

const updateQueueStatusModel = t.Object({
  status: t.Union([
    t.Literal("waiting"),
    t.Literal("called"),
    t.Literal("in_service"),
    t.Literal("done"),
    t.Literal("skipped"),
    t.Literal("cancelled")
  ]),
  note: t.Optional(t.String())
});

const updateVisitModel = t.Object({
  status: t.Optional(t.Union([
    t.Literal("open"),
    t.Literal("triage"),
    t.Literal("doctor"),
    t.Literal("pharmacy"),
    t.Literal("cashier"),
    t.Literal("done"),
    t.Literal("cancelled")
  ])),
  chief_complaint: t.Optional(t.String()),
  diagnosis: t.Optional(t.String()),
  notes: t.Optional(t.String()),
  appointmentId: t.Optional(t.String())
});

// Authentication middleware
const requireAuth = async (headers: Record<string, string>, jwt: any) => {
  const authHeader = headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('Missing or invalid authorization header');
  }

  const token = authHeader.replace('Bearer ', '');
  try {
    const payload = await jwt.verify(token);
    return payload;
  } catch (error) {
    throw new Error('Invalid JWT token');
  }
};

// Role-based authorization
const requireRole = (user: any, allowedRoles: string[]) => {
  if (!allowedRoles.includes(user.role)) {
    throw new Error(`Access denied. Required roles: ${allowedRoles.join(', ')}`);
  }
};

export const clinicController = (redisClient?: any) => new Elysia()
  .use(cookie())
  .use(jwt({
    name: 'jwt',
    secret: process.env.JWT_SECRET!
  }))
  .decorate('clinicService', new ClinicService(prisma))
  
  // POST /patients/:id/visits - Create a new visit
  .post('/patients/:patientId/visits', async ({ 
    params: { patientId }, 
    body, 
    headers, 
    jwt, 
    set, 
    clinicService 
  }) => {
    try {
      const user = await requireAuth(headers, jwt);
      requireRole(user, ['doctor', 'admin', 'staff']);

      const visit = await clinicService.createVisit({
        patientId,
        ...body
      });

      // Log security tracking for visit creation
      await SecurityService.logSensitiveOperation(
        user.sub,
        'CREATE_VISIT_REST',
        'Visit',
        visit.id,
        { 
          patientId,
          appointmentId: body.appointmentId,
          chiefComplaint: body.chief_complaint 
        },
        redisClient
      );

      return { success: true, data: visit };
    } catch (error: any) {
      set.status = error.message.includes('Access denied') ? 403 : 
                  error.message.includes('authorization') || error.message.includes('JWT') ? 401 : 400;
      return { success: false, error: error.message };
    }
  }, {
    body: t.Object({
      appointmentId: t.Optional(t.String()),
      chief_complaint: t.Optional(t.String()),
      diagnosis: t.Optional(t.String()),
      notes: t.Optional(t.String())
    })
  })

  // PUT /visits/:id - Update visit details
  .put('/visits/:visitId', async ({ 
    params: { visitId }, 
    body, 
    headers, 
    jwt, 
    set, 
    clinicService 
  }) => {
    try {
      const user = await requireAuth(headers, jwt);
      requireRole(user, ['doctor', 'admin', 'staff']);

      const visit = await clinicService.updateVisit(visitId, body);
      
      // Log security tracking for visit update
      await SecurityService.logSensitiveOperation(
        user.sub,
        'UPDATE_VISIT_REST',
        'Visit',
        visitId,
        { 
          visitId,
          status: body.status,
          chiefComplaint: body.chief_complaint,
          diagnosis: body.diagnosis 
        },
        redisClient
      );
      
      return { success: true, data: visit };
    } catch (error: any) {
      set.status = error.message.includes('Access denied') ? 403 : 
                  error.message.includes('authorization') || error.message.includes('JWT') ? 401 : 400;
      return { success: false, error: error.message };
    }
  }, {
    body: updateVisitModel
  })

  // POST /visits/:id/vitals - Upsert vitals for a visit
  .post('/visits/:visitId/vitals', async ({ 
    params: { visitId }, 
    body, 
    headers, 
    jwt, 
    set, 
    clinicService 
  }) => {
    try {
      const user = await requireAuth(headers, jwt);
      requireRole(user, ['doctor', 'admin', 'staff']);

      const vitals = await clinicService.upsertVitals({
        visitId,
        ...body
      });

      // Log security tracking for vitals update
      await SecurityService.logSensitiveOperation(
        user.sub,
        'UPDATE_VITALS_REST',
        'Vitals',
        vitals.id,
        { 
          visitId,
          heightCm: body.heightCm,
          weightKg: body.weightKg,
          tempC: body.tempC,
          sbp: body.sbp,
          dbp: body.dbp,
          hr: body.hr,
          rr: body.rr,
          spo2: body.spo2,
          bmi: body.bmi
        },
        redisClient
      );

      return { success: true, data: vitals };
    } catch (error: any) {
      set.status = error.message.includes('Access denied') ? 403 : 
                  error.message.includes('authorization') || error.message.includes('JWT') ? 401 : 400;
      return { success: false, error: error.message };
    }
  }, {
    body: t.Object({
      heightCm: t.Optional(t.Number()),
      weightKg: t.Optional(t.Number()),
      tempC: t.Optional(t.Number()),
      sbp: t.Optional(t.Number()),
      dbp: t.Optional(t.Number()),
      hr: t.Optional(t.Number()),
      rr: t.Optional(t.Number()),
      spo2: t.Optional(t.Number()),
      bmi: t.Optional(t.Number())
    })
  })

  // POST /visits/:id/queue - Create queue ticket
  .post('/visits/:visitId/queue', async ({ 
    params: { visitId }, 
    body, 
    headers, 
    jwt, 
    set, 
    clinicService 
  }) => {
    try {
      const user = await requireAuth(headers, jwt);
      requireRole(user, ['doctor', 'admin', 'staff', 'cashier']);

      const queueTicket = await clinicService.createQueueTicket({
        visitId,
        ...body
      });

      // Log security tracking for queue ticket creation
      await SecurityService.logSensitiveOperation(
        user.sub,
        'CREATE_QUEUE_TICKET_REST',
        'QueueTicket',
        queueTicket.id,
        { 
          visitId,
          station: body.station,
          priority: body.priority,
          number: queueTicket.number
        },
        redisClient
      );

      return { success: true, data: queueTicket };
    } catch (error: any) {
      set.status = error.message.includes('Access denied') ? 403 : 
                  error.message.includes('authorization') || error.message.includes('JWT') ? 401 : 400;
      return { success: false, error: error.message };
    }
  }, {
    body: t.Object({
      station: t.Union([
        t.Literal("triage"),
        t.Literal("doctor"),
        t.Literal("pharmacy"),
        t.Literal("cashier")
      ]),
      priority: t.Optional(t.Number())
    })
  })

  // POST /visits/:id/link-order - Link order to visit
  .post('/visits/:visitId/link-order', async ({ 
    params: { visitId }, 
    body, 
    headers, 
    jwt, 
    set, 
    clinicService 
  }) => {
    try {
      const user = await requireAuth(headers, jwt);
      requireRole(user, ['doctor', 'admin', 'staff', 'cashier']);

      const visitOrder = await clinicService.linkOrderToVisit({
        visitId,
        orderId: body.orderId
      });

      return { success: true, data: visitOrder };
    } catch (error: any) {
      set.status = error.message.includes('Access denied') ? 403 : 
                  error.message.includes('authorization') || error.message.includes('JWT') ? 401 : 400;
      return { success: false, error: error.message };
    }
  }, {
    body: t.Object({
      orderId: t.String()
    })
  })

  // GET /visits/:id - Get visit details
  .get('/visits/:visitId', async ({ 
    params: { visitId }, 
    headers, 
    jwt, 
    set, 
    clinicService 
  }) => {
    try {
      const user = await requireAuth(headers, jwt);
      requireRole(user, ['doctor', 'admin', 'staff', 'cashier']);

      const visit = await clinicService.getVisitById(visitId);
      return { success: true, data: visit };
    } catch (error: any) {
      set.status = error.message.includes('Access denied') ? 403 : 
                  error.message.includes('authorization') || error.message.includes('JWT') ? 401 : 
                  error.message.includes('not found') ? 404 : 400;
      return { success: false, error: error.message };
    }
  })

  // GET /patients/:id/visits - Get patient visits
  .get('/patients/:patientId/visits', async ({ 
    params: { patientId }, 
    query, 
    headers, 
    jwt, 
    set, 
    clinicService 
  }) => {
    try {
      const user = await requireAuth(headers, jwt);
      requireRole(user, ['doctor', 'admin', 'staff', 'cashier']);

      const visits = await clinicService.getPatientVisits(patientId, {
        skip: query.skip ? parseInt(query.skip) : 0,
        take: query.take ? parseInt(query.take) : 20,
        status: query.status as any
      });

      return { success: true, data: visits };
    } catch (error: any) {
      set.status = error.message.includes('Access denied') ? 403 : 
                  error.message.includes('authorization') || error.message.includes('JWT') ? 401 : 400;
      return { success: false, error: error.message };
    }
  })

  // GET /queue - Get queue tickets by station
  .get('/queue', async ({ 
    query, 
    cookie,
    set, 
    clinicService 
  }) => {
    try {
      // Check if user has permission for specific station or general queue access
      const station = query.station as string;
      let permissionCheck;
      
      if (station) {
        permissionCheck = await rolePermissions.checkQueuePermission(cookie, station);
      } else {
        permissionCheck = await rolePermissions.checkAnyQueuePermission(cookie);
      }
      
      if (!permissionCheck.success) {
        set.status = permissionCheck.statusCode;
        return { success: false, message: permissionCheck.message };
      }

      const queueTickets = await clinicService.getQueueTickets({
        station: query.station as any,
        status: query.status as any,
        skip: query.skip ? parseInt(query.skip) : 0,
        take: query.take ? parseInt(query.take) : 50
      });

      return { success: true, data: queueTickets };
    } catch (error: any) {
      set.status = 500;
      return { success: false, error: error.message };
    }
  })

  // PUT /queue/:id/status - Update queue ticket status
  .put('/queue/:ticketId/status', async ({ 
    params: { ticketId }, 
    body, 
    cookie,
    set, 
    clinicService 
  }) => {
    try {
      // First get the ticket to determine which station it belongs to
      const ticket = await clinicService.getQueueTicketById(ticketId);
      if (!ticket) {
        set.status = 404;
        return { success: false, message: "Queue ticket not found" };
      }

      // Check permission for the specific station
      const permissionCheck = await rolePermissions.checkQueuePermission(cookie, ticket.station);
      if (!permissionCheck.success) {
        set.status = permissionCheck.statusCode;
        return { success: false, message: permissionCheck.message };
      }

      const queueTicket = await clinicService.updateQueueStatus(
        ticketId, 
        body.status, 
        permissionCheck.userId,
        body.note
      );

      // Log security tracking for queue status update
      await SecurityService.logSensitiveOperation(
        permissionCheck.userId!,
        'UPDATE_QUEUE_STATUS_REST',
        'QueueTicket',
        ticketId,
        { 
          ticketId,
          station: ticket.station,
          oldStatus: ticket.status,
          newStatus: body.status,
          note: body.note
        },
        redisClient
      );

      return { success: true, data: queueTicket };
    } catch (error: any) {
      set.status = 500;
      return { success: false, error: error.message };
    }
  }, {
    body: updateQueueStatusModel
  });
