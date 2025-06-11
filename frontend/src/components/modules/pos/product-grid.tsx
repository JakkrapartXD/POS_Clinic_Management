"use client"

import { Card, CardContent } from "@/components/ui/card"

interface Product {
  id: number | string
  name: string
  variant: string
  price: number
  image?: string
}

interface ProductGridProps {
  products: Product[]
  onProductClick: (product: Product) => void
}

export default function ProductGrid({ products, onProductClick }: ProductGridProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
      {products.map((product) => (
        <Card
          key={product.id}
          className="bg-white shadow-sm cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => onProductClick(product)}
        >
          <CardContent className="p-4">
            <div className="bg-gray-100 h-24 mb-2 flex items-center justify-center rounded-md">
              {product.image ? (
                <img
                  src={product.image || "/placeholder.svg"}
                  alt={product.name}
                  className="h-full w-full object-contain"
                />
              ) : (
                <span className="text-gray-400 text-3xl">Rx</span>
              )}
            </div>
            <h3 className="font-medium text-sm mb-1 line-clamp-2">{product.name}</h3>
            <div className="text-sm text-gray-500 mb-2">{product.variant}</div>
            <div className="text-purple-600 font-medium">฿{product.price.toFixed(2)}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
