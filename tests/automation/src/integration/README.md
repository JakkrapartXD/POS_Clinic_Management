# Queue System Integration Tests

ระบบ integration tests สำหรับระบบคิวแบบครบวงจร: Triage → Doctor → Cashier

## ไฟล์ Test ที่สร้างขึ้น

### 1. `doctor-flow.test.ts`
**Flow หมอ: ตรวจ-สั่งยา**

ทดสอบ flow การทำงานของหมอ:
- สร้างผู้ป่วยและ visit
- สร้าง queue ticket สำหรับ doctor station
- เรียกผู้ป่วย → เริ่มตรวจ → บันทึกการตรวจ
- สร้าง prescription order
- เสร็จสิ้นการตรวจ

**Test Cases:**
- `IT-DOC-001`: Complete Doctor Flow - ตรวจ-สั่งยา
- `IT-DOC-002`: Doctor Flow with Vitals Integration
- `IT-DOC-003`: Prescription with Drug Allergies Check
- `IT-DOC-004`: Multiple Prescriptions and Follow-up

### 2. `cashier-flow.test.ts`
**Flow แคชเชียร์: จ่ายยา-ออกบิล**

ทดสอบ flow การทำงานของแคชเชียร์:
- รับ prescription order จากหมอ
- สร้าง queue ticket สำหรับ cashier station
- เรียกผู้ป่วย → เริ่มบริการ → ตรวจสอบ prescription
- ประมวลผลการชำระเงิน
- สร้างใบเสร็จ
- เสร็จสิ้นการบริการ

**Test Cases:**
- `IT-CASH-001`: Complete Cashier Flow - จ่ายยา-ออกบิล
- `IT-CASH-002`: Multiple Payment Methods
- `IT-CASH-003`: Partial Payment and Installments
- `IT-CASH-004`: Discount and Tax Calculation
- `IT-CASH-005`: Refund Processing

### 3. `full-queue-flow.test.ts`
**Flow ครบวงจร: Triage → Doctor → Cashier**

ทดสอบ flow แบบครบวงจรตั้งแต่ต้นจนจบ:
- สร้างผู้ป่วยและ visit
- **Triage Station**: เรียก → เริ่มคัดกรอง → บันทึกสัญญาณชีพ → เสร็จสิ้น
- **Doctor Station**: เรียก → เริ่มตรวจ → บันทึกการตรวจ → สร้าง prescription → เสร็จสิ้น
- **Cashier Station**: เรียก → เริ่มบริการ → ชำระเงิน → สร้างใบเสร็จ → เสร็จสิ้น
- ตรวจสอบผลลัพธ์ครบวงจร

**Test Cases:**
- `IT-FULL-001`: Complete Queue Flow - Triage → Doctor → Cashier
- `IT-FULL-002`: Queue Flow with Priority Handling
- `IT-FULL-003`: Queue Flow with Error Handling

## การรัน Tests

### รัน Tests ทั้งหมด
```bash
npm test -- --testPathPattern=integration
```

### รัน Test เฉพาะ Flow
```bash
# Doctor Flow
npm test -- --testPathPattern=doctor-flow

# Cashier Flow
npm test -- --testPathPattern=cashier-flow

# Full Queue Flow
npm test -- --testPathPattern=full-queue-flow
```

### รัน Test เฉพาะ Case
```bash
npm test -- --testNamePattern="IT-DOC-001"
```

## Postman Collection

### ไฟล์ที่อัปเดต
- `Queue System Integration Test - Updated.postman_collection.json`

### การใช้งาน
1. Import collection ลงใน Postman
2. ตั้งค่า environment variables:
   - `baseUrl`: URL ของ API server
   - `auth_token`: JWT token สำหรับ authentication
3. รัน collection ตามลำดับ

### Flow ใน Postman
1. **Authentication**: Login และเก็บ token
2. **Setup**: สร้าง patient และ visit
3. **Triage Station**: สร้าง ticket → เรียก → เริ่ม → บันทึก vitals → เสร็จสิ้น
4. **Doctor Station**: สร้าง ticket → เรียก → เริ่ม → บันทึกการตรวจ → สร้าง prescription → เสร็จสิ้น
5. **Cashier Station**: สร้าง ticket → เรียก → เริ่ม → ชำระเงิน → สร้างใบเสร็จ → เสร็จสิ้น
6. **Verification**: ตรวจสอบผลลัพธ์ครบวงจร

## GraphQL Mutations และ Queries ที่ใช้

### Mutations
- `createPatient`: สร้างผู้ป่วย
- `createVisit`: สร้าง visit
- `createQueueTicket`: สร้าง queue ticket
- `queueCall`: เรียกผู้ป่วย
- `queueStart`: เริ่มบริการ
- `queueComplete`: เสร็จสิ้นบริการ
- `addVitals`: บันทึกสัญญาณชีพ
- `updateVisit`: อัปเดตการตรวจ
- `createOrder`: สร้าง prescription order
- `processPayment`: ประมวลผลการชำระเงิน

### Queries
- `generateReceipt`: สร้างใบเสร็จ
- `getQueueTickets`: ดึงข้อมูล queue tickets
- `getVisitVitals`: ดึงข้อมูลสัญญาณชีพ
- `getPrescriptionDetails`: ดึงข้อมูล prescription

## ข้อมูล Test

### Test Patient
```javascript
{
  first_name: "TestPatient_[timestamp]",
  last_name: "TestLastName",
  national_id: "[timestamp]",
  phone: "08[random]",
  email: "testpatient_[timestamp]@example.com",
  date_of_birth: "1990-01-01",
  gender: "male"
}
```

### Test Vitals
```javascript
{
  heightCm: 170,
  weightKg: 70,
  tempC: 37.5,
  sbp: 120,
  dbp: 80,
  hr: 85,
  rr: 18,
  spo2: 98
}
```

### Test Prescription
```javascript
{
  orderItems: [
    {
      product_name: "Paracetamol 500mg",
      quantity: 20,
      unit_price: 15,
      instructions: "ทาน 1-2 เม็ด ทุก 4-6 ชั่วโมง เมื่อมีไข้หรือปวด"
    },
    {
      product_name: "Ibuprofen 400mg",
      quantity: 10,
      unit_price: 15,
      instructions: "ทาน 1 เม็ด หลังอาหาร วันละ 3 ครั้ง"
    }
  ],
  total_amount: 450
}
```

## การ Cleanup

Tests ทั้งหมดจะทำการ cleanup ข้อมูลทดสอบอัตโนมัติ:
- ลบ queue tickets
- ลบ orders และ payments
- ลบ visits
- ลบ patients
- ลบ users

## หมายเหตุ

- Tests ใช้ `test.describe.serial()` เพื่อให้รันตามลำดับ
- ใช้ `beforeAll()` และ `afterAll()` สำหรับ setup และ cleanup
- มี error handling และ validation ครบถ้วน
- รองรับการทดสอบ edge cases และ error scenarios
