import { queries } from './queries';
import { medicalQueries } from './medicalQueries';
import { mutations } from './mutations';
import { medicalMutations } from './medicalMutations';
import { productMutations } from './productMutations';
import { clinicQueries } from './clinicQueries';
import { clinicMutations } from './clinicMutations';
import { notificationQueries } from './notificationQueries';
import { customScalars } from '../security';

// Relationship resolvers for nested fields
const relationshipResolvers = {
  User: {
    async medicalRecords(parent: any, args: any, context: any) {
      return context.prisma.medicalRecord.findMany({
        where: { doctorId: parent.id },
        orderBy: { created_at: 'desc' }
      });
    },
    async appointments(parent: any, args: any, context: any) {
      return context.prisma.appointment.findMany({
        where: { doctorId: parent.id },
        orderBy: { appointment_time: 'desc' }
      });
    },
    async purchases(parent: any, args: any, context: any) {
      return context.prisma.purchase.findMany({
        where: { userId: parent.id },
        orderBy: { created_at: 'desc' }
      });
    },
    async orders(parent: any, args: any, context: any) {
      return context.prisma.order.findMany({
        where: { userId: parent.id },
        orderBy: { created_at: 'desc' }
      });
    },
    async treatmentPlans(parent: any, args: any, context: any) {
      return context.prisma.treatmentPlan.findMany({
        where: { doctorId: parent.id },
        orderBy: { created_at: 'desc' }
      });
    }
  },

  Patient: {
    async appointments(parent: any, args: any, context: any) {
      return context.prisma.appointment.findMany({
        where: { patientId: parent.id },
        orderBy: { appointment_time: 'desc' }
      });
    },
    async medicalRecords(parent: any, args: any, context: any) {
      return context.prisma.medicalRecord.findMany({
        where: { patientId: parent.id },
        orderBy: { created_at: 'desc' }
      });
    },
    async orders(parent: any, args: any, context: any) {
      return context.prisma.order.findMany({
        where: { patientId: parent.id },
        orderBy: { created_at: 'desc' }
      });
    },
    async treatmentPlans(parent: any, args: any, context: any) {
      return context.prisma.treatmentPlan.findMany({
        where: { patientId: parent.id },
        orderBy: { created_at: 'desc' }
      });
    },
    async visits(parent: any, args: any, context: any) {
      return context.prisma.visit.findMany({
        where: { patientId: parent.id },
        orderBy: { visit_date: 'desc' }
      });
    },
    async queueTickets(parent: any, args: any, context: any) {
      return context.prisma.queueTicket.findMany({
        where: { patientId: parent.id },
        orderBy: { created_at: 'desc' }
      });
    }
  },

  Product: {
    async category(parent: any, args: any, context: any) {
      if (!parent.categoryId) return null;
      return context.prisma.category.findUnique({
        where: { 
          id: parent.categoryId,
          isDelete: false
        }
      });
    },
    async orderItems(parent: any, args: any, context: any) {
      return context.prisma.orderItem.findMany({
        where: { productId: parent.id },
        include: { order: true }
      });
    },
    async purchaseItems(parent: any, args: any, context: any) {
      return context.prisma.purchaseItem.findMany({
        where: { productId: parent.id },
        include: { purchase: true }
      });
    },
    async prescriptions(parent: any, args: any, context: any) {
      return context.prisma.prescription.findMany({
        where: { productId: parent.id },
        include: { medicalRecord: true }
      });
    },
    async stocks(parent: any, args: any, context: any) {
      return context.prisma.stock.findMany({
        where: { productId: parent.id },
        orderBy: { created_at: 'desc' },
        take: 50 // Limit to recent stocks
      });
    },
    async salesReports(parent: any, args: any, context: any) {
      return context.prisma.salesReport.findMany({
        where: { productId: parent.id },
        orderBy: { report_date: 'desc' }
      });
    },
    async stockAlerts(parent: any, args: any, context: any) {
      return context.prisma.stockAlert.findMany({
        where: { productId: parent.id },
        orderBy: { created_at: 'desc' }
      });
    }
  },

  Order: {
    async user(parent: any, args: any, context: any) {
      if (!parent.userId) return null;
      return context.prisma.user.findUnique({
        where: { id: parent.userId },
        select: {
          id: true,
          username: true,
          email: true,
          role: true
        }
      });
    },
    async patient(parent: any, args: any, context: any) {
      if (!parent.patientId) return null;
      return context.prisma.patient.findUnique({
        where: { id: parent.patientId }
      });
    },
    async orderItems(parent: any, args: any, context: any) {
      return context.prisma.orderItem.findMany({
        where: { orderId: parent.id },
        include: { product: true }
      });
    },
    async payments(parent: any, args: any, context: any) {
      return context.prisma.payment.findMany({
        where: { orderId: parent.id },
        orderBy: { payment_date: 'desc' }
      });
    },
    async invoice(parent: any, args: any, context: any) {
      return context.prisma.invoice.findUnique({
        where: { orderId: parent.id }
      });
    },
    async visitOrders(parent: any, args: any, context: any) {
      return context.prisma.visitOrder.findMany({
        where: { orderId: parent.id },
        include: { visit: true }
      });
    }
  },

  OrderItem: {
    async order(parent: any, args: any, context: any) {
      return context.prisma.order.findUnique({
        where: { id: parent.orderId }
      });
    },
    async product(parent: any, args: any, context: any) {
      return context.prisma.product.findUnique({
        where: { id: parent.productId }
      });
    }
  },

  Payment: {
    async order(parent: any, args: any, context: any) {
      return context.prisma.order.findUnique({
        where: { id: parent.orderId }
      });
    },
    async invoice(parent: any, args: any, context: any) {
      return context.prisma.invoice.findUnique({
        where: { paymentId: parent.id }
      });
    }
  },

  Invoice: {
    async order(parent: any, args: any, context: any) {
      return context.prisma.order.findUnique({
        where: { id: parent.orderId }
      });
    },
    async payment(parent: any, args: any, context: any) {
      if (!parent.paymentId) return null;
      return context.prisma.payment.findUnique({
        where: { id: parent.paymentId }
      });
    }
  },

  Supplier: {
    async purchases(parent: any, args: any, context: any) {
      return context.prisma.purchase.findMany({
        where: { supplierId: parent.id },
        orderBy: { created_at: 'desc' }
      });
    }
  },

  Purchase: {
    async supplier(parent: any, args: any, context: any) {
      return context.prisma.supplier.findUnique({
        where: { id: parent.supplierId }
      });
    },
    async user(parent: any, args: any, context: any) {
      if (!parent.userId) return null;
      return context.prisma.user.findUnique({
        where: { id: parent.userId },
        select: {
          id: true,
          username: true,
          email: true
        }
      });
    },
    async purchaseItems(parent: any, args: any, context: any) {
      return context.prisma.purchaseItem.findMany({
        where: { purchaseId: parent.id },
        include: { product: true }
      });
    }
  },

  PurchaseItem: {
    async purchase(parent: any, args: any, context: any) {
      return context.prisma.purchase.findUnique({
        where: { id: parent.purchaseId }
      });
    },
    async product(parent: any, args: any, context: any) {
      return context.prisma.product.findUnique({
        where: { id: parent.productId }
      });
    }
  },

  Stock: {
    async product(parent: any, args: any, context: any) {
      return context.prisma.product.findUnique({
        where: { id: parent.productId }
      });
    }
  },

  StockAlert: {
    async product(parent: any, args: any, context: any) {
      return context.prisma.product.findUnique({
        where: { id: parent.productId }
      });
    }
  },

  Appointment: {
    async patient(parent: any, args: any, context: any) {
      return context.prisma.patient.findUnique({
        where: { id: parent.patientId }
      });
    },
    async doctor(parent: any, args: any, context: any) {
      return context.prisma.user.findUnique({
        where: { id: parent.doctorId },
        select: {
          id: true,
          username: true,
          email: true,
          role: true
        }
      });
    },
    async medicalRecords(parent: any, args: any, context: any) {
      return context.prisma.medicalRecord.findMany({
        where: { appointmentId: parent.id },
        orderBy: { created_at: 'desc' }
      });
    },
    async visits(parent: any, args: any, context: any) {
      return context.prisma.visit.findMany({
        where: { appointmentId: parent.id },
        orderBy: { visit_date: 'desc' }
      });
    }
  },

  MedicalRecord: {
    async patient(parent: any, args: any, context: any) {
      return context.prisma.patient.findUnique({
        where: { id: parent.patientId }
      });
    },
    async doctor(parent: any, args: any, context: any) {
      return context.prisma.user.findUnique({
        where: { id: parent.doctorId },
        select: {
          id: true,
          username: true,
          email: true,
          role: true
        }
      });
    },
    async appointment(parent: any, args: any, context: any) {
      if (!parent.appointmentId) return null;
      return context.prisma.appointment.findUnique({
        where: { id: parent.appointmentId }
      });
    },
    async prescriptions(parent: any, args: any, context: any) {
      return context.prisma.prescription.findMany({
        where: { medicalRecordId: parent.id },
        include: { product: true }
      });
    }
  },

  Prescription: {
    async medicalRecord(parent: any, args: any, context: any) {
      return context.prisma.medicalRecord.findUnique({
        where: { id: parent.medicalRecordId }
      });
    },
    async product(parent: any, args: any, context: any) {
      return context.prisma.product.findUnique({
        where: { id: parent.productId }
      });
    }
  },

  TreatmentPlan: {
    async patient(parent: any, args: any, context: any) {
      return context.prisma.patient.findUnique({
        where: { id: parent.patientId }
      });
    },
    async doctor(parent: any, args: any, context: any) {
      return context.prisma.user.findUnique({
        where: { id: parent.doctorId },
        select: {
          id: true,
          username: true,
          email: true,
          role: true
        }
      });
    }
  },

  SalesReport: {
    async product(parent: any, args: any, context: any) {
      return context.prisma.product.findUnique({
        where: { id: parent.productId }
      });
    }
  },

  // Clinic System Resolvers
  Visit: {
    async patient(parent: any, args: any, context: any) {
      return context.prisma.patient.findUnique({
        where: { id: parent.patientId }
      });
    },
    async appointment(parent: any, args: any, context: any) {
      if (!parent.appointmentId) return null;
      return context.prisma.appointment.findUnique({
        where: { id: parent.appointmentId }
      });
    },
    async vitals(parent: any, args: any, context: any) {
      return context.prisma.vitals.findUnique({
        where: { visitId: parent.id }
      });
    },
    async queueTickets(parent: any, args: any, context: any) {
      return context.prisma.queueTicket.findMany({
        where: { visitId: parent.id },
        orderBy: { created_at: 'desc' }
      });
    },
    async visitOrders(parent: any, args: any, context: any) {
      return context.prisma.visitOrder.findMany({
        where: { visitId: parent.id },
        include: { order: true }
      });
    }
  },

  Vitals: {
    async visit(parent: any, args: any, context: any) {
      return context.prisma.visit.findUnique({
        where: { id: parent.visitId }
      });
    }
  },

  QueueTicket: {
    async visit(parent: any, args: any, context: any) {
      if (!parent.visitId) {
        return null;
      }
      return context.prisma.visit.findUnique({
        where: { id: parent.visitId }
      });
    },
    async patient(parent: any, args: any, context: any) {
      return context.prisma.patient.findUnique({
        where: { id: parent.patientId }
      });
    },
    async events(parent: any, args: any, context: any) {
      return context.prisma.queueEvent.findMany({
        where: { ticketId: parent.id },
        orderBy: { at: 'desc' }
      });
    }
  },

  QueueEvent: {
    async ticket(parent: any, args: any, context: any) {
      return context.prisma.queueTicket.findUnique({
        where: { id: parent.ticketId }
      });
    }
  },

  VisitOrder: {
    async visit(parent: any, args: any, context: any) {
      return context.prisma.visit.findUnique({
        where: { id: parent.visitId }
      });
    },
    async order(parent: any, args: any, context: any) {
      return context.prisma.order.findUnique({
        where: { id: parent.orderId }
      });
    }
  }
};

// Additional mutations for delete operations and missing CRUD
const additionalMutations = {
  // Delete operations
  async deleteProduct(parent: any, args: any, context: any) {
    const { id } = args;
    context.security.requireAdmin(context);
    context.security.validateId(id);
    
    await context.security.checkRateLimit(context.userId, 'sensitive', context.redisClient);
    
    // Check if product exists and is not already deleted
    const product = await context.prisma.product.findFirst({
      where: { 
        id,
        isDelete: false
      }
    });
    
    if (!product) {
      throw new Error('Product not found or already deleted');
    }
    
    // Soft delete: Update isDelete to true
    await context.prisma.product.update({
      where: { id },
      data: { 
        isDelete: true,
        updated_at: new Date()
      }
    });
    
    await context.security.logSensitiveOperation(
      context.userId,
      'SOFT_DELETE_PRODUCT',
      'Product',
      id, context.redisClient
    );
    
    return true;
  },

  async updateOrder(parent: any, args: any, context: any) {
    const { id, input } = args;
    context.security.requireStaff(context);
    context.security.validateId(id);
    
    const updateData: any = {};
    if (input.patientId) updateData.patientId = input.patientId;
    if (input.status) updateData.status = input.status;
    if (input.total_amount !== undefined) updateData.total_amount = input.total_amount;
    if (input.is_walkin !== undefined) updateData.is_walkin = input.is_walkin;
    
    const order = await context.prisma.order.update({
      where: { id },
      data: updateData,
      include: {
        patient: true,
        user: { select: { id: true, username: true } },
        orderItems: { include: { product: true } },
        payments: true
      }
    });
    
    await context.security.logSensitiveOperation(
      context.userId,
      'UPDATE_ORDER',
      'Order',
      id,
      updateData, context.redisClient
    );
    
    return order;
  },

  async deleteOrder(parent: any, args: any, context: any) {
    const { id } = args;
    context.security.requireAdmin(context);
    context.security.validateId(id);
    
    await context.security.checkRateLimit(context.userId, 'sensitive', context.redisClient);
    
    // Check if order has payments
    const order = await context.prisma.order.findUnique({
      where: { id },
      include: { _count: { select: { payments: true } } }
    });
    
    if (!order) {
      throw new Error('Order not found');
    }
    
    if (order._count.payments > 0) {
      throw new Error('Cannot delete order with payments');
    }
    
    await context.prisma.order.delete({
      where: { id }
    });
    
    await context.security.logSensitiveOperation(
      context.userId,
      'DELETE_ORDER',
      'Order',
      id, context.redisClient
    );
    
    return true;
  },

  // Additional CRUD operations for other entities
  async updateSupplier(parent: any, args: any, context: any) {
    const { id, input } = args;
    context.security.requireStaff(context);
    context.security.validateId(id);
    
    const updateData: any = {};
    if (input.name) updateData.name = context.security.sanitizeString(input.name);
    if (input.contact_name) updateData.contact_name = context.security.sanitizeString(input.contact_name);
    if (input.phone) updateData.phone = context.security.sanitizeString(input.phone);
    if (input.email) {
      if (!context.security.validateEmail(input.email)) {
        throw new Error('Invalid email format');
      }
      updateData.email = context.security.sanitizeString(input.email).toLowerCase();
    }
    if (input.address) updateData.address = context.security.sanitizeString(input.address);
    
    const supplier = await context.prisma.supplier.update({
      where: { id },
      data: updateData
    });
    
    return supplier;
  },

  async deleteSupplier(parent: any, args: any, context: any) {
    const { id } = args;
    context.security.requireAdmin(context);
    context.security.validateId(id);
    
    const dependencies = await context.prisma.supplier.findUnique({
      where: { id },
      include: { _count: { select: { purchases: true } } }
    });
    
    if (!dependencies) {
      throw new Error('Supplier not found');
    }
    
    if (dependencies._count.purchases > 0) {
      throw new Error('Cannot delete supplier with existing purchases');
    }
    
    await context.prisma.supplier.delete({
      where: { id }
    });
    
    return true;
  },

  async deleteAppointment(parent: any, args: any, context: any) {
    const { id } = args;
    context.security.requireStaff(context);
    context.security.validateId(id);
    
    const appointment = await context.prisma.appointment.findUnique({
      where: { id },
      include: { _count: { select: { medicalRecords: true } } }
    });
    
    if (!appointment) {
      throw new Error('Appointment not found');
    }
    
    if (appointment._count.medicalRecords > 0) {
      throw new Error('Cannot delete appointment with medical records. Cancel it instead.');
    }
    
    await context.prisma.appointment.delete({
      where: { id }
    });
    
    return true;
  },

  async deleteMedicalRecord(parent: any, args: any, context: any) {
    const { id } = args;
    context.security.requireDoctor(context);
    context.security.validateId(id);
    
    const record = await context.prisma.medicalRecord.findUnique({
      where: { id },
      select: { doctorId: true },
      include: { _count: { select: { prescriptions: true } } }
    });
    
    if (!record) {
      throw new Error('Medical record not found');
    }
    
    if (context.role !== 'admin' && record.doctorId !== context.userId) {
      throw new Error('Can only delete your own medical records');
    }
    
    if (record._count.prescriptions > 0) {
      throw new Error('Cannot delete medical record with prescriptions');
    }
    
    await context.prisma.medicalRecord.delete({
      where: { id }
    });
    
    return true;
  }
};

// Combine all resolvers
export const resolvers = {
  // Custom scalars
  ...customScalars,
  
  // Root resolvers
  Query: {
    ...queries,
    ...medicalQueries,
    ...clinicQueries,
    ...notificationQueries
  },
  
  Mutation: {
    ...mutations,
    ...medicalMutations,
    ...productMutations,
    ...clinicMutations,
    ...additionalMutations
  },
  
  // Relationship resolvers
  ...relationshipResolvers
}; 