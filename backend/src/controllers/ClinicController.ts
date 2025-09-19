import { Elysia, t } from "elysia";
import { jwt } from "@elysiajs/jwt";
import { PrismaClient } from "@prisma/client";
import { ClinicService } from "../services/ClinicService";

const prisma = new PrismaClient();

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

export const clinicController = new Elysia()
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
    headers, 
    jwt, 
    set, 
    clinicService 
  }) => {
    try {
      const user = await requireAuth(headers, jwt);
      requireRole(user, ['doctor', 'admin', 'staff', 'cashier']);

      const queueTickets = await clinicService.getQueueTickets({
        station: query.station as any,
        status: query.status as any,
        skip: query.skip ? parseInt(query.skip) : 0,
        take: query.take ? parseInt(query.take) : 50
      });

      return { success: true, data: queueTickets };
    } catch (error: any) {
      set.status = error.message.includes('Access denied') ? 403 : 
                  error.message.includes('authorization') || error.message.includes('JWT') ? 401 : 400;
      return { success: false, error: error.message };
    }
  })

  // PUT /queue/:id/status - Update queue ticket status
  .put('/queue/:ticketId/status', async ({ 
    params: { ticketId }, 
    body, 
    headers, 
    jwt, 
    set, 
    clinicService 
  }) => {
    try {
      const user = await requireAuth(headers, jwt);
      requireRole(user, ['doctor', 'admin', 'staff', 'cashier']);

      const queueTicket = await clinicService.updateQueueStatus(
        ticketId, 
        body.status, 
        user.id,
        body.note
      );

      return { success: true, data: queueTicket };
    } catch (error: any) {
      set.status = error.message.includes('Access denied') ? 403 : 
                  error.message.includes('authorization') || error.message.includes('JWT') ? 401 : 400;
      return { success: false, error: error.message };
    }
  }, {
    body: updateQueueStatusModel
  });
