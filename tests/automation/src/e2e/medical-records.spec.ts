import { test, expect } from '@playwright/test';

test.describe('การทดสอบเวชระเบียน E2E', () => {
  let testPatientId: string;

  test.beforeEach(async ({ page }) => {
    // ไปที่หน้า login
    await page.goto('/login');
    
    // เข้าสู่ระบบด้วยผู้ใช้หมอ
    await page.fill('[data-testid="username-input"]', 'doctor01');
    await page.fill('[data-testid="password-input"]', 'doctor123');
    await page.click('[data-testid="login-button"]');
    
    // รอให้ redirect ไปหน้า dashboard
    await page.waitForURL('/dashboard/pos');
    
    // ไปที่หน้าผู้ป่วย
    await page.click('[data-testid="patients-menu"]');
    await page.waitForURL('/dashboard/patients');
    
    // สร้างหรือหาผู้ป่วยทดสอบ
    await page.fill('[data-testid="search-input"]', 'TestPatient');
    await page.click('[data-testid="search-button"]');
    await page.waitForSelector('[data-testid="patient-list"]');
    
    // คลิกผู้ป่วยแรกหรือสร้างใหม่
    const patientRow = page.locator('[data-testid^="patient-row-"]').first();
    if (await patientRow.isVisible()) {
      await patientRow.click();
      testPatientId = await patientRow.getAttribute('data-testid') || '';
    } else {
      // สร้างผู้ป่วยทดสอบใหม่
      await page.click('[data-testid="add-patient-button"]');
      await page.waitForSelector('[data-testid="patient-form"]');
      
      const timestamp = Date.now();
      await page.fill('[data-testid="first-name-input"]', `ผู้ป่วยทดสอบ_${timestamp}`);
      await page.fill('[data-testid="last-name-input"]', 'นามสกุลทดสอบ');
      await page.fill('[data-testid="national-id-input"]', `${timestamp}`);
      await page.fill('[data-testid="phone-input"]', `08${Math.floor(Math.random() * 100000000)}`);
      await page.fill('[data-testid="email-input"]', `ผู้ป่วยทดสอบ_${timestamp}@example.com`);
      await page.fill('[data-testid="date-of-birth-input"]', '1990-01-01');
      await page.selectOption('[data-testid="gender-select"]', 'male');
      
      await page.click('[data-testid="save-patient-button"]');
      await page.waitForSelector('[data-testid="success-message"]');
      
      // รับ ID ผู้ป่วยจากข้อความสำเร็จหรือ URL
      testPatientId = `patient-row-${timestamp}`;
    }
  });

  test('UAT-002: สร้างเวชระเบียนและใบสั่งยา', async ({ page }) => {
    // ไปที่รายละเอียดผู้ป่วย
    await page.click(`[data-testid="${testPatientId}"]`);
    await page.waitForSelector('[data-testid="patient-details"]');
    
    // คลิกแท็บเวชระเบียน
    await page.click('[data-testid="medical-records-tab"]');
    await page.waitForSelector('[data-testid="medical-records-section"]');
    
    // สร้างเวชระเบียนใหม่
    await page.click('[data-testid="add-medical-record-button"]');
    await page.waitForSelector('[data-testid="medical-record-form"]');
    
    // กรอกแบบฟอร์มเวชระเบียน
    await page.fill('[data-testid="chief-complaint-input"]', 'ปวดหัวมา 2 วัน');
    await page.fill('[data-testid="symptoms-input"]', 'ปวดหัวข้างเดียว, คลื่นไส้, แพ้แสง');
    await page.fill('[data-testid="diagnosis-input"]', 'ไมเกรน');
    await page.fill('[data-testid="treatment-plan-input"]', 'พักผ่อน, หลีกเลี่ยงแสงจ้า, ทานยาแก้ปวด');
    await page.fill('[data-testid="follow-up-input"]', 'ติดตามอาการใน 1 สัปดาห์');
    
    // เพิ่มรายการยา
    await page.click('[data-testid="add-prescription-item-button"]');
    await page.waitForSelector('[data-testid="prescription-item-form"]');
    
    // กรอกรายการยาที่หนึ่ง
    await page.selectOption('[data-testid="medication-select"]', 'Paracetamol 500mg');
    await page.fill('[data-testid="quantity-input"]', '20');
    await page.fill('[data-testid="dosage-input"]', '1-2 เม็ด ทุก 4-6 ชั่วโมง');
    await page.fill('[data-testid="duration-input"]', '3 วัน');
    
    // เพิ่มรายการยาที่สอง
    await page.click('[data-testid="add-prescription-item-button"]');
    await page.selectOption('[data-testid="medication-select"]', 'Ibuprofen 400mg');
    await page.fill('[data-testid="quantity-input"]', '10');
    await page.fill('[data-testid="dosage-input"]', '1 เม็ด หลังอาหาร');
    await page.fill('[data-testid="duration-input"]', '2 วัน');
    
    // บันทึกเวชระเบียน
    await page.click('[data-testid="save-medical-record-button"]');
    
    // รอข้อความสำเร็จ
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
    await expect(page.locator('[data-testid="success-message"]')).toContainText('บันทึกเวชระเบียนสำเร็จ');
    
    // ตรวจสอบเวชระเบียนแสดงผล
    await page.waitForSelector('[data-testid="medical-record-list"]');
    const medicalRecord = page.locator('[data-testid="medical-record-item"]').first();
    await expect(medicalRecord).toBeVisible();
    await expect(medicalRecord.locator('[data-testid="chief-complaint"]')).toContainText('ปวดหัวมา 2 วัน');
    await expect(medicalRecord.locator('[data-testid="diagnosis"]')).toContainText('ไมเกรน');
    
    // ตรวจสอบใบสั่งยาแสดงผล
    await page.click('[data-testid="view-prescription-button"]');
    await page.waitForSelector('[data-testid="prescription-details"]');
    
    const prescriptionItems = page.locator('[data-testid="prescription-item"]');
    await expect(prescriptionItems).toHaveCount(2);
    
    // ตรวจสอบรายการยาที่หนึ่ง
    const firstItem = prescriptionItems.nth(0);
    await expect(firstItem.locator('[data-testid="medication-name"]')).toContainText('Paracetamol 500mg');
    await expect(firstItem.locator('[data-testid="quantity"]')).toContainText('20');
    await expect(firstItem.locator('[data-testid="dosage"]')).toContainText('1-2 เม็ด ทุก 4-6 ชั่วโมง');
    
    // ตรวจสอบรายการยาที่สอง
    const secondItem = prescriptionItems.nth(1);
    await expect(secondItem.locator('[data-testid="medication-name"]')).toContainText('Ibuprofen 400mg');
    await expect(secondItem.locator('[data-testid="quantity"]')).toContainText('10');
    await expect(secondItem.locator('[data-testid="dosage"]')).toContainText('1 เม็ด หลังอาหาร');
  });

  test('UAT-002: Medical record form validation', async ({ page }) => {
    // Navigate to patient details
    await page.click(`[data-testid="${testPatientId}"]`);
    await page.waitForSelector('[data-testid="patient-details"]');
    
    // Click on medical records tab
    await page.click('[data-testid="medical-records-tab"]');
    await page.waitForSelector('[data-testid="medical-records-section"]');
    
    // Create new medical record
    await page.click('[data-testid="add-medical-record-button"]');
    await page.waitForSelector('[data-testid="medical-record-form"]');
    
    // Try to save without required fields
    await page.click('[data-testid="save-medical-record-button"]');
    
    // Check for validation errors
    await expect(page.locator('[data-testid="chief-complaint-error"]')).toBeVisible();
    await expect(page.locator('[data-testid="diagnosis-error"]')).toBeVisible();
    await expect(page.locator('[data-testid="treatment-plan-error"]')).toBeVisible();
    
    // Fill only chief complaint (incomplete data)
    await page.fill('[data-testid="chief-complaint-input"]', 'ปวดหัว');
    await page.click('[data-testid="save-medical-record-button"]');
    
    // Should still show validation errors for other required fields
    await expect(page.locator('[data-testid="diagnosis-error"]')).toBeVisible();
    await expect(page.locator('[data-testid="treatment-plan-error"]')).toBeVisible();
  });

  test('UAT-002: Prescription item validation', async ({ page }) => {
    // Navigate to patient details
    await page.click(`[data-testid="${testPatientId}"]`);
    await page.waitForSelector('[data-testid="patient-details"]');
    
    // Click on medical records tab
    await page.click('[data-testid="medical-records-tab"]');
    await page.waitForSelector('[data-testid="medical-records-section"]');
    
    // Create new medical record
    await page.click('[data-testid="add-medical-record-button"]');
    await page.waitForSelector('[data-testid="medical-record-form"]');
    
    // Fill required medical record fields
    await page.fill('[data-testid="chief-complaint-input"]', 'ปวดหัว');
    await page.fill('[data-testid="diagnosis-input"]', 'ไมเกรน');
    await page.fill('[data-testid="treatment-plan-input"]', 'ทานยา');
    
    // Add prescription item without required fields
    await page.click('[data-testid="add-prescription-item-button"]');
    await page.waitForSelector('[data-testid="prescription-item-form"]');
    
    // Try to save without selecting medication
    await page.click('[data-testid="save-medical-record-button"]');
    
    // Check for prescription validation errors
    await expect(page.locator('[data-testid="medication-error"]')).toBeVisible();
    await expect(page.locator('[data-testid="quantity-error"]')).toBeVisible();
    await expect(page.locator('[data-testid="dosage-error"]')).toBeVisible();
  });

  test('UAT-002: Medical record history', async ({ page }) => {
    // Navigate to patient details
    await page.click(`[data-testid="${testPatientId}"]`);
    await page.waitForSelector('[data-testid="patient-details"]');
    
    // Click on medical records tab
    await page.click('[data-testid="medical-records-tab"]');
    await page.waitForSelector('[data-testid="medical-records-section"]');
    
    // Create multiple medical records
    const records = [
      {
        chiefComplaint: 'ปวดหัว',
        diagnosis: 'ไมเกรน',
        treatment: 'ทานยาแก้ปวด'
      },
      {
        chiefComplaint: 'ไข้',
        diagnosis: 'ไข้หวัด',
        treatment: 'ทานยาลดไข้'
      }
    ];
    
    for (const record of records) {
      await page.click('[data-testid="add-medical-record-button"]');
      await page.waitForSelector('[data-testid="medical-record-form"]');
      
      await page.fill('[data-testid="chief-complaint-input"]', record.chiefComplaint);
      await page.fill('[data-testid="diagnosis-input"]', record.diagnosis);
      await page.fill('[data-testid="treatment-plan-input"]', record.treatment);
      
      await page.click('[data-testid="save-medical-record-button"]');
      await page.waitForSelector('[data-testid="success-message"]');
    }
    
    // Verify all records are displayed in chronological order
    await page.waitForSelector('[data-testid="medical-record-list"]');
    const medicalRecords = page.locator('[data-testid="medical-record-item"]');
    await expect(medicalRecords).toHaveCount(2);
    
    // Verify records are sorted by date (newest first)
    const firstRecord = medicalRecords.nth(0);
    const secondRecord = medicalRecords.nth(1);
    
    await expect(firstRecord.locator('[data-testid="chief-complaint"]')).toContainText('ไข้');
    await expect(secondRecord.locator('[data-testid="chief-complaint"]')).toContainText('ปวดหัว');
  });

  test('UAT-002: Prescription printing', async ({ page }) => {
    // Navigate to patient details
    await page.click(`[data-testid="${testPatientId}"]`);
    await page.waitForSelector('[data-testid="patient-details"]');
    
    // Click on medical records tab
    await page.click('[data-testid="medical-records-tab"]');
    await page.waitForSelector('[data-testid="medical-records-section"]');
    
    // Create medical record with prescription
    await page.click('[data-testid="add-medical-record-button"]');
    await page.waitForSelector('[data-testid="medical-record-form"]');
    
    await page.fill('[data-testid="chief-complaint-input"]', 'ปวดหัว');
    await page.fill('[data-testid="diagnosis-input"]', 'ไมเกรน');
    await page.fill('[data-testid="treatment-plan-input"]', 'ทานยา');
    
    // Add prescription item
    await page.click('[data-testid="add-prescription-item-button"]');
    await page.selectOption('[data-testid="medication-select"]', 'Paracetamol 500mg');
    await page.fill('[data-testid="quantity-input"]', '20');
    await page.fill('[data-testid="dosage-input"]', '1-2 เม็ด ทุก 4-6 ชั่วโมง');
    await page.fill('[data-testid="duration-input"]', '3 วัน');
    
    await page.click('[data-testid="save-medical-record-button"]');
    await page.waitForSelector('[data-testid="success-message"]');
    
    // View prescription
    await page.click('[data-testid="view-prescription-button"]');
    await page.waitForSelector('[data-testid="prescription-details"]');
    
    // Test print functionality
    const printButton = page.locator('[data-testid="print-prescription-button"]');
    await expect(printButton).toBeVisible();
    
    // Click print button (this will open print dialog in real browser)
    await printButton.click();
    
    // Verify print dialog or print preview is shown
    // Note: In headless mode, we can't test actual printing, but we can verify the button works
    await expect(page.locator('[data-testid="prescription-print-view"]')).toBeVisible();
  });

  test('UAT-002: การค้นหาและกรองเวชระเบียน', async ({ page }) => {
    // ไปที่รายละเอียดผู้ป่วย
    await page.click(`[data-testid="${testPatientId}"]`);
    await page.waitForSelector('[data-testid="patient-details"]');
    
    // คลิกแท็บเวชระเบียน
    await page.click('[data-testid="medical-records-tab"]');
    await page.waitForSelector('[data-testid="medical-records-section"]');
    
    // สร้างเวชระเบียนด้วยการวินิจฉัยที่แตกต่างกัน
    const records = [
      { chiefComplaint: 'ปวดหัว', diagnosis: 'ไมเกรน' },
      { chiefComplaint: 'ไข้', diagnosis: 'ไข้หวัด' },
      { chiefComplaint: 'ปวดท้อง', diagnosis: 'อาหารเป็นพิษ' }
    ];
    
    for (const record of records) {
      await page.click('[data-testid="add-medical-record-button"]');
      await page.waitForSelector('[data-testid="medical-record-form"]');
      
      await page.fill('[data-testid="chief-complaint-input"]', record.chiefComplaint);
      await page.fill('[data-testid="diagnosis-input"]', record.diagnosis);
      await page.fill('[data-testid="treatment-plan-input"]', 'รักษาตามอาการ');
      
      await page.click('[data-testid="save-medical-record-button"]');
      await page.waitForSelector('[data-testid="success-message"]');
    }
    
    // ทดสอบฟังก์ชันการค้นหา
    await page.fill('[data-testid="medical-record-search"]', 'ปวดหัว');
    await page.click('[data-testid="search-medical-records-button"]');
    
    // ตรวจสอบผลการค้นหา
    const searchResults = page.locator('[data-testid="medical-record-item"]');
    await expect(searchResults).toHaveCount(1);
    await expect(searchResults.locator('[data-testid="chief-complaint"]')).toContainText('ปวดหัว');
    
    // ทดสอบการกรองตามการวินิจฉัย
    await page.selectOption('[data-testid="diagnosis-filter"]', 'ไข้หวัด');
    await page.click('[data-testid="filter-medical-records-button"]');
    
    // ตรวจสอบผลการกรอง
    const filterResults = page.locator('[data-testid="medical-record-item"]');
    await expect(filterResults).toHaveCount(1);
    await expect(filterResults.locator('[data-testid="diagnosis"]')).toContainText('ไข้หวัด');
    
    // ล้างตัวกรอง
    await page.click('[data-testid="clear-filters-button"]');
    const allResults = page.locator('[data-testid="medical-record-item"]');
    await expect(allResults).toHaveCount(3);
  });
});

