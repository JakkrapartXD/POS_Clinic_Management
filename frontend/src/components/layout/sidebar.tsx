"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { Bell, ShoppingCart, Pill, LayoutGrid, Package, BarChart3, Settings, Users, FileText, Shield, Receipt, ChevronDown, ChevronRight, LogOut, LucideIcon, UserCheck } from "lucide-react"

interface MenuItem {
  id: string
  icon: LucideIcon
  href: string
  label: string
  submenu?: Array<{
    id: string
    href: string
    label: string
    icon?: LucideIcon
  }>
}
import { useUser } from "@/hooks/use-user"
import { getMenuItemsForRole } from "@/config/role-permissions"
import { logger } from "@/lib/logger"
import { GraphQLAPI } from "@/clients/graphql"
import { useRouter } from "next/navigation"
import { performLogout } from "@/utils/auth"

export default function Sidebar() {
  const [activeItem, setActiveItem] = useState<string>("pos")
  const [todayReceiptsCount, setTodayReceiptsCount] = useState<number>(0)
  const [expandedItems, setExpandedItems] = useState<string[]>([])
  const [showLogoutDialog, setShowLogoutDialog] = useState<boolean>(false)
  const { user, loading } = useUser()
  const router = useRouter()

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

  // ฟังก์ชันออกจากระบบ
  const handleLogout = async () => {
    try {
      console.log('🚪 Starting logout process...');
      
      // ใช้ฟังก์ชัน performLogout ที่รวมการเรียก API และ cleanup
      const result = await performLogout();
      
      if (result.success) {
        logger.info('User logged out successfully', 'AUTH');
        console.log('✅ Logout process completed:', result.message);
      } else {
        logger.warn('Logout completed with warnings', 'AUTH');
        console.warn('⚠️ Logout completed with warnings:', result.message);
      }
      
    } catch (error) {
      logger.error('Error during logout:', error, 'AUTH');
      console.error('❌ Logout error:', error);
    } finally {
      // ไปยังหน้า login
      router.push('/login');
      
      // ปิด dialog
      setShowLogoutDialog(false);
    }
  }

  const allMenuItems: MenuItem[] = [
    { id: "notifications", icon: Bell, href: "/dashboard/notifications", label: "แจ้งเตือน" },
    { id: "pos", icon: ShoppingCart, href: "/dashboard/pos", label: "จุดขาย" },
    { id: "inventory", icon: Pill, href: "/dashboard/inventory", label: "คลังสินค้า" },
    { id: "patients", icon: UserCheck, href: "/dashboard/patients", label: "ผู้ป่วย" },
    { id: "documents", icon: LayoutGrid, href: "/dashboard/documents", label: "เอกสาร" },
    { id: "users", icon: Users, href: "/dashboard/users", label: "ผู้ใช้งาน" },
    { id: "orders", icon: Receipt, href: "/dashboard/orders", label: "ใบเสร็จรับเงินวันนี้" },
    { 
      id: "reports", 
      icon: BarChart3, 
      href: "/dashboard/reports", 
      label: "รายงานการขาย"
    },
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
    <>
      {/* Logout Dialog */}
      {showLogoutDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">ออกจากระบบ</h3>
            <p className="text-gray-600 mb-6">คุณต้องการออกจากระบบใช่หรือไม่</p>
            <div className="flex flex-col space-y-3">
              <button
                onClick={handleLogout}
                className="w-full bg-yellow-500 hover:bg-yellow-600 text-white font-medium py-2 px-4 rounded-lg transition-colors"
              >
                ออกจากระบบ
              </button>
              <button
                onClick={() => setShowLogoutDialog(false)}
                className="w-full text-gray-600 hover:text-gray-800 font-medium py-2 px-4 rounded-lg transition-colors"
              >
                ปิด
              </button>
            </div>
          </div>
        </div>
      )}
      
      <div className="w-20 bg-white border-r flex flex-col items-center py-4">
        <div className="mb-8">
          <button
            onClick={() => setShowLogoutDialog(true)}
            className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center relative hover:bg-purple-200 transition-colors"
          >
            <div className="w-10 h-10 rounded-full bg-purple-500 flex items-center justify-center">
              <LogOut className="text-white" size={20} />
            </div>
            <div className="absolute -right-1 -bottom-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
          </button>
        </div>
        <nav className="flex flex-col items-center space-y-4 flex-1">
          {visibleMenuItems.map((item) => (
            <div key={item.id} className="relative group">
              <Link
                href={item.href}
                onClick={() => setActiveItem(item.id)}
                className={cn(
                  "w-12 h-12 flex items-center justify-center rounded-lg transition-colors relative",
                  activeItem === item.id || (item.submenu && item.submenu.some((sub: any) => activeItem === sub.id))
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
              </Link>
              
              {/* Submenu for items with submenu */}
              {item.submenu && (
                <div className="absolute left-full top-0 ml-2 bg-white border rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity z-50 min-w-[180px]">
                  <div className="p-2">
                    <div className="text-xs font-medium text-gray-500 px-2 py-1 border-b">
                      {item.label}
                    </div>
                    {item.submenu.map((subItem) => (
                      <Link
                        key={subItem.id}
                        href={subItem.href}
                        onClick={() => setActiveItem(subItem.id)}
                        className={cn(
                          "flex items-center px-2 py-2 text-sm rounded-md transition-colors",
                          activeItem === subItem.id
                            ? "bg-purple-100 text-purple-600"
                            : "text-gray-700 hover:bg-gray-100"
                        )}
                      >
                        {subItem.icon && <subItem.icon size={16} className="mr-2" />}
                        {subItem.label}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Tooltip for items without submenu */}
              {!item.submenu && (
                <div className="absolute left-full ml-2 px-2 py-1 text-xs bg-gray-800 text-white rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
                  {item.label}
                </div>
              )}
            </div>
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
    </>
  )
}
