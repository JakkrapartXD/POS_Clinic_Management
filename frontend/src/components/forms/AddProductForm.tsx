"use client"

import { useState, useEffect } from "react"
import { GraphQLAPI } from "@/clients/graphql"
import { API_CONFIG } from "@/config/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Checkbox } from "@/components/ui/checkbox"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent } from "@/components/ui/card"
import ProductImageUpload from "@/components/common/ProductImageUpload"


interface AddProductFormProps {
  onBack: () => void
  onSubmit: (productData: any) => void
  submitTrigger?: number // Increment this to trigger form submission
}

interface ProductFormData {
  // Basic Information
  product_name: string
  product_type: string
  generic_name: string
  short_name: string
  category: string
  status: string
  
  // Pricing and Units
  sale_price: string
  cost: string
  unit: string
  pack_size: string
  vat_percent: string
  
  // Inventory
  stock_quantity: string
  reorder_point: string
  sku: string
  barcode: string
  shelf_code: string
  shelf_row: string
  
  // Expiry
  expiration_warning_days: string
  
  // Symptom Category
  symptom_category: string[]
  
  // Registration
  license_number: string
  report_type: string[]
  
  // Dosage Information
  dosage_unit: string
  dosage: string
  times_per_day: string
  interval_hours: string
  before_meal: boolean
  after_meal: boolean
  after_meal_immediate: boolean
  
  // Timing
  morning: string
  noon: string
  evening: string
  before_bed: string
  
  // Instructions and Notes
  properties: string
  usage_instruction: string
  sale_note: string
  purchase_note: string
  
  // Label Settings
  auto_print_label: boolean
  show_dosage_table: boolean
  
  // Image
  image: File | null
  image_url: string
}

export default function AddProductForm({ onBack, onSubmit, submitTrigger }: AddProductFormProps) {
  
  // Separate state for Select components to handle controlled/uncontrolled issues
  const [selectValues, setSelectValues] = useState({
    category: "",
    product_type: "medicine",
    status: "active"
  })
  
  const [formData, setFormData] = useState<ProductFormData>({
    product_name: "",
    product_type: "medicine",
    generic_name: "",
    short_name: "",
    category: "",
    status: "active",
    sale_price: "",
    cost: "",
    unit: "",
    pack_size: "",
    vat_percent: "0",
    stock_quantity: "0",
    reorder_point: "",
    sku: "",
    barcode: "",
    shelf_code: "",
    shelf_row: "",
    expiration_warning_days: "90",
    symptom_category: [],
    license_number: "",
    report_type: [],
    dosage_unit: "",
    dosage: "",
    times_per_day: "",
    interval_hours: "",
    before_meal: false,
    after_meal: false,
    after_meal_immediate: false,
    morning: "",
    noon: "",
    evening: "",
    before_bed: "",
    properties: "",
    usage_instruction: "",
    sale_note: "",
    purchase_note: "",
    auto_print_label: false,
    show_dosage_table: false,
    image: null,
    image_url: ""
  })

  const handleInputChange = (field: keyof ProductFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleImageChange = (file: File | null, imageUrl?: string) => {
    setFormData(prev => ({ 
      ...prev, 
      image: file,
      image_url: imageUrl || ''
    }))
  }


  const handleReportTypeChange = (reportType: string, checked: boolean) => {
    const currentReports = formData.report_type
    if (checked) {
      handleInputChange('report_type', [...currentReports, reportType])
    } else {
      handleInputChange('report_type', currentReports.filter(r => r !== reportType))
    }
  }

  const handleSubmit = async () => {
    // Validate required fields
    if (!formData.product_name || !formData.sale_price) {
      alert('กรุณากรอกข้อมูลที่จำเป็น')
      return
    }
    
    try {
      // Upload image first if there's a new file
      let imageUrl = formData.image_url
      if (formData.image) {
        try {
          const uploadResult = await GraphQLAPI.uploadImage(formData.image, 'product')
          imageUrl = uploadResult.url
        } catch (error) {
          console.error('Failed to upload image:', error)
          alert('ไม่สามารถอัพโหลดรูปภาพได้ กรุณาลองใหม่')
          return
        }
      }
      
      // Update formData with the uploaded image URL
      const updatedFormData = {
        ...formData,
        image_url: imageUrl
      }
      
      await onSubmit(updatedFormData)
      
      // Delete old image if exists
      if (formData.image_url) {
        try {
          console.log('Deleting old image:', formData.image_url)
          // Extract filename from URL
          const urlParts = formData.image_url.split('/')
          const filename = urlParts[urlParts.length - 1]
          const category = urlParts[urlParts.length - 2]
          
          if (filename && category) {
            await GraphQLAPI.deleteImage(filename, category as 'product' | 'user' | 'patient')
            console.log('Old image deleted successfully')
          }
        } catch (error) {
          console.warn('Failed to delete old image:', error)
          // Continue even if old image deletion fails
        }
      }
    } catch (error) {
      console.error('Error submitting form:', error)
    }
  }





  // Listen for external submit trigger
  useEffect(() => {
    if (submitTrigger && submitTrigger > 0) {
      handleSubmit()
    }
  }, [submitTrigger])

  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* General Information */}
        <Card>
          <CardContent className="p-6">
            <h2 className="text-lg font-semibold text-gray-700 mb-4">ข้อมูลทั่วไป</h2>
            <p className="text-sm text-gray-500 mb-6">โปรดระบุข้อมูลสินค้า</p>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <Label className="text-sm font-medium text-gray-700">หมวดหมู่สินค้า</Label>

                <Select 
                  value={selectValues.category || 'not-specified'} 
                  onValueChange={(value) => {
                    const actualValue = value === 'not-specified' ? '' : value
                    setSelectValues(prev => ({ ...prev, category: actualValue }))
                    handleInputChange('category', actualValue)
                  }}
                >
                  <SelectTrigger className="mt-2 h-12 px-4 rounded-xl border-2 border-gray-200 bg-white focus:bg-white focus:border-purple-300 focus:ring-2 focus:ring-purple-100 transition-all duration-200 shadow-sm">
                    <SelectValue placeholder="ไม่จำเป็นต้องระบุ" />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    <SelectItem value="not-specified">ไม่จำเป็นต้องระบุ</SelectItem>
                    <SelectItem value="medicine">ยา</SelectItem>
                    <SelectItem value="supplement">อาหารเสริม</SelectItem>
                    <SelectItem value="cosmetics">เครื่องสำอาง</SelectItem>
                    <SelectItem value="medical-device">อุปกรณ์การแพทย์</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-700">ประเภทสินค้า</Label>

                <Select 
                  value={selectValues.product_type} 
                  onValueChange={(value) => {
                    setSelectValues(prev => ({ ...prev, product_type: value }))
                    handleInputChange('product_type', value)
                  }}
                >
                  <SelectTrigger className="mt-2 h-12 px-4 rounded-xl border-2 border-gray-200 bg-white focus:bg-white focus:border-purple-300 focus:ring-2 focus:ring-purple-100 transition-all duration-200 shadow-sm">
                    <SelectValue placeholder="ยารักษาโรค" />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    <SelectItem value="medicine">ยารักษาโรค</SelectItem>
                    <SelectItem value="supplement">ผลิตภัณฑ์เสริมอาหาร</SelectItem>
                    <SelectItem value="cosmetic">ผลิตภัณฑ์เสริมความงาม</SelectItem>
                    <SelectItem value="medical-device">อุปกรณ์ทางการแพทย์</SelectItem>
                    <SelectItem value="other-device">อุปกรณ์อื่นๆ</SelectItem>
                    <SelectItem value="food-beverage">อาหาร/เครื่องดื่ม</SelectItem>
                    <SelectItem value="cost-advertising">สินค้าต้นทุน/การโฆษณา</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium text-gray-700">
                  ชื่อสินค้า <span className="text-gray-400">แสดงหน้าร้าน POS</span>
                </Label>
                <Input
                  value={formData.product_name}
                  onChange={(e) => handleInputChange('product_name', e.target.value)}
                  className="mt-2 h-12 px-4 rounded-xl border-2 border-gray-200 bg-gray-50 focus:bg-white focus:border-purple-300 focus:ring-2 focus:ring-purple-100 transition-all duration-200 shadow-sm"
                  placeholder="โปรดระบุชื่อสินค้า"
                  required
                />
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-700">ชื่อสามัญทางยา</Label>
                <Input
                  value={formData.generic_name}
                  onChange={(e) => handleInputChange('generic_name', e.target.value)}
                  className="mt-2 h-12 px-4 rounded-xl border-2 border-gray-200 bg-gray-50 focus:bg-white focus:border-purple-300 focus:ring-2 focus:ring-purple-100 transition-all duration-200 shadow-sm"
                  placeholder="ระบุชื่อยาสามัญ"
                />
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-700">ชื่อย่อ <span className="text-gray-400">ไม่จำเป็นต้องระบุ</span></Label>
                <Input
                  value={formData.short_name}
                  onChange={(e) => handleInputChange('short_name', e.target.value)}
                  className="mt-2 h-12 px-4 rounded-xl border-2 border-gray-200 bg-gray-50 focus:bg-white focus:border-purple-300 focus:ring-2 focus:ring-purple-100 transition-all duration-200 shadow-sm"
                  placeholder="ชื่อย่อ"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Display Settings */}
        <Card>
          <CardContent className="p-6">
            <h2 className="text-lg font-semibold text-gray-700 mb-4">การแสดงข้อมูลสินค้า</h2>
            
            <RadioGroup 
              value={selectValues.status} 
              onValueChange={(value) => {
                setSelectValues(prev => ({ ...prev, status: value }))
                handleInputChange('status', value)
              }}
              className="flex space-x-6 mb-6"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="active" id="active" />
                <Label htmlFor="active" className="text-sm font-medium text-purple-600">แสดงหน้าร้าน</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="inactive" id="inactive" />
                <Label htmlFor="inactive" className="text-sm text-gray-600">ไม่แสดงหน้าร้าน</Label>
              </div>
            </RadioGroup>
          </CardContent>
        </Card>

        {/* Expiry Warning */}
        <Card>
          <CardContent className="p-6">
            <h2 className="text-lg font-semibold text-gray-700 mb-4">วันแจ้งเตือนก่อนวันหมดอายุ</h2>
            
            <div className="grid grid-cols-5 gap-2">
              {["30", "60", "90", "180", "240"].map((days) => (
                <Button
                  key={days}
                  variant={formData.expiration_warning_days === days ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleInputChange('expiration_warning_days', days)}
                  className={`text-sm h-12 rounded-xl transition-all duration-200 shadow-sm ${
                    formData.expiration_warning_days === days 
                      ? "bg-purple-500 text-white border-purple-500 shadow-lg" 
                      : "text-gray-600 border-2 border-gray-200 bg-gray-50 hover:bg-white hover:border-purple-200"
                  }`}
                >
                  ก่อน {days} วัน
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* VAT Settings */}
        <Card>
          <CardContent className="p-6">
            <h2 className="text-lg font-semibold text-gray-700 mb-4">อัตราภาษีมูลค่าเพิ่ม</h2>
            
            <div className="grid grid-cols-3 gap-2">
              {[
                { value: "0", label: "ไม่มี VAT" },
                { value: "0", label: "VAT 0%" },
                { value: "7", label: "VAT 7%" }
              ].map((vat) => (
                <Button
                  key={vat.label}
                  variant={formData.vat_percent === vat.value ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleInputChange('vat_percent', vat.value)}
                  className={`text-sm h-12 rounded-xl transition-all duration-200 shadow-sm ${
                    formData.vat_percent === vat.value 
                      ? "bg-purple-500 text-white border-purple-500 shadow-lg" 
                      : "text-gray-600 border-2 border-gray-200 bg-gray-50 hover:bg-white hover:border-purple-200"
                  }`}
                >
                  {vat.label}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Unit and Sales Information */}
        <Card>
          <CardContent className="p-6">
            <h2 className="text-lg font-semibold text-gray-700 mb-4">ข้อมูลหน่วยนับ และการขาย</h2>
            
            {/* Product Image Upload */}
            <div className="mb-6">
              <ProductImageUpload
                value={formData.image}
                onChange={handleImageChange}
                currentImageUrl={formData.image_url ? `${API_CONFIG.BASE_URL}${formData.image_url}` : ''}
                label="รูปภาพสินค้า"
                description="ขนาดรูปภาพแนะนำ 160x160 หรือ 1:1 และขนาดไม่เกิน 2MB"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <Label className="text-sm font-medium text-gray-700">ชื่อหน่วยนับ ภาษาไทย, อังกฤษ และตัวเลข</Label>
                <Input
                  value={formData.unit}
                  onChange={(e) => handleInputChange('unit', e.target.value)}
                  className="mt-2 h-12 px-4 rounded-xl border-2 border-gray-200 bg-gray-50 focus:bg-white focus:border-purple-300 focus:ring-2 focus:ring-purple-100 transition-all duration-200 shadow-sm"
                  placeholder="โปรดระบุหน่วยนับ"
                />
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-700">ขนาดแพ็ค</Label>
                <Input
                  value={formData.pack_size}
                  onChange={(e) => handleInputChange('pack_size', e.target.value)}
                  className="mt-2 h-12 px-4 rounded-xl border-2 border-gray-200 bg-gray-50 focus:bg-white focus:border-purple-300 focus:ring-2 focus:ring-purple-100 transition-all duration-200 shadow-sm"
                  placeholder="ขนาดแพ็ค"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <Label className="text-sm font-medium text-gray-700">ราคาขายต่อหน่วย ค่าเริ่มต้น</Label>
                <Input
                  type="number"
                  value={formData.sale_price}
                  onChange={(e) => handleInputChange('sale_price', e.target.value)}
                  className="mt-2 h-12 px-4 rounded-xl border-2 border-gray-200 bg-gray-50 focus:bg-white focus:border-purple-300 focus:ring-2 focus:ring-purple-100 transition-all duration-200 shadow-sm"
                  placeholder="0.00"
                  required
                />
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-700">ต้นทุนต่อหน่วย ค่าเริ่มต้น</Label>
                <Input
                  type="number"
                  value={formData.cost}
                  onChange={(e) => handleInputChange('cost', e.target.value)}
                  className="mt-2 h-12 px-4 rounded-xl border-2 border-gray-200 bg-gray-50 focus:bg-white focus:border-purple-300 focus:ring-2 focus:ring-purple-100 transition-all duration-200 shadow-sm"
                  placeholder="0.00"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium text-gray-700">บาร์โค้ด ผูกกับหน่วยนับ</Label>
                <Input
                  value={formData.barcode}
                  onChange={(e) => handleInputChange('barcode', e.target.value)}
                  className="mt-2 h-12 px-4 rounded-xl border-2 border-gray-200 bg-gray-50 focus:bg-white focus:border-purple-300 focus:ring-2 focus:ring-purple-100 transition-all duration-200 shadow-sm"
                  placeholder="บาร์โค้ด"
                />
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-700">SKU รหัสสินค้า</Label>
                <Input
                  value={formData.sku}
                  onChange={(e) => handleInputChange('sku', e.target.value)}
                  className="mt-2 h-12 px-4 rounded-xl border-2 border-gray-200 bg-gray-50 focus:bg-white focus:border-purple-300 focus:ring-2 focus:ring-purple-100 transition-all duration-200 shadow-sm"
                  placeholder="SKU"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Registration Reports */}
        <Card>
          <CardContent className="p-6">
            <h2 className="text-lg font-semibold text-gray-700 mb-4">การขึ้นทะเบียนบัญชี</h2>
            
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="report-9"
                  checked={formData.report_type.includes('report-9')}
                  onCheckedChange={(checked) => handleReportTypeChange('report-9', checked as boolean)}
                />
                <Label htmlFor="report-9" className="text-sm">
                  <span className="font-medium">รายงาน ข.ย.๙</span>
                  <br />
                  <span className="text-gray-500">รายงานการซื้อยาทุกประเภท</span>
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="report-10"
                  checked={formData.report_type.includes('report-10')}
                  onCheckedChange={(checked) => handleReportTypeChange('report-10', checked as boolean)}
                />
                <Label htmlFor="report-10" className="text-sm">
                  <span className="font-medium">รายงาน ข.ย.๑๐</span>
                  <br />
                  <span className="text-gray-500">รายงานการขายยาควบคุมพิเศษ</span>
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="report-11"
                  checked={formData.report_type.includes('report-11')}
                  onCheckedChange={(checked) => handleReportTypeChange('report-11', checked as boolean)}
                />
                <Label htmlFor="report-11" className="text-sm">
                  <span className="font-medium">รายงาน ข.ย.๑๑</span>
                  <br />
                  <span className="text-gray-500">รายงานการขายยาอันตราย</span>
                </Label>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Symptom Category */}
        <Card>
          <CardContent className="p-6">
            <h2 className="text-lg font-semibold text-gray-700 mb-4">หมวดหมู่ยาแยกตามอาการที่รักษา</h2>
            
            <div className="grid grid-cols-2 gap-3">
              {[
                { value: "digestive", label: "ระบบทางเดินอาหาร" },
                { value: "cardiovascular", label: "ระบบหัวใจและหลอดเลือด" },
                { value: "respiratory", label: "ระบบทางเดินหายใจ" },
                { value: "nervous", label: "ระบบประสาท" },
                { value: "antibiotic", label: "ยาปฏิชีวนะ ยาฆ่าเชื้อ" },
                { value: "endocrine", label: "ระบบต่อมไร้ท่อ" },
                { value: "gynecology", label: "ระบบสูตินรีเวช" },
                { value: "cancer", label: "มะเร็งและยากดภูมิคุ้มกัน" },
                { value: "nutrition", label: "สารอาหารและผลิตภัณฑ์เกี่ยวกับเลือด" },
                { value: "musculoskeletal", label: "กระดูก กล้ามเนื้อ และข้อ" },
                { value: "eye", label: "ตา" },
                { value: "ent", label: "หู คอ จมูก และช่องปาก" },
                { value: "skin", label: "ผิวหนัง" },
                { value: "vaccine", label: "วัคซีนและภูมิคุ้มกัน" },
                { value: "anesthesia", label: "ยาดมสลบ" },
                { value: "other", label: "อื่นๆ ที่เป็นยา" }
              ].map((category) => (
                <div key={category.value} className="flex items-center space-x-2">
                  <Checkbox 
                    id={`symptom-${category.value}`}
                    checked={formData.symptom_category.includes(category.value)}
                    onCheckedChange={(checked) => {
                      const currentCategories = formData.symptom_category
                      if (checked) {
                        handleInputChange('symptom_category', [...currentCategories, category.value])
                      } else {
                        handleInputChange('symptom_category', currentCategories.filter(cat => cat !== category.value))
                      }
                    }}
                  />
                  <Label htmlFor={`symptom-${category.value}`} className="text-sm">{category.label}</Label>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Dosage Information */}
        <Card>
          <CardContent className="p-6">
            <h2 className="text-lg font-semibold text-gray-700 mb-4">ข้อมูลฉลากยา/หมายเหตุ</h2>
            
            <div className="space-y-4 mb-6">
              <div className="flex items-center space-x-4">
                <Switch 
                  id="auto-print"
                  checked={formData.auto_print_label}
                  onCheckedChange={(checked) => handleInputChange('auto_print_label', checked)}
                  className="data-[state=checked]:bg-purple-500"
                />
                <Label htmlFor="auto-print" className="text-sm cursor-pointer">
                  <span className="font-medium">พิมพ์อัตโนมัติหลังชำระ</span>
                  <br />
                  <span className="text-gray-500">เมื่อชำระสินค้าระบบจะทำการสั่งพิมพ์ฉลากของสินค้านี้โดยอัตโนมัติ</span>
                </Label>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-4">
              <div>
                <Label className="text-sm font-medium text-gray-700">หน่วยการใช้ หยด, เม็ด, 10cc...</Label>
                <Input
                  value={formData.dosage_unit}
                  onChange={(e) => handleInputChange('dosage_unit', e.target.value)}
                  className="mt-2 h-12 px-4 rounded-xl border-2 border-gray-200 bg-gray-50 focus:bg-white focus:border-purple-300 focus:ring-2 focus:ring-purple-100 transition-all duration-200 shadow-sm"
                  placeholder="เม็ด"
                />
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-700">จำนวนครั้งต่อวัน ครั้ง</Label>
                <Input
                  type="number"
                  value={formData.times_per_day}
                  onChange={(e) => handleInputChange('times_per_day', e.target.value)}
                  className="mt-2 h-12 px-4 rounded-xl border-2 border-gray-200 bg-gray-50 focus:bg-white focus:border-purple-300 focus:ring-2 focus:ring-purple-100 transition-all duration-200 shadow-sm"
                  placeholder="3"
                />
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-700">ทานยาทุกๆ ชั่วโมง</Label>
                <Input
                  type="number"
                  value={formData.interval_hours}
                  onChange={(e) => handleInputChange('interval_hours', e.target.value)}
                  className="mt-2 h-12 px-4 rounded-xl border-2 border-gray-200 bg-gray-50 focus:bg-white focus:border-purple-300 focus:ring-2 focus:ring-purple-100 transition-all duration-200 shadow-sm"
                  placeholder="8"
                />
              </div>
            </div>

            {/* Meal Timing */}
            <div className="space-y-3 mb-6">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="before-meal"
                  checked={formData.before_meal}
                  onCheckedChange={(checked) => handleInputChange('before_meal', checked)}
                />
                <Label htmlFor="before-meal" className="text-sm">
                  <span className="font-medium">ก่อนอาหาร</span>
                  <br />
                  <span className="text-gray-500">BEFORE MEALS</span>
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="after-meal"
                  checked={formData.after_meal}
                  onCheckedChange={(checked) => handleInputChange('after_meal', checked)}
                />
                <Label htmlFor="after-meal" className="text-sm">
                  <span className="font-medium">หลังอาหาร</span>
                  <br />
                  <span className="text-gray-500">AFTER MEALS</span>
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="after-meal-immediate"
                  checked={formData.after_meal_immediate}
                  onCheckedChange={(checked) => handleInputChange('after_meal_immediate', checked)}
                />
                <Label htmlFor="after-meal-immediate" className="text-sm">
                  <span className="font-medium">หลังอาหารทันที</span>
                  <br />
                  <span className="text-gray-500">IMMEDIATELY AFTER MEALS</span>
                </Label>
              </div>
            </div>

            {/* Dosage Table */}
            <div className="mb-6">
              <div className="flex items-center space-x-2 mb-4">
                <Checkbox 
                  id="show-dosage-table"
                  checked={formData.show_dosage_table}
                  onCheckedChange={(checked) => handleInputChange('show_dosage_table', checked)}
                />
                <Label htmlFor="show-dosage-table" className="text-sm font-medium">แสดงตารางปริมาณการใช้</Label>
                <span className="text-xs text-gray-500">แสดง/ซ่อนตารางบนฉลากยา</span>
              </div>

              <div className="grid grid-cols-4 gap-4">
                <div>
                  <Label htmlFor="morning" className="text-sm font-medium text-gray-700">เช้า</Label>
                  <Input
                    id="morning"
                    value={formData.morning}
                    onChange={(e) => handleInputChange('morning', e.target.value)}
                    className="mt-2 h-12 px-4 rounded-xl border-2 border-gray-200 bg-gray-50 focus:bg-white focus:border-purple-300 focus:ring-2 focus:ring-purple-100 transition-all duration-200 shadow-sm"
                    placeholder="เช้า"
                  />
                </div>
                <div>
                  <Label htmlFor="noon" className="text-sm font-medium text-gray-700">กลางวัน</Label>
                  <Input
                    id="noon"
                    value={formData.noon}
                    onChange={(e) => handleInputChange('noon', e.target.value)}
                    className="mt-2 h-12 px-4 rounded-xl border-2 border-gray-200 bg-gray-50 focus:bg-white focus:border-purple-300 focus:ring-2 focus:ring-purple-100 transition-all duration-200 shadow-sm"
                    placeholder="กลางวัน"
                  />
                </div>
                <div>
                  <Label htmlFor="evening" className="text-sm font-medium text-gray-700">เย็น</Label>
                  <Input
                    id="evening"
                    value={formData.evening}
                    onChange={(e) => handleInputChange('evening', e.target.value)}
                    className="mt-2 h-12 px-4 rounded-xl border-2 border-gray-200 bg-gray-50 focus:bg-white focus:border-purple-300 focus:ring-2 focus:ring-purple-100 transition-all duration-200 shadow-sm"
                    placeholder="เย็น"
                  />
                </div>
                <div>
                  <Label htmlFor="before-bed" className="text-sm font-medium text-gray-700">ก่อนนอน</Label>
                  <Input
                    id="before-bed"
                    value={formData.before_bed}
                    onChange={(e) => handleInputChange('before_bed', e.target.value)}
                    className="mt-2 h-12 px-4 rounded-xl border-2 border-gray-200 bg-gray-50 focus:bg-white focus:border-purple-300 focus:ring-2 focus:ring-purple-100 transition-all duration-200 shadow-sm"
                    placeholder="ก่อนนอน"
                  />
                </div>
              </div>
            </div>

            {/* Text Areas */}
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium text-gray-700">วิธีการใช้ หรือ ระบุจำนวนครั้งละ</Label>
                <Input
                  value={formData.dosage}
                  onChange={(e) => handleInputChange('dosage', e.target.value)}
                  className="mt-2 h-12 px-4 rounded-xl border-2 border-gray-200 bg-gray-50 focus:bg-white focus:border-purple-300 focus:ring-2 focus:ring-purple-100 transition-all duration-200 shadow-sm"
                  placeholder="ครั้งละ 1 เม็ด"
                />
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-700">สรรพคุณ</Label>
                <Textarea
                  value={formData.properties}
                  onChange={(e) => handleInputChange('properties', e.target.value)}
                  className="mt-2 px-4 py-3 rounded-xl border-2 border-gray-200 bg-gray-50 focus:bg-white focus:border-purple-300 focus:ring-2 focus:ring-purple-100 transition-all duration-200 shadow-sm resize-none"
                  rows={3}
                  placeholder="สรรพคุณของยา"
                />
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-700">คำแนะนำการใช้ สำหรับลูกค้า</Label>
                <Textarea
                  value={formData.usage_instruction}
                  onChange={(e) => handleInputChange('usage_instruction', e.target.value)}
                  className="mt-2 px-4 py-3 rounded-xl border-2 border-gray-200 bg-gray-50 focus:bg-white focus:border-purple-300 focus:ring-2 focus:ring-purple-100 transition-all duration-200 shadow-sm resize-none"
                  rows={3}
                  placeholder="คำแนะนำการใช้"
                />
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-700">หมายเหตุการขาย สำหรับเภสัช</Label>
                <Textarea
                  value={formData.sale_note}
                  onChange={(e) => handleInputChange('sale_note', e.target.value)}
                  className="mt-2 px-4 py-3 rounded-xl border-2 border-gray-200 bg-gray-50 focus:bg-white focus:border-purple-300 focus:ring-2 focus:ring-purple-100 transition-all duration-200 shadow-sm resize-none"
                  rows={2}
                  placeholder="หมายเหตุการขาย"
                />
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-700">หมายเหตุการสั่งซื้อ สำหรับผู้จัดจำหน่าย</Label>
                <Textarea
                  value={formData.purchase_note}
                  onChange={(e) => handleInputChange('purchase_note', e.target.value)}
                  className="mt-2 px-4 py-3 rounded-xl border-2 border-gray-200 bg-gray-50 focus:bg-white focus:border-purple-300 focus:ring-2 focus:ring-purple-100 transition-all duration-200 shadow-sm resize-none"
                  rows={2}
                  placeholder="หมายเหตุการสั่งซื้อ"
                />
              </div>
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  )
} 