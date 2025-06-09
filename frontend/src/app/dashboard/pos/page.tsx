"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { ChevronDown } from "lucide-react"

export default function POSPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [cartItems, setCartItems] = useState<any[]>([])

  const categories = [
    { id: "all", name: "แสดงทั้งหมด" },
    { id: "medical", name: "เวชภัณฑ์ / เครื่องมือแพทย์" },
    { id: "supplements", name: "เปปติสต์ อื่นๆ" },
    { id: "equipment", name: "เครื่องช่วย / ผลิตภัณฑ์โรงงาน" },
    { id: "supplements2", name: "อาหารเสริม / แผนโบราณ" },
  ]

  const products = [
    { id: 1, name: "3M Futuro Ankle Size M", variant: "BX", price: 290, stock: 4 },
    { id: 2, name: "Gaviscon Suspension รสเปปเปอร์มินต์", variant: "ซอง", price: 29, stock: 8 },
    { id: 3, name: "Gaviscon Suspension รสเปปเปอร์มินต์", variant: "กล่อง(4)", price: 94, stock: 12 },
    { id: 4, name: "ชาร่า ยาเม็ดบรรเทาปวด ลดไข้", variant: "แผง", price: 9, stock: 10 },
    { id: 5, name: "ชาร่า ยาเม็ดบรรเทาปวด ลดไข้", variant: "กล่อง", price: 180, stock: 8 },
    { id: 6, name: "ยาแก้อักเสบ มีโอ XXXX", variant: "แผง", price: 18, stock: 0 },
  ]

  const addToCart = (product: any) => {
    const existingItem = cartItems.find((item) => item.id === product.id)

    if (existingItem) {
      setCartItems(cartItems.map((item) => (item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item)))
    } else {
      setCartItems([...cartItems, { ...product, quantity: 1 }])
    }
  }

  const removeFromCart = (productId: number) => {
    setCartItems(cartItems.filter((item) => item.id !== productId))
  }

  const updateQuantity = (productId: number, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId)
      return
    }

    setCartItems(cartItems.map((item) => (item.id === productId ? { ...item, quantity } : item)))
  }

  const calculateTotal = () => {
    return cartItems.reduce((total, item) => total + item.price * item.quantity, 0)
  }

  return (
    <div className="flex h-full ">
      <div className="flex-1 p-4 overflow-auto ">
        <div className="relative mb-4 ">
          <Input
            placeholder="ค้นหาสินค้า"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-white text-gray-700"
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

        <Tabs defaultValue="all" className="mb-4">
          <TabsList className="w-full overflow-auto text-gray-500">
            {categories.map((category) => (
              <TabsTrigger key={category.id} value={category.id} className="text-xs">
                {category.name}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 text-gray-500">
          {products.map((product) => (
            <Card
              key={product.id}
              className="bg-white shadow-sm cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => addToCart(product)}
            >
              <CardContent className="p-4">
                <div className="bg-gray-100 h-24 mb-2 flex items-center justify-center rounded-md">
                  <span className="text-gray-400 text-3xl">Rx</span>
                </div>
                <h3 className="font-medium text-sm mb-1 line-clamp-2 text-gray-500">{product.name}</h3>
                <div className="text-sm text-gray-500 mb-2">{product.variant}</div>
                <div className="text-purple-600 font-medium">฿{product.price.toFixed(2)}</div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <div className="w-96 border-l bg-gray-50 flex flex-col">
        <div className="p-4 border-b bg-white">
          <h2 className="text-lg font-medium text-center text-gray-500">ตะกร้าสินค้า #1</h2>
        </div>

        <div className="flex-1 overflow-auto p-4">
          {cartItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400">
              <div className="text-6xl mb-4 ">🛒</div>
              <p>ยังไม่มีรายการสินค้าที่ถูกเลือก</p>
              <p className="text-sm">สามารถเลือกสินค้าได้ทางด้านซ้าย</p>
            </div>
          ) : (
            <div className="space-y-4">
              {cartItems.map((item) => (
                <div key={item.id} className="flex items-center justify-between bg-white p-3 rounded-lg shadow-sm">
                  <div className="flex-1">
                    <h3 className="font-medium text-sm text-gray-500">{item.name}</h3>
                    <div className="text-sm text-gray-500">{item.variant}</div>
                    <div className="text-purple-600 ">฿{item.price.toFixed(2)}</div>
                  </div>
                  <div className="flex items-center text-gray-500">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                    >
                      -
                    </Button>
                    <span className="w-8 text-center">{item.quantity}</span>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    >
                      +
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="border-t p-4 bg-white">
          <div className="flex items-center mb-4">
            <Avatar className="h-10 w-10 mr-3 text-gray-500">
              <AvatarFallback>C</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="text-sm font-medium text-gray-500">เลือกข้อมูลลูกค้า</div>
              <div className="text-xs text-gray-500">จากฐานข้อมูลลูกค้า</div>
            </div>
            <Button variant="ghost" size="sm">
              <ChevronDown className="h-4 w-4" />
            </Button>
          </div>

          <div className="space-y-2 mb-4">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">ราคาเฉพาะสินค้า</span>
              <span className="text-gray-500">-</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">ส่วนลด (%)</span>
              <span className="text-gray-500">-</span>
            </div>
            <div className="flex justify-between font-medium text-gray-500">
              <span>ยอดรวมสุทธิ</span>
              <span>฿{calculateTotal().toFixed(2)}</span>
            </div>
          </div>

          <Button className="w-full bg-purple-500 hover:bg-purple-600">ชำระสินค้า ({cartItems.length} รายการ)</Button>
        </div>
      </div>
    </div>
  )
}
