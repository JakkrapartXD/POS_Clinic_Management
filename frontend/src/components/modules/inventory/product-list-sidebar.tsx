"use client"

import { useMemo } from "react"
import { Input } from "@/components/ui/input"

interface Product {
  id: string | number
  letter: string
  name: string
  variant: string
  stock: number
  status: string
  price: number
}

interface ProductListSidebarProps {
  searchQuery: string
  onSearchChange: (value: string) => void
  selectedLetter: string
  products: Product[]
}

export default function ProductListSidebar({
  searchQuery,
  onSearchChange,
  selectedLetter,
  products
}: ProductListSidebarProps) {
  // Group products by first letter
  const groupedProducts = useMemo(() => {
    const filtered = products.filter((product) => 
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
      (!selectedLetter || product.letter === selectedLetter)
    )
    
    const grouped = filtered.reduce((acc, product) => {
      const letter = product.letter
      if (!acc[letter]) {
        acc[letter] = []
      }
      acc[letter].push(product)
      return acc
    }, {} as Record<string, typeof products>)
    
    return grouped
  }, [searchQuery, selectedLetter, products])

  const totalProducts = Object.values(groupedProducts).flat().length

  return (
    <div className="w-80 bg-white border-r flex flex-col h-full">
      {/* Search Section - Fixed */}
      <div className="p-4 border-b flex-shrink-0">
        <div className="relative">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
          >
            <circle cx="11" cy="11" r="8"></circle>
            <path d="m21 21-4.3-4.3"></path>
          </svg>
          <Input
            placeholder="ค้นหาสินค้าจากรายชื่อ หรือรวมรหัสโค้ด..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10 text-sm border-gray-200"
          />
        </div>
      </div>

      {/* Stock Count - Fixed */}
      <div className="p-4 border-b flex-shrink-0">
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-700">{totalProducts}</div>
          <div className="text-sm text-gray-500">รายการสินค้า</div>
        </div>
      </div>

      {/* Product List with Sections - Scrollable */}
      <div className="flex-1 overflow-y-auto">
        {Object.entries(groupedProducts).length > 0 ? (
          Object.entries(groupedProducts).map(([letter, products]) => (
            <div key={letter} className="border-b border-gray-100">
              {/* Section Header */}
              <div className="sticky top-0 bg-gray-50 px-4 py-2 border-b z-10">
                <h3 className="font-medium text-gray-700 text-lg">{letter}</h3>
              </div>
              
              {/* Products in Section */}
              <div className="space-y-1 p-2">
                {products.map((product) => (
                  <div 
                    key={product.id} 
                    className="p-3 hover:bg-gray-50 rounded-lg border border-gray-100 bg-white cursor-pointer transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="font-medium text-gray-900 text-sm">{product.name}</div>
                        <div className="text-xs text-gray-500 mt-1">{product.variant}</div>
                        <div className="text-xs text-gray-400 mt-1">{product.status}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium text-purple-600">฿{product.price}</div>
                        <div className="w-4 h-4 border border-gray-300 mt-1"></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        ) : (
          <div className="p-8 text-center text-gray-500">
            <div className="text-lg mb-2">ไม่พบสินค้า</div>
            <div className="text-sm">ลองเปลี่ยนคำค้นหาหรือเลือกหมวดหมู่อื่น</div>
          </div>
        )}
      </div>
    </div>
  )
}
