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

