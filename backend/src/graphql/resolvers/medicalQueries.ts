import { GraphQLError } from "graphql";

export const medicalQueries = {
  // Appointment Queries
  async appointments(parent: any, args: any, context: any) {
    const { pagination } = args;
    context.security.requireStaff(context);
    
    await context.security.checkRateLimit(context.userId, 'query');
    context.security.validatePagination(pagination);
    
    const where: any = {};
    
    // Doctors can only see their own appointments unless they're admin
    if (context.role === 'doctor' && context.role !== 'admin') {
      where.doctorId = context.userId;
    }
    
    const appointments = await context.prisma.appointment.findMany({
      where,
      skip: pagination?.skip || 0,
      take: pagination?.take || 10,
      include: {
        patient: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            phone: true
          }
        },
        doctor: {
          select: {
            id: true,
            username: true
          }
        }
      },
      orderBy: { appointment_time: 'desc' }
    });
    
    return appointments;
  },

  async appointment(parent: any, args: any, context: any) {
    const { id } = args;
    context.security.requireStaff(context);
    context.security.validateId(id);
    
    const appointment = await context.prisma.appointment.findUnique({
      where: { id },
      include: {
        patient: true,
        doctor: {
          select: {
            id: true,
            username: true,
            email: true
          }
        },
        medicalRecords: {
          include: {
            prescriptions: {
              include: {
                product: {
                  select: {
                    product_name: true,
                    dosage: true,
                    dosage_unit: true
                  }
                }
              }
            }
          }
        }
      }
    });
    
    if (!appointment) {
      throw new GraphQLError('Appointment not found');
    }
    
    // Check access permissions
    if (context.role === 'doctor' && appointment.doctorId !== context.userId) {
      throw new GraphQLError('Access denied: Can only view own appointments');
    }
    
    return appointment;
  },

  async patientAppointments(parent: any, args: any, context: any) {
    const { patientId } = args;
    context.security.requireStaff(context);
    context.security.validateId(patientId);
    
    await context.security.validatePatientAccess(context.userId, patientId, context.role);
    
    const where: any = { patientId };
    
    // Doctors can only see their own appointments with the patient
    if (context.role === 'doctor' && context.role !== 'admin') {
      where.doctorId = context.userId;
    }
    
    const appointments = await context.prisma.appointment.findMany({
      where,
      include: {
        doctor: {
          select: {
            id: true,
            username: true
          }
        }
      },
      orderBy: { appointment_time: 'desc' }
    });
    
    return appointments;
  },

  async doctorAppointments(parent: any, args: any, context: any) {
    const { doctorId } = args;
    context.security.requireStaff(context);
    context.security.validateId(doctorId);
    
    // Doctors can only see their own appointments
    await context.security.validateDoctorPermission(context.userId, doctorId);
    
    const appointments = await context.prisma.appointment.findMany({
      where: { doctorId },
      include: {
        patient: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            phone: true
          }
        }
      },
      orderBy: { appointment_time: 'asc' }
    });
    
    return appointments;
  },

  // Medical Record Queries
  async medicalRecords(parent: any, args: any, context: any) {
    const { patientId, pagination } = args;
    context.security.requireStaff(context);
    
    context.security.validatePagination(pagination);
    
    const where: any = {};
    
    if (patientId) {
      context.security.validateId(patientId);
      await context.security.validatePatientAccess(context.userId, patientId, context.role);
      where.patientId = patientId;
    }
    
    // Doctors can only see their own medical records unless they're admin
    if (context.role === 'doctor' && context.role !== 'admin') {
      where.doctorId = context.userId;
    }
    
    const medicalRecords = await context.prisma.medicalRecord.findMany({
      where,
      skip: pagination?.skip || 0,
      take: pagination?.take || 10,
      include: {
        patient: {
          select: {
            id: true,
            first_name: true,
            last_name: true
          }
        },
        doctor: {
          select: {
            id: true,
            username: true
          }
        },
        appointment: {
          select: {
            id: true,
            appointment_time: true
          }
        },
        prescriptions: {
          include: {
            product: {
              select: {
                product_name: true,
                dosage: true,
                dosage_unit: true
              }
            }
          }
        }
      },
      orderBy: { created_at: 'desc' }
    });
    
    return medicalRecords;
  },

  async medicalRecord(parent: any, args: any, context: any) {
    const { id } = args;
    context.security.requireStaff(context);
    context.security.validateId(id);
    
    const medicalRecord = await context.prisma.medicalRecord.findUnique({
      where: { id },
      include: {
        patient: true,
        doctor: {
          select: {
            id: true,
            username: true,
            email: true
          }
        },
        appointment: true,
        prescriptions: {
          include: {
            product: true
          }
        }
      }
    });
    
    if (!medicalRecord) {
      throw new GraphQLError('Medical record not found');
    }
    
    // Check access permissions
    if (context.role === 'doctor' && medicalRecord.doctorId !== context.userId) {
      throw new GraphQLError('Access denied: Can only view own medical records');
    }
    
    return medicalRecord;
  },

  // Treatment Plan Queries
  async treatmentPlans(parent: any, args: any, context: any) {
    const { patientId, pagination } = args;
    context.security.requireStaff(context);
    
    context.security.validatePagination(pagination);
    
    const where: any = {};
    
    if (patientId) {
      context.security.validateId(patientId);
      await context.security.validatePatientAccess(context.userId, patientId, context.role);
      where.patientId = patientId;
    }
    
    // Doctors can only see their own treatment plans unless they're admin
    if (context.role === 'doctor' && context.role !== 'admin') {
      where.doctorId = context.userId;
    }
    
    const treatmentPlans = await context.prisma.treatmentPlan.findMany({
      where,
      skip: pagination?.skip || 0,
      take: pagination?.take || 10,
      include: {
        patient: {
          select: {
            id: true,
            first_name: true,
            last_name: true
          }
        },
        doctor: {
          select: {
            id: true,
            username: true
          }
        }
      },
      orderBy: { created_at: 'desc' }
    });
    
    return treatmentPlans;
  },

  async treatmentPlan(parent: any, args: any, context: any) {
    const { id } = args;
    context.security.requireStaff(context);
    context.security.validateId(id);
    
    const treatmentPlan = await context.prisma.treatmentPlan.findUnique({
      where: { id },
      include: {
        patient: true,
        doctor: {
          select: {
            id: true,
            username: true,
            email: true
          }
        }
      }
    });
    
    if (!treatmentPlan) {
      throw new GraphQLError('Treatment plan not found');
    }
    
    // Check access permissions
    if (context.role === 'doctor' && treatmentPlan.doctorId !== context.userId) {
      throw new GraphQLError('Access denied: Can only view own treatment plans');
    }
    
    return treatmentPlan;
  },

  // Stock & Report Queries
  async stockMovements(parent: any, args: any, context: any) {
    const { productId, pagination } = args;
    context.security.requireStaff(context);
    
    context.security.validatePagination(pagination);
    
    const where: any = {};
    
    if (productId) {
      context.security.validateId(productId);
      where.productId = productId;
    }
    
    const stockMovements = await context.prisma.stockMovement.findMany({
      where,
      skip: pagination?.skip || 0,
      take: pagination?.take || 10,
      include: {
        product: {
          select: {
            product_name: true,
            unit: true
          }
        }
      },
      orderBy: { created_at: 'desc' }
    });
    
    return stockMovements;
  },

  async stockAlerts(parent: any, args: any, context: any) {
    const { acknowledged, pagination } = args;
    context.security.requireStaff(context);
    
    context.security.validatePagination(pagination);
    
    const where: any = {};
    
    if (acknowledged !== undefined) {
      where.acknowledged = acknowledged;
    }
    
    const stockAlerts = await context.prisma.stockAlert.findMany({
      where,
      skip: pagination?.skip || 0,
      take: pagination?.take || 10,
      include: {
        product: {
          select: {
            product_name: true,
            stock_quantity: true,
            reorder_point: true
          }
        }
      },
      orderBy: { created_at: 'desc' }
    });
    
    return stockAlerts;
  },

  async dailyReports(parent: any, args: any, context: any) {
    const { date_from, date_to } = args;
    context.security.requireStaff(context);
    
    const where: any = {};
    
    if (date_from || date_to) {
      where.report_date = {};
      if (date_from) where.report_date.gte = date_from;
      if (date_to) where.report_date.lte = date_to;
    }
    
    const dailyReports = await context.prisma.dailyReport.findMany({
      where,
      orderBy: { report_date: 'desc' },
      take: 100 // Limit to prevent large data exports
    });
    
    return dailyReports;
  },

  async salesReports(parent: any, args: any, context: any) {
    const { date_from, date_to, productId } = args;
    context.security.requireStaff(context);
    
    const where: any = {};
    
    if (date_from || date_to) {
      where.report_date = {};
      if (date_from) where.report_date.gte = date_from;
      if (date_to) where.report_date.lte = date_to;
    }
    
    if (productId) {
      context.security.validateId(productId);
      where.productId = productId;
    }
    
    const salesReports = await context.prisma.salesReport.findMany({
      where,
      include: {
        product: {
          select: {
            product_name: true,
            unit: true
          }
        }
      },
      orderBy: { report_date: 'desc' },
      take: 500 // Limit to prevent large data exports
    });
    
    return salesReports;
  }
}; 