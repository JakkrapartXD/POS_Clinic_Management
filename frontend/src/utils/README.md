# Product Display Utilities

This directory contains utility functions for displaying product information consistently across the application.

## Files

### `product-display.ts`

Contains utility functions for displaying product names with units in various contexts.

#### Functions

- `getProductDisplayName(product)` - Get display name for a product with unit
- `getOrderItemDisplayName(orderItem)` - Get display name for order item (prioritizes historical data)
- `getPurchaseItemDisplayName(purchaseItem)` - Get display name for purchase item
- `getPrescriptionDisplayName(prescription)` - Get display name for prescription item
- `getStockDisplayName(stock)` - Get display name for stock record
- `getSalesReportDisplayName(salesReport)` - Get display name for sales report
- `getStockAlertDisplayName(stockAlert)` - Get display name for stock alert

#### Usage

```typescript
import { getOrderItemDisplayName } from '@/utils/product-display'

// Display order item with historical data
const displayName = getOrderItemDisplayName(orderItem)
// Returns: "Paracetamol(เม็ด)" or "Paracetamol" if no unit
```

#### Features

- **Historical Data Priority**: Uses stored product name and unit from the time of transaction
- **Fallback Support**: Falls back to current product data if historical data is not available
- **Consistent Format**: Always returns "ProductName(Unit)" format when unit is available
- **Type Safety**: Full TypeScript support with proper interfaces

## Components

### `ProductList` Component

A reusable component for displaying lists of products with consistent styling.

#### Usage

```typescript
import ProductList from '@/components/ui/product-list'
import { getOrderItemDisplayName } from '@/utils/product-display'

<ProductList
  items={orderItems}
  title="รายการสินค้า"
  showTotal={true}
  getDisplayName={getOrderItemDisplayName}
/>
```

#### Props

- `items`: Array of product items
- `title`: Optional title for the list
- `showTotal`: Whether to show total amount
- `getDisplayName`: Function to get display name for each item

## Database Schema Changes

The backend has been updated to store historical product information:

- `OrderItem.product_name` - Stored product name at time of sale
- `OrderItem.product_unit` - Stored product unit at time of sale
- Similar fields added to `PurchaseItem`, `Prescription`, `Stock`, `SalesReport`, `StockAlert`

This ensures that even if a product is deleted or modified, the historical transaction data remains intact and displayable.

## Benefits

1. **Data Integrity**: Historical transactions remain readable even after product changes
2. **User Experience**: Consistent product name display across the application
3. **Audit Trail**: Clear record of what was actually sold/purchased
4. **Foreign Key Safety**: Products with transactions cannot be accidentally deleted
