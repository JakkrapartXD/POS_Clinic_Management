'use client'

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  TrendingUp,
  TrendingDown,
  BarChart3,
  PieChart,
  Activity,
  Users,
  Package,
  Calendar,
  Target,
  AlertCircle,
  CheckCircle,
  Clock
} from "lucide-react"
import PageGuard from "@/components/guards/page-guard"
import { ExportButton, ReportScheduler, ReportTemplates } from "@/components/modules/reports/export-utils"

// Mock data for advanced analytics
const performanceMetrics = {
  salesGrowth: {
    current: 15.8,
    previous: 12.3,
    trend: "up"
  },
  inventoryTurnover: {
    current: 8.5,
    previous: 7.2,
    trend: "up"
  },
  customerRetention: {
    current: 78.5,
    previous: 75.2,
    trend: "up"
  },
  profitMargin: {
    current: 23.4,
    previous: 25.1,
    trend: "down"
  }
}

const topPerformingProducts = [
  { name: "Paracetamol 500mg", sales: 45600, growth: 12.5, margin: 35.2 },
  { name: "Amoxicillin 250mg", sales: 38200, growth: 8.7, margin: 42.1 },
  { name: "Vitamin C", sales: 29800, growth: 15.3, margin: 28.6 },
  { name: "Ibuprofen 400mg", sales: 25400, growth: -2.1, margin: 31.8 },
  { name: "Aspirin 100mg", sales: 21300, growth: 5.4, margin: 29.9 }
]

const salesForecast = [
  { month: "ก.ค.", actual: 520000, forecast: 510000, variance: 2.0 },
  { month: "ส.ค.", actual: 480000, forecast: 495000, variance: -3.0 },
  { month: "ก.ย.", actual: 580000, forecast: 565000, variance: 2.7 },
  { month: "ต.ค.", actual: null, forecast: 595000, variance: null },
  { month: "พ.ย.", actual: null, forecast: 610000, variance: null },
  { month: "ธ.ค.", actual: null, forecast: 645000, variance: null }
]

const customerSegments = [
  { segment: "ลูกค้าปกติ", count: 1250, revenue: 450000, avgOrder: 360 },
  { segment: "ลูกค้า VIP", count: 89, revenue: 280000, avgOrder: 3146 },
  { segment: "ลูกค้าใหม่", count: 245, revenue: 95000, avgOrder: 388 },
  { segment: "ลูกค้าผู้สูงอายุ", count: 567, revenue: 320000, avgOrder: 564 }
]

const inventoryAnalysis = [
  { category: "ยาแก้ปวด", fastMoving: 15, slowMoving: 3, outOfStock: 1, totalValue: 125000 },
  { category: "ยาปฏิชีวนะ", fastMoving: 12, slowMoving: 5, outOfStock: 2, totalValue: 189000 },
  { category: "วิตามิน", fastMoving: 8, slowMoving: 8, outOfStock: 0, totalValue: 67000 },
  { category: "ยาแก้ไข้", fastMoving: 6, slowMoving: 4, outOfStock: 1, totalValue: 54000 },
  { category: "ครีมและยาทา", fastMoving: 4, slowMoving: 12, outOfStock: 0, totalValue: 32000 }
]

export default function AdvancedReportsPage() {
  const [selectedPeriod, setSelectedPeriod] = useState("month")
  const [selectedMetric, setSelectedMetric] = useState("sales")
  const [reportData, setReportData] = useState<any[]>([])

  useEffect(() => {
    // Simulate loading different data based on selections
    setReportData([])
  }, [selectedPeriod, selectedMetric])

  const getMetricIcon = (metric: string) => {
    switch (metric) {
      case "sales": return <TrendingUp className="h-5 w-5" />
      case "inventory": return <Package className="h-5 w-5" />
      case "customers": return <Users className="h-5 w-5" />
      default: return <BarChart3 className="h-5 w-5" />
    }
  }

  const getTrendIcon = (trend: string) => {
    return trend === "up" ? 
      <TrendingUp className="h-4 w-4 text-green-600" /> : 
      <TrendingDown className="h-4 w-4 text-red-600" />
  }

  const getTrendColor = (trend: string) => {
    return trend === "up" ? "text-green-600" : "text-red-600"
  }

  return (
    <PageGuard requiredPermission="reports">
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">รายงานขั้นสูงและการวิเคราะห์</h1>
            <p className="text-gray-600 mt-2">การวิเคราะห์เชิงลึกและการพยากรณ์</p>
          </div>
          <div className="flex space-x-2">
            <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="เลือกช่วงเวลา" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="week">รายสัปดาห์</SelectItem>
                <SelectItem value="month">รายเดือน</SelectItem>
                <SelectItem value="quarter">รายไตรมาส</SelectItem>
                <SelectItem value="year">รายปี</SelectItem>
              </SelectContent>
            </Select>
            <ExportButton data={reportData} filename="advanced_report" />
          </div>
        </div>

        {/* Performance Metrics Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">การเติบโตของยอดขาย</p>
                  <p className="text-2xl font-bold">{performanceMetrics.salesGrowth.current}%</p>
                  <div className="flex items-center mt-1">
                    {getTrendIcon(performanceMetrics.salesGrowth.trend)}
                    <span className={`text-sm ml-1 ${getTrendColor(performanceMetrics.salesGrowth.trend)}`}>
                      {Math.abs(performanceMetrics.salesGrowth.current - performanceMetrics.salesGrowth.previous).toFixed(1)}%
                    </span>
                  </div>
                </div>
                <TrendingUp className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">การหมุนเวียนสินค้า</p>
                  <p className="text-2xl font-bold">{performanceMetrics.inventoryTurnover.current}</p>
                  <div className="flex items-center mt-1">
                    {getTrendIcon(performanceMetrics.inventoryTurnover.trend)}
                    <span className={`text-sm ml-1 ${getTrendColor(performanceMetrics.inventoryTurnover.trend)}`}>
                      {Math.abs(performanceMetrics.inventoryTurnover.current - performanceMetrics.inventoryTurnover.previous).toFixed(1)}
                    </span>
                  </div>
                </div>
                <Activity className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">การรักษาลูกค้า</p>
                  <p className="text-2xl font-bold">{performanceMetrics.customerRetention.current}%</p>
                  <div className="flex items-center mt-1">
                    {getTrendIcon(performanceMetrics.customerRetention.trend)}
                    <span className={`text-sm ml-1 ${getTrendColor(performanceMetrics.customerRetention.trend)}`}>
                      {Math.abs(performanceMetrics.customerRetention.current - performanceMetrics.customerRetention.previous).toFixed(1)}%
                    </span>
                  </div>
                </div>
                <Users className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">อัตรากำไร</p>
                  <p className="text-2xl font-bold">{performanceMetrics.profitMargin.current}%</p>
                  <div className="flex items-center mt-1">
                    {getTrendIcon(performanceMetrics.profitMargin.trend)}
                    <span className={`text-sm ml-1 ${getTrendColor(performanceMetrics.profitMargin.trend)}`}>
                      {Math.abs(performanceMetrics.profitMargin.current - performanceMetrics.profitMargin.previous).toFixed(1)}%
                    </span>
                  </div>
                </div>
                <Target className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="performance" className="space-y-4">
          <TabsList>
            <TabsTrigger value="performance">ประสิทธิภาพ</TabsTrigger>
            <TabsTrigger value="forecast">การพยากรณ์</TabsTrigger>
            <TabsTrigger value="inventory">การวิเคราะห์สินค้า</TabsTrigger>
            <TabsTrigger value="customers">การวิเคราะห์ลูกค้า</TabsTrigger>
            <TabsTrigger value="automation">การทำงานอัตโนมัติ</TabsTrigger>
          </TabsList>

          <TabsContent value="performance" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>สินค้าขายดีอันดับต้น</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {topPerformingProducts.map((product, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Badge variant="outline">#{index + 1}</Badge>
                        <div>
                          <div className="font-medium">{product.name}</div>
                          <div className="text-sm text-gray-500">
                            อัตรากำไร: {product.margin}%
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">฿{product.sales.toLocaleString()}</div>
                        <div className={`text-sm flex items-center ${product.growth > 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {product.growth > 0 ? 
                            <TrendingUp className="h-3 w-3 mr-1" /> : 
                            <TrendingDown className="h-3 w-3 mr-1" />
                          }
                          {Math.abs(product.growth)}%
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="forecast" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>การพยากรณ์ยอดขาย</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {salesForecast.map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <Calendar className="h-5 w-5 text-gray-400" />
                        <div>
                          <div className="font-medium">{item.month}</div>
                          <div className="text-sm text-gray-500">
                            {item.actual ? "ข้อมูลจริง" : "การพยากรณ์"}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="flex space-x-4">
                          {item.actual && (
                            <div>
                              <div className="text-sm text-gray-500">ยอดขายจริง</div>
                              <div className="font-semibold">฿{item.actual.toLocaleString()}</div>
                            </div>
                          )}
                          <div>
                            <div className="text-sm text-gray-500">การพยากรณ์</div>
                            <div className="font-semibold text-blue-600">฿{item.forecast.toLocaleString()}</div>
                          </div>
                          {item.variance && (
                            <div>
                              <div className="text-sm text-gray-500">ความแตกต่าง</div>
                              <div className={`font-semibold ${item.variance > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {item.variance > 0 ? '+' : ''}{item.variance}%
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="inventory" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>การวิเคราะห์สินค้าคงคลังตามหมวดหมู่</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {inventoryAnalysis.map((category, index) => (
                    <div key={index} className="p-4 border rounded-lg">
                      <div className="flex justify-between items-center mb-3">
                        <h3 className="font-medium">{category.category}</h3>
                        <div className="text-sm font-semibold">
                          มูลค่า: ฿{category.totalValue.toLocaleString()}
                        </div>
                      </div>
                      <div className="grid grid-cols-4 gap-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-green-600">{category.fastMoving}</div>
                          <div className="text-xs text-gray-500">ขายดี</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-yellow-600">{category.slowMoving}</div>
                          <div className="text-xs text-gray-500">ขายช้า</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-red-600">{category.outOfStock}</div>
                          <div className="text-xs text-gray-500">สินค้าหมด</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-blue-600">
                            {category.fastMoving + category.slowMoving + category.outOfStock}
                          </div>
                          <div className="text-xs text-gray-500">รวม</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="customers" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>การแบ่งกลุ่มลูกค้า</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {customerSegments.map((segment, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Users className="h-5 w-5 text-gray-400" />
                        <div>
                          <div className="font-medium">{segment.segment}</div>
                          <div className="text-sm text-gray-500">
                            {segment.count.toLocaleString()} คน
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">฿{segment.revenue.toLocaleString()}</div>
                        <div className="text-sm text-gray-500">
                          เฉลี่ย ฿{segment.avgOrder.toLocaleString()}/คำสั่งซื้อ
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="automation" className="space-y-6">
            {/* Report Scheduler */}
            <ReportScheduler 
              onSchedule={(schedule) => {
                console.log("Scheduled:", schedule)
                // Handle scheduling logic here
              }}
            />

            {/* Report Templates */}
            <ReportTemplates 
              templates={[]}
              onUseTemplate={(templateId) => {
                console.log("Using template:", templateId)
                // Handle template usage here
              }}
            />
          </TabsContent>
        </Tabs>
      </div>
    </PageGuard>
  )
}

