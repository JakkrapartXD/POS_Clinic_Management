import { 
  calculateItemVAT, 
  calculateTotalVAT, 
  calculateSubtotal, 
  calculateGrandTotal, 
  createOrderItemWithVAT 
} from '../utils/vat-utils'

// Mock data for testing
const mockProducts = [
  { 
    id: '1', 
    product_name: 'Paracetamol 500mg', 
    sale_price: 25.50, 
    vat_percent: 7,
    unit: 'เม็ด',
    stock_quantity: 100
  },
  { 
    id: '2', 
    product_name: 'Vitamin C', 
    sale_price: 15.00, 
    vat_percent: 0,
    unit: 'เม็ด',
    stock_quantity: 50
  },
  { 
    id: '3', 
    product_name: 'Face Cream', 
    sale_price: 89.00, 
    vat_percent: 7,
    unit: 'หลอด',
    stock_quantity: 20
  }
]

const mockCartItems = [
  { 
    id: '1', 
    product_name: 'Paracetamol 500mg', 
    sale_price: 25.50, 
    quantity: 2, 
    vat_percent: 7,
    unit: 'เม็ด',
    stock_quantity: 100
  },
  { 
    id: '2', 
    product_name: 'Vitamin C', 
    sale_price: 15.00, 
    quantity: 1, 
    vat_percent: 0,
    unit: 'เม็ด',
    stock_quantity: 50
  }
]

describe('POS VAT Integration', () => {
  
  describe('Cart Calculations', () => {
    it('should calculate cart subtotal correctly', () => {
      const subtotal = calculateSubtotal(mockCartItems)
      
      // Paracetamol: 25.50 * 2 = 51.00
      // Vitamin C: 15.00 * 1 = 15.00
      // Total: 51.00 + 15.00 = 66.00
      expect(subtotal).toBe(66.00)
    })

    it('should calculate cart VAT correctly', () => {
      const totalVAT = calculateTotalVAT(mockCartItems)
      
      // Paracetamol: Math.floor((51.00 * 7) / 100) = 3
      // Vitamin C: Math.floor((15.00 * 0) / 100) = 0
      // Total: 3 + 0 = 3
      expect(totalVAT).toBe(3)
    })

    it('should calculate cart grand total correctly', () => {
      const grandTotal = calculateGrandTotal(mockCartItems)
      
      // Paracetamol: 51.00 + 3 = 54.00
      // Vitamin C: 15.00 + 0 = 15.00
      // Total: 54.00 + 15.00 = 69.00
      expect(grandTotal).toBe(69.00)
    })
  })

  describe('Order Item Creation', () => {
    it('should create order items with correct VAT data', () => {
      const orderItems = mockCartItems.map(item => createOrderItemWithVAT(item))
      
      // First item (Paracetamol)
      expect(orderItems[0]).toEqual({
        productId: '1',
        quantity: 2,
        unit_price: 25.50,
        total_price: 54.00, // 51.00 + 3.00
        vat_percent: 7,
        vat_amount: 3
      })
      
      // Second item (Vitamin C)
      expect(orderItems[1]).toEqual({
        productId: '2',
        quantity: 1,
        unit_price: 15.00,
        total_price: 15.00, // 15.00 + 0.00
        vat_percent: 0,
        vat_amount: 0
      })
    })

    it('should handle mixed VAT rates in order creation', () => {
      const mixedCartItems = [
        { 
          id: '1', 
          sale_price: 100.00, 
          quantity: 1, 
          vat_percent: 7 
        },
        { 
          id: '2', 
          sale_price: 50.00, 
          quantity: 2, 
          vat_percent: 0 
        },
        { 
          id: '3', 
          sale_price: 200.00, 
          quantity: 1, 
          vat_percent: 7 
        }
      ]
      
      const orderItems = mixedCartItems.map(item => createOrderItemWithVAT(item))
      
      // Verify all items have correct structure
      expect(orderItems).toHaveLength(3)
      
      // Item 1: 100 + 7% VAT = 107
      expect(orderItems[0].total_price).toBe(107)
      expect(orderItems[0].vat_amount).toBe(7)
      
      // Item 2: 100 + 0% VAT = 100
      expect(orderItems[1].total_price).toBe(100)
      expect(orderItems[1].vat_amount).toBe(0)
      
      // Item 3: 200 + 7% VAT = 214
      expect(orderItems[2].total_price).toBe(214)
      expect(orderItems[2].vat_amount).toBe(14)
    })
  })

  describe('POS Scenarios', () => {
    it('should handle typical pharmacy transaction', () => {
      const pharmacyItems = [
        { sale_price: 25.50, quantity: 2, vat_percent: 7 },  // ยา
        { sale_price: 15.00, quantity: 1, vat_percent: 0 },  // อาหารเสริม
        { sale_price: 89.00, quantity: 1, vat_percent: 7 }   // เครื่องสำอาง
      ]
      
      const subtotal = calculateSubtotal(pharmacyItems)
      const totalVAT = calculateTotalVAT(pharmacyItems)
      const grandTotal = calculateGrandTotal(pharmacyItems)
      
      // Paracetamol: 25.50 * 2 = 51.00
      // Vitamin C: 15.00 * 1 = 15.00
      // Face Cream: 89.00 * 1 = 89.00
      // Subtotal: 51.00 + 15.00 + 89.00 = 155.00
      expect(subtotal).toBe(155.00)
      
      // VAT: Math.floor((51.00 * 7) / 100) + 0 + Math.floor((89.00 * 7) / 100)
      // VAT: 3 + 0 + 6 = 9
      expect(totalVAT).toBe(9)
      
      // Grand Total: 155.00 + 9.00 = 164.00
      expect(grandTotal).toBe(164.00)
    })

    it('should handle bulk purchase scenario', () => {
      const bulkItems = [
        { sale_price: 10.00, quantity: 100, vat_percent: 7 },  // ยา 100 ชิ้น
        { sale_price: 5.00, quantity: 50, vat_percent: 0 }     // อาหารเสริม 50 ชิ้น
      ]
      
      const subtotal = calculateSubtotal(bulkItems)
      const totalVAT = calculateTotalVAT(bulkItems)
      const grandTotal = calculateGrandTotal(bulkItems)
      
      // Medicine: 10.00 * 100 = 1000.00
      // Supplements: 5.00 * 50 = 250.00
      // Subtotal: 1000.00 + 250.00 = 1250.00
      expect(subtotal).toBe(1250.00)
      
      // VAT: Math.floor((1000.00 * 7) / 100) + 0 = 70 + 0 = 70
      expect(totalVAT).toBe(70)
      
      // Grand Total: 1250.00 + 70.00 = 1320.00
      expect(grandTotal).toBe(1320.00)
    })

    it('should handle walk-in customer with no VAT items', () => {
      const noVATItems = [
        { sale_price: 20.00, quantity: 3, vat_percent: 0 },
        { sale_price: 15.00, quantity: 2, vat_percent: 0 },
        { sale_price: 10.00, quantity: 5, vat_percent: 0 }
      ]
      
      const subtotal = calculateSubtotal(noVATItems)
      const totalVAT = calculateTotalVAT(noVATItems)
      const grandTotal = calculateGrandTotal(noVATItems)
      
      // All items: 60.00 + 30.00 + 50.00 = 140.00
      expect(subtotal).toBe(140.00)
      expect(totalVAT).toBe(0)
      expect(grandTotal).toBe(140.00)
    })

    it('should handle high-value transaction', () => {
      const highValueItems = [
        { sale_price: 1000.00, quantity: 1, vat_percent: 7 },
        { sale_price: 500.00, quantity: 2, vat_percent: 7 },
        { sale_price: 200.00, quantity: 5, vat_percent: 0 }
      ]
      
      const subtotal = calculateSubtotal(highValueItems)
      const totalVAT = calculateTotalVAT(highValueItems)
      const grandTotal = calculateGrandTotal(highValueItems)
      
      // Item 1: 1000.00 * 1 = 1000.00
      // Item 2: 500.00 * 2 = 1000.00
      // Item 3: 200.00 * 5 = 1000.00
      // Subtotal: 1000.00 + 1000.00 + 1000.00 = 3000.00
      expect(subtotal).toBe(3000.00)
      
      // VAT: Math.floor((1000.00 * 7) / 100) + Math.floor((1000.00 * 7) / 100) + 0
      // VAT: 70 + 70 + 0 = 140
      expect(totalVAT).toBe(140)
      
      // Grand Total: 3000.00 + 140.00 = 3140.00
      expect(grandTotal).toBe(3140.00)
    })
  })

  describe('Edge Cases in POS', () => {
    it('should handle empty cart', () => {
      const emptyCart: any[] = []
      
      const subtotal = calculateSubtotal(emptyCart)
      const totalVAT = calculateTotalVAT(emptyCart)
      const grandTotal = calculateGrandTotal(emptyCart)
      
      expect(subtotal).toBe(0)
      expect(totalVAT).toBe(0)
      expect(grandTotal).toBe(0)
    })

    it('should handle single item cart', () => {
      const singleItem = [
        { sale_price: 50.00, quantity: 1, vat_percent: 7 }
      ]
      
      const subtotal = calculateSubtotal(singleItem)
      const totalVAT = calculateTotalVAT(singleItem)
      const grandTotal = calculateGrandTotal(singleItem)
      
      expect(subtotal).toBe(50.00)
      expect(totalVAT).toBe(3) // Math.floor((50.00 * 7) / 100)
      expect(grandTotal).toBe(53.00)
    })

    it('should handle quantity changes', () => {
      const item = { sale_price: 25.00, quantity: 1, vat_percent: 7 }
      
      // Original quantity
      let result = calculateItemVAT(item)
      expect(result.total).toBe(26) // 25.00 + 1 (Math.floor(1.75))
      
      // Double quantity
      item.quantity = 2
      result = calculateItemVAT(item)
      expect(result.total).toBe(53) // 50.00 + 3 (Math.floor(3.50))
      
      // Triple quantity
      item.quantity = 3
      result = calculateItemVAT(item)
      expect(result.total).toBe(80) // 75.00 + 5 (Math.floor(5.25))
    })

    it('should handle price changes', () => {
      const item = { sale_price: 100.00, quantity: 1, vat_percent: 7 }
      
      // Original price
      let result = calculateItemVAT(item)
      expect(result.total).toBe(107.00) // 100.00 + 7.00
      
      // Half price
      item.sale_price = 50.00
      result = calculateItemVAT(item)
      expect(result.total).toBe(53) // 50.00 + 3 (Math.floor(3.50))
      
      // Double price
      item.sale_price = 200.00
      result = calculateItemVAT(item)
      expect(result.total).toBe(214.00) // 200.00 + 14.00
    })
  })

  describe('Payment Calculations', () => {
    it('should calculate change correctly', () => {
      const cartTotal = 69.00 // From mockCartItems
      const paymentAmount = 100.00
      const change = paymentAmount - cartTotal
      
      expect(change).toBe(31.00)
    })

    it('should handle exact payment', () => {
      const cartTotal = 69.00
      const paymentAmount = 69.00
      const change = paymentAmount - cartTotal
      
      expect(change).toBe(0.00)
    })

    it('should handle insufficient payment', () => {
      const cartTotal = 69.00
      const paymentAmount = 50.00
      const change = paymentAmount - cartTotal
      
      expect(change).toBe(-19.00) // Negative change indicates insufficient payment
    })
  })

  describe('Order Validation', () => {
    it('should validate order totals match individual calculations', () => {
      const items = [
        { sale_price: 25.50, quantity: 2, vat_percent: 7 },
        { sale_price: 15.00, quantity: 1, vat_percent: 0 }
      ]
      
      // Calculate individual totals
      const individualTotals = items.map(item => {
        const result = calculateItemVAT(item)
        return result.total
      })
      
      // Calculate grand total
      const grandTotal = calculateGrandTotal(items)
      
      // Sum of individual totals should equal grand total
      const sumOfIndividualTotals = individualTotals.reduce((sum, total) => sum + total, 0)
      
      expect(grandTotal).toBe(sumOfIndividualTotals)
      expect(grandTotal).toBe(69.00) // 54.00 + 15.00
    })

    it('should validate VAT calculations are consistent', () => {
      const items = [
        { sale_price: 100.00, quantity: 1, vat_percent: 7 },
        { sale_price: 50.00, quantity: 2, vat_percent: 0 }
      ]
      
      // Calculate individual VAT amounts
      const individualVATs = items.map(item => {
        const result = calculateItemVAT(item)
        return result.vatAmount
      })
      
      // Calculate total VAT
      const totalVAT = calculateTotalVAT(items)
      
      // Sum of individual VATs should equal total VAT
      const sumOfIndividualVATs = individualVATs.reduce((sum, vat) => sum + vat, 0)
      
      expect(totalVAT).toBe(sumOfIndividualVATs)
      expect(totalVAT).toBe(7) // 7 + 0
    })
  })
})
