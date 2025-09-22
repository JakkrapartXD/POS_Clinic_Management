# GraphQL Notifications Examples

This document provides example GraphQL operations for the new Notifications feature.

## 1. Stock Expiry Alerts Query

### Basic Query
```graphql
query StockAlerts {
  stockExpiryAlerts {
    total
    items {
      stock_id
      product_id
      product_name
      sku
      unit
      quantity
      expiration_date
      days_left
      warn_days
      percent_remaining
      color
      shelf_code
      shelf_row
      barcode
      category
    }
  }
}
```

### With Pagination
```graphql
query StockAlertsWithPagination($skip: Int, $take: Int) {
  stockExpiryAlerts(skip: $skip, take: $take) {
    total
    items {
      product_name
      days_left
      percent_remaining
      color
      quantity
      expiration_date
    }
  }
}
```

### With Search
```graphql
query StockAlertsWithSearch($search: String) {
  stockExpiryAlerts(search: $search) {
    total
    items {
      product_name
      sku
      barcode
      days_left
      percent_remaining
      color
    }
  }
}
```

## 2. Today's Appointments Query

### Basic Query (Today)
```graphql
query TodaysAppointments {
  todaysAppointments {
    total
    items {
      appointment_id
      time
      status
      reason
      patient_id
      patient_fullname
      doctor_id
      doctor_name
    }
  }
}
```

### With Date Parameter
```graphql
query AppointmentsByDate($date: DateTime) {
  todaysAppointments(date: $date) {
    total
    items {
      appointment_id
      time
      status
      reason
      patient_fullname
      doctor_name
    }
  }
}
```

### With Status Filter
```graphql
query AppointmentsByStatus($status: String) {
  todaysAppointments(status: $status) {
    total
    items {
      appointment_id
      time
      status
      patient_fullname
      doctor_name
    }
  }
}
```

### With Pagination
```graphql
query AppointmentsWithPagination($skip: Int, $take: Int) {
  todaysAppointments(skip: $skip, take: $take) {
    total
    items {
      appointment_id
      time
      status
      patient_fullname
      doctor_name
    }
  }
}
```

## 3. Notifications Overview Query

### Complete Overview
```graphql
query NotificationsOverview($date: DateTime) {
  notificationsOverview(date: $date) {
    stocks {
      total
      items {
        product_name
        days_left
        percent_remaining
        color
        quantity
        expiration_date
      }
    }
    appointments {
      total
      items {
        time
        patient_fullname
        doctor_name
        status
        reason
      }
    }
  }
}
```

### Minimal Overview
```graphql
query NotificationsOverviewMinimal {
  notificationsOverview {
    stocks {
      total
      items {
        product_name
        days_left
        color
      }
    }
    appointments {
      total
      items {
        patient_fullname
        time
      }
    }
  }
}
```

## 4. Example Variables

### For Stock Alerts with Search
```json
{
  "search": "paracetamol",
  "skip": 0,
  "take": 20
}
```

### For Appointments by Date
```json
{
  "date": "2024-01-15T00:00:00.000Z",
  "status": "scheduled",
  "skip": 0,
  "take": 50
}
```

### For Notifications Overview
```json
{
  "date": "2024-01-15T00:00:00.000Z"
}
```

## 5. Response Examples

### Stock Expiry Alert Response
```json
{
  "data": {
    "stockExpiryAlerts": {
      "total": 3,
      "items": [
        {
          "stock_id": "stock_123",
          "product_id": "prod_456",
          "product_name": "Paracetamol 500mg",
          "sku": "PAR500",
          "unit": "tablet",
          "quantity": 100,
          "expiration_date": "2024-01-20T00:00:00.000Z",
          "days_left": 5,
          "warn_days": 30,
          "percent_remaining": 16.67,
          "color": "red",
          "shelf_code": "A1",
          "shelf_row": "1",
          "barcode": "1234567890123",
          "category": "Pain Relief"
        }
      ]
    }
  }
}
```

### Appointment Response
```json
{
  "data": {
    "todaysAppointments": {
      "total": 2,
      "items": [
        {
          "appointment_id": "apt_789",
          "time": "2024-01-15T09:00:00.000Z",
          "status": "scheduled",
          "reason": "Regular checkup",
          "patient_id": "patient_123",
          "patient_fullname": "สมชาย ใจดี",
          "doctor_id": "doctor_456",
          "doctor_name": "Dr. Smith"
        }
      ]
    }
  }
}
```

## 6. Color Coding for Stock Alerts

The `color` field in stock expiry alerts follows this logic:

- **yellow**: >80% time remaining in warning period
- **orange**: >40% and ≤80% time remaining in warning period  
- **red**: >10% and ≤40% time remaining in warning period
- **black**: ≤10% time remaining or already expired

## 7. Time Zone Handling

All date/time operations are handled in the Asia/Bangkok timezone. The system automatically converts UTC dates to Bangkok time for filtering and display.

## 8. Testing with cURL

### Test Stock Alerts
```bash
curl -X POST http://localhost:4000/graphql \
  -H "Content-Type: application/json" \
  -d '{"query": "query { stockExpiryAlerts { total items { product_name days_left percent_remaining color } } }"}'
```

### Test Appointments
```bash
curl -X POST http://localhost:4000/graphql \
  -H "Content-Type: application/json" \
  -d '{"query": "query { todaysAppointments { total items { patient_fullname doctor_name time } } }"}'
```

### Test Overview
```bash
curl -X POST http://localhost:4000/graphql \
  -H "Content-Type: application/json" \
  -d '{"query": "query { notificationsOverview { stocks { total } appointments { total } } }"}'
```
