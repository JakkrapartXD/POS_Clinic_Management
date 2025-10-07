# E2E Tests สำหรับระบบ Pharmacy Management

## ภาพรวม

E2E (End-to-End) tests นี้ใช้ Playwright เพื่อทดสอบการทำงานของระบบ Pharmacy Management อย่างครบถ้วน

## ไฟล์ Tests

### 1. `inventory-system.spec.ts`
ทดสอบระบบสต๊อกสินค้า ประกอบด้วย:

- **Test 1**: เข้าสู่ระบบและสร้างสินค้าใหม่พร้อมสต๊อกเริ่มต้น
- **Test 2**: ค้นหาสินค้าและตรวจสอบข้อมูลในหน้า product detail
- **Test 3**: เพิ่มหน่วยนับใหม่และตรวจสอบข้อมูล
- **Test 4**: เพิ่มสต๊อกให้หน่วยนับใหม่
- **Test 5**: ทดสอบการปรับเพิ่ม/ลดสต๊อกและย้ายหน่วย

### 2. `inventory-helpers.ts`
Helper functions สำหรับ inventory tests:

- `createTestProduct()` - สร้างข้อมูลสินค้าทดสอบ
- `loginAsPharmacist()` - เข้าสู่ระบบด้วยเภสัชกร
- `navigateToInventory()` - ไปที่หน้า inventory
- `fillProductForm()` - กรอกฟอร์มสินค้า
- `addNewUnit()` - เพิ่มหน่วยนับใหม่
- `addStock()` - เพิ่มสต๊อก
- `adjustStock()` - ปรับสต๊อก
- `cleanupTestProduct()` - ลบสินค้าทดสอบ

### 3. Tests อื่นๆ
- `queue-system.spec.ts` - ทดสอบระบบคิว
- `patient-management.spec.ts` - ทดสอบการจัดการผู้ป่วย
- `pharmacy-dispensing.spec.ts` - ทดสอบการจ่ายยา
- `medical-dispensing-history.spec.ts` - ทดสอบประวัติการจ่ายยา

## การรัน Tests

### 1. ติดตั้ง Dependencies
```bash
cd tests/automation
npm install
```

### 2. รัน Tests ทั้งหมด
```bash
npx playwright test
```

### 3. รัน Test เฉพาะ
```bash
# รัน inventory tests
npx playwright test inventory-system.spec.ts

# รัน test เฉพาะ
npx playwright test inventory-system.spec.ts --grep "สร้างสินค้าใหม่"
```

### 4. รัน Tests แบบ Headed (เห็น Browser)
```bash
npx playwright test --headed
```

### 5. รัน Tests แบบ Debug
```bash
npx playwright test --debug
```

## Test Data

### User Accounts สำหรับ Testing
- **Pharmacist**: `pharmacist01` / `pharmacist123`
- **Staff**: `staff01` / `staff123`
- **Nurse**: `nurse01` / `nurse123`

### Test Product Data
```typescript
const testProduct = {
  product_name: `ยาทดสอบระบบสต๊อก_${timestamp}`,
  generic_name: 'Generic Test Medicine',
  product_type: 'ยารักษาโรค',
  sale_price: '25.50',
  unit: 'เม็ด',
  pack_size: '10',
  // ... ข้อมูลอื่นๆ
}
```

## Data Test IDs

Tests ใช้ `data-testid` attributes เพื่อระบุ elements:

### Inventory Page
- `inventory-page` - หน้าหลัก inventory
- `add-product-button` - ปุ่มเพิ่มสินค้าใหม่
- `product-search-input` - ช่องค้นหาสินค้า
- `product-item-{name}` - รายการสินค้า

### Product Form
- `product-name-input` - ช่องชื่อสินค้า
- `generic-name-input` - ช่องชื่อสามัญ
- `sale-price-input` - ช่องราคาขาย
- `save-product-button` - ปุ่มบันทึกสินค้า

### Product Detail
- `product-detail-view` - หน้าลายละเอียดสินค้า
- `add-unit-button` - ปุ่มเพิ่มหน่วยนับ
- `stock-tab` - แท็บสต๊อก
- `add-stock-button` - ปุ่มเพิ่มสต๊อก

### Stock Management
- `adjust-stock-button` - ปุ่มปรับสต๊อก
- `adjust-operation-add` - เลือกการเพิ่มสต๊อก
- `adjust-operation-transfer` - เลือกการย้ายสต๊อก
- `adjust-quantity-input` - ช่องจำนวน

## การ Debug Tests

### 1. เปิด Browser DevTools
```bash
npx playwright test --debug
```

### 2. ดู Screenshots เมื่อ Test ล้มเหลว
```bash
npx playwright show-report
```

### 3. ดู Videos ของ Tests
```bash
npx playwright test --video=on
```

## Best Practices

### 1. Test Isolation
- แต่ละ test ควรเป็นอิสระจากกัน
- ใช้ `test.describe.serial()` สำหรับ tests ที่ต้องรันตามลำดับ
- Cleanup ข้อมูลทดสอบใน `afterAll()`

### 2. Wait Strategies
- ใช้ `waitForSelector()` แทน `waitForTimeout()`
- รอให้ elements โหลดเสร็จก่อนทำการ interact
- ใช้ `expect().toBeVisible()` เพื่อตรวจสอบ

### 3. Error Handling
- ใช้ try-catch สำหรับ cleanup operations
- Log errors ที่มีประโยชน์สำหรับ debugging
- ไม่ให้ test ล้มเหลวเพราะ cleanup errors

### 4. Data Management
- ใช้ timestamp หรือ unique identifiers สำหรับ test data
- เก็บ test data ใน helper functions
- Cleanup test data หลัง test เสร็จ

## Troubleshooting

### Common Issues

1. **Element not found**
   - ตรวจสอบ `data-testid` ว่าถูกต้อง
   - รอให้ page โหลดเสร็จก่อน
   - ใช้ `waitForSelector()` แทน `locator()`

2. **Test timeout**
   - เพิ่ม timeout ใน `waitForSelector()`
   - ตรวจสอบ network requests
   - ใช้ `--timeout` flag

3. **Authentication issues**
   - ตรวจสอบ user credentials
   - รอให้ login เสร็จก่อนไปหน้าอื่น
   - ใช้ `waitForURL()` เพื่อตรวจสอบ navigation

### Debug Commands
```bash
# รัน test เฉพาะและดู output
npx playwright test inventory-system.spec.ts --reporter=line

# รัน test แบบ slow motion
npx playwright test --slowMo=1000

# รัน test ใน browser เฉพาะ
npx playwright test --project=chromium
```

## การเพิ่ม Tests ใหม่

1. สร้างไฟล์ `.spec.ts` ใหม่
2. Import helper functions ที่จำเป็น
3. ใช้ `test.describe.serial()` สำหรับ tests ที่ต้องรันตามลำดับ
4. เพิ่ม `data-testid` ใน components ที่ต้องการ test
5. เขียน cleanup logic ใน `afterAll()`

## CI/CD Integration

Tests เหล่านี้สามารถรันใน CI/CD pipeline:

```yaml
# GitHub Actions example
- name: Run E2E Tests
  run: |
    cd tests/automation
    npm install
    npx playwright install
    npx playwright test
```