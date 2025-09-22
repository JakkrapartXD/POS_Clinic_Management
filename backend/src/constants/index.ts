/**
 * Application constants for better maintainability and internationalization support
 */

// Queue Ticket Statuses
export const QUEUE_TICKET_STATUS = {
  WAITING: 'waiting',
  CALLED: 'called',
  IN_SERVICE: 'in_service',
  DONE: 'done'
} as const;

// Queue Ticket Stations
export const QUEUE_TICKET_STATION = {
  TRIAGE: 'triage'
} as const;

// Visit Statuses
export const VISIT_STATUS = {
  OPEN: 'open',
  TRIAGE: 'triage'
} as const;

// Common Messages and Labels
export const MESSAGES = {
  TRIAGE_ASSESSMENT: 'Triage Assessment'
} as const;

// Error Messages
export const ERROR_MESSAGES = {
  INVALID_STATION: 'INVALID_STATION',
  INVALID_STATE: 'INVALID_STATE'
} as const;

// Type definitions for better type safety
export type QueueTicketStatus = typeof QUEUE_TICKET_STATUS[keyof typeof QUEUE_TICKET_STATUS];
export type QueueTicketStation = typeof QUEUE_TICKET_STATION[keyof typeof QUEUE_TICKET_STATION];
export type VisitStatus = typeof VISIT_STATUS[keyof typeof VISIT_STATUS];
