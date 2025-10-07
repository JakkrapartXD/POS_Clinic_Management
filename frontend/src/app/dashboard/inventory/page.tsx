"use client"

import { useState, useMemo, useEffect, useCallback, memo, Suspense } from "react"
import { useSearchParams, useRouter, usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import AddProductForm from "@/components/forms/AddProductForm"
import ProductListSidebar from "@/components/modules/inventory/product-list-sidebar"
import AlphabetIndex from "@/components/modules/inventory/alphabet-index"
import InventoryActionsGrid from "@/components/modules/inventory/inventory-actions-grid"
import ImportProductsView from "@/components/modules/inventory/import-products-view"
import DeleteProductsView from "@/components/modules/inventory/delete-products-view"
import ProductDetailView from "@/components/modules/inventory/product-detail-view"
import ExportProductsView from "@/components/modules/inventory/export-products-view"
import { GraphQLAPI } from "@/clients/graphql"
import { logger } from "@/lib/logger"
import { useAuth } from "@/components/providers/auth-provider"
import toast from "react-hot-toast"

type AlphabetMode = 'english' | 'thai' | 'numbers'
type ViewMode = 'list' | 'add-product' | 'product-detail' | 'import-products' | 'delete-products' | 'export-products'

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
  product_type?: string | { id: string; name: string; description?: string; code?: string }
  short_name?: string
  sale_price: number
  unit?: string
  stock_quantity: number
  sku?: string
  barcode?: string
  category?: string | { id: string; name: string; description?: string; code?: string }
  status?: string
  pack_size?: string
}

interface ExportProduct {
  id: string
  product_name: string
  product_type?: string | { id: string; name: string; description?: string; code?: string }
  generic_name?: string
  short_name?: string
  status?: string
  vat_percent?: number
  expiration_warning_date?: number | string
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
  categoryId?: string
  category?: string | { id: string; name: string; description?: string; code?: string }
  symptom_category?: string
  license_number?: string
  dosage_unit?: string
  dosage?: string
  times_per_day?: number
  interval_hours?: number
  before_meal?: boolean
  after_meal?: boolean
  after_meal_immediate?: boolean
  morning?: string
  noon?: string
  evening?: string
  before_bed?: string
  properties?: string
  usage_instruction?: string
  sale_note?: string
  purchase_note?: string
  image_url?: string
  image_path?: string
  created_at?: string
  updated_at?: string
}

// CSV conversion functions
const convertProductsToCSV = (products: ExportProduct[], exportSettings: any): string => {
  // CSV headers in Thai language
  const headers = [
    'รหัสสินค้า', 'ชื่อสินค้า', 'ประเภทสินค้า', 'ชื่อสามัญทางยา', 'ชื่อย่อ', 'สถานะสินค้า', 
    'ภาษีมูลค่าเพิ่ม', 'วันแจ้งเตือน', 'ราคาขาย', 'หน่วยนับ', 'ขนาดบรรจุ', 'จุดสั่งซื้อ', 
    'ต้นทุน', 'รหัส SKU', 'บาร์โค้ด', 'คงเหลือ', 'ปริมาณ', 'หน่วยปริมาณ', 'รหัสชั้นวาง', 
    'แถว', 'หมวดหมู่', 'หมวดหมู่ยาแยกตามอาการที่รักษา', 'ทะเบียนบัญชี', 'หน่วยการทาน', 
    'การทาน', 'จำนวนครั้งต่อวัน', 'ทานยาทุก ๆ ชั่วโมง', 'ก่อนอาหาร', 'หลังอาหาร', 
    'หลังอาหารทันที', 'เช้า', 'กลางวัน', 'เย็น', 'ก่อนนอน', 'สรรพคุณ', 'คำแนะนำการใช้', 
    'หมายเหตุการขาย', 'หมายเหตุการสั่งซื้อ'
  ]

  // Convert products to CSV rows
  const rows = products.map(product => [
    product.id || '', // รหัสสินค้า - Product ID
    product.product_name || '',
    typeof product.product_type === 'object' && product.product_type?.name 
      ? product.product_type.name 
      : product.product_type || '',
    product.generic_name || '', // ชื่อสามัญทางยา
    product.short_name || '',
    product.status || 'แสดงหน้าร้าน',
    product.vat_percent?.toString() || '', // ภาษีมูลค่าเพิ่ม
    product.expiration_warning_date?.toString() || '90', // วันแจ้งเตือน
    product.sale_price?.toString() || '0',
    product.unit || '',
    product.pack_size || '1',
    product.reorder_point?.toString() || '', // จุดสั่งซื้อ
    product.cost?.toString() || '', // ต้นทุน
    product.sku || '',
    product.barcode ? `="${product.barcode}"` : '',
    product.stock_quantity?.toString() || '0',
    product.volume?.toString() || '', // ปริมาณ
    product.volume_unit || '', // หน่วยปริมาณ
    product.shelf_code || '', // รหัสชั้นวาง
    product.shelf_row || '', // แถว
    typeof product.category === 'object' && product.category?.name 
      ? product.category.name 
      : product.category || '',
    product.symptom_category || '', // หมวดหมู่ยาแยกตามอาการที่รักษา
    product.license_number || '', // ทะเบียนบัญชี
    product.dosage_unit || '', // หน่วยการทาน
    product.dosage || '', // การทาน
    product.times_per_day?.toString() || '', // จำนวนครั้งต่อวัน
    product.interval_hours?.toString() || '', // ทานยาทุก ๆ ชั่วโมง
    product.before_meal ? 'true' : '', // ก่อนอาหาร
    product.after_meal ? 'true' : '', // หลังอาหาร
    product.after_meal_immediate ? 'true' : '', // หลังอาหารทันที
    product.morning || '', // เช้า
    product.noon || '', // กลางวัน
    product.evening || '', // เย็น
    product.before_bed || '', // ก่อนนอน
    product.properties || '', // สรรพคุณ
    product.usage_instruction || '', // คำแนะนำการใช้
    product.sale_note || '', // หมายเหตุการขาย
    product.purchase_note || ''  // หมายเหตุการสั่งซื้อ
  ])

  // Combine headers and rows
  const csvContent = [headers, ...rows]
    .map(row => row.map(field => `"${field}"`).join(','))
    .join('\n')

  return csvContent
}

const downloadCSV = (csvContent: string, filename: string) => {
  // Add UTF-8 BOM for proper Thai character display in Excel
  const BOM = '\uFEFF'
  const csvWithBOM = BOM + csvContent
  
  const blob = new Blob([csvWithBOM], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  link.setAttribute('href', url)
  link.setAttribute('download', filename)
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

function InventoryPage() {
  const { handleAuthError } = useAuth()
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedLetter, setSelectedLetter] = useState<string>("")
  const [alphabetMode, setAlphabetMode] = useState<AlphabetMode>('english')
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [submitTrigger, setSubmitTrigger] = useState(0)
  const [products, setProducts] = useState<Product[]>([])
  const [searchResults, setSearchResults] = useState<TransformedProduct[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null)
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

  // URL state management functions
  const updateURL = useCallback((params: { productId?: string; tab?: string; view?: string }) => {
    const url = new URL(window.location.href)
    
    if (params.productId) {
      url.searchParams.set('productId', params.productId)
    } else {
      url.searchParams.delete('productId')
    }
    
    if (params.tab) {
      url.searchParams.set('tab', params.tab)
    } else {
      url.searchParams.delete('tab')
    }
    
    if (params.view && params.view !== 'list') {
      url.searchParams.set('view', params.view)
    } else {
      url.searchParams.delete('view')
    }
    
    // Update URL without triggering a page reload
    window.history.replaceState({}, '', url.toString())
  }, [])

  const clearURL = useCallback(() => {
    const url = new URL(window.location.href)
    url.searchParams.delete('productId')
    url.searchParams.delete('tab')
    url.searchParams.delete('view')
    window.history.replaceState({}, '', url.toString())
  }, [])

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
      
      // Load all products without pagination (including inactive but not deleted)
      const response = await GraphQLAPI.getAllProducts({
        // No filter - load all products (backend will handle excluding deleted ones)
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

  // Debounced search function for products (including inactive)
  const performSearch = async (query: string) => {
    if (query.length < 2) {
      setSearchResults([])
      return
    }

    try {
      setIsSearching(true)
      setError(null) // Clear any previous errors
      
      const response = await GraphQLAPI.searchProducts(query, true) // includeInactive = true
      const rawResults = response.searchProducts || []
      
      // Transform search results to match the expected structure
      const transformedSearchResults = rawResults.map((product: Product) => {
        const firstChar = product.product_name.charAt(0).toUpperCase()
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
          stock: product.stock_quantity || 0,
          status: `${product.stock_quantity || 0} ${product.unit || 'หน่วย'}`,
          price: product.sale_price,
          allProducts: [product] // Single product in array for consistency
        }
      })
      
      setSearchResults(transformedSearchResults)
      
      logger.info('Product search completed', { 
        query, 
        resultCount: transformedSearchResults.length 
      }, 'INVENTORY')
    } catch (error) {
      logger.error('Error searching products:', error, 'INVENTORY')
      
      // Check if it's an authentication error
      if (error instanceof Error && (
        error.message.includes('Authentication required') ||
        error.message.includes('Unauthorized') ||
        error.message.includes('Not authenticated') ||
        error.message.includes('Invalid token') ||
        error.message.includes('Token expired')
      )) {
        handleAuthError(error)
        return
      }
      
      // Set user-friendly error message
      const errorMessage = error instanceof Error ? error.message : 'เกิดข้อผิดพลาดในการค้นหาสินค้า'
      setError(errorMessage)
      setSearchResults([])
      
      // Show toast notification
      toast.error('ไม่สามารถค้นหาสินค้าได้ กรุณาลองใหม่อีกครั้ง')
    } finally {
      setIsSearching(false)
    }
  }

  // Handle search query changes with debouncing
  useEffect(() => {
    if (searchTimeout) {
      clearTimeout(searchTimeout)
    }

    if (searchQuery.trim()) {
      const timeout = setTimeout(() => {
        performSearch(searchQuery.trim())
      }, 300) // 300ms debounce
      setSearchTimeout(timeout)
    } else {
      setSearchResults([])
    }

    return () => {
      if (searchTimeout) {
        clearTimeout(searchTimeout)
      }
    }
  }, [searchQuery])

  // Enhanced refresh function that preserves current state
  const refreshData = useCallback(async (preserveView: boolean = true) => {
    try {
      logger.info('Refreshing inventory data', { preserveView, currentView: viewMode, selectedProductId }, 'INVENTORY')
      
      // Invalidate cache first
      GraphQLAPI.invalidateCachePattern('Products')
      
      // Reload products
      await loadProducts()
      
      // If we're in product detail view and want to preserve it, reload the product
      if (preserveView && viewMode === 'product-detail' && selectedProductId) {
        // The ProductDetailView component will handle its own data refresh
        logger.info('Preserving product detail view after refresh', { productId: selectedProductId }, 'INVENTORY')
      }
      
      logger.info('Inventory data refreshed successfully', {}, 'INVENTORY')
    } catch (error) {
      logger.error('Failed to refresh inventory data', error, 'INVENTORY')
    }
  }, [loadProducts, viewMode, selectedProductId])

  useEffect(() => {
    // Load products on initial mount
    if (products.length === 0 && !isLoadingProducts) {
      loadProducts()
    }
  }, []) // Empty dependency array for initial load only

  // Handle browser refresh and page visibility changes
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && products.length === 0) {
        // Page became visible and we don't have products loaded
        loadProducts()
      }
    }

    const handleBeforeUnload = () => {
      // Save current state to sessionStorage before page unload
      const state = {
        viewMode,
        selectedProductId,
        searchQuery,
        selectedLetter,
        alphabetMode
      }
      sessionStorage.setItem('inventoryState', JSON.stringify(state))
    }

    const handlePageShow = (event: PageTransitionEvent) => {
      // Handle back/forward navigation
      if (event.persisted) {
        // Page was restored from cache
        const savedState = sessionStorage.getItem('inventoryState')
        if (savedState) {
          try {
            const state = JSON.parse(savedState)
            setViewMode(state.viewMode || 'list')
            setSelectedProductId(state.selectedProductId || null)
            setSearchQuery(state.searchQuery || '')
            setSelectedLetter(state.selectedLetter || '')
            setAlphabetMode(state.alphabetMode || 'english')
          } catch (error) {
            logger.error('Failed to restore inventory state', error, 'INVENTORY')
          }
        }
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('beforeunload', handleBeforeUnload)
    window.addEventListener('pageshow', handlePageShow)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('beforeunload', handleBeforeUnload)
      window.removeEventListener('pageshow', handlePageShow)
    }
  }, [products.length, viewMode, selectedProductId, searchQuery, selectedLetter, alphabetMode, loadProducts])

  // Handle URL parameters for direct navigation and state restoration
  useEffect(() => {
    const productId = searchParams.get('productId')
    const tab = searchParams.get('tab')
    const view = searchParams.get('view')
    
    // Set view mode from URL if present
    if (view && ['add-product', 'import-products', 'export-products', 'delete-products'].includes(view)) {
      setViewMode(view as ViewMode)
    }
    
    // Handle product detail navigation
    if (productId && products.length > 0) {
      // Check if the product exists in our products list
      const productExists = products.some(p => p.id === productId)
      if (productExists) {
        setSelectedProductId(productId)
        setViewMode('product-detail')
        
        // Update URL to include view mode
        updateURL({ productId, tab: tab || undefined, view: 'product-detail' })
      }
    }
  }, [searchParams, products, updateURL])

  // Handle initial page load with URL parameters
  useEffect(() => {
    const productId = searchParams.get('productId')
    const view = searchParams.get('view')
    
    // If we have URL parameters but no products loaded yet, we need to load products first
    if ((productId || view) && products.length === 0 && !isLoadingProducts) {
      loadProducts()
    }
  }, [searchParams, products.length, isLoadingProducts, loadProducts])

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

  // Navigation handlers - memoized with URL updates
  const handleBackToList = useCallback(() => {
    setViewMode('list')
    setSelectedProductId(null)
    clearURL()
  }, [clearURL])

  // Action handlers - memoized with URL updates
  const handleAddProduct = useCallback(() => {
    setViewMode('add-product')
    updateURL({ view: 'add-product' })
  }, [updateURL])
  
  const handleImportProducts = useCallback(() => {
    setViewMode('import-products')
    updateURL({ view: 'import-products' })
  }, [updateURL])
  
  const handleExportProducts = useCallback(() => {
    setViewMode('export-products')
    updateURL({ view: 'export-products' })
  }, [updateURL])
  
  const handleDeleteProduct = useCallback(() => {
    setViewMode('delete-products')
    updateURL({ view: 'delete-products' })
  }, [updateURL])

  // Product detail handler - memoized with URL updates
  const handleProductClick = useCallback((productId: string) => {
    // Find the product with all its variants
    const product = transformedProducts.find(p => p.id === productId)
    if (product && product.allProducts) {
      // Store all product variants for detail view
      setSelectedProductId(productId)
      setViewMode('product-detail')
      updateURL({ productId, view: 'product-detail' })
    } else {
      // Fallback to single product
      setSelectedProductId(productId)
      setViewMode('product-detail')
      updateURL({ productId, view: 'product-detail' })
    }
  }, [transformedProducts, updateURL])

  // Handle product deletion callback - memoized with debounce
  const handleProductDeleted = useCallback(() => {
    // Use the enhanced refresh function
    setTimeout(() => {
      refreshData(false) // Don't preserve view after deletion
      // Navigate back to list view
      setViewMode('list')
      setSelectedProductId(null)
      clearURL()
    }, 500)
  }, [refreshData, clearURL])

  // Handle product update callback - memoized with debounce
  const handleProductUpdated = useCallback(() => {
    // Use the enhanced refresh function to preserve current view
    setTimeout(() => {
      refreshData(true) // Preserve current view after update
    }, 500)
  }, [refreshData])

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
        cost: 0, // Default value since field is removed
        stock_quantity: 0, // Default value since field is removed
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


      logger.info('Creating product with input', { input }, 'INVENTORY')
      
      const result = await GraphQLAPI.createProduct(input)
      logger.info('Product created successfully', { result }, 'INVENTORY')
      
      // Create initial stock if provided
      if (productData.initialStockData && result.createProduct) {
        try {
          const stockInput = {
            productId: result.createProduct.id,
            quantity: productData.initialStockData.quantity,
            quantity_in: productData.initialStockData.quantity,
            is_outofstock: false,
            production_date: productData.initialStockData.production_date ? new Date(productData.initialStockData.production_date).toISOString() : undefined,
            expiration_date: productData.initialStockData.expiration_date ? new Date(productData.initialStockData.expiration_date).toISOString() : undefined,
            note: productData.initialStockData.note || 'เพิ่มสต๊อกเริ่มต้น'
          }
          
          await GraphQLAPI.createStock(stockInput)
          
          // Update product stock quantity
          const updateProductInput = {
            stock_quantity: productData.initialStockData.quantity
          }
          
          await GraphQLAPI.updateProduct(result.createProduct.id, updateProductInput)
          
          logger.info('Initial stock created successfully', { productId: result.createProduct.id, stockInput }, 'INVENTORY')
        } catch (stockError) {
          logger.error('Failed to create initial stock', { stockError, productId: result.createProduct.id }, 'INVENTORY')
          // Don't fail the entire operation if stock creation fails
          toast.error('สร้างสินค้าสำเร็จ แต่ไม่สามารถเพิ่มสต๊อกเริ่มต้นได้')
        }
      }
      
      // Upload image after successful product creation
      if (productData.newImageFile && result.createProduct) {
        try {
          logger.info('Uploading image for new product', { fileName: productData.newImageFile.name }, 'INVENTORY')
          const uploadResult = await GraphQLAPI.uploadImage(productData.newImageFile, 'product')
          const newImageUrl = uploadResult.url
          logger.info('Image uploaded successfully', { newImageUrl }, 'INVENTORY')
          
          // Update product with new image URL
          await GraphQLAPI.updateProduct(result.createProduct.id, {
            image_url: newImageUrl
          })
          
          logger.info('Product image updated successfully', { productId: result.createProduct.id }, 'INVENTORY')
        } catch (error) {
          logger.error('Failed to upload image for new product', error, 'INVENTORY')
          // Don't fail the entire operation if image upload fails
          toast.error('สร้างสินค้าสำเร็จ แต่ไม่สามารถอัปโหลดรูปภาพได้')
        }
      }
      
      // Show success message
      toast.success('สร้างสินค้าสำเร็จ')
      
      // Use the enhanced refresh function
      setTimeout(() => {
        refreshData(false) // Don't preserve view after adding new product
        setViewMode('list')
        clearURL()
      }, 500)
    } catch (error) {
      logger.error('Error creating product', { error, productData }, 'INVENTORY')
      const errorMessage = error instanceof Error ? error.message : 'เกิดข้อผิดพลาดในการสร้างสินค้า'
      toast.error(`ไม่สามารถสร้างสินค้าได้: ${errorMessage}`)
    }
  }, [loadProducts])

  const handleImportSubmit = useCallback(async (importData: any) => {
    // If import was successful, refresh the products list
    if (importData.result && importData.result.success && importData.result.imported > 0) {
      // Use the enhanced refresh function
      setTimeout(() => {
        refreshData(false) // Don't preserve view after import
        setViewMode('list')
        clearURL()
      }, 500)
    } else {
      setViewMode('list')
      clearURL()
    }
  }, [refreshData, clearURL])


  const handleDeleteSubmit = useCallback((deleteData: any) => {
    // Use the enhanced refresh function
    setTimeout(() => {
      refreshData(false) // Don't preserve view after bulk deletion
      setViewMode('list')
      clearURL()
    }, 500)
  }, [refreshData, clearURL])


  const handleExportSubmit = useCallback(async (exportData: any) => {
    try {
      logger.info('Exporting products with complete data', { exportData }, 'INVENTORY')
      
      // Fetch complete product data using the new export API
      const response = await GraphQLAPI.exportProducts()
      
      if (response.products && response.products.products) {
        const allProducts = response.products.products
        
        // Convert products to CSV format matching sample_item_data.csv
        const csvData = convertProductsToCSV(allProducts, exportData)
        
        // Create and download CSV file
        const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-')
        downloadCSV(csvData, `รายการสินค้า_${timestamp}.csv`)
        
        logger.info('Products exported successfully', { 
          count: allProducts.length 
        }, 'INVENTORY')
      } else {
        throw new Error('No products data received from server')
      }
      
      setViewMode('list')
      clearURL()
    } catch (error) {
      logger.error('Error exporting products', { error, exportData }, 'INVENTORY')
      
      // Check if it's an authentication error
      if (error instanceof Error && (
        error.message.includes('Authentication required') ||
        error.message.includes('Unauthorized') ||
        error.message.includes('Not authenticated') ||
        error.message.includes('Invalid token') ||
        error.message.includes('Token expired')
      )) {
        handleAuthError(error)
        return
      }
      
      const errorMessage = error instanceof Error ? error.message : 'เกิดข้อผิดพลาดในการส่งออกข้อมูล'
      toast.error(`ไม่สามารถส่งออกข้อมูลได้: ${errorMessage}`)
    }
  }, [handleAuthError, clearURL])

  const handleSaveButtonClick = useCallback(() => {
    setSubmitTrigger(prev => prev + 1)
  }, [])

  const getViewTitle = useCallback(() => {
    switch (viewMode) {
      case 'add-product': return 'เพิ่มสินค้าใหม่'
      case 'product-detail': return 'รายละเอียดสินค้า'
      case 'import-products': return 'เพิ่มชุดสินค้า/นำเข้า/แก้ไข'
      case 'export-products': return 'ส่งออกยอดสินค้า'
      case 'delete-products': return 'ลบสินค้า'
      default: return 'สต็อกสินค้า'
    }
  }, [viewMode])

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden" data-testid="inventory-page">
      {/* Left Sidebar - Product List - Only show in list mode */}
      {viewMode === 'list' && (
        <ProductListSidebar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          selectedLetter={selectedLetter}
          products={searchQuery.trim() ? searchResults : transformedProducts}
          onProductClick={handleProductClick}
          totalProducts={totalProducts}
          isSearching={isSearching}
          error={error}
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
                null // No buttons for list view
              ) : viewMode === 'add-product' ? (
                <div className="flex space-x-3">
                  <Button variant="outline" onClick={handleBackToList}>
                    ยกเลิก
                  </Button>
                  <Button onClick={handleSaveButtonClick} className="bg-teal-500 hover:bg-teal-600" data-testid="save-product-button">
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
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-500 mx-auto mb-4"></div>
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
                  className="text-teal-600 border-teal-200"
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
              initialActiveTab={searchParams.get('tab') === 'stock' ? 'stock' : 'general'}
            />
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
              products={products}
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

function InventoryPageWithSuspense() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <InventoryPage />
    </Suspense>
  )
}

export default memo(InventoryPageWithSuspense)
