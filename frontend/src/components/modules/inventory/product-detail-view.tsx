"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Edit2, ArrowLeft } from "lucide-react"
import { GraphQLAPI } from "@/clients/graphql"
import { logger } from "@/lib/logger"
import EditProductForm from "@/components/forms/EditProductForm"

interface ProductDetailViewProps {
  productId: string
  onBack: () => void
  onEditingChange?: (isEditing: boolean) => void
  productVariants?: any[] // Add this for grouped products
}

interface ProductData {
  id: string
  product_name: string
  product_type: string
  generic_name: string
  short_name: string
  status: string
  category: string
  vat_percent: number
  expiration_warning_date: number
  sale_price: number
  unit: string
  pack_size: string
  reorder_point: number
  cost: number
  sku: string
  barcode: string
  stock_quantity: number
  volume: number
  volume_unit: string
  shelf_code: string
  shelf_row: string
  symptom_category: string[] | string | null
  license_number: string
  dosage_unit: string
  dosage: string
  times_per_day: number
  interval_hours: number
  before_meal: boolean
  after_meal: boolean
  after_meal_immediate: boolean
  morning: string
  noon: string
  evening: string
  before_bed: string
  properties: string
  usage_instruction: string
  sale_note: string
  purchase_note: string
  created_at: string
  updated_at: string
}

export default function ProductDetailView({ productId, onBack, onEditingChange, productVariants }: ProductDetailViewProps) {
  const [product, setProduct] = useState<ProductData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [activeTab, setActiveTab] = useState("general")
  const [showUnitEditDialog, setShowUnitEditDialog] = useState(false)
  const [hasMultipleVariants, setHasMultipleVariants] = useState(false)
  const [unitFormData, setUnitFormData] = useState({
    unit_name: '',
    pack_size: '',
    cost: '',
    reorder_point: '',
    volume: '',
    volume_unit: '',
    shelf_code: '',
    shelf_row: '',
    sku: '',
    barcode: '',
    display_pos: true
  })

  useEffect(() => {
    const loadProduct = async () => {
      try {
        setLoading(true)
        setError(null)
        
        logger.info('Loading product details', { productId }, 'INVENTORY')
        
        const response = await GraphQLAPI.getProduct(productId)
        
        if (response.product) {
          setProduct(response.product)
          logger.info('Product loaded successfully', { 
            productId,
            productName: response.product.product_name 
          }, 'INVENTORY')
        } else {
          setError('ไม่พบข้อมูลสินค้า')
        }
      } catch (err) {
        logger.error('Failed to load product', err, 'INVENTORY')
        setError(err instanceof Error ? err.message : 'ไม่สามารถโหลดข้อมูลสินค้าได้')
      } finally {
        setLoading(false)
      }
    }

    if (productId) {
      loadProduct()
    }
  }, [productId])

  const handleEditClick = () => {
    console.log('ProductDetailView: Switching to edit mode')
    setIsEditing(true)
    onEditingChange?.(true)
  }

  const handleEditBack = () => {
    console.log('ProductDetailView: handleEditBack called, returning to detail view')
    setIsEditing(false)
    onEditingChange?.(false)
  }

  // Unit edit dialog handlers
  const openUnitEditDialog = () => {
    if (product) {
      setUnitFormData({
        unit_name: product.unit || '',
        pack_size: product.pack_size || '',
        cost: product.cost?.toString() || '',
        reorder_point: product.reorder_point?.toString() || '',
        volume: product.volume?.toString() || '',
        volume_unit: product.volume_unit || 'mg',
        shelf_code: product.shelf_code || '',
        shelf_row: product.shelf_row || '',
        sku: product.sku || '',
        barcode: product.barcode || '',
        display_pos: product.status === 'active'
      })
      setShowUnitEditDialog(true)
    }
  }

  const handleUnitSave = () => {
    // TODO: Implement unit update API call
    console.log('Saving unit data:', unitFormData)
    setShowUnitEditDialog(false)
    // You can add API call here to update unit information
  }

  const handleEditSubmit = async (productData: any) => {
    try {
      logger.info('Updating product', { productId, productData }, 'INVENTORY')
      
      // Prepare input data for GraphQL mutation
      const input = {
        product_name: productData.product_name || '',
        product_type: productData.product_type || 'medicine',
        generic_name: productData.generic_name || '',
        short_name: productData.short_name || '',
        status: productData.status || 'active',
        vat_percent: parseInt(productData.vat_percent) || 0,
        // Now backend expects integer (days) which matches our form data
        expiration_warning_date: parseInt(productData.expiration_warning_days) || 90,
        sale_price: parseFloat(productData.sale_price) || 0,
        unit: productData.unit || '',
        pack_size: productData.pack_size || '',
        reorder_point: parseInt(productData.reorder_point) || 0,
        cost: parseFloat(productData.cost) || 0,
        sku: productData.sku || '',
        barcode: productData.barcode || '',
        stock_quantity: parseInt(productData.stock_quantity) || 0,
        shelf_code: productData.shelf_code || '',
        shelf_row: productData.shelf_row || '',
        category: productData.category || '',
        // symptom_category should be JSON string if array is not empty, null if empty
        symptom_category: Array.isArray(productData.symptom_category) && productData.symptom_category.length > 0 
          ? JSON.stringify(productData.symptom_category) 
          : null,
        license_number: productData.license_number || '',
        dosage_unit: productData.dosage_unit || '',
        dosage: productData.dosage || '',
        times_per_day: parseInt(productData.times_per_day) || null,
        interval_hours: parseInt(productData.interval_hours) || null,
        before_meal: Boolean(productData.before_meal),
        after_meal: Boolean(productData.after_meal),
        after_meal_immediate: Boolean(productData.after_meal_immediate),
        // These fields are strings for dosage amounts like "1 เม็ด", "2 เม็ด"
        morning: productData.morning || '',
        noon: productData.noon || '',
        evening: productData.evening || '',
        before_bed: productData.before_bed || '',
        properties: productData.properties || '',
        usage_instruction: productData.usage_instruction || '',
        sale_note: productData.sale_note || '',
        purchase_note: productData.purchase_note || ''
      }

      // Debug: Log the prepared input
      console.log('Prepared input for GraphQL:', input)

      const response = await GraphQLAPI.updateProduct(productId, input)
      
      if (response.updateProduct) {
        // Update local product state with new data
        setProduct(response.updateProduct)
        logger.info('Product updated successfully', { 
          productId,
          productName: response.updateProduct.product_name 
        }, 'INVENTORY')
        
        // Success feedback
        alert('บันทึกข้อมูลสินค้าเรียบร้อยแล้ว')
      }
      
      setIsEditing(false)
      onEditingChange?.(false)
    } catch (error) {
      logger.error('Failed to update product', error, 'INVENTORY')
      
      // Error feedback
      const errorMessage = error instanceof Error ? error.message : 'เกิดข้อผิดพลาดในการบันทึกข้อมูล'
      alert(`ไม่สามารถบันทึกข้อมูลได้: ${errorMessage}`)
    }
  }

  const getProductTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      'medicine': 'ยารักษาโรค',
      'supplement': 'ผลิตภัณฑ์เสริมอาหาร',
      'cosmetic': 'ผลิตภัณฑ์เสริมความงาม',
      'medical-device': 'อุปกรณ์ทางการแพทย์',
      'other-device': 'อุปกรณ์อื่นๆ',
      'food-beverage': 'อาหาร/เครื่องดื่ม',
      'cost-advertising': 'สินค้าต้นทุน/การโฆษณา'
    }
    return types[type] || type
  }

  const getCategoryLabel = (category: string) => {
    const categories: Record<string, string> = {
      'medicine': 'ยา',
      'supplement': 'อาหารเสริม',
      'cosmetics': 'เครื่องสำอาง',
      'medical-device': 'อุปกรณ์การแพทย์'
    }
    return categories[category] || category || 'ไม่ระบุ'
  }

  const getSymptomCategoryLabels = (categories: string[] | string | null | undefined) => {
    const labels: Record<string, string> = {
      'digestive': 'ระบบทางเดินอาหาร',
      'cardiovascular': 'ระบบหัวใจและหลอดเลือด',
      'respiratory': 'ระบบทางเดินหายใจ',
      'nervous': 'ระบบประสาท',
      'antibiotic': 'ยาปฏิชีวนะ ยาฆ่าเชื้อ',
      'endocrine': 'ระบบต่อมไร้ท่อ',
      'gynecology': 'ระบบสูตินรีเวช',
      'cancer': 'มะเร็งและยากดภูมิคุ้มกัน',
      'nutrition': 'สารอาหารและผลิตภัณฑ์เกี่ยวกับเลือด',
      'musculoskeletal': 'กระดูก กล้ามเนื้อ และข้อ',
      'eye': 'ตา',
      'ent': 'หู คอ จมูก และช่องปาก',
      'skin': 'ผิวหนัง',
      'vaccine': 'วัคซีนและภูมิคุ้มกัน',
      'anesthesia': 'ยาดมสลบ',
      'other': 'อื่นๆ ที่เป็นยา'
    }
    
    // Handle different data types from backend
    if (!categories) {
      return []
    }
    
    let categoryArray: string[] = []
    
    if (Array.isArray(categories)) {
      categoryArray = categories
    } else if (typeof categories === 'string') {
      // If it's a JSON string, try to parse it
      try {
        const parsed = JSON.parse(categories)
        if (Array.isArray(parsed)) {
          categoryArray = parsed
        } else {
          // If it's just a single string, treat as single category
          categoryArray = [categories]
        }
      } catch {
        // If parsing fails, treat as single category
        categoryArray = [categories]
      }
    }
    
    return categoryArray.map(cat => labels[cat] || cat)
  }

  const getVatLabel = (vatPercent: number) => {
    if (vatPercent === 0) return 'ไม่มี VAT'
    return `VAT ${vatPercent}%`
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <div className="text-gray-600">กำลังโหลดข้อมูลสินค้า...</div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="text-red-500 mb-4">⚠️</div>
          <div className="text-red-600 mb-2">เกิดข้อผิดพลาด</div>
          <div className="text-gray-500 text-sm mb-4">{error}</div>
          <div className="space-x-2">
            <Button 
              onClick={onBack} 
              variant="outline"
              className="text-gray-600 border-gray-200"
            >
              ย้อนกลับ
            </Button>
            <Button 
              onClick={() => window.location.reload()} 
              variant="outline"
              className="text-purple-600 border-purple-200"
            >
              ลองใหม่
            </Button>
          </div>
        </div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="text-gray-500 mb-4">📦</div>
          <div className="text-gray-600 mb-2">ไม่พบข้อมูลสินค้า</div>
          <Button 
            onClick={onBack} 
            variant="outline"
            className="text-gray-600 border-gray-200"
          >
            ย้อนกลับ
          </Button>
        </div>
      </div>
    )
  }

  if (isEditing) {
    return (
      <EditProductForm 
        onBack={handleEditBack}
        onSubmit={handleEditSubmit}
        initialData={product}
      />
    )
  }

  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onBack}
              className="text-gray-600 hover:text-gray-800"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              ย้อนกลับ
            </Button>
            <div>
              <h1 className="text-2xl font-semibold text-gray-800">{product.product_name}</h1>
              <div className="flex items-center space-x-2 mt-1">
                <Badge variant={product.status === 'active' ? 'default' : 'secondary'}>
                  {product.status === 'active' ? 'แสดงหน้าร้าน' : 'ไม่แสดงหน้าร้าน'}
                </Badge>
                <Badge variant="outline">
                  {getProductTypeLabel(product.product_type)}
                </Badge>
              </div>
            </div>
          </div>
          <Button onClick={handleEditClick} className="bg-purple-500 hover:bg-purple-600">
            <Edit2 className="h-4 w-4 mr-2" />
            แก้ไขสินค้า
          </Button>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="general">ข้อมูลทั่วไป</TabsTrigger>
            <TabsTrigger value="units">หน่วยนับ</TabsTrigger>
            <TabsTrigger value="pricing">ราคาขาย</TabsTrigger>
            <TabsTrigger value="stock">สต๊อกสินค้า</TabsTrigger>
            <TabsTrigger value="history">ประวัติ</TabsTrigger>
          </TabsList>

          {/* ข้อมูลทั่วไป */}
          <TabsContent value="general" className="space-y-6">
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-4">ข้อมูลพื้นฐาน</h3>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="text-sm font-medium text-gray-600">ประเภทสินค้า</label>
                    <div className="mt-1 text-gray-900">{getProductTypeLabel(product.product_type)}</div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">หมวดหมู่สินค้า</label>
                    <div className="mt-1 text-gray-900">{getCategoryLabel(product.category)}</div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">ชื่อสินค้า</label>
                    <div className="mt-1 text-gray-900">{product.product_name}</div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">ชื่อสามัญทางยา</label>
                    <div className="mt-1 text-gray-900">{product.generic_name || '-'}</div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">ชื่อย่อ</label>
                    <div className="mt-1 text-gray-900">{product.short_name || '-'}</div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">การแสดงข้อมูลสินค้า</label>
                    <div className="mt-1">
                      <Badge variant={product.status === 'active' ? 'default' : 'secondary'}>
                        {product.status === 'active' ? 'แสดงหน้าร้าน' : 'ไม่แสดงหน้าร้าน'}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Show all product variants if available */}
            {productVariants && productVariants.length > 1 && (
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold mb-4">หน่วยนับทั้งหมด</h3>
                  <div className="space-y-3">
                    {productVariants.map((variant, index) => (
                      <div key={variant.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <label className="text-xs font-medium text-gray-600">หน่วยนับ</label>
                            <div className="mt-1 text-gray-900">{variant.unit || 'หน่วย'}</div>
                          </div>
                          <div>
                            <label className="text-xs font-medium text-gray-600">ขนาดบรรจุ</label>
                            <div className="mt-1 text-gray-900">{variant.pack_size || '1'}</div>
                          </div>
                          <div>
                            <label className="text-xs font-medium text-gray-600">ราคาขาย</label>
                            <div className="mt-1 text-gray-900">฿{variant.sale_price || 0}</div>
                          </div>
                          <div>
                            <label className="text-xs font-medium text-gray-600">จำนวนในสต๊อก</label>
                            <div className="mt-1 text-gray-900">{variant.stock_quantity || 0}</div>
                          </div>
                          <div>
                            <label className="text-xs font-medium text-gray-600">SKU</label>
                            <div className="mt-1 text-gray-900">{variant.sku || '-'}</div>
                          </div>
                          <div>
                            <label className="text-xs font-medium text-gray-600">บาร์โค้ด</label>
                            <div className="mt-1 text-gray-900">{variant.barcode || '-'}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-4">ข้อมูลเพิ่มเติม</h3>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="text-sm font-medium text-gray-600">วันแจ้งเตือนก่อนวันหมดอายุ</label>
                    <div className="mt-1 text-gray-900">ก่อน {product.expiration_warning_date || 90} วัน</div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">อัตราภาษีมูลค่าเพิ่ม</label>
                    <div className="mt-1 text-gray-900">{getVatLabel(product.vat_percent)}</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {(() => {
              const categoryLabels = getSymptomCategoryLabels(product.symptom_category)
              return categoryLabels.length > 0 && (
                <Card>
                  <CardContent className="p-6">
                    <h3 className="text-lg font-semibold mb-4">หมวดหมู่ยาแยกตามอาการที่รักษา</h3>
                    <div className="flex flex-wrap gap-2">
                      {categoryLabels.map((label, index) => (
                        <Badge key={index} variant="outline">{label}</Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )
            })()}

            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-4">การขึ้นทะเบียนบัญชี</h3>
                <div className="text-gray-600">
                  {product.license_number ? (
                    <div>หมายเลขใบอนุญาต: {product.license_number}</div>
                  ) : (
                    <div>ไม่มีข้อมูลการขึ้นทะเบียน</div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* หน่วยนับ */}
          <TabsContent value="units" className="space-y-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-semibold">ข้อมูลหน่วยนับ</h3>
                  <p className="text-sm text-gray-500">โปรดระบุข้อมูลหน่วยนับของสินค้า</p>
                </div>
                
                {/* Units Table */}
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">ชื่อหน่วยนับ</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">ขนาดบรรจุ</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">ต้นทุน</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">จุดสั่งซื้อ</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">ปริมาณ</th>
                        <th className="px-4 py-3 text-center text-sm font-medium text-gray-600">จัดการ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {/* Primary Unit Row */}
                      <tr className="hover:bg-gray-50">
                        <td className="px-4 py-4">
                          <div className="flex items-center space-x-2">
                            <span className="font-medium text-purple-600">{product.unit}</span>
                            <Badge variant="outline" className="text-xs">แพ็ก</Badge>
                          </div>
                          <div className="text-sm text-gray-500">
                            SKU: {product.sku || 'ไม่มี'}
                          </div>
                          <div className="text-sm text-gray-500">
                            บาร์โค้ด: {product.barcode || 'ไม่มี'}
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <span className="text-gray-900">{product.pack_size || '1'}</span>
                          <div className="text-sm text-gray-500">
                            {product.pack_size ? `${product.pack_size} แผง : 1 กล่อง` : ''}
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <span className="text-gray-900">{product.cost ? `${Number(product.cost).toLocaleString()}` : '-'}</span>
                        </td>
                        <td className="px-4 py-4">
                          <span className="text-gray-900">{product.reorder_point || '-'}</span>
                        </td>
                        <td className="px-4 py-4">
                          <span className="text-gray-900">{product.volume || '500'}mg</span>
                          <div className="text-sm text-gray-500">
                            x{product.pack_size || '20'} แผง
                          </div>
                        </td>
                        <td className="px-4 py-4 text-center">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={openUnitEditDialog}
                            className="text-purple-600 border-purple-200 hover:bg-purple-50"
                          >
                            แก้ไข
                          </Button>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ราคาขาย */}
          <TabsContent value="pricing" className="space-y-6">
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-4">ข้อมูลราคา</h3>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="text-sm font-medium text-gray-600">ราคาขายต่อหน่วย</label>
                    <div className="mt-1 text-2xl font-bold text-purple-600">฿{product.sale_price?.toLocaleString() || 0}</div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">ต้นทุนต่อหน่วย</label>
                    <div className="mt-1 text-xl text-gray-900">฿{product.cost?.toLocaleString() || 0}</div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">กำไรต่อหน่วย</label>
                    <div className="mt-1 text-xl text-green-600">
                      ฿{((product.sale_price || 0) - (product.cost || 0)).toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">อัตราภาษีมูลค่าเพิ่ม</label>
                    <div className="mt-1 text-gray-900">{getVatLabel(product.vat_percent)}</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-4">รหัสสินค้า</h3>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="text-sm font-medium text-gray-600">SKU รหัสสินค้า</label>
                    <div className="mt-1 text-gray-900 font-mono">{product.sku || '-'}</div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">บาร์โค้ด</label>
                    <div className="mt-1 text-gray-900 font-mono">{product.barcode || '-'}</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-4">หมายเหตุ</h3>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">หมายเหตุการขาย</label>
                    <div className="mt-1 text-gray-900 whitespace-pre-wrap">{product.sale_note || '-'}</div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">หมายเหตุการสั่งซื้อ</label>
                    <div className="mt-1 text-gray-900 whitespace-pre-wrap">{product.purchase_note || '-'}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* สต๊อกสินค้า */}
          <TabsContent value="stock" className="space-y-6">
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-4">ข้อมูลสต๊อก</h3>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="text-sm font-medium text-gray-600">จำนวนสต๊อกปัจจุบัน</label>
                    <div className="mt-1 text-2xl font-bold text-blue-600">
                      {product.stock_quantity?.toLocaleString() || 0} {product.unit}
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">จุดสั่งซื้อใหม่</label>
                    <div className="mt-1 text-xl text-orange-600">
                      {product.reorder_point?.toLocaleString() || 0} {product.unit}
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">ตำแหน่งเก็บ - ชั้น</label>
                    <div className="mt-1 text-gray-900">{product.shelf_code || '-'}</div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">ตำแหน่งเก็บ - แถว</label>
                    <div className="mt-1 text-gray-900">{product.shelf_row || '-'}</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-4">สถานะสต๊อก</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <div className="font-medium">สถานะสต๊อก</div>
                      <div className="text-sm text-gray-600">
                        {(product.stock_quantity || 0) <= (product.reorder_point || 0) 
                          ? 'ต้องสั่งซื้อเพิ่ม' 
                          : 'สต๊อกเพียงพอ'
                        }
                      </div>
                    </div>
                    <Badge 
                      variant={(product.stock_quantity || 0) <= (product.reorder_point || 0) ? 'destructive' : 'default'}
                    >
                      {(product.stock_quantity || 0) <= (product.reorder_point || 0) ? 'สต๊อกต่ำ' : 'ปกติ'}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ประวัติ */}
          <TabsContent value="history" className="space-y-6">
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-4">ประวัติการเปลี่ยนแปลง</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                    <div>
                      <div className="font-medium">สร้างสินค้า</div>
                      <div className="text-sm text-gray-600">
                        {new Date(product.created_at).toLocaleDateString('th-TH', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                    </div>
                  </div>
                  
                  {product.updated_at !== product.created_at && (
                    <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                      <div>
                        <div className="font-medium">แก้ไขล่าสุด</div>
                        <div className="text-sm text-gray-600">
                          {new Date(product.updated_at).toLocaleDateString('th-TH', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-4">ประวัติการขาย (Mockup)</h3>
                <div className="text-center text-gray-500 py-8">
                  <div className="text-4xl mb-2">📊</div>
                  <div>ฟีเจอร์นี้กำลังอยู่ในระหว่างการพัฒนา</div>
                  <div className="text-sm mt-2">ประวัติการขาย การรับเข้าสินค้า และการเปลี่ยนแปลงสต๊อก</div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Unit Edit Dialog */}
      <Dialog open={showUnitEditDialog} onOpenChange={setShowUnitEditDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setShowUnitEditDialog(false)}
                  className="p-2"
                >
                  ปิด
                </Button>
                <DialogTitle className="text-lg font-semibold">แก้ไขหน่วยนับ</DialogTitle>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                className="text-purple-600 border-purple-200 hover:bg-purple-50"
              >
                แก้ไข
              </Button>
            </div>
            <p className="text-sm text-gray-500 mt-2">โปรดระบุข้อมูลหน่วยนับของสินค้า</p>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            {/* ชื่อหน่วยนับ ภาษาไทย, อังกฤษ และตัวเลข */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label className="text-sm font-medium text-gray-700">
                  ชื่อหน่วยนับ <span className="text-gray-400">ภาษาไทย, อังกฤษ และตัวเลข</span>
                </Label>
                <Input
                  value={unitFormData.unit_name}
                  onChange={(e) => setUnitFormData(prev => ({ ...prev, unit_name: e.target.value }))}
                  className="mt-2"
                  placeholder="แผง"
                />
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-700">ขนาดบรรจุ</Label>
                <Input
                  value={unitFormData.pack_size}
                  onChange={(e) => setUnitFormData(prev => ({ ...prev, pack_size: e.target.value }))}
                  className="mt-2"
                  placeholder="10"
                />
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-700">
                  ปริมาณ <span className="text-gray-400">หรือ น้ำหนัก</span>
                </Label>
                <div className="flex space-x-2 mt-2">
                  <Input
                    value={unitFormData.volume}
                    onChange={(e) => setUnitFormData(prev => ({ ...prev, volume: e.target.value }))}
                    className="flex-1"
                    placeholder="500"
                  />
                  <div className="bg-purple-100 text-purple-600 px-3 py-2 rounded-md text-sm font-medium min-w-[50px] flex items-center justify-center">
                    mg
                  </div>
                </div>
              </div>
            </div>

            {/* ต้นทุนต่อหน่วย และจำนวนแถว */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium text-gray-700">ต้นทุนต่อหน่วย</Label>
                <Input
                  value={unitFormData.cost}
                  onChange={(e) => setUnitFormData(prev => ({ ...prev, cost: e.target.value }))}
                  className="mt-2"
                  placeholder="หลังร้าน"
                />
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-700">จำนวนแถว</Label>
                <Input
                  value={unitFormData.reorder_point}
                  onChange={(e) => setUnitFormData(prev => ({ ...prev, reorder_point: e.target.value }))}
                  className="mt-2"
                  placeholder="10"
                />
              </div>
            </div>

            {/* บาร์โค้ด และ รหัสสินค้า */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium text-gray-700">บาร์โค้ด</Label>
                <Input
                  value={unitFormData.barcode}
                  onChange={(e) => setUnitFormData(prev => ({ ...prev, barcode: e.target.value }))}
                  className="mt-2"
                  placeholder="8851473004000"
                />
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-700">รหัสสินค้า SKU</Label>
                <Input
                  value={unitFormData.sku}
                  onChange={(e) => setUnitFormData(prev => ({ ...prev, sku: e.target.value }))}
                  className="mt-2"
                  placeholder="SKU0011204"
                />
              </div>
            </div>

            {/* สวิตช์แสดงหน่วยนับหน้าร้าน POS */}
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <div className="font-medium text-gray-900">แสดงหน่วยนับหน้าร้าน POS</div>
              </div>
              <Switch
                checked={unitFormData.display_pos}
                onCheckedChange={(checked) => setUnitFormData(prev => ({ ...prev, display_pos: checked }))}
                className="data-[state=checked]:bg-purple-500"
              />
            </div>
          </div>

          <DialogFooter className="pt-4 border-t">
            <Button 
              variant="outline" 
              onClick={() => setShowUnitEditDialog(false)}
            >
              ยกเลิก
            </Button>
            <Button 
              onClick={handleUnitSave}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              ลบหน่วยนับ
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
