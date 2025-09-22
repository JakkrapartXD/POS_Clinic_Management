/**
 * VAT calculation utilities for consistent tax calculations across the application
 */

export interface VATCalculationInput {
  sale_price: number;
  quantity: number;
  vat_percent?: number;
}

export interface VATCalculationResult {
  subtotal: number;
  vatAmount: number;
  total: number;
  vatPercent: number;
}

/**
 * Calculates VAT for a single item
 * @param input - Item details including price, quantity, and VAT percentage
 * @returns VAT calculation result with subtotal, VAT amount, total, and VAT percentage
 */
export function calculateItemVAT(input: VATCalculationInput): VATCalculationResult {
  const { sale_price, quantity, vat_percent = 0 } = input;
  
  const subtotal = sale_price * quantity;
  const vatAmount = Math.floor((subtotal * vat_percent) / 100); // ปัดลงเป็นจำนวนเต็ม
  const total = subtotal + vatAmount;
  
  return {
    subtotal,
    vatAmount,
    total,
    vatPercent: vat_percent
  };
}

/**
 * Calculates total VAT for multiple items
 * @param items - Array of items with VAT calculation inputs
 * @returns Total VAT amount across all items
 */
export function calculateTotalVAT(items: VATCalculationInput[]): number {
  return items.reduce((totalVat, item) => {
    const { vatAmount } = calculateItemVAT(item);
    return totalVat + vatAmount;
  }, 0);
}

/**
 * Calculates subtotal (before VAT) for multiple items
 * @param items - Array of items with VAT calculation inputs
 * @returns Total subtotal amount across all items
 */
export function calculateSubtotal(items: VATCalculationInput[]): number {
  return items.reduce((total, item) => {
    const { subtotal } = calculateItemVAT(item);
    return total + subtotal;
  }, 0);
}

/**
 * Calculates grand total (including VAT) for multiple items
 * @param items - Array of items with VAT calculation inputs
 * @returns Grand total amount including VAT
 */
export function calculateGrandTotal(items: VATCalculationInput[]): number {
  return items.reduce((total, item) => {
    const { total: itemTotal } = calculateItemVAT(item);
    return total + itemTotal;
  }, 0);
}

/**
 * Creates order item data with VAT calculations for backend submission
 * @param item - Cart item with product details
 * @returns Order item data with calculated VAT information
 */
export function createOrderItemWithVAT(item: {
  id: string;
  sale_price: number;
  quantity: number;
  vat_percent?: number;
}) {
  const vatCalculation = calculateItemVAT({
    sale_price: item.sale_price,
    quantity: item.quantity,
    vat_percent: item.vat_percent
  });

  return {
    productId: item.id,
    quantity: item.quantity,
    unit_price: item.sale_price,
    total_price: vatCalculation.total,
    vat_percent: vatCalculation.vatPercent,
    vat_amount: vatCalculation.vatAmount
  };
}
