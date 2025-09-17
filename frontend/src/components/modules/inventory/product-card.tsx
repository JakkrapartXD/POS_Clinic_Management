"use client"

import { Card, CardContent } from "@/components/ui/card"

interface ProductCardProps {
  id: number | string
  name: string
  variant: string
  price: number
  status: string
  onClick?: () => void
}

export default function ProductCard({ id, name, variant, price, status, onClick }: ProductCardProps) {
  return (
    <Card className="bg-white shadow-sm hover:shadow-md transition-shadow cursor-pointer" onClick={onClick}>
      <CardContent className="p-4">
        <div
          className={`text-xs px-2 py-1 rounded-md inline-block mb-2 ${
            status.includes("หมด") ? "bg-gray-200" : "bg-green-200"
          }`}
        >
          {status}
        </div>
        <h3 className="font-medium text-sm mb-1 line-clamp-2">{name}</h3>
        <div className="text-sm text-gray-500 mb-2">{variant}</div>
        <div className="text-teal-600 font-medium">฿{price.toFixed(2)}</div>
      </CardContent>
    </Card>
  )
}
