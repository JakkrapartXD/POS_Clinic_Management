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

  // Helper function สำหรับ setup page
  const setupPage = async (page: any) => {
    // ตั้งค่า console logging และเก็บ errors
    const consoleErrors: string[] = [];
    page.on('console', (msg: any) => {
      if (msg.type() === 'error') {
        console.log('🚨 Browser Error:', msg.text());
        consoleErrors.push(msg.text());
      }
    });
    
    // ตั้งค่า network request logging
    page.on('requestfailed', (request: any) => {
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
  };

  // Helper function สำหรับ login ด้วย nurse
  const loginAsNurse = async (page: any) => {
    await setupPage(page);
    
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
  };

  // Helper function สำหรับ login ด้วย doctor
  const loginAsDoctor = async (page: any) => {
    await setupPage(page);
    
    // ไปที่หน้า login
    await page.goto('/login');
    
    // เข้าสู่ระบบด้วยผู้ใช้หมอ (doctor)
    await page.fill('[data-testid="username-input"]', 'doctor01');
    await page.fill('[data-testid="password-input"]', 'doctor123');
    await page.click('[data-testid="login-button"]');
    
    // รอให้ redirect ไปหน้า dashboard
    await page.waitForURL('/dashboard/pos');
    
    // รอให้ authentication เสร็จสิ้น
    await page.waitForTimeout(3000);
    
    // รอให้ sidebar โหลดเสร็จ
    try {
      await page.waitForSelector('[data-testid="queue/doctor-menu"]', { timeout: 5000 });
    } catch (error) {
      // ถ้า sidebar ไม่โหลด ให้ refresh หน้า
      console.log('Sidebar not loaded, refreshing page...');
      await page.reload();
      await page.waitForSelector('[data-testid="queue/doctor-menu"]', { timeout: 5000 });
    }
  };

  // Helper function สำหรับ login ด้วย cashier
  const loginAsCashier = async (page: any) => {
    await setupPage(page);
    
    // ไปที่หน้า login
    await page.goto('/login');
    
    // เข้าสู่ระบบด้วยผู้ใช้แคชเชียร์ (cashier)
    await page.fill('[data-testid="username-input"]', 'cashier01');
    await page.fill('[data-testid="password-input"]', 'cashier123');
    await page.click('[data-testid="login-button"]');
    
    // รอให้ redirect ไปหน้า dashboard
    await page.waitForURL('/dashboard/pos');
    
    // รอให้ authentication เสร็จสิ้น
    await page.waitForTimeout(3000);
    
    // รอให้ sidebar โหลดเสร็จ
    try {
      await page.waitForSelector('[data-testid="queue/cashier-menu"]', { timeout: 5000 });
    } catch (error) {
      // ถ้า sidebar ไม่โหลด ให้ refresh หน้า
      console.log('Sidebar not loaded, refreshing page...');
      await page.reload();
      await page.waitForSelector('[data-testid="queue/cashier-menu"]', { timeout: 5000 });
    }
  };

  test('UAT-Queue-001: ทดสอบระบบคิวคัดกรองแบบครบวงจร', async ({ page }) => {
    console.log('🚀 เริ่มทดสอบระบบคิวคัดกรองแบบครบวงจร');
    console.log('📋 ข้อมูลผู้ป่วยทดสอบ:', testPatient);

    // Login ด้วย nurse
    await loginAsNurse(page);

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

  test('UAT-Queue-002: ทดสอบระบบคิวหมอแบบครบวงจร', async ({ page }) => {
    console.log('🚀 เริ่มทดสอบระบบคิวหมอแบบครบวงจร');
    console.log('📋 ข้อมูลผู้ป่วยทดสอบ:', testPatient);

    // ===== ขั้นตอนที่ 1: Login ด้วย doctor01 =====
    console.log('🔐 ขั้นตอนที่ 1: Login ด้วย doctor01');
    
    // Login ด้วย doctor
    await loginAsDoctor(page);
    console.log('✅ Login ด้วย doctor01 สำเร็จ');

    // ===== ขั้นตอนที่ 2: เข้าคิวหมอ =====
    console.log('🏥 ขั้นตอนที่ 2: เข้าคิวหมอ');
    
    // กดเข้าคิวหมอ
    await page.click('[data-testid="queue/doctor-menu"]');
    
    // รอให้ไปหน้า doctor queue
    await page.waitForURL('/queue/doctor');
    console.log('✅ เข้าคิวหมอสำเร็จ');

    // ===== ขั้นตอนที่ 3: ตรวจสอบหน้าและค้นหาผู้ป่วย =====
    console.log('🔍 ขั้นตอนที่ 3: ตรวจสอบหน้าและค้นหาผู้ป่วย');
    
    // ตรวจสอบ h1:has-text("คิวหมอ")
    await expect(page.locator('h1:has-text("คิวหมอ")')).toBeVisible();
    console.log('✅ หน้าแสดงหัวข้อ "คิวหมอ"');
    
    // ค้นหาผู้ป่วยด้วยชื่อ
    const searchInput = page.locator('input[placeholder*="ค้นหา"]');
    await searchInput.fill(testPatient.firstName);
    await page.waitForTimeout(2000); // รอผลการค้นหา
    console.log('✅ ค้นหาผู้ป่วยด้วยชื่อ');

    // ===== ขั้นตอนที่ 4: เรียกผู้ป่วย =====
    console.log('📞 ขั้นตอนที่ 4: เรียกผู้ป่วย');
    
    // หาตั๋วคิวของผู้ป่วย (รอเรียก)
    const ticketCard = page.locator(`[data-testid="ticket-card-${testPatient.phone}"]`).first();
    await expect(ticketCard).toBeVisible();
    
    // กดปุ่มเรียก
    const callButton = ticketCard.locator('button:has-text("เรียก")');
    await expect(callButton).toBeVisible();
    await callButton.click();
    
    // รอ 3 วินาที
    await page.waitForTimeout(3000);
    console.log('✅ เรียกผู้ป่วยสำเร็จ');

    // ===== ขั้นตอนที่ 5: เริ่มตรวจ =====
    console.log('🩺 ขั้นตอนที่ 5: เริ่มตรวจ');
    
    // กดปุ่มเริ่มตรวจ
    const startButton = ticketCard.locator('button:has-text("เริ่มตรวจ")');
    await expect(startButton).toBeVisible();
    await startButton.click();
    
    // รอให้ระบบประมวลผล
    await page.waitForTimeout(3000);
    console.log('✅ เริ่มตรวจสำเร็จ');

    // ===== ขั้นตอนที่ 6: ดูสัญญาณชีพ =====
    console.log('📊 ขั้นตอนที่ 6: ดูสัญญาณชีพ');
    
    // กดปุ่มดูสัญญาณชีพ
    const vitalsButton = ticketCard.locator('button:has-text("ดูสัญญาณชีพ")');
    await expect(vitalsButton).toBeVisible();
    await vitalsButton.click();
    
    // รอ modal ขึ้นมา
    await page.waitForSelector('[role="dialog"]', { timeout: 10000 });
    console.log('✅ Modal สัญญาณชีพเปิดขึ้น');
    
    // ตรวจสอบข้อมูลสัญญาณชีพที่กรอกไปในขั้นตอนแรก
    const vitalsModal = page.locator('[role="dialog"]');
    await expect(vitalsModal.locator('text=175 cm')).toBeVisible(); // ส่วนสูง
    await expect(vitalsModal.locator('text=75 kg')).toBeVisible(); // น้ำหนัก
    await expect(vitalsModal.locator('text=36.8 °C')).toBeVisible(); // อุณหภูมิ
    await expect(vitalsModal.locator('text=80 bpm')).toBeVisible(); // อัตราการเต้นหัวใจ
    await expect(vitalsModal.locator('text=125/85 mmHg')).toBeVisible(); // ความดันโลหิต
    await expect(vitalsModal.locator('text=99 %')).toBeVisible(); // SpO2
    console.log('✅ ตรวจสอบข้อมูลสัญญาณชีพถูกต้อง');
    
    // กดปิด modal
    const closeButton = vitalsModal.locator('button:has-text("ปิด")');
    await closeButton.click();
    await page.waitForSelector('[role="dialog"]', { state: 'hidden', timeout: 5000 });
    console.log('✅ ปิด modal สัญญาณชีพ');

    // ===== ขั้นตอนที่ 7: บันทึกการตรวจ =====
    console.log('📝 ขั้นตอนที่ 7: บันทึกการตรวจ');
    
    // กดปุ่มบันทึกการตรวจ
    const consultationButton = ticketCard.locator('button:has-text("บันทึกการตรวจ")');
    await expect(consultationButton).toBeVisible();
    await consultationButton.click();
    
    // รอ modal ขึ้นมา
    await page.waitForSelector('[role="dialog"]', { timeout: 10000 });
    console.log('✅ Modal บันทึกการตรวจเปิดขึ้น');
    
    // กรอกข้อมูลการตรวจ
    const consultationModal = page.locator('[role="dialog"]');
    
    // กรอกอาการสำคัญ
    await consultationModal.locator('textarea[placeholder*="อาการสำคัญ"]').fill('ปวดหัวและมีไข้');
    
    // กรอกการวินิจฉัย
    await consultationModal.locator('textarea[placeholder*="การวินิจฉัย"]').fill('ไข้หวัดธรรมดา');
    
    // กรอกแผนการรักษา
    await consultationModal.locator('textarea[placeholder*="แผนการรักษา"]').fill('ให้ยาลดไข้และพักผ่อน');
    
    // กรอกวันที่นัดหมาย (1 ธันวาคม 2025)
    await consultationModal.locator('input[type="date"]').fill('2025-12-01');
    
    // กรอกเหตุผลการนัดหมาย
    await consultationModal.locator('input[placeholder*="เช่น ติดตามผลการรักษา, ตรวจเลือด..."]').fill('ติดตามผลการรักษา');
    
    console.log('✅ กรอกข้อมูลการตรวจเสร็จ');
    await page.waitForTimeout(3000);
    // กดปุ่มบันทึก
    const saveButton = consultationModal.locator('[data-testid="save-consultation-button"]');
    await expect(saveButton).toBeVisible();
    await saveButton.click();
    
    // รอให้ระบบประมวลผล
    await page.waitForTimeout(3000);
    console.log('✅ บันทึกการตรวจสำเร็จ');

    // ===== ขั้นตอนที่ 8: สั่งยา =====
    console.log('💊 ขั้นตอนที่ 8: สั่งยา');
    
    // กดปุ่มสั่งยา
    const prescriptionButton = ticketCard.locator('button:has-text("สั่งยา")');
    await expect(prescriptionButton).toBeVisible();
    await prescriptionButton.click();
    
    // รอ modal ขึ้นมา
    await page.waitForSelector('[role="dialog"]', { timeout: 10000 });
    console.log('✅ Modal สั่งยาเปิดขึ้น');
    
    const prescriptionModal = page.locator('[role="dialog"]');
    
    // ค้นหายาในช่องค้นหา
    const productSearchInput = prescriptionModal.locator('input[placeholder*="ค้นหาสินค้าจากชื่อ หรือบาร์โค้ด..."]');
    await productSearchInput.fill('ยา');
    await page.waitForTimeout(1000);
    
    // คลิกเพิ่มยาตัวแรกที่พบ
    const firstProduct = prescriptionModal.locator('[data-testid^="product-card-"]').first();
    await expect(firstProduct).toBeVisible();
    await firstProduct.click();
    console.log('✅ เพิ่มยาตัวแรกเข้าตะกร้า');
    
    // ค้นหา "ค่าตรวจ"
    await productSearchInput.clear();
    await productSearchInput.fill('ค่าตรวจ');
    await page.waitForTimeout(1000);
    
    // คลิกเพิ่มค่าตรวจตัวแรกที่พบ
    const firstLabTest = prescriptionModal.locator('[data-testid^="product-card-"]').first();
    await expect(firstLabTest).toBeVisible();
    await firstLabTest.click();
    console.log('✅ เพิ่มค่าตรวจเข้าตะกร้า');
    
    // กดปุ่มบันทึก
    const savePrescriptionButton = prescriptionModal.locator('button:has-text("บันทึก")');
    await expect(savePrescriptionButton).toBeVisible();
    await savePrescriptionButton.click();
    
    // รอ 2 วินาที
    await page.waitForTimeout(2000);
    console.log('✅ บันทึกการสั่งยาสำเร็จ');

    // ===== ขั้นตอนที่ 9: เสร็จสิ้น =====
    console.log('✅ ขั้นตอนที่ 9: เสร็จสิ้น');
    
    // กดปุ่มเสร็จสิ้น
    const completeButton = ticketCard.locator('button:has-text("เสร็จสิ้น")');
    await expect(completeButton).toBeVisible();
    await completeButton.click();
    
    // รอให้ระบบประมวลผล
    await page.waitForTimeout(3000);
    console.log('✅ เสร็จสิ้นการตรวจสำเร็จ');

    console.log('🎉 ทดสอบระบบคิวหมอแบบครบวงจรเสร็จสิ้น!');
  });

  test('UAT-Queue-003: ทดสอบระบบคิวแคชเชียร์แบบครบวงจร', async ({ page }) => {
    console.log('🚀 เริ่มทดสอบระบบคิวแคชเชียร์แบบครบวงจร');
    console.log('📋 ข้อมูลผู้ป่วยทดสอบ:', testPatient);

    // ===== ขั้นตอนที่ 1: Login ด้วย cashier01 =====
    console.log('🔐 ขั้นตอนที่ 1: Login ด้วย cashier01');
    
    // Login ด้วย cashier
    await loginAsCashier(page);
    console.log('✅ Login ด้วย cashier01 สำเร็จ');

    // ===== ขั้นตอนที่ 2: เข้าคิวแคชเชียร์ =====
    console.log('💰 ขั้นตอนที่ 2: เข้าคิวแคชเชียร์');
    
    // กดเข้าคิวแคชเชียร์
    await page.click('[data-testid="queue/cashier-menu"]');
    
    // รอให้ไปหน้า cashier queue
    await page.waitForURL('/queue/cashier');
    console.log('✅ เข้าคิวแคชเชียร์สำเร็จ');

    // ===== ขั้นตอนที่ 3: ค้นหาผู้ป่วย =====
    console.log('🔍 ขั้นตอนที่ 3: ค้นหาผู้ป่วย');
    
    // ค้นหาผู้ป่วยด้วยชื่อ
    const searchInput = page.locator('input[placeholder*="ค้นหา"]');
    await searchInput.fill(testPatient.firstName);
    await page.waitForTimeout(2000); // รอผลการค้นหา
    console.log('✅ ค้นหาผู้ป่วยด้วยชื่อ');

    // ===== ขั้นตอนที่ 4: เรียกผู้ป่วยและเริ่มบริการ =====
    console.log('📞 ขั้นตอนที่ 4: เรียกผู้ป่วยและเริ่มบริการ');
    
    // หาตั๋วคิวของผู้ป่วย (รอเรียก)
    const ticketCard = page.locator(`[data-testid="ticket-card-${testPatient.phone}"]`).first();
    await expect(ticketCard).toBeVisible();
    
    // กดปุ่มเรียก
    const callButton = ticketCard.locator('button:has-text("เรียก")');
    await expect(callButton).toBeVisible();
    await callButton.click();
    
    // รอ 2 วินาที
    await page.waitForTimeout(2000);
    console.log('✅ เรียกผู้ป่วยสำเร็จ');
    
    // กดปุ่มเริ่มบริการ
    const startButton = ticketCard.locator('button:has-text("เริ่มบริการ")');
    await expect(startButton).toBeVisible();
    await startButton.click();
    
    // รอให้ระบบประมวลผล
    await page.waitForTimeout(3000);
    console.log('✅ เริ่มบริการสำเร็จ');

    // ===== ขั้นตอนที่ 5: เปิด POS =====
    console.log('🛒 ขั้นตอนที่ 5: เปิด POS');
    
    // กดปุ่มเปิด POS
    const openPOSButton = ticketCard.locator(`[data-testid="open-pos-button-${testPatient.phone}"]`);
    await expect(openPOSButton).toBeVisible();
    await openPOSButton.click();
    
    // รอให้ไปหน้า POS
    await page.waitForURL('/dashboard/pos');
    console.log('✅ เปิด POS สำเร็จ');

    // ===== ขั้นตอนที่ 6: ตรวจสอบข้อมูลการสั่งยาจากหมอ =====
    console.log('📋 ขั้นตอนที่ 6: ตรวจสอบข้อมูลการสั่งยาจากหมอ');
    
    // รอให้หน้า POS โหลดเสร็จ
    await page.waitForSelector('[data-testid="product-grid"]');
    
    // ตรวจสอบส่วนตะกร้าสินค้า
    const prescriptionSection = page.locator('[data-testid="prescription-title"]').locator('..');
    await expect(prescriptionSection).toBeVisible();
    console.log('✅ พบส่วนข้อมูลการสั่งยาจากหมอ');
    
    // ตรวจสอบข้อมูลผู้ป่วยในส่วนการสั่งยาจากหมอ
    await expect(page.locator('[data-testid="prescription-patient-name"]')).toBeVisible();
    console.log('✅ ตรวจสอบข้อมูลผู้ป่วย');
    
    // ตรวจสอบอาการสำคัญ
    await expect(page.locator('[data-testid="prescription-chief-complaint"]')).toBeVisible();
    console.log('✅ ตรวจสอบอาการสำคัญ');
    
    // ตรวจสอบการวินิจฉัย
    await expect(page.locator('[data-testid="prescription-diagnosis"]')).toBeVisible();
    console.log('✅ ตรวจสอบการวินิจฉัย');
    
    // ตรวจสอบแผนการรักษา
    await expect(page.locator('[data-testid="prescription-treatment-plan"]')).toBeVisible();
    console.log('✅ ตรวจสอบแผนการรักษา');
    
    // ตรวจสอบว่ามีสินค้าในตะกร้าจากการสั่งยาของหมอ
    const cartItems = page.locator('[data-testid="cart-item"]');
    await expect(cartItems).toHaveCount(2); // ควรมียาและค่าตรวจ
    console.log('✅ ตรวจสอบสินค้าในตะกร้าจากการสั่งยาของหมอ');

    // ===== ขั้นตอนที่ 7: ชำระสินค้า =====
    console.log('💳 ขั้นตอนที่ 7: ชำระสินค้า');
    console.log('✅ ตรวจสอบสินค้าในตะกร้า');
    
    // คลิกชำระเงิน
    await page.click('[data-testid="checkout-button"]');
    
    // รอ dialog การชำระเงิน
    await page.waitForSelector('[data-testid="payment-dialog"]');
    console.log('✅ เปิด dialog การชำระเงิน');
    
    // เลือกวิธีการชำระเงินเป็นเงินสด
    await page.click('[data-testid="payment-method-cash"]');
    
    // ใช้ numpad ใส่จำนวนเงิน
    await page.click('[data-testid="numpad-1"]');
    await page.click('[data-testid="numpad-0"]');
    await page.click('[data-testid="numpad-0"]');
    await page.click('[data-testid="numpad-0"]');
    
    // ยืนยันการชำระเงิน
    await page.click('[data-testid="confirm-payment-button"]');
    
    // รอ dialog สำเร็จ
    await expect(page.locator('[data-testid="payment-success-dialog"]')).toBeVisible();
    console.log('✅ การชำระเงินสำเร็จ');
    
    // ตรวจสอบข้อมูลใบเสร็จ
    await expect(page.locator('[data-testid="receipt-number"]')).toBeVisible();
    await expect(page.locator('[data-testid="receipt-items"]')).toBeVisible();
    await expect(page.locator('[data-testid="receipt-total"]')).toBeVisible();
    await expect(page.locator('[data-testid="receipt-payment-method"]')).toBeVisible();
    console.log('✅ ตรวจสอบข้อมูลใบเสร็จ');
    
    // ปิด dialog สำเร็จ
    await page.click('[data-testid="close-success-dialog"]');
    
    // รอให้ dialog ปิด
    await page.waitForTimeout(1000);
    
    // ตรวจสอบว่าตระกร้าว่าง
    await expect(page.locator('[data-testid="cart-item"]')).toHaveCount(0);
    console.log('✅ ตระกร้าว่างหลังการชำระเงิน');

    // ===== ขั้นตอนที่ 8: กลับมาหน้าคิวแคชเชียร์ =====
    console.log('🔄 ขั้นตอนที่ 8: กลับมาหน้าคิวแคชเชียร์');
    
    // กลับมาหน้าคิวแคชเชียร์
    await page.click('[data-testid="queue/cashier-menu"]');
    
    // รอให้ไปหน้า cashier queue
    await page.waitForURL('/queue/cashier');
    console.log('✅ กลับมาหน้าคิวแคชเชียร์สำเร็จ');

    // ===== ขั้นตอนที่ 9: ค้นหาผู้ป่วยเดิม =====
    console.log('🔍 ขั้นตอนที่ 9: ค้นหาผู้ป่วยเดิม');
    
    // ค้นหาผู้ป่วยด้วยชื่อเดิม
    const searchInputAgain = page.locator('input[placeholder*="ค้นหา"]');
    await searchInputAgain.fill(testPatient.firstName);
    await page.waitForTimeout(2000); // รอผลการค้นหา
    console.log('✅ ค้นหาผู้ป่วยเดิมด้วยชื่อ');

    // ===== ขั้นตอนที่ 10: กดปุ่มเสร็จสิ้น =====
    console.log('✅ ขั้นตอนที่ 10: กดปุ่มเสร็จสิ้น');
    
    // หาตั๋วคิวของผู้ป่วย (ควรอยู่ในสถานะ in_service หรือ done)
    const ticketCardAgain = page.locator(`[data-testid="ticket-card-${testPatient.phone}"]`).first();
    await expect(ticketCardAgain).toBeVisible();
    console.log('✅ พบตั๋วคิวของผู้ป่วย');
    
    // กดปุ่มเสร็จสิ้น
    const completeButton = ticketCardAgain.locator('button:has-text("เสร็จสิ้น")');
    await expect(completeButton).toBeVisible();
    await completeButton.click();
    
    // รอให้ระบบประมวลผล
    await page.waitForTimeout(3000);
    console.log('✅ เสร็จสิ้นการบริการแคชเชียร์สำเร็จ');

    console.log('🎉 ทดสอบระบบคิวแคชเชียร์แบบครบวงจรเสร็จสิ้น!');
  });

  test.afterAll(async () => {
    // ทำความสะอาดข้อมูลทดสอบ (ถ้าต้องการ)
    console.log('🧹 ทำความสะอาดข้อมูลทดสอบ...');
    console.log('⚠️ หมายเหตุ: การทำความสะอาดข้อมูลทดสอบจะต้องทำด้วยตนเอง');
    console.log(`📋 ข้อมูลผู้ป่วยที่ต้องลบ: ${testPatient.firstName} (${testPatient.phone})`);
  });
});
