import { PrismaClient, VisitStatus, QueueStation, QueueStatus } from "@prisma/client";

export interface CreateVisitInput {
  patientId: string;
  appointmentId?: string;
  chief_complaint?: string;
  diagnosis?: string;
  notes?: string;
}

export interface UpdateVisitInput {
  status?: VisitStatus;
  chief_complaint?: string;
  diagnosis?: string;
  notes?: string;
}

export interface UpsertVitalsInput {
  visitId: string;
  heightCm?: number;
  weightKg?: number;
  tempC?: number;
  sbp?: number;
  dbp?: number;
  hr?: number;
  rr?: number;
  spo2?: number;
  bmi?: number;
}

export interface CreateQueueTicketInput {
  visitId: string;
  station: QueueStation;
  priority?: number;
}

export interface LinkOrderInput {
  visitId: string;
  orderId: string;
}

export interface GetVisitsOptions {
  skip?: number;
  take?: number;
  status?: VisitStatus;
}

export interface GetQueueOptions {
  station?: QueueStation;
  status?: QueueStatus;
  skip?: number;
  take?: number;
}

export class ClinicService {
  constructor(private prisma: PrismaClient) {}

  async createVisit(input: CreateVisitInput) {
    // Verify patient exists
    const patient = await this.prisma.patient.findUnique({
      where: { id: input.patientId, isDelete: false }
    });

    if (!patient) {
      throw new Error('Patient not found');
    }

    // Verify appointment exists if provided
    if (input.appointmentId) {
      const appointment = await this.prisma.appointment.findUnique({
        where: { id: input.appointmentId, isDelete: false }
      });

      if (!appointment) {
        throw new Error('Appointment not found');
      }

      if (appointment.patientId !== input.patientId) {
        throw new Error('Appointment does not belong to this patient');
      }
    }

    const visit = await this.prisma.visit.create({
      data: {
        patientId: input.patientId,
        appointmentId: input.appointmentId,
        chief_complaint: input.chief_complaint,
        diagnosis: input.diagnosis,
        notes: input.notes,
        status: 'open'
      },
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
          orderBy: { created_at: 'desc' }
        }
      }
    });

    return visit;
  }

  async updateVisit(visitId: string, input: UpdateVisitInput) {
    // Verify visit exists
    const existingVisit = await this.prisma.visit.findUnique({
      where: { id: visitId }
    });

    if (!existingVisit) {
      throw new Error('Visit not found');
    }

    const visit = await this.prisma.visit.update({
      where: { id: visitId },
      data: input,
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
          orderBy: { created_at: 'desc' }
        },
        visitOrders: {
          include: {
            order: {
              include: {
                orderItems: {
                  include: {
                    product: true
                  }
                },
                invoice: true,
                payments: true
              }
            }
          }
        }
      }
    });

    return visit;
  }

  async deleteVisit(visitId: string) {
    // Verify visit exists
    const existingVisit = await this.prisma.visit.findUnique({
      where: { id: visitId }
    });

    if (!existingVisit) {
      throw new Error('Visit not found');
    }

    // Delete related data first
    await this.prisma.vitals.deleteMany({
      where: { visitId: visitId }
    });

    await this.prisma.queueTicket.deleteMany({
      where: { visitId: visitId }
    });

    await this.prisma.visitOrder.deleteMany({
      where: { visitId: visitId }
    });

    // Delete the visit
    await this.prisma.visit.delete({
      where: { id: visitId }
    });

    return true;
  }

  async getVisitById(visitId: string) {
    const visit = await this.prisma.visit.findUnique({
      where: { id: visitId },
      include: {
        patient: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            phone: true,
            email: true,
            date_of_birth: true,
            gender: true,
            address: true
          }
        },
        appointment: true,
        vitals: true,
        queueTickets: {
          orderBy: { created_at: 'desc' },
          include: {
            events: {
              orderBy: { at: 'desc' }
            }
          }
        },
        visitOrders: {
          include: {
            order: {
              include: {
                orderItems: {
                  include: {
                    product: true
                  }
                },
                invoice: true,
                payments: true
              }
            }
          }
        }
      }
    });

    if (!visit) {
      throw new Error('Visit not found');
    }

    return visit;
  }

  async getPatientVisits(patientId: string, options: GetVisitsOptions = {}) {
    const { skip = 0, take = 20, status } = options;

    // Verify patient exists
    const patient = await this.prisma.patient.findUnique({
      where: { id: patientId, isDelete: false }
    });

    if (!patient) {
      throw new Error('Patient not found');
    }

    const visits = await this.prisma.visit.findMany({
      where: {
        patientId,
        ...(status && { status })
      },
      skip,
      take,
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

  async upsertVitals(input: UpsertVitalsInput) {
    // Verify visit exists
    const visit = await this.prisma.visit.findUnique({
      where: { id: input.visitId }
    });

    if (!visit) {
      throw new Error('Visit not found');
    }

    // Calculate BMI if height and weight are provided
    let bmi = input.bmi;
    if (input.heightCm && input.weightKg && !bmi) {
      const heightM = input.heightCm / 100;
      bmi = input.weightKg / (heightM * heightM);
      bmi = Math.round(bmi * 100) / 100; // Round to 2 decimal places
    }

    const vitals = await this.prisma.vitals.upsert({
      where: { visitId: input.visitId },
      create: {
        visitId: input.visitId,
        heightCm: input.heightCm,
        weightKg: input.weightKg,
        tempC: input.tempC,
        sbp: input.sbp,
        dbp: input.dbp,
        hr: input.hr,
        rr: input.rr,
        spo2: input.spo2,
        bmi
      },
      update: {
        heightCm: input.heightCm,
        weightKg: input.weightKg,
        tempC: input.tempC,
        sbp: input.sbp,
        dbp: input.dbp,
        hr: input.hr,
        rr: input.rr,
        spo2: input.spo2,
        bmi
      },
      include: {
        visit: {
          include: {
            patient: {
              select: {
                id: true,
                first_name: true,
                last_name: true
              }
            }
          }
        }
      }
    });

    return vitals;
  }

  async createQueueTicket(input: CreateQueueTicketInput) {
    // Verify visit exists
    const visit = await this.prisma.visit.findUnique({
      where: { id: input.visitId },
      include: {
        patient: true
      }
    });

    if (!visit) {
      throw new Error('Visit not found');
    }

    // Check if there's already an active queue ticket for this visit and station
    const existingTicket = await this.prisma.queueTicket.findFirst({
      where: {
        visitId: input.visitId,
        station: input.station,
        status: {
          in: ['waiting', 'called', 'in_service']
        }
      }
    });

    if (existingTicket) {
      throw new Error(`Active queue ticket already exists for this visit at ${input.station} station`);
    }

    // Get next queue number for this station today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const lastTicket = await this.prisma.queueTicket.findFirst({
      where: {
        station: input.station,
        created_at: {
          gte: today,
          lt: tomorrow
        }
      },
      orderBy: { number: 'desc' }
    });

    const nextNumber = (lastTicket?.number || 0) + 1;

    const queueTicket = await this.prisma.queueTicket.create({
      data: {
        visitId: input.visitId,
        patientId: visit.patient.id,
        station: input.station,
        number: nextNumber,
        priority: input.priority || 0,
        status: 'waiting'
      },
      include: {
        visit: {
          include: {
            patient: {
              select: {
                id: true,
                first_name: true,
                last_name: true,
                phone: true
              }
            }
          }
        },
        events: {
          orderBy: { at: 'desc' }
        }
      }
    });

    // Create initial queue event
    await this.prisma.queueEvent.create({
      data: {
        ticketId: queueTicket.id,
        station: input.station,
        status: 'waiting'
      }
    });

    return queueTicket;
  }

  async updateQueueStatus(ticketId: string, status: QueueStatus, byUserId?: string, note?: string) {
    // Verify ticket exists
    const ticket = await this.prisma.queueTicket.findUnique({
      where: { id: ticketId },
      include: {
        visit: true
      }
    });

    if (!ticket) {
      throw new Error('Queue ticket not found');
    }

    // Update ticket status and timestamps
    const updateData: any = { status };
    
    switch (status) {
      case 'called':
        updateData.called_at = new Date();
        break;
      case 'in_service':
        updateData.started_at = new Date();
        break;
      case 'done':
      case 'skipped':
      case 'cancelled':
        updateData.done_at = new Date();
        break;
    }

    const updatedTicket = await this.prisma.queueTicket.update({
      where: { id: ticketId },
      data: updateData,
      include: {
        visit: {
          include: {
            patient: {
              select: {
                id: true,
                first_name: true,
                last_name: true,
                phone: true
              }
            }
          }
        },
        events: {
          orderBy: { at: 'desc' }
        }
      }
    });

    // Create queue event
    await this.prisma.queueEvent.create({
      data: {
        ticketId,
        station: ticket.station,
        status,
        byUserId,
        note
      }
    });

    return updatedTicket;
  }

  async getQueueTickets(options: GetQueueOptions = {}) {
    const { station, status, skip = 0, take = 50 } = options;

    const where: any = {};
    
    if (station) {
      where.station = station;
    }
    
    if (status) {
      where.status = status;
    }

    // Default to showing only today's tickets
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    where.created_at = {
      gte: today,
      lt: tomorrow
    };

    const queueTickets = await this.prisma.queueTicket.findMany({
      where,
      skip,
      take,
      orderBy: [
        { priority: 'desc' },
        { number: 'asc' }
      ],
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
          orderBy: { at: 'desc' },
          take: 1
        }
      }
    });

    return queueTickets;
  }

  async linkOrderToVisit(input: LinkOrderInput) {
    // Verify visit exists
    const visit = await this.prisma.visit.findUnique({
      where: { id: input.visitId }
    });

    if (!visit) {
      throw new Error('Visit not found');
    }

    // Verify order exists
    const order = await this.prisma.order.findUnique({
      where: { id: input.orderId, isDelete: false }
    });

    if (!order) {
      throw new Error('Order not found');
    }

    // Verify order belongs to the same patient
    if (order.patientId !== visit.patientId) {
      throw new Error('Order does not belong to the same patient as the visit');
    }

    // Check if link already exists
    const existingLink = await this.prisma.visitOrder.findUnique({
      where: {
        visitId_orderId: {
          visitId: input.visitId,
          orderId: input.orderId
        }
      }
    });

    if (existingLink) {
      throw new Error('Order is already linked to this visit');
    }

    const visitOrder = await this.prisma.visitOrder.create({
      data: {
        visitId: input.visitId,
        orderId: input.orderId
      },
      include: {
        visit: {
          include: {
            patient: {
              select: {
                id: true,
                first_name: true,
                last_name: true
              }
            }
          }
        },
        order: {
          include: {
            orderItems: {
              include: {
                product: true
              }
            },
            invoice: true,
            payments: true
          }
        }
      }
    });

    return visitOrder;
  }

  async getNextQueueNumber(station: QueueStation): Promise<number> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const lastTicket = await this.prisma.queueTicket.findFirst({
      where: {
        station,
        created_at: {
          gte: today,
          lt: tomorrow
        }
      },
      orderBy: { number: 'desc' }
    });

    return (lastTicket?.number || 0) + 1;
  }

  async getQueueStats(station?: QueueStation) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const where: any = {
      created_at: {
        gte: today,
        lt: tomorrow
      }
    };

    if (station) {
      where.station = station;
    }

    const stats = await this.prisma.queueTicket.groupBy({
      by: ['station', 'status'],
      where,
      _count: {
        id: true
      }
    });

    return stats;
  }
}
