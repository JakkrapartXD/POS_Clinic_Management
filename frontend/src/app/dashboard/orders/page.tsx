'use client'

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, CheckCircle, ArrowRight, Printer, Edit } from "lucide-react"
import PageGuard from "@/components/guards/page-guard"
import { GraphQLAPI } from "@/clients/graphql"
import { logger } from "@/lib/logger"
import { getOrderItemDisplayName } from "@/utils/product-display"
import ProductList from "@/components/ui/product-list"

interface Order {
  id: string
  order_date: string
  status: string
  total_amount: number
  is_walkin: boolean
  created_at: string
  updated_at: string
  orderItems: OrderItem[]
  payments: Payment[]
  patient?: {
    id: string
    first_name: string
    last_name: string
  }
  user?: {
    id: string
    username: string
  }
}

interface OrderItem {
  id: string
  quantity: number
  unit_price: number
  total_price: number
  product_name?: string
  product_unit?: string
  product: {
    id: string
    product_name: string
    sku: string
    unit?: string
  }
}

interface Payment {
  id: string
  payment_type: string
  amount: number
  payment_date: string
  details: string
}

export default function OrdersPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [orders, setOrders] = useState<Order[]>([])
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([])
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)

  // ดึงข้อมูลคำสั่งซื้อวันนี้
  const fetchTodayOrders = async () => {
    try {
      setLoading(true)
      const today = new Date()
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate())
      const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59)

      const response = await GraphQLAPI.getTodayOrders({
        date_from: startOfDay.toISOString(),
        date_to: endOfDay.toISOString()
      })

      if (response.orders?.orders) {
        setOrders(response.orders.orders)
        setFilteredOrders(response.orders.orders)
        
        // เลือกคำสั่งซื้อแรกเป็นค่าเริ่มต้น
        if (response.orders.orders.length > 0) {
          setSelectedOrder(response.orders.orders[0])
        }
      }
    } catch (error) {
      logger.error('Failed to fetch today orders', error, 'Orders')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTodayOrders()
    
    // รับ event เมื่อมีการชำระเงินใหม่
    const handleReceiptsUpdated = () => {
      fetchTodayOrders()
    }
    
    window.addEventListener('receiptsUpdated', handleReceiptsUpdated)
    
    // Cleanup event listener
    return () => {
      window.removeEventListener('receiptsUpdated', handleReceiptsUpdated)
    }
  }, [])

  useEffect(() => {
    const filtered = orders.filter(order => {
      const receiptNumber = generateReceiptNumber(order.id)
      return receiptNumber.toLowerCase().includes(searchTerm.toLowerCase())
    })
    setFilteredOrders(filtered)
  }, [searchTerm, orders])

  // สร้างเลขใบเสร็จรูปแบบ YYMMDD-เลขใบเสร็จ
  const generateReceiptNumber = (orderId: string) => {
    const now = new Date()
    const year = now.getFullYear().toString().slice(-2)
    const month = (now.getMonth() + 1).toString().padStart(2, '0')
    const day = now.getDate().toString().padStart(2, '0')
    const receiptNumber = orderId.slice(-8).toUpperCase()
    return `${year}${month}${day}-${receiptNumber}`
  }

  // แปลงเวลาจาก ISO string เป็น HH:MM
  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString('th-TH', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    })
  }

  // แปลงวันที่จาก ISO string เป็น DD MMM YYYY HH:MM:SS
  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('th-TH', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    }) + ' ' + date.toLocaleTimeString('th-TH', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    })
  }

  // แปลง payment_type เป็นภาษาไทย
  const getPaymentTypeThai = (paymentType: string) => {
    switch (paymentType) {
      case 'cash': return 'เงินสด'
      case 'credit_card': return 'บัตรเครดิต'
      case 'qr': return 'พร้อมเพย์'
      default: return paymentType
    }
  }

  if (loading) {
    return (
      <PageGuard requiredPermission="orders">
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto mb-4"></div>
            <div className="text-gray-600">กำลังโหลดข้อมูลคำสั่งซื้อวันนี้...</div>
          </div>
        </div>
      </PageGuard>
    )
  }

  return (
    <PageGuard requiredPermission="orders">
      <div className="flex h-screen bg-gray-50">
        {/* Left Sidebar - รายการใบเสร็จ */}
        <div className="w-1/3 bg-white border-r border-gray-200 flex flex-col">
          {/* Header */}
          <div className="p-6 border-b border-gray-200">
            <h1 className="text-xl font-bold text-gray-900">ใบเสร็จรับเงินวันนี้</h1>
          </div>

          {/* Search Bar */}
          <div className="p-4 border-b border-gray-200">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="ค้นหาเลขที่ใบเสร็จรับเงินวันนี้..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Receipt List */}
          <div className="flex-1 overflow-y-auto">
            {filteredOrders.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                ไม่มีใบเสร็จรับเงินวันนี้
              </div>
            ) : (
              filteredOrders.map((order) => {
                const receiptNumber = generateReceiptNumber(order.id)
                const isSelected = selectedOrder?.id === order.id
                const payment = order.payments[0] // ใช้ payment แรก

                return (
                  <div
                    key={order.id}
                    className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 ${
                      isSelected ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                    }`}
                    onClick={() => setSelectedOrder(order)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span className="font-medium text-gray-900">{receiptNumber}</span>
                      </div>
                      <ArrowRight className="h-4 w-4 text-gray-400" />
                    </div>
                    <div className="flex items-center justify-between text-sm text-gray-600">
                      <span>เวลา {formatTime(order.created_at)}</span>
                      <span className="font-medium">฿{order.total_amount.toFixed(2)}</span>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* Right Section - รายละเอียดใบเสร็จ */}
        <div className="flex-1 flex flex-col">
          {selectedOrder ? (
            <>
              {/* Header */}
              <div className="p-6 border-b border-gray-200 bg-white">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900">
                    {generateReceiptNumber(selectedOrder.id)}
                  </h2>
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm">
                      <Printer className="w-4 h-4 mr-2" />
                      พิมพ์เอกสาร
                    </Button>
                    <Button variant="outline" size="sm">
                      <Edit className="w-4 h-4 mr-2" />
                      แก้ไข
                    </Button>
                  </div>
                </div>
              </div>

              {/* Receipt Details */}
              <div className="flex-1 p-6 overflow-y-auto">
                <Card>
                  <CardContent className="p-6 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-600">เลขที่ใบเสร็จรับเงิน</label>
                        <p className="text-gray-900">{generateReceiptNumber(selectedOrder.id)}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">เลขที่อ้างอิง</label>
                        <p className="text-gray-900">-</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">เลขที่อ้างอิง (2)</label>
                        <p className="text-gray-900">-</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">สถานะการชำระ</label>
                        <p className="text-gray-900">
                          ชำระแล้ว ({formatDateTime(selectedOrder.payments[0]?.payment_date || selectedOrder.created_at)})
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">สถานะการตัดสต๊อกสินค้า</label>
                        <p className="text-gray-900">
                          สำเร็จ ({formatDateTime(selectedOrder.updated_at)})
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">สถานะการบันทึกรายงาน ข.ย.</label>
                        <p className="text-gray-900">
                          สำเร็จ ({formatDateTime(selectedOrder.payments[0]?.payment_date || selectedOrder.created_at)})
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">ช่องทางการชำระ</label>
                        <p className="text-gray-900">
                          {getPaymentTypeThai(selectedOrder.payments[0]?.payment_type || 'cash')}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">สาขา</label>
                        <p className="text-gray-900">SN clinic</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">ผู้ออกใบเสร็จรับเงิน</label>
                        <p className="text-gray-900">SN clinic</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">ลูกค้า</label>
                        <p className="text-gray-900">
                          {selectedOrder.patient 
                            ? `${selectedOrder.patient.first_name} ${selectedOrder.patient.last_name}`
                            : selectedOrder.is_walkin ? 'ลูกค้าทั่วไป' : '-'
                          }
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">ราคาเฉพาะสินค้า</label>
                        <p className="text-gray-900">฿{selectedOrder.total_amount.toFixed(2)}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">ส่วนลด</label>
                        <p className="text-gray-900">-</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">VAT7% (7%)</label>
                        <p className="text-gray-900">-</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">มูลค่าใบเสร็จรับเงิน</label>
                        <p className="text-gray-900 font-semibold">฿{selectedOrder.total_amount.toFixed(2)}</p>
                      </div>
                      <div className="md:col-span-2">
                        <label className="text-sm font-medium text-gray-600">หมายเหตุท้ายเอกสาร</label>
                        <p className="text-gray-900">-</p>
                      </div>
                      <div className="md:col-span-2">
                        <label className="text-sm font-medium text-gray-600">หมายเหตุเฉพาะร้านค้า</label>
                        <p className="text-gray-900">-</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* รายการสินค้า */}
                <div className="mt-6">
                  <ProductList
                    items={selectedOrder.orderItems}
                    title="รายการสินค้า"
                    showTotal={true}
                    getDisplayName={getOrderItemDisplayName}
                  />
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center text-gray-500">
                <p>เลือกใบเสร็จเพื่อดูรายละเอียด</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </PageGuard>
  )
} 