# Clinic System Extension - Deployment Guide

## Overview

This guide covers the deployment of the clinic system extension that adds visit management, vitals tracking, queue management, and order linking capabilities to the existing POS/pharmacy system.

## ⚠️ Important Notes

- **NO EXISTING TABLES ARE MODIFIED** - Only new tables are added
- **BACKWARD COMPATIBLE** - Existing POS/pharmacy functionality remains unchanged
- **NON-DESTRUCTIVE** - All existing data is preserved

## System Architecture

### New Models Added
1. **Visit** - Patient visit sessions (OPD rounds)
2. **Vitals** - Patient vital signs (1:1 with Visit)
3. **QueueTicket** - Multi-station queue system
4. **QueueEvent** - Queue status change history
5. **VisitOrder** - Bridge table linking visits to existing orders

### Enhanced Existing Models
1. **Patient** - Added `national_id` field (optional, unique) for Thai national ID card numbers

### Bridge Pattern
- Uses `VisitOrder` table to connect new clinic system with existing POS orders
- Multiple orders can be linked to one visit
- Maintains referential integrity

## Deployment Steps

### 1. Database Migration

```bash
# Navigate to backend directory
cd /home/jakkrapart/final_project/backend

# Apply the migration (when database is available)
npx prisma migrate deploy

# Or for development
npx prisma migrate dev --name clinic_system_extension

# Add national_id field to Patient table
npx prisma migrate dev --name add_national_id_to_patient

# Run seed to create service products
bun run prisma/seed.ts
```

### 2. Backend Services

The following new services have been added:

#### Elysia Routes (REST API)
- `POST /clinic/patients/:id/visits` - Create new visit
- `PUT /clinic/visits/:id` - Update visit details
- `POST /clinic/visits/:id/vitals` - Upsert vitals
- `POST /clinic/visits/:id/queue` - Create queue ticket
- `POST /clinic/visits/:id/link-order` - Link existing order to visit
- `GET /clinic/visits/:id` - Get visit details
- `GET /clinic/patients/:id/visits` - Get patient visits
- `GET /clinic/queue` - Get queue tickets
- `PUT /clinic/queue/:id/status` - Update queue status

#### GraphQL API
New queries and mutations added to existing GraphQL endpoint:

**Queries:**
- `visit(id: String!): Visit`
- `visits(patientId: String, status: VisitStatus, pagination: PaginationInput): [Visit!]!`
- `queueTickets(station: QueueStation, status: QueueStatus, pagination: PaginationInput): [QueueTicket!]!`
- `queueStats(station: QueueStation): [QueueStats!]!`

**Mutations:**
- `createVisit(input: CreateVisitInput!): Visit!`
- `upsertVitals(input: UpsertVitalsInput!): Vitals!`
- `createQueueTicket(input: CreateQueueTicketInput!): QueueTicket!`
- `linkOrderToVisit(input: LinkOrderToVisitInput!): VisitOrder!`

### 3. Frontend Pages

New pages added to the dashboard:

1. **Patient Management** (`/dashboard/patients`)
   - Complete CRUD operations for patients
   - Search and filter functionality
   - Patient cards with all information
   - Add, edit, delete patients
   - Accessible from sidebar menu

2. **Patient Detail** (`/dashboard/patients/[id]`)
   - View patient information including national ID (เลขบัตรประชาชน)
   - Start new visit (เริ่มรอบตรวจ)
   - View recent visits

3. **Visit Detail** (`/dashboard/visits/[id]`)
   - SOAP notes form
   - Vitals input form
   - Link orders to visit
   - Queue ticket management

4. **Queue Management** (`/dashboard/queue`)
   - Multi-station queue board
   - Real-time status updates
   - Queue ticket actions (call, start service, complete)

### 4. Service Products

The system automatically creates two service products:
- **ค่าตรวจ** (Consultation Fee) - ฿200
- **ทำแผล** (Wound Care) - ฿150

These can be used in the existing POS system and linked to visits.

## Security & Permissions

### Role-Based Access Control

| Role | Permissions |
|------|-------------|
| **doctor** | Full access to all clinic features + patient management |
| **admin** | Full access to all clinic features + patient management |
| **staff** | Patient management, create/update visits, vitals, queue tickets |
| **cashier** | Link orders, manage queue, view visits |

### Authentication
- JWT-based authentication (existing system)
- All clinic endpoints require authentication
- Role validation on each request

### Data Validation
- Input sanitization and validation
- Referential integrity checks
- Duplicate prevention (unique constraints)

## Testing

### Run Backend Tests
```bash
cd backend
bun test
# Or specifically clinic tests
bun run test:clinic
```

### Run Frontend Tests
```bash
cd frontend
npm test
# Or specifically clinic tests
npm test -- --testNamePattern="clinic"
```

## API Examples

### Create a Visit
```bash
curl -X POST http://localhost:4000/clinic/patients/PATIENT_ID/visits \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "chief_complaint": "Headache and fever",
    "diagnosis": "Viral infection",
    "notes": "Patient reports symptoms for 2 days"
  }'
```

### Upsert Vitals
```bash
curl -X POST http://localhost:4000/clinic/visits/VISIT_ID/vitals \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "heightCm": 170,
    "weightKg": 70,
    "tempC": 38.5,
    "sbp": 120,
    "dbp": 80,
    "hr": 88,
    "spo2": 97
  }'
```

### Create Queue Ticket
```bash
curl -X POST http://localhost:4000/clinic/visits/VISIT_ID/queue \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "station": "doctor",
    "priority": 0
  }'
```

### Link Order to Visit
```bash
curl -X POST http://localhost:4000/clinic/visits/VISIT_ID/link-order \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": "ORDER_ID"
  }'
```

## GraphQL Examples

### Create Visit (GraphQL)
```graphql
mutation CreateVisit {
  createVisit(input: {
    patientId: "PATIENT_ID"
    chief_complaint: "Headache and fever"
    diagnosis: "Viral infection"
    notes: "Patient reports symptoms for 2 days"
  }) {
    id
    visit_date
    status
    patient {
      first_name
      last_name
      national_id
    }
  }
}
```

### Get Visit with Details
```graphql
query GetVisit {
  visit(id: "VISIT_ID") {
    id
    visit_date
    status
    chief_complaint
    diagnosis
    notes
    patient {
      first_name
      last_name
      national_id
      phone
    }
    vitals {
      heightCm
      weightKg
      tempC
      sbp
      dbp
      hr
      spo2
      bmi
    }
    queueTickets {
      id
      number
      station
      status
    }
    visitOrders {
      order {
        id
        total_amount
        orderItems {
          product_name
          quantity
          unit_price
        }
      }
    }
  }
}
```

## Workflow Examples

### Complete Patient Management Flow

1. **Patient Registration** → Add new patient via `/dashboard/patients`
2. **Patient Search** → Find existing patient by name, national ID, or phone
3. **Patient arrives** → Create visit from patient detail page
4. **Triage** → Update vitals, create triage queue ticket
5. **Doctor consultation** → Update SOAP notes, create doctor queue ticket
6. **Prescription/Services** → Use existing POS to create order
7. **Link order** → Connect POS order to visit
8. **Pharmacy** → Create pharmacy queue ticket
9. **Payment** → Create cashier queue ticket
10. **Complete** → Mark visit as done

### Queue Management Flow

1. **Create ticket** → Patient gets queue number
2. **Call patient** → Update status to "called"
3. **Start service** → Update status to "in_service"
4. **Complete service** → Update status to "done"
5. **Move to next station** → Create ticket for next station

## Monitoring & Maintenance

### Database Indexes
The system includes optimized indexes for:
- Visit lookups by patient and date
- Queue ticket filtering by station and status
- Order linking queries

### Performance Considerations
- Queue tickets are automatically filtered to today's date
- Pagination is implemented for large result sets
- Efficient joins for related data

### Backup Considerations
- New tables are included in existing backup procedures
- No changes to existing backup scripts required

## Troubleshooting

### Common Issues

1. **Migration fails**
   - Check database connectivity
   - Ensure no conflicting table names
   - Verify Prisma client is updated

2. **Authentication errors**
   - Verify JWT token is valid
   - Check user roles and permissions
   - Ensure proper Authorization header format

3. **Queue number conflicts**
   - Queue numbers reset daily automatically
   - Check system date/timezone settings

4. **Order linking fails**
   - Verify order exists and belongs to same patient
   - Check for existing links (unique constraint)
   - Ensure order is not deleted (isDelete = false)

### Logs and Debugging
- Backend logs available in console/log files
- Frontend errors logged to browser console
- GraphQL playground available at `/graphql` (development)

## Production Deployment Checklist

- [ ] Database migration applied successfully
- [ ] Service products created
- [ ] JWT secret configured
- [ ] Role-based permissions tested
- [ ] Frontend pages accessible
- [ ] Queue system functional
- [ ] Order linking tested
- [ ] Backup procedures updated
- [ ] Monitoring configured
- [ ] User training completed

## Support and Documentation

- API documentation: `http://localhost:4000/swagger`
- GraphQL playground: `http://localhost:4000/graphql`
- Database schema: `backend/prisma/schema.prisma`
- Frontend components: `frontend/src/app/dashboard/`

This clinic system extension seamlessly integrates with your existing POS/pharmacy system while adding comprehensive patient visit management capabilities.
