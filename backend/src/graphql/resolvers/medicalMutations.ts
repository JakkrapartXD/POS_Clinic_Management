import { GraphQLError } from "graphql";
import type { PrismaClient } from "@prisma/client";
import { ReportService } from "../../services/ReportService";

export const medicalMutations = {
  // Order Mutations
  async createOrder(parent: any, args: any, context: any) {
    const { input } = args;
    context.security.requireStaff(context);
    
    await context.security.checkRateLimit(context.userId, 'mutation', context.redisClient);
    
    if (!input.orderItems || input.orderItems.length === 0) {
      throw new GraphQLError('Order must have at least one item');
    }
    
    // Validate patient if provided
    if (input.patientId) {
      context.security.validateId(input.patientId);
    }
    
    // Use database transaction for order creation
    const order = await context.prisma.$transaction(async (tx: PrismaClient) => {
      // Validate stock availability for all items
      for (const item of input.orderItems) {
        await context.security.validateProductStock(item.productId, item.quantity);
      }
      
      // Create the order
      const newOrder = await tx.order.create({
        data: {
          userId: context.userId,
          patientId: input.patientId,
          status: input.status || 'completed',
          total_amount: input.total_amount,
          is_walkin: input.is_walkin || false
        }
      });
      
      // Create order items and update stock
      for (const item of input.orderItems) {
        // Get product information for historical reference
        const product = await tx.product.findUnique({
          where: { id: item.productId },
          select: { product_name: true, unit: true }
        });
        
        await tx.orderItem.create({
          data: {
            orderId: newOrder.id,
            productId: item.productId,
            quantity: item.quantity,
            unit_price: item.unit_price,
            total_price: item.total_price,
            product_name: product?.product_name || null,
            product_unit: product?.unit || null
          }
        });
        
        // Update product stock
        await tx.product.update({
          where: { id: item.productId },
          data: {
            stock_quantity: {
              decrement: item.quantity
            }
          }
        });
        
        // Create stock record
        await tx.stock.create({
          data: {
            productId: item.productId,
            quantity: item.quantity,
            quantity_in: 0,
            is_outofstock: false,
            reference_table: 'Order',
            reference_id: newOrder.id,
            note: `Sale - Order ${newOrder.id}`,
            createdByUserId: context.userId,
            created_by_username: context.user?.username,
            product_name: product?.product_name || null,
            product_unit: product?.unit || null,
            created_at: new Date()
          }
        });
      }
      
      return newOrder;
    });
    
    // Return order with full details
    const fullOrder = await context.prisma.order.findUnique({
      where: { id: order.id },
      include: {
        patient: true,
        user: {
          select: { id: true, username: true }
        },
        orderItems: {
          include: {
            product: {
              select: { product_name: true, unit: true }
            }
          }
        }
      }
    });
    
    await context.security.logSensitiveOperation(
      context.userId,
      'CREATE_ORDER',
      'Order',
      order.id,
      { total: input.total_amount, items: input.orderItems.length }, context.redisClient
    );
    
    return fullOrder;
  },

  async processPayment(parent: any, args: any, context: any) {
    const { input } = args;
    context.security.requireStaff(context);
    context.security.validateId(input.orderId);
    
    await context.security.checkRateLimit(context.userId, 'mutation', context.redisClient);
    
    // Validate order exists
    const order = await context.prisma.order.findUnique({
      where: { id: input.orderId },
      include: { payments: true }
    });
    
    if (!order) {
      throw new GraphQLError('Order not found');
    }
    
    // Check if order is already fully paid
    const totalPaid = order.payments.reduce((sum: number, payment: any) => sum + payment.amount, 0);
    const remainingAmount = (order.total_amount || 0) - totalPaid;
    
    if (input.amount > remainingAmount) {
      throw new GraphQLError(`Payment amount exceeds remaining balance. Remaining: ${remainingAmount}`);
    }
    
    const payment = await context.prisma.payment.create({
      data: {
        orderId: input.orderId,
        payment_type: input.payment_type,
        amount: input.amount,
        details: input.details ? context.security.sanitizeString(input.details) : null
      },
      include: {
        order: true
      }
    });
    
    // Generate invoice and reduce stock if payment completes the order
    if (input.amount >= remainingAmount) {
      const invoiceNumber = `INV-${Date.now()}-${order.id.slice(-6)}`;
      
      // Use transaction to ensure data consistency
      await context.prisma.$transaction(async (tx: any) => {
        // Create invoice
        await tx.invoice.create({
          data: {
            orderId: input.orderId,
            paymentId: payment.id,
            invoice_number: invoiceNumber,
            total_amount: order.total_amount || 0,
            createdByUserId: context.userId,
            created_by_username: context.user?.username
          }
        });
        
        // Get order items to reduce stock
        const orderItems = await tx.orderItem.findMany({
          where: { orderId: input.orderId },
          include: { product: true }
        });
        
        // Reduce stock for each item
        for (const item of orderItems) {
          // Update product stock
          await tx.product.update({
            where: { id: item.productId },
            data: {
              stock_quantity: {
                decrement: item.quantity
              },
              updated_at: new Date()
            }
          });
          
          // Create stock record for the reduction
          await tx.stock.create({
            data: {
              productId: item.productId,
              quantity: item.quantity,
              quantity_in: 0,
              is_outofstock: false, // Will be updated based on new stock level
              reference_table: 'Order',
              reference_id: input.orderId,
              note: `Stock reduction for order ${input.orderId}`,
              createdByUserId: context.userId,
              created_by_username: context.user?.username,
              product_name: item.product.product_name,
              product_unit: item.product.unit,
              created_at: new Date()
            }
          });
        }
      });
    }
    
    await context.security.logSensitiveOperation(
      context.userId,
      'PROCESS_PAYMENT',
      'Payment',
      payment.id,
      { orderId: input.orderId, amount: input.amount, type: input.payment_type }, context.redisClient
    );
    
    return payment;
  },

  // Appointment Mutations
  async createAppointment(parent: any, args: any, context: any) {
    const { input } = args;
    context.security.requireStaff(context);
    
    await context.security.checkRateLimit(context.userId, 'mutation', context.redisClient);
    
    context.security.validateId(input.patientId);
    context.security.validateId(input.doctorId);
    
    // Validate that doctorId is actually a doctor
    const doctor = await context.prisma.user.findUnique({
      where: { id: input.doctorId },
      select: { role: true }
    });
    
    if (!doctor || doctor.role !== 'doctor') {
      throw new GraphQLError('Selected user is not a doctor');
    }
    
    // Check for conflicting appointments
    const conflictingAppointment = await context.prisma.appointment.findFirst({
      where: {
        doctorId: input.doctorId,
        appointment_time: input.appointment_time,
        status: { not: 'cancelled' }
      }
    });
    
    if (conflictingAppointment) {
      throw new GraphQLError('Doctor already has an appointment at this time');
    }
    
    const appointment = await context.prisma.appointment.create({
      data: {
        patientId: input.patientId,
        doctorId: input.doctorId,
        appointment_time: input.appointment_time,
        status: input.status || 'scheduled',
        reason: input.reason ? context.security.sanitizeString(input.reason) : null
      },
      include: {
        patient: {
          select: {
            first_name: true,
            last_name: true,
            phone: true
          }
        },
        doctor: {
          select: {
            username: true
          }
        }
      }
    });
    
    await context.security.logSensitiveOperation(
      context.userId,
      'CREATE_APPOINTMENT',
      'Appointment',
      appointment.id,
      { 
        patientId: input.patientId, 
        doctorId: input.doctorId, 
        time: input.appointment_time 
      }, context.redisClient
    );
    
    return appointment;
  },

  async updateAppointment(parent: any, args: any, context: any) {
    const { id, input } = args;
    context.security.requireStaff(context);
    context.security.validateId(id);
    
    await context.security.checkRateLimit(context.userId, 'mutation', context.redisClient);
    
    const updateData: any = {};
    
    if (input.appointment_time) updateData.appointment_time = input.appointment_time;
    if (input.status) updateData.status = input.status;
    if (input.reason) updateData.reason = context.security.sanitizeString(input.reason);
    
    // Check for conflicts if appointment time is being changed
    if (input.appointment_time) {
      const existing = await context.prisma.appointment.findUnique({
        where: { id },
        select: { doctorId: true }
      });
      
      if (existing) {
        const conflictingAppointment = await context.prisma.appointment.findFirst({
          where: {
            id: { not: id },
            doctorId: existing.doctorId,
            appointment_time: input.appointment_time,
            status: { not: 'cancelled' }
          }
        });
        
        if (conflictingAppointment) {
          throw new GraphQLError('Doctor already has an appointment at this time');
        }
      }
    }
    
    const appointment = await context.prisma.appointment.update({
      where: { id },
      data: updateData,
      include: {
        patient: {
          select: {
            first_name: true,
            last_name: true,
            phone: true
          }
        },
        doctor: {
          select: {
            username: true
          }
        }
      }
    });
    
    await context.security.logSensitiveOperation(
      context.userId,
      'UPDATE_APPOINTMENT',
      'Appointment',
      id,
      updateData, context.redisClient
    );
    
    return appointment;
  },

  // Medical Record Mutations
  async createMedicalRecord(parent: any, args: any, context: any) {
    const { input } = args;
    context.security.requireDoctor(context);
    
    await context.security.checkRateLimit(context.userId, 'mutation', context.redisClient);
    
    context.security.validateId(input.patientId);
    context.security.validateId(input.doctorId);
    
    // Doctors can only create records for themselves unless they're admin
    if (context.role !== 'admin' && input.doctorId !== context.userId) {
      throw new GraphQLError('Can only create medical records for yourself');
    }
    
    if (input.appointmentId) {
      context.security.validateId(input.appointmentId);
    }
    
    const medicalRecord = await context.prisma.medicalRecord.create({
      data: {
        patientId: input.patientId,
        doctorId: input.doctorId,
        appointmentId: input.appointmentId,
        symptoms: input.symptoms ? context.security.sanitizeString(input.symptoms) : null,
        diagnosis: input.diagnosis ? context.security.sanitizeString(input.diagnosis) : null,
        treatment: input.treatment ? context.security.sanitizeString(input.treatment) : null,
        notes: input.notes ? context.security.sanitizeString(input.notes) : null
      },
      include: {
        patient: {
          select: {
            first_name: true,
            last_name: true
          }
        },
        doctor: {
          select: {
            username: true
          }
        }
      }
    });
    
    await context.security.logSensitiveOperation(
      context.userId,
      'CREATE_MEDICAL_RECORD',
      'MedicalRecord',
      medicalRecord.id,
      { patientId: input.patientId, diagnosis: input.diagnosis }, context.redisClient
    );
    
    return medicalRecord;
  },

  async createPrescription(parent: any, args: any, context: any) {
    const { input } = args;
    context.security.requireDoctor(context);
    
    await context.security.checkRateLimit(context.userId, 'mutation', context.redisClient);
    
    context.security.validateId(input.medicalRecordId);
    context.security.validateId(input.productId);
    
    // Validate that the medical record belongs to the doctor
    const medicalRecord = await context.prisma.medicalRecord.findUnique({
      where: { id: input.medicalRecordId },
      select: { doctorId: true }
    });
    
    if (!medicalRecord) {
      throw new GraphQLError('Medical record not found');
    }
    
    if (context.role !== 'admin' && medicalRecord.doctorId !== context.userId) {
      throw new GraphQLError('Can only create prescriptions for your own medical records');
    }
    
    // Validate that the product exists and is a medicine
    const product = await context.prisma.product.findUnique({
      where: { id: input.productId },
      select: { product_name: true, status: true }
    });
    
    if (!product) {
      throw new GraphQLError('Product not found');
    }
    
    if (product.status !== 'active') {
      throw new GraphQLError('Cannot prescribe inactive product');
    }
    
    const prescription = await context.prisma.prescription.create({
      data: {
        medicalRecordId: input.medicalRecordId,
        productId: input.productId,
        dosage: input.dosage ? context.security.sanitizeString(input.dosage) : null,
        dosage_unit: input.dosage_unit ? context.security.sanitizeString(input.dosage_unit) : null,
        times_per_day: input.times_per_day,
        duration_days: input.duration_days,
        instructions: input.instructions ? context.security.sanitizeString(input.instructions) : null
      },
      include: {
        medicalRecord: {
          include: {
            patient: {
              select: {
                first_name: true,
                last_name: true
              }
            }
          }
        },
        product: {
          select: {
            product_name: true,
            dosage: true,
            dosage_unit: true
          }
        }
      }
    });
    
    await context.security.logSensitiveOperation(
      context.userId,
      'CREATE_PRESCRIPTION',
      'Prescription',
      prescription.id,
      { 
        product: product.product_name, 
        dosage: input.dosage,
        medicalRecordId: input.medicalRecordId 
      }, context.redisClient
    );
    
    return prescription;
  },

  async createTreatmentPlan(parent: any, args: any, context: any) {
    const { input } = args;
    context.security.requireDoctor(context);
    
    await context.security.checkRateLimit(context.userId, 'mutation', context.redisClient);
    
    context.security.validateId(input.patientId);
    context.security.validateId(input.doctorId);
    
    // Doctors can only create plans for themselves unless they're admin
    if (context.role !== 'admin' && input.doctorId !== context.userId) {
      throw new GraphQLError('Can only create treatment plans for yourself');
    }
    
    const treatmentPlan = await context.prisma.treatmentPlan.create({
      data: {
        patientId: input.patientId,
        doctorId: input.doctorId,
        plan_details: input.plan_details ? context.security.sanitizeString(input.plan_details) : null,
        start_date: input.start_date,
        end_date: input.end_date
      },
      include: {
        patient: {
          select: {
            first_name: true,
            last_name: true
          }
        },
        doctor: {
          select: {
            username: true
          }
        }
      }
    });
    
    await context.security.logSensitiveOperation(
      context.userId,
      'CREATE_TREATMENT_PLAN',
      'TreatmentPlan',
      treatmentPlan.id,
      { patientId: input.patientId }, context.redisClient
    );
    
    return treatmentPlan;
  },

  // Supplier & Purchase Mutations
  async createSupplier(parent: any, args: any, context: any) {
    const { input } = args;
    context.security.requireStaff(context);
    
    await context.security.checkRateLimit(context.userId, 'mutation', context.redisClient);
    
    const sanitizedInput = {
      name: context.security.sanitizeString(input.name),
      contact_name: input.contact_name ? context.security.sanitizeString(input.contact_name) : null,
      phone: input.phone ? context.security.sanitizeString(input.phone) : null,
      email: input.email ? context.security.sanitizeString(input.email).toLowerCase() : null,
      address: input.address ? context.security.sanitizeString(input.address) : null
    };
    
    // Validate email if provided
    if (sanitizedInput.email && !context.security.validateEmail(sanitizedInput.email)) {
      throw new GraphQLError('Invalid email format');
    }
    
    const supplier = await context.prisma.supplier.create({
      data: sanitizedInput
    });
    
    await context.security.logSensitiveOperation(
      context.userId,
      'CREATE_SUPPLIER',
      'Supplier',
      supplier.id,
      { name: supplier.name }, context.redisClient
    );
    
    return supplier;
  },

  async createPurchase(parent: any, args: any, context: any) {
    const { input } = args;
    context.security.requireStaff(context);
    
    await context.security.checkRateLimit(context.userId, 'mutation', context.redisClient);
    
    context.security.validateId(input.supplierId);
    
    if (!input.purchaseItems || input.purchaseItems.length === 0) {
      throw new GraphQLError('Purchase must have at least one item');
    }
    
    // Use database transaction for purchase creation
    const purchase = await context.prisma.$transaction(async (tx: PrismaClient) => {
      // Create the purchase
      const newPurchase = await tx.purchase.create({
        data: {
          supplierId: input.supplierId,
          userId: context.userId,
          total_amount: input.total_amount,
          status: input.status || 'received'
        }
      });
      
      // Create purchase items and update stock if status is 'received'
      for (const item of input.purchaseItems) {
        await tx.purchaseItem.create({
          data: {
            purchaseId: newPurchase.id,
            productId: item.productId,
            quantity: item.quantity,
            unit_cost: item.unit_cost,
            total_cost: item.total_cost
          }
        });
        
        // Update stock if purchase is received
        if (newPurchase.status === 'received') {
          await tx.product.update({
            where: { id: item.productId },
            data: {
              stock_quantity: {
                increment: item.quantity
              }
            }
          });
          
          // Get product details for stock record
          const product = await tx.product.findUnique({
            where: { id: item.productId },
            select: { product_name: true, unit: true }
          });
          
          // Create stock record
          await tx.stock.create({
            data: {
              productId: item.productId,
              quantity: item.quantity,
              quantity_in: item.quantity,
              is_outofstock: false,
              production_date: item.production_date || null,
              expiration_date: item.expiration_date || null,
              reference_table: 'Purchase',
              reference_id: newPurchase.id,
              note: `Purchase from supplier - ${newPurchase.id}`,
              createdByUserId: context.userId,
              created_by_username: context.user?.username,
              product_name: product?.product_name,
              product_unit: product?.unit,
              created_at: new Date()
            }
          });
        }
      }
      
      return newPurchase;
    });
    
    // Return purchase with full details
    const fullPurchase = await context.prisma.purchase.findUnique({
      where: { id: purchase.id },
      include: {
        supplier: {
          select: { name: true }
        },
        user: {
          select: { username: true }
        },
        purchaseItems: {
          include: {
            product: {
              select: { product_name: true }
            }
          }
        }
      }
    });
    
    await context.security.logSensitiveOperation(
      context.userId,
      'CREATE_PURCHASE',
      'Purchase',
      purchase.id,
      { supplierId: input.supplierId, total: input.total_amount }, context.redisClient
    );
    
    return fullPurchase;
  },

  // Stock Management
  async acknowledgeStockAlert(parent: any, args: any, context: any) {
    const { id } = args;
    context.security.requireStaff(context);
    context.security.validateId(id);
    
    const stockAlert = await context.prisma.stockAlert.update({
      where: { id },
      data: {
        acknowledged: true,
        acknowledged_at: new Date()
      },
      include: {
        product: {
          select: {
            product_name: true
          }
        }
      }
    });
    
    await context.security.logSensitiveOperation(
      context.userId,
      'ACKNOWLEDGE_STOCK_ALERT',
      'StockAlert',
      id, context.redisClient
    );
    
    return stockAlert;
  },

  async generateDailyReport(parent: any, args: any, context: any) {
    const { date } = args;
    context.security.requireStaff(context);
    
    await context.security.checkRateLimit(context.userId, 'mutation', context.redisClient);
    
    const reportDate = new Date(date);
    const nextDay = new Date(reportDate);
    nextDay.setDate(nextDay.getDate() + 1);
    
    // Check if report already exists for this date
    const existingReport = await context.prisma.dailyReport.findFirst({
      where: {
        report_date: {
          gte: reportDate,
          lt: nextDay
        }
      }
    });
    
    if (existingReport) {
      throw new GraphQLError('Daily report already exists for this date');
    }
    
    // Calculate metrics for the day
    const [orders, totalSales, patientCount] = await Promise.all([
      context.prisma.order.count({
        where: {
          order_date: {
            gte: reportDate,
            lt: nextDay
          }
        }
      }),
      context.prisma.order.aggregate({
        where: {
          order_date: {
            gte: reportDate,
            lt: nextDay
          }
        },
        _sum: {
          total_amount: true
        }
      }),
      context.prisma.patient.count({
        where: {
          created_at: {
            gte: reportDate,
            lt: nextDay
          }
        }
      })
    ]);
    
    const dailyReport = await context.prisma.dailyReport.create({
      data: {
        report_date: reportDate,
        total_sales: totalSales._sum.total_amount || 0,
        total_orders: orders,
        total_patients: patientCount,
        createdByUserId: context.userId,
        created_by_username: context.user?.username
      }
    });
    
    await context.security.logSensitiveOperation(
      context.userId,
      'GENERATE_DAILY_REPORT',
      'DailyReport',
      dailyReport.id,
      { date: reportDate }, context.redisClient
    );
    
    return dailyReport;
  },

  async generateSalesReports(parent: any, args: any, context: any) {
    const { date } = args;
    context.security.requireStaff(context);
    
    await context.security.checkRateLimit(context.userId, 'mutation', context.redisClient);
    
    const reportService = new ReportService(context.prisma);
    const reportDate = new Date(date);
    
    try {
      const salesReports = await reportService.generateSalesReports(
        reportDate,
        context.userId,
        context.user?.username
      );
      
      await context.security.logSensitiveOperation(
        context.userId,
        'GENERATE_SALES_REPORTS',
        'SalesReport',
        null,
        { date: reportDate, count: salesReports.length },
        context.redisClient
      );
      
      return {
        success: true,
        message: `Generated ${salesReports.length} sales reports for ${reportDate.toDateString()}`,
        reports: salesReports,
        count: salesReports.length
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      throw new GraphQLError(`Failed to generate sales reports: ${errorMessage}`);
    }
  },

  async generateStockAlerts(parent: any, args: any, context: any) {
    context.security.requireStaff(context);
    
    await context.security.checkRateLimit(context.userId, 'mutation', context.redisClient);
    
    const reportService = new ReportService(context.prisma);
    
    try {
      const stockAlerts = await reportService.generateStockAlerts(
        context.userId,
        context.user?.username
      );
      
      await context.security.logSensitiveOperation(
        context.userId,
        'GENERATE_STOCK_ALERTS',
        'StockAlert',
        null,
        { count: stockAlerts.length },
        context.redisClient
      );
      
      return {
        success: true,
        message: `Generated ${stockAlerts.length} stock alerts`,
        alerts: stockAlerts,
        count: stockAlerts.length
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      throw new GraphQLError(`Failed to generate stock alerts: ${errorMessage}`);
    }
  },

  async generateComprehensiveDailyReport(parent: any, args: any, context: any) {
    const { date } = args;
    context.security.requireStaff(context);
    
    await context.security.checkRateLimit(context.userId, 'mutation', context.redisClient);
    
    const reportService = new ReportService(context.prisma);
    const reportDate = new Date(date);
    
    try {
      const comprehensiveReport = await reportService.generateComprehensiveDailyReport(
        reportDate,
        context.userId,
        context.user?.username
      );
      
      await context.security.logSensitiveOperation(
        context.userId,
        'GENERATE_COMPREHENSIVE_REPORT',
        'DailyReport',
        comprehensiveReport.dailyReport.id,
        { 
          date: reportDate,
          salesReports: comprehensiveReport.salesReports.length,
          stockAlerts: comprehensiveReport.stockAlerts.length
        },
        context.redisClient
      );
      
      return comprehensiveReport;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      throw new GraphQLError(`Failed to generate comprehensive daily report: ${errorMessage}`);
    }
  },

  // Missing resolvers
  async receivePurchase(parent: any, args: any, context: any) {
    const { id } = args;
    context.security.requireStaff(context);
    context.security.validateId(id);
    
    const purchase = await context.prisma.purchase.update({
      where: { id },
      data: { status: 'received' }
    });
    
    return purchase;
  },

  async updateMedicalRecord(parent: any, args: any, context: any) {
    const { id, input } = args;
    context.security.requireDoctor(context);
    context.security.validateId(id);
    
    const updateData: any = {};
    if (input.symptoms) updateData.symptoms = context.security.sanitizeString(input.symptoms);
    if (input.diagnosis) updateData.diagnosis = context.security.sanitizeString(input.diagnosis);
    if (input.treatment) updateData.treatment = context.security.sanitizeString(input.treatment);
    if (input.notes) updateData.notes = context.security.sanitizeString(input.notes);
    
    const record = await context.prisma.medicalRecord.update({
      where: { id },
      data: updateData
    });
    
    return record;
  },

  async deletePrescription(parent: any, args: any, context: any) {
    const { id } = args;
    context.security.requireDoctor(context);
    context.security.validateId(id);
    
    await context.prisma.prescription.delete({
      where: { id }
    });
    
    return true;
  },

  async updateTreatmentPlan(parent: any, args: any, context: any) {
    const { id, input } = args;
    context.security.requireDoctor(context);
    context.security.validateId(id);
    
    const updateData: any = {};
    if (input.plan_details) updateData.plan_details = context.security.sanitizeString(input.plan_details);
    if (input.start_date) updateData.start_date = input.start_date;
    if (input.end_date) updateData.end_date = input.end_date;
    
    const plan = await context.prisma.treatmentPlan.update({
      where: { id },
      data: updateData
    });
    
    return plan;
  },

  async deleteTreatmentPlan(parent: any, args: any, context: any) {
    const { id } = args;
    context.security.requireDoctor(context);
    context.security.validateId(id);
    
    await context.prisma.treatmentPlan.delete({
      where: { id }
    });
    
    return true;
  }
}; 