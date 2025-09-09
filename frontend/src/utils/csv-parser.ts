/**
 * CSV Parser utility for product import
 * Handles CSV parsing and data validation for product import
 */

export interface CSVRow {
  [key: string]: string | number | boolean | null
}

export interface ValidationError {
  row: number
  field: string
  value: any
  message: string
}

export interface ImportPreviewResult {
  totalRows: number
  validRows: ProductImportData[]
  invalidRows: {
    row: number
    data: CSVRow
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

export interface ProductImportData {
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
  category?: string    // Temporary field for CSV import mapping
  categoryId?: string  // For GraphQL schema
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

// CSV field mapping (Thai headers to English field names)
const CSV_FIELD_MAPPING: Record<string, string> = {
  'ID': 'id',
  'ชื่อสินค้า': 'product_name',
  'ประเภทสินค้า': 'product_type',
  'ชื่อสามัญทางยา': 'generic_name',
  'ชื่อย่อ': 'short_name',
  'สถานะสินค้า': 'status',
  'ภาษีมูลค่าเพิ่ม': 'vat_percent',
  'วันแจ้งเตือน': 'expiration_warning_date',
  'ราคาขาย': 'sale_price',
  'หน่วยนับ': 'unit',
  'ขนาดบรรจุ': 'pack_size',
  'จุดสั่งซื้อ': 'reorder_point',
  'ต้นทุน': 'cost',
  'SKU': 'sku',
  'บาร์โค้ด': 'barcode',
  'คงเหลือ': 'stock_quantity',
  'ปริมาณ': 'volume',
  'หน่วยปริมาณ': 'volume_unit',
  'รหัสชั้นวาง': 'shelf_code',
  'แถว': 'shelf_row',
  'หมวดหมู่': 'category',
  'หมวดหมู่ยาแยกตามอาการที่รักษา': 'symptom_category',
  'ทะเบียนบัญชี': 'license_number',
  'หน่วยการทาน': 'dosage_unit',
  'การทาน': 'dosage',
  'จำนวนครั้งต่อวัน': 'times_per_day',
  'ทานยาทุก ๆ ชั่วโมง': 'interval_hours',
  'ก่อนอาหาร': 'before_meal',
  'หลังอาหาร': 'after_meal',
  'หลังอาหารทันที': 'after_meal_immediate',
  'เช้า': 'morning',
  'กลางวัน': 'noon',
  'เย็น': 'evening',
  'ก่อนนอน': 'before_bed',
  'สรรพคุณ': 'properties',
  'คำแนะนำการใช้': 'usage_instruction',
  'หมายเหตุการขาย': 'sale_note',
  'หมายเหตุการสั่งซื้อ': 'purchase_note'
}

export function parseCSV(csvContent: string): CSVRow[] {
  const lines = csvContent.split('\n').filter(line => line.trim())
  if (lines.length < 2) {
    throw new Error('ไฟล์ CSV ต้องมีอย่างน้อย 2 บรรทัด (header และข้อมูล)')
  }

  const headers = parseCSVLine(lines[0])
  const rows: CSVRow[] = []

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i])
    const row: CSVRow = {}
    
    headers.forEach((header, index) => {
      row[header] = values[index] || ''
    })
    
    rows.push(row)
  }

  return rows
}

function parseCSVLine(line: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    
    if (char === '"') {
      inQuotes = !inQuotes
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim())
      current = ''
    } else {
      current += char
    }
  }
  
  result.push(current.trim())
  return result
}

export function createImportPreview(csvData: CSVRow[], existingProducts: any[] = []): ImportPreviewResult {
  const validRows: ProductImportData[] = []
  const invalidRows: { row: number; data: CSVRow; errors: ValidationError[] }[] = []
  const warnings: string[] = []

  // Debug: Log existing products count
  console.log('createImportPreview called with:', {
    csvDataLength: csvData.length,
    existingProductsLength: existingProducts.length
  })

  // Transform all CSV rows to product data first
  const transformedProducts: { product: ProductImportData, row: number, originalRow: CSVRow }[] = []
  
  csvData.forEach((row, index) => {
    const rowNumber = index + 2 // +2 because index starts at 0 and we skip header
    const errors: ValidationError[] = []
    
    // Transform CSV row to product data
    const productData = transformCSVRowToProduct(row, rowNumber, errors)
    
    if (errors.length === 0) {
      transformedProducts.push({ product: productData, row: rowNumber, originalRow: row })
    } else {
      invalidRows.push({
        row: rowNumber,
        data: row,
        errors
      })
    }
  })

  // Group products by name for duplicate checking
  const productGroups = new Map<string, { product: ProductImportData, row: number, originalRow: CSVRow }[]>()
  
  transformedProducts.forEach(({ product, row, originalRow }) => {
    const productName = product.product_name.toLowerCase()
    if (!productGroups.has(productName)) {
      productGroups.set(productName, [])
    }
    productGroups.get(productName)!.push({ product, row, originalRow })
  })

  // Process each product group according to the new logic
  productGroups.forEach((products, productName) => {
    const errors: ValidationError[] = []
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`🔍 Processing product group: "${productName}" with ${products.length} variants`)
    }
    
    // Flow 1: Check if product name exists in database
    const existingProduct = existingProducts.find(existing => 
      existing.product_name.toLowerCase() === productName
    )

    if (process.env.NODE_ENV === 'development') {
      if (existingProduct) {
        console.log(`⚠️ Product "${productName}" exists in database`)
      } else {
        console.log(`✅ Product "${productName}" is new`)
      }
    }

    // Group products by unit for all cases
    const unitGroups = new Map<string, { product: ProductImportData, row: number, originalRow: CSVRow }[]>()
    
    products.forEach(({ product, row, originalRow }) => {
      const unit = (product.unit || '').toLowerCase()
      if (!unitGroups.has(unit)) {
        unitGroups.set(unit, [])
      }
      unitGroups.get(unit)!.push({ product, row, originalRow })
    })

    if (existingProduct) {
      // Product exists in database - check unit duplicates with existing database
      unitGroups.forEach((unitProducts, unit) => {
        if (process.env.NODE_ENV === 'development') {
          console.log(`  📦 Unit "${unit}": ${unitProducts.length} products`)
        }
        const existingWithSameUnit = existingProduct.unit?.toLowerCase() === unit
        if (existingWithSameUnit) {
          if (process.env.NODE_ENV === 'development') {
            console.log(`    ❌ Unit "${unit}" conflicts with existing database product`)
          }
          unitProducts.forEach(({ product, row, originalRow }) => {
            errors.push({
              row: row,
              field: 'unit',
              value: product.unit,
              message: `สินค้า "${product.product_name}" หน่วย "${unit}" ซ้ำกับที่มีอยู่แล้วในฐานข้อมูล`
            })
          })
        } else {
          if (process.env.NODE_ENV === 'development') {
            console.log(`    ✅ Unit "${unit}" is allowed`)
          }
        }
      })
    }

    // Check pack_size requirements for the entire product group (across all units)
    if (process.env.NODE_ENV === 'development') {
      console.log(`  📦 Checking pack_size requirements for all units of "${productName}"`)
    }
    
    // Collect all pack sizes from all units
    const allPackSizes = new Map<string, { product: ProductImportData, row: number, originalRow: CSVRow }[]>()
    
    products.forEach(({ product, row, originalRow }) => {
      const packSize = product.pack_size || "1"
      if (process.env.NODE_ENV === 'development') {
        console.log(`    Row ${row}: unit="${product.unit}", pack_size="${packSize}" (original: "${originalRow['ขนาดบรรจุ']}")`)
      }
      if (!allPackSizes.has(packSize)) {
        allPackSizes.set(packSize, [])
      }
      allPackSizes.get(packSize)!.push({ product, row, originalRow })
    })

    if (process.env.NODE_ENV === 'development') {
      console.log(`    📏 All pack sizes: ${Array.from(allPackSizes.keys()).join(', ')}`)
    }
    
    // Check if at least one has pack_size = 1 across all units
    const hasPackSizeOne = allPackSizes.has("1")
    
    if (!hasPackSizeOne) {
      if (process.env.NODE_ENV === 'development') {
        console.log(`    ❌ No pack_size = 1 found for any unit of "${productName}"`)
      }
      products.forEach(({ product, row, originalRow }) => {
        errors.push({
          row: row,
          field: 'pack_size',
          value: product.pack_size,
          message: `สินค้า "${product.product_name}" ต้องมีขนาดบรรจุ 1 อย่างน้อย 1 รายการเป็นค่าเริ่มต้น (รวมทุกหน่วยนับ)`
        })
      })
    } else {
      if (process.env.NODE_ENV === 'development') {
        console.log(`    ✅ Pack_size = 1 found for "${productName}"`)
      }
    }

    // Add products to valid or invalid rows based on errors
    products.forEach(({ product, row, originalRow }) => {
      const productErrors = errors.filter(error => error.row === row)
      
      if (productErrors.length === 0) {
        if (process.env.NODE_ENV === 'development') {
          console.log(`    ✅ Row ${row}: "${product.product_name}" (${product.unit}) - VALID`)
        }
        validRows.push(product)
      } else {
        if (process.env.NODE_ENV === 'development') {
          console.log(`    ❌ Row ${row}: "${product.product_name}" (${product.unit}) - INVALID`)
          console.log(`       Errors:`, productErrors.map(e => e.message))
        }
        invalidRows.push({
          row: row,
          data: originalRow,
          errors: productErrors
        })
      }
    })
  })

  // Count unique products by name (regardless of unit)
  const uniqueProductNames = new Set(validRows.map(product => product.product_name.toLowerCase()))
  const uniqueProductCount = uniqueProductNames.size

  if (process.env.NODE_ENV === 'development') {
    console.log(`📊 Import Summary:`)
    console.log(`  Total rows: ${csvData.length}`)
    console.log(`  Valid rows: ${validRows.length}`)
    console.log(`  Invalid rows: ${invalidRows.length}`)
    console.log(`  Unique products: ${uniqueProductCount}`)
    console.log(`  Warnings: ${warnings.length}`)
  }

  return {
    totalRows: csvData.length,
    validRows,
    invalidRows,
    summary: {
      totalRows: csvData.length,
      validRows: validRows.length,
      invalidRows: invalidRows.length,
      uniqueProducts: uniqueProductCount,
      warnings
    }
  }
}

function transformCSVRowToProduct(row: CSVRow, rowNumber: number, errors: ValidationError[]): ProductImportData {
  const product: ProductImportData = {
    product_name: '',
    sale_price: 0
  }

  // Required fields validation
  const productName = getFieldValue(row, 'ชื่อสินค้า')
  if (!productName) {
    errors.push({
      row: rowNumber,
      field: 'product_name',
      value: productName,
      message: 'ชื่อสินค้าเป็นข้อมูลที่จำเป็น'
    })
  } else {
    product.product_name = productName
  }

  const salePrice = parseFloat(getFieldValue(row, 'ราคาขาย') || '0')
  if (!salePrice || salePrice <= 0) {
    errors.push({
      row: rowNumber,
      field: 'sale_price',
      value: salePrice,
      message: 'ราคาขายต้องมีค่ามากกว่า 0'
    })
  } else {
    product.sale_price = salePrice
  }

  // Optional fields
  product.product_type = getFieldValue(row, 'ประเภทสินค้า') || undefined
  product.generic_name = getFieldValue(row, 'ชื่อสามัญทางยา') || undefined
  product.short_name = getFieldValue(row, 'ชื่อย่อ') || undefined
  // Handle status mapping - convert Thai status to English
  const statusValue = getFieldValue(row, 'สถานะสินค้า')
  if (statusValue) {
    const statusMapping: Record<string, string> = {
      'แสดงหน้าร้าน': 'active',
      'ไม่แสดงหน้าร้าน': 'inactive',
      'active': 'active',
      'inactive': 'inactive'
    }
    const originalStatus = statusValue
    const mappedStatus = statusMapping[statusValue] || statusValue
    product.status = mappedStatus
    
    // Debug logging for status mapping
    console.log(`🔍 CSV Status mapping: "${originalStatus}" -> "${mappedStatus}"`)
  } else {
    product.status = 'active' // Default to active if no status provided
  }
  
  // Numeric fields with proper validation
  const vatPercent = parseFloat(getFieldValue(row, 'ภาษีมูลค่าเพิ่ม') || '0')
  if (vatPercent && !isNaN(vatPercent)) product.vat_percent = vatPercent
  
  const cost = parseFloat(getFieldValue(row, 'ต้นทุน') || '0')
  if (cost && !isNaN(cost)) product.cost = cost
  
  const reorderPoint = parseInt(getFieldValue(row, 'จุดสั่งซื้อ') || '0')
  if (reorderPoint && !isNaN(reorderPoint)) product.reorder_point = reorderPoint
  
  const stockQuantity = parseInt(getFieldValue(row, 'คงเหลือ') || '0')
  if (!isNaN(stockQuantity)) product.stock_quantity = stockQuantity || 0
  
  const volume = parseFloat(getFieldValue(row, 'ปริมาณ') || '0')
  if (volume && !isNaN(volume)) product.volume = volume
  
  const timesPerDay = parseInt(getFieldValue(row, 'จำนวนครั้งต่อวัน') || '0')
  if (timesPerDay && !isNaN(timesPerDay)) product.times_per_day = timesPerDay
  
  const intervalHours = parseInt(getFieldValue(row, 'ทานยาทุก ๆ ชั่วโมง') || '0')
  if (intervalHours && !isNaN(intervalHours)) product.interval_hours = intervalHours

  // String fields
  product.unit = getFieldValue(row, 'หน่วยนับ') || undefined
  const packSizeValue = getFieldValue(row, 'ขนาดบรรจุ')
  product.pack_size = packSizeValue || "1" // Default pack size is 1
  product.sku = getFieldValue(row, 'SKU') || undefined
  
  // Clean barcode (remove quotes and equals sign)
  const barcode = getFieldValue(row, 'บาร์โค้ด')
  if (barcode) {
    product.barcode = barcode.replace(/^="([^"]*)"$/, '$1').replace(/"/g, '')
  }
  
  product.volume_unit = getFieldValue(row, 'หน่วยปริมาณ') || undefined
  product.shelf_code = getFieldValue(row, 'รหัสชั้นวาง') || undefined
  product.shelf_row = getFieldValue(row, 'แถว') || undefined
  
  // Store category name temporarily for mapping to categoryId later
  product.category = getFieldValue(row, 'หมวดหมู่') || undefined
  product.symptom_category = getFieldValue(row, 'หมวดหมู่ยาแยกตามอาการที่รักษา') || undefined
  product.license_number = getFieldValue(row, 'ทะเบียนบัญชี') || undefined
  product.dosage_unit = getFieldValue(row, 'หน่วยการทาน') || undefined
  product.dosage = getFieldValue(row, 'การทาน') || undefined
  product.properties = getFieldValue(row, 'สรรพคุณ') || undefined
  product.usage_instruction = getFieldValue(row, 'คำแนะนำการใช้') || undefined
  product.sale_note = getFieldValue(row, 'หมายเหตุการขาย') || undefined
  product.purchase_note = getFieldValue(row, 'หมายเหตุการสั่งซื้อ') || undefined

  // Boolean fields for meal timing
  const beforeMeal = parseBooleanField(getFieldValue(row, 'ก่อนอาหาร'))
  const afterMeal = parseBooleanField(getFieldValue(row, 'หลังอาหาร'))
  const afterMealImmediate = parseBooleanField(getFieldValue(row, 'หลังอาหารทันที'))
  
  if (beforeMeal !== undefined) product.before_meal = beforeMeal
  if (afterMeal !== undefined) product.after_meal = afterMeal
  if (afterMealImmediate !== undefined) product.after_meal_immediate = afterMealImmediate

  // String fields for time periods (per GraphQL schema)
  product.morning = getFieldValue(row, 'เช้า') || undefined
  product.noon = getFieldValue(row, 'กลางวัน') || undefined
  product.evening = getFieldValue(row, 'เย็น') || undefined
  product.before_bed = getFieldValue(row, 'ก่อนนอน') || undefined

  return product
}

function getFieldValue(row: CSVRow, thaiFieldName: string): string {
  const value = row[thaiFieldName]
  if (value === null || value === undefined) return ''
  return String(value).trim()
}

function parseBooleanField(value: string): boolean | undefined {
  if (!value) return undefined
  const lowerValue = value.toLowerCase()
  if (lowerValue === 'true' || lowerValue === '1' || lowerValue === 'yes' || lowerValue === 'ใช่') {
    return true
  }
  if (lowerValue === 'false' || lowerValue === '0' || lowerValue === 'no' || lowerValue === 'ไม่') {
    return false
  }
  return undefined
}

export async function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      if (e.target?.result) {
        resolve(e.target.result as string)
      } else {
        reject(new Error('ไม่สามารถอ่านไฟล์ได้'))
      }
    }
    reader.onerror = () => reject(new Error('เกิดข้อผิดพลาดในการอ่านไฟล์'))
    reader.readAsText(file, 'UTF-8')
  })
}

export function downloadCSVTemplate() {
  // Download the sample CSV file from public folder
  const link = document.createElement('a')
  link.setAttribute('href', '/sample_item_data.csv')
  link.setAttribute('download', 'product_import_template.csv')
  link.style.visibility = 'hidden'
  
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}