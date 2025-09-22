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
    avatar_url: String
    avatar_path: String
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
    national_id: String
    prefix: String
    nickname: String
    date_of_birth: DateTime
    age: Int
    gender: String
    blood_group: String
    phone: String
    email: String
    address: String
    subdistrict: String
    district: String
    province: String
    zip_code: String
    latitude: Float
    longitude: Float
    drug_allergies: String
    drug_allergies_other: String
    medical_conditions: String
    notes: String
    photo_url: String
    photo_path: String
    created_at: DateTime!
    updated_at: DateTime!
    appointments: [Appointment!]!
    medicalRecords: [MedicalRecord!]!
    orders: [Order!]!
    treatmentPlans: [TreatmentPlan!]!
    visits: [Visit!]!
    queueTickets: [QueueTicket!]!
  }

  input CreatePatientInput {
    first_name: String!
    last_name: String!
    national_id: String
    prefix: String
    nickname: String
    date_of_birth: DateTime
    age: Int
    gender: String
    blood_group: String
    phone: String
    email: String
    address: String
    subdistrict: String
    district: String
    province: String
    zip_code: String
    latitude: Float
    longitude: Float
    drug_allergies: String
    drug_allergies_other: String
    medical_conditions: String
    notes: String
    photo_url: String
    photo_path: String
  }

  input UpdatePatientInput {
    first_name: String
    last_name: String
    national_id: String
    prefix: String
    nickname: String
    date_of_birth: DateTime
    age: Int
    gender: String
    blood_group: String
    phone: String
    email: String
    address: String
    subdistrict: String
    district: String
    province: String
    zip_code: String
    latitude: Float
    longitude: Float
    drug_allergies: String
    drug_allergies_other: String
    medical_conditions: String
    notes: String
    photo_url: String
    photo_path: String
  }

  # Category Types
  type Category {
    id: String!
    name: String!
    description: String
    code: String
    created_at: DateTime!
    updated_at: DateTime!
    products: [Product!]!
  }

  input CreateCategoryInput {
    name: String!
    description: String
    code: String
  }

  input UpdateCategoryInput {
    name: String
    description: String
    code: String
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
    expiration_warning_date: Int
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
    category: Category
    categoryId: String
    symptom_category: String
    license_number: String
    dosage_unit: String
    dosage: String
    times_per_day: Int
    interval_hours: Int
    before_meal: Boolean
    after_meal: Boolean
    after_meal_immediate: Boolean
    morning: String
    noon: String
    evening: String
    before_bed: String
    properties: String
    usage_instruction: String
    sale_note: String
    purchase_note: String
    image_url: String
    image_path: String
    created_at: DateTime!
    updated_at: DateTime!
    orderItems: [OrderItem!]!
    purchaseItems: [PurchaseItem!]!
    prescriptions: [Prescription!]!
    stocks: [Stock!]!
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
    expiration_warning_date: Int
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
    categoryId: String
    symptom_category: String
    license_number: String
    dosage_unit: String
    dosage: String
    times_per_day: Int
    interval_hours: Int
    before_meal: Boolean
    after_meal: Boolean
    after_meal_immediate: Boolean
    morning: String
    noon: String
    evening: String
    before_bed: String
    properties: String
    usage_instruction: String
    sale_note: String
    purchase_note: String
    image_url: String
    production_date: DateTime
    expiration_date: DateTime
  }

  # Bulk import types
  input BulkImportProductsInput {
    products: [CreateProductInput!]!
    settings: ImportSettingsInput
  }

  input ImportSettingsInput {
    skipDuplicates: Boolean = true
    updateExisting: Boolean = false
    createBackup: Boolean = true
  }

  type ImportResult {
    success: Boolean!
    message: String!
    imported: Int!
    failed: Int!
    skipped: Int!
    errors: [String!]
    results: [ProductImportResult!]
  }

  type ProductImportResult {
    product: Product
    status: String!
    error: String
    sku: String
    product_name: String!
  }

  input UpdateProductInput {
    product_name: String
    product_type: String
    generic_name: String
    short_name: String
    status: String
    vat_percent: Float
    expiration_warning_date: Int
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
    categoryId: String
    symptom_category: String
    license_number: String
    dosage_unit: String
    dosage: String
    times_per_day: Int
    interval_hours: Int
    before_meal: Boolean
    after_meal: Boolean
    after_meal_immediate: Boolean
    morning: String
    noon: String
    evening: String
    before_bed: String
    properties: String
    usage_instruction: String
    sale_note: String
    purchase_note: String
    image_url: String
  }

  # Order Types
  type Order {
    id: String!
    user: User
    patient: Patient
    order_date: DateTime!
    status: String
    total_amount: Float
    vat_amount: Float!
    created_at: DateTime!
    updated_at: DateTime!
    orderItems: [OrderItem!]!
    payments: [Payment!]!
    invoice: Invoice
    is_walkin: Boolean!
    visitOrders: [VisitOrder!]!
  }

  type OrderItem {
    id: String!
    order: Order!
    product: Product!
    quantity: Int!
    unit_price: Float!
    total_price: Float!
    vat_percent: Float!
    vat_amount: Float!
    product_name: String
    product_unit: String
  }

  input CreateOrderInput {
    patientId: String
    status: String = "completed"
    total_amount: Float
    vat_amount: Float = 0
    is_walkin: Boolean = false
    orderItems: [CreateOrderItemInput!]!
  }

  input CreateOrderItemInput {
    productId: String!
    quantity: Int!
    unit_price: Float!
    total_price: Float!
    vat_percent: Float = 0
    vat_amount: Float = 0
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
    production_date: DateTime
    expiration_date: DateTime
  }

  input UpdatePurchaseInput {
    supplierId: String
    total_amount: Float
    status: String
  }

  # Stock Management Types
  type Stock {
    id: String!
    product: Product!
    quantity: Int!
    quantity_in: Int
    is_outofstock: Boolean!
    production_date: DateTime
    expiration_date: DateTime
    reference_table: String
    reference_id: String
    note: String
    created_at: DateTime!
    createdByUserId: String
    created_by_username: String
    product_name: String
    product_unit: String
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

  input CreateStockInput {
    productId: String!
    quantity: Int!
    quantity_in: Int
    is_outofstock: Boolean = false
    production_date: DateTime
    expiration_date: DateTime
    reference_table: String
    reference_id: String
    note: String
  }

  input UpdateStockInput {
    quantity: Int
    quantity_in: Int
    is_outofstock: Boolean
    production_date: DateTime
    expiration_date: DateTime
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
    visits: [Visit!]!
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

  # Report Generation Results
  type SalesReportGenerationResult {
    success: Boolean!
    message: String!
    reports: [SalesReport!]!
    count: Int!
  }

  type StockAlertGenerationResult {
    success: Boolean!
    message: String!
    alerts: [StockAlert!]!
    count: Int!
  }

  type ComprehensiveDailyReport {
    dailyReport: DailyReport!
    salesReports: [SalesReport!]!
    stockAlerts: [StockAlert!]!
    summary: ReportSummary!
  }

  type ReportSummary {
    total_sales: Float!
    total_orders: Int!
    total_patients: Int!
    products_sold: Int!
    new_alerts: Int!
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

    # Category Queries
    categories: [Category!]!
    category(id: String!): Category

    # Product Queries
    products(filter: ProductFilterInput, pagination: PaginationInput): ProductsResponse!
    product(id: String!): Product
    searchProducts(query: String!): [Product!]!
    lowStockProducts: [Product!]!
    checkSkuExists(sku: String!): Boolean!

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

    # Clinic System Queries
    visit(id: String!): Visit
    visits(patientId: String, status: VisitStatus, pagination: PaginationInput): [Visit!]!
    patientVisits(patientId: String!, pagination: PaginationInput): [Visit!]!
    queueTickets(station: QueueStation, status: QueueStatus, pagination: PaginationInput): [QueueTicket!]!
    queueTicket(id: String!): QueueTicket
    queueStats(station: QueueStation): [QueueStats!]!
    
    # Triage Queue Queries
    triageQueue(status: QueueStatus, skip: Int = 0, take: Int = 50, search: String): TriageQueuePage!
    
    # Patient Vitals Queries
    patientVitals(patientId: String!): [Vitals!]!

    # Stock & Reports
    stocks(productId: String, pagination: PaginationInput): [Stock!]!
    stockAlerts(acknowledged: Boolean, pagination: PaginationInput): [StockAlert!]!
    
    dailyReports(date_from: DateTime, date_to: DateTime): [DailyReport!]!
    salesReports(date_from: DateTime, date_to: DateTime, productId: String): [SalesReport!]!

    # Notifications Queries
    stockExpiryAlerts(skip: Int = 0, take: Int = 100, search: String): StockExpiryPage!
    todaysAppointments(date: DateTime, skip: Int = 0, take: Int = 100, status: String): AppointmentsPage!
    notificationsOverview(date: DateTime): NotificationsOverview!
  }

  # Mutations
  type Mutation {
    # User Mutations
    createUser(input: CreateUserInput!): User!
    updateUser(id: String!, input: UpdateUserInput!): User!
    updateUserAvatar(id: String!, avatar_url: String!): User!
    deleteUser(id: String!): Boolean!

    # Patient Mutations
    createPatient(input: CreatePatientInput!): Patient!
    updatePatient(id: String!, input: UpdatePatientInput!): Patient!
    updatePatientPhoto(id: String!, photo_url: String!): Patient!
    deletePatient(id: String!): Boolean!

    # Category Mutations
    createCategory(input: CreateCategoryInput!): Category!
    updateCategory(id: String!, input: UpdateCategoryInput!): Category!
    deleteCategory(id: String!): Boolean!

    # Product Mutations
    createProduct(input: CreateProductInput!): Product!
    updateProduct(id: String!, input: UpdateProductInput!): Product!
    updateProductImage(id: String!, image_url: String!): Product!
    deleteProduct(id: String!): Boolean!
    adjustStock(productId: String!, quantity: Int!, note: String): Stock!
    createStock(input: CreateStockInput!): Stock!
    updateStock(id: String!, input: UpdateStockInput!): Stock!
    deleteStock(id: String!): Boolean!
    
    # Bulk import
    bulkImportProducts(input: BulkImportProductsInput!): ImportResult!

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
    updatePurchase(id: String!, input: UpdatePurchaseInput!): Purchase!
    deletePurchase(id: String!): Boolean!
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
    
    # Report Generation
    generateSalesReports(date: DateTime!): SalesReportGenerationResult!
    generateStockAlerts: StockAlertGenerationResult!
    generateComprehensiveDailyReport(date: DateTime!): ComprehensiveDailyReport!

    # Clinic System Mutations
    createVisit(input: CreateVisitInput!): Visit!
    updateVisit(id: String!, input: UpdateVisitInput!): Visit!
    deleteVisit(id: String!): Boolean!
    upsertVitals(input: UpsertVitalsInput!): Vitals!
    createQueueTicket(input: CreateQueueTicketInput!): QueueTicket!
    updateQueueStatus(id: String!, status: QueueStatus!, note: String): QueueTicket!
    linkOrderToVisit(input: LinkOrderToVisitInput!): VisitOrder!
    
    # Triage Queue Mutations
    createTriageTicket(patientId: ID!, priority: Int): QueueTicket!
    queueCall(ticketId: ID!): QueueTicket!
    queueStart(ticketId: ID!): QueueTicket!
    queueComplete(ticketId: ID!): QueueTicket!
    
    # Queue Management Mutations
    deleteAllQueueTickets: Boolean!
    deleteQueueTicketsByDate(date: DateTime!): Boolean!
  }

  # ========== CLINIC SYSTEM TYPES ==========

  enum VisitStatus {
    open
    triage
    doctor
    pharmacy
    cashier
    done
    cancelled
  }

  enum QueueStation {
    triage
    doctor
    pharmacy
    cashier
  }

  enum QueueStatus {
    waiting
    called
    in_service
    done
    skipped
    cancelled
  }

  type Visit {
    id: String!
    patientId: String!
    appointmentId: String
    visit_date: DateTime!
    status: VisitStatus!
    chief_complaint: String
    diagnosis: String
    notes: String
    created_at: DateTime!
    updated_at: DateTime!
    
    # Relations
    patient: Patient!
    appointment: Appointment
    vitals: Vitals
    queueTickets: [QueueTicket!]!
    visitOrders: [VisitOrder!]!
  }

  type Vitals {
    id: String!
    visitId: String!
    heightCm: Float
    weightKg: Float
    tempC: Float
    sbp: Int
    dbp: Int
    hr: Int
    rr: Int
    spo2: Int
    bmi: Float
    created_at: DateTime!
    updated_at: DateTime!
    
    # Relations
    visit: Visit!
  }

  type QueueTicket {
    id: String!
    visitId: String
    patientId: String!
    number: Int!
    station: QueueStation!
    status: QueueStatus!
    priority: Int!
    called_at: DateTime
    started_at: DateTime
    done_at: DateTime
    created_at: DateTime!
    updated_at: DateTime!
    
    # Relations
    visit: Visit
    patient: Patient!
    events: [QueueEvent!]!
  }

  type QueueEvent {
    id: String!
    ticketId: String!
    station: QueueStation!
    status: QueueStatus!
    at: DateTime!
    byUserId: String
    note: String
    
    # Relations
    ticket: QueueTicket!
  }

  type VisitOrder {
    id: String!
    visitId: String!
    orderId: String!
    created_at: DateTime!
    
    # Relations
    visit: Visit!
    order: Order!
  }

  # Input Types for Clinic System
  input CreateVisitInput {
    patientId: String!
    appointmentId: String
    chief_complaint: String
    diagnosis: String
    notes: String
  }

  input UpdateVisitInput {
    status: VisitStatus
    chief_complaint: String
    diagnosis: String
    notes: String
    appointmentId: String
  }

  input UpsertVitalsInput {
    visitId: String!
    heightCm: Float
    weightKg: Float
    tempC: Float
    sbp: Int
    dbp: Int
    hr: Int
    rr: Int
    spo2: Int
    bmi: Float
  }

  input CreateQueueTicketInput {
    visitId: String!
    station: QueueStation!
    priority: Int
  }

  input LinkOrderToVisitInput {
    visitId: String!
    orderId: String!
  }

  # Queue Statistics
  type QueueStats {
    station: QueueStation!
    status: QueueStatus!
    count: Int!
  }

  # Triage Queue Types
  type TriageQueuePage {
    tickets: [QueueTicket!]!
    total: Int!
  }

  # Notifications Types
  type StockExpiryPage {
    items: [StockExpiryItem!]!
    total: Int!
  }

  type StockExpiryItem {
    stock_id: ID!
    product_id: ID!
    product_name: String!
    sku: String
    unit: String
    quantity: Int!
    expiration_date: DateTime!
    days_left: Int!
    warn_days: Int!
    percent_remaining: Float!
    color: String!    # "yellow" | "orange" | "red" | "black"
    shelf_code: String
    shelf_row: String
    barcode: String
    category: String
  }

  type AppointmentsPage {
    items: [TodayAppointment!]!
    total: Int!
  }

  type TodayAppointment {
    appointment_id: ID!
    time: DateTime!
    status: String
    reason: String
    patient_id: ID!
    patient_fullname: String!
    doctor_id: ID
    doctor_name: String
  }

  type NotificationsOverview {
    stocks: StockExpiryPage!
    appointments: AppointmentsPage!
  }
`; 