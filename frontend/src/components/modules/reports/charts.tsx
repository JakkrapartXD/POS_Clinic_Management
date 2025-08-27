'use client'

import { useMemo } from "react"
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart
} from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartConfig } from "@/components/ui/chart"

// Color palette for charts
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FFC658', '#8DD1E1']

interface SalesChartProps {
  data: Array<{
    date: string
    sales: number
    orders: number
  }>
  title?: string
}

export function SalesChart({ data, title = "ยอดขายรายวัน" }: SalesChartProps) {
  const chartConfig: ChartConfig = {
    sales: {
      label: "ยอดขาย (บาท)",
      color: "#0088FE",
    },
    orders: {
      label: "จำนวนคำสั่งซื้อ",
      color: "#00C49F",
    },
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px]">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="date" 
              tick={{ fontSize: 12 }}
              tickFormatter={(value) => new Date(value).toLocaleDateString('th-TH', { 
                month: 'short', 
                day: 'numeric' 
              })}
            />
            <YAxis yAxisId="left" tick={{ fontSize: 12 }} />
            <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} />
            <Tooltip 
              labelFormatter={(value) => new Date(value).toLocaleDateString('th-TH')}
              formatter={(value: any, name: string) => [
                name === 'sales' ? `฿${value.toLocaleString()}` : value,
                name === 'sales' ? 'ยอดขาย' : 'คำสั่งซื้อ'
              ]}
            />
            <Legend />
            <Line 
              yAxisId="left" 
              type="monotone" 
              dataKey="sales" 
              stroke="#0088FE" 
              strokeWidth={2}
              name="ยอดขาย (บาท)"
            />
            <Line 
              yAxisId="right" 
              type="monotone" 
              dataKey="orders" 
              stroke="#00C49F" 
              strokeWidth={2}
              name="จำนวนคำสั่งซื้อ"
            />
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}

interface ProductSalesChartProps {
  data: Array<{
    product_name: string
    quantity_sold: number
    total_sales: number
  }>
  title?: string
}

export function ProductSalesChart({ data, title = "ยอดขายตามสินค้า" }: ProductSalesChartProps) {
  const chartConfig: ChartConfig = {
    quantity_sold: {
      label: "จำนวนที่ขายได้",
      color: "#8884D8",
    },
    total_sales: {
      label: "ยอดขาย",
      color: "#82CA9D",
    },
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[400px]">
          <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="product_name" 
              tick={{ fontSize: 10 }}
              angle={-45}
              textAnchor="end"
              height={80}
            />
            <YAxis yAxisId="left" tick={{ fontSize: 12 }} />
            <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} />
            <Tooltip 
              formatter={(value: any, name: string) => [
                name === 'total_sales' ? `฿${value.toLocaleString()}` : value,
                name === 'total_sales' ? 'ยอดขาย' : 'จำนวนที่ขาย'
              ]}
            />
            <Legend />
            <Bar 
              yAxisId="left" 
              dataKey="quantity_sold" 
              fill="#8884D8" 
              name="จำนวนที่ขายได้"
            />
            <Bar 
              yAxisId="right" 
              dataKey="total_sales" 
              fill="#82CA9D" 
              name="ยอดขาย (บาท)"
            />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}

interface StockDistributionProps {
  data: Array<{
    category: string
    count: number
    value: number
  }>
  title?: string
}

export function StockDistributionChart({ data, title = "การกระจายสินค้าคงคลัง" }: StockDistributionProps) {
  const chartConfig: ChartConfig = {
    count: {
      label: "จำนวนสินค้า",
      color: "#0088FE",
    },
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px]">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ category, percent }) => `${category} ${(percent * 100).toFixed(0)}%`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="count"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip 
              formatter={(value: any) => [value, 'จำนวนสินค้า']}
            />
            <Legend />
          </PieChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}

interface MonthlyTrendProps {
  data: Array<{
    month: string
    sales: number
    orders: number
    patients: number
  }>
  title?: string
}

export function MonthlyTrendChart({ data, title = "แนวโน้มรายเดือน" }: MonthlyTrendProps) {
  const chartConfig: ChartConfig = {
    sales: {
      label: "ยอดขาย",
      color: "#0088FE",
    },
    orders: {
      label: "คำสั่งซื้อ", 
      color: "#00C49F",
    },
    patients: {
      label: "ผู้ป่วย",
      color: "#FFBB28",
    },
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[350px]">
          <AreaChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="month" 
              tick={{ fontSize: 12 }}
            />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip 
              formatter={(value: any, name: string) => [
                name === 'sales' ? `฿${value.toLocaleString()}` : value,
                name === 'sales' ? 'ยอดขาย' : name === 'orders' ? 'คำสั่งซื้อ' : 'ผู้ป่วย'
              ]}
            />
            <Legend />
            <Area 
              type="monotone" 
              dataKey="sales" 
              stackId="1" 
              stroke="#0088FE" 
              fill="#0088FE" 
              fillOpacity={0.6}
              name="ยอดขาย"
            />
            <Area 
              type="monotone" 
              dataKey="orders" 
              stackId="2" 
              stroke="#00C49F" 
              fill="#00C49F" 
              fillOpacity={0.6}
              name="คำสั่งซื้อ"
            />
            <Area 
              type="monotone" 
              dataKey="patients" 
              stackId="3" 
              stroke="#FFBB28" 
              fill="#FFBB28" 
              fillOpacity={0.6}
              name="ผู้ป่วย"
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}

interface StockLevelIndicatorProps {
  data: Array<{
    product_name: string
    current_stock: number
    reorder_point: number
    max_stock?: number
  }>
  title?: string
}

export function StockLevelIndicator({ data, title = "สถานะสินค้าคงคลัง" }: StockLevelIndicatorProps) {
  const processedData = useMemo(() => {
    return data.map(item => ({
      ...item,
      stock_percentage: item.max_stock 
        ? (item.current_stock / item.max_stock) * 100 
        : (item.current_stock / (item.reorder_point * 3)) * 100,
      status: item.current_stock <= item.reorder_point ? 'low' : 
              item.current_stock <= item.reorder_point * 1.5 ? 'medium' : 'high'
    }))
  }, [data])

  const chartConfig: ChartConfig = {
    current_stock: {
      label: "สินค้าคงคลัง",
      color: "#0088FE",
    },
    reorder_point: {
      label: "จุดสั่งซื้อใหม่",
      color: "#FF8042",
    },
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[400px]">
          <BarChart data={processedData} margin={{ top: 20, right: 30, left: 20, bottom: 80 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="product_name" 
              tick={{ fontSize: 10 }}
              angle={-45}
              textAnchor="end"
              height={100}
            />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip 
              formatter={(value: any, name: string) => [
                value,
                name === 'current_stock' ? 'สินค้าคงคลัง' : 'จุดสั่งซื้อใหม่'
              ]}
            />
            <Legend />
            <Bar 
              dataKey="current_stock" 
              fill="#0088FE" 
              name="สินค้าคงคลัง"
            />
            <Bar 
              dataKey="reorder_point" 
              fill="#FF8042" 
              name="จุดสั่งซื้อใหม่"
            />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}

