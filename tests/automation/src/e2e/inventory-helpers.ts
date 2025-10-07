// Helper functions สำหรับ inventory E2E tests

export interface TestProduct {
  product_name: string;
  generic_name: string;
  short_name: string;
  product_type: string;
  category: string;
  status: string;
  vat_percent: string;
  expiration_warning_days: string;
  sale_price: string;
  unit: string;
  pack_size: string;
  reorder_point: string;
  shelf_code: string;
  shelf_row: string;
  dosage_unit: string;
  dosage: string;
  times_per_day: string;
  interval_hours: string;
  before_meal: boolean;
  after_meal: boolean;
  after_meal_immediate: boolean;
  morning: string;
  noon: string;
  evening: string;
  before_bed: string;
  properties: string;
  usage_instruction: string;
  sale_note: string;
  purchase_note: string;
  initialStockData: {
    quantity: string;
    production_date: string;
    expiration_date: string;
    note: string;
  };
}

export const createTestProduct = (timestamp: number): TestProduct => ({
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
});

export const setupPage = async (page: any) => {
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

export const loginAsPharmacist = async (page: any) => {
  await setupPage(page);
  
  // ไปที่หน้า login
  await page.goto('/login');
  
  // เข้าสู่ระบบด้วยเภสัชกร
  await page.fill('[data-testid="username-input"]', 'pharmacist01');
  await page.fill('[data-testid="password-input"]', 'pharmacist123');
  await page.click('[data-testid="login-button"]');
  
  // รอให้เข้าสู่ระบบสำเร็จ
  await page.waitForURL('/dashboard/pos');
  
  // รอให้หน้า dashboard โหลดเสร็จ
  await page.waitForTimeout(3000);
};

export const navigateToInventory = async (page: any) => {
  // คลิกที่เมนู Inventory
  await page.click('[data-testid="inventory-menu"]');
  
  // รอให้หน้า inventory โหลดเสร็จ
  await page.waitForSelector('[data-testid="inventory-page"]', { timeout: 10000 });
  
  // ตรวจสอบว่าเราอยู่ในหน้า inventory
  await page.waitForURL(/.*inventory.*/);
};

export const fillProductForm = async (page: any, product: TestProduct) => {
  // กรอกข้อมูลสินค้าพื้นฐาน
  await page.fill('[data-testid="product-name-input"]', product.product_name);
  await page.fill('[data-testid="generic-name-input"]', product.generic_name);
  await page.fill('[data-testid="short-name-input"]', product.short_name);
  
  // เลือกประเภทสินค้า
  await page.click('[data-testid="product-type-select"]');
  await page.waitForSelector('[role="option"]', { timeout: 5000 });
  await page.click('text=ยารักษาโรค', { force: true });
  
  // เลือกสถานะสินค้า (แสดงหน้าร้าน)
  await page.click('[data-testid="status-active-radio"]');
  
  // เลือกวันแจ้งเตือน
  await page.click(`[data-testid="expiration-warning-${product.expiration_warning_days}-days"]`);
  
  // เลือก VAT
  await page.click(`[data-testid="vat-${product.vat_percent}-percent"]`);
  
  // กรอกข้อมูลราคาและหน่วย
  await page.fill('[data-testid="sale-price-input"]', product.sale_price);
  
  // เลือกหน่วยนับ
  await page.click('[data-testid="unit-input"]');
  await page.waitForSelector('[data-testid="unit-select-content"]', { timeout: 5000 });
  await page.click(`[data-testid="unit-option-${product.unit}"]`);
  
  // กรอกข้อมูลฉลากยา (เฉพาะ fields ที่มี test IDs)
  await page.fill('[data-testid="dosage-unit-input"]', product.dosage_unit);
  await page.fill('[data-testid="dosage-input"]', product.dosage);
  await page.fill('[data-testid="times-per-day-input"]', product.times_per_day);
  await page.fill('[data-testid="interval-hours-input"]', product.interval_hours);
  
  // เลือกเวลาทานยา
  if (product.before_meal) {
    await page.check('[data-testid="before-meal-checkbox"]');
  }
  if (product.after_meal) {
    await page.check('[data-testid="after-meal-checkbox"]');
  }
  if (product.after_meal_immediate) {
    await page.check('[data-testid="after-meal-immediate-checkbox"]');
  }
  
  // กรอกตารางเวลา
  await page.fill('[data-testid="morning-input"]', product.morning);
  await page.fill('[data-testid="noon-input"]', product.noon);
  await page.fill('[data-testid="evening-input"]', product.evening);
  await page.fill('[data-testid="before-bed-input"]', product.before_bed);
  
  // กรอกข้อมูลเพิ่มเติม
  await page.fill('[data-testid="properties-textarea"]', product.properties);
  await page.fill('[data-testid="usage-instruction-textarea"]', product.usage_instruction);
  await page.fill('[data-testid="sale-note-textarea"]', product.sale_note);
  await page.fill('[data-testid="purchase-note-textarea"]', product.purchase_note);
};

export const fillInitialStockForm = async (page: any, stockData: TestProduct['initialStockData']) => {
  // เปิดสวิตช์สต๊อกเริ่มต้น
  await page.click('[data-testid="initial-stock-switch"]');
  
  // รอให้ฟอร์มสต๊อกเริ่มต้นแสดง
  await page.waitForSelector('[data-testid="initial-stock-quantity"]', { timeout: 5000 });
  
  // กรอกข้อมูลสต๊อกเริ่มต้น
  await page.fill('[data-testid="initial-stock-quantity"]', stockData.quantity);
  await page.fill('[data-testid="production-date-input"]', stockData.production_date);
  await page.fill('[data-testid="expiration-date-input"]', stockData.expiration_date);
  await page.fill('[data-testid="stock-note-input"]', stockData.note);
};

export const searchForProduct = async (page: any, productName: string) => {
  // รอให้ search input พร้อมใช้งาน
  await page.waitForSelector('[data-testid="product-search-input"]', { timeout: 10000 });
  
  // ล้าง search input ก่อน
  await page.fill('[data-testid="product-search-input"]', '');
  
  // กรอกชื่อสินค้า
  await page.fill('[data-testid="product-search-input"]', productName);
  
  // รอให้ค้นหาเสร็จ
  await page.waitForTimeout(2000);
};

export const openProductDetail = async (page: any, productName: string) => {
  await page.click(`[data-testid="product-item-${productName}"]`);
  await page.waitForSelector('[data-testid="product-detail-view"]', { timeout: 10000 });
};

export const addNewUnit = async (page: any, unitData: {
  unit: string;
  packSize: string;
  salePrice: string;
  displayPos: boolean;
}) => {
  // คลิกปุ่มเพิ่มหน่วยนับ
  await page.click('[data-testid="add-unit-button"]');
  
  // รอให้ dialog เพิ่มหน่วยนับเปิด
  await page.waitForSelector('[data-testid="add-unit-dialog"]', { timeout: 5000 });
  
  // กรอกข้อมูลหน่วยนับใหม่
  await page.fill('[data-testid="new-unit-input"]', unitData.unit);
  await page.fill('[data-testid="new-pack-size-input"]', unitData.packSize);
  await page.fill('[data-testid="new-sale-price-input"]', unitData.salePrice);
  
  if (unitData.displayPos) {
    await page.check('[data-testid="display-pos-checkbox"]');
  }
  
  // กดบันทึกหน่วยนับ
  await page.click('[data-testid="save-unit-button"]');
  
  // รอให้บันทึกสำเร็จและหน้า refresh
  await page.waitForTimeout(2000);
};

export const addStock = async (page: any, stockData: {
  quantity: string;
  productionDate: string;
  expirationDate: string;
  note: string;
}) => {
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
};

export const adjustStock = async (page: any, adjustData: {
  operation: 'add' | 'subtract' | 'transfer';
  quantity: string;
  note: string;
  transferToUnit?: string;
}) => {
  // คลิกปุ่มปรับสต๊อก
  await page.click('[data-testid="adjust-stock-button"]');
  
  // รอให้ dialog ปรับสต๊อกเปิด
  await page.waitForSelector('[data-testid="adjust-stock-dialog"]', { timeout: 5000 });
  
  // เลือกการดำเนินการ
  await page.click(`[data-testid="adjust-operation-${adjustData.operation}"]`);
  
  // ถ้าเป็นการย้าย ให้เลือกหน่วยนับปลายทาง
  if (adjustData.operation === 'transfer' && adjustData.transferToUnit) {
    await page.click('[data-testid="transfer-to-unit-select"]');
    await page.click(`[data-value="${adjustData.transferToUnit}"]`);
  }
  
  // กรอกจำนวน
  await page.fill('[data-testid="adjust-quantity-input"]', adjustData.quantity);
  await page.fill('[data-testid="adjust-note-input"]', adjustData.note);
  
  // กดยืนยันการปรับสต๊อก
  await page.click('[data-testid="adjust-stock-submit-button"]');
  
  // รอให้บันทึกสำเร็จและหน้า refresh
  await page.waitForTimeout(2000);
};

export const cleanupTestProduct = async (page: any, productName: string) => {
  try {
    // ตรวจสอบว่า page ยังใช้งานได้
    if (page.isClosed()) {
      console.log('⚠️ Page has been closed, skipping cleanup');
      return;
    }
    
    await navigateToInventory(page);
    
    // ค้นหาสินค้าทดสอบ
    await searchForProduct(page, productName);
    
    // ถ้ามีสินค้า ให้ลบ
    const productElement = page.locator(`[data-testid="product-item-${productName}"]`);
    if (await productElement.isVisible()) {
      await openProductDetail(page, productName);
      
      // คลิกปุ่มลบสินค้า (ถ้ามี)
      const deleteButton = page.locator('[data-testid="delete-product-button"]');
      if (await deleteButton.isVisible()) {
        await deleteButton.click();
        await page.click('[data-testid="confirm-delete-button"]');
        console.log('✅ สินค้าทดสอบถูกลบแล้ว');
      }
    }
  } catch (error) {
    console.log('⚠️ ไม่สามารถลบสินค้าทดสอบได้:', error);
  }
};
