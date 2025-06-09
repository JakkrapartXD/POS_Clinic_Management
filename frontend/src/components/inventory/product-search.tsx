"use client"

import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"

interface ProductSearchProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

export default function ProductSearch({
  value,
  onChange,
  placeholder = "ค้นหาสินค้าจากชื่อ หรือบาร์โค้ด...",
}: ProductSearchProps) {
  return (
    <div className="relative">
      <Input placeholder={placeholder} value={value} onChange={(e) => onChange(e.target.value)} className="pl-10" />
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
    </div>
  )
}
