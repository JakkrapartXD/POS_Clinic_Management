"use client"

import { useState, useEffect } from "react"
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



interface Product {
  id: string
  product_name: string
  sale_price: number
  unit: string
  pack_size: string
  stock_quantity: number
  sku: string
  barcode: string
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

  // สร้างเลขใบเสร็จรูปแบบ YYMMDD-เลขใบเสร็จ
  const generateReceiptNumber = (orderId: string) => {
    const now = new Date()
    const year = now.getFullYear().toString().slice(-2) // ปีคศสองตัวท้าย
    const month = (now.getMonth() + 1).toString().padStart(2, '0') // เดือน
    const day = now.getDate().toString().padStart(2, '0') // วัน
    
    // ใช้ orderId 4 ตัวท้ายเป็นเลขใบเสร็จ
    const receiptNumber = orderId.slice(-4)
    
    return `${year}${month}${day}-${receiptNumber}`
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

      // ลดจำนวนสต๊อกสินค้า - ใช้ for loop แทน Promise.all เพื่อป้องกันการเรียกซ้ำ
      console.log(`🔄 [${paymentSessionId}] เริ่มลดสต๊อก ${cartItems.length} รายการ`)
      
      logger.info('Starting stock adjustment process', {
        sessionId: paymentSessionId,
        totalItems: cartItems.length,
        items: cartItems.map(item => ({
          productId: item.id,
          productName: item.product_name,
          quantity: item.quantity,
          currentStock: item.stock_quantity
        })),
        orderId: orderId
      }, 'POS')
      
      // เก็บรายการสินค้าที่ลดสต๊อกแล้วเพื่อป้องกันการลดซ้ำ
      const processedProducts = new Set()
      const stockAdjustmentResults: Array<{
        success: boolean
        productId: string
        productName: string
        adjustment?: number
        newStock?: number
        error?: string
      }> = []
      
      // ใช้ for loop แทน Promise.all เพื่อป้องกันการเรียกซ้ำ
      for (const item of cartItems) {
        // ตรวจสอบว่าได้ลดสต๊อกสินค้านี้แล้วหรือไม่
        if (processedProducts.has(item.id)) {
          console.log(`⚠️ [${paymentSessionId}] สินค้า ${item.product_name} ได้ลดสต๊อกแล้ว ข้ามไป`)
          logger.warn('Product already processed, skipping', {
            sessionId: paymentSessionId,
            productId: item.id,
            productName: item.product_name
          }, 'POS')
          stockAdjustmentResults.push({
            success: false,
            productId: item.id,
            productName: item.product_name,
            error: 'Product already processed'
          })
          continue
        }
        
        processedProducts.add(item.id)
        try {
          const stockAdjustment = -item.quantity // ลดจำนวนสต๊อก
          
          // ตรวจสอบว่าจำนวนที่ขายไม่เกินสต๊อก
          if (item.quantity > item.stock_quantity) {
            throw new Error(`สินค้า ${item.product_name} มีสต๊อกไม่เพียงพอ (มี: ${item.stock_quantity}, ขาย: ${item.quantity})`)
          }
          
          console.log(`📦 [${paymentSessionId}] ลดสต๊อก: ${item.product_name} (ขาย: ${item.quantity}, สต๊อกเก่า: ${item.stock_quantity})`)
          
          logger.info('Adjusting stock before', { 
            sessionId: paymentSessionId,
            productId: item.id,
            productName: item.product_name,
            soldQuantity: item.quantity,
            adjustment: stockAdjustment,
            currentStock: item.stock_quantity,
            expectedNewStock: item.stock_quantity + stockAdjustment,
            orderId: orderId
          }, 'POS')
          
                    const response = await GraphQLAPI.adjustStock(item.id, stockAdjustment, `ขายผ่าน POS - Order ${orderId}`)
          
          // ดึงข้อมูลสินค้าที่อัพเดตแล้วเพื่อแสดงผลที่ถูกต้อง
          const productResponse = await GraphQLAPI.getProduct(item.id)
          const updatedProduct = productResponse.product
          
          console.log(`✅ [${paymentSessionId}] ลดสต๊อกสำเร็จ: ${item.product_name} (สต๊อกใหม่: ${updatedProduct.stock_quantity})`)
          
          logger.info('Stock adjusted after', { 
            sessionId: paymentSessionId,
            productId: item.id,
            productName: item.product_name,
            soldQuantity: item.quantity,
            adjustment: stockAdjustment,
            oldStock: item.stock_quantity,
            actualNewStock: updatedProduct.stock_quantity,
            expectedNewStock: item.stock_quantity + stockAdjustment,
            stockMovementId: response.adjustStock?.id,
            orderId: orderId
          }, 'POS')
          
          stockAdjustmentResults.push({
            success: true,
            productId: item.id,
            productName: item.product_name,
            adjustment: stockAdjustment,
            newStock: updatedProduct.stock_quantity
          })
        } catch (error) {
          logger.error('Failed to adjust stock', { 
            productId: item.id,
            productName: item.product_name,
            error 
          }, 'POS')
          
          stockAdjustmentResults.push({
            success: false,
            productId: item.id,
            productName: item.product_name,
            error: error instanceof Error ? error.message : 'Unknown error'
          })
        }
      }
      
      // Log สรุปผลการลดสต๊อก
      const successfulAdjustments = stockAdjustmentResults.filter(result => result.success)
      const failedAdjustments = stockAdjustmentResults.filter(result => !result.success)
      
      console.log(`🎯 [${paymentSessionId}] สรุปการลดสต๊อก: สำเร็จ ${successfulAdjustments.length}/${cartItems.length} รายการ`)
      
      logger.info('Stock adjustment summary', {
        sessionId: paymentSessionId,
        totalItems: cartItems.length,
        successfulAdjustments: successfulAdjustments.length,
        failedAdjustments: failedAdjustments.length,
        orderId: orderId,
        results: stockAdjustmentResults
      }, 'POS')
      
      if (failedAdjustments.length > 0) {
        logger.error('Some stock adjustments failed', {
          failedAdjustments,
          orderId: orderId
        }, 'POS')
      }

      // สร้างเลขใบเสร็จ
      const receiptNumber = generateReceiptNumber(orderId)
      
      console.log(`🎉 [${paymentSessionId}] ชำระเงินสำเร็จ! เลขใบเสร็จ: ${receiptNumber}`)
      
      // แสดงหน้าสรุปการชำระเงิน
      alert(`ชำระเรียบร้อยแล้ว!\nยอดรวม: ฿${calculateTotal().toFixed(2)}\nรับเงิน: ฿${paymentAmount.toFixed(2)}\nเงินทอน: ฿${change.toFixed(2)}\n\nเลขใบเสร็จ: ${receiptNumber}`)
      
      // รีเซ็ตตะกร้า
      setCartItems([])
      setShowPaymentDialog(false)
      setPaymentAmount(0)
      
      // ส่ง event เพื่ออัพเดตจำนวนใบเสร็จรับเงินวันนี้ใน sidebar
      window.dispatchEvent(new CustomEvent('receiptsUpdated'))
      
      // อัพเดตข้อมูลสินค้าในหน้าจอ (ไม่รีโหลดจาก API)
      setProducts(prevProducts => 
        prevProducts.map(product => {
          const adjustedItem = stockAdjustmentResults.find(result => 
            result.success && result.productId === product.id
          )
          if (adjustedItem && adjustedItem.newStock !== undefined) {
            return {
              ...product,
              stock_quantity: adjustedItem.newStock
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
                <div className="bg-gray-100 h-24 mb-2 flex items-center justify-center rounded-md">
                  <span className="text-gray-400 text-3xl">Rx</span>
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
    </div>
  )
}
