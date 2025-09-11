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
  RefreshCw,
  PieChart,
  LineChart,
  CreditCard,
  Smartphone,
  Banknote,
  CalendarDays,
  TrendingDown
} from "lucide-react"
import PageGuard from "@/components/guards/page-guard"
import { GraphQLAPI } from "@/clients/graphql"
import { useToast } from "@/hooks/use-toast"
import { PieChart as RechartsPieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts'

export default function ReportsPage() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState("overview")

  // State for today's data
  const [todayOrders, setTodayOrders] = useState<any[]>([])
  const [paymentMethodsData, setPaymentMethodsData] = useState<any[]>([])
  const [profitLossData, setProfitLossData] = useState<any>({})
  const [categorySalesData, setCategorySalesData] = useState<any[]>([])
  const [topSellingProducts, setTopSellingProducts] = useState<any[]>([])
  const [latestSales, setLatestSales] = useState<any[]>([])

  // State for summary stats
  const [summaryStats, setSummaryStats] = useState({
    totalSales: 0,
    totalOrders: 0,
    totalProfit: 0,
    totalCost: 0
  })

  // State for sales chart data
  const [dateFrom, setDateFrom] = useState<string>('')
  const [dateTo, setDateTo] = useState<string>('')
  const [salesChartData, setSalesChartData] = useState<any[]>([])
  const [periodPaymentMethodsData, setPeriodPaymentMethodsData] = useState<any[]>([])
  const [periodProfitLossData, setPeriodProfitLossData] = useState<any>({})
  const [periodCategorySalesData, setPeriodCategorySalesData] = useState<any[]>([])
  const [periodTopSellingProducts, setPeriodTopSellingProducts] = useState<any[]>([])
  const [periodSummaryStats, setPeriodSummaryStats] = useState({
    totalSales: 0,
    totalOrders: 0,
    totalProfit: 0,
    totalCost: 0
  })

  // Get today's date range
  const getTodayDateRange = () => {
    const today = new Date()
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate())
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59)
    return {
      from: startOfDay.toISOString(),
      to: endOfDay.toISOString()
    }
  }

  // Load today's orders data
  const loadTodayOrders = async () => {
    try {
      const dateRange = getTodayDateRange()
      const response = await GraphQLAPI.getTodayOrders({
        date_from: dateRange.from,
        date_to: dateRange.to
      })
      
      const orders = response.orders.orders || []
      setTodayOrders(orders)
      
      // Process payment methods data
      const paymentMethods = orders.reduce((acc: any, order: any) => {
        order.payments?.forEach((payment: any) => {
          const method = payment.payment_type
          const existing = acc.find((item: any) => item.name === method)
          if (existing) {
            existing.value += payment.amount
          } else {
            acc.push({
              name: method,
              value: payment.amount,
              count: 1
            })
          }
        })
        return acc
      }, [])
      
      setPaymentMethodsData(paymentMethods)
      
      // Process profit/loss data
      let totalSales = 0
      let totalCost = 0
      
      orders.forEach((order: any) => {
        totalSales += order.total_amount || 0
        order.orderItems?.forEach((item: any) => {
          // Get product cost from the product data
          const productCost = item.product?.cost || 0
          totalCost += productCost * item.quantity
        })
      })
      
      const totalProfit = totalSales - totalCost
      
      setProfitLossData({
        totalSales,
        totalCost,
        totalProfit,
        profitMargin: totalSales > 0 ? (totalProfit / totalSales) * 100 : 0
      })
      
      // Process category sales data
      const categorySales = orders.reduce((acc: any, order: any) => {
        order.orderItems?.forEach((item: any) => {
          // Debug: Log the product category
          console.log('Product category debug:', {
            productName: item.product?.product_name,
            category: item.product?.category,
            categoryId: item.product?.categoryId
          })
          
          const categoryName = item.product?.category?.name || 'ไม่ระบุหมวดหมู่'
          const existing = acc.find((cat: any) => cat.name === categoryName)
          if (existing) {
            existing.value += item.total_price
            existing.count += item.quantity
          } else {
            acc.push({
              name: categoryName,
              value: item.total_price,
              count: item.quantity
            })
          }
        })
        return acc
      }, [])
      
      setCategorySalesData(categorySales)
      
      // Process top selling products
      const productSales = orders.reduce((acc: any, order: any) => {
        order.orderItems?.forEach((item: any) => {
          const productName = item.product_name || item.product?.product_name
          const existing = acc.find((prod: any) => prod.name === productName)
          if (existing) {
            existing.quantity += item.quantity
            existing.total += item.total_price
          } else {
            acc.push({
              name: productName,
              quantity: item.quantity,
              total: item.total_price,
              unit: item.product_unit || item.product?.unit,
              barcode: item.product?.barcode,
              category: item.product?.category?.name
            })
          }
        })
        return acc
      }, [])
      
      // Sort by quantity and take top 5
      const topProducts = productSales
        .sort((a: any, b: any) => b.quantity - a.quantity)
        .slice(0, 5)
      
      setTopSellingProducts(topProducts)
      
      // Set latest sales (today's orders)
      setLatestSales(orders)
      
      // Update summary stats
      setSummaryStats({
        totalSales,
        totalOrders: orders.length,
        totalProfit,
        totalCost
      })
      
    } catch (error) {
      console.error("Error loading today's orders:", error)
      toast({
        title: "ข้อผิดพลาด", 
        description: "ไม่สามารถโหลดข้อมูลรายงานวันนี้ได้",
        variant: "destructive"
      })
    }
  }

  // Load sales data for selected period
  const loadSalesData = async () => {
    if (!dateFrom || !dateTo) {
      toast({
        title: "กรุณาเลือกวันที่",
        description: "กรุณาเลือกช่วงวันที่ที่ต้องการดูรายงาน",
        variant: "destructive"
      })
      return
    }

    try {
      setLoading(true)
      
      const result = await GraphQLAPI.getTodayOrders({
        date_from: dateFrom,
        date_to: dateTo
      })
      
      const orders = result.orders?.orders || []
      
      // Process daily sales data
      const dailySales: { [key: string]: { sales: number, orders: number } } = {}
      orders.forEach((order: any) => {
        const date = new Date(order.order_date).toLocaleDateString('th-TH', {
          day: '2-digit',
          month: '2-digit'
        })
        if (!dailySales[date]) {
          dailySales[date] = { sales: 0, orders: 0 }
        }
        dailySales[date].sales += order.total_amount || 0
        dailySales[date].orders += 1
      })
      
      const salesChartArray = Object.entries(dailySales)
        .sort(([a], [b]) => new Date(a).getTime() - new Date(b).getTime())
        .map(([date, data]) => ({
          date,
          sales: data.sales,
          orders: data.orders
        }))
      setSalesChartData(salesChartArray)
      
      // Process payment methods data for period
      const paymentMethods: { [key: string]: number } = {}
      orders.forEach((order: any) => {
        order.payments?.forEach((payment: any) => {
          const method = payment.payment_type
          paymentMethods[method] = (paymentMethods[method] || 0) + payment.amount
        })
      })
      
      const paymentMethodsArray = Object.entries(paymentMethods).map(([method, amount]) => ({
        name: getPaymentMethodThai(method),
        value: amount,
        method: method
      }))
      setPeriodPaymentMethodsData(paymentMethodsArray)
      
      // Process profit/loss data for period
      let totalSales = 0
      let totalCost = 0
      const categorySales: { [key: string]: { sales: number, cost: number, quantity: number } } = {}
      const productSales: { [key: string]: { sales: number, cost: number, quantity: number, product: any } } = {}
      
      orders.forEach((order: any) => {
        order.orderItems?.forEach((item: any) => {
          const sales = item.total_price || 0
          const cost = (item.product?.cost || 0) * item.quantity
          const quantity = item.quantity || 0
          
          totalSales += sales
          totalCost += cost
          
          // Category sales
          const categoryName = item.product?.category?.name || 'ไม่ระบุหมวดหมู่'
          if (!categorySales[categoryName]) {
            categorySales[categoryName] = { sales: 0, cost: 0, quantity: 0 }
          }
          categorySales[categoryName].sales += sales
          categorySales[categoryName].cost += cost
          categorySales[categoryName].quantity += quantity
          
          // Product sales
          const productKey = item.product?.id || 'unknown'
          if (!productSales[productKey]) {
            productSales[productKey] = { 
              sales: 0, 
              cost: 0, 
              quantity: 0, 
              product: item.product 
            }
          }
          productSales[productKey].sales += sales
          productSales[productKey].cost += cost
          productSales[productKey].quantity += quantity
        })
      })
      
      const totalProfit = totalSales - totalCost
      const profitMargin = totalSales > 0 ? (totalProfit / totalSales) * 100 : 0
      
      setPeriodProfitLossData({
        totalSales,
        totalCost,
        totalProfit,
        profitMargin
      })
      
      // Process category sales data for period
      const categorySalesArray = Object.entries(categorySales).map(([category, data]) => ({
        name: category,
        sales: data.sales,
        cost: data.cost,
        profit: data.sales - data.cost,
        quantity: data.quantity
      }))
      setPeriodCategorySalesData(categorySalesArray)
      
      // Process top selling products for period
      const topProducts = Object.entries(productSales)
        .map(([_, data]) => ({
          product: data.product,
          quantity: data.quantity,
          sales: data.sales,
          cost: data.cost,
          profit: data.sales - data.cost
        }))
        .sort((a, b) => b.quantity - a.quantity)
        .slice(0, 5)
      setPeriodTopSellingProducts(topProducts)
      
      // Set period summary stats
      setPeriodSummaryStats({
        totalSales,
        totalOrders: orders.length,
        totalProfit,
        totalCost
      })
      
    } catch (error) {
      console.error('Error loading sales data:', error)
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถโหลดข้อมูลรายงานได้",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const loadAllData = async () => {
    setLoading(true)
    try {
      await loadTodayOrders()
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAllData()
    
    // Set default date range (last 7 days)
    const today = new Date()
    const lastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
    setDateFrom(lastWeek.toISOString().split('T')[0])
    setDateTo(today.toISOString().split('T')[0])
  }, [])

  // Helper functions
  const getPaymentMethodThai = (method: string) => {
    switch (method) {
      case 'cash': return 'เงินสด'
      case 'credit_card': return 'บัตรเครดิต'
      case 'promptpay': return 'พร้อมเพย์'
      default: return method
    }
  }

  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case 'cash': return <Banknote className="h-4 w-4" />
      case 'credit_card': return <CreditCard className="h-4 w-4" />
      case 'promptpay': return <Smartphone className="h-4 w-4" />
      default: return <DollarSign className="h-4 w-4" />
    }
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

  // Chart colors
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8']

  return (
    <PageGuard requiredPermission="reports">
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">รายงานการขาย</h1>
            <p className="text-gray-600 mt-2">รายงานสรุปการขายและข้อมูลสำคัญ</p>
          </div>
          <div className="flex space-x-2">
            <Button
              onClick={loadAllData}
              disabled={loading}
              variant="outline"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              รีเฟรชข้อมูล
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              สรุปภาพรวมวันนี้
            </TabsTrigger>
            <TabsTrigger value="sales-chart" className="flex items-center gap-2">
              <LineChart className="h-4 w-4" />
              กราฟยอดขาย
            </TabsTrigger>
          </TabsList>

          {/* Today's Overview Tab */}
          <TabsContent value="overview" className="space-y-6">

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Payment Methods Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">สรุปภาพรวมวันนี้</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center mb-4">
                <p className="text-3xl font-bold text-blue-600">฿{summaryStats.totalSales.toLocaleString()}</p>
                <p className="text-sm text-gray-600">
                  {summaryStats.totalSales > 0 ? 'ยอดขายรวมวันนี้' : 'ยังไม่พบการขายสินค้าวันนี้'}
                </p>
              </div>
              
              <div className="space-y-2">
                {paymentMethodsData.length > 0 ? (
                  paymentMethodsData.map((method, index) => (
                    <div key={method.name} className="flex justify-between items-center">
                      <div className="flex items-center">
                        {getPaymentMethodIcon(method.name)}
                        <span className="ml-2 text-sm">{getPaymentMethodThai(method.name)}</span>
                      </div>
                      <span className="text-sm font-medium">฿{method.value.toLocaleString()}</span>
                    </div>
                  ))
                ) : (
                  <div className="text-center text-gray-500 text-sm">
                    <div className="space-y-1">
                      <div className="flex justify-between"><span>เงินสด</span><span>-</span></div>
                      <div className="flex justify-between"><span>บัตรเครดิต</span><span>-</span></div>
                      <div className="flex justify-between"><span>พร้อมเพย์</span><span>-</span></div>
                      <div className="flex justify-between"><span>ส่วนลด</span><span>-</span></div>
                      <div className="flex justify-between"><span>ภาษีขาย</span><span>-</span></div>
                  </div>
                </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Financial Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">สรุปภาพรวมวันนี้</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center mb-4">
                <p className="text-3xl font-bold text-green-600">฿{summaryStats.totalSales.toLocaleString()}</p>
                <p className="text-sm text-gray-600">
                  {summaryStats.totalSales > 0 ? 'ยอดขายรวมวันนี้' : 'ยังไม่พบการขายสินค้าของวันนี้'}
                </p>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm">กำไร/ขาดทุน</span>
                  <span className={`text-sm font-medium ${profitLossData.totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    ฿{profitLossData.totalProfit?.toLocaleString() || '0'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">ต้นทุนสินค้า</span>
                  <span className="text-sm font-medium">฿{profitLossData.totalCost?.toLocaleString() || '0'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">ค่าธรรมเนียม</span>
                  <span className="text-sm font-medium">-</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">คอมมิชชั่น</span>
                  <span className="text-sm font-medium">-</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">ส่วนลด</span>
                  <span className="text-sm font-medium">-</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">ภาษีขาย</span>
                  <span className="text-sm font-medium">-</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Additional Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">สรุปภาพรวมวันนี้</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center mb-4">
                <p className="text-3xl font-bold text-purple-600">฿{summaryStats.totalSales.toLocaleString()}</p>
                <p className="text-sm text-gray-600">
                  {summaryStats.totalSales > 0 ? 'ยอดขายรวมวันนี้' : 'ยังไม่พบการขายสินค้าวันนี้'}
                </p>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm">คำสั่งซื้อ</span>
                  <span className="text-sm font-medium">{summaryStats.totalOrders}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">ลูกค้า</span>
                  <span className="text-sm font-medium">-</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">สินค้าที่ขาย</span>
                  <span className="text-sm font-medium">{topSellingProducts.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">หมวดหมู่</span>
                  <span className="text-sm font-medium">{categorySalesData.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">กำไรเฉลี่ย</span>
                  <span className="text-sm font-medium">{profitLossData.profitMargin?.toFixed(1) || '0'}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">อัพเดตล่าสุด</span>
                  <span className="text-sm font-medium">{new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts and Tables */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Payment Methods Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <PieChart className="h-5 w-5 mr-2" />
                ยอดชำระตามช่องทาง
              </CardTitle>
            </CardHeader>
            <CardContent>
              {paymentMethodsData.length > 0 ? (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPieChart>
                      <Pie
                        data={paymentMethodsData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${getPaymentMethodThai(name)} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {paymentMethodsData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [`฿${Number(value).toLocaleString()}`, 'ยอดชำระ']} />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-64 flex items-center justify-center text-gray-500">
                  <div className="text-center">
                    <PieChart className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>ยังไม่มีข้อมูลการชำระเงินวันนี้</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Profit/Loss Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <BarChart3 className="h-5 w-5 mr-2" />
                กำไร/ขาดทุน และต้นทุน
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={[
                    { name: 'ยอดขาย', value: profitLossData.totalSales || 0, color: '#10B981' },
                    { name: 'ต้นทุน', value: profitLossData.totalCost || 0, color: '#EF4444' },
                    { name: 'กำไร', value: profitLossData.totalProfit || 0, color: profitLossData.totalProfit >= 0 ? '#059669' : '#DC2626' }
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip formatter={(value) => [`฿${Number(value).toLocaleString()}`, '']} />
                    <Bar dataKey="value" fill="#8884d8">
                      {[
                        { name: 'ยอดขาย', value: profitLossData.totalSales || 0, color: '#10B981' },
                        { name: 'ต้นทุน', value: profitLossData.totalCost || 0, color: '#EF4444' },
                        { name: 'กำไร', value: profitLossData.totalProfit || 0, color: profitLossData.totalProfit >= 0 ? '#059669' : '#DC2626' }
                      ].map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Category Sales Chart */}
              <Card>
                <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart3 className="h-5 w-5 mr-2" />
              แบ่งตามหมวดหมู่สินค้า
            </CardTitle>
            <p className="text-sm text-gray-600">จากการขาย {new Date().toLocaleDateString('th-TH')}</p>
                </CardHeader>
                <CardContent>
            {categorySalesData.length > 0 ? (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={categorySalesData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip formatter={(value) => [`฿${Number(value).toLocaleString()}`, 'ยอดขาย']} />
                    <Bar dataKey="value" fill="#8884d8">
                      {categorySalesData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
                    </div>
            ) : (
              <div className="h-64 flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <BarChart3 className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>ยังไม่พบการขายสินค้า ระหว่าง {new Date().toLocaleDateString('th-TH')}</p>
                    </div>
                  </div>
            )}
                </CardContent>
              </Card>

        {/* Tables Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Selling Products */}
              <Card>
                <CardHeader>
              <CardTitle className="flex items-center">
                <Package className="h-5 w-5 mr-2" />
                สินค้าขายดี
              </CardTitle>
              <p className="text-sm text-gray-600">จากการขาย {new Date().toLocaleDateString('th-TH')}</p>
                </CardHeader>
                <CardContent>
              {topSellingProducts.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2">สินค้า</th>
                        <th className="text-left p-2">หน่วยนับ</th>
                        <th className="text-left p-2">บาร์โค้ด</th>
                        <th className="text-left p-2">หมวดหมู่</th>
                        <th className="text-right p-2">จำนวน</th>
                        <th className="text-right p-2">ยอด</th>
                      </tr>
                    </thead>
                    <tbody>
                      {topSellingProducts.map((product, index) => (
                        <tr key={index} className="border-b">
                          <td className="p-2 font-medium">{product.name}</td>
                          <td className="p-2">{product.unit || '-'}</td>
                          <td className="p-2">{product.barcode || '-'}</td>
                          <td className="p-2">{product.category || '-'}</td>
                          <td className="p-2 text-right">{product.quantity}</td>
                          <td className="p-2 text-right">฿{product.total.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                    </div>
              ) : (
                <div className="text-center text-gray-500 py-8">
                  <Package className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>ยังไม่พบการขายสินค้า ระหว่าง {new Date().toLocaleDateString('th-TH')}</p>
                    </div>
              )}
            </CardContent>
          </Card>

          {/* Latest Sales */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Calendar className="h-5 w-5 mr-2" />
                การขายล่าสุด
              </CardTitle>
              <p className="text-sm text-gray-600">อัปเดตล่าสุดเมื่อ {new Date().toLocaleString('th-TH')}</p>
            </CardHeader>
            <CardContent>
              {latestSales.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2">ใบเสร็จรับเงิน</th>
                        <th className="text-left p-2">สาขา</th>
                        <th className="text-left p-2">ชำระเมื่อ</th>
                        <th className="text-left p-2">สถานะ</th>
                        <th className="text-left p-2">ลูกค้า</th>
                        <th className="text-left p-2">พนักงาน</th>
                        <th className="text-right p-2">ส่วนลด</th>
                        <th className="text-right p-2">ภาษี</th>
                        <th className="text-right p-2">ยอด</th>
                      </tr>
                    </thead>
                    <tbody>
                      {latestSales.slice(0, 10).map((order, index) => (
                        <tr key={order.id} className="border-b">
                          <td className="p-2 font-medium">#{order.id.slice(-8)}</td>
                          <td className="p-2">สาขาหลัก</td>
                          <td className="p-2">{formatDateTime(order.created_at)}</td>
                          <td className="p-2">
                            <Badge variant={order.status === 'completed' ? 'default' : 'secondary'}>
                              {order.status === 'completed' ? 'เสร็จสิ้น' : order.status}
                            </Badge>
                          </td>
                          <td className="p-2">
                            {order.patient ? `${order.patient.first_name} ${order.patient.last_name}` : 'ลูกค้าทั่วไป'}
                          </td>
                          <td className="p-2">{order.user?.username || '-'}</td>
                          <td className="p-2 text-right">-</td>
                          <td className="p-2 text-right">-</td>
                          <td className="p-2 text-right">฿{order.total_amount?.toLocaleString() || '0'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                    </div>
              ) : (
                <div className="text-center text-gray-500 py-8">
                  <Calendar className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>ยังไม่พบรายการอัปเดตล่าสุด</p>
                  </div>
              )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Sales Chart Tab */}
          <TabsContent value="sales-chart" className="space-y-6">
            {/* Date Range Selector */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <CalendarDays className="h-5 w-5 mr-2" />
                  เลือกช่วงวันที่
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col sm:flex-row gap-4 items-end">
                  <div className="flex-1">
                    <label className="block text-sm font-medium mb-2">วันที่เริ่มต้น</label>
                    <Input
                      type="date"
                      value={dateFrom}
                      onChange={(e) => setDateFrom(e.target.value)}
                      className="w-full"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm font-medium mb-2">วันที่สิ้นสุด</label>
                    <Input
                      type="date"
                      value={dateTo}
                      onChange={(e) => setDateTo(e.target.value)}
                      className="w-full"
                    />
                  </div>
                  <Button 
                    onClick={loadSalesData}
                    disabled={loading || !dateFrom || !dateTo}
                    className="flex items-center gap-2"
                  >
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <TrendingUp className="h-4 w-4" />}
                    ดูรายงาน
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Summary Cards for Period */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">ยอดขายรวม</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">
                    ฿{periodSummaryStats.totalSales.toLocaleString()}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">จำนวนออเดอร์</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600">
                    {periodSummaryStats.totalOrders}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">กำไร/ขาดทุน</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className={`text-2xl font-bold ${periodSummaryStats.totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    ฿{periodSummaryStats.totalProfit.toLocaleString()}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">ต้นทุนรวม</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-orange-600">
                    ฿{periodSummaryStats.totalCost.toLocaleString()}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Daily Sales Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <LineChart className="h-5 w-5 mr-2" />
                  ยอดขายรายวัน
                </CardTitle>
              </CardHeader>
              <CardContent>
                {salesChartData.length > 0 ? (
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={salesChartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip 
                          formatter={(value, name) => [
                            name === 'sales' ? `฿${Number(value).toLocaleString()}` : value,
                            name === 'sales' ? 'ยอดขาย' : 'จำนวนออเดอร์'
                          ]}
                        />
                        <Legend />
                        <Bar dataKey="sales" fill="#0088FE" name="ยอดขาย" />
                        <Bar dataKey="orders" fill="#00C49F" name="จำนวนออเดอร์" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="text-center text-gray-500 py-8">
                    <LineChart className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>กรุณาเลือกช่วงวันที่และกดปุ่ม "ดูรายงาน"</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Payment Methods Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <PieChart className="h-5 w-5 mr-2" />
                  ยอดชำระตามช่องทาง
                </CardTitle>
              </CardHeader>
              <CardContent>
                {periodPaymentMethodsData.length > 0 ? (
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsPieChart>
                        <Pie
                          data={periodPaymentMethodsData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {periodPaymentMethodsData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => `฿${Number(value).toLocaleString()}`} />
                      </RechartsPieChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="text-center text-gray-500 py-8">
                    <PieChart className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>ไม่มีข้อมูลการชำระเงินในช่วงวันที่ที่เลือก</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Profit/Loss Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <TrendingUp className="h-5 w-5 mr-2" />
                  กำไร/ขาดทุน และต้นทุน
                </CardTitle>
              </CardHeader>
              <CardContent>
                {periodProfitLossData.totalSales > 0 ? (
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={[
                        { name: 'ยอดขาย', value: periodProfitLossData.totalSales, color: '#0088FE' },
                        { name: 'ต้นทุน', value: periodProfitLossData.totalCost, color: '#FF8042' },
                        { name: 'กำไร/ขาดทุน', value: periodProfitLossData.totalProfit, color: periodProfitLossData.totalProfit >= 0 ? '#00C49F' : '#FF4444' }
                      ]}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip formatter={(value) => `฿${Number(value).toLocaleString()}`} />
                        <Bar dataKey="value" fill="#8884d8" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="text-center text-gray-500 py-8">
                    <TrendingUp className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>ไม่มีข้อมูลกำไร/ขาดทุนในช่วงวันที่ที่เลือก</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Category Sales Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BarChart3 className="h-5 w-5 mr-2" />
                  แบ่งตามหมวดหมู่สินค้า
                </CardTitle>
              </CardHeader>
              <CardContent>
                {periodCategorySalesData.length > 0 ? (
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={periodCategorySalesData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip formatter={(value) => `฿${Number(value).toLocaleString()}`} />
                        <Bar dataKey="sales" fill="#0088FE" name="ยอดขาย" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="text-center text-gray-500 py-8">
                    <BarChart3 className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>ไม่มีข้อมูลการขายตามหมวดหมู่ในช่วงวันที่ที่เลือก</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Top Selling Products Table */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Package className="h-5 w-5 mr-2" />
                  สินค้าขายดี
                </CardTitle>
              </CardHeader>
              <CardContent>
                {periodTopSellingProducts.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-2">สินค้า</th>
                          <th className="text-left p-2">หน่วยนับ</th>
                          <th className="text-left p-2">บาร์โค้ด</th>
                          <th className="text-left p-2">หมวดหมู่</th>
                          <th className="text-right p-2">จำนวน</th>
                          <th className="text-right p-2">ยอด</th>
                        </tr>
                      </thead>
                      <tbody>
                        {periodTopSellingProducts.map((item, index) => (
                          <tr key={index} className="border-b">
                            <td className="p-2 font-medium">{item.product?.product_name || 'ไม่ระบุ'}</td>
                            <td className="p-2">{item.product?.unit || '-'}</td>
                            <td className="p-2">{item.product?.barcode || '-'}</td>
                            <td className="p-2">{item.product?.category?.name || 'ไม่ระบุหมวดหมู่'}</td>
                            <td className="p-2 text-right">{item.quantity}</td>
                            <td className="p-2 text-right">฿{item.sales.toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center text-gray-500 py-8">
                    <Package className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>ไม่มีข้อมูลสินค้าขายดีในช่วงวันที่ที่เลือก</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Mock up for Low Stock Products */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <AlertTriangle className="h-5 w-5 mr-2 text-orange-500" />
                  สินค้าใกล้หมดสต๊อก
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center text-gray-500 py-8">
                  <AlertTriangle className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Mock up - ฟีเจอร์นี้จะพร้อมใช้งานในอนาคต</p>
                  <p className="text-sm">จะแสดงรายการสินค้าที่มีสต๊อกต่ำกว่า reorder point</p>
                </div>
              </CardContent>
            </Card>

            {/* Mock up for Expiring Products */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Calendar className="h-5 w-5 mr-2 text-red-500" />
                  สินค้าใกล้หมดอายุ
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center text-gray-500 py-8">
                  <Calendar className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Mock up - ฟีเจอร์นี้จะพร้อมใช้งานในอนาคต</p>
                  <p className="text-sm">จะแสดงรายการสินค้าที่ใกล้หมดอายุ</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </PageGuard>
  )
}