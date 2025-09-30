/**
 * Frontend constants for better maintainability and consistency
 */

// Queue Ticket Statuses
export const QUEUE_TICKET_STATUS = {
  WAITING: 'waiting',
  CALLED: 'called',
  IN_SERVICE: 'in_service',
  DONE: 'done',
  CANCELLED: 'cancelled',
  SKIPPED: 'skipped'
} as const;

// Queue Ticket Stations
export const QUEUE_TICKET_STATION = {
  TRIAGE: 'triage',
  DOCTOR: 'doctor',
  PHARMACY: 'pharmacy',
  CASHIER: 'cashier'
} as const;

// Visit Statuses
export const VISIT_STATUS = {
  OPEN: 'open',
  TRIAGE: 'triage',
  DOCTOR: 'doctor',
  PHARMACY: 'pharmacy',
  CASHIER: 'cashier',
  DONE: 'done',
  CANCELLED: 'cancelled'
} as const;

// User Roles
export const USER_ROLES = {
  ADMIN: 'admin',
  DOCTOR: 'doctor',
  STAFF: 'staff',
  CASHIER: 'cashier',
  PHARMACIST: 'pharmacist',
  NURSE: 'nurse'
} as const;

// Appointment Statuses
export const APPOINTMENT_STATUS = {
  SCHEDULED: 'scheduled',
  VISITED: 'visited',
  CANCELLED: 'cancelled'
} as const;

// App Constants
export const APP_CONSTANTS = {
  COOKIES: {
    AUTH_TOKEN: 'auth-token'
  },
  ROUTES: {
    DASHBOARD: '/dashboard'
  },
  FILE_UPLOAD: {
    ACCEPTED_TYPES: [
      'image/jpeg',
      'image/jpg', 
      'image/png',
      'image/gif',
      'image/webp'
    ],
    MAX_SIZE: 5 * 1024 * 1024 // 5MB
  }
} as const;

// Type definitions for better type safety
export type QueueTicketStatus = typeof QUEUE_TICKET_STATUS[keyof typeof QUEUE_TICKET_STATUS];
export type QueueTicketStation = typeof QUEUE_TICKET_STATION[keyof typeof QUEUE_TICKET_STATION];
export type VisitStatus = typeof VISIT_STATUS[keyof typeof VISIT_STATUS];
export type UserRole = typeof USER_ROLES[keyof typeof USER_ROLES];
export type AppointmentStatus = typeof APPOINTMENT_STATUS[keyof typeof APPOINTMENT_STATUS];