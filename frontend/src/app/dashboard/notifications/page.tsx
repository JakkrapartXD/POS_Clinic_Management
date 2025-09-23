"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Bell, Package, Calendar } from "lucide-react"
import EmptyState from "@/components/ui/empty-state"
import { GraphQLAPI } from "@/clients/graphql"
import { useUser } from "@/hooks/use-user"

// Color mapping for stock alerts
const getColorClasses = (color: string) => {
  switch (color) {
    case "yellow":
      return "bg-yellow-100 text-yellow-800 border-yellow-200"
    case "orange":
      return "bg-orange-100 text-orange-800 border-orange-200"
    case "red":
      return "bg-red-100 text-red-800 border-red-200"
    case "black":
      return "bg-gray-800 text-white border-gray-800"
    default:
      return "bg-gray-100 text-gray-800 border-gray-200"
  }
}

// Format date for display
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('th-TH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}


export default function NotificationsPage() {
  const router = useRouter()
  const { user } = useUser()
  const [stockAlerts, setStockAlerts] = useState<any[]>([])
  const [appointments, setAppointments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  
  // Get today's date in Thai format
  const today = new Date()
  const todayString = today.toLocaleDateString('th-TH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long'
  })

  // Check permissions for different notification types
  const canViewStockAlerts = user?.role && ['admin', 'doctor', 'cashier'].includes(user.role)
  const canViewAppointments = user?.role && ['admin', 'doctor', 'nurse', 'staff'].includes(user.role)

  // Fetch data function
  const fetchData = async () => {
    try {
      setLoading(true)
      
      // Fetch stock alerts for all users (but control access via click)
      const stockData = await GraphQLAPI.getStockExpiryAlerts({
        skip: 0,
        take: 100
      })
      setStockAlerts(stockData.stockExpiryAlerts?.items || [])
      
      // Fetch appointments for all users (but control access via click)
      const appointmentData = await GraphQLAPI.getTodaysAppointments({
        date: today.toISOString(),
        skip: 0,
        take: 100
      })
      // Filter appointments to show only scheduled (not visited yet)
      const scheduledAppointments = (appointmentData.todaysAppointments?.items || [])
        .filter((appointment: any) => appointment.status === "scheduled")
      setAppointments(scheduledAppointments)
    } catch (error) {
      console.error('Error fetching notifications data:', error)
      setStockAlerts([])
      setAppointments([])
    } finally {
      setLoading(false)
    }
  }

  // Fetch data on component mount and when user role changes
  useEffect(() => {
    if (user?.role) {
      fetchData()
    }
  }, [user?.role])

  // Navigation functions
  const handleStockAlertClick = (productId: string) => {
    if (!canViewStockAlerts) {
      return // Just do nothing if no permission
    }
    router.push(`/dashboard/inventory?productId=${productId}&tab=stock`)
  }

  const handleAppointmentClick = (patientId: string) => {
    if (!canViewAppointments) {
      return // Just do nothing if no permission
    }
    router.push(`/dashboard/patients/${patientId}`)
  }


  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="h-10 bg-gray-200 rounded mb-6"></div>
          <div className="space-y-4">
            <div className="h-32 bg-gray-200 rounded"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-500">รายการแจ้งเตือน</h1>
          <p className="text-sm text-gray-400 mt-1">{todayString}</p>
        </div>
        <Button 
          variant="outline" 
          className="text-teal-500 bg-white hover:bg-purple-50"
          onClick={fetchData}
        >
          รีเฟรช
        </Button>
      </div>

      {/* Combined Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-blue-500" />
            แจ้งเตือนวันนี้ ({stockAlerts.length + appointments.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {stockAlerts.length === 0 && appointments.length === 0 ? (
            <EmptyState 
              icon={Bell} 
              title="ไม่มีแจ้งเตือนวันนี้" 
              description="ไม่มีสินค้าใกล้หมดอายุหรือนัดหมายที่ยังไม่ได้มาในวันนี้"
            />
          ) : (
            <div className="space-y-3">
              {/* Stock Alerts - Show for all users but only clickable for authorized users */}
              {stockAlerts.map((item: any) => (
                <div 
                  key={`stock-${item.stock_id}`} 
                  className={`border rounded-lg p-4 transition-colors ${getColorClasses(item.color)} ${
                    canViewStockAlerts 
                      ? 'hover:bg-gray-50 cursor-pointer' 
                      : 'cursor-not-allowed opacity-75'
                  }`}
                  onClick={() => handleStockAlertClick(item.product_id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Package className="h-4 w-4 text-orange-500" />
                        <h3 className="font-medium text-gray-900">{item.product_name}</h3>
                        <Badge className={getColorClasses(item.color)}>
                          {item.color === "yellow" && "เตือน"}
                          {item.color === "orange" && "ใกล้หมดอายุ"}
                          {item.color === "red" && "หมดอายุเร็ว"}
                          {item.color === "black" && "หมดอายุแล้ว"}
                        </Badge>
                      </div>
                      <div className="text-sm text-gray-600 space-y-1">
                        <p>SKU: {item.sku || "ไม่ระบุ"} | จำนวน: {item.quantity} {item.unit || "ชิ้น"}</p>
                        <p>หมดอายุ: {formatDate(item.expiration_date)} ({item.days_left} วัน)</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-gray-700">
                        เหลือ {item.days_left} วัน
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {canViewStockAlerts ? 'คลิกเพื่อดูรายละเอียด' : 'ไม่มีสิทธิ์เข้าถึง'}
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {/* Appointments - Show for all users but only clickable for authorized users */}
              {appointments.map((appointment: any) => (
                <div 
                  key={`appointment-${appointment.appointment_id}`} 
                  className={`border rounded-lg p-4 transition-colors ${
                    canViewAppointments 
                      ? 'hover:bg-gray-50 cursor-pointer' 
                      : 'cursor-not-allowed opacity-75'
                  }`}
                  onClick={() => handleAppointmentClick(appointment.patient_id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Calendar className="h-4 w-4 text-blue-500" />
                        <h3 className="font-medium text-gray-900">{appointment.patient_fullname}</h3>
                        <Badge variant="default" className="bg-blue-100 text-blue-800">
                          นัดแล้ว
                        </Badge>
                      </div>
                      <div className="text-sm text-gray-600 space-y-1">
                        <p>แพทย์: {appointment.doctor_name || "ไม่ระบุ"}</p>
                        {appointment.reason && <p>เหตุผล: {appointment.reason}</p>}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-gray-700">
                        {formatDate(appointment.time)}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {canViewAppointments ? 'คลิกเพื่อดูรายละเอียด' : 'ไม่มีสิทธิ์เข้าถึง'}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
