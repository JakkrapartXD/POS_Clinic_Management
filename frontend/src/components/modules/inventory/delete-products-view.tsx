"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Trash2, Search, AlertTriangle, Package, Loader2 } from "lucide-react"
import { GraphQLAPI } from "@/clients/graphql"
import { logger } from "@/lib/logger"

// Product interface for local use
interface Product {
  id: string;
  product_name: string;
  product_type?: string;
  status?: string;
  stock_quantity?: number;
  unit?: string;
  pack_size?: string;
  cost?: number;
  sale_price?: number;
  reorder_point?: number;
}

// Delete operation result interfaces
interface DeleteError {
  productId: string;
  productName: string;
  error: string;
}

interface DeleteOperationResult {
  productIds: string[];
  reason: string;
  action?: 'soft_delete' | 'set_inactive';
  errors?: DeleteError[];
}

interface FailedProduct {
  productId: string;
  productName: string;
  error: string;
}

interface DeleteProductsViewProps {
  onBack: () => void
  onDelete: (data: DeleteOperationResult) => void
}

export default function DeleteProductsView({ onBack, onDelete }: DeleteProductsViewProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedProducts, setSelectedProducts] = useState<string[]>([])
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleteReason, setDeleteReason] = useState("")
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showAlternativeAction, setShowAlternativeAction] = useState(false)
  const [failedProducts, setFailedProducts] = useState<FailedProduct[]>([])

  const filteredProducts = products.filter(product => 
    product.product_name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleProductSelect = (productId: string) => {
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

  // Load products from backend
  useEffect(() => {
    const loadProducts = async () => {
      try {
        setLoading(true)
        const response = await GraphQLAPI.getAllProducts()
        setProducts(response.products.products || [])
        if (process.env.NODE_ENV === 'development') {
          logger.info('Products loaded successfully', { count: response.products.products?.length }, 'INVENTORY')
        }
      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          logger.error('Failed to load products', error, 'INVENTORY')
        }
        setProducts([])
      } finally {
        setLoading(false)
      }
    }

    loadProducts()
  }, [])

  const handleDelete = async () => {
    if (selectedProducts.length > 0 && confirmDelete) {
      try {
        setDeleting(true)
        setError(null)
        
        // Delete products one by one and collect results
        const results: { productId: string; success: boolean }[] = []
        const errors: DeleteError[] = []
        
        for (const productId of selectedProducts) {
          try {
            await GraphQLAPI.deleteProduct(productId)
            results.push({ productId, success: true })
          } catch (error: any) {
            const product = products.find(p => p.id === productId)
            const productName = product?.product_name || 'Unknown'
            
            // Log the full error for debugging
            console.log('Delete product error:', error)
            
            // Extract error message from various possible structures
            let errorMessage = ''
            
            // Check for GraphQL error structure first
            if (error?.extensions?.originalError?.message) {
              errorMessage = error.extensions.originalError.message
            } else if (error?.message) {
              errorMessage = error.message
            } else if (error?.extensions?.originalError?.stack) {
              // Try to extract message from stack trace
              const stack = error.extensions.originalError.stack
              const match = stack.match(/Error: (.+?)\n/)
              if (match) {
                errorMessage = match[1]
              }
            } else if (typeof error === 'string') {
              errorMessage = error
            } else if (error?.toString) {
              errorMessage = error.toString()
            }
            
            // Check if it's the specific error about existing dependencies
            if (errorMessage.includes('existing orders') || 
                errorMessage.includes('existing prescriptions') ||
                errorMessage.includes('Cannot delete product with existing') ||
                errorMessage.includes('Set status to inactive instead')) {
              errors.push({
                productId,
                productName,
                error: 'สินค้านี้มีการใช้งานในระบบแล้ว (คำสั่งซื้อ/ใบสั่งยา) ไม่สามารถลบได้ กรุณาเปลี่ยนสถานะเป็น "ไม่ใช้งาน" แทน'
              })
            } else {
              // Show the actual error message for debugging
              const displayError = errorMessage || 'เกิดข้อผิดพลาดไม่ทราบสาเหตุ'
              errors.push({
                productId,
                productName,
                error: displayError
              })
            }
          }
        }
        
        console.log('Product deletion completed', { 
          successful: results.length, 
          failed: errors.length,
          errors: errors
        })
        
        // Show error message if there are any failures
        if (errors.length > 0) {
          console.log('Processing errors:', errors)
          
          const dependencyErrors = errors.filter(e => 
            e.error.includes('existing orders') || 
            e.error.includes('existing prescriptions') ||
            e.error.includes('ไม่สามารถลบได้') ||
            e.error.includes('มีการใช้งานในระบบแล้ว')
          )
          const otherErrors = errors.filter(e => 
            !e.error.includes('existing orders') && 
            !e.error.includes('existing prescriptions') &&
            !e.error.includes('ไม่สามารถลบได้') &&
            !e.error.includes('มีการใช้งานในระบบแล้ว')
          )
          
          console.log('Dependency errors:', dependencyErrors)
          console.log('Other errors:', otherErrors)
          
          let errorMessage = ''
          
          if (dependencyErrors.length > 0) {
            errorMessage += `ไม่สามารถลบสินค้า ${dependencyErrors.length} รายการได้ เนื่องจากมีการใช้งานในระบบแล้ว:\n${dependencyErrors.map(e => `• ${e.productName}`).join('\n')}\n\n`
            console.log('Setting failed products:', dependencyErrors)
            setFailedProducts(dependencyErrors)
            setShowAlternativeAction(true)
          }
          
          if (otherErrors.length > 0) {
            errorMessage += `เกิดข้อผิดพลาดในการลบสินค้า ${otherErrors.length} รายการ:\n${otherErrors.map(e => `• ${e.productName}: ${e.error}`).join('\n')}`
          }
          
          console.log('Setting error message:', errorMessage)
          setError(errorMessage)
          
          // If some products were deleted successfully, still call the callback
          if (results.length > 0) {
            onDelete({
              productIds: results.map(r => r.productId),
              reason: deleteReason,
              errors: errors
            })
          }
        } else {
          // All products soft deleted successfully
          console.log('All products soft deleted successfully')
          onDelete({
            productIds: selectedProducts,
            reason: deleteReason,
            action: 'soft_delete'
          })
          
          // Clear selection
          setSelectedProducts([])
          setConfirmDelete(false)
          setDeleteReason("")
        }
        
      } catch (error) {
        console.error('Failed to soft delete products', error)
        setError('เกิดข้อผิดพลาดในการลบสินค้า กรุณาลองใหม่อีกครั้ง')
      } finally {
        setDeleting(false)
      }
    }
  }

  const handleSetInactive = async () => {
    if (failedProducts.length > 0) {
      try {
        setDeleting(true)
        setError(null)
        
        console.log('Setting products to inactive:', failedProducts)
        
        // Update products to inactive status
        const updatePromises = failedProducts.map(product => 
          GraphQLAPI.updateProduct(product.productId, { status: 'inactive' })
        )
        
        await Promise.all(updatePromises)
        
        console.log('Products set to inactive', { count: failedProducts.length })
        
        // Call parent callback
        onDelete({
          productIds: failedProducts.map(p => p.productId),
          reason: `เปลี่ยนสถานะเป็นไม่ใช้งาน: ${deleteReason}`,
          action: 'set_inactive'
        })
        
        // Clear states
        setFailedProducts([])
        setShowAlternativeAction(false)
        setSelectedProducts([])
        setConfirmDelete(false)
        setDeleteReason("")
        
      } catch (error) {
        console.error('Failed to set products inactive', error)
        setError('เกิดข้อผิดพลาดในการเปลี่ยนสถานะสินค้า กรุณาลองใหม่อีกครั้ง')
      } finally {
        setDeleting(false)
      }
    }
  }

  const canDelete = selectedProducts.length > 0 && confirmDelete && deleteReason.trim() && !deleting

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-gray-800 mb-2">ลบสินค้า</h2>
        <p className="text-gray-600">เลือกสินค้าที่ต้องการลบออกจากระบบ (ข้อมูลจะถูกซ่อนแต่ยังคงอยู่ในฐานข้อมูล)</p>
        
        {/* Error Message */}
        {error && (
          <Alert className="mt-4 border-red-200 bg-red-50">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800 whitespace-pre-line">
              {error}
            </AlertDescription>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setError(null)}
              className="mt-2 text-red-600 hover:text-red-800"
            >
              ปิด
            </Button>
          </Alert>
        )}
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
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                    <span className="ml-2 text-gray-500">กำลังโหลดสินค้า...</span>
                  </div>
                ) : (
                  <>
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
                            <div className="font-medium text-gray-900">{product.product_name}</div>
                            <div className="text-sm text-gray-500">
                              {product.pack_size || product.unit} • สต็อก: {product.stock_quantity || 0} • ฿{product.sale_price || 0}
                            </div>
                          </div>
                          {(product.stock_quantity || 0) > 0 && (
                            <div className="text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded">
                              มีสต็อก
                            </div>
                          )}
                        </div>
                      </div>
                    ))}

                    {filteredProducts.length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        {searchQuery ? 'ไม่พบสินค้าที่ตรงกับการค้นหา' : 'ไม่มีสินค้าในระบบ'}
                      </div>
                    )}
                  </>
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
              <Alert className="border-orange-200 bg-orange-50">
                <AlertTriangle className="h-4 w-4 text-orange-600" />
                <AlertDescription className="text-orange-700 text-sm">
                  การลบสินค้าจะซ่อนข้อมูลออกจากการแสดงผล แต่ข้อมูลยังคงอยู่ในฐานข้อมูล สามารถกู้คืนได้ในภายหลัง
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
                  การดำเนินการนี้จะซ่อนสินค้าออกจากระบบ (Soft Delete)
                </div>
              </div>
                              <div className="text-right">
                  <div className="text-sm text-gray-500">รวมสต็อกที่จะลบ</div>
                  <div className="font-bold text-red-600">
                    {selectedProducts.reduce((sum, id) => {
                      const product = products.find(p => p.id === id)
                      return sum + (product?.stock_quantity || 0)
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
        
        {/* Alternative Action Button */}
        {showAlternativeAction && (
          <Button 
            onClick={handleSetInactive}
            disabled={deleting}
            variant="secondary"
          >
            {deleting ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Package className="h-4 w-4 mr-2" />
            )}
            {deleting ? 'กำลังเปลี่ยนสถานะ...' : `เปลี่ยนสถานะเป็นไม่ใช้งาน (${failedProducts.length})`}
          </Button>
        )}
        
        <Button 
          onClick={handleDelete}
          disabled={!canDelete}
          variant="destructive"
        >
          {deleting ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Trash2 className="h-4 w-4 mr-2" />
          )}
          {deleting ? 'กำลังลบ...' : `ลบสินค้า (${selectedProducts.length})`}
        </Button>
      </div>
    </div>
  )
}
