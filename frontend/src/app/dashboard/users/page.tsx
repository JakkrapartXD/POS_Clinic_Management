'use client'

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import PageGuard from "@/components/guards/page-guard"
import { 
  Search, 
  Plus, 
  Eye, 
  Edit, 
  Phone, 
  Mail, 
  Calendar,
  User,
  Users,
  FileText,
  Heart
} from "lucide-react"

// Mock data for patients
const mockPatients = [
  {
    id: "P001",
    firstName: "สมใจ",
    lastName: "ใจดี", 
    dateOfBirth: "1985-05-15",
    gender: "ชาย",
    phone: "081-234-5678",
    email: "somjai@email.com",
    address: "123 หมู่ 1 ตำบลแสงทอง อำเภอเมือง จังหวัดเชียงใหม่",
    lastVisit: "2024-01-10",
    status: "active"
  },
  {
    id: "P002",
    firstName: "สมหญิง",
    lastName: "รักษ์ดี",
    dateOfBirth: "1990-08-22",
    gender: "หญิง", 
    phone: "089-876-5432",
    email: "somying@email.com",
    address: "456 หมู่ 2 ตำบลท่าศาลา อำเภอเมือง จังหวัดเชียงใหม่",
    lastVisit: "2024-01-12",
    status: "active"
  },
  {
    id: "P003",
    firstName: "วิทยา",
    lastName: "ศาสตร์",
    dateOfBirth: "1975-12-03",
    gender: "ชาย",
    phone: "092-345-6789", 
    email: null,
    address: "789 หมู่ 3 ตำบลสันทราย อำเภอสันทราย จังหวัดเชียงใหม่",
    lastVisit: "2024-01-08",
    status: "inactive"
  }
]

// Mock data for staff users
const mockStaff = [
  {
    id: "U001",
    username: "admin01",
    email: "admin@snclinic.com",
    role: "admin",
    status: "active",
    lastLogin: "2024-01-15"
  },
  {
    id: "U002", 
    username: "doctor01",
    email: "doctor@snclinic.com",
    role: "doctor",
    status: "active",
    lastLogin: "2024-01-15"
  },
  {
    id: "U003",
    username: "cashier01", 
    email: "cashier@snclinic.com",
    role: "cashier",
    status: "active",
    lastLogin: "2024-01-14"
  }
]

const getAgeFromBirthDate = (birthDate: string) => {
  const today = new Date()
  const birth = new Date(birthDate)
  let age = today.getFullYear() - birth.getFullYear()
  const monthDiff = today.getMonth() - birth.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--
  }
  return age
}

const statusColors = {
  active: "bg-green-100 text-green-800",
  inactive: "bg-gray-100 text-gray-800"
}

const statusLabels = {
  active: "ใช้งาน",
  inactive: "ไม่ใช้งาน"
}

const roleLabels = {
  admin: "ผู้ดูแลระบบ",
  doctor: "แพทย์",
  cashier: "แคชเชียร์",
  pharmacist: "เภสัชกร",
  staff: "พนักงาน"
}

export default function UsersPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [activeTab, setActiveTab] = useState("patients")

  const filteredPatients = mockPatients.filter(patient =>
    `${patient.firstName} ${patient.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.phone.includes(searchTerm)
  )

  const filteredStaff = mockStaff.filter(user =>
    user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <PageGuard requiredPermission="users">
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">ผู้ใช้งานและผู้ป่วย</h1>
          <p className="text-gray-600 mt-2">จัดการข้อมูลผู้ป่วยและพนักงานในระบบ</p>
        </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">ผู้ป่วยทั้งหมด</p>
                <p className="text-2xl font-bold">{mockPatients.length}</p>
              </div>
              <Heart className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">ผู้ป่วยใหม่วันนี้</p>
                <p className="text-2xl font-bold">3</p>
              </div>
              <User className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">พนักงานในระบบ</p>
                <p className="text-2xl font-bold">{mockStaff.length}</p>
              </div>
              <Users className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">นัดหมายวันนี้</p>
                <p className="text-2xl font-bold">12</p>
              </div>
              <Calendar className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="patients">ผู้ป่วย</TabsTrigger>
          <TabsTrigger value="staff">พนักงาน</TabsTrigger>
        </TabsList>

        <TabsContent value="patients" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <CardTitle>รายการผู้ป่วย</CardTitle>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  เพิ่มผู้ป่วยใหม่
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="ค้นหาด้วยชื่อ, รหัสผู้ป่วย หรือเบอร์โทร..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Patient Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredPatients.map((patient) => (
                  <Card key={patient.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <Avatar>
                            <AvatarImage src="" />
                            <AvatarFallback className="bg-blue-100 text-blue-600">
                              {patient.firstName.charAt(0)}{patient.lastName.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <h3 className="font-semibold">{patient.firstName} {patient.lastName}</h3>
                            <p className="text-sm text-gray-500">{patient.id}</p>
                          </div>
                        </div>
                        <Badge className={statusColors[patient.status as keyof typeof statusColors]}>
                          {statusLabels[patient.status as keyof typeof statusLabels]}
                        </Badge>
                      </div>

                      <div className="space-y-2 mb-4">
                        <div className="flex items-center text-sm text-gray-600">
                          <Calendar className="w-4 h-4 mr-2" />
                          {getAgeFromBirthDate(patient.dateOfBirth)} ปี ({patient.gender})
                        </div>
                        <div className="flex items-center text-sm text-gray-600">
                          <Phone className="w-4 h-4 mr-2" />
                          {patient.phone}
                        </div>
                        {patient.email && (
                          <div className="flex items-center text-sm text-gray-600">
                            <Mail className="w-4 h-4 mr-2" />
                            {patient.email}
                          </div>
                        )}
                      </div>

                      <div className="mb-4">
                        <p className="text-sm text-gray-600">ครั้งล่าสุด: {new Date(patient.lastVisit).toLocaleDateString('th-TH')}</p>
                      </div>

                      <div className="flex space-x-2">
                        <Button variant="outline" size="sm" className="flex-1">
                          <Eye className="w-4 h-4 mr-1" />
                          ดูประวัติ
                        </Button>
                        <Button variant="outline" size="sm" className="flex-1">
                          <Edit className="w-4 h-4 mr-1" />
                          แก้ไข
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="staff" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <CardTitle>พนักงานในระบบ</CardTitle>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  เพิ่มพนักงานใหม่
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="ค้นหาด้วยชื่อผู้ใช้หรืออีเมล..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Staff Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredStaff.map((user) => (
                  <Card key={user.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <Avatar>
                            <AvatarImage src="" />
                            <AvatarFallback className="bg-purple-100 text-purple-600">
                              {user.username.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <h3 className="font-semibold">{user.username}</h3>
                            <p className="text-sm text-gray-500">{user.id}</p>
                          </div>
                        </div>
                        <Badge className={statusColors[user.status as keyof typeof statusColors]}>
                          {statusLabels[user.status as keyof typeof statusLabels]}
                        </Badge>
                      </div>

                      <div className="space-y-2 mb-4">
                        <div className="flex items-center text-sm text-gray-600">
                          <Mail className="w-4 h-4 mr-2" />
                          {user.email}
                        </div>
                        <div className="flex items-center text-sm text-gray-600">
                          <User className="w-4 h-4 mr-2" />
                          {roleLabels[user.role as keyof typeof roleLabels]}
                        </div>
                      </div>

                      <div className="mb-4">
                        <p className="text-sm text-gray-600">
                          เข้าสู่ระบบล่าสุด: {new Date(user.lastLogin).toLocaleDateString('th-TH')}
                        </p>
                      </div>

                      <div className="flex space-x-2">
                        <Button variant="outline" size="sm" className="flex-1">
                          <Eye className="w-4 h-4 mr-1" />
                          ดูรายละเอียด
                        </Button>
                        <Button variant="outline" size="sm" className="flex-1">
                          <Edit className="w-4 h-4 mr-1" />
                          แก้ไข
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
    </PageGuard>
  )
} 