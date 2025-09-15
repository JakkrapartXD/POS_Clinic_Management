import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'bun:test';
import { PrismaClient } from '@prisma/client';
import { ClinicService } from '../src/services/ClinicService';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.TEST_DATABASE_URL || process.env.DATABASE_URL
    }
  }
});

const clinicService = new ClinicService(prisma);

// Test data
let testPatient: any;
let testAppointment: any;
let testVisit: any;
let testProduct: any;
let testOrder: any;

describe('Clinic System', () => {
  beforeAll(async () => {
    // Create test patient
    testPatient = await prisma.patient.create({
      data: {
        first_name: 'Test',
        last_name: 'Patient',
        national_id: '1234567890123',
        phone: '0123456789',
        email: 'test@example.com'
      }
    });

    // Create test doctor
    const testDoctor = await prisma.user.create({
      data: {
        username: 'testdoctor',
        email: 'doctor@test.com',
        password_hash: 'hashedpassword',
        role: 'doctor'
      }
    });

    // Create test appointment
    testAppointment = await prisma.appointment.create({
      data: {
        patientId: testPatient.id,
        doctorId: testDoctor.id,
        appointment_time: new Date(),
        reason: 'Test appointment'
      }
    });

    // Create test service product
    testProduct = await prisma.product.create({
      data: {
        product_name: 'Test Service',
        product_type: 'service',
        sku: 'TEST001',
        sale_price: 200.0,
        stock_quantity: 999999
      }
    });
  });

  afterAll(async () => {
    // Clean up test data
    await prisma.visitOrder.deleteMany({ where: { visitId: testVisit?.id } });
    await prisma.queueEvent.deleteMany({});
    await prisma.queueTicket.deleteMany({});
    await prisma.vitals.deleteMany({});
    await prisma.visit.deleteMany({ where: { patientId: testPatient.id } });
    await prisma.orderItem.deleteMany({ where: { orderId: testOrder?.id } });
    await prisma.order.deleteMany({ where: { patientId: testPatient.id } });
    await prisma.appointment.deleteMany({ where: { patientId: testPatient.id } });
    await prisma.patient.delete({ where: { id: testPatient.id } });
    await prisma.user.deleteMany({ where: { username: 'testdoctor' } });
    await prisma.product.delete({ where: { id: testProduct.id } });
    
    await prisma.$disconnect();
  });

  describe('Visit Management', () => {
    it('should create a new visit', async () => {
      const visitData = {
        patientId: testPatient.id,
        appointmentId: testAppointment.id,
        chief_complaint: 'Test complaint',
        diagnosis: 'Test diagnosis',
        notes: 'Test notes'
      };

      const visit = await clinicService.createVisit(visitData);
      testVisit = visit;

      expect(visit).toBeDefined();
      expect(visit.patientId).toBe(testPatient.id);
      expect(visit.appointmentId).toBe(testAppointment.id);
      expect(visit.chief_complaint).toBe('Test complaint');
      expect(visit.status).toBe('open');
      expect(visit.patient).toBeDefined();
      expect(visit.patient.first_name).toBe('Test');
    });

    it('should update visit details', async () => {
      const updateData = {
        status: 'doctor' as any,
        diagnosis: 'Updated diagnosis',
        notes: 'Updated notes'
      };

      const updatedVisit = await clinicService.updateVisit(testVisit.id, updateData);

      expect(updatedVisit.status).toBe('doctor');
      expect(updatedVisit.diagnosis).toBe('Updated diagnosis');
      expect(updatedVisit.notes).toBe('Updated notes');
    });

    it('should get visit by ID', async () => {
      const visit = await clinicService.getVisitById(testVisit.id);

      expect(visit).toBeDefined();
      expect(visit.id).toBe(testVisit.id);
      expect(visit.patient).toBeDefined();
      expect(visit.appointment).toBeDefined();
    });

    it('should get patient visits', async () => {
      const visits = await clinicService.getPatientVisits(testPatient.id);

      expect(Array.isArray(visits)).toBe(true);
      expect(visits.length).toBeGreaterThan(0);
      expect(visits[0].patientId).toBe(testPatient.id);
    });

    it('should throw error for non-existent patient', async () => {
      const visitData = {
        patientId: 'non-existent-id',
        chief_complaint: 'Test complaint'
      };

      await expect(clinicService.createVisit(visitData)).rejects.toThrow('Patient not found');
    });
  });

  describe('Vitals Management', () => {
    it('should upsert vitals for a visit', async () => {
      const vitalsData = {
        visitId: testVisit.id,
        heightCm: 170,
        weightKg: 70,
        tempC: 36.5,
        sbp: 120,
        dbp: 80,
        hr: 72,
        rr: 20,
        spo2: 98
      };

      const vitals = await clinicService.upsertVitals(vitalsData);

      expect(vitals).toBeDefined();
      expect(vitals.visitId).toBe(testVisit.id);
      expect(vitals.heightCm).toBe(170);
      expect(vitals.weightKg).toBe(70);
      expect(vitals.bmi).toBeCloseTo(24.22, 2);
    });

    it('should update existing vitals', async () => {
      const updatedVitalsData = {
        visitId: testVisit.id,
        heightCm: 175,
        weightKg: 75,
        tempC: 37.0
      };

      const vitals = await clinicService.upsertVitals(updatedVitalsData);

      expect(vitals.heightCm).toBe(175);
      expect(vitals.weightKg).toBe(75);
      expect(vitals.tempC).toBe(37.0);
      expect(vitals.bmi).toBeCloseTo(24.49, 2);
    });

    it('should throw error for non-existent visit', async () => {
      const vitalsData = {
        visitId: 'non-existent-id',
        heightCm: 170
      };

      await expect(clinicService.upsertVitals(vitalsData)).rejects.toThrow('Visit not found');
    });
  });

  describe('Queue Management', () => {
    let testQueueTicket: any;

    it('should create a queue ticket', async () => {
      const queueData = {
        visitId: testVisit.id,
        station: 'doctor' as any,
        priority: 0
      };

      const queueTicket = await clinicService.createQueueTicket(queueData);
      testQueueTicket = queueTicket;

      expect(queueTicket).toBeDefined();
      expect(queueTicket.visitId).toBe(testVisit.id);
      expect(queueTicket.patientId).toBe(testPatient.id);
      expect(queueTicket.station).toBe('doctor');
      expect(queueTicket.status).toBe('waiting');
      expect(queueTicket.number).toBeGreaterThan(0);
    });

    it('should update queue ticket status', async () => {
      const updatedTicket = await clinicService.updateQueueStatus(
        testQueueTicket.id,
        'called' as any,
        'test-user-id',
        'Test note'
      );

      expect(updatedTicket.status).toBe('called');
      expect(updatedTicket.called_at).toBeDefined();
    });

    it('should get queue tickets', async () => {
      const tickets = await clinicService.getQueueTickets({
        station: 'doctor' as any
      });

      expect(Array.isArray(tickets)).toBe(true);
      expect(tickets.length).toBeGreaterThan(0);
      expect(tickets[0].station).toBe('doctor');
    });

    it('should prevent duplicate active queue tickets', async () => {
      const queueData = {
        visitId: testVisit.id,
        station: 'doctor' as any
      };

      await expect(clinicService.createQueueTicket(queueData))
        .rejects.toThrow('Active queue ticket already exists');
    });

    it('should get next queue number', async () => {
      const nextNumber = await clinicService.getNextQueueNumber('pharmacy' as any);
      expect(typeof nextNumber).toBe('number');
      expect(nextNumber).toBeGreaterThan(0);
    });

    it('should get queue statistics', async () => {
      const stats = await clinicService.getQueueStats('doctor' as any);
      expect(Array.isArray(stats)).toBe(true);
    });
  });

  describe('Order Integration', () => {
    beforeEach(async () => {
      // Create test order
      testOrder = await prisma.order.create({
        data: {
          patientId: testPatient.id,
          total_amount: 200.0,
          status: 'completed'
        }
      });

      // Create order item
      await prisma.orderItem.create({
        data: {
          orderId: testOrder.id,
          productId: testProduct.id,
          quantity: 1,
          unit_price: 200.0,
          total_price: 200.0,
          product_name: testProduct.product_name
        }
      });
    });

    it('should link order to visit', async () => {
      const linkData = {
        visitId: testVisit.id,
        orderId: testOrder.id
      };

      const visitOrder = await clinicService.linkOrderToVisit(linkData);

      expect(visitOrder).toBeDefined();
      expect(visitOrder.visitId).toBe(testVisit.id);
      expect(visitOrder.orderId).toBe(testOrder.id);
      expect(visitOrder.visit).toBeDefined();
      expect(visitOrder.order).toBeDefined();
    });

    it('should prevent duplicate order links', async () => {
      const linkData = {
        visitId: testVisit.id,
        orderId: testOrder.id
      };

      await expect(clinicService.linkOrderToVisit(linkData))
        .rejects.toThrow('Order is already linked to this visit');
    });

    it('should validate order belongs to same patient', async () => {
      // Create order for different patient
      const otherPatient = await prisma.patient.create({
        data: {
          first_name: 'Other',
          last_name: 'Patient'
        }
      });

      const otherOrder = await prisma.order.create({
        data: {
          patientId: otherPatient.id,
          total_amount: 100.0
        }
      });

      const linkData = {
        visitId: testVisit.id,
        orderId: otherOrder.id
      };

      await expect(clinicService.linkOrderToVisit(linkData))
        .rejects.toThrow('Order does not belong to the same patient');

      // Clean up
      await prisma.order.delete({ where: { id: otherOrder.id } });
      await prisma.patient.delete({ where: { id: otherPatient.id } });
    });

    it('should throw error for non-existent order', async () => {
      const linkData = {
        visitId: testVisit.id,
        orderId: 'non-existent-order-id'
      };

      await expect(clinicService.linkOrderToVisit(linkData))
        .rejects.toThrow('Order not found');
    });
  });
});
