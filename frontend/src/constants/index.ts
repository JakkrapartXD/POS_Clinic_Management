export const APP_CONSTANTS = {
  APP_NAME: 'SN Clinic',
  APP_DESCRIPTION: 'คลินิกบริหารยาผู้ป่วยรักษายา',
  COPYRIGHT: '© 2024 SN Clinic. All rights reserved.',
  
  // Cookie names
  COOKIES: {
    AUTH_TOKEN: 'next-auth.jwt-token',
    THEME: 'theme',
  },
  
  // Local storage keys
  STORAGE_KEYS: {
    USER_PREFERENCES: 'userPreferences',
    CART: 'posCart',
  },
  
  // Routes
  ROUTES: {
    HOME: '/',
    LOGIN: '/login',
    DASHBOARD: '/dashboard',
    INVENTORY: '/dashboard/inventory',
    POS: '/dashboard/pos',
    DOCUMENTS: '/dashboard/documents',
    PROFILE: '/dashboard/profile',
    SETTINGS: '/dashboard/settings',
  },
  
  // Pagination
  PAGINATION: {
    DEFAULT_PAGE_SIZE: 10,
    MAX_PAGE_SIZE: 100,
  },
  
  // File upload
  FILE_UPLOAD: {
    MAX_SIZE: 10 * 1024 * 1024, // 10MB
    ACCEPTED_TYPES: ['image/jpeg', 'image/png', 'application/pdf'],
  },
};

export const THEME_MODES = {
  LIGHT: 'light',
  DARK: 'dark',
  SYSTEM: 'system',
} as const;

export const USER_ROLES = {
  ADMIN: 'admin',
  PHARMACIST: 'pharmacist',
  CASHIER: 'cashier',
} as const;

export type ThemeMode = typeof THEME_MODES[keyof typeof THEME_MODES];
export type UserRole = typeof USER_ROLES[keyof typeof USER_ROLES]; 