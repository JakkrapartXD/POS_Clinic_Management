import { 
  calculateItemVAT, 
  calculateTotalVAT, 
  calculateSubtotal, 
  calculateGrandTotal, 
  createOrderItemWithVAT,
  VATCalculationInput 
} from '../utils/vat-utils'

describe('VAT Utils', () => {
  
  describe('calculateItemVAT', () => {
    it('should calculate VAT correctly for item with 7% VAT', () => {
      const input: VATCalculationInput = {
        sale_price: 100,
        quantity: 2,
        vat_percent: 7
      }
      
      const result = calculateItemVAT(input)
      
      expect(result.subtotal).toBe(200) // 100 * 2
      expect(result.vatAmount).toBe(14) // Math.floor((200 * 7) / 100)
      expect(result.total).toBe(214) // 200 + 14
      expect(result.vatPercent).toBe(7)
    })

    it('should calculate VAT correctly for item with 0% VAT', () => {
      const input: VATCalculationInput = {
        sale_price: 50,
        quantity: 3,
        vat_percent: 0
      }
      
      const result = calculateItemVAT(input)
      
      expect(result.subtotal).toBe(150) // 50 * 3
      expect(result.vatAmount).toBe(0) // 0% VAT
      expect(result.total).toBe(150) // 150 + 0
      expect(result.vatPercent).toBe(0)
    })

    it('should default to 0% VAT when vat_percent is not provided', () => {
      const input: VATCalculationInput = {
        sale_price: 25,
        quantity: 4
      }
      
      const result = calculateItemVAT(input)
      
      expect(result.subtotal).toBe(100) // 25 * 4
      expect(result.vatAmount).toBe(0) // Default 0% VAT
      expect(result.total).toBe(100) // 100 + 0
      expect(result.vatPercent).toBe(0)
    })

    it('should handle decimal prices correctly', () => {
      const input: VATCalculationInput = {
        sale_price: 33.33,
        quantity: 3,
        vat_percent: 7
      }
      
      const result = calculateItemVAT(input)
      
      expect(result.subtotal).toBe(99.99) // 33.33 * 3
      expect(result.vatAmount).toBe(6) // Math.floor((99.99 * 7) / 100) = 6
      expect(result.total).toBe(105.99) // 99.99 + 6
    })

    it('should handle zero quantity', () => {
      const input: VATCalculationInput = {
        sale_price: 100,
        quantity: 0,
        vat_percent: 7
      }
      
      const result = calculateItemVAT(input)
      
      expect(result.subtotal).toBe(0)
      expect(result.vatAmount).toBe(0)
      expect(result.total).toBe(0)
    })

    it('should handle zero price', () => {
      const input: VATCalculationInput = {
        sale_price: 0,
        quantity: 5,
        vat_percent: 7
      }
      
      const result = calculateItemVAT(input)
      
      expect(result.subtotal).toBe(0)
      expect(result.vatAmount).toBe(0)
      expect(result.total).toBe(0)
    })

    it('should handle very small VAT amounts (rounding down)', () => {
      const input: VATCalculationInput = {
        sale_price: 1,
        quantity: 1,
        vat_percent: 7
      }
      
      const result = calculateItemVAT(input)
      
      expect(result.subtotal).toBe(1)
      expect(result.vatAmount).toBe(0) // Math.floor((1 * 7) / 100) = 0
      expect(result.total).toBe(1)
    })
  })

  describe('calculateTotalVAT', () => {
    it('should calculate total VAT for multiple items', () => {
      const items: VATCalculationInput[] = [
        { sale_price: 100, quantity: 1, vat_percent: 7 },
        { sale_price: 50, quantity: 2, vat_percent: 0 },
        { sale_price: 200, quantity: 1, vat_percent: 7 }
      ]
      
      const totalVAT = calculateTotalVAT(items)
      
      // Item 1: Math.floor((100 * 7) / 100) = 7
      // Item 2: Math.floor((100 * 0) / 100) = 0
      // Item 3: Math.floor((200 * 7) / 100) = 14
      // Total: 7 + 0 + 14 = 21
      expect(totalVAT).toBe(21)
    })

    it('should return 0 for empty array', () => {
      const totalVAT = calculateTotalVAT([])
      expect(totalVAT).toBe(0)
    })

    it('should handle mixed VAT rates correctly', () => {
      const items: VATCalculationInput[] = [
        { sale_price: 100, quantity: 1, vat_percent: 7 },   // 7% VAT
        { sale_price: 200, quantity: 1, vat_percent: 0 },   // 0% VAT
        { sale_price: 50, quantity: 2, vat_percent: 7 }     // 7% VAT
      ]
      
      const totalVAT = calculateTotalVAT(items)
      
      // Item 1: Math.floor((100 * 7) / 100) = 7
      // Item 2: Math.floor((200 * 0) / 100) = 0
      // Item 3: Math.floor((100 * 7) / 100) = 7
      // Total: 7 + 0 + 7 = 14
      expect(totalVAT).toBe(14)
    })
  })

  describe('calculateSubtotal', () => {
    it('should calculate subtotal for multiple items', () => {
      const items: VATCalculationInput[] = [
        { sale_price: 100, quantity: 2, vat_percent: 7 },
        { sale_price: 50, quantity: 3, vat_percent: 0 }
      ]
      
      const subtotal = calculateSubtotal(items)
      
      // Item 1: 100 * 2 = 200
      // Item 2: 50 * 3 = 150
      // Total: 200 + 150 = 350
      expect(subtotal).toBe(350)
    })

    it('should return 0 for empty array', () => {
      const subtotal = calculateSubtotal([])
      expect(subtotal).toBe(0)
    })

    it('should handle decimal prices in subtotal', () => {
      const items: VATCalculationInput[] = [
        { sale_price: 33.33, quantity: 3, vat_percent: 7 },
        { sale_price: 16.67, quantity: 2, vat_percent: 0 }
      ]
      
      const subtotal = calculateSubtotal(items)
      
      // Item 1: 33.33 * 3 = 99.99
      // Item 2: 16.67 * 2 = 33.34
      // Total: 99.99 + 33.34 = 133.32999999999998 (floating point precision)
      expect(subtotal).toBeCloseTo(133.33, 2)
    })
  })

  describe('calculateGrandTotal', () => {
    it('should calculate grand total including VAT', () => {
      const items: VATCalculationInput[] = [
        { sale_price: 100, quantity: 1, vat_percent: 7 },
        { sale_price: 50, quantity: 2, vat_percent: 0 }
      ]
      
      const grandTotal = calculateGrandTotal(items)
      
      // Item 1: 100 + Math.floor((100 * 7) / 100) = 100 + 7 = 107
      // Item 2: 100 + Math.floor((100 * 0) / 100) = 100 + 0 = 100
      // Total: 107 + 100 = 207
      expect(grandTotal).toBe(207)
    })

    it('should return 0 for empty array', () => {
      const grandTotal = calculateGrandTotal([])
      expect(grandTotal).toBe(0)
    })

    it('should handle mixed VAT rates in grand total', () => {
      const items: VATCalculationInput[] = [
        { sale_price: 100, quantity: 1, vat_percent: 7 },   // 7% VAT
        { sale_price: 200, quantity: 1, vat_percent: 0 },   // 0% VAT
        { sale_price: 50, quantity: 2, vat_percent: 7 }     // 7% VAT
      ]
      
      const grandTotal = calculateGrandTotal(items)
      
      // Item 1: 100 + 7 = 107
      // Item 2: 200 + 0 = 200
      // Item 3: 100 + 7 = 107
      // Total: 107 + 200 + 107 = 414
      expect(grandTotal).toBe(414)
    })
  })

  describe('createOrderItemWithVAT', () => {
    it('should create order item with correct VAT calculations', () => {
      const item = {
        id: 'product-1',
        sale_price: 100,
        quantity: 2,
        vat_percent: 7
      }
      
      const orderItem = createOrderItemWithVAT(item)
      
      expect(orderItem.productId).toBe('product-1')
      expect(orderItem.quantity).toBe(2)
      expect(orderItem.unit_price).toBe(100)
      expect(orderItem.total_price).toBe(214) // 200 + 14
      expect(orderItem.vat_percent).toBe(7)
      expect(orderItem.vat_amount).toBe(14)
    })

    it('should handle item without VAT percentage', () => {
      const item = {
        id: 'product-2',
        sale_price: 50,
        quantity: 3
      }
      
      const orderItem = createOrderItemWithVAT(item)
      
      expect(orderItem.productId).toBe('product-2')
      expect(orderItem.quantity).toBe(3)
      expect(orderItem.unit_price).toBe(50)
      expect(orderItem.total_price).toBe(150) // 150 + 0
      expect(orderItem.vat_percent).toBe(0)
      expect(orderItem.vat_amount).toBe(0)
    })

    it('should handle item with 0% VAT explicitly', () => {
      const item = {
        id: 'product-3',
        sale_price: 75,
        quantity: 2,
        vat_percent: 0
      }
      
      const orderItem = createOrderItemWithVAT(item)
      
      expect(orderItem.productId).toBe('product-3')
      expect(orderItem.quantity).toBe(2)
      expect(orderItem.unit_price).toBe(75)
      expect(orderItem.total_price).toBe(150) // 150 + 0
      expect(orderItem.vat_percent).toBe(0)
      expect(orderItem.vat_amount).toBe(0)
    })

    it('should handle decimal prices in order item', () => {
      const item = {
        id: 'product-4',
        sale_price: 33.33,
        quantity: 3,
        vat_percent: 7
      }
      
      const orderItem = createOrderItemWithVAT(item)
      
      expect(orderItem.productId).toBe('product-4')
      expect(orderItem.quantity).toBe(3)
      expect(orderItem.unit_price).toBe(33.33)
      expect(orderItem.total_price).toBe(105.99) // 99.99 + 6
      expect(orderItem.vat_percent).toBe(7)
      expect(orderItem.vat_amount).toBe(6)
    })
  })

  describe('Edge Cases and Error Handling', () => {
    it('should handle fractional VAT amounts correctly', () => {
      const input: VATCalculationInput = {
        sale_price: 33.33,
        quantity: 3,
        vat_percent: 7
      }
      
      const result = calculateItemVAT(input)
      
      // 33.33 * 3 = 99.99
      // Math.floor((99.99 * 7) / 100) = Math.floor(6.9993) = 6
      expect(result.subtotal).toBe(99.99)
      expect(result.vatAmount).toBe(6)
      expect(result.total).toBe(105.99)
    })

    it('should handle very large numbers', () => {
      const input: VATCalculationInput = {
        sale_price: 1000000,
        quantity: 100,
        vat_percent: 7
      }
      
      const result = calculateItemVAT(input)
      
      expect(result.subtotal).toBe(100000000) // 1,000,000 * 100
      expect(result.vatAmount).toBe(7000000) // Math.floor((100,000,000 * 7) / 100)
      expect(result.total).toBe(107000000) // 100,000,000 + 7,000,000
    })

    it('should handle negative quantities gracefully', () => {
      const input: VATCalculationInput = {
        sale_price: 100,
        quantity: -2,
        vat_percent: 7
      }
      
      const result = calculateItemVAT(input)
      
      expect(result.subtotal).toBe(-200) // 100 * -2
      expect(result.vatAmount).toBe(-14) // Math.floor((-200 * 7) / 100)
      expect(result.total).toBe(-214) // -200 + (-14)
    })

    it('should handle negative VAT percentage', () => {
      const input: VATCalculationInput = {
        sale_price: 100,
        quantity: 2,
        vat_percent: -7
      }
      
      const result = calculateItemVAT(input)
      
      expect(result.subtotal).toBe(200) // 100 * 2
      expect(result.vatAmount).toBe(-14) // Math.floor((200 * -7) / 100)
      expect(result.total).toBe(186) // 200 + (-14)
    })
  })

  describe('Real-world Scenarios', () => {
    it('should handle typical pharmacy POS scenario', () => {
      const items: VATCalculationInput[] = [
        { sale_price: 25.50, quantity: 2, vat_percent: 7 },  // ยา
        { sale_price: 15.00, quantity: 1, vat_percent: 0 },  // อาหารเสริม
        { sale_price: 89.00, quantity: 1, vat_percent: 7 }   // เครื่องสำอาง
      ]
      
      const subtotal = calculateSubtotal(items)      // 25.50*2 + 15.00*1 + 89.00*1 = 155.00
      const totalVAT = calculateTotalVAT(items)      // 3 + 0 + 6 = 9
      const grandTotal = calculateGrandTotal(items)  // 54 + 15 + 95 = 164
      
      expect(subtotal).toBe(155.00)
      expect(totalVAT).toBe(9)
      expect(grandTotal).toBe(164)
    })

    it('should handle bulk purchase scenario', () => {
      const items: VATCalculationInput[] = [
        { sale_price: 10.00, quantity: 100, vat_percent: 7 },  // ยา 100 ชิ้น
        { sale_price: 5.00, quantity: 50, vat_percent: 0 }     // อาหารเสริม 50 ชิ้น
      ]
      
      const subtotal = calculateSubtotal(items)      // 1000 + 250 = 1250
      const totalVAT = calculateTotalVAT(items)      // 70 + 0 = 70
      const grandTotal = calculateGrandTotal(items)  // 1070 + 250 = 1320
      
      expect(subtotal).toBe(1250)
      expect(totalVAT).toBe(70)
      expect(grandTotal).toBe(1320)
    })

    it('should handle single item with high VAT', () => {
      const input: VATCalculationInput = {
        sale_price: 1000,
        quantity: 1,
        vat_percent: 10
      }
      
      const result = calculateItemVAT(input)
      
      expect(result.subtotal).toBe(1000)
      expect(result.vatAmount).toBe(100) // Math.floor((1000 * 10) / 100)
      expect(result.total).toBe(1100)
    })
  })
})
