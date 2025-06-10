/**
 * Application-wide configuration and constants
 */

export const APP_CONFIG = {
  name: 'SN Clinic',
  fullName: 'SN Clinic | คลินิกบริหารยาผู้ป่วยรักษายา',
  description: 'Clinic Management System',
  version: '1.1.109',
  apiBaseUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000',
}

export const PATHS = {
  dashboard: '/dashboard',
  login: '/login',
  notifications: '/dashboard/notifications',
  pos: '/dashboard/pos',
  inventory: '/dashboard/inventory',
  discounts: '/dashboard/discounts',
  documents: '/dashboard/documents',
  settings: '/dashboard/settings',
  profile: '/dashboard/profile',
}

export const ROLES = {
  ADMIN: 'admin',
  DOCTOR: 'doctor',
  NURSE: 'nurse',
  PHARMACIST: 'pharmacist',
  STAFF: 'staff',
}

export default APP_CONFIG 