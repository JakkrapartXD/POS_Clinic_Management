"use client"

import { useState, useMemo, useEffect, useCallback, memo } from "react"
import { Button } from "@/components/ui/button"
import AddProductForm from "@/components/forms/AddProductForm"
import ProductListSidebar from "@/components/modules/inventory/product-list-sidebar"
import AlphabetIndex from "@/components/modules/inventory/alphabet-index"
import InventoryActionsGrid from "@/components/modules/inventory/inventory-actions-grid"
import ImportProductsView from "@/components/modules/inventory/import-products-view"
import DeleteProductsView from "@/components/modules/inventory/delete-products-view"
import ProductDetailView from "@/components/modules/inventory/product-detail-view"
import { GraphQLAPI } from "@/clients/graphql"
import { logger } from "@/lib/logger"
import { useAuth } from "@/components/providers/auth-provider"

type AlphabetMode = 'english' | 'thai' | 'numbers'
type ViewMode = 'list' | 'add-product' | 'product-detail' | 'import-products' | 'delete-products'

interface TransformedProduct {
  id: string
  letter: string
  name: string
  variant: string
  stock: number
  status: string
  price: number
  allProducts?: Product[]
}

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
  pack_size?: string
}

function InventoryPage() {
  const { handleAuthError } = useAuth()
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedLetter, setSelectedLetter] = useState<string>("")
  const [alphabetMode, setAlphabetMode] = useState<AlphabetMode>('english')
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [submitTrigger, setSubmitTrigger] = useState(0)
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null)
  const [isProductEditing, setIsProductEditing] = useState(false)
  const [totalProducts, setTotalProducts] = useState(0)
  
  // Loading state to prevent multiple simultaneous requests
  const [isLoadingProducts, setIsLoadingProducts] = useState(false)

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

  const currentSections = getCurrentSections()

  // Load all products from GraphQL (no pagination)
  const loadProducts = useCallback(async () => {
    // ป้องกันการเรียกซ้ำ
    if (isLoadingProducts) {
      console.log('Already loading products, skipping...')
      return
    }

    try {
      setIsLoadingProducts(true)
      setLoading(true)
      setProducts([])
      setError(null)
      
      logger.info('Loading all products from GraphQL', {}, 'INVENTORY')
      
      // Load all products without pagination
      const response = await GraphQLAPI.getAllProducts({
        filter: { status: 'active' } // Only load active products
      })
      
      if (response.products && response.products.products) {
        const allProducts = response.products.products
        const total = response.products.total || allProducts.length
        
        setProducts(allProducts)
        setTotalProducts(total)
        
        logger.info('Products loaded successfully', { 
          count: allProducts.length,
          total
        }, 'INVENTORY')
      } else {
        setProducts([])
      }
    } catch (err) {
      logger.error('Failed to load products', err, 'INVENTORY')
      
      // Check if it's an authentication error
      if (err instanceof Error && (
        err.message.includes('Authentication required') ||
        err.message.includes('Unauthorized') ||
        err.message.includes('Not authenticated') ||
        err.message.includes('Invalid token') ||
        err.message.includes('Token expired')
      )) {
        handleAuthError(err)
        return
      }
      
      setError(err instanceof Error ? err.message : 'Failed to load products')
      setProducts([]) // Fallback to empty array
    } finally {
      setLoading(false)
      setIsLoadingProducts(false)
    }
  }, [handleAuthError, isLoadingProducts])


  useEffect(() => {
    // Load products on initial mount
    if (products.length === 0 && !isLoadingProducts) {
      loadProducts()
    }
  }, []) // Empty dependency array for initial load only

  // Transform products for display - group by product name and combine units
  // Memoized for better performance
  const transformedProducts = useMemo(() => {
    if (!products.length) return []

    // Group products by name first
    const productGroups = products.reduce((acc, product) => {
      const name = product.product_name
      if (!acc[name]) {
        acc[name] = []
      }
      acc[name].push(product)
      return acc
    }, {} as Record<string, typeof products>)

    // Transform grouped products
    return Object.entries(productGroups).map(([productName, productList]) => {
      // Get first letter/character for grouping
      const firstChar = productName.charAt(0).toUpperCase()
      
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

      // Get unique units for this product
      const uniqueUnits = [...new Set(productList.map(p => p.unit || 'หน่วย'))]
      const unitsDisplay = uniqueUnits.join(', ')
      
      // Calculate total stock across all variants
      const totalStock = productList.reduce((sum, p) => sum + (p.stock_quantity || 0), 0)
      
      // Use the first product's ID as representative ID
      const representativeId = productList[0].id
      
      return {
        id: representativeId,
        letter,
        name: productName,
        variant: unitsDisplay,
        stock: totalStock,
        status: `${totalStock} ${uniqueUnits.length > 1 ? 'หน่วย' : uniqueUnits[0] || 'หน่วย'}`,
        price: productList[0].sale_price, // Use first product's price as representative
        allProducts: productList // Keep all products for detail view
      }
    })
  }, [products])

  // Group products by first letter - memoized for performance
  const groupedProducts = useMemo(() => {
    if (!transformedProducts.length) return {}
    
    const filtered = transformedProducts.filter((product) => 
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
      (!selectedLetter || product.letter === selectedLetter)
    )
    
    return filtered.reduce((acc, product) => {
      const letter = product.letter
      if (!acc[letter]) {
        acc[letter] = []
      }
      acc[letter].push(product)
      return acc
    }, {} as Record<string, TransformedProduct[]>)
  }, [transformedProducts, searchQuery, selectedLetter])

  // Get sections that have products (from current mode) - memoized
  const availableSections = useMemo(() => {
    const sections = Object.keys(groupedProducts)
    return currentSections.filter(section => sections.includes(section))
  }, [groupedProducts, currentSections])

  // Total products count - memoized (for filtered results)
  const filteredProductsCount = useMemo(() => {
    return Object.values(groupedProducts).flat().length
  }, [groupedProducts])

  const handleModeSwitch = useCallback(() => {
    const modes: AlphabetMode[] = ['english', 'thai', 'numbers']
    const currentIndex = modes.indexOf(alphabetMode)
    const nextIndex = (currentIndex + 1) % modes.length
    setAlphabetMode(modes[nextIndex])
    setSelectedLetter("") // Reset selection when switching modes
  }, [alphabetMode])

  const getModeLabel = useCallback(() => {
    switch (alphabetMode) {
      case 'english': return 'A-Z'
      case 'thai': return 'ก-ฮ'
      case 'numbers': return '0-9'
      default: return 'A-Z'
    }
  }, [alphabetMode])

  // Navigation handlers - memoized
  const handleBackToList = useCallback(() => {
    setViewMode('list')
  }, [])

  // Action handlers - memoized
  const handleAddProduct = useCallback(() => setViewMode('add-product'), [])
  const handleImportProducts = useCallback(() => setViewMode('import-products'), [])
  const handleDeleteProduct = useCallback(() => setViewMode('delete-products'), [])

  // Product detail handler - memoized
  const handleProductClick = useCallback((productId: string) => {
    // Find the product with all its variants
    const product = transformedProducts.find(p => p.id === productId)
    if (product && product.allProducts) {
      // Store all product variants for detail view
      setSelectedProductId(productId)
      setViewMode('product-detail')
    } else {
      // Fallback to single product
      setSelectedProductId(productId)
      setViewMode('product-detail')
    }
  }, [transformedProducts])

  // Handle product deletion callback - memoized with debounce
  const handleProductDeleted = useCallback(() => {
    // Invalidate product cache before reloading
    GraphQLAPI.invalidateCachePattern('Products')
    
    // Debounce reload to prevent multiple rapid calls
    setTimeout(() => {
      loadProducts() // Reload products after deletion
    }, 500)
  }, [loadProducts])

  // Handle product update callback - memoized with debounce
  const handleProductUpdated = useCallback(() => {
    // Invalidate product cache before reloading
    GraphQLAPI.invalidateCachePattern('Products')
    
    // Debounce reload to prevent multiple rapid calls
    setTimeout(() => {
      loadProducts() // Reload products after update
    }, 500)
  }, [loadProducts])

  // Submit handlers - memoized with debounce
  const handleSubmitProduct = useCallback(async (productData: any) => {
    try {
      logger.info('Creating new product', { productData }, 'INVENTORY')
      
      // Prepare input data for GraphQL mutation
      const input: any = {
        product_name: productData.product_name || '',
        product_type: productData.product_type || 'medicine',
        generic_name: productData.generic_name || '',
        short_name: productData.short_name || '',
        status: productData.status || 'active',
        vat_percent: parseInt(productData.vat_percent) || 0,
        expiration_warning_date: parseInt(productData.expiration_warning_days) || 90,
        sale_price: parseFloat(productData.sale_price) || 0,
        unit: productData.unit || '',
        pack_size: productData.pack_size || '',
        reorder_point: parseInt(productData.reorder_point) || 0,
        cost: parseFloat(productData.cost) || 0,
        stock_quantity: parseInt(productData.stock_quantity) || 0,
        shelf_code: productData.shelf_code || '',
        shelf_row: productData.shelf_row || '',
        symptom_category: Array.isArray(productData.symptom_category) && productData.symptom_category.length > 0 
          ? JSON.stringify(productData.symptom_category) 
          : null,
        license_number: productData.license_number || '',
        dosage_unit: productData.dosage_unit || '',
        dosage: productData.dosage || '',
        times_per_day: parseInt(productData.times_per_day) || null,
        interval_hours: parseInt(productData.interval_hours) || null,
        before_meal: Boolean(productData.before_meal),
        after_meal: Boolean(productData.after_meal),
        after_meal_immediate: Boolean(productData.after_meal_immediate),
        morning: productData.morning || '',
        noon: productData.noon || '',
        evening: productData.evening || '',
        before_bed: productData.before_bed || '',
        properties: productData.properties || '',
        usage_instruction: productData.usage_instruction || '',
        sale_note: productData.sale_note || '',
        purchase_note: productData.purchase_note || '',
        image_url: productData.image_url || ''
      }

      // Only include categoryId if it exists and is not empty
      const categoryId = productData.categoryId || (typeof productData.category === 'object' && productData.category?.id)
      if (categoryId && categoryId.trim() !== '') {
        input.categoryId = categoryId
      }

      // Only include report_type if it exists and is not empty
      if (Array.isArray(productData.report_type) && productData.report_type.length > 0) {
        input.report_type = productData.report_type
      }

      logger.info('Creating product with input', { input }, 'INVENTORY')
      
      const result = await GraphQLAPI.createProduct(input)
      logger.info('Product created successfully', { result }, 'INVENTORY')
      
      // Invalidate product cache before reloading
      GraphQLAPI.invalidateCachePattern('Products')
      
      // Debounce reload to prevent multiple rapid calls
      setTimeout(() => {
        loadProducts() // Reload products after adding new product
      }, 500)
      setViewMode('list')
    } catch (error) {
      logger.error('Error creating product', { error, productData }, 'INVENTORY')
      const errorMessage = error instanceof Error ? error.message : 'เกิดข้อผิดพลาดในการสร้างสินค้า'
      alert(`ไม่สามารถสร้างสินค้าได้: ${errorMessage}`)
    }
  }, [loadProducts])

  const handleImportSubmit = useCallback(async (importData: any) => {
    // If import was successful, refresh the products list
    if (importData.result && importData.result.success && importData.result.imported > 0) {
      // Invalidate product cache before reloading
      GraphQLAPI.invalidateCachePattern('Products')
      loadProducts()
    }
    
    setViewMode('list')
  }, [loadProducts])


  const handleDeleteSubmit = useCallback((deleteData: any) => {
    // Invalidate product cache before reloading
    GraphQLAPI.invalidateCachePattern('Products')
    loadProducts() // Reload products after bulk deletion
    setViewMode('list')
  }, [loadProducts])

  const handleSaveButtonClick = useCallback(() => {
    setSubmitTrigger(prev => prev + 1)
  }, [])

  const getViewTitle = useCallback(() => {
    switch (viewMode) {
      case 'add-product': return 'เพิ่มสินค้าใหม่'
      case 'product-detail': return 'รายละเอียดสินค้า'
      case 'import-products': return 'เพิ่มชุดสินค้า/นำเข้า/แก้ไข'
      case 'delete-products': return 'ลบสินค้า'
      default: return 'สต็อกสินค้า'
    }
  }, [viewMode])

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Left Sidebar - Product List - Only show in list mode */}
      {viewMode === 'list' && (
        <ProductListSidebar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          selectedLetter={selectedLetter}
          products={transformedProducts}
          onProductClick={handleProductClick}
          totalProducts={totalProducts}
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
        {/* Header - Fixed - Hide when product is being edited */}
        {!isProductEditing && (
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
              ) : viewMode === 'product-detail' ? (
                null // ProductDetailView handles its own header buttons
              ) : (
                <Button variant="outline" onClick={handleBackToList}>
                  ย้อนกลับ
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Dynamic Content - Scrollable */}
        <div className={`flex-1 overflow-y-auto ${isProductEditing ? 'h-full' : ''}`}>
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
              onExportProducts={() => {}} // Disabled
              onDeleteProduct={handleDeleteProduct}
              onPrintBarcode={() => {}} // Disabled
              onPrintPriceTag={() => {}} // Disabled
              onPrintMedicineLabel={() => {}} // Disabled
              onProductReport={() => {}} // Disabled
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

          {viewMode === 'product-detail' && selectedProductId && (
            <ProductDetailView 
              productId={selectedProductId}
              onBack={handleBackToList}
              onEditingChange={setIsProductEditing}
              productVariants={(() => {
                const product = transformedProducts.find(p => p.id === selectedProductId)
                return product?.allProducts || undefined
              })()}
              onProductDeleted={handleProductDeleted}
              onProductUpdated={handleProductUpdated}
            />
          )}

          {viewMode === 'import-products' && (
            <ImportProductsView
              onBack={handleBackToList}
              onImport={handleImportSubmit}
            />
          )}

          {viewMode === 'delete-products' && (
            <DeleteProductsView
              onBack={handleBackToList}
              onDelete={handleDeleteSubmit}
            />
          )}
        </div>
      </div>
    </div>
  )
}

export default memo(InventoryPage)
