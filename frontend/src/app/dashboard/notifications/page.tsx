"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Bell, Search } from "lucide-react"
import EmptyState from "@/components/ui/empty-state"

export default function NotificationsPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [notifications] = useState<any[]>([]) // Empty for now

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-xl font-semibold text-gray-500">รายการแจ้งเตือน</h1>
        <Button variant="outline" className="text-purple-500 bg-white hover:bg-purple-50">
          ตั้งค่าแจ้งเตือน
        </Button>
      </div>

      <div className="relative mb-6">
        <Input
          placeholder="ค้นหารายการแจ้งเตือน..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 bg-white text-gray-700"
        />
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
      </div>

      {notifications.length === 0 ? (
        <EmptyState icon={Bell} title="ยังไม่พบรายการแจ้งเตือน" description="เมื่อมีการแจ้งเตือนจากระบบ จะแสดงรายการที่นี่" />
      ) : (
        <div className="space-y-4">
          {notifications.map((notification) => (
            <Card key={notification.id} className="bg-white shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-medium">{notification.title}</h3>
                    <p className="text-gray-500 text-sm mt-1">{notification.message}</p>
                    <p className="text-xs text-gray-400 mt-2">{notification.timestamp}</p>
                  </div>
                  <div className={`w-3 h-3 rounded-full ${notification.read ? "bg-gray-300" : "bg-purple-500"}`}></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
