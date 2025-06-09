"use client"

import { useState } from "react"
import ProductSearch from "@/components/inventory/product-search"
import CategoryTabs from "@/components/pos/category-tabs"
import ProductGrid from "@/components/pos/product-grid"
import CartItem from "@/components/pos/cart-item"
import EmptyCart from "@/components/pos/empty-cart"
import CustomerSelector from "@/components/pos/customer-selector"
import CartSummary from "@/components/pos/cart-summary"
import CheckoutButton from "@/components/pos/checkout-button"

export default function POSExample() {
  const [searchQuery, setSearchQuery] = useState("")
  const [cartItems, setCartItems] = useState<any[]>([])
  const [activeCategory, setActiveCategory] = useState("all")

  const categories = [
    { id: "all", name: "แสดงทั้งหมด" },
    { id: "medical", name: "เวชภัณฑ์ / เครื่องมือแพทย์" },
    { id: "supplements", name: "เปปติสต์ อื่นๆ" },
    { id: "equipment", name: "เครื่องช่วย / ผลิตภัณฑ์โรงงาน" },
    { id: "supplements2", name: "อาหารเสริม / แผนโบราณ" },
  ]

  const products = [
    { id: 1, name: "3M Futuro Ankle Size M", variant: "BX", price: 290 },
    { id: 2, name: "Gaviscon Suspension รสเปปเปอร์มินต์", variant: "ซอง", price: 29 },
    { id: 3, name: "Gaviscon Suspension รสเปปเปอร์มินต์", variant: "กล่อง(4)", price: 94 },
    { id: 4, name: "ชาร่า ยาเม็ดบรรเทาปวด ลดไข้", variant: "แผง", price: 9 },
    { id: 5, name: "ชาร่า ยาเม็ดบรรเทาปวด ลดไข้", variant: "กล่อง", price: 180 },
    { id: 6, name: "ยาแก้อักเสบ มีโอ XXXX", variant: "แผง", price: 18 },
  ]

  const filteredProducts = products.filter((product) => product.name.toLowerCase().includes(searchQuery.toLowerCase()))

  const addToCart = (product: any) => {
    const existingItem = cartItems.find((item) => item.id === product.id)

    if (existingItem) {
      setCartItems(cartItems.map((item) => (item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item)))
    } else {
      setCartItems([...cartItems, { ...product, quantity: 1 }])
    }
  }

  const updateQuantity = (productId: number | string, quantity: number) => {
    if (quantity <= 0) {
      setCartItems(cartItems.filter((item) => item.id !== productId))
      return
    }

    setCartItems(cartItems.map((item) => (item.id === productId ? { ...item, quantity } : item)))
  }

  const calculateTotal = () => {
    return cartItems.reduce((total, item) => total + item.price * item.quantity, 0)
  }

  const handleCheckout = () => {
    console.log("Checkout clicked", cartItems)
  }

  const handleCustomerSelect = () => {
    console.log("Select customer clicked")
  }

  return (
    <div className="flex h-full">
      <div className="flex-1 p-4 overflow-auto">
        <ProductSearch value={searchQuery} onChange={setSearchQuery} />

        <CategoryTabs categories={categories} defaultValue={activeCategory} onValueChange={setActiveCategory} />

        <ProductGrid products={filteredProducts} onProductClick={addToCart} />
      </div>

      <div className="w-96 border-l bg-gray-50 flex flex-col">
        <div className="p-4 border-b bg-white">
          <h2 className="text-lg font-medium text-center">ตะกร้าสินค้า #1</h2>
        </div>

        <div className="flex-1 overflow-auto p-4">
          {cartItems.length === 0 ? (
            <EmptyCart />
          ) : (
            <div className="space-y-4">
              {cartItems.map((item) => (
                <CartItem
                  key={item.id}
                  id={item.id}
                  name={item.name}
                  variant={item.variant}
                  price={item.price}
                  quantity={item.quantity}
                  onUpdateQuantity={updateQuantity}
                />
              ))}
            </div>
          )}
        </div>

        <div className="border-t p-4 bg-white">
          <CustomerSelector onSelect={handleCustomerSelect} />

          <CartSummary subtotal={calculateTotal()} discount={0} total={calculateTotal()} />

          <CheckoutButton itemCount={cartItems.length} onClick={handleCheckout} />
        </div>
      </div>
    </div>
  )
}
