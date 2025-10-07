import { PrismaClient } from "@prisma/client";
import { ClinicService } from "../../services/ClinicService";

const prisma = new PrismaClient();
const clinicService = new ClinicService(prisma);

export const clinicQueries = {
  visit: async (_: any, { id }: { id: string }, context: any) => {
    if (!context.isAuthenticated) {
      throw new Error("Authentication required");
    }

    if (!["doctor", "admin", "staff", "cashier", "nurse"].includes(context.user.role)) {
      throw new Error("Access denied");
    }

    try {
      return await clinicService.getVisitById(id);
    } catch (error: any) {
      throw new Error(error.message);
    }
  },

  visits: async (
    _: any,
    { patientId, status, pagination }: { patientId?: string; status?: string; pagination?: any },
    context: any
  ) => {
    if (!context.isAuthenticated) {
      throw new Error("Authentication required");
    }

    if (!["doctor", "admin", "staff", "cashier", "nurse"].includes(context.user.role)) {
      throw new Error("Access denied");
    }

    try {
      if (patientId) {
        return await clinicService.getPatientVisits(patientId, {
          skip: pagination?.offset || 0,
          take: pagination?.limit || 20,
          status: status as any
        });
      } else {
        // Get all visits (admin/staff only)
        if (!["doctor", "admin", "staff"].includes(context.user.role)) {
          throw new Error("Access denied");
        }

        const visits = await context.prisma.visit.findMany({
          where: status ? { status } : {},
          skip: pagination?.offset || 0,
          take: pagination?.limit || 20,
          orderBy: { visit_date: 'desc' },
          include: {
            patient: {
              select: {
                id: true,
                first_name: true,
                last_name: true,
                phone: true,
                email: true
              }
            },
            appointment: true,
            vitals: true,
            queueTickets: {
              orderBy: { created_at: 'desc' },
              take: 1
            },
            visitOrders: {
              include: {
                order: {
                  select: {
                    id: true,
                    order_date: true,
                    total_amount: true,
                    status: true
                  }
                }
              }
            }
          }
        });

        return visits;
      }
    } catch (error: any) {
      throw new Error(error.message);
    }
  },

  patientVisits: async (
    _: any,
    { patientId, pagination }: { patientId: string; pagination?: any },
    context: any
  ) => {
    if (!context.isAuthenticated) {
      throw new Error("Authentication required");
    }

    if (!["doctor", "admin", "staff", "cashier", "nurse"].includes(context.user.role)) {
      throw new Error("Access denied");
    }

    try {
      return await clinicService.getPatientVisits(patientId, {
        skip: pagination?.offset || 0,
        take: pagination?.limit || 20
      });
    } catch (error: any) {
      throw new Error(error.message);
    }
  },

  queueTickets: async (
    _: any,
    { station, status, pagination }: { station?: string; status?: string; pagination?: any },
    context: any
  ) => {
    if (!context.isAuthenticated) {
      throw new Error("Authentication required");
    }

    if (!["doctor", "admin", "staff", "cashier", "nurse"].includes(context.user.role)) {
      throw new Error("Access denied");
    }

    // Add specific rate limiting for queue tickets queries
    await context.security.checkRateLimit(context.userId, 'query', context.redisClient);

    try {
      return await clinicService.getQueueTickets({
        station: station as any,
        status: status as any,
        skip: pagination?.offset || 0,
        take: pagination?.limit || 50
      });
    } catch (error: any) {
      throw new Error(error.message);
    }
  },

  queueTicket: async (_: any, { id }: { id: string }, context: any) => {
    if (!context.isAuthenticated) {
      throw new Error("Authentication required");
    }

    if (!["doctor", "admin", "staff", "cashier", "nurse"].includes(context.user.role)) {
      throw new Error("Access denied");
    }

    try {
      const ticket = await context.prisma.queueTicket.findUnique({
        where: { id },
        include: {
          visit: {
            include: {
              patient: {
                select: {
                  id: true,
                  first_name: true,
                  last_name: true,
                  phone: true,
                  email: true
                }
              }
            }
          },
          events: {
            orderBy: { at: 'desc' }
          }
        }
      });

      if (!ticket) {
        throw new Error("Queue ticket not found");
      }

      return ticket;
    } catch (error: any) {
      throw new Error(error.message);
    }
  },

  queueStats: async (
    _: any,
    { station }: { station?: string },
    context: any
  ) => {
    if (!context.isAuthenticated) {
      throw new Error("Authentication required");
    }

    if (!["doctor", "admin", "staff", "cashier", "nurse"].includes(context.user.role)) {
      throw new Error("Access denied");
    }

    try {
      return await clinicService.getQueueStats(station as any);
    } catch (error: any) {
      throw new Error(error.message);
    }
  },

  // Triage Queue Query
  triageQueue: async (
    _: any,
    { status, skip = 0, take = 50, search }: { status?: string; skip?: number; take?: number; search?: string },
    context: any
  ) => {
    if (!context.isAuthenticated) {
      throw new Error("Authentication required");
    }

    // Allow nurses, doctors, admin, and staff to access triage queue
    if (!["nurse", "doctor", "admin", "staff"].includes(context.user.role)) {
      throw new Error("FORBIDDEN");
    }

    // Add specific rate limiting for triage queue queries
    await context.security.checkRateLimit(context.userId, 'query', context.redisClient);

    try {
      return await clinicService.getTriageQueue({
        status: status as any,
        skip,
        take,
        search
      });
    } catch (error: any) {
      throw new Error(error.message);
    }
  },

  // Patient Vitals Query
  patientVitals: async (
    _: any,
    { patientId }: { patientId: string },
    context: any
  ) => {
    if (!context.isAuthenticated) {
      throw new Error("Authentication required");
    }

    // Allow nurses, doctors, admin, and staff to access patient vitals
    if (!["nurse", "doctor", "admin", "staff"].includes(context.user.role)) {
      throw new Error("FORBIDDEN");
    }

    try {
      return await clinicService.getPatientVitals(patientId);
    } catch (error: any) {
      throw new Error(error.message);
    }
  }
};
