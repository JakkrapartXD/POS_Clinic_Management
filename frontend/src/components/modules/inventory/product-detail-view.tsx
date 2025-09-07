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
import { Edit2, ArrowLeft, Upload } from "lucide-react"
import ProductImageUpload from "@/components/common/ProductImageUpload"
import { GraphQLAPI } from "@/clients/graphql"
import { logger } from "@/lib/logger"
import { API_CONFIG } from "@/config/api"
import EditProductForm from "@/components/forms/EditProductForm"

interface ProductDetailViewProps {
  productId: string
  onBack: () => void
  onEditingChange?: (isEditing: boolean) => void
  productVariants?: any[] // Add this for grouped products
  onProductDeleted?: () => void
  onProductUpdated?: () => void
}

interface ProductData {
  id: string
  product_name: string
  product_type: string
  generic_name: string
  short_name: string
  status: string
  category: {
    id: string
    name: string
    description?: string
    code?: string
  } | null
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

export default function ProductDetailView({ productId, onBack, onEditingChange, productVariants: initialProductVariants, onProductDeleted, onProductUpdated }: ProductDetailViewProps) {
  const [product, setProduct] = useState<ProductData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [activeTab, setActiveTab] = useState("general")
  const [showUnitEditDialog, setShowUnitEditDialog] = useState(false)
  const [hasMultipleVariants, setHasMultipleVariants] = useState(false)
  const [productVariants, setProductVariants] = useState<any[]>(initialProductVariants || [])
  const [unitFormData, setUnitFormData] = useState<{
    unit_name: string
    pack_size: string
    cost: string
    sale_price: string
    reorder_point: string
    volume: string
    volume_unit: string
    shelf_code: string
    shelf_row: string
    sku: string
    barcode: string
    display_pos: boolean
    image: File | null
    image_url: string
  }>({
    unit_name: '',
    pack_size: '',
    cost: '',
    sale_price: '',
    reorder_point: '',
    volume: '',
    volume_unit: '',
    shelf_code: '',
    shelf_row: '',
    sku: '',
    barcode: '',
    display_pos: true,
    image: null,
    image_url: ''
  })
  const [isCreatingNewUnit, setIsCreatingNewUnit] = useState(false)

  // Image upload handler for unit edit
  const handleUnitImageChange = (file: File | null, imageUrl?: string) => {
    setUnitFormData(prev => ({ 
      ...prev, 
      image: file,
      image_url: imageUrl || '' 
    }))
  }

  // Helper function to determine if pack_size is main product (pack_size = 1)
  const isMainProduct = (packSize: string | number) => {
    const packSizeNum = typeof packSize === 'string' ? parseInt(packSize) : packSize
    return packSizeNum === 1
  }

  // Function to refresh product data without page reload
  const refreshProductData = async () => {
    try {
      setLoading(true)
      const response = await GraphQLAPI.getProduct(productId)
      
      if (response.product) {
        setProduct(response.product)
        logger.info('Product data refreshed successfully', { 
          productId,
          productName: response.product.product_name 
        }, 'INVENTORY')
      }
          } catch (err) {
        logger.error('Failed to refresh product data', err, 'INVENTORY')
      } finally {
      setLoading(false)
    }
  }

  // Function to update product variants state
  const updateProductVariants = (updatedVariants: any[]) => {
    setProductVariants(updatedVariants)
  }

  useEffect(() => {
    const loadProduct = async () => {
      try {
        setLoading(true)
        setError(null)
        
        logger.info('Loading product details', { productId }, 'INVENTORY')
        
        const response = await GraphQLAPI.getProduct(productId)
        
        if (response.product) {
          setProduct(response.product)
          
          // If we have initial product variants, use them, otherwise create a single variant from the main product
          if (initialProductVariants && initialProductVariants.length > 0) {
            setProductVariants(initialProductVariants)
          } else {
            // Create a single variant from the main product
            setProductVariants([response.product])
          }
          
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
    logger.debug('ProductDetailView: Switching to edit mode', {}, 'INVENTORY')
    setIsEditing(true)
    onEditingChange?.(true)
  }

  const handleEditBack = () => {
    logger.debug('ProductDetailView: handleEditBack called, returning to detail view', {}, 'INVENTORY')
    setIsEditing(false)
    onEditingChange?.(false)
  }

  // Unit edit dialog handlers
  const openUnitEditDialog = (unitData?: any) => {
    // If no unitData provided, it's for adding a new unit
    if (!unitData) {
      // Find the main product (pack_size = 1) to use as default values
      const mainProduct = productVariants?.find(v => parseInt(v.pack_size || '1') === 1) || product
      
      setUnitFormData({
        unit_name: '',
        pack_size: '',
        cost: mainProduct?.cost?.toString() || '',
        sale_price: mainProduct?.sale_price?.toString() || '',
        reorder_point: mainProduct?.reorder_point?.toString() || '',
        volume: mainProduct?.volume?.toString() || '',
        volume_unit: mainProduct?.volume_unit || 'mg',
        shelf_code: mainProduct?.shelf_code || '',
        shelf_row: mainProduct?.shelf_row || '',
        sku: '',
        barcode: '',
        display_pos: true,
        image: null,
        image_url: mainProduct?.image_url || ''
      })
      setIsCreatingNewUnit(true)
    } else {
      // Editing existing unit
      setUnitFormData({
        unit_name: unitData.unit || '',
        pack_size: unitData.pack_size || '',
        cost: unitData.cost?.toString() || '',
        sale_price: unitData.sale_price?.toString() || '',
        reorder_point: unitData.reorder_point?.toString() || '',
        volume: unitData.volume?.toString() || '',
        volume_unit: unitData.volume_unit || 'mg',
        shelf_code: unitData.shelf_code || '',
        shelf_row: unitData.shelf_row || '',
        sku: unitData.sku || '',
        barcode: unitData.barcode || '',
        display_pos: unitData.status === 'active',
        image: null,
        image_url: unitData.image_url || ''
      })
      setIsCreatingNewUnit(false)
    }
    setShowUnitEditDialog(true)
  }



  // Check if unit name already exists
  const isUnitNameExists = (unitName: string, excludeId?: string) => {
    if (!unitName) return false
    
    const allVariants = productVariants || [product]
    return allVariants.some(variant => {
      // Skip the current unit being edited
      if (excludeId && variant.id === excludeId) return false
      
      return variant.unit?.toLowerCase() === unitName.toLowerCase()
    })
  }

  // Check if pack size already exists
  const isPackSizeExists = (packSize: string, excludeId?: string) => {
    if (!packSize) return false
    
    const allVariants = productVariants || [product]
    return allVariants.some(variant => {
      // Skip the current unit being edited
      if (excludeId && variant.id === excludeId) return false
      
      return variant.pack_size === packSize
    })
  }

  // Handle delete unit
  const handleDeleteUnit = async (unitId: string, packSize?: string | number) => {
    // Check if this is the main product (pack_size = 1) - cannot delete
    if (isMainProduct(packSize || 1)) {
      alert('ไม่สามารถลบขนาดบรรจุ 1 ได้ เนื่องจากเป็นสินค้าหลัก')
      return
    }
    
    if (confirm('คุณต้องการลบหน่วยนับนี้หรือไม่?')) {
      try {
        // TODO: เรียก API ลบหน่วยนับ
        logger.debug('Deleting unit', { unitId, packSize }, 'INVENTORY')
        
        // Remove the variant from the list
        setProductVariants(prev => prev.filter(variant => variant.id !== unitId))
        
        alert('ลบหน่วยนับเรียบร้อยแล้ว (Mockup)')
        // Refresh product data to ensure consistency
        await refreshProductData()
        
        // Notify parent component that a product was deleted
        if (onProductDeleted) {
          onProductDeleted()
        }
      } catch (error) {
        logger.error('Error deleting unit', error, 'INVENTORY')
        alert('เกิดข้อผิดพลาดในการลบหน่วยนับ')
      }
    }
  }

  const handleUnitSave = async () => {
    try {
      logger.debug('Saving unit data', { unitFormData }, 'INVENTORY')
      
      // Upload image first if there's a new file
      let imageUrl = unitFormData.image_url
      if (unitFormData.image) {
        try {
          logger.info('Uploading image for unit', { fileName: unitFormData.image.name }, 'INVENTORY')
          const uploadResult = await GraphQLAPI.uploadImage(unitFormData.image, 'product')
          imageUrl = uploadResult.url
          logger.info('Image uploaded successfully', { imageUrl }, 'INVENTORY')
        } catch (error) {
          logger.error('Failed to upload image', error, 'INVENTORY')
          alert('ไม่สามารถอัพโหลดรูปภาพได้ กรุณาลองใหม่')
          return
        }
      }
      
      // Validate required fields for new unit creation
      if (isCreatingNewUnit) {
        const missingFields = []
        
        if (!unitFormData.unit_name || unitFormData.unit_name.trim() === '') {
          missingFields.push('ชื่อหน่วยนับ')
        }
        
        if (!unitFormData.pack_size || unitFormData.pack_size.trim() === '') {
          missingFields.push('ขนาดบรรจุ')
        }
        
        if (!unitFormData.cost || unitFormData.cost.trim() === '') {
          missingFields.push('ต้นทุนต่อหน่วย')
        }
        
        if (!unitFormData.sale_price || unitFormData.sale_price.trim() === '') {
          missingFields.push('ราคาขายต่อหน่วย')
        }
        
        if (!unitFormData.reorder_point || unitFormData.reorder_point.trim() === '') {
          missingFields.push('จุดสั่งซื้อ')
        }
        
        if (!unitFormData.volume || unitFormData.volume.trim() === '') {
          missingFields.push('ปริมาณ')
        }
        
        if (!unitFormData.volume_unit || unitFormData.volume_unit.trim() === '') {
          missingFields.push('หน่วยปริมาณ')
        }
        
        if (!unitFormData.shelf_code || unitFormData.shelf_code.trim() === '') {
          missingFields.push('รหัสชั้นวาง')
        }
        
        if (!unitFormData.shelf_row || unitFormData.shelf_row.trim() === '') {
          missingFields.push('แถวชั้นวาง')
        }
        
        if (!unitFormData.sku || unitFormData.sku.trim() === '') {
          missingFields.push('รหัสสินค้า SKU')
        }
        
        if (!unitFormData.barcode || unitFormData.barcode.trim() === '') {
          missingFields.push('บาร์โค้ด')
        }
        
        if (missingFields.length > 0) {
          alert(`กรุณากรอกข้อมูลให้ครบถ้วน:\n${missingFields.join('\n')}`)
          return
        }
      } else {
        // For editing existing unit, only validate essential fields
        if (!unitFormData.unit_name || unitFormData.unit_name.trim() === '') {
          alert('กรุณาระบุชื่อหน่วยนับ')
          return
        }
        
        if (!unitFormData.pack_size || unitFormData.pack_size.trim() === '') {
          alert('กรุณาระบุขนาดบรรจุ')
          return
        }
      }
      
      // Check if this is adding a new unit or editing existing
      // Use the state to determine if we're creating new or editing existing
      const isNewUnit = isCreatingNewUnit
      const existingVariant = isNewUnit ? null : productVariants?.find(v => v.sku === unitFormData.sku)
      const variantId = existingVariant?.id
      
      // Check for duplicate unit name
      if (isUnitNameExists(unitFormData.unit_name, isNewUnit ? undefined : variantId)) {
        alert('หน่วยนับซ้ำไม่สามารถสร้างได้ กรุณาใช้ชื่อหน่วยนับอื่น')
        return
      }
      
      // Check for duplicate pack size
      if (isPackSizeExists(unitFormData.pack_size, isNewUnit ? undefined : variantId)) {
        alert('ขนาดบรรจุซ้ำไม่สามารถสร้างได้ กรุณาใช้ขนาดบรรจุอื่น')
        return
      }

      // Check for duplicate SKU (only for new units)
      if (isNewUnit && unitFormData.sku && unitFormData.sku.trim() !== '') {
        try {
          const skuCheckResponse = await GraphQLAPI.checkSkuExists(unitFormData.sku.trim())
          if (skuCheckResponse.checkSkuExists) {
            alert('SKU ซ้ำไม่สามารถสร้างได้ กรุณาใช้ SKU อื่น')
            return
          }
        } catch (error) {
          logger.error('Error checking SKU', error, 'INVENTORY')
          // Continue with creation if SKU check fails
        }
      }
      
      if (isNewUnit) {
        // Create new product variant using GraphQL mutation
        const productInput: any = {
          product_name: product?.product_name || '',
          product_type: product?.product_type || 'medicine',
          generic_name: product?.generic_name || '',
          short_name: product?.short_name || '',
          status: unitFormData.display_pos ? 'active' : 'inactive',
          vat_percent: product?.vat_percent || 0,
          expiration_warning_date: product?.expiration_warning_date || 90,
          sale_price: parseFloat(unitFormData.sale_price) || 0,
          unit: unitFormData.unit_name,
          pack_size: unitFormData.pack_size,
          reorder_point: parseInt(unitFormData.reorder_point) || 0,
          cost: parseFloat(unitFormData.cost) || 0,
          sku: unitFormData.sku || '',
          barcode: unitFormData.barcode || '',
          stock_quantity: 0, // New variant starts with 0 stock
          volume: parseFloat(unitFormData.volume) || 0,
          volume_unit: unitFormData.volume_unit || 'mg',
          shelf_code: unitFormData.shelf_code || '',
          shelf_row: unitFormData.shelf_row || '',
          image_url: imageUrl || '',
          symptom_category: product?.symptom_category || null,
          license_number: product?.license_number || '',
          dosage_unit: product?.dosage_unit || '',
          dosage: product?.dosage || '',
          times_per_day: product?.times_per_day || null,
          interval_hours: product?.interval_hours || null,
          before_meal: product?.before_meal || false,
          after_meal: product?.after_meal || false,
          after_meal_immediate: product?.after_meal_immediate || false,
          morning: product?.morning || '',
          noon: product?.noon || '',
          evening: product?.evening || '',
          before_bed: product?.before_bed || '',
          properties: product?.properties || '',
          usage_instruction: product?.usage_instruction || '',
          sale_note: product?.sale_note || '',
          purchase_note: product?.purchase_note || ''
        }

        // Only include categoryId if it exists and is not empty
        if (product?.category?.id && product.category.id.trim() !== '') {
          productInput.categoryId = product.category.id
        }

        logger.info('Creating new product variant', { 
          productName: productInput.product_name,
          unit: productInput.unit,
          packSize: productInput.pack_size 
        }, 'INVENTORY')

        const response = await GraphQLAPI.createProduct(productInput)
        
        if (response.createProduct) {
          logger.info('Product variant created successfully', { 
            productId: response.createProduct.id,
            productName: response.createProduct.product_name 
          }, 'INVENTORY')
          
          alert('เพิ่มหน่วยนับใหม่เรียบร้อยแล้ว')
          setShowUnitEditDialog(false)
          
          // Add new variant to the list and refresh product data
          const newVariant = response.createProduct
          setProductVariants(prev => [...prev, newVariant])
          await refreshProductData()
          
          // Notify parent component that product was updated
          if (onProductUpdated) {
            onProductUpdated()
          }
        }
      } else {
        // Update existing unit using GraphQL mutation - only unit-specific fields
        const productInput: any = {
          status: unitFormData.display_pos ? 'active' : 'inactive',
          sale_price: parseFloat(unitFormData.sale_price) || 0,
          unit: unitFormData.unit_name,
          pack_size: unitFormData.pack_size,
          reorder_point: parseInt(unitFormData.reorder_point) || 0,
          cost: parseFloat(unitFormData.cost) || 0,
          sku: unitFormData.sku || '',
          barcode: unitFormData.barcode || '',
          volume: parseFloat(unitFormData.volume) || 0,
          volume_unit: unitFormData.volume_unit || 'mg',
          shelf_code: unitFormData.shelf_code || '',
          shelf_row: unitFormData.shelf_row || ''
        }

        // Only include image_url if there's a new image
        if (imageUrl) {
          productInput.image_url = imageUrl
        }

        // Find the product variant to get its ID
        const variantToUpdate = existingVariant
        if (!variantToUpdate?.id) {
          alert('ไม่พบข้อมูลหน่วยนับที่ต้องการแก้ไข')
          return
        }

        // Store old image URL before updating
        const oldImageUrl = variantToUpdate.image_url
        
        logger.info('Updating product variant', { 
          productId: variantToUpdate.id,
          unit: productInput.unit,
          packSize: productInput.pack_size 
        }, 'INVENTORY')

        const response = await GraphQLAPI.updateProduct(variantToUpdate.id, productInput)
        
        if (response.updateProduct) {
          logger.info('Product variant updated successfully', { 
            productId: response.updateProduct.id,
            productName: response.updateProduct.product_name 
          }, 'INVENTORY')
          console.log('New image URL:', productInput.image_url);
          console.log('Old image URL:', oldImageUrl);
          
          // Delete old image if exists
          if (oldImageUrl) {
            try {
              console.log('Deleting old image:', oldImageUrl)
              // Extract filename from URL
              const urlParts = oldImageUrl.split('/')
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
          
          alert('แก้ไขหน่วยนับเรียบร้อยแล้ว')
          setShowUnitEditDialog(false)
          
          // Update the variant in the list and refresh product data
          setProductVariants(prev => 
            prev.map(variant => 
              variant.id === response.updateProduct.id ? response.updateProduct : variant
            )
          )
          await refreshProductData()
          
          // Notify parent component that product was updated
          if (onProductUpdated) {
            onProductUpdated()
          }
        }
      }
    } catch (error) {
      logger.error('Failed to save unit', error, 'INVENTORY')
      
      const errorMessage = error instanceof Error ? error.message : 'เกิดข้อผิดพลาดในการบันทึกข้อมูล'
      alert(`ไม่สามารถบันทึกข้อมูลได้: ${errorMessage}`)
    }
  }

  const handleEditSubmit = async (productData: any) => {
    try {
      logger.info('Updating product', { productId, productData }, 'INVENTORY')
      
      // Prepare input data for GraphQL mutation
      const input: any = {
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
        // Don't include SKU and barcode to avoid conflicts with other products
        stock_quantity: parseInt(productData.stock_quantity) || 0,
        shelf_code: productData.shelf_code || '',
        shelf_row: productData.shelf_row || '',
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
        purchase_note: productData.purchase_note || '',
        image_url: productData.image_url || ''
      }

      // Only include categoryId if it exists and is not empty
      const categoryId = productData.categoryId || (typeof productData.category === 'object' && productData.category?.id)
      if (categoryId && categoryId.trim() !== '') {
        input.categoryId = categoryId
      }

      // Debug: Log the prepared input
      logger.debug('Prepared input for GraphQL', { input, sku: input.sku, barcode: input.barcode }, 'INVENTORY')

      const response = await GraphQLAPI.updateProduct(productId, input)
      
      if (response.updateProduct) {
        // Update local product state with new data
        setProduct(response.updateProduct)
        
        // Update all variants with the new product data (except unit-specific fields)
        setProductVariants(prev => 
          prev.map(variant => {
            // Keep unit-specific fields unchanged
            const updatedVariant = {
              ...response.updateProduct,
              // Preserve unit-specific fields
              unit: variant.unit,
              pack_size: variant.pack_size,
              sku: variant.sku,
              barcode: variant.barcode,
              cost: variant.cost,
              sale_price: variant.sale_price,
              reorder_point: variant.reorder_point,
              volume: variant.volume,
              volume_unit: variant.volume_unit,
              shelf_code: variant.shelf_code,
              shelf_row: variant.shelf_row,
              stock_quantity: variant.stock_quantity
            }
            return updatedVariant
          })
        )

        // Update all other variants in the database (except the main product)
        const variantsToUpdate = productVariants.filter(variant => variant.id !== productId)
        if (variantsToUpdate.length > 0) {
          try {
            // Update each variant with the new product data (except unit-specific fields)
            const updatePromises = variantsToUpdate.map(async (variant) => {
              const variantInput = {
                product_name: response.updateProduct.product_name,
                product_type: response.updateProduct.product_type,
                generic_name: response.updateProduct.generic_name,
                short_name: response.updateProduct.short_name,
                status: response.updateProduct.status,
                vat_percent: response.updateProduct.vat_percent,
                expiration_warning_date: response.updateProduct.expiration_warning_date,
                // Keep unit-specific fields unchanged (but exclude SKU and barcode to avoid conflicts)
                unit: variant.unit,
                pack_size: variant.pack_size,
                cost: variant.cost,
                sale_price: variant.sale_price,
                reorder_point: variant.reorder_point,
                stock_quantity: variant.stock_quantity,
                volume: variant.volume,
                volume_unit: variant.volume_unit,
                shelf_code: variant.shelf_code,
                shelf_row: variant.shelf_row,
                categoryId: response.updateProduct.categoryId,
                symptom_category: response.updateProduct.symptom_category,
                license_number: response.updateProduct.license_number,
                dosage_unit: response.updateProduct.dosage_unit,
                dosage: response.updateProduct.dosage,
                times_per_day: response.updateProduct.times_per_day,
                interval_hours: response.updateProduct.interval_hours,
                before_meal: response.updateProduct.before_meal,
                after_meal: response.updateProduct.after_meal,
                after_meal_immediate: response.updateProduct.after_meal_immediate,
                morning: response.updateProduct.morning,
                noon: response.updateProduct.noon,
                evening: response.updateProduct.evening,
                before_bed: response.updateProduct.before_bed,
                properties: response.updateProduct.properties,
                usage_instruction: response.updateProduct.usage_instruction,
                sale_note: response.updateProduct.sale_note,
                purchase_note: response.updateProduct.purchase_note
              }

              // Only include categoryId if it exists
              if (!response.updateProduct.categoryId) {
                delete variantInput.categoryId
              }

              return await GraphQLAPI.updateProduct(variant.id, variantInput)
            })

            await Promise.all(updatePromises)
            logger.info('All variants updated in database successfully', { 
              variantsUpdated: variantsToUpdate.length 
            }, 'INVENTORY')
          } catch (error) {
            logger.error('Failed to update some variants in database', error, 'INVENTORY')
            // Don't show error to user as main product was updated successfully
          }
        }
        
        logger.info('Product and all variants updated successfully', { 
          productId,
          productName: response.updateProduct.product_name,
          variantsCount: productVariants.length
        }, 'INVENTORY')
        
        // Success feedback with variant count
        const variantCount = productVariants.length
        if (variantCount > 1) {
          alert(`บันทึกข้อมูลสินค้าและอัพเดตทุกหน่วยนับเรียบร้อยแล้ว (รวม ${variantCount} หน่วยนับ)`)
        } else {
          alert('บันทึกข้อมูลสินค้าเรียบร้อยแล้ว')
        }
        
        // Notify parent component that product was updated
        if (onProductUpdated) {
          onProductUpdated()
        }
        
        // Delete old image if exists
        if (productData.image_url) {
          try {
            console.log('Deleting old image:', productData.image_url)
            // Extract filename from URL
            const urlParts = productData.image_url.split('/')
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

  const getCategoryLabel = (category: { id: string; name: string; description?: string; code?: string } | string | null) => {
    // If category is an object, return its name
    if (category && typeof category === 'object' && 'name' in category) {
      return category.name || 'ไม่ระบุ'
    }
    
    // If category is a string, use the mapping
    if (typeof category === 'string') {
      const categories: Record<string, string> = {
        'medicine': 'ยา',
        'supplement': 'อาหารเสริม',
        'cosmetics': 'เครื่องสำอาง',
        'medical-device': 'อุปกรณ์การแพทย์'
      }
      return categories[category] || category
    }
    
    return 'ไม่ระบุ'
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
                {productVariants.length > 1 && (
                  <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                    {productVariants.length} หน่วยนับ
                  </Badge>
                )}
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
                  <h3 className="text-lg font-semibold">ข้อมูลหน่วยนับทั้งหมด</h3>
                  <Button 
                    onClick={() => openUnitEditDialog()}
                    className="bg-green-500 hover:bg-green-600 text-white"
                  >
                    + เพิ่มหน่วยนับ
                  </Button>
                </div>
                
                {/* Information about deletion rules */}
                <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="text-sm text-blue-800">
                    <strong>กฎการลบหน่วยนับ:</strong>
                    <ul className="mt-1 ml-4 list-disc">
                      <li>สินค้าหลัก (ขนาดบรรจุ 1) ไม่สามารถลบได้</li>
                      <li>สามารถลบหน่วยนับได้เฉพาะอันที่มากกว่า 1 เท่านั้น</li>
                    </ul>
                  </div>
                </div>
                
                {/* Information about creating new units */}
                <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="text-sm text-green-800">
                    <strong>การสร้างหน่วยนับใหม่:</strong>
                    <ul className="mt-1 ml-4 list-disc">
                      <li>+ เพิ่มหน่วยนับ: สร้างหน่วยนับใหม่จากข้อมูลว่าง</li>
                      <li>ระบบจะตรวจสอบชื่อหน่วยนับและขนาดบรรจุซ้ำอัตโนมัติ</li>
                    </ul>
                  </div>
                </div>
                
                {/* Units Table */}
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">ชื่อหน่วยนับ</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">ขนาดบรรจุ</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">ต้นทุน</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">ราคาขาย</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">สต๊อก</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">รหัสสินค้า</th>
                        <th className="px-4 py-3 text-center text-sm font-medium text-gray-600">จัดการ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">

                      
                      {/* All Product Variants including main product */}
                      {productVariants && productVariants.length > 0 && productVariants
                        .sort((a, b) => {
                          // Sort by pack_size, main product (pack_size = 1) first
                          const aSize = parseInt(a.pack_size || '1')
                          const bSize = parseInt(b.pack_size || '1')
                          if (aSize === 1) return -1
                          if (bSize === 1) return 1
                          return aSize - bSize
                        })
                        .map((variant, index) => {
                          const packSizeNum = parseInt(variant.pack_size || '1')
                          const canDelete = packSizeNum > 1
                          const isMain = packSizeNum === 1
                          return (
                          <tr key={variant.id || index} className={`hover:bg-gray-50 ${isMain ? 'bg-purple-50' : ''}`}>
                            <td className="px-4 py-4">
                              <div className="flex items-center space-x-2">
                                <span className={`font-medium ${isMain ? 'text-purple-600' : canDelete ? 'text-blue-600' : 'text-gray-600'}`}>
                                  {variant.unit || 'หน่วย'}
                                </span>
                                <Badge variant={isMain ? 'default' : 'outline'} className={`text-xs ${isMain ? 'bg-purple-600' : 'border-gray-200 text-gray-700'}`}>
                                  {isMain ? 'หลัก' : 'รอง'}
                                </Badge>
                              </div>
                              <div className="text-sm text-gray-500">
                                ปริมาณ: {variant.volume || '500'}{variant.volume_unit || 'mg'}
                              </div>
                            </td>
                            <td className="px-4 py-4">
                              <span className="text-gray-900">{variant.pack_size || '1'}</span>
                              {isMain && (
                                <div className="text-xs text-gray-500">(สินค้าหลัก)</div>
                              )}
                              
                            </td>
                            <td className="px-4 py-4">
                              <span className="text-gray-900">฿{variant.cost ? Number(variant.cost).toLocaleString() : '-'}</span>
                            </td>
                            <td className="px-4 py-4">
                              <span className="text-gray-900 font-medium">฿{variant.sale_price ? Number(variant.sale_price).toLocaleString() : '-'}</span>
                            </td>
                            <td className="px-4 py-4">
                              <span className="text-gray-900">{variant.stock_quantity || 0}</span>
                              {(variant.stock_quantity || 0) <= (variant.reorder_point || 0) && (
                                <Badge variant="destructive" className="ml-2 text-xs">สต๊อกต่ำ</Badge>
                              )}
                            </td>
                            <td className="px-4 py-4">
                              <div className="text-sm text-gray-900">
                                <div>SKU: {variant.sku || 'ไม่มี'}</div>
                                <div>บาร์โค้ด: {variant.barcode || 'ไม่มี'}</div>
                              </div>
                            </td>
                            <td className="px-4 py-4 text-center">
                              <div className="flex justify-center space-x-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => openUnitEditDialog(variant)}
                                  className="text-purple-600 border-purple-200 hover:bg-purple-50"
                                >
                                  แก้ไข
                                </Button>
                                {!isMain && packSizeNum > 1 && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleDeleteUnit(variant.id, variant.pack_size)}
                                    className="text-red-600 border-red-200 hover:bg-red-50"
                                  >
                                    ลบ
                                  </Button>
                                )}
                                {isMain && (
                                  <div className="text-xs text-gray-400 px-2 py-1 bg-gray-100 rounded">
                                    ไม่สามารถลบได้
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        )
                      })
                      }
                      
                      {/* Empty state if no variants */}
                      {(!productVariants || productVariants.length === 0) && (
                        <tr>
                          <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                            <div className="flex flex-col items-center space-y-2">
                              <div className="text-2xl">📦</div>
                              <div>ยังไม่มีข้อมูลหน่วยนับ</div>
                              <div className="text-sm">คลิกปุ่ม "เพิ่มหน่วยนับ" เพื่อเพิ่มหน่วยนับ</div>
                            </div>
                          </td>
                        </tr>
                      )}
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
      <Dialog open={showUnitEditDialog} onOpenChange={(open) => {
        setShowUnitEditDialog(open)
        if (!open) {
          // Reset state when dialog closes
          setIsCreatingNewUnit(false)
          setUnitFormData({
            unit_name: '',
            pack_size: '',
            cost: '',
            sale_price: '',
            reorder_point: '',
            volume: '',
            volume_unit: '',
            shelf_code: '',
            shelf_row: '',
            sku: '',
            barcode: '',
            display_pos: true,
            image: null,
            image_url: ''
          })
        }
      }}>
        <DialogContent className="max-w-2xl bg-white">
          <DialogHeader className="bg-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setShowUnitEditDialog(false)}
                  className="p-2 text-gray-700 hover:bg-gray-100"
                >
                  ปิด
                </Button>
                <DialogTitle className="text-lg font-semibold text-gray-900">
                  {isCreatingNewUnit ? 'เพิ่มหน่วยนับ' : 'แก้ไขหน่วยนับ'}
                </DialogTitle>
              </div>
            </div>
            <p className="text-sm text-gray-600 mt-2">
              โปรดระบุข้อมูลหน่วยนับของสินค้า
              {isCreatingNewUnit && (
                <span className="text-red-500 ml-1">
                  * ช่องที่จำเป็นต้องกรอก
                </span>
              )}
            </p>
          </DialogHeader>
          
          <div className="space-y-6 py-4 bg-white">
            {/* Form content */}
            {(() => {
              const variantToUpdate = isCreatingNewUnit ? null : productVariants?.find(v => v.sku === unitFormData.sku)
              return (
                <>
                  {/* Product Image Upload */}
                  <div className="mb-6">
                    <ProductImageUpload
                      value={unitFormData.image}
                      onChange={handleUnitImageChange}
                      currentImageUrl={unitFormData.image_url ? `${API_CONFIG.BASE_URL}${unitFormData.image_url}` : ''}
                      label="รูปภาพสินค้า"
                      description="ขนาดรูปภาพแนะนำ 160x160 หรือ 1:1 และขนาดไม่เกิน 2MB"
                    />
                  </div>

                  {/* ชื่อหน่วยนับ ภาษาไทย, อังกฤษ และตัวเลข */}
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-gray-900">
                        ชื่อหน่วยนับ <span className="text-gray-500">ภาษาไทย, อังกฤษ และตัวเลข</span>
                        {isCreatingNewUnit && <span className="text-red-500 ml-1">*</span>}
                      </Label>
                      <Input
                        value={unitFormData.unit_name}
                        onChange={(e) => setUnitFormData(prev => ({ ...prev, unit_name: e.target.value }))}
                        className={`mt-2 bg-white border-gray-300 text-gray-900 placeholder-gray-500 ${
                          unitFormData.unit_name && isUnitNameExists(unitFormData.unit_name, variantToUpdate?.id) 
                            ? 'border-red-500 focus:border-red-500' 
                            : ''
                        }`}
                        placeholder="แผง"
                      />
                      {unitFormData.unit_name && isUnitNameExists(unitFormData.unit_name, variantToUpdate?.id) && (
                        <div className="text-xs text-red-600 mt-1">
                          ⚠️ ชื่อหน่วยนับนี้มีอยู่แล้ว กรุณาใช้ชื่ออื่น
                        </div>
                      )}
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-900">
                        ขนาดบรรจุ
                        {isCreatingNewUnit && <span className="text-red-500 ml-1">*</span>}
                      </Label>
                      <Input
                        value={unitFormData.pack_size}
                        onChange={(e) => setUnitFormData(prev => ({ ...prev, pack_size: e.target.value }))}
                        className={`mt-2 bg-white border-gray-300 text-gray-900 placeholder-gray-500 ${
                          unitFormData.pack_size && isPackSizeExists(unitFormData.pack_size, variantToUpdate?.id) 
                            ? 'border-red-500 focus:border-red-500' 
                            : ''
                        }`}
                        placeholder="10"
                      />
                      {unitFormData.pack_size && isPackSizeExists(unitFormData.pack_size, variantToUpdate?.id) && (
                        <div className="text-xs text-red-600 mt-1">
                          ⚠️ ขนาดบรรจุนี้มีอยู่แล้ว กรุณาใช้ขนาดอื่น
                        </div>
                      )}
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-900">
                        ปริมาณ <span className="text-gray-500">หรือ น้ำหนัก</span>
                        {isCreatingNewUnit && <span className="text-red-500 ml-1">*</span>}
                      </Label>
                      <div className="flex space-x-2 mt-2">
                        <Input
                          value={unitFormData.volume}
                          onChange={(e) => setUnitFormData(prev => ({ ...prev, volume: e.target.value }))}
                          className="flex-1 bg-white border-gray-300 text-gray-900 placeholder-gray-500"
                          placeholder="500"
                        />
                        <div className="bg-purple-100 text-purple-600 px-3 py-2 rounded-md text-sm font-medium min-w-[50px] flex items-center justify-center">
                          mg
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* ต้นทุนต่อหน่วย, ราคาขาย และจุดสั่งซื้อ */}
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-gray-900">
                        ต้นทุนต่อหน่วย
                        {isCreatingNewUnit && <span className="text-red-500 ml-1">*</span>}
                      </Label>
                      <Input
                        type="number"
                        value={unitFormData.cost}
                        onChange={(e) => setUnitFormData(prev => ({ ...prev, cost: e.target.value }))}
                        className="mt-2 bg-white border-gray-300 text-gray-900 placeholder-gray-500"
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-900">
                        ราคาขายต่อหน่วย
                        {isCreatingNewUnit && <span className="text-red-500 ml-1">*</span>}
                      </Label>
                      <Input
                        type="number"
                        value={unitFormData.sale_price}
                        onChange={(e) => setUnitFormData(prev => ({ ...prev, sale_price: e.target.value }))}
                        className="mt-2 bg-white border-gray-300 text-gray-900 placeholder-gray-500"
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-900">
                        จุดสั่งซื้อ
                        {isCreatingNewUnit && <span className="text-red-500 ml-1">*</span>}
                      </Label>
                      <Input
                        type="number"
                        value={unitFormData.reorder_point}
                        onChange={(e) => setUnitFormData(prev => ({ ...prev, reorder_point: e.target.value }))}
                        className="mt-2 bg-white border-gray-300 text-gray-900 placeholder-gray-500"
                        placeholder="10"
                      />
                    </div>
                  </div>

                  {/* บาร์โค้ด และ รหัสสินค้า */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-gray-900">
                        บาร์โค้ด
                        {isCreatingNewUnit && <span className="text-red-500 ml-1">*</span>}
                      </Label>
                      <Input
                        value={unitFormData.barcode}
                        onChange={(e) => setUnitFormData(prev => ({ ...prev, barcode: e.target.value }))}
                        className="mt-2 bg-white border-gray-300 text-gray-900 placeholder-gray-500"
                        placeholder="8851473004000"
                      />
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-900">
                        รหัสสินค้า SKU
                        {isCreatingNewUnit && <span className="text-red-500 ml-1">*</span>}
                      </Label>
                      <Input
                        value={unitFormData.sku}
                        onChange={(e) => setUnitFormData(prev => ({ ...prev, sku: e.target.value }))}
                        className="mt-2 bg-white border-gray-300 text-gray-900 placeholder-gray-500"
                        placeholder="SKU0011204"
                      />
                    </div>
                  </div>

                  {/* ชั้นวางและแถวชั้นวาง */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-gray-900">
                        รหัสชั้นวาง
                        {isCreatingNewUnit && <span className="text-red-500 ml-1">*</span>}
                      </Label>
                      <Input
                        value={unitFormData.shelf_code}
                        onChange={(e) => setUnitFormData(prev => ({ ...prev, shelf_code: e.target.value }))}
                        className="mt-2 bg-white border-gray-300 text-gray-900 placeholder-gray-500"
                        placeholder="A1"
                      />
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-900">
                        แถวชั้นวาง
                        {isCreatingNewUnit && <span className="text-red-500 ml-1">*</span>}
                      </Label>
                      <Input
                        value={unitFormData.shelf_row}
                        onChange={(e) => setUnitFormData(prev => ({ ...prev, shelf_row: e.target.value }))}
                        className="mt-2 bg-white border-gray-300 text-gray-900 placeholder-gray-500"
                        placeholder="1"
                      />
                    </div>
                  </div>

                  {/* สวิตช์แสดงหน่วยนับหน้าร้าน POS */}
                  <div className="flex items-center justify-between p-4 border rounded-lg bg-gray-50">
                    <div>
                      <div className="font-medium text-gray-900">แสดงหน่วยนับหน้าร้าน POS</div>
                    </div>
                    <Switch
                      checked={unitFormData.display_pos}
                      onCheckedChange={(checked) => setUnitFormData(prev => ({ ...prev, display_pos: checked }))}
                      className="data-[state=checked]:bg-purple-500"
                    />
                  </div>
                </>
              )
            })()}
          </div>

          <DialogFooter className="pt-4 border-t bg-white">
            <div className="flex justify-between w-full">
              <div>
                {/* Show delete button only for existing units with pack_size > 1 */}
                {!isCreatingNewUnit && parseInt(unitFormData.pack_size || '1') > 1 && (
                  <Button 
                    variant="outline"
                    onClick={() => {
                      setShowUnitEditDialog(false)
                      const existingVariant = productVariants?.find(v => v.sku === unitFormData.sku)
                      if (existingVariant) {
                        handleDeleteUnit(existingVariant.id, unitFormData.pack_size)
                      }
                    }}
                    className="bg-red-500 hover:bg-red-600 text-white border-red-500"
                  >
                    ลบ
                  </Button>
                )}
              </div>
              <div className="flex space-x-2">
                <Button 
                  variant="outline" 
                  onClick={() => setShowUnitEditDialog(false)}
                  className="border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  ยกเลิก
                </Button>
                <Button 
                  onClick={handleUnitSave}
                  className="bg-purple-500 hover:bg-purple-600 text-white"
                >
                  {isCreatingNewUnit ? 'เพิ่มหน่วยนับ' : 'บันทึก'}
                </Button>
              </div>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
