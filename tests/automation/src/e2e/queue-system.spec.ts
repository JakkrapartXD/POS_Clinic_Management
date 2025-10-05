import { test, expect } from '@playwright/test';

test.describe.serial('การทดสอบระบบคิว E2E', () => {
  // สร้าง testPatient อันเดียวใช้ร่วมกัน
  const timestamp = Date.now();
  const testPatient = {
    firstName: `ผู้ป่วยคิวทดสอบ_${timestamp}`,
    lastName: 'นามสกุลคิวทดสอบ',
    nationalId: `${timestamp}`,
    phone: `08${Math.floor(Math.random() * 100000000).toString().padStart(8, '0')}`,
    email: `queue_patient_test_${timestamp}@example.com`,
    dateOfBirth: '1990-01-01',
    gender: 'male',
    bloodGroup: 'O+',
    drugAllergies: 'Penicillin',
    address: '123 ถนนคิวทดสอบ แขวงคิวทดสอบ เขตคิวทดสอบ กรุงเทพฯ 10110'
  };

  test.beforeEach(async ({ page }) => {
    // ตั้งค่า console logging และเก็บ errors
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log('🚨 Browser Error:', msg.text());
        consoleErrors.push(msg.text());
      }
    });
    
    // ตั้งค่า network request logging
    page.on('requestfailed', request => {
      console.log('🚨 Request Failed:', request.url(), request.failure()?.errorText);
    });
    
    // เก็บ console errors ใน window object
    await page.addInitScript(() => {
      // @ts-ignore
      window.console._errors = [];
      const originalError = console.error;
      console.error = (...args) => {
        // @ts-ignore
        window.console._errors.push(args.join(' '));
        originalError.apply(console, args);
      };
    });
    
    // ไปที่หน้า login
    await page.goto('/login');
    
    // เข้าสู่ระบบด้วยผู้ใช้พยาบาล (nurse)
    await page.fill('[data-testid="username-input"]', 'nurse01');
    await page.fill('[data-testid="password-input"]', 'nurse123');
    await page.click('[data-testid="login-button"]');
    
    // รอให้ redirect ไปหน้า dashboard
    await page.waitForURL('/dashboard/pos');
    
    // รอให้ authentication เสร็จสิ้น
    await page.waitForTimeout(3000);
    
    // รอให้ sidebar โหลดเสร็จ
    try {
      await page.waitForSelector('[data-testid="patients-menu"]', { timeout: 5000 });
    } catch (error) {
      // ถ้า sidebar ไม่โหลด ให้ refresh หน้า
      console.log('Sidebar not loaded, refreshing page...');
      await page.reload();
      await page.waitForSelector('[data-testid="patients-menu"]', { timeout: 5000 });
    }
  });

  test('UAT-Queue-001: ทดสอบระบบคิวคัดกรองแบบครบวงจร', async ({ page }) => {
    console.log('🚀 เริ่มทดสอบระบบคิวคัดกรองแบบครบวงจร');
    console.log('📋 ข้อมูลผู้ป่วยทดสอบ:', testPatient);

    // ===== ขั้นตอนที่ 1: สร้างผู้ป่วยใหม่ =====
    console.log('📝 ขั้นตอนที่ 1: สร้างผู้ป่วยใหม่');
    
    // ไปที่การจัดการผู้ป่วย
    await page.click('[data-testid="patients-menu"]');
    await page.waitForURL('/dashboard/patients');
    
    // กดปุ่มเพิ่มผู้ป่วย
    await page.click('[data-testid="add-patient-button"]');
    await page.waitForSelector('[data-testid="patient-form"]');

    // กรอกแบบฟอร์มผู้ป่วย
    await page.fill('[data-testid="first-name-input"]', testPatient.firstName);
    await page.fill('[data-testid="last-name-input"]', testPatient.lastName);
    await page.fill('[data-testid="national-id-input"]', testPatient.nationalId);
    await page.fill('[data-testid="phone-input"]', testPatient.phone);
    await page.fill('[data-testid="email-input"]', testPatient.email);
    await page.fill('[data-testid="date-of-birth-input"]', testPatient.dateOfBirth);
    
    // เลือกเพศ
    await page.click('[data-testid="gender-select"]');
    await page.waitForSelector('[role="option"]');
    await page.click(`[role="option"]:has-text("${testPatient.gender === 'male' ? 'ชาย' : 'หญิง'}")`);
    
    // เลือกหมู่เลือด
    await page.click('[data-testid="blood-group-select"]');
    await page.waitForSelector('[role="option"]');
    await page.click(`[role="option"]:has-text("${testPatient.bloodGroup}")`);
    
    // กรอกที่อยู่
    await page.fill('[data-testid="address-input"]', testPatient.address);
    
    // กรอก Drug allergies
    await page.fill('[data-testid="drug-allergies-input"]', testPatient.drugAllergies);
    await page.click('[data-testid="add-drug-allergy-button"]');

    // ส่งแบบฟอร์ม
    console.log('💾 บันทึกข้อมูลผู้ป่วย...');
    await page.click('[data-testid="save-patient-button"]');
    
    // รอให้ modal ปิด
    try {
      await page.waitForSelector('[data-testid="patient-form"]', { state: 'hidden', timeout: 10000 });
      console.log('✅ สร้างผู้ป่วยสำเร็จ');
    } catch (error) {
      console.log('🚨 Modal ไม่ปิด ให้ตรวจสอบ error');
      const errorMessage = page.locator('.sonner-toast, .error-message, [role="alert"]');
      if (await errorMessage.isVisible()) {
        const errorText = await errorMessage.textContent();
        throw new Error(`Form submission failed: ${errorText}`);
      }
    }

    // ===== ขั้นตอนที่ 2: ค้นหาผู้ป่วยที่สร้างขึ้น =====
    console.log('🔍 ขั้นตอนที่ 2: ค้นหาผู้ป่วยที่สร้างขึ้น');
    
    // กดปุ่มรีเฟรชเพื่อดึงข้อมูลใหม่
    await page.click('[data-testid="refresh-button"]');
    await page.waitForSelector('[data-testid="refresh-button"]:not([disabled])', { timeout: 10000 });

    // ค้นหาผู้ป่วยตามชื่อ
    await page.fill('[data-testid="search-input"]', testPatient.firstName);
    await page.waitForSelector('[data-testid="patient-list"]');
    
    // ตรวจสอบผลการค้นหา
    const patientRow = page.locator('[data-testid^="patient-row-"]').first();
    await expect(patientRow).toBeVisible();
    await expect(patientRow.locator('[data-testid="patient-name"]')).toContainText(testPatient.firstName);
    console.log('✅ พบผู้ป่วยที่สร้างขึ้น');

    // ===== ขั้นตอนที่ 3: เข้าดูรายละเอียดผู้ป่วยและเพิ่มคิวคัดกรอง =====
    console.log('👁️ ขั้นตอนที่ 3: เข้าดูรายละเอียดผู้ป่วยและเพิ่มคิวคัดกรอง');
    
    // Click on "ดูรายละเอียด" button
    const viewDetailsButton = patientRow.locator('button[title="ดูรายละเอียด"]');
    await expect(viewDetailsButton).toBeVisible();
    await viewDetailsButton.click();
    
    // รอให้ไปหน้า patient details
    await page.waitForURL(/\/dashboard\/patients\/[^\/]+$/);
    await page.waitForSelector('[data-testid="patient-details"]', { timeout: 10000 });
    console.log('✅ เข้าหน้ารายละเอียดผู้ป่วยสำเร็จ');

    // ตรวจสอบข้อมูลผู้ป่วย
    await expect(page.locator('[data-testid="patient-detail-name"]')).toContainText(testPatient.firstName);
    await expect(page.locator('[data-testid="patient-detail-phone"]')).toContainText(testPatient.phone);
    console.log('✅ ข้อมูลผู้ป่วยถูกต้อง');

    // กดปุ่มเพิ่มคิวคัดกรอง
    const addTriageButton = page.locator('button:has-text("เพิ่มคิวคัดกรอง")');
    await expect(addTriageButton).toBeVisible();
    await addTriageButton.click();
    
    // รอให้เด้งเข้าหน้าคิวคัดกรอง (ตรวจสอบผลลัพธ์จริงแทน toast)
    await page.waitForURL('/queue/triage');
    await page.waitForSelector('h1:has-text("คิวคัดกรอง")', { timeout: 10000 });
    console.log('✅ เด้งเข้าหน้าคิวคัดกรองสำเร็จ - การเพิ่มคิวสำเร็จ');

    // ===== ขั้นตอนที่ 4: ค้นหาผู้ป่วยในคิวและเรียก =====
    console.log('📞 ขั้นตอนที่ 4: ค้นหาผู้ป่วยในคิวและเรียก');
    
    // ค้นหาผู้ป่วยด้วยชื่อ
    const searchInput = page.locator('input[placeholder*="ค้นหา"]');
    await searchInput.fill(testPatient.firstName);
    await page.waitForTimeout(1000); // รอผลการค้นหา
    
    // หาตั๋วคิวของผู้ป่วย
    const ticketCard = page.locator(`[data-testid="ticket-card-${testPatient.phone}"]`);
    await expect(ticketCard).toBeVisible();
    console.log('✅ พบตั๋วคิวของผู้ป่วย');

    // กดปุ่มเรียก
    const callButton = page.locator(`[data-testid="call-button-${testPatient.phone}"]`);
    await expect(callButton).toBeVisible();
    await callButton.click();
    
    // รอให้ระบบประมวลผล
    await page.waitForTimeout(5000);
    console.log('✅ เรียกผู้ป่วยสำเร็จ');

    // ===== ขั้นตอนที่ 5: เริ่มคัดกรอง =====
    console.log('🏥 ขั้นตอนที่ 5: เริ่มคัดกรอง');
    
    // กดปุ่มเริ่มคัดกรอง
    const startButton = page.locator(`[data-testid="start-button-${testPatient.phone}"]`);
    await expect(startButton).toBeVisible();
    await startButton.click();
    
    // รอให้ระบบประมวลผล
    await page.waitForTimeout(5000);
    console.log('✅ เริ่มคัดกรองสำเร็จ');

    // ===== ขั้นตอนที่ 6: บันทึกสัญญาณชีพ =====
    console.log('📊 ขั้นตอนที่ 6: บันทึกสัญญาณชีพ');
    
    // กดปุ่มบันทึกสัญญาณชีพ
    const vitalsButton = page.locator(`[data-testid="vitals-button-${testPatient.phone}"]`);
    await expect(vitalsButton).toBeVisible();
    await vitalsButton.click();
    
    // รอ modal ขึ้นมา
    await page.waitForSelector('[role="dialog"]', { timeout: 10000 });
    console.log('✅ Modal บันทึกสัญญาณชีพเปิดขึ้น');

    // กรอกข้อมูลสัญญาณชีพ
    await page.fill('input[placeholder="170"]', '175'); // ส่วนสูง
    await page.fill('input[placeholder="70"]', '75'); // น้ำหนัก
    await page.fill('input[placeholder="36.5"]', '36.8'); // อุณหภูมิ
    await page.fill('input[placeholder="72"]', '80'); // อัตราการเต้นหัวใจ
    await page.fill('input[placeholder="120"]', '125'); // SBP
    await page.fill('input[placeholder="80"]', '85'); // DBP
    await page.fill('input[placeholder="20"]', '18'); // Respiratory Rate
    await page.fill('input[placeholder="98"]', '99'); // SpO2
    
    console.log('✅ กรอกข้อมูลสัญญาณชีพเสร็จ');

    // กดปุ่มบันทึกสัญญาณชีพ & ส่งคิวหมอ
    const saveVitalsButton = page.locator('button:has-text("บันทึกสัญญาณชีพ & ส่งคิวหมอ")');
    await expect(saveVitalsButton).toBeVisible();
    await saveVitalsButton.click();
    
    console.log('✅ บันทึกสัญญาณชีพสำเร็จ');

    // รอให้ modal ปิด
    await page.waitForSelector('[role="dialog"]', { state: 'hidden', timeout: 10000 });
    console.log('✅ Modal ปิดแล้ว');

    // ===== ขั้นตอนที่ 7: เสร็จสิ้นคัดกรอง =====
    console.log('✅ ขั้นตอนที่ 7: เสร็จสิ้นคัดกรอง');
    
    // กดปุ่มเสร็จสิ้น
    const completeButton = page.locator(`[data-testid="complete-button-${testPatient.phone}"]`);
    await expect(completeButton).toBeVisible();
    await completeButton.click();
    
    // รอให้ระบบประมวลผล
    await page.waitForTimeout(5000);
    console.log('✅ เสร็จสิ้นคัดกรองสำเร็จ');

    console.log('🎉 ทดสอบระบบคิวคัดกรองแบบครบวงจรเสร็จสิ้น!');
  });

  test.afterAll(async () => {
    // ทำความสะอาดข้อมูลทดสอบ (ถ้าต้องการ)
    console.log('🧹 ทำความสะอาดข้อมูลทดสอบ...');
    console.log('⚠️ หมายเหตุ: การทำความสะอาดข้อมูลทดสอบจะต้องทำด้วยตนเอง');
    console.log(`📋 ข้อมูลผู้ป่วยที่ต้องลบ: ${testPatient.firstName} (${testPatient.phone})`);
  });
});
