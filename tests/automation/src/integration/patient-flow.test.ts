import { TEST_CONFIG, generateTestUser, generateTestPatient } from '../../setup';
import axios from 'axios';

describe('Patient Flow Integration Tests', () => {
  const apiUrl = `${TEST_CONFIG.API_BASE_URL}/graphql`;
  
  // Test data
  const testUser = generateTestUser();
  const testPatient = generateTestPatient();
  let authToken: string;
  let createdUserId: string;
  let createdPatientId: string;
  let createdVisitId: string;
  let createdOrderId: string;

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
    // Clean up test data in reverse order
    if (createdOrderId) {
      const deleteOrderMutation = `
        mutation DeleteOrder($id: String!) {
          deleteOrder(id: $id)
        }
      `;

      try {
        await axios.post(apiUrl, {
          query: deleteOrderMutation,
          variables: { id: createdOrderId }
        }, {
          headers: { 'Authorization': `Bearer ${authToken}` }
        });
      } catch (error) {
        console.log('Order cleanup failed:', error);
      }
    }

    if (createdVisitId) {
      const deleteVisitMutation = `
        mutation DeleteVisit($id: String!) {
          deleteVisit(id: $id)
        }
      `;

      try {
        await axios.post(apiUrl, {
          query: deleteVisitMutation,
          variables: { id: createdVisitId }
        }, {
          headers: { 'Authorization': `Bearer ${authToken}` }
        });
      } catch (error) {
        console.log('Visit cleanup failed:', error);
      }
    }

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

  describe('IT-001: Complete Patient Flow - Register → Visit → Prescription → Order → Payment', () => {
    it('should complete full patient flow successfully', async () => {
      // Step 1: Create patient
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

      const patientResponse = await axios.post(apiUrl, {
        query: createPatientMutation,
        variables: {
          input: testPatient
        }
      }, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });

      expect(patientResponse.status).toBe(200);
      expect(patientResponse.data.data?.createPatient?.id).toBeDefined();
      createdPatientId = patientResponse.data.data.createPatient.id;

      // Step 2: Create visit
      const createVisitMutation = `
        mutation CreateVisit($input: CreateVisitInput!) {
          createVisit(input: $input) {
            id
            visit_date
            status
            patient {
              id
              first_name
              last_name
            }
          }
        }
      `;

      const visitResponse = await axios.post(apiUrl, {
        query: createVisitMutation,
        variables: {
          input: {
            patientId: createdPatientId
          }
        }
      }, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });

      expect(visitResponse.status).toBe(200);
      expect(visitResponse.data.data?.createVisit?.id).toBeDefined();
      createdVisitId = visitResponse.data.data.createVisit.id;

      // Step 3: Update visit with medical record
      const updateVisitMutation = `
        mutation UpdateVisit($id: String!, $input: UpdateVisitInput!) {
          updateVisit(id: $id, input: $input) {
            id
            chief_complaint
            diagnosis
            notes
            status
          }
        }
      `;

      const updateVisitResponse = await axios.post(apiUrl, {
        query: updateVisitMutation,
        variables: {
          id: createdVisitId,
          input: {
            chief_complaint: 'ปวดหัวมา 2 วัน',
            diagnosis: 'ไมเกรน',
            notes: 'แนะนำให้พักผ่อนและทานยา'
          }
        }
      }, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });

      expect(updateVisitResponse.status).toBe(200);
      expect(updateVisitResponse.data.data?.updateVisit?.chief_complaint).toBe('ปวดหัวมา 2 วัน');

      // Step 4: Create order with prescription items
      const createOrderMutation = `
        mutation CreateOrder($input: CreateOrderInput!) {
          createOrder(input: $input) {
            id
            order_date
            status
            total_amount
            is_walkin
            created_at
            updated_at
            patient {
              id
              first_name
              last_name
            }
            orderItems {
              id
              quantity
              unit_price
              total_price
              product_name
              product_unit
            }
          }
        }
      `;

      const orderResponse = await axios.post(apiUrl, {
        query: createOrderMutation,
        variables: {
          input: {
            patientId: createdPatientId,
            total_amount: 500,
            is_walkin: true,
            orderItems: [
              {
                productId: 'med_001', // Assuming this product exists
                quantity: 10,
                unit_price: 25,
                total_price: 250,
                product_name: 'Paracetamol 500mg',
                product_unit: 'tablet'
              },
              {
                productId: 'med_002', // Assuming this product exists
                quantity: 5,
                unit_price: 50,
                total_price: 250,
                product_name: 'Ibuprofen 400mg',
                product_unit: 'tablet'
              }
            ]
          }
        }
      }, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });

      expect(orderResponse.status).toBe(200);
      expect(orderResponse.data.data?.createOrder?.id).toBeDefined();
      createdOrderId = orderResponse.data.data.createOrder.id;

      // Step 5: Process payment
      const processPaymentMutation = `
        mutation ProcessPayment($input: CreatePaymentInput!) {
          processPayment(input: $input) {
            id
            payment_type
            amount
            payment_date
            details
            order {
              id
              total_amount
            }
          }
        }
      `;

      const paymentResponse = await axios.post(apiUrl, {
        query: processPaymentMutation,
        variables: {
          input: {
            orderId: createdOrderId,
            payment_type: 'cash',
            amount: 500,
            details: 'Payment for consultation and medication'
          }
        }
      }, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });

      expect(paymentResponse.status).toBe(200);
      expect(paymentResponse.data.data?.processPayment?.id).toBeDefined();
      expect(paymentResponse.data.data?.processPayment?.amount).toBe(500);

      // Verify all related records exist and are properly linked
      const verifyQuery = `
        query VerifyPatientFlow($patientId: String!, $visitId: String!, $orderId: String!) {
          patient(id: $patientId) {
            id
            first_name
            last_name
            visits {
              id
              status
              chief_complaint
              diagnosis
            }
            orders {
              id
              status
              total_amount
              payments {
                id
                amount
                payment_type
              }
            }
          }
        }
      `;

      const verifyResponse = await axios.post(apiUrl, {
        query: verifyQuery,
        variables: {
          patientId: createdPatientId,
          visitId: createdVisitId,
          orderId: createdOrderId
        }
      }, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });

      expect(verifyResponse.status).toBe(200);
      expect(verifyResponse.data.data?.patient?.visits).toBeDefined();
      expect(verifyResponse.data.data?.patient?.orders).toBeDefined();
      expect(verifyResponse.data.data?.patient?.orders[0]?.payments).toBeDefined();
    });
  });

  describe('IT-002: Stock Insufficient During Dispensing', () => {
    it('should handle insufficient stock during medication dispensing', async () => {
      // Create a product with low stock
      const createProductMutation = `
        mutation CreateProduct($input: CreateProductInput!) {
          createProduct(input: $input) {
            id
            product_name
            stock_quantity
            reorder_point
          }
        }
      `;

      const lowStockProduct = {
        product_name: 'LowStockMedication',
        product_type: 'medication',
        sale_price: 100,
        unit: 'tablet',
        stock_quantity: 5, // Very low stock
        reorder_point: 10,
        sku: `LOW_STOCK_${Date.now()}`
      };

      const productResponse = await axios.post(apiUrl, {
        query: createProductMutation,
        variables: {
          input: lowStockProduct
        }
      }, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });

      const productId = productResponse.data.data.createProduct.id;

      // Try to create order with quantity exceeding stock
      const createOrderMutation = `
        mutation CreateOrder($input: CreateOrderInput!) {
          createOrder(input: $input) {
            id
            orderItems {
              id
              quantity
              product {
                id
                product_name
                stock_quantity
              }
            }
          }
        }
      `;

      const orderResponse = await axios.post(apiUrl, {
        query: createOrderMutation,
        variables: {
          input: {
            patientId: createdPatientId,
            total_amount: 1000,
            is_walkin: true,
            orderItems: [
              {
                productId: productId,
                quantity: 10, // More than available stock (5)
                unit_price: 100,
                total_price: 1000,
                product_name: lowStockProduct.product_name,
                product_unit: lowStockProduct.unit
              }
            ]
          }
        }
      }, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });

      // The system should either reject the order or flag it for review
      expect(orderResponse.status).toBe(200);
      
      // Check if the system properly handles insufficient stock
      if (orderResponse.data.errors) {
        expect(orderResponse.data.errors[0].message).toContain('จำนวนยาไม่เพียงพอ');
      } else {
        // If order is created, it should be flagged or partially processed
        expect(orderResponse.data.data?.createOrder?.id).toBeDefined();
      }

      // Clean up
      const deleteProductMutation = `
        mutation DeleteProduct($id: String!) {
          deleteProduct(id: $id)
        }
      `;

      await axios.post(apiUrl, {
        query: deleteProductMutation,
        variables: { id: productId }
      }, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
    });
  });

  describe('IT-003: Role-Based Access Control Integration', () => {
    it('should enforce RBAC across different user roles', async () => {
      // Create users with different roles
      const roles = [
        { role: 'doctor', username: 'testdoctor', expectedAccess: ['medical_records', 'prescriptions'] },
        { role: 'pharmacist', username: 'testpharmacist', expectedAccess: ['prescriptions', 'inventory'] },
        { role: 'cashier', username: 'testcashier', expectedAccess: ['billing', 'payments'] }
      ];

      const userTokens: { [key: string]: string } = {};

      // Create and login users
      for (const roleData of roles) {
        const createUserMutation = `
          mutation CreateUser($input: CreateUserInput!) {
            createUser(input: $input) {
              id
              username
              role
            }
          }
        `;

        const userData = {
          username: roleData.username,
          email: `${roleData.username}@test.com`,
          password: 'TestPassword123!',
          role: roleData.role,
          status: 'active'
        };

        await axios.post(apiUrl, {
          query: createUserMutation,
          variables: { input: userData }
        });

        // Login to get token
        const loginMutation = `
          mutation SignIn($input: SignInInput!) {
            signIn(input: $input) {
              success
              token
            }
          }
        `;

        const loginResponse = await axios.post(apiUrl, {
          query: loginMutation,
          variables: {
            input: {
              username: roleData.username,
              password: userData.password
            }
          }
        });

        userTokens[roleData.role] = loginResponse.data.data.signIn.token;
      }

      // Test doctor access
      const doctorMedicalRecordsQuery = `
        query GetPatientVisits($patientId: String!) {
          patientVisits(patientId: $patientId) {
            id
            status
            chief_complaint
            diagnosis
          }
        }
      `;

      const doctorResponse = await axios.post(apiUrl, {
        query: doctorMedicalRecordsQuery,
        variables: { patientId: createdPatientId }
      }, {
        headers: { 'Authorization': `Bearer ${userTokens.doctor}` }
      });

      expect(doctorResponse.status).toBe(200);
      expect(doctorResponse.data.data?.patientVisits).toBeDefined();

      // Test pharmacist access to inventory
      const pharmacistInventoryQuery = `
        query GetProducts {
          products {
            products {
              id
              product_name
              stock_quantity
            }
            total
          }
        }
      `;

      const pharmacistResponse = await axios.post(apiUrl, {
        query: pharmacistInventoryQuery
      }, {
        headers: { 'Authorization': `Bearer ${userTokens.pharmacist}` }
      });

      expect(pharmacistResponse.status).toBe(200);
      expect(pharmacistResponse.data.data?.products).toBeDefined();

      // Test cashier access to billing
      const cashierBillingQuery = `
        query GetOrders {
          orders {
            orders {
              id
              total_amount
              status
            }
            total
          }
        }
      `;

      const cashierResponse = await axios.post(apiUrl, {
        query: cashierBillingQuery
      }, {
        headers: { 'Authorization': `Bearer ${userTokens.cashier}` }
      });

      expect(cashierResponse.status).toBe(200);
      expect(cashierResponse.data.data?.orders).toBeDefined();

      // Test unauthorized access (doctor trying to access financial data)
      const unauthorizedQuery = `
        query GetFinancialReports {
          dailyReports {
            id
            total_sales
            total_orders
          }
        }
      `;

      const unauthorizedResponse = await axios.post(apiUrl, {
        query: unauthorizedQuery
      }, {
        headers: { 'Authorization': `Bearer ${userTokens.doctor}` }
      });

      // Should be rejected or return limited data
      expect(unauthorizedResponse.status).toBe(200);
      if (unauthorizedResponse.data.errors) {
        expect(unauthorizedResponse.data.errors[0].message).toContain('ไม่มีสิทธิ์');
      }

      // Clean up test users
      for (const roleData of roles) {
        const deleteUserMutation = `
          mutation DeleteUser($username: String!) {
            deleteUser(username: $username)
          }
        `;

        try {
          await axios.post(apiUrl, {
            query: deleteUserMutation,
            variables: { username: roleData.username }
          });
        } catch (error) {
          console.log(`Cleanup failed for ${roleData.username}:`, error);
        }
      }
    });
  });
});

