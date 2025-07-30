'use client'

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  BarChart3, 
  TrendingUp, 
  DollarSign, 
  Package, 
  Users, 
  Calendar,
  Download,
  Eye
} from "lucide-react"

// Mock data for reports
const salesData = {
  daily: { amount: 15650, orders: 45, growth: 12.5 },
  weekly: { amount: 89230, orders: 287, growth: 8.3 },
  monthly: { amount: 356780, orders: 1240, growth: 15.7 }
}

const topProducts = [
  { name: "Paracetamol 500mg", sold: 245, revenue: 12250 },
  { name: "Amoxicillin 250mg", sold: 189, revenue: 18900 },
  { name: "Ibuprofen 400mg", sold: 156, revenue: 9360 },
  { name: "Vitamin C", sold: 134, revenue: 6700 },
  { name: "Aspirin 100mg", sold: 98, revenue: 4900 }
]

const recentReports = [
  {
    id: "RPT-001",
    name: "รายงานยอดขายรายวัน",
    type: "sales",
    date: "2024-01-15",
    status: "completed"
  },
  {
    id: "RPT-002", 
    name: "รายงานสินค้าคงคลัง",
    type: "inventory",
    date: "2024-01-14",
    status: "completed"
  },
  {
    id: "RPT-003",
    name: "รายงานลูกค้า",
    type: "customer",
    date: "2024-01-13",
    status: "processing"
  }
]

export default function ReportsPage() {
  const [selectedPeriod, setSelectedPeriod] = useState("daily")

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">รายงานและการวิเคราะห์</h1>
        <p className="text-gray-600 mt-2">ติดตามประสิทธิภาพและสร้างรายงานต่างๆ</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">ยอดขายวันนี้</p>
                <p className="text-2xl font-bold">฿{salesData.daily.amount.toLocaleString()}</p>
                <div className="flex items-center mt-1">
                  <TrendingUp className="h-4 w-4 text-green-600 mr-1" />
                  <span className="text-sm text-green-600">+{salesData.daily.growth}%</span>
                </div>
              </div>
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">คำสั่งซื้อวันนี้</p>
                <p className="text-2xl font-bold">{salesData.daily.orders}</p>
              </div>
              <Package className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">ผลิตภัณฑ์ขายดี</p>
                <p className="text-2xl font-bold">{topProducts.length}</p>
              </div>
              <BarChart3 className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">ลูกค้าใหม่</p>
                <p className="text-2xl font-bold">28</p>
              </div>
              <Users className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="sales" className="space-y-4">
        <TabsList>
          <TabsTrigger value="sales">รายงานยอดขาย</TabsTrigger>
          <TabsTrigger value="inventory">รายงานคลังสินค้า</TabsTrigger>
          <TabsTrigger value="customer">รายงานลูกค้า</TabsTrigger>
          <TabsTrigger value="generated">รายงานที่สร้างแล้ว</TabsTrigger>
        </TabsList>

        <TabsContent value="sales" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>สรุปยอดขาย</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <Card className="border-l-4 border-l-blue-500">
                  <CardContent className="p-4">
                    <p className="text-sm text-gray-600">รายวัน</p>
                    <p className="text-xl font-bold">฿{salesData.daily.amount.toLocaleString()}</p>
                    <p className="text-sm text-gray-500">{salesData.daily.orders} คำสั่งซื้อ</p>
                  </CardContent>
                </Card>
                <Card className="border-l-4 border-l-green-500">
                  <CardContent className="p-4">
                    <p className="text-sm text-gray-600">รายสัปดาห์</p>
                    <p className="text-xl font-bold">฿{salesData.weekly.amount.toLocaleString()}</p>
                    <p className="text-sm text-gray-500">{salesData.weekly.orders} คำสั่งซื้อ</p>
                  </CardContent>
                </Card>
                <Card className="border-l-4 border-l-purple-500">
                  <CardContent className="p-4">
                    <p className="text-sm text-gray-600">รายเดือน</p>
                    <p className="text-xl font-bold">฿{salesData.monthly.amount.toLocaleString()}</p>
                    <p className="text-sm text-gray-500">{salesData.monthly.orders} คำสั่งซื้อ</p>
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold">ผลิตภัณฑ์ขายดีอันดับต้น</h3>
                <div className="space-y-2">
                  {topProducts.map((product, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Badge variant="outline">#{index + 1}</Badge>
                        <span className="font-medium">{product.name}</span>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">฿{product.revenue.toLocaleString()}</p>
                        <p className="text-sm text-gray-500">{product.sold} ชิ้น</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="inventory" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>รายงานคลังสินค้า</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">สินค้าใกล้หมด</h3>
                  <div className="space-y-2">
                    <div className="p-3 border rounded-lg border-red-200 bg-red-50">
                      <div className="flex justify-between items-center">
                        <span className="font-medium">Paracetamol 500mg</span>
                        <Badge variant="destructive">5 ชิ้น</Badge>
                      </div>
                    </div>
                    <div className="p-3 border rounded-lg border-yellow-200 bg-yellow-50">
                      <div className="flex justify-between items-center">
                        <span className="font-medium">Amoxicillin 250mg</span>
                        <Badge variant="outline" className="border-yellow-500 text-yellow-700">15 ชิ้น</Badge>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">สินค้าใกล้หมดอายุ</h3>
                  <div className="space-y-2">
                    <div className="p-3 border rounded-lg border-orange-200 bg-orange-50">
                      <div className="flex justify-between items-center">
                        <span className="font-medium">Vitamin C</span>
                        <Badge variant="outline" className="border-orange-500 text-orange-700">30 วัน</Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="customer" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>รายงานลูกค้า</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="p-4 text-center">
                    <Users className="h-8 w-8 mx-auto text-blue-600 mb-2" />
                    <p className="text-2xl font-bold">1,248</p>
                    <p className="text-sm text-gray-600">ลูกค้าทั้งหมด</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <TrendingUp className="h-8 w-8 mx-auto text-green-600 mb-2" />
                    <p className="text-2xl font-bold">28</p>
                    <p className="text-sm text-gray-600">ลูกค้าใหม่เดือนนี้</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <BarChart3 className="h-8 w-8 mx-auto text-purple-600 mb-2" />
                    <p className="text-2xl font-bold">฿2,450</p>
                    <p className="text-sm text-gray-600">ยอดซื้อเฉลี่ยต่อลูกค้า</p>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="generated" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>รายงานที่สร้างแล้ว</CardTitle>
                <Button>
                  <Download className="w-4 h-4 mr-2" />
                  สร้างรายงานใหม่
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentReports.map((report) => (
                  <div key={report.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <Calendar className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="font-medium">{report.name}</p>
                        <p className="text-sm text-gray-500">สร้างเมื่อ {new Date(report.date).toLocaleDateString('th-TH')}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Badge 
                        variant={report.status === 'completed' ? 'default' : 'secondary'}
                      >
                        {report.status === 'completed' ? 'เสร็จสิ้น' : 'กำลังประมวลผล'}
                      </Badge>
                      <Button variant="outline" size="sm">
                        <Eye className="w-4 h-4 mr-1" />
                        ดู
                      </Button>
                      <Button variant="outline" size="sm">
                        <Download className="w-4 h-4 mr-1" />
                        ดาวน์โหลด
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
} 