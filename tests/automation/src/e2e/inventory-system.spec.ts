import { test, expect } from '@playwright/test';
import { 
  createTestProduct, 
  loginAsPharmacist, 
  navigateToInventory, 
  fillProductForm, 
  fillInitialStockForm,
  searchForProduct,
  openProductDetail,
  addNewUnit,
  addStock,
  adjustStock,
  cleanupTestProduct
} from './inventory-helpers';

test.describe.serial('การทดสอบระบบสต๊อกสินค้า E2E', () => {
  // สร้าง testProduct อันเดียวใช้ร่วมกัน
  const timestamp = Date.now();
  const testProduct = createTestProduct(timestamp);

  test('1. เข้าสู่ระบบและสร้างสินค้าใหม่พร้อมสต๊อกเริ่มต้น', async ({ page }) => {
    // เข้าสู่ระบบด้วยเภสัชกร
    await loginAsPharmacist(page);
    
    // ไปที่หน้า inventory
    await navigateToInventory(page);
    
    // คลิกปุ่ม "เพิ่มสินค้าใหม่"
    await page.click('[data-testid="add-product-button"]');
    
    // รอให้หน้าเพิ่มสินค้าโหลดเสร็จ
    await page.waitForSelector('[data-testid="add-product-form"]', { timeout: 10000 });
    
    // กรอกข้อมูลสินค้าพื้นฐาน
    await fillProductForm(page, testProduct);
    
    // กรอกข้อมูลสต๊อกเริ่มต้น
    await fillInitialStockForm(page, testProduct.initialStockData);
    
    // กดบันทึกสินค้า
    await page.click('[data-testid="save-product-button"]');
    
    // รอให้บันทึกสำเร็จและกลับไปหน้า inventory
    await page.waitForSelector('[data-testid="inventory-page"]', { timeout: 15000 });
    
    // รอให้ ProductListSidebar โหลดเสร็จ
    await page.waitForSelector('[data-testid="product-search-input"]', { timeout: 10000 });
    
    // ตรวจสอบว่าสินค้าถูกสร้างแล้วโดยการค้นหา
    await searchForProduct(page, testProduct.product_name);
    
    // ตรวจสอบว่าพบสินค้า
    await expect(page.locator(`[data-testid="product-item-${testProduct.product_name}"]`)).toBeVisible();
    
    console.log('✅ สินค้าถูกสร้างสำเร็จ:', testProduct.product_name);
  });

  test('2. ค้นหาสินค้าและตรวจสอบข้อมูลในหน้า product detail', async ({ page }) => {
    // เข้าสู่ระบบด้วยเภสัชกร
    await loginAsPharmacist(page);
    
    // ไปที่หน้า inventory
    await navigateToInventory(page);
    
    // ค้นหาสินค้าที่สร้างไว้
    await searchForProduct(page, testProduct.product_name);
    
    // คลิกที่สินค้าเพื่อดูรายละเอียด
    await openProductDetail(page, testProduct.product_name);
    
    // ตรวจสอบข้อมูลพื้นฐาน
    await expect(page.locator('[data-testid="product-name-display"]')).toContainText(testProduct.product_name);
    await expect(page.locator('[data-testid="generic-name-display"]')).toContainText(testProduct.generic_name);
    await expect(page.locator('[data-testid="product-type-display"]')).toContainText(testProduct.product_type);
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
    
    console.log('✅ ข้อมูลสินค้าถูกต้องครบถ้วน');
  });

  test('3. เพิ่มหน่วยนับใหม่และตรวจสอบข้อมูล', async ({ page }) => {
    // เข้าสู่ระบบด้วยเภสัชกร
    await loginAsPharmacist(page);
    
    // ไปที่หน้า inventory
    await navigateToInventory(page);
    
    // ค้นหาสินค้าที่สร้างไว้
    await searchForProduct(page, testProduct.product_name);
    
    // คลิกที่สินค้าเพื่อดูรายละเอียด
    await openProductDetail(page, testProduct.product_name);
    
    // เพิ่มหน่วยนับใหม่
    const newUnitData = {
      unit: 'ขวด',
      packSize: '1',
      salePrice: '150.00',
      displayPos: true
    };
    
    await addNewUnit(page, newUnitData);
    
    // ตรวจสอบว่าหน่วยนับใหม่ถูกเพิ่มในตาราง
    await expect(page.locator('[data-testid="unit-table"]')).toContainText(newUnitData.unit);
    await expect(page.locator('[data-testid="unit-table"]')).toContainText(newUnitData.packSize);
    await expect(page.locator('[data-testid="unit-table"]')).toContainText(newUnitData.salePrice);
    
    console.log('✅ หน่วยนับใหม่ถูกเพิ่มสำเร็จ');
  });

  test('4. เพิ่มสต๊อกให้หน่วยนับใหม่', async ({ page }) => {
    // เข้าสู่ระบบด้วยเภสัชกร
    await loginAsPharmacist(page);
    
    // ไปที่หน้า inventory
    await navigateToInventory(page);
    
    // ค้นหาสินค้าที่สร้างไว้
    await searchForProduct(page, testProduct.product_name);
    
    // คลิกที่สินค้าเพื่อดูรายละเอียด
    await openProductDetail(page, testProduct.product_name);
    
    // เพิ่มสต๊อกให้หน่วยนับใหม่
    const stockData = {
      quantity: '100',
      productionDate: '2024-02-01',
      expirationDate: '2026-01-31',
      note: 'เพิ่มสต๊อกสำหรับทดสอบ'
    };
    
    await addStock(page, stockData);
    
    // ตรวจสอบว่าสต๊อกถูกเพิ่มในตาราง
    await expect(page.locator('[data-testid="stock-table"]')).toContainText(stockData.quantity);
    await expect(page.locator('[data-testid="stock-table"]')).toContainText(stockData.productionDate);
    await expect(page.locator('[data-testid="stock-table"]')).toContainText(stockData.expirationDate);
    
    console.log('✅ สต๊อกถูกเพิ่มสำเร็จ:', stockData.quantity, 'ชิ้น');
  });

  test('5. ทดสอบการปรับเพิ่ม/ลดสต๊อกและย้ายหน่วย', async ({ page }) => {
    // เข้าสู่ระบบด้วยเภสัชกร
    await loginAsPharmacist(page);
    
    // ไปที่หน้า inventory
    await navigateToInventory(page);
    
    // ค้นหาสินค้าที่สร้างไว้
    await searchForProduct(page, testProduct.product_name);
    
    // คลิกที่สินค้าเพื่อดูรายละเอียด
    await openProductDetail(page, testProduct.product_name);
    
    // ไปที่แท็บสต๊อก
    await page.click('[data-testid="stock-tab"]');
    await page.waitForSelector('[data-testid="stock-table"]', { timeout: 5000 });
    
    // ทดสอบการปรับเพิ่มสต๊อก
    const adjustData = {
      operation: 'add' as const,
      quantity: '20',
      note: 'ปรับเพิ่มสต๊อกสำหรับทดสอบ'
    };
    
    await adjustStock(page, adjustData);
    
    // ตรวจสอบว่าสต๊อกถูกปรับเพิ่ม
    await expect(page.locator('[data-testid="stock-table"]')).toContainText('120'); // 100 + 20
    
    // ทดสอบการย้ายสต๊อก
    const transferData = {
      operation: 'transfer' as const,
      quantity: '10',
      note: 'ย้ายสต๊อกจากขวดไปเม็ด',
      transferToUnit: 'เม็ด'
    };
    
    await adjustStock(page, transferData);
    
    // ตรวจสอบว่าสต๊อกถูกย้าย (ขวดลดลง, เม็ดเพิ่มขึ้น)
    await expect(page.locator('[data-testid="stock-table"]')).toContainText('110'); // 120 - 10
    
    console.log('✅ การปรับสต๊อกและการย้ายหน่วยทำงานถูกต้อง');
  });

  test.afterAll(async ({ browser }) => {
    // Cleanup: ลบสินค้าทดสอบ (ถ้ามีฟีเจอร์ลบ)
    try {
      const context = await browser.newContext();
      const page = await context.newPage();
      
      // เข้าสู่ระบบก่อนทำ cleanup
      await loginAsPharmacist(page);
      
      await cleanupTestProduct(page, testProduct.product_name);
      await context.close();
    } catch (error) {
      console.log('⚠️ ไม่สามารถลบสินค้าทดสอบได้:', error);
    }
  });
});
