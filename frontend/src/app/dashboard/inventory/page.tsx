"use client"

import { useState, useMemo, useEffect } from "react"
import { Button } from "@/components/ui/button"
import AddProductForm from "@/components/forms/AddProductForm"
import ProductListSidebar from "@/components/modules/inventory/product-list-sidebar"
import AlphabetIndex from "@/components/modules/inventory/alphabet-index"
import InventoryActionsGrid from "@/components/modules/inventory/inventory-actions-grid"
import ImportProductsView from "@/components/modules/inventory/import-products-view"
import ExportProductsView from "@/components/modules/inventory/export-products-view"
import DeleteProductsView from "@/components/modules/inventory/delete-products-view"
import { GraphQLAPI } from "@/clients/graphql"
import { logger } from "@/lib/logger"

type AlphabetMode = 'english' | 'thai' | 'numbers'
type ViewMode = 'list' | 'add-product' | 'import-products' | 'export-products' | 'delete-products' | 'print-barcode' | 'print-price-tag' | 'print-medicine-label' | 'product-report'

interface Product {
  id: string
  product_name: string
  product_type?: string
  short_name?: string
  sale_price: number
  unit?: string
  stock_quantity: number
  sku?: string
  barcode?: string
  category?: string
  status?: string
}

export default function InventoryPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedLetter, setSelectedLetter] = useState<string>("")
  const [alphabetMode, setAlphabetMode] = useState<AlphabetMode>('english')
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [submitTrigger, setSubmitTrigger] = useState(0)
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const alphabet = Array.from({ length: 26 }, (_, i) => String.fromCharCode(65 + i))
  const thaiLetters = ["ก", "ข", "ค", "ง", "จ", "ฉ", "ช", "ซ", "ฌ", "ญ", "ด", "ต", "ท", "ธ", "น", "บ", "ป", "ผ", "ฝ", "พ", "ฟ", "ภ", "ม", "ย", "ร", "ล", "ว", "ศ", "ษ", "ส", "ห", "ฬ", "อ", "ฮ"]
  const numbers = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"]
  
  const getCurrentSections = () => {
    switch (alphabetMode) {
      case 'english': return alphabet
      case 'thai': return thaiLetters
      case 'numbers': return numbers
      default: return alphabet
    }
  }

  const allSections = [...numbers, ...alphabet, ...thaiLetters]
  const currentSections = getCurrentSections()

  // Load products from GraphQL
  useEffect(() => {
    const loadProducts = async () => {
      try {
        setLoading(true)
        setError(null)
        
        logger.info('Loading products from GraphQL', {}, 'INVENTORY')
        
        const response = await GraphQLAPI.getAllProducts({
          pagination: { skip: 0, take: 100 } // Load first 100 products
        })
        
        if (response.products && response.products.products) {
          setProducts(response.products.products)
          logger.info('Products loaded successfully', { 
            count: response.products.products.length 
          }, 'INVENTORY')
        } else {
          setProducts([])
        }
      } catch (err) {
        logger.error('Failed to load products', err, 'INVENTORY')
        setError(err instanceof Error ? err.message : 'Failed to load products')
        setProducts([]) // Fallback to empty array
      } finally {
        setLoading(false)
      }
    }

    loadProducts()
  }, [])

  // Transform products for display - extract first letter for grouping
  const transformedProducts = useMemo(() => {
    return products.map(product => {
      // Get first letter/character for grouping
      const firstChar = product.product_name.charAt(0).toUpperCase()
      
      // Determine if it's Thai, English, or Number
      let letter = firstChar
      if (/[ก-ฮ]/.test(firstChar)) {
        letter = firstChar // Thai letter
      } else if (/[A-Z]/.test(firstChar)) {
        letter = firstChar // English letter
      } else if (/[0-9]/.test(firstChar)) {
        letter = firstChar // Number
      } else {
        letter = '#' // Special characters
      }
      
      return {
        id: product.id,
        letter,
        name: product.product_name,
        variant: product.unit || 'หน่วย',
        stock: product.stock_quantity,
        status: `${product.stock_quantity} ${product.unit || 'หน่วย'}`,
        price: product.sale_price
      }
    })
  }, [products])

  // Group products by first letter
  const groupedProducts = useMemo(() => {
    const filtered = transformedProducts.filter((product) => 
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
      (!selectedLetter || product.letter === selectedLetter)
    )
    
    const grouped = filtered.reduce((acc, product) => {
      const letter = product.letter
      if (!acc[letter]) {
        acc[letter] = []
      }
      acc[letter].push(product)
      return acc
    }, {} as Record<string, typeof transformedProducts>)
    
    return grouped
  }, [transformedProducts, searchQuery, selectedLetter])

  // Get sections that have products (from current mode)
  const availableSections = useMemo(() => {
    const sections = Object.keys(groupedProducts)
    return currentSections.filter(section => sections.includes(section))
  }, [groupedProducts, currentSections])

  const totalProducts = Object.values(groupedProducts).flat().length

  const handleModeSwitch = () => {
    const modes: AlphabetMode[] = ['english', 'thai', 'numbers']
    const currentIndex = modes.indexOf(alphabetMode)
    const nextIndex = (currentIndex + 1) % modes.length
    setAlphabetMode(modes[nextIndex])
    setSelectedLetter("") // Reset selection when switching modes
  }

  const getModeLabel = () => {
    switch (alphabetMode) {
      case 'english': return 'A-Z'
      case 'thai': return 'ก-ฮ'
      case 'numbers': return '0-9'
      default: return 'A-Z'
    }
  }

  // Navigation handlers
  const handleBackToList = () => {
    setViewMode('list')
  }

  // Action handlers
  const handleAddProduct = () => setViewMode('add-product')
  const handleImportProducts = () => setViewMode('import-products')
  const handleExportProducts = () => setViewMode('export-products')
  const handleDeleteProduct = () => setViewMode('delete-products')
  const handlePrintBarcode = () => setViewMode('print-barcode')
  const handlePrintPriceTag = () => setViewMode('print-price-tag')
  const handlePrintMedicineLabel = () => setViewMode('print-medicine-label')
  const handleProductReport = () => setViewMode('product-report')

  // Submit handlers
  const handleSubmitProduct = (productData: any) => {
    console.log("New product data:", productData)
    setViewMode('list')
  }

  const handleImportSubmit = async (importData: any) => {
    console.log("Import data:", importData)
    
    // If import was successful, refresh the products list
    if (importData.result && importData.result.success && importData.result.imported > 0) {
      try {
        logger.info('Refreshing products after successful import', {}, 'INVENTORY')
        
        const response = await GraphQLAPI.getAllProducts({
          pagination: { skip: 0, take: 100 }
        })
        
        if (response.products && response.products.products) {
          setProducts(response.products.products)
          logger.info('Products refreshed after import', { 
            count: response.products.products.length 
          }, 'INVENTORY')
        }
      } catch (err) {
        logger.error('Failed to refresh products after import', err, 'INVENTORY')
      }
    }
    
    setViewMode('list')
  }

  const handleExportSubmit = (exportSettings: any) => {
    console.log("Export settings:", exportSettings)
    // Handle export logic here
  }

  const handleDeleteSubmit = (deleteData: any) => {
    console.log("Delete data:", deleteData)
    setViewMode('list')
  }

  const handleSaveButtonClick = () => {
    setSubmitTrigger(prev => prev + 1)
  }

  const getViewTitle = () => {
    switch (viewMode) {
      case 'add-product': return 'เพิ่มสินค้าใหม่'
      case 'import-products': return 'เพิ่มชุดสินค้า/นำเข้า/แก้ไข'
      case 'export-products': return 'ส่งออกยอดสินค้า'
      case 'delete-products': return 'ลบสินค้า'
      case 'print-barcode': return 'พิมพ์บาร์โค้ด'
      case 'print-price-tag': return 'พิมพ์ป้ายราคาสินค้า'
      case 'print-medicine-label': return 'พิมพ์ฉลากยา'
      case 'product-report': return 'รายงานรับเข้า/ออกของสินค้า'
      default: return 'สต็อกสินค้า'
    }
  }

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Left Sidebar - Product List - Only show in list mode */}
      {viewMode === 'list' && (
        <ProductListSidebar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          selectedLetter={selectedLetter}
          products={transformedProducts}
        />
      )}

      {/* Alphabet Index - Only show in list mode */}
      {viewMode === 'list' && (
        <AlphabetIndex
          alphabetMode={alphabetMode}
          selectedLetter={selectedLetter}
          onLetterSelect={setSelectedLetter}
          onModeSwitch={handleModeSwitch}
          groupedProducts={groupedProducts}
        />
      )}

      {/* Main Content Area - Scrollable */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Header - Fixed */}
        <div className="bg-white border-b p-6 flex-shrink-0">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-semibold text-gray-700">
              {getViewTitle()}
            </h1>
            {viewMode === 'list' ? (
              <Button className="text-purple-500 bg-white hover:bg-purple-50 border border-purple-200">
                ตัวเลือก
              </Button>
            ) : viewMode === 'add-product' ? (
              <div className="flex space-x-3">
                <Button variant="outline" onClick={handleBackToList}>
                  ยกเลิก
                </Button>
                <Button onClick={handleSaveButtonClick} className="bg-purple-500 hover:bg-purple-600">
                  บันทึกสินค้า
                </Button>
              </div>
            ) : (
              <Button variant="outline" onClick={handleBackToList}>
                ย้อนกลับ
              </Button>
            )}
          </div>
        </div>

        {/* Dynamic Content - Scrollable */}
        <div className="flex-1 overflow-y-auto">
          {/* Loading State */}
          {loading && viewMode === 'list' && (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto mb-4"></div>
                <div className="text-gray-600">กำลังโหลดข้อมูลสินค้า...</div>
              </div>
            </div>
          )}

          {/* Error State */}
          {error && viewMode === 'list' && (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="text-red-500 mb-4">⚠️</div>
                <div className="text-red-600 mb-2">เกิดข้อผิดพลาดในการโหลดข้อมูล</div>
                <div className="text-gray-500 text-sm mb-4">{error}</div>
                <Button 
                  onClick={() => window.location.reload()} 
                  variant="outline"
                  className="text-purple-600 border-purple-200"
                >
                  ลองใหม่
                </Button>
              </div>
            </div>
          )}

          {/* Content */}
          {!loading && !error && viewMode === 'list' && (
            <InventoryActionsGrid
              onAddProduct={handleAddProduct}
              onImportProducts={handleImportProducts}
              onExportProducts={handleExportProducts}
              onDeleteProduct={handleDeleteProduct}
              onPrintBarcode={handlePrintBarcode}
              onPrintPriceTag={handlePrintPriceTag}
              onPrintMedicineLabel={handlePrintMedicineLabel}
              onProductReport={handleProductReport}
            />
          )}

          {viewMode === 'add-product' && (
            <div className="h-full">
              <AddProductForm 
                submitTrigger={submitTrigger}
                onBack={handleBackToList}
                onSubmit={handleSubmitProduct}
              />
            </div>
          )}

          {viewMode === 'import-products' && (
            <ImportProductsView
              onBack={handleBackToList}
              onImport={handleImportSubmit}
            />
          )}

          {viewMode === 'export-products' && (
            <ExportProductsView
              onBack={handleBackToList}
              onExport={handleExportSubmit}
            />
          )}

          {viewMode === 'delete-products' && (
            <DeleteProductsView
              onBack={handleBackToList}
              onDelete={handleDeleteSubmit}
            />
          )}

          {(viewMode === 'print-barcode' || viewMode === 'print-price-tag' || viewMode === 'print-medicine-label' || viewMode === 'product-report') && (
            <div className="p-6 text-center">
              <div className="max-w-md mx-auto">
                <div className="text-lg font-medium text-gray-700 mb-2">
                  {getViewTitle()}
                </div>
                <div className="text-gray-500 mb-6">
                  ฟีเจอร์นี้กำลังอยู่ในระหว่างการพัฒนา
                </div>
                <Button onClick={handleBackToList}>
                  ย้อนกลับ
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
