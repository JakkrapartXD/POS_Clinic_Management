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
let testNurse: any;
let testAdmin: any;

describe('Triage Queue System', () => {
  beforeAll(async () => {
    // Create test patient
    testPatient = await prisma.patient.create({
      data: {
        first_name: 'John',
        last_name: 'Doe',
        national_id: '1234567890123',
        phone: '0123456789',
        email: 'john.doe@example.com'
      }
    });

    // Create test nurse
    testNurse = await prisma.user.create({
      data: {
        username: 'testnurse',
        email: 'nurse@test.com',
        password_hash: 'hashedpassword',
        role: 'nurse'
      }
    });

    // Create test admin
    testAdmin = await prisma.user.create({
      data: {
        username: 'testadmin',
        email: 'admin@test.com',
        password_hash: 'hashedpassword',
        role: 'admin'
      }
    });
  });

  afterAll(async () => {
    // Clean up test data
    await prisma.queueEvent.deleteMany({
      where: {
        ticket: {
          patientId: testPatient.id
        }
      }
    });
    await prisma.queueTicket.deleteMany({
      where: {
        patientId: testPatient.id
      }
    });
    await prisma.patient.delete({
      where: { id: testPatient.id }
    });
    await prisma.user.deleteMany({
      where: {
        id: {
          in: [testNurse.id, testAdmin.id]
        }
      }
    });
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    // Clean up any existing triage tickets for the test patient
    await prisma.queueEvent.deleteMany({
      where: {
        ticket: {
          patientId: testPatient.id,
          station: 'triage'
        }
      }
    });
    await prisma.queueTicket.deleteMany({
      where: {
        patientId: testPatient.id,
        station: 'triage'
      }
    });
  });

  describe('createTriageTicket', () => {
    it('should create a triage ticket successfully', async () => {
      const ticket = await clinicService.createTriageTicket(testPatient.id, 0);

      expect(ticket).toBeDefined();
      expect(ticket.patientId).toBe(testPatient.id);
      expect(ticket.station).toBe('triage');
      expect(ticket.status).toBe('waiting');
      expect(ticket.priority).toBe(0);
      expect(ticket.number).toBeGreaterThan(0);
      expect(ticket.visitId).toBeNull();
    });

    it('should create a triage ticket with priority', async () => {
      const ticket = await clinicService.createTriageTicket(testPatient.id, 5);

      expect(ticket).toBeDefined();
      expect(ticket.priority).toBe(5);
    });

    it('should prevent duplicate triage tickets for the same patient on the same day', async () => {
      // Create first ticket
      await clinicService.createTriageTicket(testPatient.id, 0);

      // Try to create second ticket - should fail
      try {
        await clinicService.createTriageTicket(testPatient.id, 0);
        expect(true).toBe(false); // Should not reach here
      } catch (error: any) {
        expect(error.message).toBe('DUPLICATE_TRIAGE_TICKET_TODAY');
      }
    });

    it('should allow creating tickets for different patients', async () => {
      const anotherPatient = await prisma.patient.create({
        data: {
          first_name: 'Jane',
          last_name: 'Smith',
          national_id: '9876543210987',
          phone: '0987654321',
          email: 'jane.smith@example.com'
        }
      });

      try {
        const ticket1 = await clinicService.createTriageTicket(testPatient.id, 0);
        const ticket2 = await clinicService.createTriageTicket(anotherPatient.id, 0);

        expect(ticket1.patientId).toBe(testPatient.id);
        expect(ticket2.patientId).toBe(anotherPatient.id);
        expect(ticket1.number).not.toBe(ticket2.number);
      } finally {
        // Clean up
        await prisma.queueEvent.deleteMany({
          where: {
            ticket: {
              patientId: anotherPatient.id
            }
          }
        });
        await prisma.queueTicket.deleteMany({
          where: {
            patientId: anotherPatient.id
          }
        });
        await prisma.patient.delete({
          where: { id: anotherPatient.id }
        });
      }
    });

    it('should throw error for non-existent patient', async () => {
      try {
        await clinicService.createTriageTicket('non-existent-id', 0);
        expect(true).toBe(false); // Should not reach here
      } catch (error: any) {
        expect(error.message).toBe('Patient not found');
      }
    });

    it('should generate sequential queue numbers', async () => {
      const anotherPatient = await prisma.patient.create({
        data: {
          first_name: 'Bob',
          last_name: 'Johnson',
          national_id: '1111111111111',
          phone: '0111111111',
          email: 'bob.johnson@example.com'
        }
      });

      try {
        const ticket1 = await clinicService.createTriageTicket(testPatient.id, 0);
        const ticket2 = await clinicService.createTriageTicket(anotherPatient.id, 0);

        expect(ticket2.number).toBe(ticket1.number + 1);
      } finally {
        // Clean up
        await prisma.queueEvent.deleteMany({
          where: {
            ticket: {
              patientId: anotherPatient.id
            }
          }
        });
        await prisma.queueTicket.deleteMany({
          where: {
            patientId: anotherPatient.id
          }
        });
        await prisma.patient.delete({
          where: { id: anotherPatient.id }
        });
      }
    });
  });

  describe('callTriageTicket', () => {
    it('should call a waiting ticket successfully', async () => {
      const ticket = await clinicService.createTriageTicket(testPatient.id, 0);
      
      const updatedTicket = await clinicService.callTriageTicket(ticket.id, testNurse.id);

      expect(updatedTicket.status).toBe('called');
      expect(updatedTicket.called_at).toBeDefined();
    });

    it('should throw error for non-existent ticket', async () => {
      try {
        await clinicService.callTriageTicket('non-existent-id', testNurse.id);
        expect(true).toBe(false); // Should not reach here
      } catch (error: any) {
        expect(error.message).toBe('Queue ticket not found');
      }
    });

    it('should throw error for non-triage station ticket', async () => {
      // Create a visit and regular queue ticket
      const visit = await prisma.visit.create({
        data: {
          patientId: testPatient.id,
          status: 'open'
        }
      });

      const regularTicket = await prisma.queueTicket.create({
        data: {
          visitId: visit.id,
          patientId: testPatient.id,
          station: 'doctor',
          number: 1,
          status: 'waiting'
        }
      });

      try {
        await clinicService.callTriageTicket(regularTicket.id, testNurse.id);
        expect(true).toBe(false); // Should not reach here
      } catch (error: any) {
        expect(error.message).toBe('INVALID_STATION');
      } finally {
        // Clean up
        await prisma.queueTicket.delete({
          where: { id: regularTicket.id }
        });
        await prisma.visit.delete({
          where: { id: visit.id }
        });
      }
    });

    it('should throw error for non-waiting status ticket', async () => {
      const ticket = await clinicService.createTriageTicket(testPatient.id, 0);
      
      // First call the ticket
      await clinicService.callTriageTicket(ticket.id, testNurse.id);

      // Try to call again - should fail
      try {
        await clinicService.callTriageTicket(ticket.id, testNurse.id);
        expect(true).toBe(false); // Should not reach here
      } catch (error: any) {
        expect(error.message).toBe('INVALID_STATE');
      }
    });
  });

  describe('startTriageTicket', () => {
    it('should start a waiting ticket successfully', async () => {
      const ticket = await clinicService.createTriageTicket(testPatient.id, 0);
      
      const updatedTicket = await clinicService.startTriageTicket(ticket.id, testNurse.id);

      expect(updatedTicket.status).toBe('in_service');
      expect(updatedTicket.started_at).toBeDefined();
    });

    it('should start a called ticket successfully', async () => {
      const ticket = await clinicService.createTriageTicket(testPatient.id, 0);
      
      // First call the ticket
      await clinicService.callTriageTicket(ticket.id, testNurse.id);
      
      // Then start it
      const updatedTicket = await clinicService.startTriageTicket(ticket.id, testNurse.id);

      expect(updatedTicket.status).toBe('in_service');
      expect(updatedTicket.started_at).toBeDefined();
    });

    it('should throw error for non-waiting/called status ticket', async () => {
      const ticket = await clinicService.createTriageTicket(testPatient.id, 0);
      
      // Start the ticket
      await clinicService.startTriageTicket(ticket.id, testNurse.id);

      // Try to start again - should fail
      try {
        await clinicService.startTriageTicket(ticket.id, testNurse.id);
        expect(true).toBe(false); // Should not reach here
      } catch (error: any) {
        expect(error.message).toBe('INVALID_STATE');
      }
    });
  });

  describe('completeTriageTicket', () => {
    it('should complete an in-service ticket successfully', async () => {
      const ticket = await clinicService.createTriageTicket(testPatient.id, 0);
      
      // Start the ticket
      await clinicService.startTriageTicket(ticket.id, testNurse.id);
      
      // Complete it
      const updatedTicket = await clinicService.completeTriageTicket(ticket.id, testNurse.id);

      expect(updatedTicket.status).toBe('done');
      expect(updatedTicket.done_at).toBeDefined();
    });

    it('should throw error for non-in-service status ticket', async () => {
      const ticket = await clinicService.createTriageTicket(testPatient.id, 0);

      // Try to complete without starting - should fail
      try {
        await clinicService.completeTriageTicket(ticket.id, testNurse.id);
        expect(true).toBe(false); // Should not reach here
      } catch (error: any) {
        expect(error.message).toBe('INVALID_STATE');
      }
    });
  });

  describe('getTriageQueue', () => {
    it('should return all triage tickets for today', async () => {
      // Create multiple tickets
      const ticket1 = await clinicService.createTriageTicket(testPatient.id, 0);
      
      const anotherPatient = await prisma.patient.create({
        data: {
          first_name: 'Alice',
          last_name: 'Brown',
          national_id: '5555555555555',
          phone: '0555555555',
          email: 'alice.brown@example.com'
        }
      });

      const ticket2 = await clinicService.createTriageTicket(anotherPatient.id, 1);

      try {
        const result = await clinicService.getTriageQueue();

        expect(result.total).toBeGreaterThanOrEqual(2);
        expect(result.tickets.length).toBeGreaterThanOrEqual(2);
        
        const ticketIds = result.tickets.map(t => t.id);
        expect(ticketIds).toContain(ticket1.id);
        expect(ticketIds).toContain(ticket2.id);
      } finally {
        // Clean up
        await prisma.queueEvent.deleteMany({
          where: {
            ticket: {
              patientId: anotherPatient.id
            }
          }
        });
        await prisma.queueTicket.deleteMany({
          where: {
            patientId: anotherPatient.id
          }
        });
        await prisma.patient.delete({
          where: { id: anotherPatient.id }
        });
      }
    });

    it('should filter by status', async () => {
      const ticket = await clinicService.createTriageTicket(testPatient.id, 0);
      
      // Call the ticket
      await clinicService.callTriageTicket(ticket.id, testNurse.id);

      const waitingResult = await clinicService.getTriageQueue({ status: 'waiting' });
      const calledResult = await clinicService.getTriageQueue({ status: 'called' });

      expect(waitingResult.tickets.find(t => t.id === ticket.id)).toBeUndefined();
      expect(calledResult.tickets.find(t => t.id === ticket.id)).toBeDefined();
    });

    it('should support pagination', async () => {
      const result1 = await clinicService.getTriageQueue({ skip: 0, take: 1 });
      const result2 = await clinicService.getTriageQueue({ skip: 1, take: 1 });

      expect(result1.tickets.length).toBeLessThanOrEqual(1);
      expect(result2.tickets.length).toBeLessThanOrEqual(1);
      
      if (result1.tickets.length > 0 && result2.tickets.length > 0) {
        expect(result1.tickets[0].id).not.toBe(result2.tickets[0].id);
      }
    });

    it('should support search by patient name', async () => {
      const result = await clinicService.getTriageQueue({ search: 'John' });

      expect(result.tickets.every(t => 
        t.patient.first_name.toLowerCase().includes('john') ||
        t.patient.last_name.toLowerCase().includes('john')
      )).toBe(true);
    });

    it('should support search by patient ID', async () => {
      const result = await clinicService.getTriageQueue({ search: testPatient.id });

      expect(result.tickets.every(t => t.patientId === testPatient.id)).toBe(true);
    });
  });

  describe('Queue Events', () => {
    it('should create queue events for all status changes', async () => {
      const ticket = await clinicService.createTriageTicket(testPatient.id, 0);
      
      // Check initial event
      let events = await prisma.queueEvent.findMany({
        where: { ticketId: ticket.id },
        orderBy: { at: 'asc' }
      });
      expect(events.length).toBe(1);
      expect(events[0].status).toBe('waiting');

      // Call ticket
      await clinicService.callTriageTicket(ticket.id, testNurse.id);
      
      events = await prisma.queueEvent.findMany({
        where: { ticketId: ticket.id },
        orderBy: { at: 'asc' }
      });
      expect(events.length).toBe(2);
      expect(events[1].status).toBe('called');
      expect(events[1].byUserId).toBe(testNurse.id);

      // Start ticket
      await clinicService.startTriageTicket(ticket.id, testNurse.id);
      
      events = await prisma.queueEvent.findMany({
        where: { ticketId: ticket.id },
        orderBy: { at: 'asc' }
      });
      expect(events.length).toBe(3);
      expect(events[2].status).toBe('in_service');

      // Complete ticket
      await clinicService.completeTriageTicket(ticket.id, testNurse.id);
      
      events = await prisma.queueEvent.findMany({
        where: { ticketId: ticket.id },
        orderBy: { at: 'asc' }
      });
      expect(events.length).toBe(4);
      expect(events[3].status).toBe('done');
    });
  });

  describe('Timezone Handling', () => {
    it('should handle Bangkok timezone correctly for daily queue numbers', async () => {
      // This test ensures that queue numbers reset daily based on Bangkok timezone
      const ticket1 = await clinicService.createTriageTicket(testPatient.id, 0);
      
      // Create another patient and ticket
      const anotherPatient = await prisma.patient.create({
        data: {
          first_name: 'Test',
          last_name: 'Timezone',
          national_id: '9999999999999',
          phone: '0999999999',
          email: 'test.timezone@example.com'
        }
      });

      try {
        const ticket2 = await clinicService.createTriageTicket(anotherPatient.id, 0);
        
        // Both tickets should be created on the same day (Bangkok timezone)
        // and have sequential numbers
        expect(ticket2.number).toBe(ticket1.number + 1);
        
        // Both should have the same day in Bangkok timezone
        const ticket1Date = new Date(ticket1.created_at);
        const ticket2Date = new Date(ticket2.created_at);
        
        // Convert to Bangkok timezone for comparison
        const bangkokOffset = 7 * 60; // UTC+7
        const ticket1Bangkok = new Date(ticket1Date.getTime() + bangkokOffset * 60000);
        const ticket2Bangkok = new Date(ticket2Date.getTime() + bangkokOffset * 60000);
        
        expect(ticket1Bangkok.getDate()).toBe(ticket2Bangkok.getDate());
      } finally {
        // Clean up
        await prisma.queueEvent.deleteMany({
          where: {
            ticket: {
              patientId: anotherPatient.id
            }
          }
        });
        await prisma.queueTicket.deleteMany({
          where: {
            patientId: anotherPatient.id
          }
        });
        await prisma.patient.delete({
          where: { id: anotherPatient.id }
        });
      }
    });
  });
});
