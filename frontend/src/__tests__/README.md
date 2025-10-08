# VAT Utils Unit Tests

ไฟล์ test สำหรับระบบ VAT calculation ในระบบ POS

## ไฟล์ Test

### 1. `vat-utils.test.ts`
Unit tests สำหรับฟังก์ชัน VAT calculation ทั้งหมด:
- `calculateItemVAT` - คำนวณ VAT สำหรับสินค้าแต่ละรายการ
- `calculateTotalVAT` - คำนวณ VAT รวม
- `calculateSubtotal` - คำนวณยอดรวมก่อน VAT
- `calculateGrandTotal` - คำนวณยอดรวมสุทธิ (รวม VAT)
- `createOrderItemWithVAT` - สร้างข้อมูล order item พร้อม VAT

### 2. `pos-vat-integration.test.ts`
Integration tests สำหรับการใช้งาน VAT ในระบบ POS:
- Cart calculations
- Order item creation
- POS scenarios
- Payment calculations
- Order validation

## การรัน Tests

### รัน Tests ทั้งหมด
```bash
npm test
```

### รัน Tests เฉพาะ VAT
```bash
npm test vat-utils
```

### รัน Tests พร้อม Coverage
```bash
npm test -- --coverage
```

### รัน Tests แบบ Watch Mode
```bash
npm test -- --watch
```

## Test Cases ที่ครอบคลุม

### Basic VAT Calculations
- ✅ 7% VAT calculation
- ✅ 0% VAT calculation
- ✅ Default VAT (0%)
- ✅ Decimal prices
- ✅ Zero quantity/price
- ✅ Small VAT amounts (rounding)

### Multiple Items
- ✅ Mixed VAT rates
- ✅ Empty arrays
- ✅ Large numbers
- ✅ Bulk purchases

### Edge Cases
- ✅ Negative quantities
- ✅ Negative VAT percentages
- ✅ Very large numbers
- ✅ Fractional VAT amounts

### Real-world Scenarios
- ✅ Typical pharmacy transaction
- ✅ Bulk purchase scenario
- ✅ Walk-in customer (no VAT)
- ✅ High-value transaction
- ✅ Single item cart
- ✅ Empty cart

### POS Integration
- ✅ Cart calculations
- ✅ Order item creation
- ✅ Payment calculations
- ✅ Order validation
- ✅ Quantity/price changes

## Expected Results

### Test Coverage
- **Lines**: 100%
- **Functions**: 100%
- **Branches**: 100%
- **Statements**: 100%

### Key Test Scenarios

#### 1. Basic VAT Calculation
```typescript
// Input: sale_price: 100, quantity: 2, vat_percent: 7
// Expected: subtotal: 200, vatAmount: 14, total: 214
```

#### 2. Mixed VAT Rates
```typescript
// Items: [7% VAT, 0% VAT, 7% VAT]
// Expected: Correct calculation for each rate
```

#### 3. Decimal Handling
```typescript
// Input: sale_price: 33.33, quantity: 3, vat_percent: 7
// Expected: subtotal: 99.99, vatAmount: 6, total: 105.99
```

#### 4. Rounding Behavior
```typescript
// VAT calculation uses Math.floor() for consistent rounding
// Math.floor((amount * vat_percent) / 100)
```

## Mock Data

### Products
```typescript
const mockProducts = [
  { id: '1', sale_price: 25.50, vat_percent: 7 },  // ยา
  { id: '2', sale_price: 15.00, vat_percent: 0 },  // อาหารเสริม
  { id: '3', sale_price: 89.00, vat_percent: 7 }   // เครื่องสำอาง
]
```

### Cart Items
```typescript
const mockCartItems = [
  { id: '1', sale_price: 25.50, quantity: 2, vat_percent: 7 },
  { id: '2', sale_price: 15.00, quantity: 1, vat_percent: 0 }
]
```

## การ Debug Tests

### ดู Test Results แบบละเอียด
```bash
npm test -- --verbose
```

### รัน Test เฉพาะไฟล์
```bash
npm test vat-utils.test.ts
```

### รัน Test เฉพาะ describe block
```bash
npm test -- --testNamePattern="calculateItemVAT"
```

## การเพิ่ม Test Cases ใหม่

1. เพิ่ม test case ในไฟล์ที่เหมาะสม
2. ใช้ descriptive test names
3. ครอบคลุม edge cases
4. ตรวจสอบ expected results
5. รัน tests เพื่อให้แน่ใจว่าผ่าน

## Best Practices

- ✅ ใช้ descriptive test names
- ✅ ครอบคลุม happy path และ edge cases
- ✅ ใช้ mock data ที่สมจริง
- ✅ ตรวจสอบ expected results อย่างละเอียด
- ✅ แยก unit tests และ integration tests
- ✅ ใช้ proper assertions
- ✅ ครอบคลุม error scenarios
