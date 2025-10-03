import { test, expect } from '@playwright/test';

test.describe.serial('การทดสอบการจัดการผู้ป่วย E2E', () => {
  // สร้าง testPatient อันเดียวใช้ร่วมกัน
  const timestamp = Date.now();
  const testPatient = {
    firstName: `ผู้ป่วยทดสอบ_${timestamp}`,
    lastName: 'นามสกุลทดสอบ',
    nationalId: `${timestamp}`,
    phone: `08${Math.floor(Math.random() * 100000000)}`,
    email: `patient_test_${timestamp}@example.com`,
    dateOfBirth: '1990-01-01',
    gender: 'male',
    bloodGroup: 'O+',
    drugAllergies: 'Penicillin, Aspirin',
    address: '123 ถนนทดสอบ แขวงทดสอบ เขตทดสอบ กรุงเทพฯ 10110'
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
    
    // เข้าสู่ระบบด้วยผู้ใช้เจ้าหน้าที่
    await page.fill('[data-testid="username-input"]', 'staff01');
    await page.fill('[data-testid="password-input"]', 'staff123');
    await page.click('[data-testid="login-button"]');
    
    // รอให้ redirect ไปหน้า dashboard
    await page.waitForURL('/dashboard');
    
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
    
    // ไปที่การจัดการผู้ป่วย
    await page.click('[data-testid="patients-menu"]');
    await page.waitForURL('/dashboard/patients');
  });

  // 1. การตรวจสอบความถูกต้องของแบบฟอร์มผู้ป่วย
  test('UAT-001: การตรวจสอบความถูกต้องของแบบฟอร์มผู้ป่วย', async ({ page }) => {
    await page.click('[data-testid="add-patient-button"]');
    await page.waitForSelector('[data-testid="patient-form"]');

    // ทดสอบการตรวจสอบฟิลด์ที่จำเป็น
    await page.click('[data-testid="save-patient-button"]');

    // ตรวจสอบข้อผิดพลาดการตรวจสอบ (HTML5 validation)
    const firstNameInput = page.locator('[data-testid="first-name-input"]');
    const lastNameInput = page.locator('[data-testid="last-name-input"]');
    
    // ตรวจสอบ HTML5 validation
    await expect(firstNameInput).toHaveAttribute('required');
    await expect(lastNameInput).toHaveAttribute('required');

    // กรอกเฉพาะชื่อ (ข้อมูลไม่ครบ)
    await page.fill('[data-testid="first-name-input"]', 'ชื่อทดสอบ');
    await page.click('[data-testid="save-patient-button"]');
    
    // ควรยังคงแสดงข้อผิดพลาดการตรวจสอบสำหรับฟิลด์ที่จำเป็นอื่นๆ
    await expect(lastNameInput).toHaveAttribute('required');
    
    // ปิด modal
    await page.click('[data-testid="cancel-button"]');
  });

  // 2. การแบ่งหน้าผู้ป่วย
  test('UAT-001: การแบ่งหน้าผู้ป่วย', async ({ page }) => {
    // ตรวจสอบว่ามี pagination controls
    const paginationControls = page.locator('[data-testid="pagination-controls"]');
    
    // ถ้ามี pagination ให้ทดสอบ
    if (await paginationControls.isVisible()) {
      // ทดสอบการเปลี่ยนหน้า
      const nextButton = page.locator('[data-testid="next-page-button"]');
      const prevButton = page.locator('[data-testid="prev-page-button"]');
      
      if (await nextButton.isVisible()) {
        await nextButton.click();
        await page.waitForTimeout(1000); // รอให้โหลดหน้าใหม่
        
        if (await prevButton.isVisible()) {
          await prevButton.click();
          await page.waitForTimeout(1000);
        }
      }
    } else {
      // ถ้าไม่มี pagination ให้ตรวจสอบว่ามีผู้ป่วยน้อยกว่า 10 รายการ
      const patientRows = page.locator('[data-testid^="patient-row-"]');
      const patientCount = await patientRows.count();
      expect(patientCount).toBeLessThanOrEqual(10);
    }
  });

  // 3. ลงทะเบียนและค้นหาผู้ป่วย
  test('UAT-001: ลงทะเบียนและค้นหาผู้ป่วย', async ({ page }) => {
    // ขั้นตอนที่ 1: ลงทะเบียนผู้ป่วยใหม่
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
    
    // เลือกหมู่เลือด O+
    await page.click('[data-testid="blood-group-select"]');
    await page.waitForSelector('[role="option"]');
    await page.click(`[role="option"]:has-text("${testPatient.bloodGroup}")`);
    
    // กรอกที่อยู่
    await page.fill('[data-testid="address-input"]', testPatient.address);
    
    // กรอก Drug allergies
    await page.fill('[data-testid="drug-allergies-input"]', testPatient.drugAllergies);
    await page.click('[data-testid="add-drug-allergy-button"]');

    // ส่งแบบฟอร์ม
    console.log('📝 Submitting form with data:', testPatient);
    await page.click('[data-testid="save-patient-button"]');
    
    // รอสักครู่เพื่อให้ form process
    await page.waitForTimeout(2000);
    
    // รอให้ modal ปิด หรือตรวจสอบ error
    try {
      await page.waitForSelector('[data-testid="patient-form"]', { state: 'hidden', timeout: 10000 });
    } catch (error) {
      // ถ้า modal ไม่ปิด ให้ตรวจสอบ error message
      const errorMessage = page.locator('.sonner-toast, .error-message, [role="alert"]');
      if (await errorMessage.isVisible()) {
        const errorText = await errorMessage.textContent();
        if (errorText && errorText.trim()) {
          throw new Error(`Form submission failed: ${errorText}`);
        }
      }
      
      // ตรวจสอบ console errors
      const consoleErrors = await page.evaluate(() => {
        return window.console._errors || [];
      });
      
      if (consoleErrors.length > 0) {
        throw new Error(`Form submission failed with console errors: ${consoleErrors.join(', ')}`);
      }
      
      // ถ้าไม่มี error message ให้ลองกดปุ่มบันทึกอีกครั้ง
      await page.click('[data-testid="save-patient-button"]');
      await page.waitForSelector('[data-testid="patient-form"]', { state: 'hidden', timeout: 10000 });
    }
    
    // กดปุ่มรีเฟรชเพื่อดึงข้อมูลใหม่
    await page.click('[data-testid="refresh-button"]');
    
    // รอให้การรีเฟรชเสร็จสิ้น
    await page.waitForSelector('[data-testid="refresh-button"]:not([disabled])', { timeout: 10000 });

    // ขั้นตอนที่ 2: ค้นหาผู้ป่วยตามชื่อ (search is automatic on input change)
    await page.fill('[data-testid="search-input"]', testPatient.firstName);
    
    // รอผลการค้นหา
    await page.waitForSelector('[data-testid="patient-list"]');
    
    // ตรวจสอบผลการค้นหา
    const patientRow = page.locator('[data-testid^="patient-row-"]').first();
    await expect(patientRow).toBeVisible();
    await expect(patientRow.locator('[data-testid="patient-name"]')).toContainText(testPatient.firstName);
    await expect(patientRow.locator('[data-testid="patient-phone"]')).toContainText(testPatient.phone);

    // ขั้นตอนที่ 3: ค้นหาตามเลขบัตรประชาชน
    await page.fill('[data-testid="search-input"]', testPatient.nationalId);
    await expect(patientRow).toBeVisible();

    // ขั้นตอนที่ 4: ค้นหาตามเบอร์โทรศัพท์
    await page.fill('[data-testid="search-input"]', testPatient.phone);
    await expect(patientRow).toBeVisible();
  });

  // 4. ทดสอบประสิทธิภาพการค้นหา
  test('UAT-001: ทดสอบประสิทธิภาพการค้นหา', async ({ page }) => {
    // ทดสอบประสิทธิภาพการค้นหาด้วยเกณฑ์ที่แตกต่างกัน
    const searchTests = [
      { type: 'name', value: testPatient.firstName },
      { type: 'national_id', value: testPatient.nationalId },
      { type: 'phone', value: testPatient.phone }
    ];

    for (const searchTest of searchTests) {
      const startTime = Date.now();
      
      await page.fill('[data-testid="search-input"]', searchTest.value);
      await page.waitForSelector('[data-testid="patient-list"]');
      
      // ตรวจสอบผลการค้นหา
      const patientRow = page.locator('[data-testid^="patient-row-"]').first();
      await expect(patientRow).toBeVisible();
      
      // ตรวจสอบข้อมูลที่ค้นหา
      if (searchTest.type === 'name') {
        await expect(patientRow.locator('[data-testid="patient-name"]')).toContainText(testPatient.firstName);
      } else if (searchTest.type === 'national_id') {
        await expect(patientRow.locator('[data-testid="patient-national-id"]')).toContainText(testPatient.nationalId);
      } else if (searchTest.type === 'phone') {
        await expect(patientRow.locator('[data-testid="patient-phone"]')).toContainText(testPatient.phone);
      }
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // ตรวจสอบการค้นหาเสร็จสิ้นภายใน 5 วินาที
      expect(duration).toBeLessThan(5000);
      
      // ล้างการค้นหาสำหรับการทดสอบถัดไป
      await page.fill('[data-testid="search-input"]', '');
    }
  });

  // 6. การป้องกันผู้ป่วยซ้ำ
  test('UAT-001: การป้องกันผู้ป่วยซ้ำ', async ({ page }) => {
    const duplicatePatient = {
      firstName: 'ผู้ป่วยซ้ำทดสอบ',
      lastName: 'ผู้ป่วย',
      nationalId: '9876543210987',
      phone: '0898765432',
      email: 'duplicate_patient@example.com',
      dateOfBirth: '1985-05-15',
      gender: 'female',
      bloodGroup: 'A+',
      drugAllergies: 'Sulfa',
      address: '456 ถนนซ้ำ แขวงซ้ำ เขตซ้ำ กรุงเทพฯ 10220'
    };

    // สร้างผู้ป่วยคนแรก
    await page.click('[data-testid="add-patient-button"]');
    await page.waitForSelector('[data-testid="patient-form"]');

    await page.fill('[data-testid="first-name-input"]', duplicatePatient.firstName);
    await page.fill('[data-testid="last-name-input"]', duplicatePatient.lastName);
    await page.fill('[data-testid="national-id-input"]', duplicatePatient.nationalId);
    await page.fill('[data-testid="phone-input"]', duplicatePatient.phone);
    await page.fill('[data-testid="email-input"]', duplicatePatient.email);
    await page.fill('[data-testid="date-of-birth-input"]', duplicatePatient.dateOfBirth);
    
    // เลือกเพศ
    await page.click('[data-testid="gender-select"]');
    await page.waitForSelector('[role="option"]');
    await page.click(`[role="option"]:has-text("${duplicatePatient.gender === 'male' ? 'ชาย' : 'หญิง'}")`);
    
    // เลือกหมู่เลือด
    await page.click('[data-testid="blood-group-select"]');
    await page.waitForSelector('[role="option"]');
    await page.click(`[role="option"]:has-text("${duplicatePatient.bloodGroup}")`);
    
    // กรอกที่อยู่
    await page.fill('[data-testid="address-input"]', duplicatePatient.address);
    
    // กรอก Drug allergies
    await page.fill('[data-testid="drug-allergies-input"]', duplicatePatient.drugAllergies);
    await page.click('[data-testid="add-drug-allergy-button"]');

    await page.click('[data-testid="save-patient-button"]');
    
    // รอให้ modal ปิด
    try {
      await page.waitForSelector('[data-testid="patient-form"]', { state: 'hidden', timeout: 10000 });
    } catch (error) {
      // ถ้า modal ไม่ปิด ให้กดปุ่มยกเลิก
      await page.click('[data-testid="cancel-button"]');
      await page.waitForSelector('[data-testid="patient-form"]', { state: 'hidden', timeout: 5000 });
    }

    // รอสักครู่ให้ UI settle
    await page.waitForTimeout(2000);

    // ลองสร้างผู้ป่วยซ้ำ
    // ตรวจสอบว่ามี modal overlay บังหรือไม่
    const modalOverlay = page.locator('.fixed.inset-0.bg-black.bg-opacity-50');
    if (await modalOverlay.isVisible()) {
      console.log('🚨 Modal overlay detected, forcing click');
      await page.click('[data-testid="add-patient-button"]', { force: true });
    } else {
      await page.click('[data-testid="add-patient-button"]');
    }
    await page.waitForSelector('[data-testid="patient-form"]');

    await page.fill('[data-testid="first-name-input"]', 'ชื่ออื่น');
    await page.fill('[data-testid="last-name-input"]', duplicatePatient.lastName);
    await page.fill('[data-testid="national-id-input"]', duplicatePatient.nationalId); // เลขบัตรประชาชนเดียวกัน
    await page.fill('[data-testid="phone-input"]', '0811111111');
    await page.fill('[data-testid="email-input"]', 'อื่น@example.com');
    await page.fill('[data-testid="date-of-birth-input"]', duplicatePatient.dateOfBirth);
    
    // เลือกเพศ
    await page.click('[data-testid="gender-select"]');
    await page.waitForSelector('[role="option"]');
    await page.click(`[role="option"]:has-text("${duplicatePatient.gender === 'male' ? 'ชาย' : 'หญิง'}")`);
    
    // เลือกหมู่เลือด
    await page.click('[data-testid="blood-group-select"]');
    await page.waitForSelector('[role="option"]');
    await page.click(`[role="option"]:has-text("${duplicatePatient.bloodGroup}")`);
    
    // กรอกที่อยู่
    await page.fill('[data-testid="address-input"]', '789 ถนนอื่น แขวงอื่น เขตอื่น กรุงเทพฯ 10330');
    
    // กรอก Drug allergies
    await page.fill('[data-testid="drug-allergies-input"]', 'Ibuprofen');
    await page.click('[data-testid="add-drug-allergy-button"]');

    await page.click('[data-testid="save-patient-button"]');
    
    // รอ toast error message แสดงขึ้น
    try {
      // รอ toast error message - ใช้ selector ที่ครอบคลุมมากขึ้น
      await page.waitForSelector('[class*="toast"], [class*="go2072408551"], .react-hot-toast, [data-testid="toast-error"]', { timeout: 15000 });
      
      // ตรวจสอบข้อความ error
      const errorMessage = page.locator('[class*="toast"], [class*="go2072408551"], .react-hot-toast, [data-testid="toast-error"]');
      const errorText = await errorMessage.textContent();
      console.log('🔍 Error message found:', errorText);
      
      // ตรวจสอบว่าเป็น duplicate error หรือไม่
      if (errorText && (errorText.includes('ซ้ำ') || errorText.includes('duplicate') || errorText.includes('มีอยู่แล้ว'))) {
        console.log('✅ Duplicate patient error detected as expected');
      } else {
        throw new Error(`Unexpected error: ${errorText}`);
      }
      
    } catch (error) {
      console.log('🚨 No error toast found, checking for other error indicators...');
      
      // ตรวจสอบ error message อื่นๆ - ใช้ .first() เพื่อหลีกเลี่ยง strict mode violation
      const errorMessage = page.locator('.sonner-toast, .error-message, [role="alert"]:not([id="__next-route-announcer__"]), [class*="toast"]:not(.nextjs-toast)').first();
      if (await errorMessage.isVisible()) {
        const errorText = await errorMessage.textContent();
        console.log('🔍 Alternative error message found:', errorText);
        
        if (errorText && (errorText.includes('ซ้ำ') || errorText.includes('duplicate') || errorText.includes('มีอยู่แล้ว'))) {
          console.log('✅ Duplicate patient error detected as expected');
        } else {
          throw new Error(`Unexpected error: ${errorText}`);
        }
      } else {
        // ตรวจสอบ console errors แทน
        console.log('🚨 No visible error message found, checking console errors...');
        const consoleErrors = await page.evaluate(() => {
          // @ts-ignore
          return window.console._errors || [];
        });
        
        if (consoleErrors.length > 0) {
          const errorText = consoleErrors.join(' ');
          if (errorText.includes('ซ้ำ') || errorText.includes('duplicate') || errorText.includes('มีอยู่แล้ว')) {
            console.log('✅ Duplicate patient error detected in console as expected');
          } else {
            throw new Error(`Unexpected console error: ${errorText}`);
          }
        } else {
          throw new Error('No error message found after duplicate patient creation');
        }
      }
    }
    
    // ปิด modal
    await page.click('[data-testid="cancel-button"]');
    await page.waitForSelector('[data-testid="patient-form"]', { state: 'hidden', timeout: 5000 });
    
    // กดปุ่มรีเฟรชเพื่อดึงข้อมูลใหม่
    await page.click('[data-testid="refresh-button"]');
    
    // รอให้การรีเฟรชเสร็จสิ้น
    await page.waitForSelector('[data-testid="refresh-button"]:not([disabled])', { timeout: 10000 });
  });

  // test('UAT-001: การแบ่งหน้าผู้ป่วย', async ({ page }) => {
  //   // ทดสอบฟังก์ชันการแบ่งหน้า
  //   await page.waitForSelector('[data-testid="patient-list"]');
    
  //   // ตรวจสอบว่ามีตัวควบคุมการแบ่งหน้าหรือไม่
  //   const paginationControls = page.locator('[data-testid="pagination-controls"]');
    
  //   if (await paginationControls.isVisible()) {
  //     // ทดสอบหน้าถัดไป
  //     const nextButton = page.locator('[data-testid="next-page-button"]');
  //     if (await nextButton.isEnabled()) {
  //       await nextButton.click();
  //       await page.waitForSelector('[data-testid="patient-list"]');
        
  //       // ตรวจสอบหน้าเปลี่ยน
  //       const currentPage = page.locator('[data-testid="current-page"]');
  //       await expect(currentPage).toContainText('2');
  //     }
      
  //     // ทดสอบหน้าก่อนหน้า
  //     const prevButton = page.locator('[data-testid="previous-page-button"]');
  //     if (await prevButton.isEnabled()) {
  //       await prevButton.click();
  //       await page.waitForSelector('[data-testid="patient-list"]');
        
  //       // ตรวจสอบหน้าเปลี่ยนกลับ
  //       const currentPage = page.locator('[data-testid="current-page"]');
  //       await expect(currentPage).toContainText('1');
  //     }
  //   }
  // });

  // 5. Patient data accuracy
  test('UAT-001: Patient data accuracy', async ({ page }) => {
    // ค้นหาผู้ป่วยที่สร้างขึ้นใน test ก่อนหน้า
    await page.fill('[data-testid="search-input"]', testPatient.firstName);
    await page.waitForSelector('[data-testid="patient-list"]');

    const patientRow = page.locator('[data-testid^="patient-row-"]').first();
    await expect(patientRow).toBeVisible();

    // ตรวจสอบข้อมูลในหน้า list ก่อน
    await expect(patientRow.locator('[data-testid="patient-name"]')).toContainText(testPatient.firstName);
    await expect(patientRow.locator('[data-testid="patient-phone"]')).toContainText(testPatient.phone);
    await expect(patientRow.locator('[data-testid="patient-national-id"]')).toContainText(testPatient.nationalId);

    // Click on "ดูรายละเอียด" button to view details
    const viewDetailsButton = patientRow.locator('button[title="ดูรายละเอียด"]');
    await expect(viewDetailsButton).toBeVisible();
    await viewDetailsButton.click();
    
    // Wait for navigation to patient details page
    await page.waitForURL(/\/dashboard\/patients\/[^\/]+$/);
    
    // Wait for patient details page to load
    await page.waitForSelector('[data-testid="patient-details"]', { timeout: 10000 });

    // Verify patient data is displayed correctly in detail page
    await expect(page.locator('[data-testid="patient-detail-name"]')).toContainText(testPatient.firstName);
    await expect(page.locator('[data-testid="patient-detail-name"]')).toContainText(testPatient.lastName);
    await expect(page.locator('[data-testid="patient-detail-phone"]')).toContainText(testPatient.phone);
    await expect(page.locator('[data-testid="patient-detail-national-id"]')).toContainText(testPatient.nationalId);
    
    // กลับไปหน้า list
    await page.goBack();
    await page.waitForURL('/dashboard/patients');
  });
});

