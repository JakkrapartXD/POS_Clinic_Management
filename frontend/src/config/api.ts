export const API_CONFIG = {
  BASE_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000',
  ENDPOINTS: {
    GRAPHQL: '/graphql',
    AUTH: {
      SIGN_IN: '/auth/sign-in',
      SIGN_OUT: '/auth/sign-out',
      REFRESH: '/auth/refresh',
      VERIFY_TOKEN: '/auth/token-verify',
    },
    USER: {
      PROFILE: '/user/profile',
      UPDATE: '/user/update',
    },
    INVENTORY: {
      LIST: '/inventory',
      CREATE: '/inventory',
      UPDATE: '/inventory',
      DELETE: '/inventory',
    },
    POS: {
      TRANSACTIONS: '/pos/transactions',
      CREATE_SALE: '/pos/sales',
    },
    DOCUMENTS: {
      LIST: '/documents',
      UPLOAD: '/documents/upload',
      DOWNLOAD: '/documents/download',
    },
    UPLOAD: {
      IMAGE: '/upload/image',
    },
  },
  TIMEOUT: 30000, // 30 seconds
  HEADERS: {
    'Content-Type': 'application/json',
  },
};

export const getAuthHeaders = (token?: string) => ({
  ...API_CONFIG.HEADERS,
  ...(token && { Authorization: `Bearer ${token}` }),
}); 