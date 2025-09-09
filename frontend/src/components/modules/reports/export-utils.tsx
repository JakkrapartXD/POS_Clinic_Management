'use client'

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  Download, 
  FileText, 
  FileSpreadsheet, 
  Image,
  Printer,
  Calendar
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface ExportButtonProps {
  data: any[]
  filename: string
  title?: string
}

export function ExportButton({ data, filename, title = "ส่งออกข้อมูล" }: ExportButtonProps) {
  const exportToCSV = () => {
    if (!data || data.length === 0) {
      alert("ไม่มีข้อมูลให้ส่งออก")
      return
    }

    const headers = Object.keys(data[0])
    const csvContent = [
      headers.join(","),
      ...data.map(row => 
        headers.map(header => {
          const value = row[header]
          // Handle nested objects
          if (typeof value === 'object' && value !== null) {
            return JSON.stringify(value).replace(/"/g, '""')
          }
          // Escape commas and quotes
          return `"${String(value).replace(/"/g, '""')}"`
        }).join(",")
      )
    ].join("\n")

    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", `${filename}.csv`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const exportToJSON = () => {
    if (!data || data.length === 0) {
      alert("ไม่มีข้อมูลให้ส่งออก")
      return
    }

    const jsonContent = JSON.stringify(data, null, 2)
    const blob = new Blob([jsonContent], { type: "application/json" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", `${filename}.json`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const printReport = () => {
    window.print()
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
          <Download className="h-4 w-4 mr-2" />
          {title}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>รูปแบบการส่งออก</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={exportToCSV}>
          <FileSpreadsheet className="mr-2 h-4 w-4" />
          ไฟล์ CSV
        </DropdownMenuItem>
        <DropdownMenuItem onClick={exportToJSON}>
          <FileText className="mr-2 h-4 w-4" />
          ไฟล์ JSON
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={printReport}>
          <Printer className="mr-2 h-4 w-4" />
          พิมพ์รายงาน
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

interface ReportSchedulerProps {
  onSchedule: (schedule: any) => void
}

export function ReportScheduler({ onSchedule }: ReportSchedulerProps) {
  const scheduleOptions = [
    { value: "daily", label: "รายวัน", description: "ส่งรายงานทุกวันเวลา 09:00" },
    { value: "weekly", label: "รายสัปดาห์", description: "ส่งรายงานทุกวันจันทร์เวลา 08:00" },
    { value: "monthly", label: "รายเดือน", description: "ส่งรายงานวันที่ 1 ของทุกเดือนเวลา 08:00" },
    { value: "custom", label: "กำหนดเอง", description: "กำหนดเวลาส่งรายงานเอง" }
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Calendar className="mr-2 h-5 w-5" />
          กำหนดการส่งรายงานอัตโนมัติ
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {scheduleOptions.map((option) => (
            <div 
              key={option.value}
              className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer"
              onClick={() => onSchedule(option)}
            >
              <div className="flex justify-between items-center">
                <div>
                  <div className="font-medium">{option.label}</div>
                  <div className="text-sm text-gray-500">{option.description}</div>
                </div>
                <Badge variant="outline">ยังไม่เปิดใช้งาน</Badge>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

interface ReportTemplateProps {
  templates: Array<{
    id: string
    name: string
    description: string
    type: string
    lastUsed?: string
  }>
  onUseTemplate: (templateId: string) => void
}

export function ReportTemplates({ templates, onUseTemplate }: ReportTemplateProps) {
  const defaultTemplates = [
    {
      id: "daily-sales",
      name: "รายงานยอดขายรายวัน",
      description: "รายงานสรุปยอดขายและคำสั่งซื้อในแต่ละวัน",
      type: "sales",
      lastUsed: "2024-01-15"
    },
    {
      id: "inventory-status",
      name: "รายงานสถานะสินค้าคงคลัง",
      description: "รายงานสินค้าคงคลัง สินค้าใกล้หมด และการแจ้งเตือน",
      type: "inventory",
      lastUsed: "2024-01-14"
    },
    {
      id: "monthly-summary",
      name: "รายงานสรุปรายเดือน",
      description: "รายงานสรุปผลการดำเนินงานรายเดือน",
      type: "summary",
      lastUsed: "2024-01-01"
    },
    {
      id: "customer-analysis",
      name: "รายงานการวิเคราะห์ลูกค้า",
      description: "รายงานข้อมูลและพฤติกรรมของลูกค้า",
      type: "customer",
      lastUsed: null
    }
  ]

  const allTemplates = templates.length > 0 ? templates : defaultTemplates

  const getTypeColor = (type: string) => {
    switch (type) {
      case "sales": return "bg-green-100 text-green-800"
      case "inventory": return "bg-blue-100 text-blue-800"
      case "summary": return "bg-purple-100 text-purple-800"
      case "customer": return "bg-orange-100 text-orange-800"
      default: return "bg-gray-100 text-gray-800"
    }
  }

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "sales": return "ยอดขาย"
      case "inventory": return "คลังสินค้า"
      case "summary": return "สรุป"
      case "customer": return "ลูกค้า"
      default: return type
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <FileText className="mr-2 h-5 w-5" />
          เทมเพลตรายงาน
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {allTemplates.map((template) => (
            <div 
              key={template.id}
              className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer"
              onClick={() => onUseTemplate(template.id)}
            >
              <div className="flex justify-between items-start mb-2">
                <div className="font-medium">{template.name}</div>
                <Badge 
                  variant="secondary" 
                  className={getTypeColor(template.type)}
                >
                  {getTypeLabel(template.type)}
                </Badge>
              </div>
              <div className="text-sm text-gray-600 mb-3">
                {template.description}
              </div>
              <div className="flex justify-between items-center">
                <div className="text-xs text-gray-500">
                  {template.lastUsed ? 
                    `ใช้ครั้งสุดท้าย: ${new Date(template.lastUsed).toLocaleDateString('th-TH')}` :
                    "ยังไม่เคยใช้"
                  }
                </div>
                <Button size="sm" variant="outline">
                  ใช้เทมเพลต
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

// Utility function to format data for charts
export const formatChartData = (data: any[], xKey: string, yKey: string, groupBy?: string) => {
  if (groupBy) {
    const grouped = data.reduce((acc, item) => {
      const key = item[groupBy]
      if (!acc[key]) {
        acc[key] = { [xKey]: key, [yKey]: 0, count: 0 }
      }
      acc[key][yKey] += item[yKey]
      acc[key].count += 1
      return acc
    }, {})
    
    return Object.values(grouped)
  }
  
  return data.map(item => ({
    [xKey]: item[xKey],
    [yKey]: item[yKey]
  }))
}

// Utility function to calculate summary statistics
export const calculateSummaryStats = (data: any[], valueKey: string) => {
  if (!data || data.length === 0) {
    return { total: 0, average: 0, min: 0, max: 0, count: 0 }
  }

  const values = data.map(item => item[valueKey]).filter(val => typeof val === 'number')
  
  return {
    total: values.reduce((sum, val) => sum + val, 0),
    average: values.reduce((sum, val) => sum + val, 0) / values.length,
    min: Math.min(...values),
    max: Math.max(...values),
    count: values.length
  }
}

