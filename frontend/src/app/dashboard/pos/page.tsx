"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { ChevronDown, Search, X, Check } from "lucide-react"
import { GraphQLAPI } from "@/clients/graphql"
import { logger } from "@/lib/logger"
import { useUser } from "@/hooks/use-user"
import { API_CONFIG } from "@/config/api"
import JsBarcode from 'jsbarcode'
import { parseDrugAllergies } from '@/utils/patient-utils'
import { calculateItemVAT, calculateTotalVAT, calculateSubtotal, calculateGrandTotal, createOrderItemWithVAT } from '@/utils/vat-utils'
import { toast } from 'sonner'



interface Product {
  id: string
  product_name: string
  sale_price: number
  unit: string
  pack_size: string
  stock_quantity: number
  sku: string
  barcode: string
  image_url?: string
  category?: {
    id: string
    name: string
  }
  status: string
  vat_percent?: number
  reorder_point?: number
  expiration_warning_date?: number
}

interface CartItem {
  id: string
  product_name: string
  sale_price: number
  unit: string
  pack_size: string
  quantity: number
  sku: string
  barcode: string
  stock_quantity: number
  vat_percent?: number
}

interface Category {
  id: string
  name: string
  count: number
}

interface Patient {
  id: string
  first_name: string
  last_name: string
  phone?: string
  email?: string
  drug_allergies?: string
  medical_conditions?: string
}

export default function POSPage() {
  const { user } = useUser()
  const [searchQuery, setSearchQuery] = useState("")
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [loading, setLoading] = useState(true)
  const [showPaymentDialog, setShowPaymentDialog] = useState(false)
  const [paymentAmount, setPaymentAmount] = useState(0)
  const [paymentMethod, setPaymentMethod] = useState("cash")
  const [isProcessingPayment, setIsProcessingPayment] = useState(false)
  const [showPromptPayScan, setShowPromptPayScan] = useState(false)
  const [promptPayAmount, setPromptPayAmount] = useState(0)
  const [showPaymentSuccess, setShowPaymentSuccess] = useState(false)
  const [completedOrder, setCompletedOrder] = useState<any>(null)
  const barcodeRef = useRef<SVGSVGElement>(null)
  
  // Customer search states
  const [customerPhone, setCustomerPhone] = useState("")
  const [selectedCustomer, setSelectedCustomer] = useState<Patient | null>(null)
  const [customerSearchResults, setCustomerSearchResults] = useState<Patient[]>([])
  const [isSearchingCustomer, setIsSearchingCustomer] = useState(false)
  const [showCustomerSearch, setShowCustomerSearch] = useState(false)
  const [customerMedicalInfo, setCustomerMedicalInfo] = useState<any>(null)
  const [isLoadingMedicalInfo, setIsLoadingMedicalInfo] = useState(false)
  
  // Prescription visit states
  const [prescriptionVisitData, setPrescriptionVisitData] = useState<any>(null)
  const [prescriptionItems, setPrescriptionItems] = useState<any[]>([])

  // Handle keyboard input for numpad
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      // ตรวจสอบว่า payment dialog เปิดอยู่หรือไม่
      if (!showPaymentDialog) return
      
      const key = event.key
      
      // รองรับ numpad และ number keys
      if (key >= '0' && key <= '9') {
        event.preventDefault()
        handleNumberInput(key)
      } else if (key === '.' || key === 'Decimal') {
        event.preventDefault()
        handleNumberInput('.')
      } else if (key === 'Backspace' || key === 'Delete') {
        event.preventDefault()
        handleNumberInput('X')
      } else if (key === 'Enter') {
        event.preventDefault()
        const currentAmount = getTotalPaymentAmount()
        if (currentAmount >= calculateTotal() && !isProcessingPayment) {
          handlePaymentConfirm()
        }
      }
    }

    // เพิ่ม event listener
    document.addEventListener('keydown', handleKeyPress)
    
    // Cleanup
    return () => {
      document.removeEventListener('keydown', handleKeyPress)
    }
  }, [showPaymentDialog, paymentAmount, promptPayAmount, paymentMethod, isProcessingPayment])

  // ตรวจสอบสต๊อกและแจ้งเตือน
  const checkStockWarnings = async (product: Product) => {
    try {
      // ตรวจสอบสต๊อกต่ำ
      if (product.stock_quantity <= (product.reorder_point || 0)) {
        toast.warning(`⚠️ สต๊อกต่ำ: ${product.product_name} เหลือ ${product.stock_quantity} ${product.unit || 'หน่วย'}`, {
          duration: 5000,
          id: 'stock-warning-toast'
        })
      }

      // ตรวจสอบสต๊อกใกล้หมดอายุ
      const stocksResponse = await GraphQLAPI.getStocks({ productId: product.id })
      
      if (stocksResponse.stocks && stocksResponse.stocks.length > 0) {
        const today = new Date()
        const warningDays = product.expiration_warning_date || 90
        
        // ตรวจสอบสต๊อกที่ใกล้หมดอายุ
        const nearExpiryStocks = stocksResponse.stocks.filter((stock: any) => {
          if (!stock.expiration_date) return false
          
          const expDate = new Date(stock.expiration_date)
          const daysUntilExpiry = Math.ceil((expDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
          
          return daysUntilExpiry <= warningDays && daysUntilExpiry > 0
        })

        if (nearExpiryStocks.length > 0) {
          const totalNearExpiry = nearExpiryStocks.reduce((sum: number, stock: any) => sum + stock.quantity, 0)
          const earliestExpiry = Math.min(...nearExpiryStocks.map((stock: any) => {
            const expDate = new Date(stock.expiration_date)
            return Math.ceil((expDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
          }))
          
          toast.warning(`⏰ สินค้าใกล้หมดอายุ: ${product.product_name} เหลือ ${earliestExpiry} วัน (${totalNearExpiry} ${product.unit || 'หน่วย'})`, {
            duration: 6000,
            id: 'expiry-warning-toast'
          })
        }

        // ตรวจสอบสต๊อกที่หมดอายุแล้ว
        const expiredStocks = stocksResponse.stocks.filter((stock: any) => {
          if (!stock.expiration_date) return false
          
          const expDate = new Date(stock.expiration_date)
          return expDate < today
        })

        if (expiredStocks.length > 0) {
          const totalExpired = expiredStocks.reduce((sum: number, stock: any) => sum + stock.quantity, 0)
          toast.error(`🚫 สินค้าหมดอายุ: ${product.product_name} (${totalExpired} ${product.unit || 'หน่วย'})`, {
            duration: 8000,
            id: 'expired-warning-toast'
          })
        }
      }
    } catch (error) {
      logger.error('Failed to check stock warnings', error, 'POS')
      // ไม่แสดง error ให้ผู้ใช้ เพราะไม่ใช่การทำงานหลัก
    }
  }

  // ดึงข้อมูลสินค้าจาก API
  const fetchProducts = async () => {
    try {
      setLoading(true)
      logger.info('Fetching products for POS', {}, 'POS')
      
      const response = await GraphQLAPI.getAllProducts({
        filter: {
          status: 'active' // ดึงเฉพาะสินค้าที่แสดงหน้าร้าน
        }
      })
      
      if (response.products?.products) {
        setProducts(response.products.products)
        logger.info('Products loaded successfully', { 
          count: response.products.products.length 
        }, 'POS')
        
        // สร้างหมวดหมู่จากสินค้า
        const categoryMap = new Map<string, number>()
        response.products.products.forEach((product: Product) => {
          const categoryName = product.category?.name || 'ไม่ระบุหมวดหมู่'
          categoryMap.set(categoryName, (categoryMap.get(categoryName) || 0) + 1)
        })
        
        const categoryList: Category[] = [
          { id: "all", name: "แสดงทั้งหมด", count: response.products.products.length }
        ]
        
        categoryMap.forEach((count, name) => {
          categoryList.push({ id: name, name, count })
        })
        
        setCategories(categoryList)
      }
    } catch (error) {
      logger.error('Failed to fetch products', error, 'POS')
      console.error('Error fetching products:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProducts()
    loadPrescriptionVisitData()
  }, [])

  // Load prescription visit data from sessionStorage
  const loadPrescriptionVisitData = () => {
    try {
      const storedData = sessionStorage.getItem('prescriptionVisitData')
      if (storedData) {
        const visitData = JSON.parse(storedData)
        setPrescriptionVisitData(visitData)
        
        // Set customer data if available
        if (visitData.patientId) {
          setSelectedCustomer({
            id: visitData.patientId,
            first_name: visitData.patientName?.split(' ')[0] || '',
            last_name: visitData.patientName?.split(' ').slice(1).join(' ') || '',
            phone: visitData.patientPhone,
            email: visitData.patientEmail
          })
        }
        
        // Load prescription cart from QueueEvent data instead of localStorage
        if (visitData.prescriptionData && visitData.prescriptionData.items) {
          try {
            const cartItems = visitData.prescriptionData.items
            // Convert prescription cart items to POS cart items
            const posCartItems = cartItems.map((item: any) => ({
              id: item.id,
              product_name: item.product_name,
              sale_price: item.sale_price,
              unit: item.unit,
              pack_size: item.pack_size,
              quantity: item.quantity,
              sku: item.sku,
              barcode: item.barcode,
              stock_quantity: item.stock_quantity,
              vat_percent: item.vat_percent || 0
            }))
            setCartItems(posCartItems)
            console.log('Loaded prescription cart from QueueEvent:', posCartItems)
          } catch (error) {
            console.error('Error parsing prescription cart from QueueEvent:', error)
          }
        }
        
        // Parse prescription items from visit notes if available (fallback)
        if (visitData.visitData?.notes) {
          try {
            const notes = visitData.visitData.notes
            // Look for prescription items in the notes
            // This is a simple parser - you might need to adjust based on your note format
            const prescriptionMatch = notes.match(/ยา:\s*([^]+?)(?=\n|$)/i)
            if (prescriptionMatch) {
              const prescriptionText = prescriptionMatch[1]
              // Parse prescription items (this is a basic implementation)
              const items = prescriptionText.split('\n').filter((line: string) => line.trim())
              setPrescriptionItems(items.map((item: string, index: number) => ({
                id: `prescription-${index}`,
                name: item.trim(),
                type: 'prescription'
              })))
            }
          } catch (error) {
            console.error('Error parsing prescription items:', error)
          }
        }
        
        // Clear the stored data after loading
        sessionStorage.removeItem('prescriptionVisitData')
      }
    } catch (error) {
      console.error('Error loading prescription visit data:', error)
    }
  }

  // กรองสินค้าตามการค้นหาและหมวดหมู่
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.product_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         product.sku?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         product.barcode?.includes(searchQuery)
    const matchesCategory = selectedCategory === "all" || product.category?.name === selectedCategory
    return matchesSearch && matchesCategory
  })

  const addToCart = async (product: Product) => {
    // ตรวจสอบว่าสินค้าหมดสต๊อกหรือไม่
    if (product.stock_quantity <= 0) {
      toast.error('สินค้าหมดสต๊อก', {
        id: 'out-of-stock-toast'
      })
      return
    }

    const existingItem = cartItems.find((item) => item.id === product.id)

    if (existingItem) {
      // ตรวจสอบว่าจำนวนในตระกร้า + 1 จะเกินสต๊อกหรือไม่
      if (existingItem.quantity >= product.stock_quantity) {
        toast.error('ไม่สามารถเพิ่มสินค้าได้ เนื่องจากสต๊อกไม่เพียงพอ')
        return
      }
      
      setCartItems(cartItems.map((item) => 
        item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
      ))
    } else {
      const cartItem: CartItem = {
        id: product.id,
        product_name: product.product_name,
        sale_price: product.sale_price,
        unit: product.unit || '',
        pack_size: product.pack_size || '',
        quantity: 1,
        sku: product.sku || '',
        barcode: product.barcode || '',
        stock_quantity: product.stock_quantity || 0,
        vat_percent: product.vat_percent || 0
      }
      setCartItems([...cartItems, cartItem])
    }
    
    logger.debug('Product added to cart', { productId: product.id, productName: product.product_name }, 'POS')
    
    // ตรวจสอบสต๊อกหลังจากเพิ่มสินค้าเข้าตระกร้า
    await checkStockWarnings(product)
  }

  const removeFromCart = (productId: string) => {
    setCartItems(cartItems.filter((item) => item.id !== productId))
  }

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId)
      return
    }

    // หาสินค้าในตระกร้าและสินค้าจาก products
    const cartItem = cartItems.find((item) => item.id === productId)
    const product = products.find((p) => p.id === productId)
    
    if (cartItem && product) {
      // ตรวจสอบว่าจำนวนใหม่จะเกินสต๊อกหรือไม่
      if (quantity > product.stock_quantity) {
        toast.error('ไม่สามารถเพิ่มสินค้าได้ เนื่องจากสต๊อกไม่เพียงพอ')
        return
      }
    }

    setCartItems(cartItems.map((item) => 
      item.id === productId ? { ...item, quantity } : item
    ))
  }

  // คำนวณยอดรวมก่อน VAT
  const calculateCartSubtotal = () => {
    return calculateSubtotal(cartItems)
  }

  // คำนวณ VAT รวม
  const calculateCartTotalVAT = () => {
    return calculateTotalVAT(cartItems)
  }

  // คำนวณยอดรวมสุทธิ (รวม VAT)
  const calculateTotal = () => {
    return calculateGrandTotal(cartItems)
  }

  const calculateChange = () => {
    if (paymentMethod === "promptpay") {
      return 0 // PromptPay doesn't have change
    }
    return paymentAmount - calculateTotal()
  }

  const getTotalPaymentAmount = () => {
    if (paymentMethod === "promptpay") {
      return promptPayAmount
    }
    return paymentAmount
  }

  // Customer search functions
  const searchCustomerByPhone = async (phone: string) => {
    if (!phone || phone.length < 3) {
      setCustomerSearchResults([])
      return
    }

    try {
      setIsSearchingCustomer(true)
      const response = await GraphQLAPI.searchPatients(phone)
      setCustomerSearchResults(response.searchPatients || [])
    } catch (error) {
      logger.error('Failed to search customer by phone', error, 'POS')
      setCustomerSearchResults([])
    } finally {
      setIsSearchingCustomer(false)
    }
  }

  const selectCustomer = (customer: Patient) => {
    setSelectedCustomer(customer)
    setCustomerPhone(customer.phone || "")
    setShowCustomerSearch(false)
    setCustomerSearchResults([])
    
    // ดึงข้อมูลทางการแพทย์
    fetchCustomerMedicalInfo(customer)
  }

  const clearCustomer = () => {
    setSelectedCustomer(null)
    setCustomerPhone("")
    setCustomerSearchResults([])
    setCustomerMedicalInfo(null)
  }

  // ดึงข้อมูลทางการแพทย์ของลูกค้า
  const fetchCustomerMedicalInfo = async (patient: Patient) => {
    try {
      setIsLoadingMedicalInfo(true)
      
      // ดึงข้อมูลแพ้ยาและโรคประจำตัวจากข้อมูลผู้ป่วย
      const allergies: string[] = []
      const chronicDiseases: string[] = []
      
      // ประมวลผลข้อมูลแพ้ยา
      if (patient.drug_allergies) {
        const drugAllergies = parseDrugAllergies(patient.drug_allergies)
        allergies.push(...drugAllergies)
      }
      
      // ประมวลผลข้อมูลโรคประจำตัว
      if (patient.medical_conditions && patient.medical_conditions.trim() !== '') {
        chronicDiseases.push(patient.medical_conditions)
      }
      
      setCustomerMedicalInfo({
        allergies: [...new Set(allergies)].slice(0, 5), // เอาแค่ 5 อันแรก
        chronicDiseases: [...new Set(chronicDiseases)].slice(0, 5)
      })
      
    } catch (error: any) {
      console.error('Error fetching medical info:', error)
      setCustomerMedicalInfo(null)
    } finally {
      setIsLoadingMedicalInfo(false)
    }
  }

  const handleCheckout = () => {
    if (cartItems.length === 0) return
    
    // ตั้งค่าจำนวนเงินเริ่มต้นเป็นยอดรวมพอดี
    setPaymentAmount(calculateTotal())
    setPromptPayAmount(calculateTotal())
    setShowPaymentDialog(true)
  }

  const handlePaymentConfirm = async () => {
    // ป้องกันการเรียกซ้ำ
    if (isProcessingPayment) {
      console.log(`⚠️ การชำระเงินกำลังดำเนินการอยู่ กรุณารอ...`)
      logger.warn('Payment already processing, ignoring duplicate call', {}, 'POS')
      return
    }
    
    // ตรวจสอบว่ามีสินค้าในตะกร้าหรือไม่
    if (cartItems.length === 0) {
      logger.warn('No items in cart, ignoring payment call', {}, 'POS')
      return
    }
    
    setIsProcessingPayment(true)
    const change = calculateChange()
    
    // สร้าง unique ID สำหรับการติดตาม
    const paymentSessionId = `payment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    console.log(`🚀 [${paymentSessionId}] เริ่มชำระเงิน: ${cartItems.length} รายการ, ยอดรวม: ฿${calculateTotal().toFixed(2)}`)
    
    logger.info('Payment session started', {
      sessionId: paymentSessionId,
      cartItemsCount: cartItems.length,
      totalAmount: calculateTotal(),
      paymentAmount: paymentAmount
    }, 'POS')
    
    try {
      logger.info('Processing payment', {
        sessionId: paymentSessionId,
        total: calculateTotal(),
        received: paymentAmount,
        change,
        items: cartItems.length,
        method: paymentMethod
      }, 'POS')

      // สร้าง Order Items พร้อม VAT ของแต่ละรายการ
      const orderItems = cartItems.map(item => createOrderItemWithVAT(item))

      // สร้าง Order
      const orderInput = {
        status: "completed",
        total_amount: calculateTotal(),
        vat_amount: calculateCartTotalVAT(),
        is_walkin: !selectedCustomer, // ถ้ามีลูกค้าเลือกแล้วไม่ใช่ walk-in
        patientId: selectedCustomer?.id || null, // เพิ่ม patientId
        orderItems: orderItems
      }

      logger.info('Creating order', { 
        sessionId: paymentSessionId,
        orderInput 
      }, 'POS')
      const orderResponse = await GraphQLAPI.createOrder(orderInput)
      
      if (!orderResponse.createOrder) {
        throw new Error('Failed to create order')
      }

      const orderId = orderResponse.createOrder.id
      logger.info('Order created successfully', { 
        sessionId: paymentSessionId,
        orderId 
      }, 'POS')

      // สร้าง Payment
      const paymentInput = {
        orderId: orderId,
        payment_type: paymentMethod === "promptpay" ? "promptpay" : paymentMethod,
        amount: calculateTotal(), // ใช้ยอดรวมที่แท้จริงแทน paymentAmount
        details: `ชำระด้วย${paymentMethod === 'cash' ? 'เงินสด' : paymentMethod === 'credit_card' ? 'บัตรเครดิต' : 'พร้อมเพย์'} รับเงิน ฿${getTotalPaymentAmount().toFixed(2)} เงินทอน ฿${change.toFixed(2)}`
      }

      logger.info('Creating payment', { 
        sessionId: paymentSessionId,
        paymentInput 
      }, 'POS')
      const paymentResponse = await GraphQLAPI.processPayment(paymentInput)
      
      if (!paymentResponse.processPayment) {
        throw new Error('Failed to process payment')
      }

      logger.info('Payment processed successfully', { 
        sessionId: paymentSessionId,
        paymentId: paymentResponse.processPayment.id 
      }, 'POS')

      // สต๊อกถูกลดอัตโนมัติใน createOrder mutation แล้ว
      console.log(`✅ [${paymentSessionId}] สต๊อกถูกลดอัตโนมัติใน createOrder แล้ว`)
      
      logger.info('Stock automatically adjusted in createOrder', {
        sessionId: paymentSessionId,
        totalItems: cartItems.length,
        orderId: orderId
      }, 'POS')
      

      // สร้างเลขใบเสร็จ
      const receiptNumber = generateReceiptNumber(orderId)
      
      console.log(`🎉 [${paymentSessionId}] ชำระเงินสำเร็จ! เลขใบเสร็จ: ${receiptNumber}`)
      
      // Link order to visit if this is a prescription visit
      if (prescriptionVisitData?.visitId) {
        try {
          await GraphQLAPI.linkOrderToVisit({
            visitId: prescriptionVisitData.visitId,
            orderId: orderId
          })
          console.log(`✅ [${paymentSessionId}] Order linked to visit successfully`)
        } catch (linkError) {
          console.error('Error linking order to visit:', linkError)
          // Don't fail the payment if linking fails
        }
      }
      
      // เตรียมข้อมูล order สำหรับแสดงผล
      const orderData = {
        id: orderId,
        receiptNumber: receiptNumber,
        total_amount: calculateTotal(),
        vat_amount: calculateCartTotalVAT(),
        payment_amount: getTotalPaymentAmount(),
        change: change,
        payment_method: paymentMethod,
        orderItems: cartItems.map(item => ({
          ...item,
          total_price: item.sale_price * item.quantity
        })),
        created_at: new Date().toISOString(),
        user: { username: user?.username || 'เจ้าของร้าน' },
        patient: selectedCustomer ? {
          first_name: selectedCustomer.first_name,
          last_name: selectedCustomer.last_name,
          phone: selectedCustomer.phone,
          email: selectedCustomer.email
        } : null
      }
      
      // แสดงหน้าคอนเฟิร์มการชำระเงิน
      setCompletedOrder(orderData)
      setShowPaymentSuccess(true)
      setShowPaymentDialog(false)
      
      // รีเซ็ตตะกร้า
      setCartItems([])
      setPaymentAmount(0)
      setPromptPayAmount(0)
      
      // ลบข้อมูลการสั่งยาจากหมอหลังจากชำระเงินเสร็จ
      if (prescriptionVisitData) {
        // Note: ไม่ต้องลบข้อมูลจาก QueueEvent เพราะเป็นข้อมูลประวัติศาสตร์
        // ข้อมูลการสั่งยาจะยังคงอยู่ใน QueueEvent note เพื่อการติดตาม
        
        setPrescriptionVisitData(null)
        setPrescriptionItems([])
        console.log(`🧹 [${paymentSessionId}] Prescription data cleared after payment`)
      }
      
      // ส่ง event เพื่ออัพเดตจำนวนใบเสร็จรับเงินวันนี้ใน sidebar
      window.dispatchEvent(new CustomEvent('receiptsUpdated'))
      
      // อัพเดตข้อมูลสินค้าในหน้าจอ (ไม่รีโหลดจาก API)
      setProducts(prevProducts => 
        prevProducts.map(product => {
          const cartItem = cartItems.find(item => item.id === product.id)
          if (cartItem) {
            return {
              ...product,
              stock_quantity: product.stock_quantity - cartItem.quantity
            }
          }
          return product
        })
      )
      
    } catch (error) {
      logger.error('Payment processing failed', error, 'POS')
      alert(`เกิดข้อผิดพลาดในการชำระเงิน: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsProcessingPayment(false)
    }
  }

  const handleClosePaymentSuccess = () => {
    setShowPaymentSuccess(false)
    setCompletedOrder(null)
    // รีเซ็ตข้อมูลลูกค้า
    setSelectedCustomer(null)
    setCustomerPhone("")
    setCustomerSearchResults([])
    setCustomerMedicalInfo(null)
    // ลบข้อมูลการสั่งยาจากหมอ
    setPrescriptionVisitData(null)
    setPrescriptionItems([])
    
    // Refresh หน้าจอ 1 รอบ
    window.location.reload()
  }

  // สร้าง barcode เมื่อมี completedOrder
  useEffect(() => {
    if (completedOrder && completedOrder.receiptNumber) {
      // Wait for DOM to be ready
      const timer = setTimeout(() => {
        if (barcodeRef.current) {
          try {
            // Clear any existing content
            barcodeRef.current.innerHTML = ''
            
            // Generate barcode
            JsBarcode(barcodeRef.current, completedOrder.receiptNumber, {
              format: "CODE128",
              width: 2,
              height: 60,
              displayValue: false,
              margin: 10,
              background: "white",
              lineColor: "black"
            })
          } catch (error) {
            console.error('Error generating barcode:', error)
            // Fallback: show receipt number as text if barcode fails
            if (barcodeRef.current) {
              barcodeRef.current.innerHTML = `
                <rect x="10" y="10" width="180" height="60" fill="white" stroke="black" stroke-width="1"/>
                <text x="100" y="45" text-anchor="middle" font-family="monospace" font-size="14" fill="black">${completedOrder.receiptNumber}</text>
              `
            }
          }
        }
      }, 100) // Small delay to ensure DOM is ready
      
      return () => clearTimeout(timer)
    }
  }, [completedOrder])

  const generateReceiptNumber = (orderId: string) => {
    const now = new Date()
    const year = now.getFullYear().toString().slice(-2)
    const month = (now.getMonth() + 1).toString().padStart(2, '0')
    const day = now.getDate().toString().padStart(2, '0')
    const shortId = orderId.slice(-8).toUpperCase()
    return `${year}${month}${day}-${shortId}`
  }


  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString)
    const day = date.getDate()
    const month = date.getMonth() + 1
    const year = date.getFullYear().toString().slice(-2)
    const hours = date.getHours().toString().padStart(2, '0')
    const minutes = date.getMinutes().toString().padStart(2, '0')
    return `${day}/${month}/${year}, ${hours}:${minutes}`
  }

  const getPaymentMethodThai = (method: string) => {
    switch (method) {
      case 'cash': return 'เงินสด'
      case 'credit_card': return 'บัตรเครดิต'
      case 'promptpay': return 'พร้อมเพย์'
      case 'qr': return 'พร้อมเพย์'
      default: return 'เงินสด'
    }
  }

  const handleNumberInput = (number: string) => {
    if (number === 'X') {
      // ลบตัวเลขหลังสุด
      if (paymentMethod === "promptpay") {
        setPromptPayAmount(prev => Math.floor(prev / 10))
      } else {
        setPaymentAmount(prev => Math.floor(prev / 10))
      }
    } else if (number === '.') {
      // ไม่ต้องทำอะไรสำหรับจุดทศนิยม
    } else {
      if (paymentMethod === "promptpay") {
        // ถ้าเป็นยอดรวมพอดี (เริ่มต้น) ให้รีเซตก่อน แล้วค่อยต่อข้างหลัง
        if (promptPayAmount === calculateTotal()) {
          setPromptPayAmount(parseInt(number))
        } else {
          // ต่อข้างหลังตามปกติ
          setPromptPayAmount(prev => prev * 10 + parseInt(number))
        }
      } else {
        // ถ้าเป็นยอดรวมพอดี (เริ่มต้น) ให้รีเซตก่อน แล้วค่อยต่อข้างหลัง
        if (paymentAmount === calculateTotal()) {
          setPaymentAmount(parseInt(number))
        } else {
          // ต่อข้างหลังตามปกติ
          setPaymentAmount(prev => prev * 10 + parseInt(number))
        }
      }
    }
  }



  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-500 mx-auto mb-4"></div>
          <div className="text-gray-600">กำลังโหลดข้อมูลสินค้า...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full">
      {/* ส่วนแสดงสินค้า */}
      <div className="flex-1 p-4 overflow-auto">
        {/* Search Bar */}
        <div className="relative mb-4">
          <Input
            data-testid="search-input"
            placeholder="ค้นหาสินค้าจากชื่อ หรือบาร์โค้ด..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-white text-gray-700"
          />
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 h-5 w-5" />
        </div>

        {/* Category Tabs */}
        <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="mb-4">
          <TabsList className="w-full overflow-auto text-gray-500">
            {categories.map((category) => (
              <TabsTrigger key={category.id} value={category.id} className="text-xs">
                {category.name} {category.count > 0 && `(${category.count})`}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        {/* Product Grid */}
        <div data-testid="product-grid" className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {filteredProducts.map((product) => (
            <Card
              key={product.id}
              data-testid="product-card"
              className={`bg-white shadow-sm transition-shadow ${
                product.stock_quantity > 0 
                  ? 'cursor-pointer hover:shadow-md' 
                  : 'cursor-not-allowed opacity-60'
              }`}
              onClick={() => product.stock_quantity > 0 && addToCart(product)}
            >
              <CardContent className="p-4">
                <div className="bg-gray-100 h-24 mb-2 flex items-center justify-center rounded-md overflow-hidden">
                  {product.image_url ? (
                    <img
                      src={`${API_CONFIG.BASE_URL}${product.image_url}`}
                      alt={product.product_name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none'
                        e.currentTarget.nextElementSibling?.classList.remove('hidden')
                      }}
                    />
                  ) : null}
                  <span className={`text-gray-400 text-3xl ${product.image_url ? 'hidden' : ''}`}>Rx</span>
                </div>
                <h3 data-testid="product-name" className="font-medium text-sm mb-1 line-clamp-2 text-gray-700">{product.product_name}</h3>
                <div className="text-sm text-gray-500 mb-1">
                  {product.pack_size} {product.unit}
                </div>
                <div data-testid="stock-quantity" className="text-xs text-gray-400 mb-2">
                  {product.stock_quantity > 0 ? `สต๊อก: ${product.stock_quantity}` : 'สินค้าหมด'}
                </div>
                <div data-testid="product-price" className="text-teal-600 font-medium">฿{product.sale_price.toFixed(2)}</div>
                {product.stock_quantity <= 0 && (
                  <Badge data-testid="out-of-stock-badge" variant="destructive" className="mt-1 text-xs">สินค้าหมด</Badge>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredProducts.length === 0 && (
          <div className="text-center text-gray-500 py-8">
            <div className="text-4xl mb-2">🔍</div>
            <p>ไม่พบสินค้าที่ค้นหา</p>
          </div>
        )}
      </div>

      {/* ส่วนตะกร้าสินค้า */}
      <div className="w-96 border-l bg-gray-50 flex flex-col">
        <div className="p-4 border-b bg-white">
          <h2 className="text-lg font-medium text-center text-gray-700">ตะกร้าสินค้า</h2>
        </div>

        <div className="flex-1 overflow-auto p-4">
          {/* Prescription Section */}
          {prescriptionVisitData && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center mb-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                <h3 className="font-medium text-blue-900" data-testid="prescription-title">ข้อมูลการสั่งยาจากหมอ</h3>
              </div>
              <div className="text-sm text-blue-800 space-y-1">
                <p data-testid="prescription-patient-name" ><strong>ผู้ป่วย:</strong> {prescriptionVisitData.patientName}</p>
                <p data-testid="prescription-chief-complaint"><strong>อาการ:</strong> {prescriptionVisitData.visitData?.chief_complaint || '-'}</p>
                <p data-testid="prescription-diagnosis"><strong>การวินิจฉัย:</strong> {prescriptionVisitData.visitData?.diagnosis || '-'}</p>
                
                {/* Medical Information from Patient Data */}
                {prescriptionVisitData.patientData && (
                  <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded">
                    <h4 className="text-xs font-semibold text-red-800 mb-2 flex items-center">
                      <span className="w-1.5 h-1.5 bg-red-600 rounded-full mr-1.5"></span>
                      ข้อมูลทางการแพทย์
                    </h4>
                    
                    {(() => {
                      // Parse drug allergies once to avoid redundant computation
                      const drugAllergies = parseDrugAllergies(prescriptionVisitData.patientData.drug_allergies)
                      const hasAllergies = drugAllergies.length > 0
                      const hasChronicDiseases = prescriptionVisitData.patientData.medical_conditions && 
                                               prescriptionVisitData.patientData.medical_conditions !== '-'
                      
                      return (
                        <div className="space-y-1 text-xs">
                          {/* แพ้ยา */}
                          {hasAllergies && (
                            <div>
                              <span className="font-medium text-red-700">แพ้ยา:</span>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {drugAllergies.map((drug: string, index: number) => (
                                  <span 
                                    key={index}
                                    className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800"
                                  >
                                    ⚠️ {drug}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          {/* โรคประจำตัว */}
                          {hasChronicDiseases && (
                            <div>
                              <span className="font-medium text-red-700">โรคประจำตัว:</span>
                              <div className="text-red-600 ml-2">
                                {prescriptionVisitData.patientData.medical_conditions}
                              </div>
                            </div>
                          )}
                          
                          {/* ถ้าไม่มีข้อมูลแพ้ยาและโรคประจำตัว */}
                          {!hasAllergies && !hasChronicDiseases && (
                            <div className="text-red-600 italic">
                              ไม่มีข้อมูลแพ้ยาและโรคประจำตัว
                            </div>
                          )}
                        </div>
                      )
                    })()}
                  </div>
                )}
                
                {prescriptionVisitData.visitData?.notes && (
                  <div className="mt-2">
                    <p><strong>แผนการรักษา:</strong></p>
                    <div data-testid="prescription-treatment-plan" className="bg-white p-2 rounded border text-xs text-gray-700 whitespace-pre-wrap">
                      {prescriptionVisitData.visitData.notes}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Cart Items */}
          {cartItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400">
              <div className="text-6xl mb-4">🛒</div>
              <p>ยังไม่มีรายการสินค้าที่ถูกเลือก</p>
              <p className="text-sm">สามารถเลือกสินค้าได้ทางด้านซ้าย</p>
            </div>
          ) : (
            <div className="space-y-4">
              {cartItems.map((item) => (
                <div key={item.id} data-testid="cart-item" className="flex items-center justify-between bg-white p-3 rounded-lg shadow-sm">
                  <div className="flex-1">
                    <h3 data-testid="product-name" className="font-medium text-sm text-gray-700">{item.product_name}</h3>
                    <div className="text-sm text-gray-500">{item.pack_size} {item.unit}</div>
                    <div className="text-teal-600">฿{item.sale_price.toFixed(2)}</div>
                    {(item.vat_percent ?? 0) > 0 && (
                      <div className="text-xs text-orange-600">VAT {item.vat_percent}%</div>
                    )}
                  </div>
                  <div className="flex items-center text-gray-500">
                    <Button
                      data-testid="decrease-quantity-button"
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                    >
                      -
                    </Button>
                    <span data-testid="quantity-display" className="w-8 text-center">{item.quantity}</span>
                    <Button
                      data-testid="increase-quantity-button"
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      disabled={item.quantity >= item.stock_quantity}
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    >
                      +
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="border-t p-4 bg-white">
          {/* Customer Selection */}
          <div className="mb-4">
            {selectedCustomer ? (
              <>
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center">
                    <Avatar className="h-10 w-10 mr-3">
                      <AvatarFallback className="bg-blue-100 text-blue-600">
                        {selectedCustomer.first_name.charAt(0)}{selectedCustomer.last_name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {selectedCustomer.first_name} {selectedCustomer.last_name}
                      </div>
                      <div className="text-xs text-gray-500">
                        {selectedCustomer.phone} • {selectedCustomer.email}
                      </div>
                    </div>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={clearCustomer}
                    className="text-red-600 hover:text-red-700"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              
              {/* Medical Information */}
              {isLoadingMedicalInfo ? (
                <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600 mr-2"></div>
                    <span className="text-sm text-red-700">กำลังโหลดข้อมูลทางการแพทย์...</span>
                  </div>
                </div>
              ) : customerMedicalInfo ? (
                <div className="mt-3 p-3 bg-red-50 border-2 border-red-300 rounded-lg">
                  <h4 className="text-sm font-semibold text-red-800 mb-2 flex items-center">
                    <span className="w-2 h-2 bg-red-600 rounded-full mr-2"></span>
                    ข้อมูลทางการแพทย์
                  </h4>
                  
                  <div className="space-y-2 text-xs">
                    {/* แพ้ยาแพ้ */}
                    {customerMedicalInfo.allergies && customerMedicalInfo.allergies.length > 0 && (
                      <div>
                        <span className="font-medium text-red-700">แพ้ยาแพ้:</span>
                        <div className="text-red-600 ml-2">
                          {customerMedicalInfo.allergies.map((allergy: string, index: number) => (
                            <div key={index}>• {allergy}</div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* โรคประจำตัว */}
                    {customerMedicalInfo.chronicDiseases && customerMedicalInfo.chronicDiseases.length > 0 && (
                      <div>
                        <span className="font-medium text-red-700">โรคประจำตัว:</span>
                        <div className="text-red-600 ml-2">
                          {customerMedicalInfo.chronicDiseases.map((disease: string, index: number) => (
                            <div key={index}>• {disease}</div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* ถ้าไม่มีข้อมูลแพ้ยาและโรคประจำตัว */}
                    {(!customerMedicalInfo.allergies || customerMedicalInfo.allergies.length === 0) &&
                     (!customerMedicalInfo.chronicDiseases || customerMedicalInfo.chronicDiseases.length === 0) && (
                      <div className="text-red-600 italic">
                        ไม่มีข้อมูลแพ้ยาและโรคประจำตัว
                      </div>
                    )}
                  </div>
                </div>
              ) : null}
              </>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center mb-2">
                  <Avatar className="h-10 w-10 mr-3 text-gray-500">
                    <AvatarFallback>C</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-500">ค้นหาลูกค้าด้วยเบอร์โทร</div>
                    <div className="text-xs text-gray-500">จากฐานข้อมูลลูกค้า</div>
                  </div>
                </div>
                
                <div className="relative">
                  <Input
                    placeholder="กรอกเบอร์โทรศัพท์..."
                    value={customerPhone}
                    onChange={(e) => {
                      setCustomerPhone(e.target.value)
                      searchCustomerByPhone(e.target.value)
                    }}
                    className="pr-10"
                  />
                  {isSearchingCustomer && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                    </div>
                  )}
                </div>
                
                {/* Customer Search Results */}
                {customerSearchResults.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-48 overflow-y-auto">
                    {customerSearchResults.map((customer) => (
                      <div
                        key={customer.id}
                        className="p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                        onClick={() => selectCustomer(customer)}
                      >
                        <div className="flex items-center">
                          <Avatar className="h-8 w-8 mr-3">
                            <AvatarFallback className="bg-gray-100 text-gray-600">
                              {customer.first_name.charAt(0)}{customer.last_name.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {customer.first_name} {customer.last_name}
                            </div>
                            <div className="text-xs text-gray-500">
                              {customer.phone} • {customer.email}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="space-y-2 mb-4">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">ยอดย่อย (ไม่รวม VAT)</span>
              <span data-testid="total-amount" className="text-gray-700">฿{calculateCartSubtotal().toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">VAT</span>
              <span data-testid="vat-amount" className="text-gray-700">฿{calculateCartTotalVAT().toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-medium text-gray-700">
              <span>ยอดรวมสุทธิ</span>
              <span data-testid="grand-total" className="text-gray-700">฿{calculateTotal().toFixed(2)}</span>
            </div>
          </div>

          <Button 
            data-testid="checkout-button"
            className="w-full bg-teal-500 hover:bg-teal-600" 
            onClick={handleCheckout}
            disabled={cartItems.length === 0}
          >
            ชำระสินค้า ({cartItems.length} รายการ) ฿{calculateTotal().toFixed(2)}
          </Button>
        </div>
      </div>

      {/* Payment Dialog */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent data-testid="payment-dialog" className="max-w-4xl bg-white">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setShowPaymentDialog(false)}
                className="p-2 text-gray-700 hover:bg-gray-100"
              >
                <X className="h-4 w-4 mr-1" />
                ปิด
              </Button>
              <DialogTitle className="text-lg font-semibold text-gray-900">
                ชำระสินค้า
              </DialogTitle>
            </div>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-6 p-6">
            {/* Payment Summary */}
            <div className="space-y-4">
              <div className={`p-4 rounded-lg ${
                paymentMethod === 'cash' ? 'bg-blue-50' : 'bg-green-50'
              }`}>
                <div className="text-sm text-gray-600 mb-2">
                  ชำระด้วย {getPaymentMethodThai(paymentMethod)}
                </div>
                <div data-testid="amount-to-pay" className={`text-2xl font-bold ${
                  paymentMethod === 'cash' ? 'text-blue-600' : 'text-green-600'
                }`}>
                  ฿{getTotalPaymentAmount().toFixed(2)}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-blue-100 p-4 rounded-lg">
                  <div className="text-sm text-gray-600">ยอดที่ต้องชำระ</div>
                  <div data-testid="payment-total" className="text-xl font-bold text-blue-700">฿{calculateTotal().toFixed(2)}</div>
                </div>
                <div className={`p-4 rounded-lg ${
                  paymentMethod === 'promptpay' ? 'bg-gray-100' : 'bg-orange-100'
                }`}>
                  <div className="text-sm text-gray-600">เงินทอน</div>
                  <div className={`text-xl font-bold ${
                    paymentMethod === 'promptpay' ? 'text-gray-500' : 'text-orange-700'
                  }`}>
                    {paymentMethod === 'promptpay' ? 'ไม่มี' : `฿${calculateChange().toFixed(2)}`}
                  </div>
                </div>
              </div>



              {/* Payment Methods */}
              <div className="space-y-3">
                <h3 className="font-medium text-gray-900">เลือกช่องทางการชำระเงิน</h3>
                
                <div data-testid="payment-methods" className="space-y-2">
                  <div 
                    data-testid="payment-method-cash"
                    className={`flex items-center justify-between p-3 rounded-lg border-2 cursor-pointer transition-all ${
                      paymentMethod === 'cash' 
                        ? 'border-teal-500 bg-teal-50' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setPaymentMethod('cash')}
                  >
                    <div className="flex items-center">
                      <div className={`w-4 h-4 rounded-full border-2 mr-3 ${
                        paymentMethod === 'cash' ? 'border-teal-500 bg-teal-500' : 'border-gray-300'
                      }`}>
                        {paymentMethod === 'cash' && <Check className="w-3 h-3 text-white" />}
                      </div>
                      <span className={`font-medium ${
                        paymentMethod === 'cash' ? 'text-gray-900' : 'text-gray-700'
                      }`}>เงินสด</span>
                    </div>
                    <span className={`font-medium ${
                      paymentMethod === 'cash' ? 'text-teal-600' : 'text-gray-500'
                    }`}>฿{paymentAmount.toFixed(2)}</span>
                  </div>

                  <div 
                    className={`flex items-center justify-between p-3 rounded-lg border-2 cursor-pointer transition-all ${
                      paymentMethod === 'promptpay' 
                        ? 'border-green-500 bg-green-50' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setPaymentMethod('promptpay')}
                  >
                    <div className="flex items-center">
                      <div className={`w-4 h-4 rounded-full border-2 mr-3 ${
                        paymentMethod === 'promptpay' ? 'border-green-500 bg-green-500' : 'border-gray-300'
                      }`}>
                        {paymentMethod === 'promptpay' && <Check className="w-3 h-3 text-white" />}
                      </div>
                      <span className={`font-medium ${
                        paymentMethod === 'promptpay' ? 'text-gray-900' : 'text-gray-700'
                      }`}>พร้อมเพย์</span>
                    </div>
                    <span className={`font-medium ${
                      paymentMethod === 'promptpay' ? 'text-green-600' : 'text-gray-500'
                    }`}>฿{promptPayAmount.toFixed(2)}</span>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-lg border-2 border-gray-200 bg-gray-100 opacity-50">
                    <div className="flex items-center">
                      <div className="w-4 h-4 rounded-full border-2 border-gray-300 mr-3"></div>
                      <span className="text-gray-400">บัตรเครดิต</span>
                    </div>
                    <span className="text-gray-400">฿0.00</span>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3">
                  <span className="text-sm text-gray-600">สแกนพร้อมเพย์ โดยไม่ต้องระบุยอด</span>
                  <Switch 
                    checked={showPromptPayScan}
                    onCheckedChange={setShowPromptPayScan}
                  />
                </div>
              </div>
            </div>

            {/* Numeric Keypad */}
            <div className="space-y-4">
              {/* Numpad Instructions */}
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="text-xs text-gray-600 text-center">
                  💡 ใช้แป้นพิมพ์ Numpad หรือตัวเลขบนคีย์บอร์ดได้
                  <br />
                  <span className="text-gray-500">Enter = ยืนยัน, Backspace = ลบ</span>
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-2">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                  <Button
                    key={num}
                    data-testid={`numpad-${num}`}
                    variant="outline"
                    className="h-12 text-lg font-medium"
                    onClick={() => handleNumberInput(num.toString())}
                  >
                    {num}
                  </Button>
                ))}
                <Button
                  data-testid="numpad-dot"
                  variant="outline"
                  className="h-12 text-lg font-medium"
                  onClick={() => handleNumberInput('.')}
                >
                  .
                </Button>
                <Button
                  data-testid="numpad-0"
                  variant="outline"
                  className="h-12 text-lg font-medium"
                  onClick={() => handleNumberInput('0')}
                >
                  0
                </Button>
                <Button
                  data-testid="numpad-clear"
                  variant="outline"
                  className="h-12 text-lg font-medium"
                  onClick={() => handleNumberInput('X')}
                >
                  ลบ
                </Button>
              </div>

              <Button 
                data-testid="confirm-payment-button"
                onClick={handlePaymentConfirm}
                className={`w-full h-12 text-lg font-medium ${
                  paymentMethod === 'cash' 
                    ? 'bg-teal-500 hover:bg-teal-600' 
                    : 'bg-green-500 hover:bg-green-600'
                }`}
                disabled={getTotalPaymentAmount() < calculateTotal() || isProcessingPayment}
              >
                {isProcessingPayment ? 'กำลังประมวลผล...' : 
                  paymentMethod === 'promptpay' 
                    ? `ชำระพร้อมเพย์ ฿${getTotalPaymentAmount().toFixed(2)}`
                    : `รับชำระ ฿${getTotalPaymentAmount().toFixed(2)} (เงินทอน ฿${calculateChange().toFixed(2)})`
                }
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Payment Success Modal */}
      <Dialog open={showPaymentSuccess} onOpenChange={setShowPaymentSuccess}>
        <DialogContent data-testid="payment-success-dialog" className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white">
          <DialogHeader>
            <DialogTitle className="flex justify-between items-center">
              {/* <span className="text-teal-600 font-medium">B พิมพ์ฉลากยา</span>
              <div className="flex space-x-4 text-teal-600">
                <button className="hover:underline text-sm">พิมพ์ใบเสร็จรับเงิน</button>
                <button className="hover:underline text-sm">เปิดลิ้นชักเก็บเงิน</button>
              </div> */}
            </DialogTitle>
          </DialogHeader>

          {completedOrder && (
            <div className="space-y-6 bg-white">
              {/* Success Icon */}
              <div className="flex justify-center">
                <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center">
                  <Check className="w-10 h-10 text-white" />
                </div>
              </div>
              
              {/* Payment Confirmation */}
              <div className="bg-white border border-gray-200 rounded-lg p-6 text-center">
                <h2 data-testid="success-message" className="text-xl font-bold text-gray-900 mb-2">
                  รับชำระ ฿{completedOrder.payment_amount.toFixed(2)}
                </h2>
                <p className="text-gray-600">
                  {completedOrder.change === 0 
                    ? 'รับชำระพอดี ไม่มีเงินทอน' 
                    : `เงินทอน ฿${completedOrder.change.toFixed(2)}`
                  }
                </p>
              </div>

              {/* Receipt */}
              <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
                {/* Receipt Header with decorative top edge */}
                <div className="relative">
                  {/* Decorative wavy top edge */}
                  <div className="absolute top-0 left-0 right-0 h-2 bg-white">
                    <svg viewBox="0 0 400 20" className="w-full h-full">
                      <path d="M0,10 Q50,0 100,10 T200,10 T300,10 T400,10 L400,20 L0,20 Z" fill="white" />
                    </svg>
                  </div>
                  
                  <div className="text-center p-4 pt-6">
                    <h3 className="text-lg font-bold text-black">ใบเสร็จรับเงิน / RECEIPT</h3>
                    <p className="text-sm text-gray-600">SN clinic</p>
                  </div>
                </div>

                {/* Receipt Details */}
                <div className="p-4 space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">ชำระเมื่อ:</span>
                    <span className="text-black">{formatDateTime(completedOrder.created_at)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">ออกโดย:</span>
                    <span className="text-black">{completedOrder.user.username}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">ลูกค้า:</span>
                    <span className="text-black">
                      {completedOrder.patient 
                        ? `${completedOrder.patient.first_name} ${completedOrder.patient.last_name}`
                        : '-'
                      }
                    </span>
                  </div>
                  
                  {/* Barcode Section - Centered and prominent */}
                  <div className="text-center py-4 border-t border-b border-gray-200">
                    <div className="bg-white p-4 rounded-lg">
                      <svg 
                        ref={barcodeRef} 
                        className="mx-auto block"
                        width="200"
                        height="80"
                        viewBox="0 0 200 80"
                      ></svg>
                      <p data-testid="receipt-number" className="text-xs text-black mt-3 font-mono tracking-wider">{completedOrder.receiptNumber}</p>
                    </div>
                  </div>

                  {/* Items */}
                  <div data-testid="receipt-items" className="space-y-2">
                    {completedOrder.orderItems.map((item: any) => (
                      <div key={item.id} className="flex justify-between items-start">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-black">{item.product_name}</p>
                          <p className="text-xs text-gray-600">
                            ฿{item.sale_price.toFixed(2)} x{item.quantity} ({item.unit})
                          </p>
                        </div>
                        <span className="text-sm font-medium text-black">฿{item.total_price.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>

                  {/* Summary */}
                  <div className="border-t pt-3 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-black">สินค้า {completedOrder.orderItems.length} รายการ</span>
                      <span className="text-black">฿{(completedOrder.total_amount - (completedOrder.vat_amount || 0)).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-black">VAT</span>
                      <span className="text-black">฿{(completedOrder.vat_amount || 0).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between font-bold">
                      <span className="text-black">ยอดสุทธิ</span>
                      <span data-testid="receipt-total" className="text-black">฿{completedOrder.total_amount.toFixed(2)}</span>
                    </div>
                  </div>

                  {/* Payment Info */}
                  <div className="border-t pt-3 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-black">ช่องทางการชำระ</span>
                      <span data-testid="receipt-payment-method" className="text-black">{getPaymentMethodThai(completedOrder.payment_method)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-black">รับเงิน</span>
                      <span className="text-black">฿{completedOrder.payment_amount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-black">เงินทอน</span>
                      <span className="text-black">฿{completedOrder.change.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div className="flex justify-center">
                <Button
                  data-testid="close-success-dialog"
                  onClick={handleClosePaymentSuccess}
                  className="bg-teal-600 hover:bg-teal-700 text-white px-8 py-3"
                >
                  รับชำระ ฿{completedOrder.payment_amount.toFixed(2)} ({completedOrder.change === 0 ? 'ไม่มีเงินทอน' : `เงินทอน ฿${completedOrder.change.toFixed(2)}`})
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
