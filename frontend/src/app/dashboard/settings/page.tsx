"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { ChevronRight, Store, Tag, Receipt, Calculator, Monitor, Database, Bell } from "lucide-react"
import Link from "next/link"

export default function SettingsPage() {
  const settingsGroups = [
    {
      title: "การตั้งค่าร้านค้า",
      items: [
        {
          id: "store-closure",
          icon: Store,
          title: "ร้านค้าปิดจุน",
          subtitle: "โปรโมชั่นส่วนลด",
          description: "แก้ไขข้อมูลร้านค้า การเปิด-ปิด และข้อมูล",
          href: "/settings/store",
          hasSwitch: false,
        },
        {
          id: "promotions",
          icon: Tag,
          title: "โปรโมชั่นส่วนลด",
          subtitle: "ใบเสร็จรับเงินหลังจ่าย",
          description: "ข้อมูลส่วนลดพิเศษ ข้อเสนอพิเศษ และระบบ",
          href: "/discounts",
          hasSwitch: false,
        },
      ],
    },
    {
      title: "การตั้งค่าระบบ",
      items: [
        {
          id: "receipt-settings",
          icon: Receipt,
          title: "ใบเสร็จรับเงินหลังจ่าย",
          subtitle: "การคำนวณมูลค่าสินค้า",
          description: "ข้อมูลส่วนลดพิเศษ ข้อเสนอพิเศษ และระบบ",
          href: "/settings/receipt",
          hasSwitch: false,
        },
        {
          id: "calculation",
          icon: Calculator,
          title: "การคำนวณมูลค่าสินค้า",
          subtitle: "ระบบหน้าร้าน POS",
          description: "ภาษีมูลค่าเพิ่ม VAT(%), สำนักงานภาษีอื่น",
          href: "/settings/calculation",
          hasSwitch: false,
        },
        {
          id: "pos-system",
          icon: Monitor,
          title: "ระบบหน้าร้าน POS",
          subtitle: "การเก็บข้อมูล",
          description: "แสดงรายการสินค้า การขายและข้อมูลสินค้า",
          href: "/settings/pos",
          hasSwitch: false,
        },
      ],
    },
    {
      title: "การจัดการข้อมูล",
      items: [
        {
          id: "data-collection",
          icon: Database,
          title: "การเก็บข้อมูล",
          subtitle: "การแจ้งเตือนล่วงหน้าสินค้า",
          description: "ตั้งค่าการเก็บข้อมูลและการสำรองข้อมูล",
          href: "/settings/data",
          hasSwitch: false,
        },
        {
          id: "notifications",
          icon: Bell,
          title: "การแจ้งเตือนล่วงหน้าสินค้า",
          subtitle: "",
          description: "ตั้งค่าให้ระบบแจ้งเตือน และแจ้งให้ทราบล่วงหน้า",
          href: "/settings/notifications",
          hasSwitch: false,
        },
      ],
    },
  ]

  return (
    <div className="p-6">
      <h1 className="text-xl font-semibold mb-6">ตั้งค่า</h1>

      <div className="space-y-6">
        {settingsGroups.map((group, groupIndex) => (
          <div key={groupIndex}>
            <h2 className="text-lg font-medium text-gray-700 mb-4">{group.title}</h2>
            <div className="space-y-2">
              {group.items.map((item) => (
                <Link key={item.id} href={item.href}>
                  <Card className="bg-white shadow-sm hover:shadow-md transition-shadow cursor-pointer">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-start space-x-4">
                          <div className="p-2 bg-purple-100 rounded-lg">
                            <item.icon className="h-5 w-5 text-purple-600" />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-medium text-gray-900">{item.title}</h3>
                            {item.subtitle && <p className="text-sm text-purple-600 mt-1">{item.subtitle}</p>}
                            <p className="text-sm text-gray-500 mt-1">{item.description}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {item.hasSwitch && <Switch />}
                          <ChevronRight className="h-5 w-5 text-gray-400" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
