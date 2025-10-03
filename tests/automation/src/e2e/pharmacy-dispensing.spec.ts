import { test, expect } from '@playwright/test';

test.describe('การทดสอบการจ่ายยา E2E', () => {
  test.beforeEach(async ({ page }) => {
    // ไปที่หน้า login
    await page.goto('/login');
    
    // เข้าสู่ระบบด้วยผู้ใช้เภสัชกร
    await page.fill('[data-testid="username-input"]', 'pharmacist01');
    await page.fill('[data-testid="password-input"]', 'pharmacist123');
    await page.click('[data-testid="login-button"]');
    
    // รอให้ redirect ไปหน้า dashboard
    await page.waitForURL('/dashboard');
    
    // ไปที่หน้า inventory (ฟังก์ชันเภสัชกรรมอยู่ใน inventory)
    await page.click('[data-testid="inventory-menu"]');
    await page.waitForURL('/dashboard/inventory');
  });

  test('UAT-003: จ่ายยาที่มีสต๊อกเพียงพอ', async ({ page }) => {
    // ไปที่หน้าเภสัชกรรมใน inventory
    await page.click('[data-testid="pharmacy"]');
    await page.waitForSelector('[data-testid="prescription-list"]');
    
    // เลือกใบสั่งยาแรก
    const prescriptionRow = page.locator('[data-testid="prescription-row"]').first();
    await expect(prescriptionRow).toBeVisible();
    await prescriptionRow.click();
    
    // ดูรายละเอียดใบสั่งยา
    await page.waitForSelector('[data-testid="prescription-details"]');
    
    // ตรวจสอบรายการยาและระดับสต๊อก
    const prescriptionItems = page.locator('[data-testid="prescription-item"]');
    await expect(prescriptionItems).toHaveCount(1);
    
    // ตรวจสอบระดับสต๊อกของแต่ละรายการ
    for (let i = 0; i < await prescriptionItems.count(); i++) {
      const item = prescriptionItems.nth(i);
      const stockLevel = await item.locator('[data-testid="stock-quantity"]').textContent();
      const prescribedQuantity = await item.locator('[data-testid="prescribed-quantity"]').textContent();
      
      // ตรวจสอบว่าสต๊อกเพียงพอ
      const stock = parseInt(stockLevel || '0');
      const prescribed = parseInt(prescribedQuantity || '0');
      expect(stock).toBeGreaterThanOrEqual(prescribed);
    }
    
    // ยืนยันการจ่ายยา
    await page.click('[data-testid="confirm-dispensing-button"]');
    
    // รอ dialog ยืนยัน
    await page.waitForSelector('[data-testid="dispensing-confirmation-dialog"]');
    await page.click('[data-testid="confirm-dispense-button"]');
    
    // รอข้อความสำเร็จ
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
    await expect(page.locator('[data-testid="success-message"]')).toContainText('จ่ายยาสำเร็จ');
    
    // ตรวจสอบสถานะใบสั่งยาที่อัปเดต
    await page.waitForSelector('[data-testid="prescription-status"]');
    await expect(page.locator('[data-testid="prescription-status"]')).toContainText('จ่ายแล้ว');
    
    // ตรวจสอบระดับสต๊อกที่อัปเดต
    for (let i = 0; i < await prescriptionItems.count(); i++) {
      const item = prescriptionItems.nth(i);
      const newStockLevel = await item.locator('[data-testid="stock-quantity"]').textContent();
      const prescribedQuantity = await item.locator('[data-testid="prescribed-quantity"]').textContent();
      
      const newStock = parseInt(newStockLevel || '0');
      const prescribed = parseInt(prescribedQuantity || '0');
      
      // สต๊อกควรลดลงตามจำนวนที่สั่ง
      expect(newStock).toBeLessThan(parseInt(await item.locator('[data-testid="original-stock"]').textContent() || '0'));
    }
  });

  test('UAT-003: จัดการสต๊อกไม่เพียงพอระหว่างการจ่ายยา', async ({ page }) => {
    // ไปที่ใบสั่งยาที่รอจ่าย
    await page.click('[data-testid="pending-prescriptions-tab"]');
    await page.waitForSelector('[data-testid="prescription-list"]');
    
    // หาใบสั่งยาที่มีสต๊อกต่ำ
    const prescriptionRows = page.locator('[data-testid="prescription-row"]');
    
    for (let i = 0; i < await prescriptionRows.count(); i++) {
      const row = prescriptionRows.nth(i);
      const hasLowStock = await row.locator('[data-testid="low-stock-warning"]').isVisible();
      
      if (hasLowStock) {
        await row.click();
        await page.waitForSelector('[data-testid="prescription-details"]');
        
        // ตรวจสอบการแจ้งเตือนสต๊อกต่ำ
        await expect(page.locator('[data-testid="low-stock-alert"]')).toBeVisible();
        await expect(page.locator('[data-testid="low-stock-alert"]')).toContainText('สต๊อกไม่เพียงพอ');
        
        // ตรวจสอบรายการที่มีสต๊อกไม่เพียงพอ
        const prescriptionItems = page.locator('[data-testid="prescription-item"]');
        
        for (let j = 0; j < await prescriptionItems.count(); j++) {
          const item = prescriptionItems.nth(j);
          const stockLevel = await item.locator('[data-testid="stock-quantity"]').textContent();
          const prescribedQuantity = await item.locator('[data-testid="prescribed-quantity"]').textContent();
          
          const stock = parseInt(stockLevel || '0');
          const prescribed = parseInt(prescribedQuantity || '0');
          
          if (stock < prescribed) {
            // รายการนี้มีสต๊อกไม่เพียงพอ
            await expect(item.locator('[data-testid="insufficient-stock-warning"]')).toBeVisible();
            await expect(item.locator('[data-testid="insufficient-stock-warning"]')).toContainText('จำนวนยาไม่เพียงพอ');
          }
        }
        
        // ลองยืนยันการจ่ายยา (ควรถูกปิดใช้งานหรือแสดงข้อผิดพลาด)
        const confirmButton = page.locator('[data-testid="confirm-dispensing-button"]');
        const isDisabled = await confirmButton.isDisabled();
        
        if (!isDisabled) {
          await confirmButton.click();
          await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
          await expect(page.locator('[data-testid="error-message"]')).toContainText('ไม่สามารถจ่ายยาได้เนื่องจากสต๊อกไม่เพียงพอ');
        }
        
        break;
      }
    }
  });

  test('UAT-003: การติดตามระดับสต๊อกและการแจ้งเตือน', async ({ page }) => {
    // ไปที่การจัดการ inventory/สต๊อก
    await page.click('[data-testid="inventory-menu"]');
    await page.waitForURL('/dashboard/inventory');
    
    // ตรวจสอบการแจ้งเตือนสต๊อก
    await page.click('[data-testid="stock-alerts-tab"]');
    await page.waitForSelector('[data-testid="stock-alerts-list"]');
    
    // ตรวจสอบการแจ้งเตือนสต๊อกต่ำ
    const stockAlerts = page.locator('[data-testid="stock-alert-item"]');
    
    if (await stockAlerts.count() > 0) {
      const firstAlert = stockAlerts.first();
      await expect(firstAlert.locator('[data-testid="alert-type"]')).toContainText('สต๊อกต่ำ');
      await expect(firstAlert.locator('[data-testid="product-name"]')).toBeVisible();
      await expect(firstAlert.locator('[data-testid="current-stock"]')).toBeVisible();
      await expect(firstAlert.locator('[data-testid="reorder-point"]')).toBeVisible();
    }
    
    // ตรวจสอบการแจ้งเตือนหมดอายุ
    await page.click('[data-testid="expiry-alerts-tab"]');
    await page.waitForSelector('[data-testid="expiry-alerts-list"]');
    
    const expiryAlerts = page.locator('[data-testid="expiry-alert-item"]');
    
    if (await expiryAlerts.count() > 0) {
      const firstExpiryAlert = expiryAlerts.first();
      await expect(firstExpiryAlert.locator('[data-testid="alert-type"]')).toContainText('ใกล้หมดอายุ');
      await expect(firstExpiryAlert.locator('[data-testid="product-name"]')).toBeVisible();
      await expect(firstExpiryAlert.locator('[data-testid="expiry-date"]')).toBeVisible();
      await expect(firstExpiryAlert.locator('[data-testid="days-remaining"]')).toBeVisible();
    }
  });

  test('UAT-003: จ่ายยาบางส่วนเมื่อบางรายการหมดสต๊อก', async ({ page }) => {
    // ไปที่ใบสั่งยาที่รอจ่าย
    await page.click('[data-testid="pending-prescriptions-tab"]');
    await page.waitForSelector('[data-testid="prescription-list"]');
    
    // หาใบสั่งยาที่มีระดับสต๊อกผสม
    const prescriptionRows = page.locator('[data-testid="prescription-row"]');
    
    for (let i = 0; i < await prescriptionRows.count(); i++) {
      const row = prescriptionRows.nth(i);
      await row.click();
      await page.waitForSelector('[data-testid="prescription-details"]');
      
      const prescriptionItems = page.locator('[data-testid="prescription-item"]');
      let hasSufficientStock = false;
      let hasInsufficientStock = false;
      
      // ตรวจสอบระดับสต๊อกของแต่ละรายการ
      for (let j = 0; j < await prescriptionItems.count(); j++) {
        const item = prescriptionItems.nth(j);
        const stockLevel = await item.locator('[data-testid="stock-quantity"]').textContent();
        const prescribedQuantity = await item.locator('[data-testid="prescribed-quantity"]').textContent();
        
        const stock = parseInt(stockLevel || '0');
        const prescribed = parseInt(prescribedQuantity || '0');
        
        if (stock >= prescribed) {
          hasSufficientStock = true;
        } else {
          hasInsufficientStock = true;
        }
      }
      
      // หากพบใบสั่งยาที่มีระดับสต๊อกผสม
      if (hasSufficientStock && hasInsufficientStock) {
        // ทดสอบการจ่ายยาบางส่วน
        await page.click('[data-testid="partial-dispensing-button"]');
        await page.waitForSelector('[data-testid="partial-dispensing-dialog"]');
        
        // เลือกรายการที่มีสต๊อกเพียงพอ
        const prescriptionItems = page.locator('[data-testid="prescription-item"]');
        
        for (let j = 0; j < await prescriptionItems.count(); j++) {
          const item = prescriptionItems.nth(j);
          const stockLevel = await item.locator('[data-testid="stock-quantity"]').textContent();
          const prescribedQuantity = await item.locator('[data-testid="prescribed-quantity"]').textContent();
          
          const stock = parseInt(stockLevel || '0');
          const prescribed = parseInt(prescribedQuantity || '0');
          
          if (stock >= prescribed) {
            // เลือกรายการนี้สำหรับการจ่ายยา
            await item.locator('[data-testid="select-for-dispensing"]').check();
          }
        }
        
        // ยืนยันการจ่ายยาบางส่วน
        await page.click('[data-testid="confirm-partial-dispensing-button"]');
        
        // รอข้อความสำเร็จ
        await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
        await expect(page.locator('[data-testid="success-message"]')).toContainText('จ่ายยาบางส่วนสำเร็จ');
        
        // ตรวจสอบสถานะใบสั่งยาที่อัปเดตเป็นการจ่ายบางส่วน
        await expect(page.locator('[data-testid="prescription-status"]')).toContainText('จ่ายบางส่วน');
        
        break;
      }
    }
  });

  test('UAT-003: ประวัติการจ่ายยาและการติดตาม', async ({ page }) => {
    // ไปที่ประวัติการจ่ายยา
    await page.click('[data-testid="dispensing-history-tab"]');
    await page.waitForSelector('[data-testid="dispensing-history-list"]');
    
    // ตรวจสอบประวัติการจ่ายยา
    const historyItems = page.locator('[data-testid="dispensing-history-item"]');
    
    if (await historyItems.count() > 0) {
      const firstItem = historyItems.first();
      
      // ตรวจสอบข้อมูลที่จำเป็น
      await expect(firstItem.locator('[data-testid="patient-name"]')).toBeVisible();
      await expect(firstItem.locator('[data-testid="prescription-date"]')).toBeVisible();
      await expect(firstItem.locator('[data-testid="dispensing-date"]')).toBeVisible();
      await expect(firstItem.locator('[data-testid="dispensed-by"]')).toBeVisible();
      await expect(firstItem.locator('[data-testid="dispensing-status"]')).toBeVisible();
      
      // คลิกเพื่อดูรายละเอียด
      await firstItem.click();
      await page.waitForSelector('[data-testid="dispensing-details"]');
      
      // ตรวจสอบข้อมูลรายละเอียด
      await expect(page.locator('[data-testid="patient-info"]')).toBeVisible();
      await expect(page.locator('[data-testid="prescription-items"]')).toBeVisible();
      await expect(page.locator('[data-testid="dispensing-info"]')).toBeVisible();
    }
  });

  test('UAT-003: การปรับสต๊อกหลังการจ่ายยา', async ({ page }) => {
    // ไปที่ inventory
    await page.click('[data-testid="inventory-menu"]');
    await page.waitForURL('/dashboard/inventory');
    
    // รับระดับสต๊อกเริ่มต้นของสินค้า
    const productRow = page.locator('[data-testid="product-row"]').first();
    await expect(productRow).toBeVisible();
    
    const initialStock = await productRow.locator('[data-testid="stock-quantity"]').textContent();
    const productName = await productRow.locator('[data-testid="product-name"]').textContent();
    
    // กลับไปที่ inventory (ฟังก์ชันเภสัชกรรมอยู่ใน inventory)
    await page.click('[data-testid="inventory-menu"]');
    await page.waitForURL('/dashboard/inventory');
    
    // จ่ายยาสำหรับสินค้านี้
    await page.click('[data-testid="pending-prescriptions-tab"]');
    await page.waitForSelector('[data-testid="prescription-list"]');
    
    // หาใบสั่งยาที่มีสินค้านี้
    const prescriptionRows = page.locator('[data-testid="prescription-row"]');
    
    for (let i = 0; i < await prescriptionRows.count(); i++) {
      const row = prescriptionRows.nth(i);
      await row.click();
      await page.waitForSelector('[data-testid="prescription-details"]');
      
      const prescriptionItems = page.locator('[data-testid="prescription-item"]');
      
      for (let j = 0; j < await prescriptionItems.count(); j++) {
        const item = prescriptionItems.nth(j);
        const itemProductName = await item.locator('[data-testid="product-name"]').textContent();
        
        if (itemProductName === productName) {
          // ใบสั่งยานี้มีสินค้าของเรา
          await page.click('[data-testid="confirm-dispensing-button"]');
          await page.waitForSelector('[data-testid="dispensing-confirmation-dialog"]');
          await page.click('[data-testid="confirm-dispense-button"]');
          
          await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
          
          // กลับไปที่ inventory เพื่อตรวจสอบการปรับสต๊อก
          await page.click('[data-testid="inventory-menu"]');
          await page.waitForURL('/dashboard/inventory');
          
          // หาสินค้าเดียวกัน
          const updatedProductRow = page.locator(`[data-testid="product-row-${productName}"]`);
          await expect(updatedProductRow).toBeVisible();
          
          const updatedStock = await updatedProductRow.locator('[data-testid="stock-quantity"]').textContent();
          const dispensedQuantity = await item.locator('[data-testid="prescribed-quantity"]').textContent();
          
          // ตรวจสอบว่าสต๊อกลดลงอย่างถูกต้อง
          const initial = parseInt(initialStock || '0');
          const updated = parseInt(updatedStock || '0');
          const dispensed = parseInt(dispensedQuantity || '0');
          
          expect(updated).toBe(initial - dispensed);
          
          return;
        }
      }
    }
  });

  test('UAT-003: การตรวจสอบวันหมดอายุระหว่างการจ่ายยา', async ({ page }) => {
    // ไปที่ใบสั่งยาที่รอจ่าย
    await page.click('[data-testid="pending-prescriptions-tab"]');
    await page.waitForSelector('[data-testid="prescription-list"]');
    
    // เลือกใบสั่งยา
    const prescriptionRow = page.locator('[data-testid="prescription-row"]').first();
    await prescriptionRow.click();
    await page.waitForSelector('[data-testid="prescription-details"]');
    
    // ตรวจสอบการแจ้งเตือนหมดอายุ
    const prescriptionItems = page.locator('[data-testid="prescription-item"]');
    
    for (let i = 0; i < await prescriptionItems.count(); i++) {
      const item = prescriptionItems.nth(i);
      const expiryWarning = item.locator('[data-testid="expiry-warning"]');
      
      if (await expiryWarning.isVisible()) {
        // รายการนี้มีการแจ้งเตือนหมดอายุ
        await expect(expiryWarning).toContainText('ใกล้หมดอายุ');
        
        const expiryDate = await item.locator('[data-testid="expiry-date"]').textContent();
        const daysRemaining = await item.locator('[data-testid="days-remaining"]').textContent();
        
        expect(expiryDate).toBeTruthy();
        expect(daysRemaining).toBeTruthy();
        
        // ตรวจสอบว่าการแจ้งเตือนเหมาะสม (เช่น เหลือน้อยกว่า 30 วัน)
        const days = parseInt(daysRemaining || '0');
        expect(days).toBeLessThan(30);
      }
    }
    
    // ดำเนินการจ่ายยา (ระบบควรยังคงอนุญาตให้จ่ายพร้อมการแจ้งเตือน)
    await page.click('[data-testid="confirm-dispensing-button"]');
    await page.waitForSelector('[data-testid="dispensing-confirmation-dialog"]');
    
    // ตรวจสอบการแจ้งเตือนหมดอายุใน dialog ยืนยัน
    const expiryWarningInDialog = page.locator('[data-testid="expiry-warning-dialog"]');
    if (await expiryWarningInDialog.isVisible()) {
      await expect(expiryWarningInDialog).toContainText('มียาที่ใกล้หมดอายุ');
    }
    
    await page.click('[data-testid="confirm-dispense-button"]');
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
  });
});

