import { test, expect } from '@playwright/test';

test.describe('การทดสอบประวัติการจ่ายยาใน Medical Records E2E', () => {
  test.beforeEach(async ({ page }) => {
    // ไปที่หน้า login
    await page.goto('/login');
    
    // เข้าสู่ระบบด้วยผู้ใช้หมอ
    await page.fill('[data-testid="username-input"]', 'doctor01');
    await page.fill('[data-testid="password-input"]', 'doctor123');
    await page.click('[data-testid="login-button"]');
    
    // รอให้ redirect ไปหน้า dashboard
    await page.waitForURL('/dashboard');
  });

  test('UAT-003: ดูประวัติการจ่ายยาใน Medical Records', async ({ page }) => {
    // ไปที่หน้า Medical Records
    await page.click('[data-testid="medical-menu"]');
    await page.waitForURL('/dashboard/medical');
    
    // ไปที่หน้า Patients
    await page.click('[data-testid="patients-tab"]');
    await page.waitForSelector('[data-testid="patients-list"]');
    
    // เลือกผู้ป่วยคนแรก
    const patientRow = page.locator('[data-testid="patient-row"]').first();
    await expect(patientRow).toBeVisible();
    await patientRow.click();
    
    // รอให้ไปที่หน้า patient detail
    await page.waitForURL(/\/dashboard\/patients\/\w+/);
    
    // ไปที่ tab ประวัติการจ่ายยา
    await page.click('[data-testid="dispensing-history-tab"]');
    await page.waitForSelector('[data-testid="dispensing-history-list"]');
    
    // ตรวจสอบประวัติการจ่ายยา
    const historyItems = page.locator('[data-testid="dispensing-history-item"]');
    
    if (await historyItems.count() > 0) {
      const firstItem = historyItems.first();
      
      // ตรวจสอบข้อมูลที่จำเป็น
      await expect(firstItem.locator('[data-testid="dispensing-date"]')).toBeVisible();
      await expect(firstItem.locator('[data-testid="dispensed-by"]')).toBeVisible();
      await expect(firstItem.locator('[data-testid="dispensing-status"]')).toBeVisible();
      await expect(firstItem.locator('[data-testid="total-amount"]')).toBeVisible();
      
      // คลิกเพื่อดูรายละเอียด
      await firstItem.click();
      await page.waitForSelector('[data-testid="dispensing-details"]');
      
      // ตรวจสอบข้อมูลรายละเอียด
      await expect(page.locator('[data-testid="patient-info"]')).toBeVisible();
      await expect(page.locator('[data-testid="dispensed-items"]')).toBeVisible();
      await expect(page.locator('[data-testid="dispensing-info"]')).toBeVisible();
      await expect(page.locator('[data-testid="receipt-info"]')).toBeVisible();
    } else {
      // ถ้าไม่มีประวัติการจ่ายยา
      await expect(page.locator('[data-testid="no-dispensing-history"]')).toBeVisible();
      await expect(page.locator('[data-testid="no-dispensing-history"]')).toContainText('ไม่มีประวัติการจ่ายยา');
    }
  });

  test('UAT-003: ดูรายละเอียดการจ่ายยาแต่ละครั้ง', async ({ page }) => {
    // ไปที่หน้า Medical Records
    await page.click('[data-testid="medical-menu"]');
    await page.waitForURL('/dashboard/medical');
    
    // ไปที่หน้า Patients
    await page.click('[data-testid="patients-tab"]');
    await page.waitForSelector('[data-testid="patients-list"]');
    
    // เลือกผู้ป่วยที่มีประวัติการจ่ายยา
    const patientRows = page.locator('[data-testid="patient-row"]');
    
    for (let i = 0; i < await patientRows.count(); i++) {
      const row = patientRows.nth(i);
      await row.click();
      await page.waitForURL(/\/dashboard\/patients\/\w+/);
      
      // ไปที่ tab ประวัติการจ่ายยา
      await page.click('[data-testid="dispensing-history-tab"]');
      await page.waitForSelector('[data-testid="dispensing-history-list"]');
      
      const historyItems = page.locator('[data-testid="dispensing-history-item"]');
      
      if (await historyItems.count() > 0) {
        // เลือกรายการแรก
        const firstItem = historyItems.first();
        await firstItem.click();
        await page.waitForSelector('[data-testid="dispensing-details"]');
        
        // ตรวจสอบข้อมูลผู้ป่วย
        await expect(page.locator('[data-testid="patient-name"]')).toBeVisible();
        await expect(page.locator('[data-testid="patient-id"]')).toBeVisible();
        await expect(page.locator('[data-testid="patient-phone"]')).toBeVisible();
        
        // ตรวจสอบรายการยาที่จ่าย
        const dispensedItems = page.locator('[data-testid="dispensed-item"]');
        await expect(dispensedItems.first()).toBeVisible();
        
        // ตรวจสอบข้อมูลแต่ละรายการยา
        const firstDispensedItem = dispensedItems.first();
        await expect(firstDispensedItem.locator('[data-testid="product-name"]')).toBeVisible();
        await expect(firstDispensedItem.locator('[data-testid="quantity"]')).toBeVisible();
        await expect(firstDispensedItem.locator('[data-testid="unit-price"]')).toBeVisible();
        await expect(firstDispensedItem.locator('[data-testid="total-price"]')).toBeVisible();
        
        // ตรวจสอบข้อมูลการจ่ายยา
        await expect(page.locator('[data-testid="dispensing-date"]')).toBeVisible();
        await expect(page.locator('[data-testid="dispensed-by"]')).toBeVisible();
        await expect(page.locator('[data-testid="payment-method"]')).toBeVisible();
        await expect(page.locator('[data-testid="receipt-number"]')).toBeVisible();
        
        // ตรวจสอบยอดรวม
        await expect(page.locator('[data-testid="subtotal"]')).toBeVisible();
        await expect(page.locator('[data-testid="vat-amount"]')).toBeVisible();
        await expect(page.locator('[data-testid="grand-total"]')).toBeVisible();
        
        break;
      }
    }
  });

  test('UAT-003: การกรองและค้นหาประวัติการจ่ายยา', async ({ page }) => {
    // ไปที่หน้า Medical Records
    await page.click('[data-testid="medical-menu"]');
    await page.waitForURL('/dashboard/medical');
    
    // ไปที่หน้า Patients
    await page.click('[data-testid="patients-tab"]');
    await page.waitForSelector('[data-testid="patients-list"]');
    
    // เลือกผู้ป่วยคนแรก
    const patientRow = page.locator('[data-testid="patient-row"]').first();
    await patientRow.click();
    await page.waitForURL(/\/dashboard\/patients\/\w+/);
    
    // ไปที่ tab ประวัติการจ่ายยา
    await page.click('[data-testid="dispensing-history-tab"]');
    await page.waitForSelector('[data-testid="dispensing-history-list"]');
    
    // ทดสอบการกรองตามวันที่
    await page.click('[data-testid="date-filter-button"]');
    await page.waitForSelector('[data-testid="date-filter-dialog"]');
    
    // เลือกช่วงวันที่
    await page.fill('[data-testid="start-date-input"]', '2024-01-01');
    await page.fill('[data-testid="end-date-input"]', '2024-12-31');
    await page.click('[data-testid="apply-date-filter"]');
    
    // ตรวจสอบผลการกรอง
    await page.waitForSelector('[data-testid="dispensing-history-list"]');
    
    // ทดสอบการกรองตามสถานะ
    await page.click('[data-testid="status-filter-button"]');
    await page.waitForSelector('[data-testid="status-filter-dropdown"]');
    await page.click('[data-testid="status-completed"]');
    
    // ตรวจสอบผลการกรอง
    const historyItems = page.locator('[data-testid="dispensing-history-item"]');
    if (await historyItems.count() > 0) {
      for (let i = 0; i < await historyItems.count(); i++) {
        const item = historyItems.nth(i);
        const status = await item.locator('[data-testid="dispensing-status"]').textContent();
        expect(status).toContain('จ่ายแล้ว');
      }
    }
    
    // ทดสอบการค้นหา
    await page.fill('[data-testid="search-dispensing-input"]', 'ยา');
    await page.waitForTimeout(1000);
    
    // ตรวจสอบผลการค้นหา
    const searchResults = page.locator('[data-testid="dispensing-history-item"]');
    if (await searchResults.count() > 0) {
      const firstResult = searchResults.first();
      const productName = await firstResult.locator('[data-testid="product-name"]').textContent();
      expect(productName?.toLowerCase()).toContain('ยา');
    }
  });

  test('UAT-003: การส่งออกประวัติการจ่ายยา', async ({ page }) => {
    // ไปที่หน้า Medical Records
    await page.click('[data-testid="medical-menu"]');
    await page.waitForURL('/dashboard/medical');
    
    // ไปที่หน้า Patients
    await page.click('[data-testid="patients-tab"]');
    await page.waitForSelector('[data-testid="patients-list"]');
    
    // เลือกผู้ป่วยคนแรก
    const patientRow = page.locator('[data-testid="patient-row"]').first();
    await patientRow.click();
    await page.waitForURL(/\/dashboard\/patients\/\w+/);
    
    // ไปที่ tab ประวัติการจ่ายยา
    await page.click('[data-testid="dispensing-history-tab"]');
    await page.waitForSelector('[data-testid="dispensing-history-list"]');
    
    // ทดสอบการส่งออกเป็น PDF
    await page.click('[data-testid="export-pdf-button"]');
    await page.waitForSelector('[data-testid="export-dialog"]');
    
    // เลือกช่วงวันที่
    await page.fill('[data-testid="export-start-date"]', '2024-01-01');
    await page.fill('[data-testid="export-end-date"]', '2024-12-31');
    
    // ยืนยันการส่งออก
    await page.click('[data-testid="confirm-export"]');
    
    // รอการดาวน์โหลด
    const downloadPromise = page.waitForEvent('download');
    const download = await downloadPromise;
    
    // ตรวจสอบชื่อไฟล์
    expect(download.suggestedFilename()).toContain('dispensing-history');
    expect(download.suggestedFilename()).toContain('.pdf');
    
    // ทดสอบการส่งออกเป็น Excel
    await page.click('[data-testid="export-excel-button"]');
    await page.waitForSelector('[data-testid="export-dialog"]');
    
    await page.fill('[data-testid="export-start-date"]', '2024-01-01');
    await page.fill('[data-testid="export-end-date"]', '2024-12-31');
    await page.click('[data-testid="confirm-export"]');
    
    const excelDownloadPromise = page.waitForEvent('download');
    const excelDownload = await excelDownloadPromise;
    
    // ตรวจสอบชื่อไฟล์ Excel
    expect(excelDownload.suggestedFilename()).toContain('dispensing-history');
    expect(excelDownload.suggestedFilename()).toContain('.xlsx');
  });

  test('UAT-003: การดูสถิติการจ่ายยา', async ({ page }) => {
    // ไปที่หน้า Medical Records
    await page.click('[data-testid="medical-menu"]');
    await page.waitForURL('/dashboard/medical');
    
    // ไปที่หน้า Patients
    await page.click('[data-testid="patients-tab"]');
    await page.waitForSelector('[data-testid="patients-list"]');
    
    // เลือกผู้ป่วยคนแรก
    const patientRow = page.locator('[data-testid="patient-row"]').first();
    await patientRow.click();
    await page.waitForURL(/\/dashboard\/patients\/\w+/);
    
    // ไปที่ tab ประวัติการจ่ายยา
    await page.click('[data-testid="dispensing-history-tab"]');
    await page.waitForSelector('[data-testid="dispensing-history-list"]');
    
    // ไปที่ tab สถิติ
    await page.click('[data-testid="dispensing-statistics-tab"]');
    await page.waitForSelector('[data-testid="statistics-content"]');
    
    // ตรวจสอบสถิติการจ่ายยา
    await expect(page.locator('[data-testid="total-dispensing-count"]')).toBeVisible();
    await expect(page.locator('[data-testid="total-amount-spent"]')).toBeVisible();
    await expect(page.locator('[data-testid="average-amount-per-visit"]')).toBeVisible();
    await expect(page.locator('[data-testid="most-prescribed-drugs"]')).toBeVisible();
    
    // ตรวจสอบกราฟสถิติ
    await expect(page.locator('[data-testid="dispensing-trend-chart"]')).toBeVisible();
    await expect(page.locator('[data-testid="drug-usage-chart"]')).toBeVisible();
    
    // ทดสอบการเปลี่ยนช่วงเวลาสถิติ
    await page.click('[data-testid="time-range-selector"]');
    await page.click('[data-testid="time-range-6months"]');
    
    // ตรวจสอบว่าสถิติอัปเดต
    await page.waitForTimeout(2000);
    await expect(page.locator('[data-testid="statistics-content"]')).toBeVisible();
  });
});
