# Integration Test Cases - ระบบจัดการคลินิก

## ข้อมูลทั่วไป
- **ระบบ**: ระบบจัดการคลินิก (Clinic Management System)
- **ประเภทการทดสอบ**: Integration Testing
- **วัตถุประสงค์**: ทดสอบการทำงานร่วมกันของหลายโมดูลในระบบ
- **วันที่สร้าง**: $(date)
- **เวอร์ชัน**: 1.0

---

## Test Cases

### TC-ID: IT-001
**สถานการณ์ทดสอบ**: ตรวจ–สั่งยา–จ่ายยา–ออกบิล (Flow เต็ม)
**ขั้นตอนทดสอบ**:
1. สร้างเวชระเบียน
2. สร้างใบสั่งยา 2 รายการ
3. จ่ายยา (ห้องยา)
4. สร้างใบแจ้งหนี้/รับชำระ

**ผลลัพธ์ที่คาดหวัง**: สร้าง record/prescription/stock movement/invoice/payment ครบและสัมพันธ์กัน

**ข้อมูลทดสอบ**:
```json
{
  "patientData": {
    "first_name": "สมชาย",
    "last_name": "ใจดี",
    "national_id": "1234567890123",
    "phone": "0812345678"
  },
  "medicalRecord": {
    "chief_complaint": "ปวดหัว",
    "diagnosis": "ไมเกรน",
    "treatment": "พักผ่อนและทานยา"
  },
  "prescriptions": [
    {
      "productId": "med_001",
      "quantity": 10,
      "dosage": "1 เม็ด หลังอาหาร"
    },
    {
      "productId": "med_002", 
      "quantity": 5,
      "dosage": "1 เม็ด ก่อนนอน"
    }
  ],
  "payment": {
    "amount": 500,
    "method": "cash"
  }
}
```

**การตรวจสอบ**:
- [ ] เวชระเบียนถูกสร้างและบันทึกในฐานข้อมูล
- [ ] ใบสั่งยาทั้ง 2 รายการถูกสร้าง
- [ ] สต๊อกยาถูกตัดตามจำนวนที่จ่าย
- [ ] ใบแจ้งหนี้ถูกสร้างพร้อมยอดรวมที่ถูกต้อง
- [ ] การชำระเงินถูกบันทึกและเชื่อมโยงกับใบแจ้งหนี้

---

### TC-ID: IT-002
**สถานการณ์ทดสอบ**: สต๊อกไม่พอขณะจ่ายยา
**ขั้นตอนทดสอบ**:
1. ดึงใบสั่งยา
2. ยืนยันจ่าย

**ผลลัพธ์ที่คาดหวัง**: ระบบปฏิเสธรายการที่สต๊อกไม่พอ, แสดงเตือน, ไม่ตัดสต๊อกผิด

**ข้อมูลทดสอบ**:
```json
{
  "prescriptionId": "pres_001",
  "prescriptionItems": [
    {
      "productId": "med_001",
      "requestedQuantity": 100,
      "availableStock": 50
    },
    {
      "productId": "med_002",
      "requestedQuantity": 20,
      "availableStock": 25
    }
  ]
}
```

**การตรวจสอบ**:
- [ ] ระบบแสดงเตือน "สต๊อกไม่เพียงพอ" สำหรับ med_001
- [ ] med_002 ถูกจ่ายได้ปกติ
- [ ] สต๊อก med_001 ไม่ถูกตัด
- [ ] สต๊อก med_002 ถูกตัด 20 ชิ้น
- [ ] ใบสั่งยาถูกอัปเดตสถานะเป็น "บางส่วนจ่าย"

---

### TC-ID: IT-003
**สถานการณ์ทดสอบ**: RBAC: แพทย์เห็นเฉพาะฟีเจอร์แพทย์
**ขั้นตอนทดสอบ**: เข้าระบบด้วยบทบาทต่างกัน

**ผลลัพธ์ที่คาดหวัง**: ปุ่ม/เมนูจำกัดตามสิทธิ์, API ป้องกันการเข้าถึง

**ข้อมูลทดสอบ**:
```json
{
  "userRoles": [
    {
      "role": "doctor",
      "username": "doctor01",
      "password": "doctor123",
      "expectedAccess": ["medical_records", "prescriptions", "patient_info"],
      "expectedDenied": ["inventory_management", "financial_reports", "user_management"]
    },
    {
      "role": "pharmacist", 
      "username": "pharmacist01",
      "password": "pharma123",
      "expectedAccess": ["prescriptions", "inventory", "stock_management"],
      "expectedDenied": ["medical_records", "financial_reports", "user_management"]
    },
    {
      "role": "cashier",
      "username": "cashier01", 
      "password": "cashier123",
      "expectedAccess": ["billing", "payments", "basic_patient_info"],
      "expectedDenied": ["medical_records", "prescriptions", "inventory_management"]
    }
  ]
}
```

**การตรวจสอบ**:
- [ ] แพทย์เห็นเมนู: เวชระเบียน, ใบสั่งยา, ข้อมูลผู้ป่วย
- [ ] เภสัชกรเห็นเมนู: ใบสั่งยา, คลังยา, จัดการสต๊อก
- [ ] เจ้าหน้าที่การเงินเห็นเมนู: การเรียกเก็บ, การชำระเงิน
- [ ] API ส่งคืน 403 Forbidden เมื่อเข้าถึงฟีเจอร์ที่ไม่มีสิทธิ์
- [ ] ระบบบันทึก Audit Log การเข้าถึงที่ถูกปฏิเสธ

---

### TC-ID: IT-004
**สถานการณ์ทดสอบ**: Audit Log ครบถ้วน
**ขั้นตอนทดสอบ**: ทำกิจกรรมสำคัญ (login, create, dispense, pay)

**ผลลัพธ์ที่คาดหวัง**: สร้างบันทึก Audit ครบ (actor, action, resource, time, IP)

**ข้อมูลทดสอบ**:
```json
{
  "testActivities": [
    {
      "action": "login",
      "user": "doctor01",
      "expectedLog": {
        "actor": "doctor01",
        "action": "LOGIN",
        "resource": "AUTH_SYSTEM",
        "timestamp": "2024-01-01T10:00:00Z",
        "ip_address": "192.168.1.100"
      }
    },
    {
      "action": "create_patient",
      "user": "staff01",
      "expectedLog": {
        "actor": "staff01", 
        "action": "CREATE",
        "resource": "PATIENT",
        "resource_id": "patient_123",
        "timestamp": "2024-01-01T10:05:00Z"
      }
    },
    {
      "action": "dispense_medication",
      "user": "pharmacist01",
      "expectedLog": {
        "actor": "pharmacist01",
        "action": "DISPENSE", 
        "resource": "MEDICATION",
        "resource_id": "med_001",
        "quantity": 10
      }
    }
  ]
}
```

**การตรวจสอบ**:
- [ ] ทุกกิจกรรมถูกบันทึกใน Audit Log
- [ ] ข้อมูลใน Log ครบถ้วน (actor, action, resource, time, IP)
- [ ] Log ไม่สามารถแก้ไขหรือลบได้
- [ ] สามารถค้นหา Log ตามเงื่อนไขต่างๆ ได้

---

### TC-ID: IT-005
**สถานการณ์ทดสอบ**: สำรองข้อมูลอัตโนมัติ
**ขั้นตอนทดสอบ**: รอ/ทริกเกอร์งานสำรอง

**ผลลัพธ์ที่คาดหวัง**: เกิดไฟล์สำรองใน Storage, มีบันทึกสถานะสำเร็จ/ล้มเหลว

**ข้อมูลทดสอบ**:
```json
{
  "backupConfig": {
    "schedule": "daily",
    "time": "02:00",
    "destination": "/backup/clinic_backup_YYYYMMDD.sql",
    "retention_days": 30
  },
  "expectedResults": {
    "backupFile": "clinic_backup_20240101.sql",
    "fileSize": "> 0 bytes",
    "status": "SUCCESS",
    "logEntry": "Backup completed successfully"
  }
}
```

**การตรวจสอบ**:
- [ ] ไฟล์สำรองถูกสร้างตามกำหนดเวลา
- [ ] ไฟล์สำรองมีขนาดมากกว่า 0 bytes
- [ ] ระบบบันทึกสถานะการสำรอง
- [ ] ไฟล์เก่าถูกลบตาม retention policy
- [ ] สามารถกู้คืนข้อมูลจากไฟล์สำรองได้

---

### TC-ID: IT-006
**สถานการณ์ทดสอบ**: ความถูกต้องของใบแจ้งหนี้
**ขั้นตอนทดสอบ**: สร้างบิล/ส่วนลด/ภาษี

**ผลลัพธ์ที่คาดหวัง**: subtotal/discount/tax/total ถูกต้องตามสูตร

**ข้อมูลทดสอบ**:
```json
{
  "billingData": {
    "items": [
      {
        "description": "ค่ารักษา",
        "amount": 500,
        "quantity": 1
      },
      {
        "description": "ค่ายา",
        "amount": 300,
        "quantity": 1
      }
    ],
    "discount": {
      "type": "percentage",
      "value": 10
    },
    "tax": {
      "rate": 7
    }
  },
  "expectedCalculation": {
    "subtotal": 800,
    "discount_amount": 80,
    "taxable_amount": 720,
    "tax_amount": 50.4,
    "total": 770.4
  }
}
```

**การตรวจสอบ**:
- [ ] Subtotal = 500 + 300 = 800
- [ ] Discount = 800 × 10% = 80
- [ ] Taxable Amount = 800 - 80 = 720
- [ ] Tax = 720 × 7% = 50.4
- [ ] Total = 720 + 50.4 = 770.4
- [ ] การคำนวณถูกต้องทุกขั้นตอน

---

### TC-ID: IT-007
**สถานการณ์ทดสอบ**: รายงานยอดขายยา
**ขั้นตอนทดสอบ**: เรียกรายงานรายเดือน

**ผลลัพธ์ที่คาดหวัง**: ยอดรวม/จำนวนรายการตรง DB, กรองช่วงเวลาได้

**ข้อมูลทดสอบ**:
```json
{
  "reportPeriod": {
    "start_date": "2024-01-01",
    "end_date": "2024-01-31"
  },
  "expectedResults": {
    "total_sales": 50000,
    "total_transactions": 100,
    "top_medications": [
      {
        "medication": "Paracetamol",
        "quantity_sold": 500,
        "revenue": 10000
      }
    ],
    "daily_breakdown": "array of daily sales"
  }
}
```

**การตรวจสอบ**:
- [ ] ยอดรวมตรงกับข้อมูลในฐานข้อมูล
- [ ] จำนวนรายการถูกต้อง
- [ ] ยา 10 อันดับแรกแสดงถูกต้อง
- [ ] รายงานรายวันแสดงครบทุกวัน
- [ ] สามารถกรองตามช่วงเวลาได้
- [ ] สามารถส่งออกเป็น CSV/PDF ได้

---

### TC-ID: IT-008
**สถานการณ์ทดสอบ**: แนบไฟล์เวชระเบียน
**ขั้นตอนทดสอบ**: อัปโหลดไฟล์ผลตรวจ

**ผลลัพธ์ที่คาดหวัง**: ไฟล์ถูกเก็บ/ลิงก์ใน record, ป้องกันผู้ไม่มีสิทธิ์เข้าถึง

**ข้อมูลทดสอบ**:
```json
{
  "fileUpload": {
    "patientId": "patient_123",
    "recordId": "record_456",
    "fileType": "lab_result",
    "fileName": "lab_result_20240101.pdf",
    "fileSize": "2MB"
  },
  "accessControl": {
    "authorizedUsers": ["doctor01", "staff01"],
    "unauthorizedUsers": ["cashier01", "pharmacist01"]
  }
}
```

**การตรวจสอบ**:
- [ ] ไฟล์ถูกอัปโหลดและเก็บในระบบ
- [ ] ไฟล์ถูกเชื่อมโยงกับเวชระเบียน
- [ ] แพทย์และเจ้าหน้าที่เข้าถึงไฟล์ได้
- [ ] เจ้าหน้าที่การเงินและเภสัชกรเข้าถึงไฟล์ไม่ได้
- [ ] ระบบบันทึก Audit Log การเข้าถึงไฟล์
- [ ] ไฟล์มีระบบป้องกันการแก้ไข

---

## สรุปผลการทดสอบ

| TC-ID | Status | Pass/Fail | Notes |
|-------|--------|-----------|-------|
| IT-001 | - | - | รอการทดสอบ |
| IT-002 | - | - | รอการทดสอบ |
| IT-003 | - | - | รอการทดสอบ |
| IT-004 | - | - | รอการทดสอบ |
| IT-005 | - | - | รอการทดสอบ |
| IT-006 | - | - | รอการทดสอบ |
| IT-007 | - | - | รอการทดสอบ |
| IT-008 | - | - | รอการทดสอบ |

**สรุป**: ผ่าน 0/8, ล้มเหลว 0/8, รอการทดสอบ 8/8

---

## หมายเหตุ
- การทดสอบ Integration ครอบคลุมการทำงานร่วมกันของโมดูลต่างๆ
- ควรทำการทดสอบในสภาพแวดล้อมที่ใกล้เคียงกับระบบจริง
- ข้อมูลทดสอบควรครอบคลุมทั้งกรณีปกติและกรณีผิดปกติ
- ควรทดสอบประสิทธิภาพและความเสถียรของระบบด้วย
