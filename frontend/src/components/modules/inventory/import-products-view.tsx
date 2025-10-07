"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { Upload, FileText, Download, CheckCircle, AlertTriangle, Info, RefreshCw } from "lucide-react"
import { parseCSV, createImportPreview, readFileAsText, downloadCSVTemplate, ImportPreviewResult } from "@/utils/csv-parser"
import { GraphQLAPI } from "@/clients/graphql"
import { logger } from "@/lib/logger"

interface ImportProductsViewProps {
  onBack: () => void
  onImport: (data: any) => void
}

export default function ImportProductsView({ onBack, onImport }: ImportProductsViewProps) {
  const [dragActive, setDragActive] = useState(false)
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [isLoadingProducts, setIsLoadingProducts] = useState(false)
  const [previewResult, setPreviewResult] = useState<ImportPreviewResult | null>(null)
  const [importResult, setImportResult] = useState<any>(null)
  const [notes, setNotes] = useState("")
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [existingProducts, setExistingProducts] = useState<any[]>([])
  const [existingCategories, setExistingCategories] = useState<any[]>([])

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0])
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0])
    }
  }

  const handleFileSelect = async (file: File) => {
    setUploadedFile(file)
    setPreviewResult(null)
    setImportResult(null)
    
    // Load existing products first, then process file
    const loadedData = await loadExistingProducts()
    await processFile(file, loadedData)
  }

  const loadExistingProducts = async () => {
    setIsLoadingProducts(true)
    try {
      logger.info('Loading existing products and categories for import validation', {}, 'IMPORT')
      
      // Load products and categories in parallel
      const [productsResult, categoriesResult] = await Promise.all([
        GraphQLAPI.getAllProductsForDuplicateCheck(),
        GraphQLAPI.getAllCategories()
      ])
      
      const products = productsResult.products.products || []
      const categories = categoriesResult.categories || []
      
      setExistingProducts(products)
      setExistingCategories(categories)
      
      // Debug: Log first few products
      console.log('Loaded existing products sample:', products.slice(0, 5).map(p => ({
        id: p.id,
        product_name: p.product_name
      })))
      
      logger.info('Loaded existing data', { 
        productsCount: products.length,
        categoriesCount: categories.length
      }, 'IMPORT')

      // Return the loaded data for immediate use
      return { products, categories }
    } catch (error) {
      logger.error('Failed to load existing data', error, 'IMPORT')
      // Continue without existing data check if loading fails
      setExistingProducts([])
      setExistingCategories([])
      alert('ไม่สามารถโหลดข้อมูลที่มีอยู่แล้วได้ การตรวจสอบข้อมูลซ้ำจะไม่ทำงาน')
      return { products: [], categories: [] }
    } finally {
      setIsLoadingProducts(false)
    }
  }

  const processFile = async (file: File, loadedData?: { products: any[], categories: any[] }) => {
    setIsProcessing(true)
    try {
      logger.info('Processing CSV file', { fileName: file.name, size: file.size }, 'IMPORT')
      
      // Use loaded data directly instead of state (to avoid timing issues)
      const productsToCheck = loadedData?.products || existingProducts
      
      // Debug: Check existing products before processing
      console.log('Processing file with existing products:', {
        existingProductsCount: productsToCheck.length,
        existingProductsSample: productsToCheck.slice(0, 3).map(p => ({
          id: p.id,
          product_name: p.product_name,
          unit: p.unit,
          sku: p.sku
        }))
      })
      
      // Log all existing products for duplicate checking
      console.log('🔍 All existing products in database:')
      productsToCheck.forEach((product, index) => {
        console.log(`  ${index + 1}. ${product.product_name} (${product.unit}) - SKU: ${product.sku}`)
      })
      
      const content = await readFileAsText(file)
      const csvData = parseCSV(content)
      const preview = createImportPreview(csvData, productsToCheck)
      
      setPreviewResult(preview)
      logger.info('CSV preview generated', { 
        totalRows: preview.summary.totalRows,
        validRows: preview.summary.validRows,
        invalidRows: preview.summary.invalidRows
      }, 'IMPORT')
      
    } catch (error) {
      logger.error('Failed to process CSV file', error, 'IMPORT')
      alert('เกิดข้อผิดพลาดในการประมวลผลไฟล์: ' + (error instanceof Error ? error.message : 'Unknown error'))
    } finally {
      setIsProcessing(false)
    }
  }

  const handleImportClick = () => {
    if (!previewResult || previewResult.validRows.length === 0) {
      alert('ไม่มีข้อมูลที่ถูกต้องสำหรับการนำเข้า')
      return
    }
    setShowConfirmDialog(true)
  }

  const mapCategoryNameToId = (categoryName: string): string | undefined => {
    if (!categoryName) return undefined
    
    const category = existingCategories.find(cat => 
      cat.name.toLowerCase() === categoryName.toLowerCase() ||
      cat.code?.toLowerCase() === categoryName.toLowerCase()
    )
    
    return category ? category.id : undefined
  }

  const transformProductsForGraphQL = (products: any[]) => {
    // Preprocess to avoid unique barcode conflicts: if multiple rows share the same barcode,
    // keep barcode only for the base pack (pack_size === '1'), clear for others
    const barcodeCounts = products.reduce<Record<string, number>>((acc, p) => {
      const bc = (p.barcode || '').trim()
      if (!bc) return acc
      acc[bc] = (acc[bc] || 0) + 1
      return acc
    }, {})

    return products.map(product => {
      // Map category name to categoryId
      const categoryName = product.category
      const categoryId = categoryName ? mapCategoryNameToId(categoryName) : undefined
      
      // Create clean product object that matches GraphQL schema
      const transformedProduct: any = {
        product_name: product.product_name,
        sale_price: product.sale_price,
        stock_quantity: product.stock_quantity || 0
      }

      // Add optional fields only if they have valid values
      if (product.product_type) transformedProduct.product_type = product.product_type
      if (product.generic_name) transformedProduct.generic_name = product.generic_name
      if (product.short_name) transformedProduct.short_name = product.short_name
      
      // Handle status mapping - convert Thai status to English
      if (product.status) {
        const statusMapping: Record<string, string> = {
          'แสดงหน้าร้าน': 'active',
          'ไม่แสดงหน้าร้าน': 'inactive',
          'active': 'active',
          'inactive': 'inactive'
        }
        const originalStatus = product.status
        const mappedStatus = statusMapping[product.status] || product.status
        transformedProduct.status = mappedStatus
        
        // Debug logging for status mapping
        console.log(`🔍 Status mapping: "${originalStatus}" -> "${mappedStatus}"`)
      }
      if (product.vat_percent !== undefined && !isNaN(product.vat_percent)) transformedProduct.vat_percent = product.vat_percent
      if (product.expiration_warning_date !== undefined && !isNaN(product.expiration_warning_date)) transformedProduct.expiration_warning_date = product.expiration_warning_date
      if (product.unit) transformedProduct.unit = product.unit
      if (product.pack_size) transformedProduct.pack_size = product.pack_size
      if (product.reorder_point !== undefined && !isNaN(product.reorder_point)) transformedProduct.reorder_point = product.reorder_point
      if (product.cost !== undefined && !isNaN(product.cost)) transformedProduct.cost = product.cost
      if (product.sku) transformedProduct.sku = product.sku
      // Handle duplicate barcodes: only keep barcode for base pack (pack_size === '1')
      const hasDuplicateBarcode = !!product.barcode && barcodeCounts[(product.barcode || '').trim()] > 1
      const isBasePack = String(product.pack_size || '1') === '1'
      if (product.barcode && (!hasDuplicateBarcode || (hasDuplicateBarcode && isBasePack))) {
        transformedProduct.barcode = product.barcode
      }
      if (product.volume !== undefined && !isNaN(product.volume)) transformedProduct.volume = product.volume
      if (product.volume_unit) transformedProduct.volume_unit = product.volume_unit
      if (product.shelf_code) transformedProduct.shelf_code = product.shelf_code
      if (product.shelf_row) transformedProduct.shelf_row = product.shelf_row
      if (categoryId) transformedProduct.categoryId = categoryId
      if (product.symptom_category) transformedProduct.symptom_category = product.symptom_category
      if (product.license_number) transformedProduct.license_number = product.license_number
      if (product.dosage_unit) transformedProduct.dosage_unit = product.dosage_unit
      if (product.dosage) transformedProduct.dosage = product.dosage
      if (product.times_per_day !== undefined && !isNaN(product.times_per_day)) transformedProduct.times_per_day = product.times_per_day
      if (product.interval_hours !== undefined && !isNaN(product.interval_hours)) transformedProduct.interval_hours = product.interval_hours
      if (product.before_meal !== undefined) transformedProduct.before_meal = product.before_meal
      if (product.after_meal !== undefined) transformedProduct.after_meal = product.after_meal
      if (product.after_meal_immediate !== undefined) transformedProduct.after_meal_immediate = product.after_meal_immediate
      if (product.morning) transformedProduct.morning = product.morning
      if (product.noon) transformedProduct.noon = product.noon
      if (product.evening) transformedProduct.evening = product.evening
      if (product.before_bed) transformedProduct.before_bed = product.before_bed
      if (product.properties) transformedProduct.properties = product.properties
      if (product.usage_instruction) transformedProduct.usage_instruction = product.usage_instruction
      if (product.sale_note) transformedProduct.sale_note = product.sale_note
      if (product.purchase_note) transformedProduct.purchase_note = product.purchase_note

      return transformedProduct
    })
  }

  const handleConfirmImport = async () => {
    if (!previewResult || previewResult.validRows.length === 0) {
      return
    }

    setShowConfirmDialog(false)
    setIsImporting(true)
    try {
      logger.info('Starting bulk import', { 
        validRows: previewResult.validRows.length
      }, 'IMPORT')
      
      // Transform products to match GraphQL schema
      const transformedProducts = transformProductsForGraphQL(previewResult.validRows)
      
      // Debug: Log what we're sending to backend
      console.log('🔍 Sending to backend:', {
        productsCount: transformedProducts.length,
        products: transformedProducts.map(p => ({
          product_name: p.product_name,
          unit: p.unit,
          pack_size: p.pack_size,
          sku: p.sku
        }))
      })
      
      // Log each product in detail
      console.log('🔍 Products being sent:')
      transformedProducts.forEach((product, index) => {
        console.log(`  ${index + 1}. ${product.product_name}`)
        console.log(`     Unit: ${product.unit}`)
        console.log(`     Pack Size: ${product.pack_size}`)
        console.log(`     SKU: ${product.sku}`)
        console.log(`     Price: ${product.sale_price}`)
        console.log('')
      })
      
      // Check for potential duplicates with new products
      console.log('🔍 Checking for potential duplicates:')
      transformedProducts.forEach((newProduct: any) => {
        const duplicates = existingProducts.filter(existing => 
          existing.product_name.toLowerCase() === newProduct.product_name.toLowerCase() &&
          existing.unit === newProduct.unit
        )
        if (duplicates.length > 0) {
          console.log(`  ⚠️ Potential duplicate: ${newProduct.product_name} (${newProduct.unit})`)
          duplicates.forEach(dup => {
            console.log(`    - Existing: ${dup.product_name} (${dup.unit}) - SKU: ${dup.sku}`)
          })
        }
      })
      
      console.log('🔍 Calling backend bulk import...')
      const result = await GraphQLAPI.bulkImportProducts(transformedProducts)
      console.log('🔍 Backend call completed')
      
      setImportResult(result.bulkImportProducts)
      
      // Debug: Log backend response
      console.log('🔍 Backend response:', {
        success: result.bulkImportProducts.success,
        message: result.bulkImportProducts.message,
        imported: result.bulkImportProducts.imported,
        failed: result.bulkImportProducts.failed,
        skipped: result.bulkImportProducts.skipped,
        errors: result.bulkImportProducts.errors,
        results: result.bulkImportProducts.results?.map((r: any) => ({
          product_name: r.product_name,
          sku: r.sku,
          status: r.status,
          error: r.error
        }))
      })
      
      // Log the full response for debugging
      console.log('🔍 Full backend response:', JSON.stringify(result.bulkImportProducts, null, 2))
      
      // Check which products failed and why
      if (result.bulkImportProducts.results) {
        console.log('🔍 Detailed results:')
        result.bulkImportProducts.results.forEach((r: any, index: number) => {
          console.log(`  ${index + 1}. ${r.product_name} (${r.sku}) - ${r.status}${r.error ? ` - Error: ${r.error}` : ''}`)
        })
        
        // Analyze results
        const imported = result.bulkImportProducts.results.filter((r: any) => r.status === 'CREATED' || r.status === 'UPDATED')
        const failed = result.bulkImportProducts.results.filter((r: any) => r.status === 'FAILED')
        const skipped = result.bulkImportProducts.results.filter((r: any) => r.status === 'SKIPPED')
        
        console.log('🔍 Analysis:')
        console.log(`  Imported: ${imported.length} products`)
        console.log(`  Failed: ${failed.length} products`)
        console.log(`  Skipped: ${skipped.length} products`)
        
        if (failed.length > 0) {
          console.log('🔍 Failed products:')
          failed.forEach((r: any) => {
            console.log(`  - ${r.product_name} (${r.sku}): ${r.error}`)
          })
        }
        
        if (skipped.length > 0) {
          console.log('🔍 Skipped products:')
          skipped.forEach((r: any) => {
            console.log(`  - ${r.product_name} (${r.sku}): ${r.error || 'No error message'}`)
          })
        }
      }
      
      logger.info('Bulk import completed', result.bulkImportProducts, 'IMPORT')
      
      // Call parent onImport with result
      onImport({
        file: uploadedFile,
        result: result.bulkImportProducts
      })
      
    } catch (error) {
      logger.error('Bulk import failed', error, 'IMPORT')
      alert('เกิดข้อผิดพลาดในการนำเข้าข้อมูล: ' + (error instanceof Error ? error.message : 'Unknown error'))
    } finally {
      setIsImporting(false)
    }
  }

  const handleDownloadTemplate = () => {
    downloadCSVTemplate()
    logger.info('CSV template downloaded', {}, 'IMPORT')
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-gray-800 mb-2">เพิ่มชุดสินค้า/นำเข้า/แก้ไข</h2>
        <p className="text-gray-600">นำเข้าข้อมูลสินค้าจากไฟล์ Excel หรือ CSV</p>
      </div>

      <div className="space-y-6">
        {/* File Upload Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Upload className="h-5 w-5 mr-2" />
              อัปโหลดไฟล์
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div
              className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                dragActive 
                  ? 'border-purple-400 bg-purple-50' 
                  : 'border-gray-300 hover:border-gray-400'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              {uploadedFile ? (
                <div className="space-y-3">
                  <CheckCircle className="h-10 w-10 text-green-500 mx-auto" />
                  <p className="text-sm font-medium text-gray-700">{uploadedFile.name}</p>
                  <p className="text-xs text-gray-500">
                    {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setUploadedFile(null)}
                    className="text-xs"
                  >
                    เปลี่ยนไฟล์
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  <FileText className="h-10 w-10 text-gray-400 mx-auto" />
                  <div>
                    <p className="text-sm text-gray-600 mb-2">
                      ลากไฟล์มาวางที่นี่ หรือ
                    </p>
                    <label className="cursor-pointer">
                      <span className="text-teal-600 hover:text-teal-700 font-medium text-sm">
                        เลือกไฟล์
                      </span>
                      <input
                        type="file"
                        className="hidden"
                        accept=".xlsx,.xls,.csv"
                        onChange={handleFileChange}
                      />
                    </label>
                  </div>
                  <p className="text-xs text-gray-500">
                    รองรับไฟล์ Excel (.xlsx, .xls) และ CSV
                  </p>
                </div>
              )}
            </div>

            {/* Download Template */}
            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-700">ไม่มีแม่แบบ?</p>
                  <p className="text-xs text-gray-500">ดาวน์โหลดไฟล์ตัวอย่างสำหรับการนำเข้า</p>
                </div>
                <Button variant="outline" size="sm" onClick={handleDownloadTemplate} className="text-xs">
                  <Download className="h-3 w-3 mr-1" />
                  ดาวน์โหลดแม่แบบ
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

      {/* Processing Status */}
      {(isLoadingProducts || isProcessing) && (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-center space-x-3">
              <RefreshCw className="h-5 w-5 animate-spin text-teal-500" />
              <span className="text-gray-600">
                {isLoadingProducts ? 'กำลังโหลดข้อมูลสินค้าจากฐานข้อมูลเพื่อตรวจสอบข้อมูลซ้ำ...' : 'กำลังประมวลผลไฟล์...'}
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Preview Section */}
      {previewResult && !isProcessing && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <span>ตัวอย่างข้อมูล</span>
            </CardTitle>
            <div className="flex space-x-4 text-sm text-gray-600">
              <span>สินค้า: {previewResult.summary.uniqueProducts} ชนิด</span>
              <span>รายการถูกต้อง: {previewResult.summary.validRows}</span>
              <span>ผิดพลาด: {previewResult.summary.invalidRows}</span>
              <span>รวม: {previewResult.summary.totalRows}</span>
            </div>
          </CardHeader>
          <CardContent>
            {/* Summary Cards */}
            <div className="grid grid-cols-4 gap-3 mb-4">
              <div className="bg-blue-50 p-4 rounded-lg text-center border border-blue-100">
                <div className="text-2xl font-bold text-blue-600">{previewResult.summary.uniqueProducts}</div>
                <div className="text-sm text-blue-700 font-medium">สินค้าที่ไม่ซ้ำ</div>
              </div>
              <div className="bg-green-50 p-4 rounded-lg text-center border border-green-100">
                <div className="text-2xl font-bold text-green-600">{previewResult.summary.validRows}</div>
                <div className="text-sm text-green-700 font-medium">รายการถูกต้อง</div>
              </div>
              <div className="bg-red-50 p-4 rounded-lg text-center border border-red-100">
                <div className="text-2xl font-bold text-red-600">{previewResult.summary.invalidRows}</div>
                <div className="text-sm text-red-700 font-medium">รายการผิดพลาด</div>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg text-center border border-gray-100">
                <div className="text-2xl font-bold text-gray-600">{previewResult.summary.totalRows}</div>
                <div className="text-sm text-gray-700 font-medium">รายการทั้งหมด</div>
              </div>
            </div>

            {/* Debug Info */}
            <div className="mb-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
              <div className="text-sm text-orange-700">
                <div className="font-medium mb-2">Debug Info:</div>
                <div className="space-y-1">
                  <div>• สินค้าในฐานข้อมูล: {existingProducts.length} รายการ</div>
                  <div>• หมวดหมู่ในฐานข้อมูล: {existingCategories.length} รายการ</div>
                  {existingProducts.length > 0 && (
                    <div>• ตัวอย่างสินค้า: {existingProducts.slice(0, 3).map(p => p.product_name).join(', ')}</div>
                  )}
                </div>
              </div>
            </div>

            {/* Warnings */}
            {previewResult.summary.warnings && previewResult.summary.warnings.length > 0 && (
              <div className="mb-4">
                <Alert className="border-yellow-200 bg-yellow-50">
                  <AlertTriangle className="h-4 w-4 text-yellow-600" />
                  <AlertDescription className="text-yellow-700">
                    <div className="font-medium mb-2">คำเตือน:</div>
                    <div className="space-y-1 text-sm max-h-32 overflow-y-auto">
                      {previewResult.summary.warnings.map((warning, index) => (
                        <div key={index}>• {warning}</div>
                      ))}
                    </div>
                  </AlertDescription>
                </Alert>
              </div>
            )}

            {/* Valid Rows Preview */}
            {previewResult.validRows.length > 0 && (
              <div className="mb-4">
                <h4 className="font-medium text-gray-700 mb-2">ตัวอย่างรายการที่ถูกต้อง</h4>
                <div className="bg-gray-50 p-4 rounded-lg overflow-x-auto">
                  <table className="min-w-full text-xs">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2">ชื่อสินค้า</th>
                        <th className="text-left p-2">ราคาขาย</th>
                        <th className="text-left p-2">หน่วย</th>
                        <th className="text-left p-2">สต็อก</th>
                        <th className="text-left p-2">SKU</th>
                      </tr>
                    </thead>
                    <tbody>
                      {previewResult.validRows.slice(0, 5).map((row, index) => (
                        <tr key={index} className="border-b">
                          <td className="p-2">{row.product_name}</td>
                          <td className="p-2">฿{row.sale_price}</td>
                          <td className="p-2">{row.unit || '-'}</td>
                          <td className="p-2">{row.stock_quantity || 0}</td>
                          <td className="p-2">{row.sku || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {previewResult.validRows.length > 5 && (
                    <div className="text-center text-gray-500 text-xs mt-2">
                      และอีก {previewResult.validRows.length - 5} รายการ
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Invalid Rows */}
            {previewResult.invalidRows.length > 0 && (
              <div>
                <h4 className="font-medium text-red-700 mb-2">รายการที่มีข้อผิดพลาด</h4>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {previewResult.invalidRows.slice(0, 10).map((row, index) => (
                    <Alert key={index} className="border-red-200 bg-red-50">
                      <AlertTriangle className="h-4 w-4 text-red-600" />
                      <AlertDescription className="text-red-700">
                        <div className="font-medium">แถวที่ {row.row}: {row.data['ชื่อสินค้า'] || 'ไม่ระบุชื่อ'}</div>
                        <div className="text-sm">
                          {row.errors.map((error, errorIndex) => (
                            <div key={errorIndex}>• {error.message}</div>
                          ))}
                        </div>
                      </AlertDescription>
                    </Alert>
                  ))}
                  {previewResult.invalidRows.length > 10 && (
                    <div className="text-center text-gray-500 text-xs">
                      และอีก {previewResult.invalidRows.length - 10} รายการที่มีข้อผิดพลาด
                    </div>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Import Result */}
      {importResult && (
        <Card>
          <CardHeader>
            <CardTitle className={`flex items-center ${importResult.success ? 'text-green-600' : 'text-orange-600'}`}>
              {importResult.success ? <CheckCircle className="h-5 w-5 mr-2" /> : <AlertTriangle className="h-5 w-5 mr-2" />}
              ผลลัพธ์การนำเข้า
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Alert className={importResult.success ? 'border-green-200 bg-green-50' : 'border-orange-200 bg-orange-50'}>
                <Info className="h-4 w-4" />
                <AlertDescription className={importResult.success ? 'text-green-700' : 'text-orange-700'}>
                  {importResult.message}
                </AlertDescription>
              </Alert>

              <div className="grid grid-cols-3 gap-4">
                <div className="bg-green-50 p-3 rounded-lg text-center">
                  <div className="text-2xl font-bold text-green-600">{importResult.imported}</div>
                  <div className="text-sm text-green-700">นำเข้าสำเร็จ</div>
                </div>
                <div className="bg-red-50 p-3 rounded-lg text-center">
                  <div className="text-2xl font-bold text-red-600">{importResult.failed}</div>
                  <div className="text-sm text-red-700">นำเข้าไม่สำเร็จ</div>
                </div>
                <div className="bg-yellow-50 p-3 rounded-lg text-center">
                  <div className="text-2xl font-bold text-yellow-600">{importResult.skipped}</div>
                  <div className="text-sm text-yellow-700">ข้ามไป</div>
                </div>
              </div>

              {importResult.errors && importResult.errors.length > 0 && (
                <div>
                  <h4 className="font-medium text-red-700 mb-2">ข้อผิดพลาด</h4>
                  <div className="bg-red-50 p-3 rounded-lg max-h-32 overflow-y-auto">
                    {importResult.errors.map((error: string, index: number) => (
                      <div key={index} className="text-sm text-red-700">• {error}</div>
                    ))}
                  </div>
                </div>
              )}

              {importResult.results && importResult.results.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-700 mb-2">รายละเอียด ({importResult.results.length} รายการ)</h4>
                  <div className="bg-gray-50 p-3 rounded-lg max-h-64 overflow-y-auto">
                    <div className="space-y-1 text-sm">
                      {importResult.results.slice(0, 20).map((result: any, index: number) => (
                        <div key={index} className="flex justify-between items-center">
                          <span>{result.product_name}</span>
                          <span className={`px-2 py-1 rounded text-xs ${
                            result.status === 'CREATED' ? 'bg-green-100 text-green-700' :
                            result.status === 'UPDATED' ? 'bg-blue-100 text-blue-700' :
                            result.status === 'SKIPPED' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-red-100 text-red-700'
                          }`}>
                            {result.status}
                          </span>
                        </div>
                      ))}
                      {importResult.results.length > 20 && (
                        <div className="text-center text-gray-500">
                          และอีก {importResult.results.length - 20} รายการ
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      <div className="flex justify-end space-x-3 mt-6">
        <Button variant="outline" onClick={onBack}>
          ยกเลิก
        </Button>
        
        <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
          <AlertDialogTrigger asChild>
            <Button 
              onClick={handleImportClick}
              disabled={!previewResult || previewResult.validRows.length === 0 || isImporting || isLoadingProducts || isProcessing}
              className="bg-teal-500 hover:bg-teal-600"
            >
              {isImporting ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  กำลังนำเข้า...
                </>
              ) : (
                `เริ่มการนำเข้า (${previewResult?.summary?.uniqueProducts || 0} ชนิด, ${previewResult?.validRows.length || 0} รายการ)`
              )}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent className="bg-white">
            <AlertDialogHeader>
              <AlertDialogTitle>ยืนยันการนำเข้าข้อมูล</AlertDialogTitle>
              <AlertDialogDescription>
                คุณต้องการนำเข้าสินค้าตามรายละเอียดต่อไปนี้หรือไม่?
              </AlertDialogDescription>
              <div className="space-y-3 mt-3">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="font-medium">จำนวนสินค้าที่จะนำเข้า:</span>
                      <span className="ml-2 text-blue-600 font-bold">{previewResult?.summary?.uniqueProducts || 0} ชนิด</span>
                    </div>
                    <div>
                      <span className="font-medium">จำนวนรายการทั้งหมด:</span>
                      <span className="ml-2 text-green-600 font-bold">{previewResult?.validRows.length || 0} รายการ</span>
                    </div>
                    {previewResult?.summary?.invalidRows && previewResult.summary.invalidRows > 0 && (
                      <div>
                        <span className="font-medium">รายการที่มีข้อผิดพลาด:</span>
                        <span className="ml-2 text-red-600 font-bold">{previewResult.summary.invalidRows} รายการ</span>
                      </div>
                    )}
                    {previewResult?.summary?.warnings && previewResult.summary.warnings.length > 0 && (
                      <div className="col-span-2">
                        <span className="font-medium">คำเตือน:</span>
                        <span className="ml-2 text-yellow-600 font-bold">{previewResult.summary.warnings.length} ข้อ</span>
                      </div>
                    )}
                  </div>
                </div>
                
                
                <div className="text-sm text-gray-500">
                  การดำเนินการนี้ไม่สามารถยกเลิกได้ กรุณาตรวจสอบข้อมูลให้ถูกต้องก่อนดำเนินการ
                </div>
              </div>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
              <AlertDialogAction onClick={handleConfirmImport} className="bg-teal-500 hover:bg-teal-600">
                ยืนยันการนำเข้า
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  </div>
  )
}
