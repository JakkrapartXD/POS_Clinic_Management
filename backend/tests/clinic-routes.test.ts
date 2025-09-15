import { describe, it, expect, beforeAll, afterAll } from 'bun:test';
import { Elysia } from 'elysia';
import { jwt } from '@elysiajs/jwt';
import { PrismaClient } from '@prisma/client';
import { clinicController } from '../src/controllers/ClinicController';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.TEST_DATABASE_URL || process.env.DATABASE_URL
    }
  }
});

// Create test app
const app = new Elysia()
  .use(jwt({
    name: 'jwt',
    secret: process.env.JWT_SECRET || 'test-secret'
  }))
  .group('/clinic', app => app.use(clinicController));

// Test data
let testPatient: any;
let testDoctor: any;
let testVisit: any;
let testOrder: any;
let doctorToken: string;

describe('Clinic Routes Integration', () => {
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
    testDoctor = await prisma.user.create({
      data: {
        username: 'testdoctor',
        email: 'doctor@test.com',
        password_hash: 'hashedpassword',
        role: 'doctor'
      }
    });

    // Create test order
    testOrder = await prisma.order.create({
      data: {
        patientId: testPatient.id,
        total_amount: 200.0,
        status: 'completed'
      }
    });

    // Generate JWT token for doctor
    const jwtInstance = app.decorator.jwt;
    doctorToken = await jwtInstance.sign({
      id: testDoctor.id,
      username: testDoctor.username,
      role: testDoctor.role
    });
  });

  afterAll(async () => {
    // Clean up test data
    await prisma.visitOrder.deleteMany({ where: { visitId: testVisit?.id } });
    await prisma.queueEvent.deleteMany({});
    await prisma.queueTicket.deleteMany({});
    await prisma.vitals.deleteMany({});
    await prisma.visit.deleteMany({ where: { patientId: testPatient.id } });
    await prisma.order.delete({ where: { id: testOrder.id } });
    await prisma.patient.delete({ where: { id: testPatient.id } });
    await prisma.user.delete({ where: { id: testDoctor.id } });
    
    await prisma.$disconnect();
  });

  describe('POST /clinic/patients/:patientId/visits', () => {
    it('should create a new visit with valid authentication', async () => {
      const response = await app.handle(
        new Request(`http://localhost/clinic/patients/${testPatient.id}/visits`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${doctorToken}`
          },
          body: JSON.stringify({
            chief_complaint: 'Test complaint',
            diagnosis: 'Test diagnosis',
            notes: 'Test notes'
          })
        })
      );

      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data).toBeDefined();
      expect(data.data.patientId).toBe(testPatient.id);
      expect(data.data.chief_complaint).toBe('Test complaint');
      
      testVisit = data.data;
    });

    it('should reject request without authentication', async () => {
      const response = await app.handle(
        new Request(`http://localhost/clinic/patients/${testPatient.id}/visits`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            chief_complaint: 'Test complaint'
          })
        })
      );

      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.success).toBe(false);
    });

    it('should reject request for non-existent patient', async () => {
      const response = await app.handle(
        new Request(`http://localhost/clinic/patients/non-existent-id/visits`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${doctorToken}`
          },
          body: JSON.stringify({
            chief_complaint: 'Test complaint'
          })
        })
      );

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error).toContain('Patient not found');
    });
  });

  describe('POST /clinic/visits/:visitId/vitals', () => {
    it('should upsert vitals with valid data', async () => {
      const response = await app.handle(
        new Request(`http://localhost/clinic/visits/${testVisit.id}/vitals`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${doctorToken}`
          },
          body: JSON.stringify({
            heightCm: 170,
            weightKg: 70,
            tempC: 36.5,
            sbp: 120,
            dbp: 80,
            hr: 72,
            spo2: 98
          })
        })
      );

      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data).toBeDefined();
      expect(data.data.heightCm).toBe(170);
      expect(data.data.weightKg).toBe(70);
      expect(data.data.bmi).toBeCloseTo(24.22, 2);
    });
  });

  describe('POST /clinic/visits/:visitId/queue', () => {
    it('should create a queue ticket', async () => {
      const response = await app.handle(
        new Request(`http://localhost/clinic/visits/${testVisit.id}/queue`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${doctorToken}`
          },
          body: JSON.stringify({
            station: 'doctor',
            priority: 1
          })
        })
      );

      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data).toBeDefined();
      expect(data.data.station).toBe('doctor');
      expect(data.data.priority).toBe(1);
      expect(data.data.status).toBe('waiting');
    });

    it('should reject invalid station', async () => {
      const response = await app.handle(
        new Request(`http://localhost/clinic/visits/${testVisit.id}/queue`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${doctorToken}`
          },
          body: JSON.stringify({
            station: 'invalid_station'
          })
        })
      );

      expect(response.status).toBe(400);
    });
  });

  describe('POST /clinic/visits/:visitId/link-order', () => {
    it('should link an order to a visit', async () => {
      const response = await app.handle(
        new Request(`http://localhost/clinic/visits/${testVisit.id}/link-order`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${doctorToken}`
          },
          body: JSON.stringify({
            orderId: testOrder.id
          })
        })
      );

      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data).toBeDefined();
      expect(data.data.visitId).toBe(testVisit.id);
      expect(data.data.orderId).toBe(testOrder.id);
    });

    it('should prevent duplicate order links', async () => {
      const response = await app.handle(
        new Request(`http://localhost/clinic/visits/${testVisit.id}/link-order`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${doctorToken}`
          },
          body: JSON.stringify({
            orderId: testOrder.id
          })
        })
      );

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error).toContain('already linked');
    });
  });

  describe('GET /clinic/visits/:visitId', () => {
    it('should get visit details', async () => {
      const response = await app.handle(
        new Request(`http://localhost/clinic/visits/${testVisit.id}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${doctorToken}`
          }
        })
      );

      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data).toBeDefined();
      expect(data.data.id).toBe(testVisit.id);
      expect(data.data.patient).toBeDefined();
      expect(data.data.vitals).toBeDefined();
      expect(data.data.visitOrders).toBeDefined();
      expect(data.data.queueTickets).toBeDefined();
    });

    it('should return 404 for non-existent visit', async () => {
      const response = await app.handle(
        new Request(`http://localhost/clinic/visits/non-existent-id`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${doctorToken}`
          }
        })
      );

      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data.success).toBe(false);
    });
  });

  describe('GET /clinic/patients/:patientId/visits', () => {
    it('should get patient visits', async () => {
      const response = await app.handle(
        new Request(`http://localhost/clinic/patients/${testPatient.id}/visits`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${doctorToken}`
          }
        })
      );

      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(Array.isArray(data.data)).toBe(true);
      expect(data.data.length).toBeGreaterThan(0);
      expect(data.data[0].patientId).toBe(testPatient.id);
    });
  });

  describe('GET /clinic/queue', () => {
    it('should get queue tickets', async () => {
      const response = await app.handle(
        new Request(`http://localhost/clinic/queue`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${doctorToken}`
          }
        })
      );

      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(Array.isArray(data.data)).toBe(true);
    });

    it('should filter queue tickets by station', async () => {
      const response = await app.handle(
        new Request(`http://localhost/clinic/queue?station=doctor`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${doctorToken}`
          }
        })
      );

      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(Array.isArray(data.data)).toBe(true);
    });
  });

  describe('Role-based Authorization', () => {
    let cashierToken: string;

    beforeAll(async () => {
      const cashier = await prisma.user.create({
        data: {
          username: 'testcashier',
          email: 'cashier@test.com',
          password_hash: 'hashedpassword',
          role: 'cashier'
        }
      });

      const jwtInstance = app.decorator.jwt;
      cashierToken = await jwtInstance.sign({
        id: cashier.id,
        username: cashier.username,
        role: cashier.role
      });
    });

    afterAll(async () => {
      await prisma.user.deleteMany({ where: { username: 'testcashier' } });
    });

    it('should allow cashier to link orders', async () => {
      // Create another order for testing
      const anotherOrder = await prisma.order.create({
        data: {
          patientId: testPatient.id,
          total_amount: 100.0,
          status: 'completed'
        }
      });

      const response = await app.handle(
        new Request(`http://localhost/clinic/visits/${testVisit.id}/link-order`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${cashierToken}`
          },
          body: JSON.stringify({
            orderId: anotherOrder.id
          })
        })
      );

      expect(response.status).toBe(200);
      
      // Clean up
      await prisma.visitOrder.deleteMany({ where: { orderId: anotherOrder.id } });
      await prisma.order.delete({ where: { id: anotherOrder.id } });
    });

    it('should deny cashier from creating visits', async () => {
      const response = await app.handle(
        new Request(`http://localhost/clinic/patients/${testPatient.id}/visits`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${cashierToken}`
          },
          body: JSON.stringify({
            chief_complaint: 'Test complaint'
          })
        })
      );

      expect(response.status).toBe(403);
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error).toContain('Access denied');
    });
  });
});
