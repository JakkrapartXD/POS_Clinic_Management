"use client"

import { Button } from "@/components/ui/button"

interface CheckoutButtonProps {
  itemCount: number
  onClick: () => void
  disabled?: boolean
}

export default function CheckoutButton({ itemCount, onClick, disabled = false }: CheckoutButtonProps) {
  return (
    <Button
      className="w-full bg-purple-500 hover:bg-purple-600"
      onClick={onClick}
      disabled={disabled || itemCount === 0}
    >
      ชำระสินค้า ({itemCount} รายการ)
    </Button>
  )
}
