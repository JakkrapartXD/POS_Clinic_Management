import { test, expect } from '@playwright/test';

test.describe.serial('การทดสอบระบบสต๊อกสินค้า E2E', () => {
  // สร้าง testProduct อันเดียวใช้ร่วมกัน
  const timestamp = Date.now();
  const testProduct = {
    product_name: `ยาทดสอบระบบสต๊อก_${timestamp}`,
    generic_name: 'Generic Test Medicine',
    short_name: 'TestMed',
    product_type: 'medicine',
    category: 'not-specified',
    status: 'active',
    vat_percent: '7',
    expiration_warning_days: '90',
    sale_price: '25.50',
    unit: 'เม็ด',
    pack_size: '10',
    reorder_point: '5',
    shelf_code: 'A01',
    shelf_row: '1',
    dosage_unit: 'เม็ด',
    dosage: 'ครั้งละ 1 เม็ด',
    times_per_day: '3',
    interval_hours: '8',
    before_meal: true,
    after_meal: false,
    after_meal_immediate: false,
    morning: '1',
    noon: '1',
    evening: '1',
    before_bed: '',
    properties: 'ยาสำหรับทดสอบระบบสต๊อก',
    usage_instruction: 'ทานตามที่แพทย์สั่ง',
    sale_note: 'หมายเหตุการขายสำหรับเภสัช',
    purchase_note: 'หมายเหตุการสั่งซื้อ',
    initialStockData: {
      quantity: '50',
      production_date: '2024-01-01',
      expiration_date: '2025-12-31',
      note: 'สต๊อกเริ่มต้นสำหรับทดสอบ'
    }
  };

  test.beforeEach(async ({ page }) => {
    // ไปที่หน้า login
    await page.goto('/login');
    
    // เข้าสู่ระบบด้วยผู้ใช้เภสัชกร
    await page.fill('[data-testid="username-input"]', 'pharmacist01');
    await page.fill('[data-testid="password-input"]', 'pharmacist123');
    await page.click('[data-testid="login-button"]');
    
    // รอให้ redirect ไปหน้า dashboard
    await page.waitForURL('/dashboard/pos');
  });

  test('UAT-Inventory-001: เพิ่มสินค้าใหม่พร้อมสต๊อกเริ่มต้น', async ({ page }) => {
    // ไปที่หน้า inventory
    await page.click('[data-testid="inventory-menu"]');
    await page.waitForSelector('[data-testid="inventory-page"]', { timeout: 10000 });
    await page.waitForURL(/.*inventory.*/);
    
    // คลิกปุ่ม "เพิ่มสินค้าใหม่"
    await page.click('[data-testid="add-product-button"]');
    
    // รอให้หน้าเพิ่มสินค้าโหลดเสร็จ
    await page.waitForSelector('[data-testid="add-product-form"]', { timeout: 10000 });
    
    // กรอกข้อมูลสินค้าพื้นฐาน
    await page.fill('[data-testid="product-name-input"]', testProduct.product_name);
    await page.fill('[data-testid="generic-name-input"]', testProduct.generic_name);
    await page.fill('[data-testid="short-name-input"]', testProduct.short_name);
    
    // เลือกประเภทสินค้า
    await page.click('[data-testid="product-type-select"]');
    await page.waitForSelector('[role="option"]', { timeout: 5000 });
    await page.click('text=ยารักษาโรค', { force: true });
    
    // เลือกสถานะสินค้า (แสดงหน้าร้าน)
    await page.click('[data-testid="status-active-radio"]');
    
    // เลือกวันแจ้งเตือน
    await page.click(`[data-testid="expiration-warning-${testProduct.expiration_warning_days}-days"]`);
    
    // เลือก VAT
    await page.click(`[data-testid="vat-${testProduct.vat_percent}-percent"]`);
    
    // กรอกข้อมูลราคาและหน่วย
    await page.fill('[data-testid="sale-price-input"]', testProduct.sale_price);
    
    // เลือกหน่วยนับ
    await page.click('[data-testid="unit-input"]');
    await page.waitForSelector('[data-testid="unit-select-content"]', { timeout: 5000 });
    await page.click(`[data-testid="unit-option-${testProduct.unit}"]`);
    
    // กรอกข้อมูลฉลากยา
    await page.fill('[data-testid="dosage-unit-input"]', testProduct.dosage_unit);
    await page.fill('[data-testid="dosage-input"]', testProduct.dosage);
    await page.fill('[data-testid="times-per-day-input"]', testProduct.times_per_day);
    await page.fill('[data-testid="interval-hours-input"]', testProduct.interval_hours);
    
    // เลือกเวลาทานยา
    if (testProduct.before_meal) {
      await page.check('[data-testid="before-meal-checkbox"]');
    }
    if (testProduct.after_meal) {
      await page.check('[data-testid="after-meal-checkbox"]');
    }
    if (testProduct.after_meal_immediate) {
      await page.check('[data-testid="after-meal-immediate-checkbox"]');
    }
    
    // กรอกตารางเวลา
    await page.fill('[data-testid="morning-input"]', testProduct.morning);
    await page.fill('[data-testid="noon-input"]', testProduct.noon);
    await page.fill('[data-testid="evening-input"]', testProduct.evening);
    await page.fill('[data-testid="before-bed-input"]', testProduct.before_bed);
    
    // กรอกข้อมูลเพิ่มเติม
    await page.fill('[data-testid="properties-textarea"]', testProduct.properties);
    await page.fill('[data-testid="usage-instruction-textarea"]', testProduct.usage_instruction);
    await page.fill('[data-testid="sale-note-textarea"]', testProduct.sale_note);
    await page.fill('[data-testid="purchase-note-textarea"]', testProduct.purchase_note);
    
    // กรอกข้อมูลสต๊อกเริ่มต้น
    await page.click('[data-testid="initial-stock-switch"]');
    await page.waitForSelector('[data-testid="initial-stock-quantity"]', { timeout: 5000 });
    await page.fill('[data-testid="initial-stock-quantity"]', testProduct.initialStockData.quantity);
    await page.fill('[data-testid="production-date-input"]', testProduct.initialStockData.production_date);
    await page.fill('[data-testid="expiration-date-input"]', testProduct.initialStockData.expiration_date);
    await page.fill('[data-testid="stock-note-input"]', testProduct.initialStockData.note);
    
    // กดบันทึกสินค้า
    await page.click('[data-testid="save-product-button"]');
    
    // รอให้บันทึกสำเร็จและกลับไปหน้า inventory list view
    // รอให้ form submission เสร็จสิ้นก่อน
    await page.waitForTimeout(5000);
    
    // Debug: ตรวจสอบว่าหน้าปัจจุบันเป็นอะไร
    const currentUrl = page.url();
    console.log('Current URL after form submission:', currentUrl);
    
    // Debug: ตรวจสอบว่ามี error messages หรือไม่
    const errorMessages = await page.locator('.toast-error, .error, [role="alert"]').all();
    if (errorMessages.length > 0) {
      console.log('Error messages found:', await Promise.all(errorMessages.map(msg => msg.textContent())));
    }
    
    // รอให้กลับไปหน้า inventory list view
    // ลองรอให้ URL เปลี่ยนหรือ page reload
    try {
      await page.waitForSelector('[data-testid="product-search-input"]', { timeout: 10000 });
    } catch (error) {
      console.log('product-search-input not found, trying to reload page...');
      await page.reload();
      await page.waitForSelector('[data-testid="product-search-input"]', { timeout: 10000 });
    }
    
    // ตรวจสอบว่าสินค้าถูกสร้างแล้วโดยการค้นหา
    await page.fill('[data-testid="product-search-input"]', '');
    await page.fill('[data-testid="product-search-input"]', testProduct.product_name);
    await page.waitForTimeout(2000);
    
    // ตรวจสอบว่าพบสินค้า
    await expect(page.locator(`[data-testid="product-item-${testProduct.product_name}"]`)).toBeVisible();
  });

  test('UAT-Inventory-002: ตรวจสอบข้อมูลสินค้าในหน้า product detail', async ({ page }) => {
    // ไปที่หน้า inventory
    await page.click('[data-testid="inventory-menu"]');
    await page.waitForSelector('[data-testid="inventory-page"]', { timeout: 10000 });
    await page.waitForURL(/.*inventory.*/);
    
    // ค้นหาสินค้าที่สร้างไว้
    await page.waitForSelector('[data-testid="product-search-input"]', { timeout: 10000 });
    await page.fill('[data-testid="product-search-input"]', '');
    await page.fill('[data-testid="product-search-input"]', testProduct.product_name);
    await page.waitForTimeout(2000);
    
    // คลิกที่สินค้าเพื่อดูรายละเอียด
    await page.click(`[data-testid="product-item-${testProduct.product_name}"]`);
    await page.waitForSelector('[data-testid="product-detail-view"]', { timeout: 10000 });
    
    // ตรวจสอบข้อมูลพื้นฐาน
    await expect(page.locator('[data-testid="product-name-display"]')).toContainText(testProduct.product_name);
    await expect(page.locator('[data-testid="generic-name-display"]')).toContainText(testProduct.generic_name);
    // ตรวจสอบประเภทสินค้าเป็นภาษาไทย (ยารักษาโรค)
    await expect(page.locator('[data-testid="product-type-display"]')).toContainText('ยารักษาโรค');
    await expect(page.locator('[data-testid="sale-price-display"]')).toContainText(testProduct.sale_price);
    
    // ตรวจสอบข้อมูลหน่วยนับ
    await expect(page.locator('[data-testid="unit-display"]')).toContainText(testProduct.unit);
    await expect(page.locator('[data-testid="pack-size-display"]')).toContainText(testProduct.pack_size);
    
    // ตรวจสอบข้อมูลสต๊อก
    await page.click('[data-testid="stock-tab"]');
    await page.waitForSelector('[data-testid="stock-table"]', { timeout: 5000 });
    
    // ตรวจสอบว่ามีสต๊อกเริ่มต้น
    await expect(page.locator('[data-testid="stock-quantity"]')).toContainText(testProduct.initialStockData.quantity);
    await expect(page.locator('[data-testid="production-date"]')).toContainText(testProduct.initialStockData.production_date);
    await expect(page.locator('[data-testid="expiration-date"]')).toContainText(testProduct.initialStockData.expiration_date);
  });

  test('UAT-Inventory-003: เพิ่มหน่วยนับใหม่และตรวจสอบข้อมูล', async ({ page }) => {
    // ไปที่หน้า inventory
    await page.click('[data-testid="inventory-menu"]');
    await page.waitForSelector('[data-testid="inventory-page"]', { timeout: 10000 });
    await page.waitForURL(/.*inventory.*/);
    
    // ค้นหาสินค้าที่สร้างไว้
    await page.waitForSelector('[data-testid="product-search-input"]', { timeout: 10000 });
    await page.fill('[data-testid="product-search-input"]', '');
    await page.fill('[data-testid="product-search-input"]', testProduct.product_name);
    await page.waitForTimeout(2000);
    
    // คลิกที่สินค้าเพื่อดูรายละเอียด
    await page.click(`[data-testid="product-item-${testProduct.product_name}"]`);
    await page.waitForSelector('[data-testid="product-detail-view"]', { timeout: 10000 });
    
    // เพิ่มหน่วยนับใหม่
    const newUnitData = {
      unit: 'ขวด',
      packSize: '1',
      salePrice: '150.00',
      displayPos: true
    };
    
    // คลิกปุ่มเพิ่มหน่วยนับ
    await page.click('[data-testid="add-unit-button"]');
    
    // รอให้ dialog เพิ่มหน่วยนับเปิด
    await page.waitForSelector('[data-testid="add-unit-dialog"]', { timeout: 5000 });
    
    // กรอกข้อมูลหน่วยนับใหม่
    await page.fill('[data-testid="new-unit-input"]', newUnitData.unit);
    await page.fill('[data-testid="new-pack-size-input"]', newUnitData.packSize);
    await page.fill('[data-testid="new-sale-price-input"]', newUnitData.salePrice);
    
    if (newUnitData.displayPos) {
      await page.check('[data-testid="display-pos-checkbox"]');
    }
    
    // กดบันทึกหน่วยนับ
    await page.click('[data-testid="save-unit-button"]');
    
    // รอให้บันทึกสำเร็จและหน้า refresh
    await page.waitForTimeout(2000);
    
    // ตรวจสอบว่าหน่วยนับใหม่ถูกเพิ่มในตาราง
    await expect(page.locator('[data-testid="unit-table"]')).toContainText(newUnitData.unit);
    await expect(page.locator('[data-testid="unit-table"]')).toContainText(newUnitData.packSize);
    await expect(page.locator('[data-testid="unit-table"]')).toContainText(newUnitData.salePrice);
  });

  test('UAT-Inventory-004: เพิ่มสต๊อกให้หน่วยนับใหม่', async ({ page }) => {
    // ไปที่หน้า inventory
    await page.click('[data-testid="inventory-menu"]');
    await page.waitForSelector('[data-testid="inventory-page"]', { timeout: 10000 });
    await page.waitForURL(/.*inventory.*/);
    
    // ค้นหาสินค้าที่สร้างไว้
    await page.waitForSelector('[data-testid="product-search-input"]', { timeout: 10000 });
    await page.fill('[data-testid="product-search-input"]', '');
    await page.fill('[data-testid="product-search-input"]', testProduct.product_name);
    await page.waitForTimeout(2000);
    
    // คลิกที่สินค้าเพื่อดูรายละเอียด
    await page.click(`[data-testid="product-item-${testProduct.product_name}"]`);
    await page.waitForSelector('[data-testid="product-detail-view"]', { timeout: 10000 });
    
    // เพิ่มสต๊อกให้หน่วยนับใหม่
    const stockData = {
      quantity: '100',
      productionDate: '2024-02-01',
      expirationDate: '2026-01-31',
      note: 'เพิ่มสต๊อกสำหรับทดสอบ'
    };
    
    // ไปที่แท็บสต๊อก
    await page.click('[data-testid="stock-tab"]');
    await page.waitForSelector('[data-testid="stock-table"]', { timeout: 5000 });
    
    // คลิกปุ่มเพิ่มสต๊อก
    await page.click('[data-testid="add-stock-button"]');
    
    // รอให้ dialog เพิ่มสต๊อกเปิด
    await page.waitForSelector('[data-testid="add-stock-dialog"]', { timeout: 5000 });
    
    // กรอกข้อมูลสต๊อก
    await page.fill('[data-testid="stock-quantity-input"]', stockData.quantity);
    await page.fill('[data-testid="production-date-input"]', stockData.productionDate);
    await page.fill('[data-testid="expiration-date-input"]', stockData.expirationDate);
    await page.fill('[data-testid="stock-note-input"]', stockData.note);
    
    // กดเพิ่มสต๊อก
    await page.click('[data-testid="add-stock-submit-button"]');
    
    // รอให้บันทึกสำเร็จและหน้า refresh
    await page.waitForTimeout(2000);
    
    // ตรวจสอบว่าสต๊อกถูกเพิ่มในตาราง
    await expect(page.locator('[data-testid="stock-table"]')).toContainText(stockData.quantity);
    await expect(page.locator('[data-testid="stock-table"]')).toContainText(stockData.productionDate);
    await expect(page.locator('[data-testid="stock-table"]')).toContainText(stockData.expirationDate);
  });

  test('UAT-Inventory-005: ทดสอบการปรับเพิ่ม/ลดสต๊อกและย้ายหน่วย', async ({ page }) => {
    // ไปที่หน้า inventory
    await page.click('[data-testid="inventory-menu"]');
    await page.waitForSelector('[data-testid="inventory-page"]', { timeout: 10000 });
    await page.waitForURL(/.*inventory.*/);
    
    // ค้นหาสินค้าที่สร้างไว้
    await page.waitForSelector('[data-testid="product-search-input"]', { timeout: 10000 });
    await page.fill('[data-testid="product-search-input"]', '');
    await page.fill('[data-testid="product-search-input"]', testProduct.product_name);
    await page.waitForTimeout(2000);
    
    // คลิกที่สินค้าเพื่อดูรายละเอียด
    await page.click(`[data-testid="product-item-${testProduct.product_name}"]`);
    await page.waitForSelector('[data-testid="product-detail-view"]', { timeout: 10000 });
    
    // ไปที่แท็บสต๊อก
    await page.click('[data-testid="stock-tab"]');
    await page.waitForSelector('[data-testid="stock-table"]', { timeout: 5000 });
    
    // ทดสอบการปรับเพิ่มสต๊อก
    const adjustData = {
      operation: 'add' as const,
      quantity: '20',
      note: 'ปรับเพิ่มสต๊อกสำหรับทดสอบ'
    };
    
    // คลิกปุ่มปรับสต๊อก
    await page.click('[data-testid="adjust-stock-button"]');
    
    // รอให้ dialog ปรับสต๊อกเปิด
    await page.waitForSelector('[data-testid="adjust-stock-dialog"]', { timeout: 5000 });
    
    // เลือกการดำเนินการ
    await page.click(`[data-testid="adjust-operation-${adjustData.operation}"]`);
    
    // กรอกจำนวน
    await page.fill('[data-testid="adjust-quantity-input"]', adjustData.quantity);
    await page.fill('[data-testid="adjust-note-input"]', adjustData.note);
    
    // กดยืนยันการปรับสต๊อก
    await page.click('[data-testid="adjust-stock-submit-button"]');
    
    // รอให้บันทึกสำเร็จและหน้า refresh
    await page.waitForTimeout(2000);
    
    // ตรวจสอบว่าสต๊อกถูกปรับเพิ่ม
    await expect(page.locator('[data-testid="stock-table"]')).toContainText('120'); // 100 + 20
    
    // ทดสอบการย้ายสต๊อก
    const transferData = {
      operation: 'transfer' as const,
      quantity: '10',
      note: 'ย้ายสต๊อกจากขวดไปเม็ด',
      transferToUnit: 'เม็ด'
    };
    
    // คลิกปุ่มปรับสต๊อก
    await page.click('[data-testid="adjust-stock-button"]');
    
    // รอให้ dialog ปรับสต๊อกเปิด
    await page.waitForSelector('[data-testid="adjust-stock-dialog"]', { timeout: 5000 });
    
    // เลือกการดำเนินการ
    await page.click(`[data-testid="adjust-operation-${transferData.operation}"]`);
    
    // ถ้าเป็นการย้าย ให้เลือกหน่วยนับปลายทาง
    if (transferData.operation === 'transfer' && transferData.transferToUnit) {
      await page.click('[data-testid="transfer-to-unit-select"]');
      await page.click(`[data-value="${transferData.transferToUnit}"]`);
    }
    
    // กรอกจำนวน
    await page.fill('[data-testid="adjust-quantity-input"]', transferData.quantity);
    await page.fill('[data-testid="adjust-note-input"]', transferData.note);
    
    // กดยืนยันการปรับสต๊อก
    await page.click('[data-testid="adjust-stock-submit-button"]');
    
    // รอให้บันทึกสำเร็จและหน้า refresh
    await page.waitForTimeout(2000);
    
    // ตรวจสอบว่าสต๊อกถูกย้าย (ขวดลดลง, เม็ดเพิ่มขึ้น)
    await expect(page.locator('[data-testid="stock-table"]')).toContainText('110'); // 120 - 10
  });

  test.afterAll(async ({ browser }) => {
    // Cleanup: ลบสินค้าทดสอบ (ถ้ามีฟีเจอร์ลบ)
    try {
      const context = await browser.newContext();
      const page = await context.newPage();
      
      // เข้าสู่ระบบก่อนทำ cleanup
      await page.goto('/login');
      await page.fill('[data-testid="username-input"]', 'pharmacist01');
      await page.fill('[data-testid="password-input"]', 'pharmacist123');
      await page.click('[data-testid="login-button"]');
      await page.waitForURL('/dashboard/pos');
      
      // ไปที่หน้า inventory
      await page.click('[data-testid="inventory-menu"]');
      await page.waitForSelector('[data-testid="inventory-page"]', { timeout: 10000 });
      await page.waitForURL(/.*inventory.*/);
      
      // ค้นหาสินค้าทดสอบ
      await page.waitForSelector('[data-testid="product-search-input"]', { timeout: 10000 });
      await page.fill('[data-testid="product-search-input"]', '');
      await page.fill('[data-testid="product-search-input"]', testProduct.product_name);
      await page.waitForTimeout(2000);
      
      // ถ้ามีสินค้า ให้ลบ
      const productElement = page.locator(`[data-testid="product-item-${testProduct.product_name}"]`);
      if (await productElement.isVisible()) {
        await page.click(`[data-testid="product-item-${testProduct.product_name}"]`);
        await page.waitForSelector('[data-testid="product-detail-view"]', { timeout: 10000 });
        
        // คลิกปุ่มลบสินค้า (ถ้ามี)
        const deleteButton = page.locator('[data-testid="delete-product-button"]');
        if (await deleteButton.isVisible()) {
          await deleteButton.click();
          await page.click('[data-testid="confirm-delete-button"]');
        }
      }
      
      await context.close();
    } catch (error) {
      console.log('⚠️ ไม่สามารถลบสินค้าทดสอบได้:', error);
    }
  });
});
