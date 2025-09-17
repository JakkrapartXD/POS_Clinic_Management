'use client'

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { 
  MoreHorizontal, 
  Search, 
  Filter,
  Download,
  Eye,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Package
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface SalesReportTableProps {
  data: Array<{
    id: string
    report_date: string
    product: {
      product_name: string
      unit: string
    }
    quantity_sold: number
    total_sales: number
    created_by_username?: string
  }>
  title?: string
}

export function SalesReportTable({ data, title = "รายงานยอดขาย" }: SalesReportTableProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [sortField, setSortField] = useState<string>("report_date")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc")

  const filteredData = data.filter(item => 
    item.product.product_name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const sortedData = filteredData.sort((a, b) => {
    const aValue = sortField === "report_date" ? new Date(a.report_date).getTime() :
                   sortField === "total_sales" ? a.total_sales :
                   sortField === "quantity_sold" ? a.quantity_sold :
                   a.product.product_name
    const bValue = sortField === "report_date" ? new Date(b.report_date).getTime() :
                   sortField === "total_sales" ? b.total_sales :
                   sortField === "quantity_sold" ? b.quantity_sold :
                   b.product.product_name

    if (aValue < bValue) return sortDirection === "asc" ? -1 : 1
    if (aValue > bValue) return sortDirection === "asc" ? 1 : -1
    return 0
  })

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("desc")
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>{title}</CardTitle>
          <div className="flex space-x-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="ค้นหาสินค้า..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-64"
              />
            </div>
            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4 mr-2" />
              กรอง
            </Button>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              ส่งออก
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead 
                  className="cursor-pointer hover:bg-gray-50"
                  onClick={() => handleSort("report_date")}
                >
                  วันที่
                  {sortField === "report_date" && (
                    sortDirection === "asc" ? <TrendingUp className="inline ml-1 h-4 w-4" /> : <TrendingDown className="inline ml-1 h-4 w-4" />
                  )}
                </TableHead>
                <TableHead 
                  className="cursor-pointer hover:bg-gray-50"
                  onClick={() => handleSort("product_name")}
                >
                  สินค้า
                </TableHead>
                <TableHead 
                  className="cursor-pointer hover:bg-gray-50 text-right"
                  onClick={() => handleSort("quantity_sold")}
                >
                  จำนวนที่ขาย
                  {sortField === "quantity_sold" && (
                    sortDirection === "asc" ? <TrendingUp className="inline ml-1 h-4 w-4" /> : <TrendingDown className="inline ml-1 h-4 w-4" />
                  )}
                </TableHead>
                <TableHead 
                  className="cursor-pointer hover:bg-gray-50 text-right"
                  onClick={() => handleSort("total_sales")}
                >
                  ยอดขาย
                  {sortField === "total_sales" && (
                    sortDirection === "asc" ? <TrendingUp className="inline ml-1 h-4 w-4" /> : <TrendingDown className="inline ml-1 h-4 w-4" />
                  )}
                </TableHead>
                <TableHead>ผู้สร้างรายงาน</TableHead>
                <TableHead className="w-[100px]">การดำเนินการ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedData.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    {new Date(item.report_date).toLocaleDateString('th-TH')}
                  </TableCell>
                  <TableCell className="font-medium">
                    <div>
                      <div>{item.product.product_name}</div>
                      <div className="text-sm text-gray-500">หน่วย: {item.product.unit}</div>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    {item.quantity_sold.toLocaleString()} {item.product.unit}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    ฿{item.total_sales.toLocaleString()}
                  </TableCell>
                  <TableCell>
                    {item.created_by_username || "-"}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>การดำเนินการ</DropdownMenuLabel>
                        <DropdownMenuItem>
                          <Eye className="mr-2 h-4 w-4" />
                          ดูรายละเอียด
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Download className="mr-2 h-4 w-4" />
                          ดาวน์โหลด
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        {sortedData.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            ไม่พบข้อมูลที่ตรงกับการค้นหา
          </div>
        )}
      </CardContent>
    </Card>
  )
}

interface StockAlertsTableProps {
  data: Array<{
    id: string
    alert_type: string
    alert_message: string
    created_at: string
    acknowledged: boolean
    acknowledged_at?: string
    product: {
      id: string
      product_name: string
      stock_quantity: number
      reorder_point: number
    }
  }>
  onAcknowledge?: (id: string) => void
  title?: string
}

export function StockAlertsTable({ data, onAcknowledge, title = "การแจ้งเตือนสินค้าคงคลัง" }: StockAlertsTableProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState<"all" | "pending" | "acknowledged">("all")

  const filteredData = data.filter(item => {
    const matchesSearch = item.product.product_name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = filterStatus === "all" ? true : 
                         filterStatus === "pending" ? !item.acknowledged :
                         item.acknowledged
    return matchesSearch && matchesStatus
  })

  const getAlertTypeColor = (type: string) => {
    switch (type) {
      case "low_stock": return "destructive"
      case "out_of_stock": return "destructive"
      case "expiring": return "default"
      default: return "secondary"
    }
  }

  const getAlertTypeLabel = (type: string) => {
    switch (type) {
      case "low_stock": return "สินค้าใกล้หมด"
      case "out_of_stock": return "สินค้าหมด"
      case "expiring": return "ใกล้หมดอายุ"
      default: return type
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center">
            <AlertTriangle className="mr-2 h-5 w-5 text-orange-500" />
            {title}
          </CardTitle>
          <div className="flex space-x-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="ค้นหาสินค้า..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-64"
              />
            </div>
            <select 
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="px-3 py-2 border rounded-md text-sm"
            >
              <option value="all">ทั้งหมด</option>
              <option value="pending">รอดำเนินการ</option>
              <option value="acknowledged">ดำเนินการแล้ว</option>
            </select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ประเภทการแจ้งเตือน</TableHead>
                <TableHead>สินค้า</TableHead>
                <TableHead>ข้อความ</TableHead>
                <TableHead className="text-center">สถานะสินค้าคงคลัง</TableHead>
                <TableHead>วันที่แจ้งเตือน</TableHead>
                <TableHead className="text-center">สถานะ</TableHead>
                <TableHead className="w-[150px]">การดำเนินการ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredData.map((item) => (
                <TableRow key={item.id} className={!item.acknowledged ? "bg-red-50" : ""}>
                  <TableCell>
                    <Badge variant={getAlertTypeColor(item.alert_type) as any}>
                      {getAlertTypeLabel(item.alert_type)}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-medium">
                    <div className="flex items-center">
                      <Package className="mr-2 h-4 w-4 text-gray-400" />
                      {item.product.product_name}
                    </div>
                  </TableCell>
                  <TableCell>{item.alert_message}</TableCell>
                  <TableCell className="text-center">
                    <div className="text-sm">
                      <div className="font-medium">{item.product.stock_quantity}</div>
                      <div className="text-gray-500">จุดสั่งซื้อ: {item.product.reorder_point}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {new Date(item.created_at).toLocaleDateString('th-TH')}
                  </TableCell>
                  <TableCell className="text-center">
                    {item.acknowledged ? (
                      <Badge variant="default">ดำเนินการแล้ว</Badge>
                    ) : (
                      <Badge variant="destructive">รอดำเนินการ</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      {!item.acknowledged && onAcknowledge && (
                        <Button 
                          size="sm" 
                          onClick={() => onAcknowledge(item.id)}
                          className="text-xs"
                        >
                          รับทราบ
                        </Button>
                      )}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>การดำเนินการ</DropdownMenuLabel>
                          <DropdownMenuItem>
                            <Eye className="mr-2 h-4 w-4" />
                            ดูสินค้า
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem>
                            <Package className="mr-2 h-4 w-4" />
                            สั่งซื้อสินค้า
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        {filteredData.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            ไม่พบข้อมูลการแจ้งเตือน
          </div>
        )}
      </CardContent>
    </Card>
  )
}

interface DailyReportTableProps {
  data: Array<{
    id: string
    report_date: string
    total_sales: number
    total_orders: number
    total_patients: number
    created_by_username?: string
    created_at: string
  }>
  title?: string
}

export function DailyReportTable({ data, title = "รายงานรายวัน" }: DailyReportTableProps) {
  const [searchTerm, setSearchTerm] = useState("")

  // Calculate totals
  const totals = data.reduce((acc, item) => ({
    total_sales: acc.total_sales + item.total_sales,
    total_orders: acc.total_orders + item.total_orders,
    total_patients: acc.total_patients + item.total_patients
  }), { total_sales: 0, total_orders: 0, total_patients: 0 })

  const filteredData = data.filter(item => 
    new Date(item.report_date).toLocaleDateString('th-TH').includes(searchTerm) ||
    item.created_by_username?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>{title}</CardTitle>
          <div className="flex space-x-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="ค้นหาตามวันที่หรือผู้สร้าง..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-64"
              />
            </div>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              ส่งออก
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-600">
                ฿{totals.total_sales.toLocaleString()}
              </div>
              <div className="text-sm text-gray-600">ยอดขายรวม</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">
                {totals.total_orders.toLocaleString()}
              </div>
              <div className="text-sm text-gray-600">คำสั่งซื้อรวม</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-teal-600">
                {totals.total_patients.toLocaleString()}
              </div>
              <div className="text-sm text-gray-600">ผู้ป่วยรวม</div>
            </CardContent>
          </Card>
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>วันที่</TableHead>
                <TableHead className="text-right">ยอดขาย</TableHead>
                <TableHead className="text-right">จำนวนคำสั่งซื้อ</TableHead>
                <TableHead className="text-right">ผู้ป่วยใหม่</TableHead>
                <TableHead>ผู้สร้างรายงาน</TableHead>
                <TableHead>วันที่สร้าง</TableHead>
                <TableHead className="w-[100px]">การดำเนินการ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredData.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">
                    {new Date(item.report_date).toLocaleDateString('th-TH', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </TableCell>
                  <TableCell className="text-right font-medium text-green-600">
                    ฿{item.total_sales.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right">
                    {item.total_orders.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right">
                    {item.total_patients.toLocaleString()}
                  </TableCell>
                  <TableCell>
                    {item.created_by_username || "-"}
                  </TableCell>
                  <TableCell>
                    {new Date(item.created_at).toLocaleDateString('th-TH')}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>การดำเนินการ</DropdownMenuLabel>
                        <DropdownMenuItem>
                          <Eye className="mr-2 h-4 w-4" />
                          ดูรายละเอียด
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Download className="mr-2 h-4 w-4" />
                          ดาวน์โหลด
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        {filteredData.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            ไม่พบข้อมูลรายงาน
          </div>
        )}
      </CardContent>
    </Card>
  )
}

