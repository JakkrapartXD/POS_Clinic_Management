"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import ProductSearch from "@/components/modules/inventory/product-search"
import ActionCard from "@/components/modules/inventory/action-card"
import ProductCard from "@/components/modules/inventory/product-card"
import ProductAlphabetSidebar from "@/components/modules/inventory/product-alphabet-sidebar"
import PageHeader from "@/components/layout/page-header"
import CardGrid from "@/components/ui/card-grid"
import { Plus, FileInput, FileOutput, Trash2, Barcode, Tag, Clipboard } from "lucide-react"

export default function InventoryExample() {
  const [searchQuery, setSearchQuery] = useState("")

  const actionCards = [
    { id: "add", icon: Plus, title: "เพิ่มสินค้าใหม่", subtitle: "Create New Item" },
    { id: "import", icon: FileInput, title: "เพิ่มดูสินค้า/นำเข้า/แก้ไข", subtitle: "Import" },
    { id: "export", icon: FileOutput, title: "ส่งออกดูสินค้า", subtitle: "Export" },
    { id: "remove", icon: Trash2, title: "ลบสินค้า", subtitle: "Remove Product" },
    { id: "barcode", icon: Barcode, title: "พิมพ์ป้ายบาร์โค้ด", subtitle: "Barcode" },
    { id: "price", icon: Tag, title: "พิมพ์ป้ายราคาสินค้า", subtitle: "Price Tag" },
    { id: "label", icon: Tag, title: "พิมพ์ฉลากยา", subtitle: "Label" },
    { id: "report", icon: Clipboard, title: "รายงานรับเข้า/ออกของสินค้า", subtitle: "Product IN/OUT Report" },
  ]

  const products = [
    { id: 1, name: "3M Futuro Ankle Size M", variant: "BX", price: 290, status: "99 BX" },
    { id: 2, name: "Gaviscon Suspension รสเปปเปอร์มินต์", variant: "ซอง", price: 29, status: "1 กล่อง" },
    { id: 3, name: "Gaviscon Suspension รสเปปเปอร์มินต์", variant: "กล่อง(4)", price: 94, status: "หมด" },
    { id: 4, name: "ชาร่า ยาเม็ดบรรเทาปวด ลดไข้", variant: "แผง", price: 9, status: "หมด" },
    { id: 5, name: "ชาร่า ยาเม็ดบรรเทาปวด ลดไข้", variant: "กล่อง", price: 180, status: "หมด" },
    { id: 6, name: "ยาแก้อักเสบ มีโอ XXXX", variant: "แผง", price: 18, status: "1,000 แผง" },
  ]

  const filteredProducts = products.filter((product) => product.name.toLowerCase().includes(searchQuery.toLowerCase()))

  const handleActionClick = (actionId: string) => {
    console.log(`Action clicked: ${actionId}`)
  }

  const handleProductClick = (productId: number) => {
    console.log(`Product clicked: ${productId}`)
  }

  return (
    <div className="p-4">
      <PageHeader title="สต็อกสินค้า">
        <Button variant="outline" className="text-teal-500">
          ตัวเลือก
        </Button>
      </PageHeader>

      <ProductSearch value={searchQuery} onChange={setSearchQuery} />

      <div className="my-6">
        <CardGrid columns={{ sm: 1, md: 2, lg: 4 }}>
          {actionCards.map((card) => (
            <ActionCard
              key={card.id}
              icon={card.icon}
              title={card.title}
              subtitle={card.subtitle}
              onClick={() => handleActionClick(card.id)}
            />
          ))}
        </CardGrid>
      </div>

      <div className="flex">
        <ProductAlphabetSidebar activeLetters={["A", "G"]} count={filteredProducts.length} />

        <div className="flex-1 pl-4">
          <CardGrid columns={{ sm: 1, md: 3, lg: 5 }}>
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                id={product.id}
                name={product.name}
                variant={product.variant}
                price={product.price}
                status={product.status}
                onClick={() => handleProductClick(product.id)}
              />
            ))}
          </CardGrid>
        </div>
      </div>
    </div>
  )
}
