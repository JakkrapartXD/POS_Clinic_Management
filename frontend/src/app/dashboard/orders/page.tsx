'use client'

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Search, Eye, Package, Calendar, User, DollarSign } from "lucide-react"

// Mock data for orders
const mockOrders = [
  {
    id: "ORD-001",
    patientName: "สมใจ ใจดี",
    orderDate: "2024-01-15",
    status: "completed",
    totalAmount: 850.00,
    items: 3,
    paymentType: "cash"
  },
  {
    id: "ORD-002", 
    patientName: "สมหญิง รักษ์ดี",
    orderDate: "2024-01-15",
    status: "pending",
    totalAmount: 1200.50,
    items: 5,
    paymentType: "card"
  },
  {
    id: "ORD-003",
    patientName: "Walk-in Customer",
    orderDate: "2024-01-14",
    status: "completed",
    totalAmount: 320.00,
    items: 2,
    paymentType: "QR"
  },
]

const statusColors = {
  completed: "bg-green-100 text-green-800",
  pending: "bg-yellow-100 text-yellow-800",
  cancelled: "bg-red-100 text-red-800"
}

const statusLabels = {
  completed: "เสร็จสิ้น",
  pending: "รอดำเนินการ", 
  cancelled: "ยกเลิก"
}

export default function OrdersPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [orders, setOrders] = useState(mockOrders)
  const [filteredOrders, setFilteredOrders] = useState(mockOrders)

  useEffect(() => {
    const filtered = orders.filter(order => 
      order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.patientName.toLowerCase().includes(searchTerm.toLowerCase())
    )
    setFilteredOrders(filtered)
  }, [searchTerm, orders])

  const totalOrders = filteredOrders.length
  const totalRevenue = filteredOrders.reduce((sum, order) => sum + order.totalAmount, 0)
  const completedOrders = filteredOrders.filter(order => order.status === 'completed').length

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">คำสั่งซื้อ</h1>
        <p className="text-gray-600 mt-2">จัดการและติดตามคำสั่งซื้อของคลินิก</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">คำสั่งซื้อทั้งหมด</p>
                <p className="text-2xl font-bold">{totalOrders}</p>
              </div>
              <Package className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">เสร็จสิ้นแล้ว</p>
                <p className="text-2xl font-bold">{completedOrders}</p>
              </div>
              <Calendar className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">ยอดขายรวม</p>
                <p className="text-2xl font-bold">฿{totalRevenue.toLocaleString()}</p>
              </div>
              <DollarSign className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">ลูกค้าทั้งหมด</p>
                <p className="text-2xl font-bold">{new Set(filteredOrders.map(o => o.patientName)).size}</p>
              </div>
              <User className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle>รายการคำสั่งซื้อ</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="ค้นหาด้วยรหัสคำสั่งซื้อหรือชื่อผู้ป่วย..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline">
              <Calendar className="w-4 h-4 mr-2" />
              กรองตามวันที่
            </Button>
          </div>

          {/* Orders Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>รหัสคำสั่งซื้อ</TableHead>
                  <TableHead>ชื่อผู้ป่วย</TableHead>
                  <TableHead>วันที่สั่งซื้อ</TableHead>
                  <TableHead>สถานะ</TableHead>
                  <TableHead>จำนวนรายการ</TableHead>
                  <TableHead>ยอดรวม</TableHead>
                  <TableHead>การชำระเงิน</TableHead>
                  <TableHead>การดำเนินการ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">{order.id}</TableCell>
                    <TableCell>{order.patientName}</TableCell>
                    <TableCell>{new Date(order.orderDate).toLocaleDateString('th-TH')}</TableCell>
                    <TableCell>
                      <Badge className={statusColors[order.status as keyof typeof statusColors]}>
                        {statusLabels[order.status as keyof typeof statusLabels]}
                      </Badge>
                    </TableCell>
                    <TableCell>{order.items} รายการ</TableCell>
                    <TableCell>฿{order.totalAmount.toLocaleString()}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{order.paymentType}</Badge>
                    </TableCell>
                    <TableCell>
                      <Button variant="outline" size="sm">
                        <Eye className="w-4 h-4 mr-1" />
                        ดูรายละเอียด
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 