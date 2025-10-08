import { TEST_CONFIG, generateTestUser, generateTestPatient } from '../setup';

// Simple integration test using fetch API directly
describe('Queue Flow Integration Tests - Simple Version', () => {
  const apiUrl = `${TEST_CONFIG.API_BASE_URL}/graphql`;
  
  // Test data - ตาม queue-system.spec.ts
  const timestamp = Date.now();
  const testUser = generateTestUser();
  const testPatient = {
    first_name: `ผู้ป่วยคิวทดสอบ_${timestamp}`,
    last_name: 'นามสกุลคิวทดสอบ',
    nickname: `ชื่อเล่น_${timestamp}`,
    national_id: `${timestamp}`,
    phone: `08${Math.floor(Math.random() * 100000000).toString().padStart(8, '0')}`,
    email: `queue_patient_test_${timestamp}@example.com`,
    date_of_birth: '1990-01-01',
    gender: 'male',
    blood_group: 'O+',
    drug_allergies: 'Penicillin',
    address: '123 ถนนคิวทดสอบ แขวงคิวทดสอบ เขตคิวทดสอบ กรุงเทพฯ 10110',
    prefix: 'นาย',
    age: 30
  };
  
  let authToken: string;
  let createdPatientId: string;
  let createdVisitId: string;
  let createdOrderId: string;

  // Helper function to make GraphQL requests
  const makeGraphQLRequest = async (query: string, variables: any = {}, token?: string) => {
    const headers: any = {
      'Content-Type': 'application/json',
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        query,
        variables
      })
    });

    const result = await response.json();
    
    if (result.errors) {
      console.log('GraphQL Error:', JSON.stringify(result.errors, null, 2));
      console.log('Query:', query);
      console.log('Variables:', JSON.stringify(variables, null, 2));
      throw new Error(result.errors[0].message);
    }

    return {
      status: response.status,
      data: result.data
    };
  };

  beforeAll(async () => {
    try {
      // Use REST API for authentication (doctor01 from seed data)
      const authUrl = `${TEST_CONFIG.API_BASE_URL}/auth/sign-in`;
      
      const loginResponse = await fetch(authUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: 'doctor01',
          password: 'doctor123'
        })
      });

      const loginResult = await loginResponse.json();
      
      if (!loginResult.success) {
        throw new Error(loginResult.error || 'Authentication failed');
      }

      authToken = loginResult.token;
      expect(authToken).toBeDefined();
    } catch (error) {
      console.log('Setup failed:', error);
    }
  });

  afterAll(async () => {
    // Cleanup test data - DISABLED to keep test data for verification
    /*
    if (createdOrderId) {
      try {
        const deleteOrderMutation = `
          mutation DeleteOrder($id: String!) {
            deleteOrder(id: $id)
          }
        `;
        await makeGraphQLRequest(deleteOrderMutation, { id: createdOrderId }, authToken);
      } catch (error) {
        console.log('Order cleanup failed:', error);
      }
    }

    if (createdVisitId) {
      try {
        const deleteVisitMutation = `
          mutation DeleteVisit($id: String!) {
            deleteVisit(id: $id)
          }
        `;
        await makeGraphQLRequest(deleteVisitMutation, { id: createdVisitId }, authToken);
      } catch (error) {
        console.log('Visit cleanup failed:', error);
      }
    }

    if (createdPatientId) {
      try {
        const deletePatientMutation = `
          mutation DeletePatient($id: String!) {
            deletePatient(id: $id)
          }
        `;
        await makeGraphQLRequest(deletePatientMutation, { id: createdPatientId }, authToken);
      } catch (error) {
        console.log('Patient cleanup failed:', error);
      }
    }
    */
    console.log('Test data cleanup disabled - data preserved for verification');
  });

  describe('IT-001: Complete Patient Flow', () => {
    it('should complete full patient flow: register → visit → prescription → order → payment', async () => {
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
            created_at
          }
        }
      `;

      const patientResponse = await makeGraphQLRequest(createPatientMutation, { input: testPatient }, authToken);
      expect(patientResponse.status).toBe(200);
      expect(patientResponse.data.createPatient.id).toBeDefined();
      createdPatientId = patientResponse.data.createPatient.id;

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

      const visitResponse = await makeGraphQLRequest(createVisitMutation, {
        input: {
          patientId: createdPatientId
        }
      }, authToken);
      expect(visitResponse.status).toBe(200);
      expect(visitResponse.data.createVisit.id).toBeDefined();
      createdVisitId = visitResponse.data.createVisit.id;

      // Step 3: Update visit with medical record
      const updateVisitMutation = `
        mutation UpdateVisit($id: String!, $input: UpdateVisitInput!) {
          updateVisit(id: $id, input: $input) {
            id
            chief_complaint
            diagnosis
            notes
          }
        }
      `;

    //   const updateVisitResponse = await makeGraphQLRequest(updateVisitMutation, {
    //     id: createdVisitId,
    //     input: {
    //       chief_complaint: 'ปวดหัวและมีไข้',
    //       diagnosis: 'ไข้หวัดธรรมดา',
    //       notes: 'ให้ยาลดไข้และพักผ่อน'
    //     }
    //   }, authToken);
    //   expect(updateVisitResponse.status).toBe(200);
    //   expect(updateVisitResponse.data.updateVisit.diagnosis).toBe('ไข้หวัดธรรมดา');

      // Step 4: Create a test product first
      const createProductMutation = `
        mutation CreateProduct($input: CreateProductInput!) {
          createProduct(input: $input) {
            id
            product_name
            sale_price
            unit
            stock_quantity
          }
        }
      `;

      const productResponse = await makeGraphQLRequest(createProductMutation, {
        input: {
          product_name: 'ยาลดไข้',
          product_type: 'medication',
          sale_price: 100,
          unit: 'tablet',
          stock_quantity: 100,
          sku: `MED_${Date.now()}`
        }
      }, authToken);

      const productId = productResponse.data.createProduct.id;

      // Step 5: Create order with prescription items
      const createOrderMutation = `
        mutation CreateOrder($input: CreateOrderInput!) {
          createOrder(input: $input) {
            id
            order_date
            status
            total_amount
            orderItems {
              id
              product_name
              quantity
              unit_price
              total_price
            }
          }
        }
      `;

      const orderResponse = await makeGraphQLRequest(createOrderMutation, {
        input: {
          patientId: createdPatientId,
          total_amount: 200, // Add total_amount to fix payment processing
          orderItems: [
            {
              productId: productId,
              quantity: 2,
              unit_price: 100, // Use the product's sale price
              total_price: 200 // quantity * unit_price
            }
          ]
        }
      }, authToken);
      expect(orderResponse.status).toBe(200);
      expect(orderResponse.data.createOrder.id).toBeDefined();
      createdOrderId = orderResponse.data.createOrder.id;

      // Step 6: Get order details to check total amount
      const getOrderQuery = `
        query GetOrder($id: String!) {
          order(id: $id) {
            id
            status
            total_amount
            orderItems {
              id
              product_name
              quantity
              unit_price
              total_price
            }
          }
        }
      `;

      const orderDetailsResponse = await makeGraphQLRequest(getOrderQuery, { id: createdOrderId }, authToken);
      console.log('Order details:', JSON.stringify(orderDetailsResponse.data.order, null, 2));
      
      // Calculate total from order items if order total is null
      const orderTotal = orderDetailsResponse.data.order.total_amount || 
        orderDetailsResponse.data.order.orderItems.reduce((sum: number, item: any) => sum + item.total_price, 0);
      
      console.log('Calculated order total:', orderTotal);

      // Step 7: Process payment
      const processPaymentMutation = `
        mutation ProcessPayment($input: CreatePaymentInput!) {
          processPayment(input: $input) {
            id
            payment_type
            amount
            payment_date
            order {
              id
              total_amount
              status
            }
          }
        }
      `;

      const paymentResponse = await makeGraphQLRequest(processPaymentMutation, {
        input: {
          orderId: createdOrderId,
          payment_type: 'cash',
          amount: orderTotal, // Use the actual order total
          details: 'การชำระเงินสำหรับยาลดไข้'
        }
      }, authToken);
      expect(paymentResponse.status).toBe(200);
      expect(paymentResponse.data.processPayment.id).toBeDefined();

      // Verify the order status is updated
      const getOrderVerificationQuery = `
        query GetOrder($id: String!) {
          order(id: $id) {
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
      `;

      const orderVerificationResponse = await makeGraphQLRequest(getOrderVerificationQuery, { id: createdOrderId }, authToken);
      expect(orderVerificationResponse.status).toBe(200);
      expect(orderVerificationResponse.data.order.status).toBe('completed'); // Order status remains 'completed' after payment
      expect(orderVerificationResponse.data.order.payments.length).toBeGreaterThan(0);
    });
  });

  describe('IT-002: Complete Queue System Flow (Triage → Doctor → Cashier)', () => {
    it('should handle complete queue flow: triage → doctor → cashier', async () => {
      // Create a unique patient for this test - ตาม queue-system.spec.ts
      const timestamp2 = Date.now() + 1;
      const uniqueTestPatient = {
        first_name: `ผู้ป่วยคิวทดสอบ2_${timestamp2}`,
        last_name: 'นามสกุลคิวทดสอบ2',
        nickname: `ชื่อเล่น2_${timestamp2}`,
        national_id: `${timestamp2}`,
        phone: `08${Math.floor(Math.random() * 100000000).toString().padStart(8, '0')}`,
        email: `queue_patient_test2_${timestamp2}@example.com`,
        date_of_birth: '1995-01-01',
        gender: 'female',
        blood_group: 'A+',
        drug_allergies: 'Aspirin',
        address: '456 ถนนคิวทดสอบ2 แขวงคิวทดสอบ2 เขตคิวทดสอบ2 กรุงเทพฯ 10120',
        prefix: 'นาง',
        age: 25
      };

      const createPatientMutation = `
        mutation CreatePatient($input: CreatePatientInput!) {
          createPatient(input: $input) {
            id
            first_name
            last_name
          }
        }
      `;

      const patientResponse = await makeGraphQLRequest(createPatientMutation, { input: uniqueTestPatient }, authToken);
      const patientId = patientResponse.data.createPatient.id;

      // ===== STEP 1: Create Triage Ticket =====
      console.log('🏥 Step 1: Creating triage ticket');
      const createTriageTicketMutation = `
        mutation CreateTriageTicket($patientId: ID!, $priority: Int) {
          createTriageTicket(patientId: $patientId, priority: $priority) {
            id
            number
            status
            station
            patientId
            priority
            created_at
          }
        }
      `;

      const triageResponse = await makeGraphQLRequest(createTriageTicketMutation, {
        patientId,
        priority: 1
      }, authToken);
      expect(triageResponse.status).toBe(200);
      expect(triageResponse.data.createTriageTicket.id).toBeDefined();
      const triageTicketId = triageResponse.data.createTriageTicket.id;
      console.log('✅ Triage ticket created:', triageTicketId);

      // Call patient for triage
      const queueCallMutation = `
        mutation QueueCall($ticketId: ID!) {
          queueCall(ticketId: $ticketId) {
            id
            status
            called_at
          }
        }
      `;

      const callResponse = await makeGraphQLRequest(queueCallMutation, { ticketId: triageTicketId }, authToken);
      expect(callResponse.status).toBe(200);
      expect(callResponse.data.queueCall.status).toBe('called');

      // Start triage consultation
      const queueStartMutation = `
        mutation QueueStart($ticketId: ID!) {
          queueStart(ticketId: $ticketId) {
            id
            status
            started_at
          }
        }
      `;

      const startResponse = await makeGraphQLRequest(queueStartMutation, { ticketId: triageTicketId }, authToken);
      expect(startResponse.status).toBe(200);
      expect(startResponse.data.queueStart.status).toBe('in_service');

      // Complete triage consultation
      const queueCompleteMutation = `
        mutation QueueComplete($ticketId: ID!) {
          queueComplete(ticketId: $ticketId) {
            id
            status
            done_at
          }
        }
      `;

      // ===== STEP 1.5: Record Vitals (ตาม queue-system.spec.ts) =====
      console.log('📊 Step 1.5: Recording vitals');
      
      // First create a visit for vitals recording
      const createVisitForVitalsMutation = `
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

      const visitForVitalsResponse = await makeGraphQLRequest(createVisitForVitalsMutation, {
        input: {
          patientId: patientId
        }
      }, authToken);
      expect(visitForVitalsResponse.status).toBe(200);
      const visitForVitalsId = visitForVitalsResponse.data.createVisit.id;
      console.log('✅ Visit for vitals created:', visitForVitalsId);

      // Record vitals (ตามข้อมูลใน queue-system.spec.ts)
      const upsertVitalsMutation = `
        mutation UpsertVitals($input: UpsertVitalsInput!) {
          upsertVitals(input: $input) {
            id
            visitId
            heightCm
            weightKg
            tempC
            sbp
            dbp
            hr
            rr
            spo2
            bmi
            created_at
            updated_at
          }
        }
      `;

      const vitalsResponse = await makeGraphQLRequest(upsertVitalsMutation, {
        input: {
          visitId: visitForVitalsId,
          heightCm: 175,    // ส่วนสูง 175 cm
          weightKg: 75,     // น้ำหนัก 75 kg
          tempC: 36.8,      // อุณหภูมิ 36.8 °C
          sbp: 125,         // SBP 125 mmHg
          dbp: 85,          // DBP 85 mmHg
          hr: 80,           // อัตราการเต้นหัวใจ 80 bpm
          rr: 18,           // Respiratory Rate 18
          spo2: 99,         // SpO2 99%
          bmi: 24.49        // BMI = 75 / (1.75)^2 = 24.49
        }
      }, authToken);
      expect(vitalsResponse.status).toBe(200);
      expect(vitalsResponse.data.upsertVitals.id).toBeDefined();
      console.log('✅ Vitals recorded successfully');
      console.log('- Height:', vitalsResponse.data.upsertVitals.heightCm, 'cm');
      console.log('- Weight:', vitalsResponse.data.upsertVitals.weightKg, 'kg');
      console.log('- Temperature:', vitalsResponse.data.upsertVitals.tempC, '°C');
      console.log('- Blood Pressure:', vitalsResponse.data.upsertVitals.sbp + '/' + vitalsResponse.data.upsertVitals.dbp, 'mmHg');
      console.log('- Heart Rate:', vitalsResponse.data.upsertVitals.hr, 'bpm');
      console.log('- SpO2:', vitalsResponse.data.upsertVitals.spo2, '%');
      console.log('- BMI:', vitalsResponse.data.upsertVitals.bmi);

      // ===== STEP 1.6: Update Visit with Triage Assessment =====
      console.log('📝 Step 1.6: Updating visit with triage assessment');
      
      const updateVisitMutation = `
        mutation UpdateVisit($id: String!, $input: UpdateVisitInput!) {
          updateVisit(id: $id, input: $input) {
            id
            chief_complaint
            diagnosis
            notes
            status
            patient {
              id
              first_name
              last_name
            }
          }
        }
      `;

      const updateVisitResponse = await makeGraphQLRequest(updateVisitMutation, {
        id: visitForVitalsId,
        input: {
          chief_complaint: 'Triage Assessment',
          diagnosis: 'Initial Assessment',
          notes: 'Patient assessed and vitals recorded'
        }
      }, authToken);
      expect(updateVisitResponse.status).toBe(200);
      expect(updateVisitResponse.data.updateVisit.chief_complaint).toBe('Triage Assessment');
      console.log('✅ Visit updated with triage assessment');

      const completeResponse = await makeGraphQLRequest(queueCompleteMutation, { ticketId: triageTicketId }, authToken);
      expect(completeResponse.status).toBe(200);
      expect(completeResponse.data.queueComplete.status).toBe('done');
      console.log('✅ Triage consultation completed');

      // ===== STEP 2: Create Doctor Queue Ticket =====
      console.log('👨‍⚕️ Step 2: Creating doctor queue ticket');
      
      // First create a visit for the doctor queue
      const createVisitForDoctorMutation = `
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

      const visitForDoctorResponse = await makeGraphQLRequest(createVisitForDoctorMutation, {
        input: {
          patientId: patientId
        }
      }, authToken);
      expect(visitForDoctorResponse.status).toBe(200);
      const visitForDoctorId = visitForDoctorResponse.data.createVisit.id;
      console.log('✅ Visit for doctor created:', visitForDoctorId);

      const createDoctorTicketMutation = `
        mutation CreateQueueTicket($input: CreateQueueTicketInput!) {
          createQueueTicket(input: $input) {
            id
            number
            status
            station
            patientId
            priority
            created_at
          }
        }
      `;

      const doctorResponse = await makeGraphQLRequest(createDoctorTicketMutation, {
        input: {
          visitId: visitForDoctorId,
          station: 'doctor',
          priority: 1
        }
      }, authToken);
      expect(doctorResponse.status).toBe(200);
      expect(doctorResponse.data.createQueueTicket.id).toBeDefined();
      const doctorTicketId = doctorResponse.data.createQueueTicket.id;
      console.log('✅ Doctor ticket created:', doctorTicketId);

      // Call patient for doctor consultation using updateQueueStatus
      const updateQueueStatusMutation = `
        mutation UpdateQueueStatus($id: String!, $status: QueueStatus!, $note: String) {
          updateQueueStatus(id: $id, status: $status, note: $note) {
            id
            status
            called_at
            started_at
            done_at
          }
        }
      `;

      const doctorCallResponse = await makeGraphQLRequest(updateQueueStatusMutation, { 
        id: doctorTicketId, 
        status: 'called' 
      }, authToken);
      expect(doctorCallResponse.status).toBe(200);
      expect(doctorCallResponse.data.updateQueueStatus.status).toBe('called');

      // Start doctor consultation
      const doctorStartResponse = await makeGraphQLRequest(updateQueueStatusMutation, { 
        id: doctorTicketId, 
        status: 'in_service' 
      }, authToken);
      expect(doctorStartResponse.status).toBe(200);
      expect(doctorStartResponse.data.updateQueueStatus.status).toBe('in_service');

      // ===== STEP 2.5: Update Visit with Doctor Consultation =====
      console.log('🩺 Step 2.5: Updating visit with doctor consultation');
      
    //   const updateDoctorVisitResponse = await makeGraphQLRequest(updateVisitMutation, {
    //     id: visitForDoctorId,
    //     input: {
    //       chief_complaint: 'ปวดหัวและมีไข้',
    //       diagnosis: 'ไข้หวัดธรรมดา',
    //       notes: 'ให้ยาลดไข้และพักผ่อน'
    //     }
    //   }, authToken);
    //   expect(updateDoctorVisitResponse.status).toBe(200);
    //   expect(updateDoctorVisitResponse.data.updateVisit.diagnosis).toBe('ไข้หวัดธรรมดา');
    //   console.log('✅ Visit updated with doctor consultation');

      // Complete doctor consultation
      const doctorCompleteResponse = await makeGraphQLRequest(updateQueueStatusMutation, { 
        id: doctorTicketId, 
        status: 'done' 
      }, authToken);
      expect(doctorCompleteResponse.status).toBe(200);
      expect(doctorCompleteResponse.data.updateQueueStatus.status).toBe('done');
      console.log('✅ Doctor consultation completed');

      // ===== STEP 3: Create Cashier Queue Ticket =====
      console.log('💰 Step 3: Creating cashier queue ticket');
      
      // First create a visit for the cashier queue
      const createVisitForCashierMutation = `
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

      const visitForCashierResponse = await makeGraphQLRequest(createVisitForCashierMutation, {
        input: {
          patientId: patientId
        }
      }, authToken);
      expect(visitForCashierResponse.status).toBe(200);
      const visitForCashierId = visitForCashierResponse.data.createVisit.id;
      console.log('✅ Visit for cashier created:', visitForCashierId);

      const createCashierTicketMutation = `
        mutation CreateQueueTicket($input: CreateQueueTicketInput!) {
          createQueueTicket(input: $input) {
            id
            number
            status
            station
            patientId
            priority
            created_at
          }
        }
      `;

      const cashierResponse = await makeGraphQLRequest(createCashierTicketMutation, {
        input: {
          visitId: visitForCashierId,
          station: 'cashier',
          priority: 1
        }
      }, authToken);
      expect(cashierResponse.status).toBe(200);
      expect(cashierResponse.data.createQueueTicket.id).toBeDefined();
      const cashierTicketId = cashierResponse.data.createQueueTicket.id;
      console.log('✅ Cashier ticket created:', cashierTicketId);

      // Call patient for cashier service using updateQueueStatus
      const cashierCallResponse = await makeGraphQLRequest(updateQueueStatusMutation, { 
        id: cashierTicketId, 
        status: 'called' 
      }, authToken);
      expect(cashierCallResponse.status).toBe(200);
      expect(cashierCallResponse.data.updateQueueStatus.status).toBe('called');

      // Start cashier service
      const cashierStartResponse = await makeGraphQLRequest(updateQueueStatusMutation, { 
        id: cashierTicketId, 
        status: 'in_service' 
      }, authToken);
      expect(cashierStartResponse.status).toBe(200);
      expect(cashierStartResponse.data.updateQueueStatus.status).toBe('in_service');

      // Complete cashier service
      const cashierCompleteResponse = await makeGraphQLRequest(updateQueueStatusMutation, { 
        id: cashierTicketId, 
        status: 'done' 
      }, authToken);
      expect(cashierCompleteResponse.status).toBe(200);
      expect(cashierCompleteResponse.data.updateQueueStatus.status).toBe('done');
      console.log('✅ Cashier service completed');

      // ===== STEP 4: Verify All Queue Tickets Status =====
      console.log('🔍 Step 4: Verifying all queue tickets status');
      
      // Verify triage ticket
      const getQueueTicketQuery = `
        query GetQueueTicket($id: String!) {
          queueTicket(id: $id) {
            id
            status
            station
            patientId
          }
        }
      `;

      const triageVerification = await makeGraphQLRequest(getQueueTicketQuery, { id: triageTicketId }, authToken);
      expect(triageVerification.data.queueTicket.status).toBe('done');
      expect(triageVerification.data.queueTicket.station).toBe('triage');

      // Verify doctor ticket
      const doctorVerification = await makeGraphQLRequest(getQueueTicketQuery, { id: doctorTicketId }, authToken);
      expect(doctorVerification.data.queueTicket.status).toBe('done');
      expect(doctorVerification.data.queueTicket.station).toBe('doctor');

      // Verify cashier ticket
      const cashierVerification = await makeGraphQLRequest(getQueueTicketQuery, { id: cashierTicketId }, authToken);
      expect(cashierVerification.data.queueTicket.status).toBe('done');
      expect(cashierVerification.data.queueTicket.station).toBe('cashier');

      console.log('✅ All queue tickets verified successfully');
      console.log('🎉 Complete queue flow test passed: Triage → Doctor → Cashier');

      // Cleanup - DISABLED to keep test data for verification
      /*
      try {
        const deletePatientMutation = `
          mutation DeletePatient($id: String!) {
            deletePatient(id: $id)
          }
        `;
        await makeGraphQLRequest(deletePatientMutation, { id: patientId }, authToken);
      } catch (error) {
        console.log('Patient cleanup failed:', error);
      }
      */
      console.log('Test data cleanup disabled - patient data preserved for verification');
    });
  });
});
