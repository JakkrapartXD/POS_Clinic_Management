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
}

interface Category {
  id: string
  name: string
  count: number
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
  const [showPaymentSuccess, setShowPaymentSuccess] = useState(false)
  const [completedOrder, setCompletedOrder] = useState<any>(null)
  const barcodeRef = useRef<SVGSVGElement>(null)

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
        if (paymentAmount >= calculateTotal() && !isProcessingPayment) {
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
  }, [showPaymentDialog, paymentAmount, isProcessingPayment])

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
  }, [])

  // กรองสินค้าตามการค้นหาและหมวดหมู่
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.product_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         product.sku?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         product.barcode?.includes(searchQuery)
    const matchesCategory = selectedCategory === "all" || product.category?.name === selectedCategory
    return matchesSearch && matchesCategory
  })

  const addToCart = (product: Product) => {
    const existingItem = cartItems.find((item) => item.id === product.id)

    if (existingItem) {
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
        stock_quantity: product.stock_quantity || 0
      }
      setCartItems([...cartItems, cartItem])
    }
    
    logger.debug('Product added to cart', { productId: product.id, productName: product.product_name }, 'POS')
  }

  const removeFromCart = (productId: string) => {
    setCartItems(cartItems.filter((item) => item.id !== productId))
  }

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId)
      return
    }

    setCartItems(cartItems.map((item) => 
      item.id === productId ? { ...item, quantity } : item
    ))
  }

  const calculateTotal = () => {
    return cartItems.reduce((total, item) => total + item.sale_price * item.quantity, 0)
  }

  const calculateChange = () => {
    return paymentAmount - calculateTotal()
  }


  const handleCheckout = () => {
    if (cartItems.length === 0) return
    
    // ตั้งค่าจำนวนเงินเริ่มต้นเป็นยอดรวมพอดี
    setPaymentAmount(calculateTotal())
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

      // สร้าง Order Items
      const orderItems = cartItems.map(item => ({
        productId: item.id,
        quantity: item.quantity,
        unit_price: item.sale_price,
        total_price: item.sale_price * item.quantity
      }))

      // สร้าง Order
      const orderInput = {
        status: "completed",
        total_amount: calculateTotal(),
        is_walkin: true,
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
        payment_type: paymentMethod,
        amount: calculateTotal(), // ใช้ยอดรวมที่แท้จริงแทน paymentAmount
        details: `ชำระด้วย${paymentMethod === 'cash' ? 'เงินสด' : paymentMethod === 'credit_card' ? 'บัตรเครดิต' : 'พร้อมเพย์'} รับเงิน ฿${paymentAmount.toFixed(2)} เงินทอน ฿${change.toFixed(2)}`
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
      
      // เตรียมข้อมูล order สำหรับแสดงผล
      const orderData = {
        id: orderId,
        receiptNumber: receiptNumber,
        total_amount: calculateTotal(),
        payment_amount: paymentAmount,
        change: change,
        payment_method: paymentMethod,
        orderItems: cartItems.map(item => ({
          ...item,
          total_price: item.sale_price * item.quantity
        })),
        created_at: new Date().toISOString(),
        user: { username: user?.username || 'เจ้าของร้าน' }
      }
      
      // แสดงหน้าคอนเฟิร์มการชำระเงิน
      setCompletedOrder(orderData)
      setShowPaymentSuccess(true)
      setShowPaymentDialog(false)
      
      // รีเซ็ตตะกร้า
      setCartItems([])
      setPaymentAmount(0)
      
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
      case 'qr': return 'พร้อมเพย์'
      default: return 'เงินสด'
    }
  }

  const handleNumberInput = (number: string) => {
    if (number === 'X') {
      // ลบตัวเลขหลังสุด
      setPaymentAmount(prev => Math.floor(prev / 10))
    } else if (number === '.') {
      // ไม่ต้องทำอะไรสำหรับจุดทศนิยม
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



  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto mb-4"></div>
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
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {filteredProducts.map((product) => (
            <Card
              key={product.id}
              className="bg-white shadow-sm cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => addToCart(product)}
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
                <h3 className="font-medium text-sm mb-1 line-clamp-2 text-gray-700">{product.product_name}</h3>
                <div className="text-sm text-gray-500 mb-1">
                  {product.pack_size} {product.unit}
                </div>
                <div className="text-xs text-gray-400 mb-2">
                  {product.stock_quantity > 0 ? `สต๊อก: ${product.stock_quantity}` : 'หมดสต๊อก'}
                </div>
                <div className="text-purple-600 font-medium">฿{product.sale_price.toFixed(2)}</div>
                {product.stock_quantity <= 0 && (
                  <Badge variant="destructive" className="mt-1 text-xs">หมดสต๊อก</Badge>
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
          <h2 className="text-lg font-medium text-center text-gray-700">ตะกร้าสินค้า #{Math.floor(Math.random() * 1000) + 1}</h2>
        </div>

        <div className="flex-1 overflow-auto p-4">
          {cartItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400">
              <div className="text-6xl mb-4">🛒</div>
              <p>ยังไม่มีรายการสินค้าที่ถูกเลือก</p>
              <p className="text-sm">สามารถเลือกสินค้าได้ทางด้านซ้าย</p>
            </div>
          ) : (
            <div className="space-y-4">
              {cartItems.map((item) => (
                <div key={item.id} className="flex items-center justify-between bg-white p-3 rounded-lg shadow-sm">
                  <div className="flex-1">
                    <h3 className="font-medium text-sm text-gray-700">{item.product_name}</h3>
                    <div className="text-sm text-gray-500">{item.pack_size} {item.unit}</div>
                    <div className="text-purple-600">฿{item.sale_price.toFixed(2)}</div>
                  </div>
                  <div className="flex items-center text-gray-500">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                    >
                      -
                    </Button>
                    <span className="w-8 text-center">{item.quantity}</span>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
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
          <div className="flex items-center mb-4">
            <Avatar className="h-10 w-10 mr-3 text-gray-500">
              <AvatarFallback>C</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="text-sm font-medium text-gray-500">เลือกข้อมูลลูกค้า</div>
              <div className="text-xs text-gray-500">จากฐานข้อมูลลูกค้า</div>
            </div>
            <Button variant="ghost" size="sm">
              <ChevronDown className="h-4 w-4" />
            </Button>
          </div>

          <div className="space-y-2 mb-4">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">ราคาเฉพาะสินค้า</span>
              <span className="text-gray-700">฿{calculateTotal().toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">ส่วนลด (%)</span>
              <span className="text-gray-500">0%</span>
            </div>
            <div className="flex justify-between font-medium text-gray-700">
              <span>ยอดรวมสุทธิ</span>
              <span>฿{calculateTotal().toFixed(2)}</span>
            </div>
          </div>

          <Button 
            className="w-full bg-purple-500 hover:bg-purple-600" 
            onClick={handleCheckout}
            disabled={cartItems.length === 0}
          >
            ชำระสินค้า ({cartItems.length} รายการ) ฿{calculateTotal().toFixed(2)}
          </Button>
        </div>
      </div>

      {/* Payment Dialog */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent className="max-w-4xl bg-white">
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
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="text-sm text-gray-600 mb-2">ชำระด้วย เงินสด</div>
                <div className="text-2xl font-bold text-blue-600">฿{paymentAmount.toFixed(2)}</div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-blue-100 p-4 rounded-lg">
                  <div className="text-sm text-gray-600">ยอดที่ต้องชำระ</div>
                  <div className="text-xl font-bold text-blue-700">฿{calculateTotal().toFixed(2)}</div>
                </div>
                <div className="bg-orange-100 p-4 rounded-lg">
                  <div className="text-sm text-gray-600">เงินทอน</div>
                  <div className="text-xl font-bold text-orange-700">฿{calculateChange().toFixed(2)}</div>
                </div>
              </div>



              {/* Payment Methods */}
              <div className="space-y-3">
                <h3 className="font-medium text-gray-900">สามารถแบ่งชำระได้หลายช่องทาง</h3>
                
                <div className="space-y-2">
                  <div className={`flex items-center justify-between p-3 rounded-lg border-2 ${
                    paymentMethod === 'cash' ? 'border-purple-500 bg-purple-50' : 'border-gray-200'
                  }`}>
                    <div className="flex items-center">
                      <div className={`w-4 h-4 rounded-full border-2 mr-3 ${
                        paymentMethod === 'cash' ? 'border-purple-500 bg-purple-500' : 'border-gray-300'
                      }`}>
                        {paymentMethod === 'cash' && <Check className="w-3 h-3 text-white" />}
                      </div>
                      <span className="font-medium">เงินสด</span>
                    </div>
                    <span className="text-purple-600 font-medium">฿{paymentAmount.toFixed(2)}</span>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-lg border-2 border-gray-200 bg-gray-50">
                    <div className="flex items-center">
                      <div className="w-4 h-4 rounded-full border-2 border-gray-300 mr-3"></div>
                      <span className="text-gray-500">บัตรเครดิต</span>
                    </div>
                    <span className="text-gray-400">฿0.00</span>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-lg border-2 border-gray-200 bg-gray-50">
                    <div className="flex items-center">
                      <div className="w-4 h-4 rounded-full border-2 border-gray-300 mr-3"></div>
                      <span className="text-gray-500">พร้อมเพย์</span>
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
                    variant="outline"
                    className="h-12 text-lg font-medium"
                    onClick={() => handleNumberInput(num.toString())}
                  >
                    {num}
                  </Button>
                ))}
                <Button
                  variant="outline"
                  className="h-12 text-lg font-medium"
                  onClick={() => handleNumberInput('.')}
                >
                  .
                </Button>
                <Button
                  variant="outline"
                  className="h-12 text-lg font-medium"
                  onClick={() => handleNumberInput('0')}
                >
                  0
                </Button>
                <Button
                  variant="outline"
                  className="h-12 text-lg font-medium"
                  onClick={() => handleNumberInput('X')}
                >
                  ลบ
                </Button>
              </div>

              <Button 
                onClick={handlePaymentConfirm}
                className="w-full h-12 bg-purple-500 hover:bg-purple-600 text-lg font-medium"
                disabled={paymentAmount < calculateTotal() || isProcessingPayment}
              >
                {isProcessingPayment ? 'กำลังประมวลผล...' : `รับชำระ ฿${paymentAmount.toFixed(2)} (เงินทอน ฿${calculateChange().toFixed(2)})`}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Payment Success Modal */}
      <Dialog open={showPaymentSuccess} onOpenChange={setShowPaymentSuccess}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white">
          <DialogHeader>
            <DialogTitle className="flex justify-between items-center">
              <span className="text-purple-600 font-medium">B พิมพ์ฉลากยา</span>
              <div className="flex space-x-4 text-purple-600">
                <button className="hover:underline text-sm">พิมพ์ใบเสร็จรับเงิน</button>
                <button className="hover:underline text-sm">เปิดลิ้นชักเก็บเงิน</button>
              </div>
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
                <h2 className="text-xl font-bold text-gray-900 mb-2">
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
                      <p className="text-xs text-black mt-3 font-mono tracking-wider">{completedOrder.receiptNumber}</p>
                    </div>
                  </div>

                  {/* Items */}
                  <div className="space-y-2">
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
                      <span className="text-black">฿{completedOrder.total_amount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-black">ส่วนลด (%)</span>
                      <span className="text-black">-</span>
                    </div>
                    <div className="flex justify-between font-bold">
                      <span className="text-black">ยอดสุทธิ</span>
                      <span className="text-black">฿{completedOrder.total_amount.toFixed(2)}</span>
                    </div>
                  </div>

                  {/* Payment Info */}
                  <div className="border-t pt-3 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-black">ช่องทางการชำระ</span>
                      <span className="text-black">{getPaymentMethodThai(completedOrder.payment_method)}</span>
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
                  onClick={handleClosePaymentSuccess}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-3"
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
