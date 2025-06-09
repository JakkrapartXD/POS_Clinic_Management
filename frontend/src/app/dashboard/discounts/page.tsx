"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Plus, Search, Tag, Package } from "lucide-react"
import EmptyState from "@/components/ui/empty-state"

export default function DiscountsPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [discounts] = useState<any[]>([]) // Empty for now
  const [promotions] = useState<any[]>([]) // Empty for now

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-xl font-semibold">เรียงลำดับ</h1>
        <Button className="bg-purple-500 hover:bg-purple-600">
          <Plus className="h-4 w-4 mr-2" />
          เพิ่มส่วนลดใหม่
        </Button>
      </div>

      <div className="relative mb-6">
        <Input
          placeholder="ค้นหาโปรโมชั่น..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 bg-white text-gray-700"
        />
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
      </div>

      <Tabs defaultValue="promotions" className="w-full">
        <TabsList className="grid w-full grid-cols-2 text-gray-700">
          <TabsTrigger value="promotions">โปรโมชั่น</TabsTrigger>
          <TabsTrigger value="discounts">ส่วนลด</TabsTrigger>
        </TabsList>

        <TabsContent value="promotions" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <Card className="bg-white shadow-sm hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <Tag className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-medium text-blue-600">โปรฯ ส่วนลด</h3>
                    <p className="text-sm text-gray-500">Discount</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white shadow-sm hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-green-100 rounded-lg">
                    <Package className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-medium text-green-600">รับส่วนลดเมื่อซื้อครบจำนวน</h3>
                    <p className="text-sm text-gray-500">Bundle</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {promotions.length === 0 ? (
            <EmptyState
              icon={Tag}
              title="ยังไม่พบรายการโปรโมชั่น"
              description="เริ่มต้นสร้างโปรโมชั่นแรกของคุณ"
              actionLabel="สร้างโปรโมชั่น"
              onAction={() => console.log("Create promotion")}
            />
          ) : (
            <div className="space-y-4">
              {promotions.map((promotion) => (
                <Card key={promotion.id} className="bg-white shadow-sm">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium">{promotion.name}</h3>
                        <p className="text-sm text-gray-500">{promotion.description}</p>
                        <div className="flex items-center space-x-4 mt-2">
                          <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                            {promotion.status}
                          </span>
                          <span className="text-xs text-gray-500">
                            {promotion.startDate} - {promotion.endDate}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-purple-600">{promotion.discount}</p>
                        <p className="text-xs text-gray-500">{promotion.type}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="discounts" className="mt-6">
          {discounts.length === 0 ? (
            <EmptyState
              icon={Tag}
              title="ยังไม่พบรายการส่วนลด"
              description="เริ่มต้นสร้างส่วนลดแรกของคุณ"
              actionLabel="สร้างส่วนลด"
              onAction={() => console.log("Create discount")}
            />
          ) : (
            <div className="space-y-4">
              {discounts.map((discount) => (
                <Card key={discount.id} className="bg-white shadow-sm">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium">{discount.name}</h3>
                        <p className="text-sm text-gray-500">{discount.description}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-purple-600">{discount.amount}</p>
                        <p className="text-xs text-gray-500">{discount.type}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
