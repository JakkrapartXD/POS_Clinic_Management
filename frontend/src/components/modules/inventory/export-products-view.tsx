"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Download, FileText } from "lucide-react"

interface Product {
  id: string
  product_name: string
  product_type?: string | { id: string; name: string; description?: string; code?: string }
  short_name?: string
  sale_price: number
  unit?: string
  stock_quantity: number
  sku?: string
  barcode?: string
  category?: string | { id: string; name: string; description?: string; code?: string }
  status?: string
  pack_size?: string
}

interface ExportProductsViewProps {
  onBack: () => void
  onExport: (data: any) => void
  products: Product[]
}

export default function ExportProductsView({ onBack, onExport, products }: ExportProductsViewProps) {
  const handleExport = () => {
    onExport({ format: 'csv' })
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-gray-800 mb-2">ส่งออกยอดสินค้า</h2>
        <p className="text-gray-600">ส่งออกข้อมูลสินค้าเป็นไฟล์ CSV ภาษาไทยในรูปแบบเดียวกับไฟล์ตัวอย่าง</p>
      </div>

      {/* Export Information */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center">
            <FileText className="h-5 w-5 mr-2" />
            ข้อมูลการส่งออก
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-center space-x-2 text-blue-800">
              <FileText className="h-5 w-5" />
              <span className="font-medium">รูปแบบไฟล์: CSV (.csv)</span>
            </div>
            <p className="text-blue-700 text-sm mt-2">
              ข้อมูลสินค้าทั้งหมดจะถูกส่งออกในรูปแบบ CSV ภาษาไทยตามรูปแบบของไฟล์ตัวอย่าง
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Products Table */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>รายการสินค้าที่จะส่งออก ({products.length} รายการ)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-300">
              <thead>
                <tr className="bg-gray-50">
                  <th className="border border-gray-300 px-3 py-2 text-left text-sm font-medium text-gray-700">ชื่อสินค้า</th>
                  <th className="border border-gray-300 px-3 py-2 text-left text-sm font-medium text-gray-700">ประเภท</th>
                  <th className="border border-gray-300 px-3 py-2 text-left text-sm font-medium text-gray-700">ชื่อย่อ</th>
                  <th className="border border-gray-300 px-3 py-2 text-left text-sm font-medium text-gray-700">ราคา</th>
                  <th className="border border-gray-300 px-3 py-2 text-left text-sm font-medium text-gray-700">หน่วย</th>
                  <th className="border border-gray-300 px-3 py-2 text-left text-sm font-medium text-gray-700">คงเหลือ</th>
                  <th className="border border-gray-300 px-3 py-2 text-left text-sm font-medium text-gray-700">SKU</th>
                  <th className="border border-gray-300 px-3 py-2 text-left text-sm font-medium text-gray-700">บาร์โค้ด</th>
                  <th className="border border-gray-300 px-3 py-2 text-left text-sm font-medium text-gray-700">หมวดหมู่</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product, index) => (
                  <tr key={product.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="border border-gray-300 px-3 py-2 text-sm text-gray-900">{product.product_name || '-'}</td>
                    <td className="border border-gray-300 px-3 py-2 text-sm text-gray-900">
                      {typeof product.product_type === 'object' && product.product_type?.name 
                        ? product.product_type.name 
                        : (product.product_type as string) || '-'}
                    </td>
                    <td className="border border-gray-300 px-3 py-2 text-sm text-gray-900">{product.short_name || '-'}</td>
                    <td className="border border-gray-300 px-3 py-2 text-sm text-gray-900">{product.sale_price ? `฿${product.sale_price}` : '-'}</td>
                    <td className="border border-gray-300 px-3 py-2 text-sm text-gray-900">{product.unit || '-'}</td>
                    <td className="border border-gray-300 px-3 py-2 text-sm text-gray-900">{product.stock_quantity || 0}</td>
                    <td className="border border-gray-300 px-3 py-2 text-sm text-gray-900">{product.sku || '-'}</td>
                    <td className="border border-gray-300 px-3 py-2 text-sm text-gray-900">{product.barcode || '-'}</td>
                    <td className="border border-gray-300 px-3 py-2 text-sm text-gray-900">
                      {typeof product.category === 'object' && product.category?.name 
                        ? product.category.name 
                        : (product.category as string) || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {products.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                ไม่มีข้อมูลสินค้า
              </div>
            )}
          </div>
          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>หมายเหตุ:</strong> ข้อมูลทั้งหมดข้างต้นจะถูกส่งออกในรูปแบบ CSV ภาษาไทยตามรูปแบบของไฟล์ตัวอย่าง sample_item_data.csv
            </p>
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
