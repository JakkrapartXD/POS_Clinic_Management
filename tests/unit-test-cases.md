# Unit Test Cases - ระบบจัดการคลินิก

## ข้อมูลทั่วไป
- **ระบบ**: ระบบจัดการคลินิก (Clinic Management System)
- **ประเภทการทดสอบ**: Unit Testing
- **วัตถุประสงค์**: ทดสอบการทำงานของแต่ละโมดูล/เมธอดแยกกัน
- **วันที่สร้าง**: $(date)
- **เวอร์ชัน**: 1.0

---

## Test Cases

### TC-ID: UT-001
**โมดูล/เมธอด**: `AuthService.login`
**เงื่อนไขทดสอบ**: ผู้ใช้มีบัญชีและสถานะ Active
**ขั้นตอนการทดสอบ**:
1. สร้างผู้ใช้ทดสอบที่มีสถานะ Active
2. เรียกใช้ `AuthService.login(username, password)`
3. ตรวจสอบผลลัพธ์

**ผลลัพธ์ที่คาดหวัง**: ระบบอนุญาตให้เข้าสู่ระบบและสร้าง JWT Token
**ข้อมูลทดสอบ**:
```json
{
  "username": "testuser",
  "password": "validpassword123",
  "expectedStatus": "success",
  "expectedToken": "jwt_token_generated"
}
```

---

### TC-ID: UT-002
**โมดูล/เมธอด**: `AuthService.login`
**เงื่อนไขทดสอบ**: ผู้ใช้กรอกรหัสผ่านผิด
**ขั้นตอนการทดสอบ**:
1. สร้างผู้ใช้ทดสอบที่มีสถานะ Active
2. เรียกใช้ `AuthService.login(username, wrongPassword)`
3. ตรวจสอบผลลัพธ์

**ผลลัพธ์ที่คาดหวัง**: ระบบปฏิเสธการเข้าสู่ระบบและแสดงข้อความ "รหัสผ่านไม่ถูกต้อง"
**ข้อมูลทดสอบ**:
```json
{
  "username": "testuser",
  "password": "wrongpassword",
  "expectedStatus": "error",
  "expectedMessage": "รหัสผ่านไม่ถูกต้อง"
}
```

---

### TC-ID: UT-003
**โมดูล/เมธอด**: `PatientService.create`
**เงื่อนไขทดสอบ**: ข้อมูลผู้ป่วยใหม่ถูกต้องและไม่ซ้ำ
**ขั้นตอนการทดสอบ**:
1. เตรียมข้อมูลผู้ป่วยใหม่ที่ครบถ้วน
2. เรียกใช้ `PatientService.create(patientData)`
3. ตรวจสอบผลลัพธ์

**ผลลัพธ์ที่คาดหวัง**: ระบบบันทึกข้อมูลผู้ป่วยใหม่ลงฐานข้อมูลและคืนค่า patientId
**ข้อมูลทดสอบ**:
```json
{
  "patientData": {
    "first_name": "สมชาย",
    "last_name": "ใจดี",
    "national_id": "1234567890123",
    "phone": "0812345678",
    "email": "somchai@example.com",
    "date_of_birth": "1990-01-01",
    "gender": "male"
  },
  "expectedStatus": "success",
  "expectedPatientId": "patient_id_generated"
}
```

---

### TC-ID: UT-004
**โมดูล/เมธอด**: `PatientService.create`
**เงื่อนไขทดสอบ**: มีการกรอกข้อมูลไม่ครบ
**ขั้นตอนการทดสอบ**:
1. เตรียมข้อมูลผู้ป่วยที่ไม่ครบถ้วน (ขาด first_name)
2. เรียกใช้ `PatientService.create(incompletePatientData)`
3. ตรวจสอบผลลัพธ์

**ผลลัพธ์ที่คาดหวัง**: ระบบแจ้งเตือน "กรอกข้อมูลให้ครบถ้วน" และไม่บันทึกข้อมูล
**ข้อมูลทดสอบ**:
```json
{
  "patientData": {
    "last_name": "ใจดี",
    "national_id": "1234567890123",
    "phone": "0812345678"
  },
  "expectedStatus": "error",
  "expectedMessage": "กรอกข้อมูลให้ครบถ้วน"
}
```

---

### TC-ID: UT-005
**โมดูล/เมธอด**: `MedicalRecordService.addRecord`
**เงื่อนไขทดสอบ**: ผู้ป่วยมีอยู่ในระบบแล้ว
**ขั้นตอนการทดสอบ**:
1. สร้างผู้ป่วยทดสอบในระบบ
2. เรียกใช้ `MedicalRecordService.addRecord(patientId, recordData)`
3. ตรวจสอบผลลัพธ์

**ผลลัพธ์ที่คาดหวัง**: ระบบบันทึกเวชระเบียนใหม่และคืนค่า recordId
**ข้อมูลทดสอบ**:
```json
{
  "patientId": "existing_patient_id",
  "recordData": {
    "chief_complaint": "ปวดหัว",
    "diagnosis": "ไมเกรน",
    "treatment": "พักผ่อนและทานยา",
    "notes": "อาการดีขึ้น"
  },
  "expectedStatus": "success",
  "expectedRecordId": "record_id_generated"
}
```

---

### TC-ID: UT-006
**โมดูล/เมธอด**: `PrescriptionService.addItem`
**เงื่อนไขทดสอบ**: เพิ่มยาใหม่ในใบสั่งยาที่มีอยู่
**ขั้นตอนการทดสอบ**:
1. สร้างใบสั่งยาทดสอบ
2. เรียกใช้ `PrescriptionService.addItem(prescriptionId, medicationData)`
3. ตรวจสอบผลลัพธ์

**ผลลัพธ์ที่คาดหวัง**: ระบบเพิ่มรายการยาสำเร็จและตัดสต๊อก
**ข้อมูลทดสอบ**:
```json
{
  "prescriptionId": "existing_prescription_id",
  "medicationData": {
    "productId": "medication_001",
    "quantity": 10,
    "dosage": "1 เม็ด หลังอาหาร",
    "frequency": "วันละ 3 ครั้ง"
  },
  "expectedStatus": "success",
  "expectedStockReduction": 10
}
```

---

### TC-ID: UT-007
**โมดูล/เมธอด**: `InventoryService.deduct`
**เงื่อนไขทดสอบ**: จำนวนยาที่ต้องการจ่ายเกินจากสต๊อก
**ขั้นตอนการทดสอบ**:
1. ตั้งค่าสต๊อกยาทดสอบ (จำนวน 5)
2. เรียกใช้ `InventoryService.deduct(productId, 10)`
3. ตรวจสอบผลลัพธ์

**ผลลัพธ์ที่คาดหวัง**: ระบบปฏิเสธการตัดสต๊อกและแจ้งเตือน "จำนวนยาไม่เพียงพอ"
**ข้อมูลทดสอบ**:
```json
{
  "productId": "medication_001",
  "currentStock": 5,
  "requestedQuantity": 10,
  "expectedStatus": "error",
  "expectedMessage": "จำนวนยาไม่เพียงพอ"
}
```

---

### TC-ID: UT-008
**โมดูล/เมธอด**: `BillingService.calculateTotal`
**เงื่อนไขทดสอบ**: มีข้อมูลค่ารักษาและค่ายา
**ขั้นตอนการทดสอบ**:
1. เตรียมข้อมูลค่ารักษาและค่ายา
2. เรียกใช้ `BillingService.calculateTotal(billingData)`
3. ตรวจสอบผลลัพธ์

**ผลลัพธ์ที่คาดหวัง**: ระบบคำนวณ subtotal, tax, discount, total ถูกต้อง
**ข้อมูลทดสอบ**:
```json
{
  "billingData": {
    "treatmentFee": 500,
    "medicationFee": 300,
    "discount": 50,
    "taxRate": 0.07
  },
  "expectedResults": {
    "subtotal": 800,
    "discount": 50,
    "tax": 52.5,
    "total": 802.5
  }
}
```

---

### TC-ID: UT-009
**โมดูล/เมธอด**: `ReportService.generateMonthlyReport`
**เงื่อนไขทดสอบ**: มีข้อมูลการเงินหลายรายการในเดือนนั้น
**ขั้นตอนการทดสอบ**:
1. สร้างข้อมูลการเงินหลายรายการในเดือนเดียวกัน
2. เรียกใช้ `ReportService.generateMonthlyReport(year, month)`
3. ตรวจสอบผลลัพธ์

**ผลลัพธ์ที่คาดหวัง**: ระบบสร้างรายงานสรุปรายได้และจำนวนเคสประจำเดือนตรงกับฐานข้อมูล
**ข้อมูลทดสอบ**:
```json
{
  "year": 2024,
  "month": 1,
  "expectedResults": {
    "totalRevenue": 50000,
    "totalCases": 100,
    "averageRevenuePerCase": 500
  }
}
```

---

### TC-ID: UT-010
**โมดูล/เมธอด**: `BackupService.run`
**เงื่อนไขทดสอบ**: ระบบมีการตั้งค่า Backup และมีพื้นที่ว่างเพียงพอ
**ขั้นตอนการทดสอบ**:
1. ตั้งค่า Backup Service
2. ตรวจสอบพื้นที่ว่างในระบบ
3. เรียกใช้ `BackupService.run()`
4. ตรวจสอบผลลัพธ์

**ผลลัพธ์ที่คาดหวัง**: ระบบสร้างไฟล์ Backup และแสดงสถานะ "สำเร็จ"
**ข้อมูลทดสอบ**:
```json
{
  "backupConfig": {
    "destination": "/backup/clinic_backup_20240101.sql",
    "includeData": true,
    "compress": true
  },
  "expectedStatus": "success",
  "expectedMessage": "สำเร็จ"
}
```

---

## สรุปผลการทดสอบ

| TC-ID | Status | Pass/Fail | Notes |
|-------|--------|-----------|-------|
| UT-001 | - | - | รอการทดสอบ |
| UT-002 | - | - | รอการทดสอบ |
| UT-003 | - | - | รอการทดสอบ |
| UT-004 | - | - | รอการทดสอบ |
| UT-005 | - | - | รอการทดสอบ |
| UT-006 | - | - | รอการทดสอบ |
| UT-007 | - | - | รอการทดสอบ |
| UT-008 | - | - | รอการทดสอบ |
| UT-009 | - | - | รอการทดสอบ |
| UT-010 | - | - | รอการทดสอบ |

**สรุป**: ผ่าน 0/10, ล้มเหลว 0/10, รอการทดสอบ 10/10

---

## หมายเหตุ
- การทดสอบนี้ครอบคลุมโมดูลหลักของระบบตามขอบเขตโครงงาน
- ข้อมูลทดสอบเป็นตัวอย่างและควรปรับแต่งตามสภาพแวดล้อมจริง
- ควรทำการทดสอบในสภาพแวดล้อมที่แยกจากระบบจริง
