"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import {
  Plus,
  ImportIcon as FileImport,
  FileOutputIcon as FileExport,
  Trash2,
  Barcode,
  Tag,
  Clipboard,
} from "lucide-react"

export default function InventoryPage() {
  const [searchQuery, setSearchQuery] = useState("")

  const alphabet = Array.from({ length: 26 }, (_, i) => String.fromCharCode(65 + i))

  const products = [
    { id: 1, letter: "A", name: "3M Futuro Ankle Size M", variant: "BX", stock: 4, status: "99 BX", price: 290 },
    {
      id: 2,
      letter: "G",
      name: "Gaviscon Suspension รสเปปเปอร์มินต์",
      variant: "ซอง",
      stock: 8,
      status: "1 กล่อง",
      price: 29,
    },
    {
      id: 3,
      letter: "G",
      name: "Gaviscon Suspension รสเปปเปอร์มินต์",
      variant: "กล่อง(4)",
      stock: 12,
      status: "หมด",
      price: 94,
    },
    { id: 4, letter: "ช", name: "ชาร่า ยาเม็ดบรรเทาปวด ลดไข้", variant: "แผง", stock: 10, status: "หมด", price: 9 },
    { id: 5, letter: "ช", name: "ชาร่า ยาเม็ดบรรเทาปวด ลดไข้", variant: "กล่อง", stock: 8, status: "หมด", price: 180 },
    { id: 6, letter: "ย", name: "ยาแก้อักเสบ มีโอ XXXX", variant: "แผง", stock: 0, status: "1,000 แผง", price: 18 },
  ]

  const filteredProducts = products.filter((product) => product.name.toLowerCase().includes(searchQuery.toLowerCase()))

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-semibold text-gray-500">สต็อกสินค้า</h1>
        <Button variant="outline" className="text-purple-500 bg-white hover:bg-purple-50">
          ตัวเลือก
        </Button>
      </div>

      <div className="relative mb-6 ">
        <Input
          placeholder="ค้นหาสินค้า"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 bg-white text-gray-600"
        />
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500"
        >
          <circle cx="11" cy="11" r="8"></circle>
          <path d="m21 21-4.3-4.3"></path>
        </svg>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card className="bg-white shadow-sm">
          <CardContent className="p-4 flex flex-col items-center">
            <Plus className="h-5 w-5 text-purple-500 mb-2" />
            <div className="text-purple-500 font-medium">เพิ่มสินค้าใหม่</div>
            <div className="text-gray-500 text-sm">Create New Item</div>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-sm">
          <CardContent className="p-4 flex flex-col items-center">
            <FileImport className="h-5 w-5 text-purple-500 mb-2" />
            <div className="text-purple-500 font-medium">เพิ่มดูสินค้า/นำเข้า/แก้ไข</div>
            <div className="text-gray-500 text-sm">Import</div>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-sm">
          <CardContent className="p-4 flex flex-col items-center">
            <FileExport className="h-5 w-5 text-purple-500 mb-2" />
            <div className="text-purple-500 font-medium">ส่งออกดูสินค้า</div>
            <div className="text-gray-500 text-sm">Export</div>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-sm">
          <CardContent className="p-4 flex flex-col items-center">
            <Trash2 className="h-5 w-5 text-purple-500 mb-2" />
            <div className="text-purple-500 font-medium">ลบสินค้า</div>
            <div className="text-gray-500 text-sm">Remove Product</div>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-sm">
          <CardContent className="p-4 flex flex-col items-center">
            <Barcode className="h-5 w-5 text-purple-500 mb-2" />
            <div className="text-purple-500 font-medium">พิมพ์ป้ายบาร์โค้ด</div>
            <div className="text-gray-500 text-sm">Barcode</div>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-sm">
          <CardContent className="p-4 flex flex-col items-center">
            <Tag className="h-5 w-5 text-purple-500 mb-2" />
            <div className="text-purple-500 font-medium">พิมพ์ป้ายราคาสินค้า</div>
            <div className="text-gray-500 text-sm">Price Tag</div>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-sm">
          <CardContent className="p-4 flex flex-col items-center">
            <Tag className="h-5 w-5 text-purple-500 mb-2" />
            <div className="text-purple-500 font-medium">พิมพ์ฉลากยา</div>
            <div className="text-gray-500 text-sm">Label</div>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-sm">
          <CardContent className="p-4 flex flex-col items-center">
            <Clipboard className="h-5 w-5 text-purple-500 mb-2" />
            <div className="text-purple-500 font-medium">รายงานรับเข้า/ออกของสินค้า</div>
            <div className="text-gray-500 text-sm">Product IN/OUT Report</div>
          </CardContent>
        </Card>
      </div>

      <div className="flex">
        <div className="w-12 border-r">
          <div className="flex flex-col items-center">
            <div className="text-sm font-medium mb-2">3</div>
            {alphabet.map((letter) => (
              <div key={letter} className="text-xs text-gray-500 py-1">
                {letter}
              </div>
            ))}
            <div className="text-xs text-gray-500 py-1">--</div>
          </div>
        </div>

        <div className="flex-1">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {filteredProducts.map((product) => (
              <Card key={product.id} className="bg-white shadow-sm">
                <CardContent className="p-4">
                  <div
                    className={`text-xs px-2 py-1 rounded-md inline-block mb-2 ${
                      product.status.includes("หมด") ? "bg-gray-500" : "bg-green-600"
                    }`}
                  >
                    {product.status}
                  </div>
                  <h3 className="font-medium text-sm mb-1 text-gray-500">{product.name}</h3>
                  <div className="text-sm text-gray-500 mb-2">{product.variant}</div>
                  <div className="text-purple-600 font-medium">฿{product.price.toFixed(2)}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
