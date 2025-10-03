import { TEST_CONFIG, generateTestPatient, generateTestUser } from '../../setup';
import axios from 'axios';

describe('PatientService Unit Tests', () => {
  const apiUrl = `${TEST_CONFIG.API_BASE_URL}/graphql`;
  
  // Test data
  const testPatient = generateTestPatient();
  const testUser = generateTestUser();
  let createdPatientId: string;
  let authToken: string;
  let createdUserId: string;

  beforeAll(async () => {
    // Create test user for authentication
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

      // Login to get token
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
    } catch (error) {
      console.log('Setup failed:', error);
    }
  });

  afterAll(async () => {
    // Clean up test data
    if (createdPatientId) {
      const deletePatientMutation = `
        mutation DeletePatient($id: String!) {
          deletePatient(id: $id)
        }
      `;

      try {
        await axios.post(apiUrl, {
          query: deletePatientMutation,
          variables: { id: createdPatientId }
        }, {
          headers: { 'Authorization': `Bearer ${authToken}` }
        });
      } catch (error) {
        console.log('Patient cleanup failed:', error);
      }
    }

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
        console.log('User cleanup failed:', error);
      }
    }
  });

  describe('UT-003: Create patient with valid data', () => {
    it('should create patient successfully and return patientId', async () => {
      const createPatientMutation = `
        mutation CreatePatient($input: CreatePatientInput!) {
          createPatient(input: $input) {
            id
            first_name
            last_name
            national_id
            phone
            email
            date_of_birth
            gender
            created_at
            updated_at
          }
        }
      `;

      const response = await axios.post(apiUrl, {
        query: createPatientMutation,
        variables: {
          input: testPatient
        }
      }, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });

      expect(response.status).toBe(200);
      expect(response.data.data?.createPatient?.id).toBeDefined();
      expect(response.data.data?.createPatient?.first_name).toBe(testPatient.first_name);
      expect(response.data.data?.createPatient?.last_name).toBe(testPatient.last_name);
      expect(response.data.data?.createPatient?.national_id).toBe(testPatient.national_id);
      
      createdPatientId = response.data.data.createPatient.id;
    });
  });

  describe('UT-004: Create patient with incomplete data', () => {
    it('should reject creation and show validation error', async () => {
      const incompletePatient = {
        last_name: testPatient.last_name,
        national_id: testPatient.national_id,
        phone: testPatient.phone
        // Missing first_name
      };

      const createPatientMutation = `
        mutation CreatePatient($input: CreatePatientInput!) {
          createPatient(input: $input) {
            id
            first_name
            last_name
            national_id
            phone
            email
            date_of_birth
            gender
            created_at
            updated_at
          }
        }
      `;

      const response = await axios.post(apiUrl, {
        query: createPatientMutation,
        variables: {
          input: incompletePatient
        }
      }, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });

      expect(response.status).toBe(200);
      expect(response.data.errors).toBeDefined();
      expect(response.data.errors[0].message).toContain('กรอกข้อมูลให้ครบถ้วน');
    });
  });

  describe('UT-005: Create patient with duplicate national_id', () => {
    it('should reject creation for duplicate national_id', async () => {
      const duplicatePatient = {
        ...testPatient,
        first_name: 'AnotherTestPatient',
        email: 'another@example.com'
      };

      const createPatientMutation = `
        mutation CreatePatient($input: CreatePatientInput!) {
          createPatient(input: $input) {
            id
            first_name
            last_name
            national_id
            phone
            email
            date_of_birth
            gender
            created_at
            updated_at
          }
        }
      `;

      const response = await axios.post(apiUrl, {
        query: createPatientMutation,
        variables: {
          input: duplicatePatient
        }
      }, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });

      expect(response.status).toBe(200);
      expect(response.data.errors).toBeDefined();
      expect(response.data.errors[0].message).toContain('เลขบัตรประชาชนซ้ำ');
    });
  });

  describe('UT-006: Get patient by ID', () => {
    it('should retrieve patient data correctly', async () => {
      if (!createdPatientId) {
        // Create patient first
        const createPatientMutation = `
          mutation CreatePatient($input: CreatePatientInput!) {
            createPatient(input: $input) {
              id
            }
          }
        `;

        const createResponse = await axios.post(apiUrl, {
          query: createPatientMutation,
          variables: { input: testPatient }
        }, {
          headers: { 'Authorization': `Bearer ${authToken}` }
        });

        createdPatientId = createResponse.data.data.createPatient.id;
      }

      const getPatientQuery = `
        query GetPatient($id: String!) {
          patient(id: $id) {
            id
            first_name
            last_name
            national_id
            phone
            email
            date_of_birth
            gender
            created_at
            updated_at
          }
        }
      `;

      const response = await axios.post(apiUrl, {
        query: getPatientQuery,
        variables: { id: createdPatientId }
      }, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });

      expect(response.status).toBe(200);
      expect(response.data.data?.patient?.id).toBe(createdPatientId);
      expect(response.data.data?.patient?.first_name).toBe(testPatient.first_name);
    });
  });

  describe('UT-007: Update patient data', () => {
    it('should update patient data successfully', async () => {
      if (!createdPatientId) {
        // Create patient first
        const createPatientMutation = `
          mutation CreatePatient($input: CreatePatientInput!) {
            createPatient(input: $input) {
              id
            }
          }
        `;

        const createResponse = await axios.post(apiUrl, {
          query: createPatientMutation,
          variables: { input: testPatient }
        }, {
          headers: { 'Authorization': `Bearer ${authToken}` }
        });

        createdPatientId = createResponse.data.data.createPatient.id;
      }

      const updateData = {
        first_name: 'UpdatedFirstName',
        phone: '0999999999'
      };

      const updatePatientMutation = `
        mutation UpdatePatient($id: String!, $input: UpdatePatientInput!) {
          updatePatient(id: $id, input: $input) {
            id
            first_name
            last_name
            national_id
            phone
            email
            date_of_birth
            gender
            updated_at
          }
        }
      `;

      const response = await axios.post(apiUrl, {
        query: updatePatientMutation,
        variables: {
          id: createdPatientId,
          input: updateData
        }
      }, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });

      expect(response.status).toBe(200);
      expect(response.data.data?.updatePatient?.first_name).toBe(updateData.first_name);
      expect(response.data.data?.updatePatient?.phone).toBe(updateData.phone);
    });
  });

  describe('UT-008: Search patients', () => {
    it('should search patients by name correctly', async () => {
      const searchPatientsQuery = `
        query SearchPatients($query: String!) {
          searchPatients(query: $query) {
            id
            first_name
            last_name
            national_id
            phone
            email
            date_of_birth
            gender
          }
        }
      `;

      const response = await axios.post(apiUrl, {
        query: searchPatientsQuery,
        variables: { query: testPatient.first_name }
      }, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });

      expect(response.status).toBe(200);
      expect(response.data.data?.searchPatients).toBeDefined();
      expect(Array.isArray(response.data.data.searchPatients)).toBe(true);
    });
  });

  describe('UT-009: Get all patients with pagination', () => {
    it('should retrieve patients with pagination', async () => {
      const getAllPatientsQuery = `
        query AllPatients($pagination: PaginationInput) {
          patients(pagination: $pagination) {
            patients {
              id
              first_name
              last_name
              national_id
              phone
              email
              date_of_birth
              gender
              created_at
              updated_at
            }
            total
          }
        }
      `;

      const response = await axios.post(apiUrl, {
        query: getAllPatientsQuery,
        variables: {
          pagination: {
            skip: 0,
            take: 10
          }
        }
      }, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });

      expect(response.status).toBe(200);
      expect(response.data.data?.patients?.patients).toBeDefined();
      expect(Array.isArray(response.data.data.patients.patients)).toBe(true);
      expect(response.data.data?.patients?.total).toBeDefined();
      expect(typeof response.data.data.patients.total).toBe('number');
    });
  });

  describe('UT-010: Delete patient', () => {
    it('should delete patient successfully', async () => {
      // Create a patient to delete
      const patientToDelete = generateTestPatient();
      patientToDelete.first_name = 'PatientToDelete';
      patientToDelete.national_id = `${Date.now()}_delete`;

      const createPatientMutation = `
        mutation CreatePatient($input: CreatePatientInput!) {
          createPatient(input: $input) {
            id
          }
        }
      `;

      const createResponse = await axios.post(apiUrl, {
        query: createPatientMutation,
        variables: { input: patientToDelete }
      }, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });

      const patientIdToDelete = createResponse.data.data.createPatient.id;

      const deletePatientMutation = `
        mutation DeletePatient($id: String!) {
          deletePatient(id: $id)
        }
      `;

      const response = await axios.post(apiUrl, {
        query: deletePatientMutation,
        variables: { id: patientIdToDelete }
      }, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });

      expect(response.status).toBe(200);
      expect(response.data.data?.deletePatient).toBe(true);
    });
  });
});

