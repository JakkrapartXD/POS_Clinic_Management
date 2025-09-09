// Utility functions for displaying product information

export interface ProductDisplayInfo {
  id: string
  product_name: string
  unit?: string
  product_name_historical?: string
  product_unit_historical?: string
}

/**
 * Get display name for product with unit
 * Uses historical data if available, otherwise falls back to current product data
 */
export function getProductDisplayName(product: ProductDisplayInfo): string {
  const name = product.product_name_historical || product.product_name
  return name
}

/**
 * Get display name for order item
 * Prioritizes historical data to show what was actually sold
 */
export function getOrderItemDisplayName(orderItem: {
  product_name?: string
  product_unit?: string
  product: {
    product_name: string
    unit?: string
  }
}): string {
  const name = orderItem.product_name || orderItem.product.product_name
  return name
}

/**
 * Get display name for purchase item
 * Prioritizes historical data to show what was actually purchased
 */
export function getPurchaseItemDisplayName(purchaseItem: {
  product_name?: string
  product_unit?: string
  product: {
    product_name: string
    unit?: string
  }
}): string {
  const name = purchaseItem.product_name || purchaseItem.product.product_name
  return name
}

/**
 * Get display name for prescription item
 * Prioritizes historical data to show what was actually prescribed
 */
export function getPrescriptionDisplayName(prescription: {
  product_name?: string
  product_unit?: string
  product: {
    product_name: string
    unit?: string
  }
}): string {
  const name = prescription.product_name || prescription.product.product_name
  return name
}

/**
 * Get display name for stock movement
 * Prioritizes historical data to show what was actually moved
 */
export function getStockMovementDisplayName(stockMovement: {
  product_name?: string
  product_unit?: string
  product: {
    product_name: string
    unit?: string
  }
}): string {
  const name = stockMovement.product_name || stockMovement.product.product_name
  return name
}

/**
 * Get display name for sales report
 * Prioritizes historical data to show what was actually sold
 */
export function getSalesReportDisplayName(salesReport: {
  product_name?: string
  product_unit?: string
  product: {
    product_name: string
    unit?: string
  }
}): string {
  const name = salesReport.product_name || salesReport.product.product_name
  return name
}

/**
 * Get display name for stock alert
 * Prioritizes historical data to show what was actually alerted
 */
export function getStockAlertDisplayName(stockAlert: {
  product_name?: string
  product_unit?: string
  product: {
    product_name: string
    unit?: string
  }
}): string {
  const name = stockAlert.product_name || stockAlert.product.product_name
  return name
}
