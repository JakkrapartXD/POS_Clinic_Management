"use client"

import { useState } from "react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { Bell, ShoppingCart, Pill, Tag, LayoutGrid, Package, BarChart3, Settings, Users } from "lucide-react"

export default function Sidebar() {
  const [activeItem, setActiveItem] = useState<string>("inventory")

  const menuItems = [
    { id: "notifications", icon: Bell, href: "/dashboard/notifications" },
    { id: "pos", icon: ShoppingCart, href: "/dashboard/pos" },
    { id: "inventory", icon: Pill, href: "/dashboard/inventory" },
    { id: "tags", icon: Tag, href: "/dashboard/discounts" },
    { id: "documents", icon: LayoutGrid, href: "/dashboard/documents" },
    { id: "orders", icon: Package, href: "/dashboard/orders" },
    { id: "reports", icon: BarChart3, href: "/dashboard/reports" },
    { id: "settings", icon: Settings, href: "/dashboard/settings" },
  ]

  return (
    <div className="w-20 bg-white border-r flex flex-col items-center py-4">
      <div className="mb-8">
        <Link href="/">
          <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center relative">
            <div className="w-10 h-10 rounded-full bg-purple-500 flex items-center justify-center">
              <Users className="text-white" size={20} />
            </div>
            <div className="absolute -right-1 -bottom-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
          </div>
        </Link>
      </div>
      <nav className="flex flex-col items-center space-y-4 flex-1">
        {menuItems.map((item) => (
          <Link
            key={item.id}
            href={item.href}
            onClick={() => setActiveItem(item.id)}
            className={cn(
              "w-12 h-12 flex items-center justify-center rounded-lg transition-colors",
              activeItem === item.id
                ? "bg-purple-100 text-purple-600"
                : "text-gray-400 hover:text-gray-600 hover:bg-gray-100",
            )}
          >
            <item.icon size={24} />
          </Link>
        ))}
      </nav>
      <div className="mt-auto text-xs text-gray-400">1.1.109</div>
    </div>
  )
}
