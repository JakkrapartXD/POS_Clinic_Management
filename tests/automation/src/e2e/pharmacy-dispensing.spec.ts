import { test, expect } from '@playwright/test';

test.describe('การทดสอบการสั่งยาใน POS E2E', () => {
  test.beforeEach(async ({ page }) => {
    // ไปที่หน้า login
    await page.goto('/login');
    
    // เข้าสู่ระบบด้วยผู้ใช้เภสัชกร
    await page.fill('[data-testid="username-input"]', 'doctor01');
    await page.fill('[data-testid="password-input"]', 'doctor123');
    await page.click('[data-testid="login-button"]');
    
    // รอให้ redirect ไปหน้า dashboard
    await page.waitForURL('/dashboard/pos');
  });

  test('UAT-003: สั่งยาที่มีสต๊อกเพียงพอใน POS', async ({ page }) => {
    // รอให้หน้า POS โหลดเสร็จ
    await page.waitForSelector('[data-testid="product-grid"]');
    
    // ค้นหาสินค้า
    await page.fill('[data-testid="search-input"]', 'ยา');
    await page.waitForTimeout(1000);
    
    // เลือกสินค้าแรกที่มีสต๊อก
    const productCards = page.locator('[data-testid="product-card"]');
    await expect(productCards.first()).toBeVisible();
    
    // หาสินค้าที่มีสต๊อกเพียงพอ
    let selectedProduct = null;
    for (let i = 0; i < await productCards.count(); i++) {
      const card = productCards.nth(i);
      const stockText = await card.locator('[data-testid="stock-quantity"]').textContent();
      const stock = parseInt(stockText?.replace('สต๊อก: ', '') || '0');
      
      if (stock > 0) {
        selectedProduct = card;
        break;
      }
    }
    
    expect(selectedProduct).not.toBeNull();
    
    // คลิกเพิ่มสินค้าเข้าตระกร้า
    await selectedProduct!.click();
    
    // ตรวจสอบว่าสินค้าถูกเพิ่มเข้าตระกร้า
    await expect(page.locator('[data-testid="cart-item"]')).toHaveCount(1);
    
    // ตรวจสอบการแจ้งเตือนสต๊อก (ถ้ามี)
    const stockWarning = page.locator('[data-testid="stock-warning-toast"]');
    if (await stockWarning.isVisible()) {
      await expect(stockWarning).toContainText('สต๊อกต่ำ');
    }
    
    // คลิกชำระเงิน
    await page.click('[data-testid="checkout-button"]');
    
    // รอ dialog การชำระเงิน
    await page.waitForSelector('[data-testid="payment-dialog"]');
    
    // เลือกวิธีการชำระเงิน
    await page.click('[data-testid="payment-method-cash"]');
    
    // ยืนยันการชำระเงิน
    await page.click('[data-testid="confirm-payment-button"]');
    
    // รอข้อความสำเร็จ
    await expect(page.locator('[data-testid="payment-success-dialog"]')).toBeVisible();
    await expect(page.locator('[data-testid="success-message"]')).toContainText('รับชำระ');
    
    // ปิด dialog สำเร็จด้วยปุ่ม "รับชำระ"
    await page.click('[data-testid="close-success-dialog"]');
    
    // รอให้ dialog ปิด
    await page.waitForTimeout(1000);
    
    // ตรวจสอบว่าตระกร้าว่าง
    await expect(page.locator('[data-testid="cart-item"]')).toHaveCount(0);
  });

  test('UAT-003: จัดการสต๊อกไม่เพียงพอใน POS', async ({ page }) => {
    // รอให้หน้า POS โหลดเสร็จ
    await page.waitForSelector('[data-testid="product-grid"]');
    
    // ค้นหาสินค้าที่มีสต๊อกต่ำ
    await page.fill('[data-testid="search-input"]', 'ยา');
    await page.waitForTimeout(1000);
    
    // หาสินค้าที่มีสต๊อกต่ำหรือหมด
    const productCards = page.locator('[data-testid="product-card"]');
    let lowStockProduct = null;
    
    for (let i = 0; i < await productCards.count(); i++) {
      const card = productCards.nth(i);
      const stockText = await card.locator('[data-testid="stock-quantity"]').textContent();
      const stock = parseInt(stockText?.replace('สต๊อก: ', '') || '0');
      
      if (stock <= 0) {
        lowStockProduct = card;
        break;
      }
    }
    
    if (lowStockProduct) {
      // ลองคลิกสินค้าที่หมดสต๊อก
      await lowStockProduct.click();
      
      // ตรวจสอบการแจ้งเตือนสินค้าหมดสต๊อก
      await expect(page.locator('[data-testid="out-of-stock-toast"]')).toBeVisible();
      await expect(page.locator('[data-testid="out-of-stock-toast"]')).toContainText('สินค้าหมดสต๊อก');
      
      // ตรวจสอบว่าสินค้าไม่ถูกเพิ่มเข้าตระกร้า
      await expect(page.locator('[data-testid="cart-item"]')).toHaveCount(0);
    }
    
    // ทดสอบการเพิ่มสินค้าที่มีสต๊อกต่ำ
    const normalStockProduct = productCards.first();
    await normalStockProduct.click();
    
    // ตรวจสอบการแจ้งเตือนสต๊อกต่ำ (ถ้ามี)
    const stockWarning = page.locator('[data-testid="stock-warning-toast"]');
    if (await stockWarning.isVisible()) {
      await expect(stockWarning).toContainText('สต๊อกต่ำ');
    }
    
    // ตรวจสอบการแจ้งเตือนสินค้าใกล้หมดอายุ (ถ้ามี)
    const expiryWarning = page.locator('[data-testid="expiry-warning-toast"]');
    if (await expiryWarning.isVisible()) {
      await expect(expiryWarning).toContainText('ใกล้หมดอายุ');
    }
    
    // ตรวจสอบการแจ้งเตือนสินค้าหมดอายุ (ถ้ามี)
    const expiredWarning = page.locator('[data-testid="expired-warning-toast"]');
    if (await expiredWarning.isVisible()) {
      await expect(expiredWarning).toContainText('หมดอายุ');
    }
  });

  test('UAT-003: การติดตามระดับสต๊อกและการแจ้งเตือนใน POS', async ({ page }) => {
    // รอให้หน้า POS โหลดเสร็จ
    await page.waitForSelector('[data-testid="product-grid"]');
    
    // ค้นหาสินค้า
    await page.fill('[data-testid="search-input"]', 'ยา');
    await page.waitForTimeout(1000);
    
    // ตรวจสอบการแสดงข้อมูลสต๊อกในแต่ละสินค้า
    const productCards = page.locator('[data-testid="product-card"]');
    await expect(productCards.first()).toBeVisible();
    
    // ตรวจสอบข้อมูลสต๊อกในสินค้าแรก
    const firstProduct = productCards.first();
    await expect(firstProduct.locator('[data-testid="product-name"]')).toBeVisible();
    await expect(firstProduct.locator('[data-testid="stock-quantity"]')).toBeVisible();
    await expect(firstProduct.locator('[data-testid="product-price"]')).toBeVisible();
    
    // ตรวจสอบการแสดงสถานะสินค้าหมด
    const outOfStockProducts = page.locator('[data-testid="out-of-stock-badge"]');
    if (await outOfStockProducts.count() > 0) {
      await expect(outOfStockProducts.first()).toContainText('สินค้าหมด');
    }
    
    // ทดสอบการเพิ่มสินค้าและตรวจสอบการแจ้งเตือน
    await firstProduct.click();
    
    // ตรวจสอบการแจ้งเตือนต่างๆ ที่อาจปรากฏ
    const stockWarning = page.locator('[data-testid="stock-warning-toast"]');
    const expiryWarning = page.locator('[data-testid="expiry-warning-toast"]');
    const expiredWarning = page.locator('[data-testid="expired-warning-toast"]');
    
    // รอสักครู่เพื่อให้ toast แสดง (ถ้ามี)
    await page.waitForTimeout(2000);
    
    // ตรวจสอบ toast ที่แสดง (ถ้ามี)
    if (await stockWarning.isVisible()) {
      await expect(stockWarning).toContainText('สต๊อกต่ำ');
    }
    
    if (await expiryWarning.isVisible()) {
      await expect(expiryWarning).toContainText('ใกล้หมดอายุ');
    }
    
    if (await expiredWarning.isVisible()) {
      await expect(expiredWarning).toContainText('หมดอายุ');
    }
  });

  test('UAT-003: การจัดการตระกร้าและจำนวนสินค้าใน POS', async ({ page }) => {
    // รอให้หน้า POS โหลดเสร็จ
    await page.waitForSelector('[data-testid="product-grid"]');
    
    // ค้นหาสินค้า
    await page.fill('[data-testid="search-input"]', 'ยา');
    await page.waitForTimeout(1000);
    
    // เลือกสินค้าสองรายการ
    const productCards = page.locator('[data-testid="product-card"]');
    await expect(productCards.first()).toBeVisible();
    
    // เพิ่มสินค้ารายการแรก
    await productCards.first().click();
    await expect(page.locator('[data-testid="cart-item"]')).toHaveCount(1);
    
    // เพิ่มสินค้ารายการที่สอง (ถ้ามี)
    if (await productCards.count() > 1) {
      await productCards.nth(1).click();
      await expect(page.locator('[data-testid="cart-item"]')).toHaveCount(2);
    }
    
    // ทดสอบการเพิ่มจำนวนสินค้าในตระกร้า
    const firstCartItem = page.locator('[data-testid="cart-item"]').first();
    const increaseButton = firstCartItem.locator('[data-testid="increase-quantity-button"]');
    const quantityDisplay = firstCartItem.locator('[data-testid="quantity-display"]');
    
    // ตรวจสอบจำนวนเริ่มต้น
    await expect(quantityDisplay).toContainText('1');
    
    // เพิ่มจำนวน
    await increaseButton.click();
    await expect(quantityDisplay).toContainText('2');
    
    // ทดสอบการลดจำนวนสินค้า
    const decreaseButton = firstCartItem.locator('[data-testid="decrease-quantity-button"]');
    await decreaseButton.click();
    await expect(quantityDisplay).toContainText('1');
    
    // ทดสอบการลบสินค้าออกจากตระกร้า
    await decreaseButton.click();
    await expect(page.locator('[data-testid="cart-item"]')).toHaveCount(1);
    
    // ตรวจสอบการคำนวณยอดรวม
    await expect(page.locator('[data-testid="total-amount"]')).toBeVisible();
    await expect(page.locator('[data-testid="vat-amount"]')).toBeVisible();
    await expect(page.locator('[data-testid="grand-total"]')).toBeVisible();
  });

  test('UAT-003: การชำระเงินและใบเสร็จใน POS', async ({ page }) => {
    // รอให้หน้า POS โหลดเสร็จ
    await page.waitForSelector('[data-testid="product-grid"]');
    
    // ค้นหาสินค้า
    await page.fill('[data-testid="search-input"]', 'ยา');
    await page.waitForTimeout(1000);
    
    // เลือกสินค้า
    const productCards = page.locator('[data-testid="product-card"]');
    await expect(productCards.first()).toBeVisible();
    await productCards.first().click();
    
    // ตรวจสอบว่าสินค้าถูกเพิ่มเข้าตระกร้า
    await expect(page.locator('[data-testid="cart-item"]')).toHaveCount(1);
    
    // คลิกชำระเงิน
    await page.click('[data-testid="checkout-button"]');
    
    // รอ dialog การชำระเงิน
    await page.waitForSelector('[data-testid="payment-dialog"]');
    
    // รอให้ payment dialog โหลดเสร็จ
    await page.waitForTimeout(1000);
    
    // ตรวจสอบข้อมูลการชำระเงิน
    await expect(page.locator('[data-testid="payment-total"]')).toBeVisible();
    await expect(page.locator('[data-testid="payment-methods"]')).toBeVisible();
    
    // เลือกวิธีการชำระเงินเป็นเงินสด
    await page.click('[data-testid="payment-method-cash"]');
    
    // ตรวจสอบการแสดงยอดเงินที่ต้องชำระ
    await expect(page.locator('[data-testid="amount-to-pay"]')).toBeVisible();
    
    // ใช้ numpad ใส่จำนวนเงิน
    await page.click('[data-testid="numpad-1"]');
    await page.click('[data-testid="numpad-0"]');
    await page.click('[data-testid="numpad-0"]');
    
    // ยืนยันการชำระเงิน
    await page.click('[data-testid="confirm-payment-button"]');
    
    // รอ dialog สำเร็จ
    await expect(page.locator('[data-testid="payment-success-dialog"]')).toBeVisible();
    
    // ตรวจสอบข้อมูลใบเสร็จ
    await expect(page.locator('[data-testid="receipt-number"]')).toBeVisible();
    await expect(page.locator('[data-testid="receipt-items"]')).toBeVisible();
    await expect(page.locator('[data-testid="receipt-total"]')).toBeVisible();
    await expect(page.locator('[data-testid="receipt-payment-method"]')).toBeVisible();
    
    // ปิด dialog สำเร็จด้วยปุ่ม "รับชำระ"
    await page.click('[data-testid="close-success-dialog"]');
    
    // รอให้ dialog ปิด
    await page.waitForTimeout(1000);
    
    // ตรวจสอบว่าตระกร้าว่าง
    await expect(page.locator('[data-testid="cart-item"]')).toHaveCount(0);
  });

  test('UAT-003: การปรับสต๊อกหลังการขายใน POS', async ({ page }) => {
    // รอให้หน้า POS โหลดเสร็จ
    await page.waitForSelector('[data-testid="product-grid"]');
    
    // ค้นหาสินค้า
    await page.fill('[data-testid="search-input"]', 'ยา');
    await page.waitForTimeout(1000);
    
    // เลือกสินค้าแรกและบันทึกข้อมูลสต๊อกเริ่มต้น
    const productCards = page.locator('[data-testid="product-card"]');
    await expect(productCards.first()).toBeVisible();
    
    const firstProduct = productCards.first();
    const initialStockText = await firstProduct.locator('[data-testid="stock-quantity"]').textContent();
    const initialStock = parseInt(initialStockText?.replace('สต๊อก: ', '') || '0');
    const productName = await firstProduct.locator('[data-testid="product-name"]').textContent();
    
    // เพิ่มสินค้าเข้าตระกร้า
    await firstProduct.click();
    await expect(page.locator('[data-testid="cart-item"]')).toHaveCount(1);
    
    // ตรวจสอบการแสดงสต๊อกที่อัปเดตในตระกร้า
    const cartItem = page.locator('[data-testid="cart-item"]').first();
    await expect(cartItem.locator('[data-testid="product-name"]')).toContainText(productName || '');
    
    // ชำระเงิน
    await page.click('[data-testid="checkout-button"]');
    await page.waitForSelector('[data-testid="payment-dialog"]');
    await page.click('[data-testid="payment-method-cash"]');
    await page.click('[data-testid="confirm-payment-button"]');
    
    // รอการชำระเงินสำเร็จ
    await expect(page.locator('[data-testid="payment-success-dialog"]')).toBeVisible();
    
    // ปิด dialog สำเร็จด้วยปุ่ม "รับชำระ"
    await page.click('[data-testid="close-success-dialog"]');
    
    // รอให้ dialog ปิด
    await page.waitForTimeout(1000);
    
    await page.fill('[data-testid="search-input"]', 'ยา');
    await page.waitForTimeout(1000);
    
    // ตรวจสอบว่าสต๊อกในหน้าจอลดลง
    await page.waitForTimeout(1000); // รอให้ UI อัปเดต
    const updatedStockText = await firstProduct.locator('[data-testid="stock-quantity"]').textContent();
    const updatedStock = parseInt(updatedStockText?.replace('สต๊อก: ', '') || '0');
    
    // สต๊อกควรลดลง 1 หน่วย
    expect(updatedStock).toBe(initialStock - 1);
  });

  test('UAT-003: การตรวจสอบวันหมดอายุใน POS', async ({ page }) => {
    // รอให้หน้า POS โหลดเสร็จ
    await page.waitForSelector('[data-testid="product-grid"]');
    
    // ค้นหาสินค้า
    await page.fill('[data-testid="search-input"]', 'ยา');
    await page.waitForTimeout(1000);
    
    // เลือกสินค้าที่อาจมีการแจ้งเตือนหมดอายุ
    const productCards = page.locator('[data-testid="product-card"]');
    await expect(productCards.first()).toBeVisible();
    
    // คลิกสินค้าเพื่อเพิ่มเข้าตระกร้า
    await productCards.first().click();
    
    // รอสักครู่เพื่อให้ toast แสดง (ถ้ามี)
    await page.waitForTimeout(3000);
    
    // ตรวจสอบการแจ้งเตือนสินค้าใกล้หมดอายุ
    const expiryWarning = page.locator('[data-testid="expiry-warning-toast"]');
    if (await expiryWarning.isVisible()) {
      await expect(expiryWarning).toContainText('ใกล้หมดอายุ');
      
      // ตรวจสอบข้อมูลใน toast
      const warningText = await expiryWarning.textContent();
      expect(warningText).toContain('วัน');
      expect(warningText).toContain('หน่วย');
    }
    
    // ตรวจสอบการแจ้งเตือนสินค้าหมดอายุ
    const expiredWarning = page.locator('[data-testid="expired-warning-toast"]');
    if (await expiredWarning.isVisible()) {
      await expect(expiredWarning).toContainText('หมดอายุ');
      
      // ตรวจสอบข้อมูลใน toast
      const warningText = await expiredWarning.textContent();
      expect(warningText).toContain('หน่วย');
    }
    
    // ตรวจสอบว่าสินค้ายังสามารถเพิ่มเข้าตระกร้าได้ (แม้จะมีคำเตือน)
    await expect(page.locator('[data-testid="cart-item"]')).toHaveCount(1);
    
    // ดำเนินการชำระเงิน (ระบบควรยังคงอนุญาตให้ขายพร้อมการแจ้งเตือน)
    await page.click('[data-testid="checkout-button"]');
    await page.waitForSelector('[data-testid="payment-dialog"]');
    await page.click('[data-testid="payment-method-cash"]');
    await page.click('[data-testid="confirm-payment-button"]');
    
    // ตรวจสอบการชำระเงินสำเร็จ
    await expect(page.locator('[data-testid="payment-success-dialog"]')).toBeVisible();
    
    // ปิด dialog สำเร็จด้วยปุ่ม "รับชำระ"
    await page.click('[data-testid="close-success-dialog"]');
    
    // รอให้ dialog ปิด
    await page.waitForTimeout(1000);
  });
});

