import { TEST_CONFIG, generateTestUser, generateTestPatient } from '../../setup';
import axios from 'axios';

describe('Billing Flow Integration Tests', () => {
  const apiUrl = `${TEST_CONFIG.API_BASE_URL}/graphql`;
  
  // Test data
  const testUser = generateTestUser();
  const testPatient = generateTestPatient();
  let authToken: string;
  let createdUserId: string;
  let createdPatientId: string;
  let createdOrderId: string;
  let createdPaymentId: string;

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

      // Create test patient
      const createPatientMutation = `
        mutation CreatePatient($input: CreatePatientInput!) {
          createPatient(input: $input) {
            id
            first_name
            last_name
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

      createdPatientId = patientResponse.data.data.createPatient.id;
    } catch (error) {
      console.log('Setup failed:', error);
    }
  });

  afterAll(async () => {
    // Clean up test data
    if (createdPaymentId) {
      // Payments are usually not deletable, but we can mark them as cancelled
      console.log('Payment cleanup - payments are typically not deletable');
    }

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

  describe('IT-006: Billing Calculation Accuracy', () => {
    it('should calculate subtotal, discount, tax, and total correctly', async () => {
      // Create order with multiple items
      const createOrderMutation = `
        mutation CreateOrder($input: CreateOrderInput!) {
          createOrder(input: $input) {
            id
            order_date
            status
            total_amount
            is_walkin
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

      const orderData = {
        patientId: createdPatientId,
        total_amount: 800, // This will be recalculated
        is_walkin: true,
        orderItems: [
          {
            productId: 'med_001',
            quantity: 10,
            unit_price: 25,
            total_price: 250,
            product_name: 'Paracetamol 500mg',
            product_unit: 'tablet'
          },
          {
            productId: 'med_002',
            quantity: 5,
            unit_price: 50,
            total_price: 250,
            product_name: 'Ibuprofen 400mg',
            product_unit: 'tablet'
          },
          {
            productId: 'service_001',
            quantity: 1,
            unit_price: 300,
            total_price: 300,
            product_name: 'ค่ารักษา',
            product_unit: 'ครั้ง'
          }
      ]
      };

      const orderResponse = await axios.post(apiUrl, {
        query: createOrderMutation,
        variables: {
          input: orderData
        }
      }, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });

      expect(orderResponse.status).toBe(200);
      expect(orderResponse.data.data?.createOrder?.id).toBeDefined();
      createdOrderId = orderResponse.data.data.createOrder.id;

      // Test billing calculation
      const billingCalculationQuery = `
        query CalculateBilling($orderId: String!, $discount: Float, $taxRate: Float) {
          calculateBilling(orderId: $orderId, discount: $discount, taxRate: $taxRate) {
            subtotal
            discount_amount
            tax_amount
            total_amount
            breakdown {
              items_total
              services_total
              discount
              tax
              final_total
            }
          }
        }
      `;

      const billingResponse = await axios.post(apiUrl, {
        query: billingCalculationQuery,
        variables: {
          orderId: createdOrderId,
          discount: 10, // 10% discount
          taxRate: 7 // 7% tax
        }
      }, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });

      expect(billingResponse.status).toBe(200);
      
      const billing = billingResponse.data.data?.calculateBilling;
      expect(billing).toBeDefined();
      
      // Verify calculations
      const expectedSubtotal = 800; // 250 + 250 + 300
      const expectedDiscount = 80; // 10% of 800
      const expectedTaxableAmount = 720; // 800 - 80
      const expectedTax = 50.4; // 7% of 720
      const expectedTotal = 770.4; // 720 + 50.4

      expect(billing.subtotal).toBe(expectedSubtotal);
      expect(billing.discount_amount).toBe(expectedDiscount);
      expect(billing.tax_amount).toBeCloseTo(expectedTax, 2);
      expect(billing.total_amount).toBeCloseTo(expectedTotal, 2);
    });
  });

  describe('IT-007: Payment Processing', () => {
    it('should process payment and update order status correctly', async () => {
      if (!createdOrderId) {
        // Create order first
        const createOrderMutation = `
          mutation CreateOrder($input: CreateOrderInput!) {
            createOrder(input: $input) {
              id
              total_amount
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
                  productId: 'med_001',
                  quantity: 10,
                  unit_price: 50,
                  total_price: 500,
                  product_name: 'Test Medication',
                  product_unit: 'tablet'
                }
              ]
            }
          }
        }, {
          headers: { 'Authorization': `Bearer ${authToken}` }
        });

        createdOrderId = orderResponse.data.data.createOrder.id;
      }

      // Process payment
      const processPaymentMutation = `
        mutation ProcessPayment($input: CreatePaymentInput!) {
          processPayment(input: $input) {
            id
            payment_type
            amount
            payment_date
            details
            status
            order {
              id
              total_amount
              status
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
            details: 'Full payment for order'
          }
        }
      }, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });

      expect(paymentResponse.status).toBe(200);
      expect(paymentResponse.data.data?.processPayment?.id).toBeDefined();
      expect(paymentResponse.data.data?.processPayment?.amount).toBe(500);
      expect(paymentResponse.data.data?.processPayment?.status).toBe('completed');
      
      createdPaymentId = paymentResponse.data.data.processPayment.id;

      // Verify order status is updated
      const getOrderQuery = `
        query GetOrder($id: String!) {
          order(id: $id) {
            id
            status
            total_amount
            payments {
              id
              amount
              payment_type
              status
            }
          }
        }
      `;

      const orderResponse = await axios.post(apiUrl, {
        query: getOrderQuery,
        variables: { id: createdOrderId }
      }, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });

      expect(orderResponse.status).toBe(200);
      expect(orderResponse.data.data?.order?.status).toBe('paid');
      expect(orderResponse.data.data?.order?.payments).toBeDefined();
      expect(orderResponse.data.data?.order?.payments.length).toBeGreaterThan(0);
    });
  });

  describe('IT-008: Partial Payment Handling', () => {
    it('should handle partial payments correctly', async () => {
      // Create order with higher amount
      const createOrderMutation = `
        mutation CreateOrder($input: CreateOrderInput!) {
          createOrder(input: $input) {
            id
            total_amount
            status
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
                productId: 'med_001',
                quantity: 20,
                unit_price: 50,
                total_price: 1000,
                product_name: 'Expensive Medication',
                product_unit: 'tablet'
              }
            ]
          }
        }
      }, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });

      const partialOrderId = orderResponse.data.data.createOrder.id;

      // Make partial payment
      const partialPaymentMutation = `
        mutation ProcessPayment($input: CreatePaymentInput!) {
          processPayment(input: $input) {
            id
            payment_type
            amount
            status
            order {
              id
              status
              total_amount
            }
          }
        }
      `;

      const partialPaymentResponse = await axios.post(apiUrl, {
        query: partialPaymentMutation,
        variables: {
          input: {
            orderId: partialOrderId,
            payment_type: 'cash',
            amount: 600, // Partial payment
            details: 'Partial payment - 600 of 1000'
          }
        }
      }, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });

      expect(partialPaymentResponse.status).toBe(200);
      expect(partialPaymentResponse.data.data?.processPayment?.amount).toBe(600);

      // Verify order status shows partial payment
      const getOrderQuery = `
        query GetOrder($id: String!) {
          order(id: $id) {
            id
            status
            total_amount
            paid_amount
            remaining_amount
            payments {
              id
              amount
              payment_type
              status
            }
          }
        }
      `;

      const orderResponse = await axios.post(apiUrl, {
        query: getOrderQuery,
        variables: { id: partialOrderId }
      }, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });

      expect(orderResponse.status).toBe(200);
      expect(orderResponse.data.data?.order?.status).toBe('partially_paid');
      expect(orderResponse.data.data?.order?.paid_amount).toBe(600);
      expect(orderResponse.data.data?.order?.remaining_amount).toBe(400);

      // Make second payment to complete
      const secondPaymentResponse = await axios.post(apiUrl, {
        query: partialPaymentMutation,
        variables: {
          input: {
            orderId: partialOrderId,
            payment_type: 'cash',
            amount: 400, // Remaining amount
            details: 'Final payment - remaining 400'
          }
        }
      }, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });

      expect(secondPaymentResponse.status).toBe(200);

      // Verify order is now fully paid
      const finalOrderResponse = await axios.post(apiUrl, {
        query: getOrderQuery,
        variables: { id: partialOrderId }
      }, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });

      expect(finalOrderResponse.status).toBe(200);
      expect(finalOrderResponse.data.data?.order?.status).toBe('paid');
      expect(finalOrderResponse.data.data?.order?.remaining_amount).toBe(0);

      // Clean up
      const deleteOrderMutation = `
        mutation DeleteOrder($id: String!) {
          deleteOrder(id: $id)
        }
      `;

      await axios.post(apiUrl, {
        query: deleteOrderMutation,
        variables: { id: partialOrderId }
      }, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
    });
  });

  describe('IT-009: Receipt Generation', () => {
    it('should generate receipt with correct information', async () => {
      if (!createdOrderId || !createdPaymentId) {
        // Create order and payment first
        const createOrderMutation = `
          mutation CreateOrder($input: CreateOrderInput!) {
            createOrder(input: $input) {
              id
              total_amount
            }
          }
        `;

        const orderResponse = await axios.post(apiUrl, {
          query: createOrderMutation,
          variables: {
            input: {
              patientId: createdPatientId,
              total_amount: 300,
              is_walkin: true,
              orderItems: [
                {
                  productId: 'med_001',
                  quantity: 6,
                  unit_price: 50,
                  total_price: 300,
                  product_name: 'Receipt Test Medication',
                  product_unit: 'tablet'
                }
              ]
            }
          }
        }, {
          headers: { 'Authorization': `Bearer ${authToken}` }
        });

        const receiptOrderId = orderResponse.data.data.createOrder.id;

        const processPaymentMutation = `
          mutation ProcessPayment($input: CreatePaymentInput!) {
            processPayment(input: $input) {
              id
              amount
            }
          }
        `;

        const paymentResponse = await axios.post(apiUrl, {
          query: processPaymentMutation,
          variables: {
            input: {
              orderId: receiptOrderId,
              payment_type: 'cash',
              amount: 300,
              details: 'Payment for receipt test'
            }
          }
        }, {
          headers: { 'Authorization': `Bearer ${authToken}` }
        });

        createdOrderId = receiptOrderId;
        createdPaymentId = paymentResponse.data.data.processPayment.id;
      }

      // Generate receipt
      const generateReceiptQuery = `
        query GenerateReceipt($orderId: String!) {
          generateReceipt(orderId: $orderId) {
            receipt_number
            receipt_date
            patient {
              id
              first_name
              last_name
              national_id
            }
            order {
              id
              order_date
              total_amount
              orderItems {
                id
                product_name
                quantity
                unit_price
                total_price
              }
            }
            payments {
              id
              payment_type
              amount
              payment_date
            }
            subtotal
            tax_amount
            total_amount
            clinic_info {
              name
              address
              phone
              tax_id
            }
          }
        }
      `;

      const receiptResponse = await axios.post(apiUrl, {
        query: generateReceiptQuery,
        variables: { orderId: createdOrderId }
      }, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });

      expect(receiptResponse.status).toBe(200);
      
      const receipt = receiptResponse.data.data?.generateReceipt;
      expect(receipt).toBeDefined();
      expect(receipt.receipt_number).toBeDefined();
      expect(receipt.receipt_date).toBeDefined();
      expect(receipt.patient).toBeDefined();
      expect(receipt.order).toBeDefined();
      expect(receipt.payments).toBeDefined();
      expect(receipt.clinic_info).toBeDefined();
      expect(receipt.total_amount).toBe(300);
    });
  });

  describe('IT-010: Refund Processing', () => {
    it('should process refunds correctly', async () => {
      // Create order and payment for refund test
      const createOrderMutation = `
        mutation CreateOrder($input: CreateOrderInput!) {
          createOrder(input: $input) {
            id
            total_amount
          }
        }
      `;

      const orderResponse = await axios.post(apiUrl, {
        query: createOrderMutation,
        variables: {
          input: {
            patientId: createdPatientId,
            total_amount: 200,
            is_walkin: true,
            orderItems: [
              {
                productId: 'med_001',
                quantity: 4,
                unit_price: 50,
                total_price: 200,
                product_name: 'Refund Test Medication',
                product_unit: 'tablet'
              }
            ]
          }
        }
      }, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });

      const refundOrderId = orderResponse.data.data.createOrder.id;

      // Process payment
      const processPaymentMutation = `
        mutation ProcessPayment($input: CreatePaymentInput!) {
          processPayment(input: $input) {
            id
            amount
          }
        }
      `;

      const paymentResponse = await axios.post(apiUrl, {
        query: processPaymentMutation,
        variables: {
          input: {
            orderId: refundOrderId,
            payment_type: 'cash',
            amount: 200,
            details: 'Payment for refund test'
          }
        }
      }, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });

      const paymentId = paymentResponse.data.data.processPayment.id;

      // Process refund
      const processRefundMutation = `
        mutation ProcessRefund($input: RefundInput!) {
          processRefund(input: $input) {
            id
            refund_amount
            refund_reason
            refund_date
            status
            original_payment {
              id
              amount
            }
          }
        }
      `;

      const refundResponse = await axios.post(apiUrl, {
        query: processRefundMutation,
        variables: {
          input: {
            paymentId: paymentId,
            refund_amount: 200,
            refund_reason: 'Patient requested refund',
            refund_method: 'cash'
          }
        }
      }, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });

      expect(refundResponse.status).toBe(200);
      expect(refundResponse.data.data?.processRefund?.id).toBeDefined();
      expect(refundResponse.data.data?.processRefund?.refund_amount).toBe(200);
      expect(refundResponse.data.data?.processRefund?.status).toBe('completed');

      // Verify order status is updated to refunded
      const getOrderQuery = `
        query GetOrder($id: String!) {
          order(id: $id) {
            id
            status
            total_amount
            refunds {
              id
              refund_amount
              refund_reason
              status
            }
          }
        }
      `;

      const orderResponse = await axios.post(apiUrl, {
        query: getOrderQuery,
        variables: { id: refundOrderId }
      }, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });

      expect(orderResponse.status).toBe(200);
      expect(orderResponse.data.data?.order?.status).toBe('refunded');
      expect(orderResponse.data.data?.order?.refunds).toBeDefined();
      expect(orderResponse.data.data?.order?.refunds.length).toBeGreaterThan(0);

      // Clean up
      const deleteOrderMutation = `
        mutation DeleteOrder($id: String!) {
          deleteOrder(id: $id)
        }
      `;

      await axios.post(apiUrl, {
        query: deleteOrderMutation,
        variables: { id: refundOrderId }
      }, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
    });
  });
});

