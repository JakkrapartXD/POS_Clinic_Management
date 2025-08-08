"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Trash2, Search, AlertTriangle, Package } from "lucide-react"

interface DeleteProductsViewProps {
  onBack: () => void
  onDelete: (data: any) => void
}

export default function DeleteProductsView({ onBack, onDelete }: DeleteProductsViewProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedProducts, setSelectedProducts] = useState<number[]>([])
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleteReason, setDeleteReason] = useState("")

  // Mock products data
  const products = [
    { id: 1, name: "3M Futuro Ankle Size M", variant: "BX", stock: 4, price: 290 },
    { id: 2, name: "Gaviscon Suspension รสเปปเปอร์มินต์", variant: "ซอง", stock: 8, price: 29 },
    { id: 3, name: "ชาร่า ยาเม็ดบรรเทาปวด ลดไข้", variant: "แผง", stock: 10, price: 9 },
    { id: 4, name: "ยาแก้อักเสบ อีตัว XXXX", variant: "แผง", stock: 0, price: 18 },
  ]

  const filteredProducts = products.filter(product => 
    product.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleProductSelect = (productId: number) => {
    setSelectedProducts(prev => 
      prev.includes(productId) 
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    )
  }

  const handleSelectAll = () => {
    if (selectedProducts.length === filteredProducts.length) {
      setSelectedProducts([])
    } else {
      setSelectedProducts(filteredProducts.map(p => p.id))
    }
  }

  const handleDelete = () => {
    if (selectedProducts.length > 0 && confirmDelete) {
      onDelete({
        productIds: selectedProducts,
        reason: deleteReason
      })
    }
  }

  const canDelete = selectedProducts.length > 0 && confirmDelete && deleteReason.trim()

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-gray-800 mb-2">ลบสินค้า</h2>
        <p className="text-gray-600">เลือกสินค้าที่ต้องการลบออกจากระบบ</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Product Selection */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Package className="h-5 w-5 mr-2" />
                เลือกสินค้า
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* Search */}
              <div className="mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="ค้นหาสินค้า..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Select All */}
              <div className="flex items-center space-x-2 mb-4 pb-2 border-b">
                <Checkbox
                  id="selectAll"
                  checked={selectedProducts.length === filteredProducts.length && filteredProducts.length > 0}
                  onCheckedChange={handleSelectAll}
                />
                <Label htmlFor="selectAll" className="text-sm font-medium">
                  เลือกทั้งหมด ({filteredProducts.length} รายการ)
                </Label>
              </div>

              {/* Product List */}
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {filteredProducts.map((product) => (
                  <div
                    key={product.id}
                    className={`p-3 border rounded-lg transition-colors ${
                      selectedProducts.includes(product.id)
                        ? 'border-red-200 bg-red-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <Checkbox
                        id={`product-${product.id}`}
                        checked={selectedProducts.includes(product.id)}
                        onCheckedChange={() => handleProductSelect(product.id)}
                      />
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">{product.name}</div>
                        <div className="text-sm text-gray-500">
                          {product.variant} • สต็อก: {product.stock} • ฿{product.price}
                        </div>
                      </div>
                      {product.stock > 0 && (
                        <div className="text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded">
                          มีสต็อก
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {filteredProducts.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    ไม่พบสินค้าที่ตรงกับการค้นหา
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Delete Settings */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center text-red-600">
                <Trash2 className="h-5 w-5 mr-2" />
                ยืนยันการลบ
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Selected Count */}
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="text-sm text-gray-600">สินค้าที่เลือก</div>
                <div className="text-2xl font-bold text-gray-800">
                  {selectedProducts.length}
                </div>
                <div className="text-xs text-gray-500">รายการ</div>
              </div>

              {/* Reason */}
              <div className="space-y-2">
                <Label htmlFor="deleteReason">เหตุผลในการลบ *</Label>
                <textarea
                  id="deleteReason"
                  value={deleteReason}
                  onChange={(e) => setDeleteReason(e.target.value)}
                  placeholder="กรุณาระบุเหตุผลในการลบสินค้า..."
                  className="w-full p-2 border border-gray-300 rounded-md text-sm h-20 resize-none"
                  required
                />
              </div>

              {/* Confirmation */}
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="confirmDelete"
                  checked={confirmDelete}
                  onCheckedChange={(checked) => setConfirmDelete(checked as boolean)}
                />
                <Label htmlFor="confirmDelete" className="text-sm text-red-600">
                  ฉันยืนยันที่จะลบสินค้าเหล่านี้
                </Label>
              </div>

              {/* Warning */}
              <Alert className="border-red-200 bg-red-50">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-700 text-sm">
                  การลบสินค้าไม่สามารถยกเลิกได้ กรุณาตรวจสอบข้อมูลให้แน่ใจก่อนดำเนินการ
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Summary */}
      {selectedProducts.length > 0 && (
        <Card className="mt-6 border-red-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-red-700">
                  กำลังจะลบ {selectedProducts.length} รายการ
                </div>
                <div className="text-sm text-red-600">
                  การดำเนินการนี้จะลบสินค้าออกจากระบบอย่างถาวร
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-500">รวมสต็อกที่จะลบ</div>
                <div className="font-bold text-red-600">
                  {selectedProducts.reduce((sum, id) => {
                    const product = products.find(p => p.id === id)
                    return sum + (product?.stock || 0)
                  }, 0)} หน่วย
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      <div className="flex justify-end space-x-3 mt-6">
        <Button variant="outline" onClick={onBack}>
          ยกเลิก
        </Button>
        <Button 
          onClick={handleDelete}
          disabled={!canDelete}
          variant="destructive"
        >
          <Trash2 className="h-4 w-4 mr-2" />
          ลบสินค้า ({selectedProducts.length})
        </Button>
      </div>
    </div>
  )
}
