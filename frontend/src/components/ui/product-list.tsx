import React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface ProductListItem {
  id: string
  product_name?: string
  product_unit?: string
  product: {
    product_name: string
    unit?: string
  }
  quantity: number
  unit_price: number
  total_price: number
}

interface ProductListProps {
  items: ProductListItem[]
  title?: string
  showTotal?: boolean
  getDisplayName: (item: ProductListItem) => string
}

export function ProductList({ 
  items, 
  title = "รายการสินค้า", 
  showTotal = true,
  getDisplayName 
}: ProductListProps) {
  const totalAmount = items.reduce((sum, item) => sum + item.total_price, 0)

  return (
    <Card>
      <CardContent className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
        
        {items.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>ไม่มีรายการสินค้า</p>
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((item) => (
              <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <p className="font-medium text-gray-900">
                    {getDisplayName(item)}
                  </p>
                  <div className="flex items-center space-x-4 mt-1">
                    <Badge variant="secondary" className="text-xs">
                      จำนวน: {item.quantity}
                    </Badge>
                    <span className="text-sm text-gray-600">
                      ราคาต่อหน่วย: ฿{item.unit_price.toFixed(2)}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900">
                    ฿{item.total_price.toFixed(2)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
        
        {showTotal && items.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex justify-between items-center">
              <span className="text-lg font-semibold text-gray-900">รวมทั้งสิ้น</span>
              <span className="text-lg font-bold text-gray-900">
                ฿{totalAmount.toFixed(2)}
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default ProductList
