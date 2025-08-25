"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { Bell, ShoppingCart, Pill, Tag, LayoutGrid, Package, BarChart3, Settings, Users, FileText, Shield, Receipt } from "lucide-react"
import { useUser } from "@/hooks/use-user"
import { getMenuItemsForRole } from "@/config/role-permissions"
import { logger } from "@/lib/logger"
import { GraphQLAPI } from "@/clients/graphql"

export default function Sidebar() {
  const [activeItem, setActiveItem] = useState<string>("notifications")
  const [todayReceiptsCount, setTodayReceiptsCount] = useState<number>(0)
  const { user, loading } = useUser()

  // ดึงจำนวนใบเสร็จรับเงินวันนี้
  const fetchTodayReceiptsCount = async () => {
    try {
      const today = new Date()
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate())
      const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59)

      const response = await GraphQLAPI.getTodayOrders({
        date_from: startOfDay.toISOString(),
        date_to: endOfDay.toISOString()
      })

      if (response.orders?.total) {
        setTodayReceiptsCount(response.orders.total)
      }
    } catch (error) {
      logger.error('Failed to fetch today receipts count', error, 'SIDEBAR')
    }
  }

  useEffect(() => {
    fetchTodayReceiptsCount()
    
    // รับ event เมื่อมีการชำระเงินใหม่
    const handleReceiptsUpdated = () => {
      fetchTodayReceiptsCount()
    }
    
    window.addEventListener('receiptsUpdated', handleReceiptsUpdated)
    
    // Cleanup event listener
    return () => {
      window.removeEventListener('receiptsUpdated', handleReceiptsUpdated)
    }
  }, [])

  const allMenuItems = [
    { id: "notifications", icon: Bell, href: "/dashboard/notifications", label: "แจ้งเตือน" },
    { id: "pos", icon: ShoppingCart, href: "/dashboard/pos", label: "จุดขาย" },
    { id: "inventory", icon: Pill, href: "/dashboard/inventory", label: "คลังสินค้า" },
    { id: "discounts", icon: Tag, href: "/dashboard/discounts", label: "ส่วนลด" },
    { id: "documents", icon: LayoutGrid, href: "/dashboard/documents", label: "เอกสาร" },
    { id: "users", icon: Users, href: "/dashboard/users", label: "ผู้ใช้งาน" },
    { id: "orders", icon: Receipt, href: "/dashboard/orders", label: "ใบเสร็จรับเงินวันนี้" },
    { id: "reports", icon: BarChart3, href: "/dashboard/reports", label: "รายงาน" },
    { id: "settings", icon: Settings, href: "/dashboard/settings", label: "ตั้งค่า" },
    { id: "admin/users", icon: Shield, href: "/dashboard/admin/users", label: "จัดการผู้ใช้" },
  ]

  // Get allowed menu items based on user role
  const allowedMenuItems = user?.role 
    ? getMenuItemsForRole(user.role as any)
    : []

  // Debug logging
  if (process.env.NODE_ENV === 'development') {
    logger.debug('Sidebar debug info', {
      user: user?.id,
      userRole: user?.role,
      allowedMenuItems,
      allMenuItemIds: allMenuItems.map(item => item.id)
    }, 'SIDEBAR')
  }

  const visibleMenuItems = allMenuItems.filter(item => 
    allowedMenuItems.includes(item.id)
  )

  if (process.env.NODE_ENV === 'development') {
    logger.debug('Visible menu items calculated', {
      visibleMenuItemIds: visibleMenuItems.map(item => item.id)
    }, 'SIDEBAR')
  }

  // Show loading state
  if (loading) {
    return (
      <div className="w-20 bg-white border-r flex flex-col items-center py-4">
        <div className="mb-8">
          <div className="w-12 h-12 rounded-full bg-gray-200 animate-pulse"></div>
        </div>
        <div className="flex flex-col items-center space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="w-12 h-12 bg-gray-200 rounded-lg animate-pulse"></div>
          ))}
        </div>
      </div>
    )
  }

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
        {visibleMenuItems.map((item) => (
          <Link
            key={item.id}
            href={item.href}
            onClick={() => setActiveItem(item.id)}
            className={cn(
              "w-12 h-12 flex items-center justify-center rounded-lg transition-colors group relative",
              activeItem === item.id
                ? "bg-purple-100 text-purple-600"
                : "text-gray-400 hover:text-gray-600 hover:bg-gray-100",
            )}
            title={item.label}
          >
            <item.icon size={24} />
            
            {/* Badge สำหรับจำนวนใบเสร็จรับเงินวันนี้ */}
            {item.id === "orders" && todayReceiptsCount > 0 && (
              <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 text-white text-xs rounded-full flex items-center justify-center font-medium">
                {todayReceiptsCount > 99 ? '99+' : todayReceiptsCount}
              </div>
            )}
            
            {/* Tooltip */}
            <div className="absolute left-full ml-2 px-2 py-1 text-xs bg-gray-800 text-white rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
              {item.label}
            </div>
          </Link>
        ))}
      </nav>
      <div className="mt-auto text-xs text-gray-400">
        {user?.role && (
          <div className="text-center">
            <div className="text-purple-600 font-medium">{user.role}</div>
            <div>1.1.109</div>
          </div>
        )}
      </div>
    </div>
  )
}
