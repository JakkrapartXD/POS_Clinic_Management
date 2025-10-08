import { config } from 'dotenv';

// Load environment variables
config({ path: '../../.env' });

// Global test setup
beforeAll(async () => {
  console.log('Setting up test environment...');
  // Mock setup for unit tests - no actual database connection needed
});

afterAll(async () => {
  console.log('Cleaning up test environment...');
  // Mock cleanup for unit tests
});

// Global test configuration
export const TEST_CONFIG = {
  API_BASE_URL: process.env.API_BASE_URL || 'http://localhost:4000',
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:3000',
  TEST_DATABASE_URL: process.env.TEST_DATABASE_URL || process.env.DATABASE_URL,
  JWT_SECRET: process.env.JWT_SECRET || 'test-secret',
  TIMEOUT: 30000,
  RETRY_ATTEMPTS: 3
};

// Test data generators
export const generateTestUser = () => ({
  username: `testuser_${Date.now()}`,
  email: `test_${Date.now()}@example.com`,
  password: 'TestPassword123!',
  role: 'staff',
  status: 'active'
});

export const generateTestPatient = () => ({
  first_name: `TestPatient_${Date.now()}`,
  last_name: 'TestLastName',
  national_id: `${Date.now()}`,
  phone: `08${Math.floor(Math.random() * 100000000)}`,
  email: `testpatient_${Date.now()}@example.com`,
  date_of_birth: '1990-01-01',
  gender: 'male'
});

export const generateTestProduct = () => ({
  product_name: `TestProduct_${Date.now()}`,
  product_type: 'medication',
  sale_price: 100,
  unit: 'tablet',
  stock_quantity: 100,
  sku: `TEST_${Date.now()}`
});

// Utility functions
export const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const generateJWT = (payload: any) => {
  // Simple JWT generation for testing (in real implementation, use proper JWT library)
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64');
  const body = Buffer.from(JSON.stringify(payload)).toString('base64');
  const signature = 'test-signature';
  return `${header}.${body}.${signature}`;
};

// Authentication helper for integration tests
export const authenticateUser = async (apiUrl: string, username: string, password: string) => {
  const loginMutation = `
    mutation SignIn($input: SignInInput!) {
      signIn(input: $input) {
        token
        user {
          id
          username
          email
          role
        }
      }
    }
  `;

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include', // Include cookies for session-based auth
      body: JSON.stringify({
        query: loginMutation,
        variables: {
          input: {
            username,
            password
          }
        }
      })
    });

    const result = await response.json();
    
    if (result.errors) {
      throw new Error(result.errors[0].message);
    }

    return {
      token: result.data?.signIn?.token,
      user: result.data?.signIn?.user,
      cookies: response.headers.get('set-cookie') // Get session cookies
    };
  } catch (error) {
    console.error('Authentication failed:', error);
    throw error;
  }
};

// Create authenticated axios instance
export const createAuthenticatedAxios = (apiUrl: string, token?: string, cookies?: string) => {
  const headers: any = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  if (cookies) {
    headers['Cookie'] = cookies;
  }

  return {
    post: async (url: string, data: any, config: any = {}) => {
      return fetch(url, {
        method: 'POST',
        headers: {
          ...headers,
          ...config.headers
        },
        credentials: 'include',
        body: JSON.stringify(data)
      }).then(async (response) => {
        const result = await response.json();
        return {
          status: response.status,
          data: result,
          headers: response.headers
        };
      });
    }
  };
};

