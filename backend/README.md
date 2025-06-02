# SN Medical API - Comprehensive GraphQL & REST API

A robust medical management system API built with Elysia, GraphQL Yoga, Prisma, and Redis. Features complete CRUD operations, advanced security measures, and real-time capabilities.

## 🚀 Features

### Core Functionality
- **Complete CRUD Operations** for all entities
- **Role-based Access Control** (Admin, Doctor, Staff, Cashier)
- **Medical Records Management** with prescriptions
- **Appointment Scheduling** with conflict detection
- **Inventory Management** with real-time stock tracking
- **Order Processing** with payment handling
- **Reporting & Analytics** with daily/sales reports

### Security Features
- **JWT Authentication** with session management
- **Rate Limiting** (100 queries/min, 50 mutations/min)
- **Input Validation & Sanitization** (XSS protection)
- **SQL Injection Prevention** (Prisma ORM)
- **Query Complexity Analysis** (depth & selection limits)
- **Audit Logging** for sensitive operations
- **Redis-based Session Storage**
- **CORS Protection** with configurable origins

## 📊 Database Schema

The system manages the following entities:
- **Users** (Admin, Doctor, Staff, Cashier roles)
- **Patients** with medical history
- **Products** (medicines, medical supplies)
- **Orders & Payments** with invoice generation
- **Appointments & Medical Records**
- **Prescriptions** linked to products
- **Suppliers & Purchases**
- **Stock Movements & Alerts**
- **Reports** (Daily, Sales)

## 🛠️ Installation & Setup

### Prerequisites
- Node.js 18+ or Bun
- PostgreSQL database
- Redis server

### Environment Variables
Create a `.env` file in the backend directory:

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/sn_medical"

# Authentication
JWT_SECRET="your-super-secret-jwt-key-here"

# Redis
REDIS_URL="redis://localhost:6379"

# Server
NODE_ENV="development"
FRONTEND_URL="http://localhost:3000"
```

### Installation

```bash
# Install dependencies
bun install

# Setup database
bun run setup-db

# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate deploy

# Start development server
bun run dev
```

## 🔗 API Endpoints

### GraphQL
- **Endpoint**: `http://localhost:4000/graphql`
- **Playground**: Available in development mode
- **Introspection**: Enabled in development

### REST Endpoints
- **Health Check**: `GET /health`
- **API Info**: `GET /api-info`
- **Authentication**: `POST /auth/sign-in`, `PUT /auth/sign-up`
- **Documentation**: `GET /swagger`

## 🔐 Authentication

### Sign In
```graphql
# REST API
POST /auth/sign-in
{
  "username": "admin",
  "password": "your-password"
}

# Returns JWT token and sets HttpOnly cookies
```

### Using Authentication in GraphQL
```javascript
// HTTP Headers
{
  "Authorization": "Bearer your-jwt-token"
}

// Or cookies are automatically sent
```

## 📝 GraphQL API Examples

### User Management

```graphql
# Get current user
query GetMe {
  me {
    id
    username
    email
    role
    status
  }
}

# Create new user (Admin only)
mutation CreateUser {
  createUser(input: {
    username: "doctor1"
    email: "doctor@example.com"
    password: "securepassword"
    role: "doctor"
  }) {
    id
    username
    email
    role
  }
}

# Get all users with filtering
query GetUsers {
  users(
    filter: { role: "doctor", status: "active" }
    pagination: { skip: 0, take: 10 }
  ) {
    users {
      id
      username
      email
      role
    }
    total
  }
}
```

### Patient Management

```graphql
# Create patient
mutation CreatePatient {
  createPatient(input: {
    first_name: "John"
    last_name: "Doe"
    date_of_birth: "1985-06-15T00:00:00Z"
    phone: "+1234567890"
    email: "john.doe@example.com"
    address: "123 Main St, City, State"
  }) {
    id
    first_name
    last_name
    phone
    email
  }
}

# Search patients
query SearchPatients {
  searchPatients(query: "John") {
    id
    first_name
    last_name
    phone
    email
  }
}

# Get patient with medical history
query GetPatient {
  patient(id: "patient-id") {
    id
    first_name
    last_name
    appointments {
      id
      appointment_time
      status
      doctor {
        username
      }
    }
    medicalRecords {
      id
      diagnosis
      treatment
      created_at
    }
  }
}
```

### Product & Inventory Management

```graphql
# Create product
mutation CreateProduct {
  createProduct(input: {
    product_name: "Aspirin 100mg"
    sale_price: 5.99
    cost: 3.50
    stock_quantity: 100
    reorder_point: 20
    category: "Medicine"
    dosage: "100mg"
    times_per_day: 2
  }) {
    id
    product_name
    sale_price
    stock_quantity
  }
}

# Get low stock products
query GetLowStockProducts {
  lowStockProducts {
    id
    product_name
    stock_quantity
    reorder_point
    category
  }
}

# Adjust stock
mutation AdjustStock {
  adjustStock(
    productId: "product-id"
    quantity: 50
    note: "Received new shipment"
  ) {
    id
    movement_type
    quantity
    note
    product {
      product_name
      stock_quantity
    }
  }
}
```

### Order Processing

```graphql
# Create order
mutation CreateOrder {
  createOrder(input: {
    patientId: "patient-id"
    total_amount: 25.99
    is_walkin: false
    orderItems: [
      {
        productId: "product-id-1"
        quantity: 2
        unit_price: 5.99
        total_price: 11.98
      }
      {
        productId: "product-id-2"
        quantity: 1
        unit_price: 14.01
        total_price: 14.01
      }
    ]
  }) {
    id
    total_amount
    orderItems {
      quantity
      unit_price
      product {
        product_name
      }
    }
  }
}

# Process payment
mutation ProcessPayment {
  processPayment(input: {
    orderId: "order-id"
    payment_type: "cash"
    amount: 25.99
  }) {
    id
    payment_type
    amount
    payment_date
  }
}
```

### Medical Records & Appointments

```graphql
# Create appointment
mutation CreateAppointment {
  createAppointment(input: {
    patientId: "patient-id"
    doctorId: "doctor-id"
    appointment_time: "2024-01-15T10:00:00Z"
    reason: "Regular checkup"
  }) {
    id
    appointment_time
    status
    patient {
      first_name
      last_name
    }
    doctor {
      username
    }
  }
}

# Create medical record
mutation CreateMedicalRecord {
  createMedicalRecord(input: {
    patientId: "patient-id"
    doctorId: "doctor-id"
    appointmentId: "appointment-id"
    symptoms: "Fever, headache"
    diagnosis: "Common cold"
    treatment: "Rest and fluids"
    notes: "Follow up in 1 week if symptoms persist"
  }) {
    id
    symptoms
    diagnosis
    treatment
    created_at
  }
}

# Create prescription
mutation CreatePrescription {
  createPrescription(input: {
    medicalRecordId: "record-id"
    productId: "product-id"
    dosage: "1 tablet"
    times_per_day: 2
    duration_days: 7
    instructions: "Take after meals"
  }) {
    id
    dosage
    times_per_day
    duration_days
    product {
      product_name
    }
  }
}
```

### Reporting & Analytics

```graphql
# Generate daily report
mutation GenerateDailyReport {
  generateDailyReport(date: "2024-01-15T00:00:00Z") {
    id
    report_date
    total_sales
    total_orders
    total_patients
  }
}

# Get sales reports
query GetSalesReports {
  salesReports(
    date_from: "2024-01-01T00:00:00Z"
    date_to: "2024-01-31T23:59:59Z"
  ) {
    id
    report_date
    quantity_sold
    total_sales
    product {
      product_name
    }
  }
}

# Get stock alerts
query GetStockAlerts {
  stockAlerts(acknowledged: false) {
    id
    alert_type
    alert_message
    created_at
    product {
      product_name
      stock_quantity
      reorder_point
    }
  }
}
```

## 🔒 Role-Based Access Control

### Permission Matrix

| Operation | Admin | Doctor | Staff | Cashier |
|-----------|-------|--------|-------|---------|
| User Management | ✅ | ❌ | ❌ | ❌ |
| Patient CRUD | ✅ | ✅ | ✅ | ✅ |
| Product CRUD | ✅ | ❌ | ✅ | ✅ |
| Orders | ✅ | ❌ | ✅ | ✅ |
| Medical Records | ✅ | ✅* | ✅ | ❌ |
| Appointments | ✅ | ✅* | ✅ | ✅ |
| Reports | ✅ | ✅ | ✅ | ✅ |
| Stock Management | ✅ | ❌ | ✅ | ❌ |

*Doctors can only access their own records/appointments

## 🛡️ Security Best Practices

### Rate Limiting
- **Queries**: 100 per minute per user
- **Mutations**: 50 per minute per user
- **Sensitive Operations**: 10 per minute per user

### Input Validation
- Email format validation
- Phone number format validation
- ID format validation (CUID)
- XSS prevention through sanitization
- SQL injection prevention (Prisma ORM)

### Authentication Security
- JWT tokens with 30-day expiration
- HttpOnly cookies for web clients
- Redis-based session storage
- Secure password hashing (bcrypt, rounds: 12)

### Data Protection
- Sensitive user data filtering
- Audit logging for critical operations
- Query complexity analysis
- Error message sanitization in production

## 🚀 Deployment

### Docker Deployment
```dockerfile
FROM oven/bun:alpine

WORKDIR /app
COPY package.json bun.lockb ./
RUN bun install --frozen-lockfile

COPY . .
RUN npx prisma generate

EXPOSE 4000
CMD ["bun", "run", "src/index.ts"]
```

### Production Environment Variables
```env
NODE_ENV="production"
DATABASE_URL="postgresql://user:pass@prod-db:5432/sn_medical"
REDIS_URL="redis://prod-redis:6379"
JWT_SECRET="your-super-secure-production-secret"
FRONTEND_URL="https://your-frontend-domain.com"
```

### Health Monitoring
- Health check endpoint: `GET /health`
- Database connection status
- Redis connection status
- GraphQL service status

## 📚 API Documentation

### Interactive Documentation
- **GraphQL Playground**: Available at `/graphql` in development
- **REST API Docs**: Available at `/swagger`
- **Schema Introspection**: Enabled for development

### Error Handling
- Standardized error responses
- Proper HTTP status codes
- Detailed error messages in development
- Sanitized error messages in production

## 🤝 Contributing

1. Follow the existing code structure
2. Add proper type definitions
3. Include security validations
4. Write comprehensive tests
5. Update documentation

## 📄 License

This project is licensed under the MIT License.

---

For more information or support, please contact the development team.