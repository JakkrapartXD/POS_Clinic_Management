export const typeDefs = /* GraphQL */ `
  scalar DateTime
  scalar Float

  # User Types
  type User {
    id: String!
    role: String!
    email: String!
    username: String!
    status: String!
    created_at: DateTime!
    updated_at: DateTime!
    medicalRecords: [MedicalRecord!]!
    appointments: [Appointment!]!
    purchases: [Purchase!]!
    orders: [Order!]!
    treatmentPlans: [TreatmentPlan!]!
  }

  input CreateUserInput {
    role: String!
    email: String!
    username: String!
    password: String!
    status: String = "active"
  }

  input UpdateUserInput {
    role: String
    email: String
    username: String
    password: String
    status: String
  }

  # Patient Types
  type Patient {
    id: String!
    first_name: String!
    last_name: String!
    date_of_birth: DateTime
    gender: String
    phone: String
    email: String
    address: String
    created_at: DateTime!
    updated_at: DateTime!
    appointments: [Appointment!]!
    medicalRecords: [MedicalRecord!]!
    orders: [Order!]!
    treatmentPlans: [TreatmentPlan!]!
  }

  input CreatePatientInput {
    first_name: String!
    last_name: String!
    date_of_birth: DateTime
    gender: String
    phone: String
    email: String
    address: String
  }

  input UpdatePatientInput {
    first_name: String
    last_name: String
    date_of_birth: DateTime
    gender: String
    phone: String
    email: String
    address: String
  }

  # Product Types
  type Product {
    id: String!
    product_name: String!
    product_type: String
    generic_name: String
    short_name: String
    status: String
    vat_percent: Float
    expiration_warning_date: DateTime
    sale_price: Float!
    unit: String
    pack_size: String
    reorder_point: Int
    cost: Float
    sku: String
    barcode: String
    stock_quantity: Int!
    volume: Float
    volume_unit: String
    shelf_code: String
    shelf_row: String
    category: String
    symptom_category: String
    license_number: String
    dosage_unit: String
    dosage: String
    times_per_day: Int
    interval_hours: Int
    before_meal: Boolean
    after_meal: Boolean
    after_meal_immediate: Boolean
    morning: Boolean
    noon: Boolean
    evening: Boolean
    before_bed: Boolean
    properties: String
    usage_instruction: String
    sale_note: String
    purchase_note: String
    created_at: DateTime!
    updated_at: DateTime!
    orderItems: [OrderItem!]!
    purchaseItems: [PurchaseItem!]!
    prescriptions: [Prescription!]!
    stockMovements: [StockMovement!]!
    salesReports: [SalesReport!]!
    stockAlerts: [StockAlert!]!
  }

  input CreateProductInput {
    product_name: String!
    product_type: String
    generic_name: String
    short_name: String
    status: String = "active"
    vat_percent: Float = 0
    expiration_warning_date: DateTime
    sale_price: Float!
    unit: String
    pack_size: String
    reorder_point: Int
    cost: Float
    sku: String
    barcode: String
    stock_quantity: Int = 0
    volume: Float
    volume_unit: String
    shelf_code: String
    shelf_row: String
    category: String
    symptom_category: String
    license_number: String
    dosage_unit: String
    dosage: String
    times_per_day: Int
    interval_hours: Int
    before_meal: Boolean
    after_meal: Boolean
    after_meal_immediate: Boolean
    morning: Boolean
    noon: Boolean
    evening: Boolean
    before_bed: Boolean
    properties: String
    usage_instruction: String
    sale_note: String
    purchase_note: String
  }

  input UpdateProductInput {
    product_name: String
    product_type: String
    generic_name: String
    short_name: String
    status: String
    vat_percent: Float
    expiration_warning_date: DateTime
    sale_price: Float
    unit: String
    pack_size: String
    reorder_point: Int
    cost: Float
    sku: String
    barcode: String
    stock_quantity: Int
    volume: Float
    volume_unit: String
    shelf_code: String
    shelf_row: String
    category: String
    symptom_category: String
    license_number: String
    dosage_unit: String
    dosage: String
    times_per_day: Int
    interval_hours: Int
    before_meal: Boolean
    after_meal: Boolean
    after_meal_immediate: Boolean
    morning: Boolean
    noon: Boolean
    evening: Boolean
    before_bed: Boolean
    properties: String
    usage_instruction: String
    sale_note: String
    purchase_note: String
  }

  # Order Types
  type Order {
    id: String!
    user: User
    patient: Patient
    order_date: DateTime!
    status: String
    total_amount: Float
    created_at: DateTime!
    updated_at: DateTime!
    orderItems: [OrderItem!]!
    payments: [Payment!]!
    invoice: Invoice
    is_walkin: Boolean!
  }

  type OrderItem {
    id: String!
    order: Order!
    product: Product!
    quantity: Int!
    unit_price: Float!
    total_price: Float!
  }

  input CreateOrderInput {
    patientId: String
    status: String = "completed"
    total_amount: Float
    is_walkin: Boolean = false
    orderItems: [CreateOrderItemInput!]!
  }

  input CreateOrderItemInput {
    productId: String!
    quantity: Int!
    unit_price: Float!
    total_price: Float!
  }

  input UpdateOrderInput {
    patientId: String
    status: String
    total_amount: Float
    is_walkin: Boolean
  }

  # Payment & Invoice Types
  type Payment {
    id: String!
    order: Order!
    payment_type: String!
    amount: Float!
    payment_date: DateTime!
    details: String
    invoice: Invoice
  }

  type Invoice {
    id: String!
    order: Order!
    payment: Payment
    invoice_number: String!
    issued_at: DateTime!
    total_amount: Float!
    createdByUserId: String
    created_by_username: String
  }

  input CreatePaymentInput {
    orderId: String!
    payment_type: String!
    amount: Float!
    details: String
  }

  # Supplier & Purchase Types
  type Supplier {
    id: String!
    name: String!
    contact_name: String
    phone: String
    email: String
    address: String
    created_at: DateTime!
    updated_at: DateTime!
    purchases: [Purchase!]!
  }

  type Purchase {
    id: String!
    supplier: Supplier!
    user: User
    purchase_date: DateTime!
    total_amount: Float
    status: String
    created_at: DateTime!
    updated_at: DateTime!
    purchaseItems: [PurchaseItem!]!
  }

  type PurchaseItem {
    id: String!
    purchase: Purchase!
    product: Product!
    quantity: Int!
    unit_cost: Float!
    total_cost: Float!
  }

  input CreateSupplierInput {
    name: String!
    contact_name: String
    phone: String
    email: String
    address: String
  }

  input UpdateSupplierInput {
    name: String
    contact_name: String
    phone: String
    email: String
    address: String
  }

  input CreatePurchaseInput {
    supplierId: String!
    total_amount: Float
    status: String = "received"
    purchaseItems: [CreatePurchaseItemInput!]!
  }

  input CreatePurchaseItemInput {
    productId: String!
    quantity: Int!
    unit_cost: Float!
    total_cost: Float!
  }

  # Stock Management Types
  type StockMovement {
    id: String!
    product: Product!
    movement_type: String!
    quantity: Int!
    reference_table: String
    reference_id: String
    note: String
    created_at: DateTime!
    createdByUserId: String
    created_by_username: String
  }

  type StockAlert {
    id: String!
    product: Product!
    alert_type: String
    alert_message: String
    created_at: DateTime!
    createdByUserId: String
    created_by_username: String
    acknowledged: Boolean!
    acknowledged_at: DateTime
  }

  input CreateStockMovementInput {
    productId: String!
    movement_type: String!
    quantity: Int!
    reference_table: String
    reference_id: String
    note: String
  }

  # Medical Types
  type Appointment {
    id: String!
    patient: Patient!
    doctor: User!
    appointment_time: DateTime!
    status: String
    reason: String
    created_at: DateTime!
    updated_at: DateTime!
    medicalRecords: [MedicalRecord!]!
  }

  type MedicalRecord {
    id: String!
    patient: Patient!
    doctor: User!
    appointment: Appointment
    symptoms: String
    diagnosis: String
    treatment: String
    notes: String
    created_at: DateTime!
    updated_at: DateTime!
    prescriptions: [Prescription!]!
  }

  type Prescription {
    id: String!
    medicalRecord: MedicalRecord!
    product: Product!
    dosage: String
    dosage_unit: String
    times_per_day: Int
    duration_days: Int
    instructions: String
  }

  type TreatmentPlan {
    id: String!
    patient: Patient!
    doctor: User!
    plan_details: String
    start_date: DateTime
    end_date: DateTime
    created_at: DateTime!
    updated_at: DateTime!
  }

  input CreateAppointmentInput {
    patientId: String!
    doctorId: String!
    appointment_time: DateTime!
    status: String = "scheduled"
    reason: String
  }

  input UpdateAppointmentInput {
    appointment_time: DateTime
    status: String
    reason: String
  }

  input CreateMedicalRecordInput {
    patientId: String!
    doctorId: String!
    appointmentId: String
    symptoms: String
    diagnosis: String
    treatment: String
    notes: String
  }

  input UpdateMedicalRecordInput {
    symptoms: String
    diagnosis: String
    treatment: String
    notes: String
  }

  input CreatePrescriptionInput {
    medicalRecordId: String!
    productId: String!
    dosage: String
    dosage_unit: String
    times_per_day: Int
    duration_days: Int
    instructions: String
  }

  input CreateTreatmentPlanInput {
    patientId: String!
    doctorId: String!
    plan_details: String
    start_date: DateTime
    end_date: DateTime
  }

  input UpdateTreatmentPlanInput {
    plan_details: String
    start_date: DateTime
    end_date: DateTime
  }

  # Report Types
  type DailyReport {
    id: String!
    report_date: DateTime!
    total_sales: Float
    total_orders: Int
    total_patients: Int
    created_at: DateTime!
    createdByUserId: String
    created_by_username: String
  }

  type SalesReport {
    id: String!
    report_date: DateTime!
    product: Product!
    quantity_sold: Int
    total_sales: Float
    created_at: DateTime!
    createdByUserId: String
    created_by_username: String
  }

  # Pagination & Filtering
  input PaginationInput {
    skip: Int = 0
    take: Int = 10
  }

  input UserFilterInput {
    role: String
    status: String
    email: String
    username: String
  }

  input ProductFilterInput {
    product_type: String
    category: String
    status: String
    low_stock: Boolean
  }

  input OrderFilterInput {
    status: String
    is_walkin: Boolean
    date_from: DateTime
    date_to: DateTime
  }

  # Response Types
  type UsersResponse {
    users: [User!]!
    total: Int!
  }

  type PatientsResponse {
    patients: [Patient!]!
    total: Int!
  }

  type ProductsResponse {
    products: [Product!]!
    total: Int!
  }

  type OrdersResponse {
    orders: [Order!]!
    total: Int!
  }

  # Queries
  type Query {
    # User Queries
    users(filter: UserFilterInput, pagination: PaginationInput): UsersResponse!
    user(id: String!): User
    me: User

    # Patient Queries
    patients(pagination: PaginationInput): PatientsResponse!
    patient(id: String!): Patient
    searchPatients(query: String!): [Patient!]!

    # Product Queries
    products(filter: ProductFilterInput, pagination: PaginationInput): ProductsResponse!
    product(id: String!): Product
    searchProducts(query: String!): [Product!]!
    lowStockProducts: [Product!]!

    # Order Queries
    orders(filter: OrderFilterInput, pagination: PaginationInput): OrdersResponse!
    order(id: String!): Order
    patientOrders(patientId: String!): [Order!]!

    # Supplier & Purchase Queries
    suppliers(pagination: PaginationInput): [Supplier!]!
    supplier(id: String!): Supplier
    purchases(pagination: PaginationInput): [Purchase!]!
    purchase(id: String!): Purchase

    # Medical Queries
    appointments(pagination: PaginationInput): [Appointment!]!
    appointment(id: String!): Appointment
    patientAppointments(patientId: String!): [Appointment!]!
    doctorAppointments(doctorId: String!): [Appointment!]!

    medicalRecords(patientId: String, pagination: PaginationInput): [MedicalRecord!]!
    medicalRecord(id: String!): MedicalRecord

    treatmentPlans(patientId: String, pagination: PaginationInput): [TreatmentPlan!]!
    treatmentPlan(id: String!): TreatmentPlan

    # Stock & Reports
    stockMovements(productId: String, pagination: PaginationInput): [StockMovement!]!
    stockAlerts(acknowledged: Boolean, pagination: PaginationInput): [StockAlert!]!
    
    dailyReports(date_from: DateTime, date_to: DateTime): [DailyReport!]!
    salesReports(date_from: DateTime, date_to: DateTime, productId: String): [SalesReport!]!
  }

  # Mutations
  type Mutation {
    # User Mutations
    createUser(input: CreateUserInput!): User!
    updateUser(id: String!, input: UpdateUserInput!): User!
    deleteUser(id: String!): Boolean!

    # Patient Mutations
    createPatient(input: CreatePatientInput!): Patient!
    updatePatient(id: String!, input: UpdatePatientInput!): Patient!
    deletePatient(id: String!): Boolean!

    # Product Mutations
    createProduct(input: CreateProductInput!): Product!
    updateProduct(id: String!, input: UpdateProductInput!): Product!
    deleteProduct(id: String!): Boolean!
    adjustStock(productId: String!, quantity: Int!, note: String): StockMovement!

    # Order Mutations
    createOrder(input: CreateOrderInput!): Order!
    updateOrder(id: String!, input: UpdateOrderInput!): Order!
    deleteOrder(id: String!): Boolean!
    processPayment(input: CreatePaymentInput!): Payment!

    # Supplier & Purchase Mutations
    createSupplier(input: CreateSupplierInput!): Supplier!
    updateSupplier(id: String!, input: UpdateSupplierInput!): Supplier!
    deleteSupplier(id: String!): Boolean!

    createPurchase(input: CreatePurchaseInput!): Purchase!
    receivePurchase(id: String!): Purchase!

    # Medical Mutations
    createAppointment(input: CreateAppointmentInput!): Appointment!
    updateAppointment(id: String!, input: UpdateAppointmentInput!): Appointment!
    deleteAppointment(id: String!): Boolean!

    createMedicalRecord(input: CreateMedicalRecordInput!): MedicalRecord!
    updateMedicalRecord(id: String!, input: UpdateMedicalRecordInput!): MedicalRecord!
    deleteMedicalRecord(id: String!): Boolean!

    createPrescription(input: CreatePrescriptionInput!): Prescription!
    deletePrescription(id: String!): Boolean!

    createTreatmentPlan(input: CreateTreatmentPlanInput!): TreatmentPlan!
    updateTreatmentPlan(id: String!, input: UpdateTreatmentPlanInput!): TreatmentPlan!
    deleteTreatmentPlan(id: String!): Boolean!

    # Stock Management
    acknowledgeStockAlert(id: String!): StockAlert!
    generateDailyReport(date: DateTime!): DailyReport!
  }
`; 