"use client"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { ChevronDown } from "lucide-react"

interface CustomerSelectorProps {
  onSelect: () => void
  customer?: {
    id: string | number
    name: string
    initial: string
  }
}

export default function CustomerSelector({ onSelect, customer }: CustomerSelectorProps) {
  return (
    <div className="flex items-center mb-4">
      <Avatar className="h-10 w-10 mr-3">
        <AvatarFallback>{customer?.initial || "C"}</AvatarFallback>
      </Avatar>
      <div className="flex-1">
        <div className="text-sm font-medium">{customer?.name || "เลือกข้อมูลลูกค้า"}</div>
        <div className="text-xs text-gray-500">{customer ? `ลูกค้า #${customer.id}` : "จากฐานข้อมูลลูกค้า"}</div>
      </div>
      <Button variant="ghost" size="sm" onClick={onSelect}>
        <ChevronDown className="h-4 w-4" />
      </Button>
    </div>
  )
}
