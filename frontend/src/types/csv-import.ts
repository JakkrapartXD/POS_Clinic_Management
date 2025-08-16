/**
 * Types for CSV import functionality
 */

export interface ImportSettings {
  skipDuplicates: boolean
  updateExisting: boolean
  createBackup: boolean
}

export interface ImportPreviewResult {
  totalRows: number
  validRows: any[]
  invalidRows: {
    row: number
    data: any
    errors: ValidationError[]
  }[]
  summary: {
    totalRows: number
    validRows: number
    invalidRows: number
    uniqueProducts: number
    warnings: string[]
  }
}

export interface ValidationError {
  row: number
  field: string
  value: any
  message: string
}

export interface ImportResult {
  success: boolean
  message: string
  imported: number
  failed: number
  skipped: number
  errors: string[]
  results: ProductImportResult[]
}

export interface ProductImportResult {
  product?: any
  status: string
  error?: string
  sku?: string
  product_name: string
}

export interface MappedProductData {
  product_name: string
  product_type?: string
  generic_name?: string
  short_name?: string
  status?: string
  vat_percent?: number
  expiration_warning_date?: number
  sale_price: number
  unit?: string
  pack_size?: string
  reorder_point?: number
  cost?: number
  sku?: string
  barcode?: string
  stock_quantity?: number
  volume?: number
  volume_unit?: string
  shelf_code?: string
  shelf_row?: string
  categoryId?: string  // Changed from 'category' to 'categoryId'
  symptom_category?: string
  license_number?: string
  dosage_unit?: string
  dosage?: string
  times_per_day?: number
  interval_hours?: number
  before_meal?: boolean
  after_meal?: boolean
  after_meal_immediate?: boolean
  morning?: string     // Changed from boolean to string per GraphQL schema
  noon?: string        // Changed from boolean to string per GraphQL schema
  evening?: string     // Changed from boolean to string per GraphQL schema
  before_bed?: string  // Changed from boolean to string per GraphQL schema
  properties?: string
  usage_instruction?: string
  sale_note?: string
  purchase_note?: string
}