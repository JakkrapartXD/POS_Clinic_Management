"use client"

import { Button } from "@/components/ui/button"

interface CartItemProps {
  id: number | string
  name: string
  variant: string
  price: number
  quantity: number
  onUpdateQuantity: (id: number | string, quantity: number) => void
}

export default function CartItem({ id, name, variant, price, quantity, onUpdateQuantity }: CartItemProps) {
  return (
    <div className="flex items-center justify-between bg-white p-3 rounded-lg shadow-sm">
      <div className="flex-1">
        <h3 className="font-medium text-sm">{name}</h3>
        <div className="text-sm text-gray-500">{variant}</div>
        <div className="text-purple-600">฿{price.toFixed(2)}</div>
      </div>
      <div className="flex items-center">
        <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => onUpdateQuantity(id, quantity - 1)}>
          -
        </Button>
        <span className="w-8 text-center">{quantity}</span>
        <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => onUpdateQuantity(id, quantity + 1)}>
          +
        </Button>
      </div>
    </div>
  )
}
