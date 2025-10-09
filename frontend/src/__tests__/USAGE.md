# การใช้งาน VAT Utils Unit Tests

## ไฟล์ที่สร้างขึ้น

### 1. `vat-utils.test.ts`
- **Purpose**: Unit tests สำหรับฟังก์ชัน VAT calculation
- **Coverage**: 100% ของฟังก์ชันใน `vat-utils.ts`
- **Test Cases**: 25+ test cases ครอบคลุมทุก scenario

### 2. `pos-vat-integration.test.ts`
- **Purpose**: Integration tests สำหรับการใช้งาน VAT ใน POS
- **Coverage**: การทำงานร่วมกันของ VAT functions
- **Test Cases**: 20+ test cases สำหรับ POS scenarios

### 3. `jest.config.js`
- **Purpose**: Configuration สำหรับ Jest testing framework
- **Features**: TypeScript support, coverage reporting, path mapping

### 4. `setup.ts`
- **Purpose**: Jest setup file สำหรับ testing environment
- **Features**: Mock browser APIs, testing utilities

### 5. `README.md`
- **Purpose**: Documentation สำหรับ test files
- **Content**: การใช้งาน, test cases, expected results

## การรัน Tests

### รัน Tests ทั้งหมด
```bash
npm test
```

### รัน Tests เฉพาะ VAT Utils
```bash
npm run test:vat
```

### รัน Tests เฉพาะ POS Integration
```bash
npm run test:pos
```

### รัน Tests แบบ Watch Mode
```bash
npm run test:watch
```

### รัน Tests พร้อม Coverage Report
```bash
npm run test:coverage
```

## Test Results ที่คาดหวัง

### VAT Utils Tests
```
✓ calculateItemVAT - should calculate VAT correctly for item with 7% VAT
✓ calculateItemVAT - should calculate VAT correctly for item with 0% VAT
✓ calculateItemVAT - should default to 0% VAT when vat_percent is not provided
✓ calculateItemVAT - should handle decimal prices correctly
✓ calculateItemVAT - should handle zero quantity
✓ calculateItemVAT - should handle zero price
✓ calculateItemVAT - should handle very small VAT amounts (rounding down)
✓ calculateTotalVAT - should calculate total VAT for multiple items
✓ calculateTotalVAT - should return 0 for empty array
✓ calculateTotalVAT - should handle mixed VAT rates correctly
✓ calculateSubtotal - should calculate subtotal for multiple items
✓ calculateSubtotal - should return 0 for empty array
✓ calculateSubtotal - should handle decimal prices in subtotal
✓ calculateGrandTotal - should calculate grand total including VAT
✓ calculateGrandTotal - should return 0 for empty array
✓ calculateGrandTotal - should handle mixed VAT rates in grand total
✓ createOrderItemWithVAT - should create order item with correct VAT calculations
✓ createOrderItemWithVAT - should handle item without VAT percentage
✓ createOrderItemWithVAT - should handle item with 0% VAT explicitly
✓ createOrderItemWithVAT - should handle decimal prices in order item
✓ Edge Cases and Error Handling - should handle fractional VAT amounts correctly
✓ Edge Cases and Error Handling - should handle very large numbers
✓ Edge Cases and Error Handling - should handle negative quantities gracefully
✓ Edge Cases and Error Handling - should handle negative VAT percentage
✓ Real-world Scenarios - should handle typical pharmacy POS scenario
✓ Real-world Scenarios - should handle bulk purchase scenario
✓ Real-world Scenarios - should handle single item with high VAT
```

### POS Integration Tests
```
✓ Cart Calculations - should calculate cart subtotal correctly
✓ Cart Calculations - should calculate cart VAT correctly
✓ Cart Calculations - should calculate cart grand total correctly
✓ Order Item Creation - should create order items with correct VAT data
✓ Order Item Creation - should handle mixed VAT rates in order creation
✓ POS Scenarios - should handle typical pharmacy transaction
✓ POS Scenarios - should handle bulk purchase scenario
✓ POS Scenarios - should handle walk-in customer with no VAT items
✓ POS Scenarios - should handle high-value transaction
✓ Edge Cases in POS - should handle empty cart
✓ Edge Cases in POS - should handle single item cart
✓ Edge Cases in POS - should handle quantity changes
✓ Edge Cases in POS - should handle price changes
✓ Payment Calculations - should calculate change correctly
✓ Payment Calculations - should handle exact payment
✓ Payment Calculations - should handle insufficient payment
✓ Order Validation - should validate order totals match individual calculations
✓ Order Validation - should validate VAT calculations are consistent
```

## Coverage Report

### Expected Coverage
- **Lines**: 100%
- **Functions**: 100%
- **Branches**: 100%
- **Statements**: 100%

### Coverage Files
- `vat-utils.ts`: 100% coverage
- `pos-vat-integration.test.ts`: Integration coverage

## การ Debug Tests

### ดู Test Results แบบละเอียด
```bash
npm test -- --verbose
```

### รัน Test เฉพาะ describe block
```bash
npm test -- --testNamePattern="calculateItemVAT"
```

### รัน Test เฉพาะ it block
```bash
npm test -- --testNamePattern="should calculate VAT correctly for item with 7% VAT"
```

## การเพิ่ม Test Cases ใหม่

### 1. เพิ่ม Test Case ใน VAT Utils
```typescript
it('should handle new scenario', () => {
  const input: VATCalculationInput = {
    sale_price: 100,
    quantity: 1,
    vat_percent: 7
  }
  
  const result = calculateItemVAT(input)
  
  expect(result.subtotal).toBe(100)
  expect(result.vatAmount).toBe(7)
  expect(result.total).toBe(107)
})
```

### 2. เพิ่ม Test Case ใน POS Integration
```typescript
it('should handle new POS scenario', () => {
  const items = [
    { sale_price: 50, quantity: 2, vat_percent: 7 }
  ]
  
  const total = calculateGrandTotal(items)
  
  expect(total).toBe(107)
})
```

## Best Practices

### 1. Test Naming
- ใช้ descriptive names
- เริ่มต้นด้วย "should"
- อธิบาย expected behavior

### 2. Test Structure
- Arrange: เตรียมข้อมูล
- Act: เรียกฟังก์ชัน
- Assert: ตรวจสอบผลลัพธ์

### 3. Coverage
- ครอบคลุม happy path
- ครอบคลุม edge cases
- ครอบคลุม error scenarios

### 4. Mock Data
- ใช้ realistic data
- ครอบคลุม various scenarios
- ใช้ consistent naming

## Troubleshooting

### Common Issues

#### 1. Import Errors
```bash
Error: Cannot find module '@/utils/vat-utils'
```
**Solution**: ตรวจสอบ path mapping ใน `jest.config.js`

#### 2. TypeScript Errors
```bash
Error: Type 'number' is not assignable to type 'string'
```
**Solution**: ตรวจสอบ type definitions ใน test files

#### 3. Test Timeout
```bash
Error: Timeout - Async callback was not invoked
```
**Solution**: เพิ่ม timeout ใน `jest.config.js`

### Debug Commands
```bash
# รัน tests แบบ debug
npm test -- --verbose --no-cache

# รัน tests เฉพาะไฟล์
npm test vat-utils.test.ts

# รัน tests พร้อม coverage
npm run test:coverage
```

## การใช้งานใน CI/CD

### GitHub Actions
```yaml
- name: Run Tests
  run: npm run test:coverage

- name: Upload Coverage
  uses: codecov/codecov-action@v3
```

### Pre-commit Hook
```bash
# เพิ่มใน package.json
"husky": {
  "hooks": {
    "pre-commit": "npm test"
  }
}
```

## สรุป

ไฟล์ test ที่สร้างขึ้นครอบคลุม:
- ✅ **Unit Tests**: ทุกฟังก์ชันใน VAT utils
- ✅ **Integration Tests**: การทำงานร่วมกันใน POS
- ✅ **Edge Cases**: Scenarios ที่ซับซ้อน
- ✅ **Real-world Scenarios**: การใช้งานจริง
- ✅ **Error Handling**: การจัดการข้อผิดพลาด
- ✅ **Documentation**: คู่มือการใช้งาน

การรัน tests จะช่วยให้มั่นใจว่าระบบ VAT ทำงานถูกต้องและครอบคลุมทุก use cases ที่อาจเกิดขึ้น
