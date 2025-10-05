# Test Users Management Scripts

Scripts สำหรับจัดการ test users สำหรับ E2E testing

## 📋 Test Users

| Username     | Role       | Email                    | Password      | หน้าที่                    |
|--------------|------------|--------------------------|---------------|---------------------------|
| `nurse01`    | `nurse`    | `nurse01@test.clinic`    | `nurse123`    | Patient Care & Triage     |
| `cashier01`  | `cashier`  | `cashier01@test.clinic`  | `cashier123`  | Payment & Billing         |
| `staff01`    | `staff`    | `staff01@test.clinic`    | `staff123`    | Patient Management        |
| `doctor01`   | `doctor`   | `doctor01@test.clinic`   | `doctor123`   | Medical Records           |
| `pharmacist01` | `pharmacist` | `pharmacist01@test.clinic` | `pharmacist123` | Pharmacy Dispensing   |

## 🛠️ Scripts Available

### 1. Main Management Script
```bash
# ดู help
npm run test-users help

# ดู test users ทั้งหมด
npm run test-users list

# สร้าง test users
npm run test-users create

# ลบ test users
npm run test-users delete

# ลบและสร้างใหม่
npm run test-users reset
```

### 2. Individual Scripts
```bash
# สร้าง test users
npm run test-users:create

# ลบ test users
npm run test-users:delete
```

## 🔐 Role Permissions

### Nurse Role (`nurse01`)
- ✅ Patient Care & Triage
- ✅ Vitals Recording
- ✅ Queue Management
- ✅ Patient Monitoring

### Cashier Role (`cashier01`)
- ✅ Payment Processing
- ✅ Billing & Invoicing
- ✅ Order Management
- ✅ Financial Reports

### Staff Role (`staff01`)
- ✅ Patient Management
- ✅ Visits
- ✅ Queue Management
- ✅ Orders
- ✅ Reports

### Doctor Role (`doctor01`)
- ✅ Patient Management
- ✅ Medical Records
- ✅ Prescriptions
- ✅ Visits
- ✅ Documents

### Pharmacist Role (`pharmacist01`)
- ✅ Inventory Management
- ✅ Pharmacy Dispensing
- ✅ Stock Management

## 🚀 Quick Start

1. **สร้าง test users:**
   ```bash
   cd backend
   npm run test-users create
   ```

2. **ตรวจสอบ test users:**
   ```bash
   npm run test-users list
   ```

3. **รัน E2E tests:**
   ```bash
   cd ../tests/automation
   pnpm run test:e2e:chrome
   ```

4. **ลบ test users หลังเสร็จ:**
   ```bash
   cd ../../backend
   npm run test-users delete
   ```

## 🔄 Workflow สำหรับ E2E Testing

```bash
# 1. สร้าง test users
npm run test-users create

# 2. รัน E2E tests
cd ../tests/automation
pnpm run test:e2e:chrome

# 3. ลบ test users
cd ../../backend
npm run test-users delete
```

## ⚠️ Important Notes

- Test users จะมี password ที่ง่ายต่อการจำสำหรับ testing
- **ห้ามใช้ test users ใน production environment**
- Test users จะถูกสร้างด้วย role ที่เหมาะสมสำหรับแต่ละ test scenario
- Scripts จะตรวจสอบว่า user มีอยู่แล้วหรือไม่ก่อนสร้าง/ลบ

## 🐛 Troubleshooting

### Error: User already exists
```bash
# ใช้ reset command เพื่อลบและสร้างใหม่
npm run test-users reset
```

### Error: User not found
```bash
# ตรวจสอบ test users ที่มีอยู่
npm run test-users list
```

### Database Connection Error
```bash
# ตรวจสอบ DATABASE_URL ใน .env
# ตรวจสอบว่า database server รันอยู่
```
