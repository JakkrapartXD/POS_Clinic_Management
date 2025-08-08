"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Download, FileText, Filter } from "lucide-react"

interface ExportProductsViewProps {
  onBack: () => void
  onExport: (data: any) => void
}

export default function ExportProductsView({ onBack, onExport }: ExportProductsViewProps) {
  const [exportSettings, setExportSettings] = useState({
    format: 'xlsx',
    includeImages: false,
    includeStock: true,
    includePrices: true,
    includeSuppliers: false,
    dateRange: 'all',
    category: 'all',
    stockStatus: 'all'
  })

  const handleExport = () => {
    onExport(exportSettings)
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-gray-800 mb-2">ส่งออกยอดสินค้า</h2>
        <p className="text-gray-600">ส่งออกข้อมูลสินค้าเป็นไฟล์ Excel หรือ CSV</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Export Format */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileText className="h-5 w-5 mr-2" />
              รูปแบบไฟล์
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>เลือกรูปแบบไฟล์</Label>
              <Select
                value={exportSettings.format}
                onValueChange={(value) => setExportSettings(prev => ({ ...prev, format: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="xlsx">Excel (.xlsx)</SelectItem>
                  <SelectItem value="csv">CSV (.csv)</SelectItem>
                  <SelectItem value="pdf">PDF Report</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <Label>ข้อมูลที่ต้องการส่งออก</Label>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="includeStock"
                  checked={exportSettings.includeStock}
                  onCheckedChange={(checked) => setExportSettings(prev => ({
                    ...prev,
                    includeStock: checked as boolean
                  }))}
                />
                <Label htmlFor="includeStock" className="text-sm">ข้อมูลสต็อก</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="includePrices"
                  checked={exportSettings.includePrices}
                  onCheckedChange={(checked) => setExportSettings(prev => ({
                    ...prev,
                    includePrices: checked as boolean
                  }))}
                />
                <Label htmlFor="includePrices" className="text-sm">ราคาสินค้า</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="includeSuppliers"
                  checked={exportSettings.includeSuppliers}
                  onCheckedChange={(checked) => setExportSettings(prev => ({
                    ...prev,
                    includeSuppliers: checked as boolean
                  }))}
                />
                <Label htmlFor="includeSuppliers" className="text-sm">ข้อมูลผู้จำหน่าย</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="includeImages"
                  checked={exportSettings.includeImages}
                  onCheckedChange={(checked) => setExportSettings(prev => ({
                    ...prev,
                    includeImages: checked as boolean
                  }))}
                />
                <Label htmlFor="includeImages" className="text-sm">รูปภาพสินค้า</Label>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Filter className="h-5 w-5 mr-2" />
              ตัวกรอง
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>หมวดหมู่สินค้า</Label>
              <Select
                value={exportSettings.category}
                onValueChange={(value) => setExportSettings(prev => ({ ...prev, category: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">ทั้งหมด</SelectItem>
                  <SelectItem value="medicine">ยา</SelectItem>
                  <SelectItem value="medical-equipment">เครื่องมือแพทย์</SelectItem>
                  <SelectItem value="supplements">อาหารเสริม</SelectItem>
                  <SelectItem value="cosmetics">เครื่องสำอาง</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>สถานะสต็อก</Label>
              <Select
                value={exportSettings.stockStatus}
                onValueChange={(value) => setExportSettings(prev => ({ ...prev, stockStatus: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">ทั้งหมด</SelectItem>
                  <SelectItem value="in-stock">มีสต็อก</SelectItem>
                  <SelectItem value="low-stock">สต็อกต่ำ</SelectItem>
                  <SelectItem value="out-of-stock">หมดสต็อก</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>ช่วงเวลา</Label>
              <Select
                value={exportSettings.dateRange}
                onValueChange={(value) => setExportSettings(prev => ({ ...prev, dateRange: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">ทั้งหมด</SelectItem>
                  <SelectItem value="today">วันนี้</SelectItem>
                  <SelectItem value="week">สัปดาห์นี้</SelectItem>
                  <SelectItem value="month">เดือนนี้</SelectItem>
                  <SelectItem value="quarter">ไตรมาสนี้</SelectItem>
                  <SelectItem value="year">ปีนี้</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Preview */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>ตัวอย่างข้อมูลที่จะส่งออก</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="grid grid-cols-4 gap-4 text-xs font-medium text-gray-600 border-b pb-2 mb-2">
              <div>รหัสสินค้า</div>
              <div>ชื่อสินค้า</div>
              <div>สต็อก</div>
              <div>ราคา</div>
            </div>
            <div className="space-y-1 text-xs text-gray-700">
              <div className="grid grid-cols-4 gap-4 py-1">
                <div>PRD001</div>
                <div>3M Futuro Ankle Size M</div>
                <div>4 BX</div>
                <div>฿290</div>
              </div>
              <div className="grid grid-cols-4 gap-4 py-1">
                <div>PRD002</div>
                <div>Gaviscon Suspension</div>
                <div>8 ซอง</div>
                <div>฿29</div>
              </div>
              <div className="grid grid-cols-4 gap-4 py-1">
                <div>PRD003</div>
                <div>ชาร่า ยาเม็ดบรรเทาปวด</div>
                <div>10 แผง</div>
                <div>฿9</div>
              </div>
            </div>
            <div className="mt-2 pt-2 border-t text-xs text-gray-500">
              + อีก 150 รายการ (ตัวอย่าง)
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex justify-end space-x-3 mt-6">
        <Button variant="outline" onClick={onBack}>
          ยกเลิก
        </Button>
        <Button 
          onClick={handleExport}
          className="bg-purple-500 hover:bg-purple-600"
        >
          <Download className="h-4 w-4 mr-2" />
          ส่งออกข้อมูล
        </Button>
      </div>
    </div>
  )
}
