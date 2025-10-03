import { TEST_CONFIG, generateTestUser, generateJWT } from '../../setup';
import axios from 'axios';

describe('AuthService Unit Tests', () => {
  const apiUrl = `${TEST_CONFIG.API_BASE_URL}/graphql`;
  
  // Test data
  const testUser = generateTestUser();
  let createdUserId: string;
  let authToken: string;

  beforeAll(async () => {
    // Create test user first
    const createUserMutation = `
      mutation CreateUser($input: CreateUserInput!) {
        createUser(input: $input) {
          id
          username
          email
          role
          status
        }
      }
    `;

    try {
      const response = await axios.post(apiUrl, {
        query: createUserMutation,
        variables: {
          input: testUser
        }
      });

      if (response.data.data?.createUser) {
        createdUserId = response.data.data.createUser.id;
      }
    } catch (error) {
      console.log('Test user might already exist or creation failed:', error);
    }
  });

  afterAll(async () => {
    // Clean up test user
    if (createdUserId) {
      const deleteUserMutation = `
        mutation DeleteUser($id: String!) {
          deleteUser(id: $id)
        }
      `;

      try {
        await axios.post(apiUrl, {
          query: deleteUserMutation,
          variables: { id: createdUserId }
        });
      } catch (error) {
        console.log('Cleanup failed:', error);
      }
    }
  });

  describe('UT-001: Login with valid credentials', () => {
    it('should allow login and create JWT token for active user', async () => {
      const loginMutation = `
        mutation SignIn($input: SignInInput!) {
          signIn(input: $input) {
            success
            message
            user {
              id
              username
              email
              role
              status
            }
            token
          }
        }
      `;

      const response = await axios.post(apiUrl, {
        query: loginMutation,
        variables: {
          input: {
            username: testUser.username,
            password: testUser.password
          }
        }
      });

      expect(response.status).toBe(200);
      expect(response.data.data?.signIn?.success).toBe(true);
      expect(response.data.data?.signIn?.user?.username).toBe(testUser.username);
      expect(response.data.data?.signIn?.token).toBeDefined();
      
      authToken = response.data.data.signIn.token;
    });
  });

  describe('UT-002: Login with invalid password', () => {
    it('should reject login and show error message for wrong password', async () => {
      const loginMutation = `
        mutation SignIn($input: SignInInput!) {
          signIn(input: $input) {
            success
            message
            user {
              id
              username
              email
              role
              status
            }
            token
          }
        }
      `;

      const response = await axios.post(apiUrl, {
        query: loginMutation,
        variables: {
          input: {
            username: testUser.username,
            password: 'wrongpassword'
          }
        }
      });

      expect(response.status).toBe(200);
      expect(response.data.data?.signIn?.success).toBe(false);
      expect(response.data.data?.signIn?.message).toContain('รหัสผ่านไม่ถูกต้อง');
      expect(response.data.data?.signIn?.token).toBeNull();
    });
  });

  describe('UT-003: Login with non-existent user', () => {
    it('should reject login for non-existent user', async () => {
      const loginMutation = `
        mutation SignIn($input: SignInInput!) {
          signIn(input: $input) {
            success
            message
            user {
              id
              username
              email
              role
              status
            }
            token
          }
        }
      `;

      const response = await axios.post(apiUrl, {
        query: loginMutation,
        variables: {
          input: {
            username: 'nonexistentuser',
            password: 'anypassword'
          }
        }
      });

      expect(response.status).toBe(200);
      expect(response.data.data?.signIn?.success).toBe(false);
      expect(response.data.data?.signIn?.message).toContain('ไม่พบผู้ใช้');
    });
  });

  describe('UT-004: Token validation', () => {
    it('should validate JWT token correctly', async () => {
      if (!authToken) {
        // Get token first
        const loginMutation = `
          mutation SignIn($input: SignInInput!) {
            signIn(input: $input) {
              success
              message
              token
            }
          }
        `;

        const loginResponse = await axios.post(apiUrl, {
          query: loginMutation,
          variables: {
            input: {
              username: testUser.username,
              password: testUser.password
            }
          }
        });

        authToken = loginResponse.data.data.signIn.token;
      }

      const meQuery = `
        query Me {
          me {
            id
            username
            email
            role
            status
          }
        }
      `;

      const response = await axios.post(apiUrl, {
        query: meQuery
      }, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      expect(response.status).toBe(200);
      expect(response.data.data?.me?.username).toBe(testUser.username);
    });
  });

  describe('UT-005: Token expiration', () => {
    it('should reject expired token', async () => {
      // Create an expired token (this would need to be implemented in the auth service)
      const expiredToken = generateJWT({
        userId: createdUserId,
        exp: Math.floor(Date.now() / 1000) - 3600 // Expired 1 hour ago
      });

      const meQuery = `
        query Me {
          me {
            id
            username
            email
            role
            status
          }
        }
      `;

      const response = await axios.post(apiUrl, {
        query: meQuery
      }, {
        headers: {
          'Authorization': `Bearer ${expiredToken}`
        }
      });

      expect(response.status).toBe(200);
      expect(response.data.errors).toBeDefined();
      expect(response.data.errors[0].message).toContain('Token expired');
    });
  });
});

