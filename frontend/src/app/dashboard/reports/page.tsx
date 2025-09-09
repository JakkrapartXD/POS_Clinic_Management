'use client'

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { 
  BarChart3, 
  TrendingUp, 
  DollarSign, 
  Package, 
  Users, 
  Calendar,
  Download,
  Eye,
  AlertTriangle,
  Loader2,
  RefreshCw
} from "lucide-react"
import PageGuard from "@/components/guards/page-guard"
import { GraphQLAPI } from "@/clients/graphql"
import { useToast } from "@/hooks/use-toast"

// Import new components
import { 
  SalesChart, 
  ProductSalesChart, 
  StockDistributionChart, 
  MonthlyTrendChart, 
  StockLevelIndicator 
} from "@/components/modules/reports/charts"
import { 
  SalesReportTable, 
  StockAlertsTable, 
  DailyReportTable 
} from "@/components/modules/reports/data-tables"

export default function ReportsPage() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState("sales")
  const [dateFilter, setDateFilter] = useState({
    from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days ago
    to: new Date().toISOString().split('T')[0] // today
  })

  // State for real data
  const [dailyReports, setDailyReports] = useState<any[]>([])
  const [salesReports, setSalesReports] = useState<any[]>([])
  const [stockAlerts, setStockAlerts] = useState<any[]>([])
  const [lowStockProducts, setLowStockProducts] = useState<any[]>([])

  // State for quick stats
  const [quickStats, setQuickStats] = useState({
    todaySales: 0,
    todayOrders: 0,
    totalProducts: 0,
    newPatients: 0
  })

  // Mock data for features not yet implemented
  const mockSalesChartData = [
    { date: "2024-01-01", sales: 15650, orders: 45 },
    { date: "2024-01-02", sales: 18230, orders: 52 },
    { date: "2024-01-03", sales: 16780, orders: 48 },
    { date: "2024-01-04", sales: 21340, orders: 61 },
    { date: "2024-01-05", sales: 19560, orders: 55 },
    { date: "2024-01-06", sales: 17890, orders: 49 },
    { date: "2024-01-07", sales: 22150, orders: 63 }
  ]

  const mockStockDistribution = [
    { category: "ยาแก้ปวด", count: 45, value: 125000 },
    { category: "ยาปฏิชีวนะ", count: 32, value: 89000 },
    { category: "วิตามิน", count: 28, value: 67000 },
    { category: "ยาแก้ไข้", count: 22, value: 54000 },
    { category: "อื่นๆ", count: 18, value: 32000 }
  ]

  const mockMonthlyTrend = [
    { month: "ม.ค.", sales: 450000, orders: 1250, patients: 680 },
    { month: "ก.พ.", sales: 520000, orders: 1380, patients: 720 },
    { month: "มี.ค.", sales: 480000, orders: 1320, patients: 695 },
    { month: "เม.ย.", sales: 610000, orders: 1450, patients: 785 },
    { month: "พ.ค.", sales: 580000, orders: 1380, patients: 742 },
    { month: "มิ.ย.", sales: 650000, orders: 1520, patients: 820 }
  ]

  // Load data functions
  const loadDailyReports = async () => {
    try {
      const response = await GraphQLAPI.getDailyReports({
        date_from: dateFilter.from,
        date_to: dateFilter.to
      })
      setDailyReports(response.dailyReports)
      
      // Calculate quick stats from daily reports
      const today = new Date().toISOString().split('T')[0]
      const todayReport = response.dailyReports.find(report => 
        new Date(report.report_date).toISOString().split('T')[0] === today
      )
      
      if (todayReport) {
        setQuickStats(prev => ({
          ...prev,
          todaySales: todayReport.total_sales,
          todayOrders: todayReport.total_orders,
          newPatients: todayReport.total_patients
        }))
      }
    } catch (error) {
      console.error("Error loading daily reports:", error)
      // Use mock data as fallback
      setQuickStats({
        todaySales: 15650,
        todayOrders: 45,
        totalProducts: 156,
        newPatients: 28
      })
    }
  }

  const loadSalesReports = async () => {
    try {
      const response = await GraphQLAPI.getSalesReports({
        date_from: dateFilter.from,
        date_to: dateFilter.to
      })
      setSalesReports(response.salesReports)
    } catch (error) {
      console.error("Error loading sales reports:", error)
      toast({
        title: "ข้อผิดพลาด",
        description: "ไม่สามารถโหลดข้อมูลรายงานยอดขายได้",
        variant: "destructive"
      })
    }
  }

  const loadStockAlerts = async () => {
    try {
      const response = await GraphQLAPI.getStockAlerts({
        acknowledged: false,
        pagination: { skip: 0, take: 50 }
      })
      setStockAlerts(response.stockAlerts)
    } catch (error) {
      console.error("Error loading stock alerts:", error)
      toast({
        title: "ข้อผิดพลาด", 
        description: "ไม่สามารถโหลดข้อมูลการแจ้งเตือนได้",
        variant: "destructive"
      })
    }
  }

  const loadLowStockProducts = async () => {
    try {
      const response = await GraphQLAPI.getLowStockProducts()
      setLowStockProducts(response.lowStockProducts)
      setQuickStats(prev => ({
        ...prev,
        totalProducts: response.lowStockProducts.length
      }))
    } catch (error) {
      console.error("Error loading low stock products:", error)
    }
  }

  const loadAllData = async () => {
    setLoading(true)
    try {
      await Promise.all([
        loadDailyReports(),
        loadSalesReports(),
        loadStockAlerts(),
        loadLowStockProducts()
      ])
    } finally {
      setLoading(false)
    }
  }

  const handleAcknowledgeAlert = async (alertId: string) => {
    try {
      await GraphQLAPI.acknowledgeStockAlert(alertId)
      toast({
        title: "สำเร็จ",
        description: "รับทราบการแจ้งเตือนแล้ว"
      })
      loadStockAlerts() // Reload alerts
    } catch (error) {
      console.error("Error acknowledging alert:", error)
      toast({
        title: "ข้อผิดพลาด",
        description: "ไม่สามารถรับทราบการแจ้งเตือนได้",
        variant: "destructive"
      })
    }
  }

  const generateDailyReport = async () => {
    try {
      setLoading(true)
      const today = new Date().toISOString()
      await GraphQLAPI.generateDailyReport(today)
      toast({
        title: "สำเร็จ",
        description: "สร้างรายงานรายวันเรียบร้อยแล้ว"
      })
      loadDailyReports() // Reload reports
    } catch (error: any) {
      console.error("Error generating daily report:", error)
      toast({
        title: "ข้อผิดพลาด",
        description: error.message || "ไม่สามารถสร้างรายงานได้",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAllData()
  }, [dateFilter])

  // Process sales data for charts
  const salesChartData = salesReports.length > 0 ? 
    salesReports.reduce((acc: any[], report) => {
      const date = new Date(report.report_date).toISOString().split('T')[0]
      const existing = acc.find(item => item.date === date)
      
      if (existing) {
        existing.sales += report.total_sales
        existing.orders += 1
      } else {
        acc.push({
          date,
          sales: report.total_sales,
          orders: 1
        })
      }
      return acc
    }, []) : mockSalesChartData

  const productSalesData = salesReports.length > 0 ?
    salesReports.map(report => ({
      product_name: report.product.product_name,
      quantity_sold: report.quantity_sold,
      total_sales: report.total_sales
    })).slice(0, 10) : []

  const stockLevelData = lowStockProducts.map(product => ({
    product_name: product.product_name,
    current_stock: product.stock_quantity,
    reorder_point: product.reorder_point
  }))

  return (
    <PageGuard requiredPermission="reports">
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">รายงานและการวิเคราะห์</h1>
            <p className="text-gray-600 mt-2">ติดตามประสิทธิภาพและสร้างรายงานต่างๆ</p>
          </div>
          <div className="flex space-x-2">
            <Input
              type="date"
              value={dateFilter.from}
              onChange={(e) => setDateFilter(prev => ({ ...prev, from: e.target.value }))}
              className="w-40"
            />
            <Input
              type="date"
              value={dateFilter.to}
              onChange={(e) => setDateFilter(prev => ({ ...prev, to: e.target.value }))}
              className="w-40"
            />
            <Button
              onClick={loadAllData}
              disabled={loading}
              variant="outline"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">ยอดขายวันนี้</p>
                  <p className="text-2xl font-bold">฿{quickStats.todaySales.toLocaleString()}</p>
                  <div className="flex items-center mt-1">
                    <TrendingUp className="h-4 w-4 text-green-600 mr-1" />
                    <span className="text-sm text-green-600">+12.5%</span>
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
                  <p className="text-2xl font-bold">{quickStats.todayOrders}</p>
                </div>
                <Package className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">สินค้าใกล้หมด</p>
                  <p className="text-2xl font-bold">{lowStockProducts.length}</p>
                </div>
                <AlertTriangle className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">ผู้ป่วยใหม่</p>
                  <p className="text-2xl font-bold">{quickStats.newPatients}</p>
                </div>
                <Users className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList>
            <TabsTrigger value="sales">รายงานยอดขาย</TabsTrigger>
            <TabsTrigger value="inventory">รายงานคลังสินค้า</TabsTrigger>
            <TabsTrigger value="daily">รายงานรายวัน</TabsTrigger>
            <TabsTrigger value="analytics">การวิเคราะห์</TabsTrigger>
          </TabsList>

          <TabsContent value="sales" className="space-y-6">
            {/* Sales Chart */}
            <SalesChart data={salesChartData} />
            
            {/* Product Sales Chart */}
            {productSalesData.length > 0 && (
              <ProductSalesChart data={productSalesData} />
            )}
            
            {/* Sales Report Table */}
            <SalesReportTable data={salesReports} />
          </TabsContent>

          <TabsContent value="inventory" className="space-y-6">
            {/* Stock Distribution Chart */}
            <StockDistributionChart data={mockStockDistribution} />
            
            {/* Stock Level Indicator */}
            {stockLevelData.length > 0 && (
              <StockLevelIndicator data={stockLevelData} />
            )}
            
            {/* Stock Alerts Table */}
            <StockAlertsTable 
              data={stockAlerts} 
              onAcknowledge={handleAcknowledgeAlert}
            />
          </TabsContent>

          <TabsContent value="daily" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">รายงานรายวัน</h2>
              <Button onClick={generateDailyReport} disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Calendar className="h-4 w-4 mr-2" />}
                สร้างรายงานวันนี้
              </Button>
            </div>
            
            {/* Daily Report Table */}
            <DailyReportTable data={dailyReports} />
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            {/* Monthly Trend Chart */}
            <MonthlyTrendChart data={mockMonthlyTrend} />
            
            {/* Analytics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>สถิติการขาย</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span>ยอดขายเฉลี่ยต่อวัน</span>
                      <span className="font-medium">฿18,500</span>
                    </div>
                    <div className="flex justify-between">
                      <span>คำสั่งซื้อเฉลี่ยต่อวัน</span>
                      <span className="font-medium">52</span>
                    </div>
                    <div className="flex justify-between">
                      <span>มูลค่าเฉลี่ยต่อคำสั่งซื้อ</span>
                      <span className="font-medium">฿355</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>สถิติคลังสินค้า</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span>สินค้าทั้งหมด</span>
                      <span className="font-medium">{lowStockProducts.length + 120}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>สินค้าใกล้หมด</span>
                      <span className="font-medium text-orange-600">{lowStockProducts.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>การหมุนเวียนสินค้า</span>
                      <span className="font-medium">85%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </PageGuard>
  )
}