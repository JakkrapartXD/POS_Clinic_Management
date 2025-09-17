'use client'

import { useState, useEffect, useCallback, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { 
  Search, 
  Plus, 
  Edit, 
  Trash2, 
  Users, 
  UserCheck, 
  UserX,
  Shield,
  Crown,
  Stethoscope,
  Calculator,
  Package
} from "lucide-react"
import PageGuard from "@/components/guards/page-guard"
import { GraphQLAPI } from "@/clients/graphql"
import { User } from "@/types/user"

// Interface for local user state
interface LocalUser {
  id: string;
  username: string;
  email: string;
  role: string;
  status: string;
  created_at: string;
  updated_at: string;
}

interface CreateUserFormData {
  username: string;
  email: string;
  password: string;
  role: string;
  status: string;
}

const statusColors = {
  active: "bg-green-100 text-green-800",
  inactive: "bg-gray-100 text-gray-800",
  suspended: "bg-red-100 text-red-800"
}

const statusLabels = {
  active: "ใช้งาน",
  inactive: "ไม่ใช้งาน",
  suspended: "ระงับการใช้งาน"
}

const roleLabels = {
  admin: "ผู้ดูแลระบบ",
  doctor: "แพทย์",
  cashier: "แคชเชียร์",
  pharmacist: "เภสัชกร",
  staff: "พนักงาน"
}

const roleIcons = {
  admin: Crown,
  doctor: Stethoscope,
  cashier: Calculator,
  pharmacist: Package,
  staff: Users
}

const roleColors = {
  admin: "text-yellow-600",
  doctor: "text-blue-600", 
  cashier: "text-green-600",
  pharmacist: "text-teal-600",
  staff: "text-gray-600"
}



export default function UserManagementPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [searchQuery, setSearchQuery] = useState("") // Actual search query for API
  const [users, setUsers] = useState<LocalUser[]>([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(0)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<LocalUser | null>(null)
  const [formData, setFormData] = useState<CreateUserFormData>({
    username: "",
    email: "",
    password: "",
    role: "",
    status: "active"
  })

  // Ref for search input
  const searchInputRef = useRef<HTMLInputElement>(null)

  // Load users from GraphQL API
  const loadUsers = useCallback(async (searchQ?: string, pageNum?: number) => {
    try {
      setLoading(true)
      const currentSearchQuery = searchQ !== undefined ? searchQ : searchQuery
      const currentPage = pageNum !== undefined ? pageNum : page
      
      const filter = currentSearchQuery.trim()
        ? { 
            username: currentSearchQuery.trim(),
            email: currentSearchQuery.trim()
          }
        : undefined

      const response = await GraphQLAPI.getAllUsers({
        filter,
        pagination: { skip: currentPage * 10, take: 10 }
      })
      
      if (response.users) {
        // Convert User[] to LocalUser[]
        const localUsers: LocalUser[] = response.users.users.map(user => ({
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
          status: user.status,
          created_at: user.created_at || new Date().toISOString(),
          updated_at: user.updated_at || new Date().toISOString()
        }))
        setUsers(localUsers)
        setTotal(response.users.total)
      }
    } catch (error) {
      console.error('Error loading users:', error)
    } finally {
      setLoading(false)
    }
  }, [searchQuery, page])

  // Load initial data and when page/search changes
  useEffect(() => {
    loadUsers()
  }, [page, searchQuery])

  // Debounce search input
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setSearchQuery(searchTerm)
      if (page !== 0) setPage(0) // Reset to first page on search
    }, 1000)
    
    return () => clearTimeout(timeoutId)
  }, [searchTerm])

  // Handle search on Enter key
  const handleSearchKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      setSearchQuery(searchTerm)
      if (page !== 0) setPage(0)
    }
  }

  // Manual search trigger
  const handleManualSearch = () => {
    setSearchQuery(searchTerm)
    if (page !== 0) setPage(0)
  }

  const handleCreateUser = async () => {
    try {
      setLoading(true)
      const response = await GraphQLAPI.createUser({
        username: formData.username,
        email: formData.email,
        password: formData.password,
        role: formData.role,
        status: formData.status
      })
      
      if (response.createUser) {
        setIsCreateModalOpen(false)
        resetForm()
        await loadUsers() // Reload users list
      }
    } catch (error) {
      console.error('Error creating user:', error)
      // You might want to show an error toast here
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateUser = async () => {
    if (!selectedUser) return
    
    try {
      setLoading(true)
      const updateData: any = {
        username: formData.username,
        email: formData.email,
        role: formData.role,
        status: formData.status
      }
      
      // Only include password if it was provided
      if (formData.password) {
        updateData.password = formData.password
      }
      
      const response = await GraphQLAPI.updateUser(selectedUser.id, updateData)
      
      if (response.updateUser) {
        setIsEditModalOpen(false)
        setSelectedUser(null)
        resetForm()
        await loadUsers() // Reload users list
      }
    } catch (error) {
      console.error('Error updating user:', error)
      // You might want to show an error toast here
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteUser = async (userId: string) => {
    try {
      setLoading(true)
      const response = await GraphQLAPI.deleteUser(userId)
      
      if (response.deleteUser) {
        await loadUsers() // Reload users list
      }
    } catch (error) {
      console.error('Error deleting user:', error)
      // You might want to show an error toast here
    } finally {
      setLoading(false)
    }
  }

  const openEditModal = (user: LocalUser) => {
    setSelectedUser(user)
    setFormData({
      username: user.username,
      email: user.email,
      password: "",
      role: user.role,
      status: user.status
    })
    setIsEditModalOpen(true)
  }

  const resetForm = () => {
    setFormData({
      username: "",
      email: "",
      password: "",
      role: "",
      status: "active"
    })
  }

  const totalUsers = users.length
  const activeUsers = users.filter((user: LocalUser) => user.status === 'active').length
  const adminUsers = users.filter((user: LocalUser) => user.role === 'admin').length

  return (
    <PageGuard requiredPermission="admin/users">
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <Shield className="h-8 w-8 text-teal-600" />
              จัดการผู้ใช้งาน
            </h1>
            <p className="text-gray-600 mt-2">จัดการบัญชีผู้ใช้และสิทธิ์การเข้าถึงระบบ</p>
          </div>
          
          <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
            <DialogTrigger asChild>
              <Button className="bg-teal-600 hover:bg-teal-700">
                <Plus className="w-4 h-4 mr-2" />
                เพิ่มผู้ใช้ใหม่
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md bg-white">
              <DialogHeader>
                <DialogTitle>เพิ่มผู้ใช้ใหม่</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="username">ชื่อผู้ใช้</Label>
                  <Input
                    id="username"
                    value={formData.username}
                    onChange={(e) => setFormData({...formData, username: e.target.value})}
                    placeholder="กรอกชื่อผู้ใช้"
                  />
                </div>
                <div>
                  <Label htmlFor="email">อีเมล</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    placeholder="กรอกอีเมล"
                  />
                </div>
                <div>
                  <Label htmlFor="password">รหัสผ่าน</Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    placeholder="กรอกรหัสผ่าน"
                  />
                </div>
                <div>
                  <Label htmlFor="role">บทบาท</Label>
                  <Select value={formData.role} onValueChange={(value) => setFormData({...formData, role: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="เลือกบทบาท" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">ผู้ดูแลระบบ</SelectItem>
                      <SelectItem value="doctor">แพทย์</SelectItem>
                      <SelectItem value="cashier">แคชเชียร์</SelectItem>
                      <SelectItem value="pharmacist">เภสัชกร</SelectItem>
                      <SelectItem value="staff">พนักงาน</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="status">สถานะ</Label>
                  <Select value={formData.status} onValueChange={(value) => setFormData({...formData, status: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">ใช้งาน</SelectItem>
                      <SelectItem value="inactive">ไม่ใช้งาน</SelectItem>
                      <SelectItem value="suspended">ระงับการใช้งาน</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex gap-3 pt-4">
                  <Button onClick={handleCreateUser} className="flex-1" disabled={loading}>
                    {loading ? 'กำลังสร้าง...' : 'สร้างผู้ใช้'}
                  </Button>
                  <Button variant="outline" onClick={() => setIsCreateModalOpen(false)} className="flex-1">
                    ยกเลิก
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="border-l-4 border-l-blue-500">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">ผู้ใช้ทั้งหมด</p>
                  <p className="text-2xl font-bold">{totalUsers}</p>
                </div>
                <Users className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-green-500">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">ผู้ใช้ที่ใช้งาน</p>
                  <p className="text-2xl font-bold">{activeUsers}</p>
                </div>
                <UserCheck className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-yellow-500">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">ผู้ดูแลระบบ</p>
                  <p className="text-2xl font-bold">{adminUsers}</p>
                </div>
                <Crown className="h-8 w-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-red-500">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">ไม่ใช้งาน</p>
                  <p className="text-2xl font-bold">{totalUsers - activeUsers}</p>
                </div>
                <UserX className="h-8 w-8 text-red-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* User Table */}
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <CardTitle>รายการผู้ใช้งาน</CardTitle>
                                        <div className="relative w-full sm:w-80">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                            <Input
                              ref={searchInputRef}
                              placeholder="ค้นหาผู้ใช้งาน... "
                              value={searchTerm}
                              onChange={(e) => setSearchTerm(e.target.value)}
                              onKeyPress={handleSearchKeyPress}
                              className="pl-10"
                              disabled={loading}
                            />
                            {searchTerm !== searchQuery && (
                              <button
                                onClick={handleManualSearch}
                                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-xs text-teal-600 hover:text-teal-800 bg-purple-50 px-2 py-1 rounded"
                                disabled={loading}
                              >
                                ค้นหา
                              </button>
                            )}
                          </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ผู้ใช้งาน</TableHead>
                    <TableHead>บทบาท</TableHead>
                    <TableHead>สถานะ</TableHead>
                    <TableHead>วันที่สร้าง</TableHead>
                    <TableHead>อัพเดตล่าสุด</TableHead>
                    <TableHead>การดำเนินการ</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    // Loading skeleton
                    [...Array(5)].map((_, i) => (
                      <TableRow key={i}>
                        <TableCell>
                          <div className="flex flex-col space-y-2">
                            <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                            <div className="h-3 bg-gray-200 rounded animate-pulse w-2/3"></div>
                          </div>
                        </TableCell>
                        <TableCell><div className="h-4 bg-gray-200 rounded animate-pulse w-20"></div></TableCell>
                        <TableCell><div className="h-6 bg-gray-200 rounded animate-pulse w-16"></div></TableCell>
                        <TableCell><div className="h-4 bg-gray-200 rounded animate-pulse w-24"></div></TableCell>
                        <TableCell><div className="h-4 bg-gray-200 rounded animate-pulse w-24"></div></TableCell>
                        <TableCell><div className="h-8 bg-gray-200 rounded animate-pulse w-20"></div></TableCell>
                      </TableRow>
                    ))
                                                ) : users.length === 0 ? (
                                <TableRow>
                                  <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                                    {searchQuery ? 'ไม่พบผู้ใช้งานที่ค้นหา' : 'ไม่พบผู้ใช้งาน'}
                                  </TableCell>
                                </TableRow>
                              ) : (
                                users.map((user) => {
                      const RoleIcon = roleIcons[user.role as keyof typeof roleIcons]
                      return (
                        <TableRow key={user.id}>
                        <TableCell>
                          <div className="flex flex-col">
                            <div className="font-medium">{user.username}</div>
                            <div className="text-sm text-gray-500">{user.email}</div>
                            <div className="text-xs text-gray-400">{user.id}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <RoleIcon className={`h-4 w-4 ${roleColors[user.role as keyof typeof roleColors]}`} />
                            <span className="font-medium">
                              {roleLabels[user.role as keyof typeof roleLabels]}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={statusColors[user.status as keyof typeof statusColors]}>
                            {statusLabels[user.status as keyof typeof statusLabels]}
                          </Badge>
                        </TableCell>
                        <TableCell>{new Date(user.created_at).toLocaleDateString('th-TH')}</TableCell>
                        <TableCell>
                          {new Date(user.updated_at).toLocaleDateString('th-TH')}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => openEditModal(user)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent className="bg-white">
                                <AlertDialogHeader>
                                  <AlertDialogTitle>ยืนยันการลบผู้ใช้งาน</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    คุณแน่ใจหรือไม่ที่จะลบผู้ใช้งาน <strong>{user.username}</strong>? 
                                    การกระทำนี้ไม่สามารถยกเลิกได้
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
                                  <AlertDialogAction 
                                    onClick={() => handleDeleteUser(user.id)}
                                    className="bg-red-600 hover:bg-red-700"
                                  >
                                    ลบผู้ใช้งาน
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                        </TableRow>
                      )
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Edit User Modal */}
        <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
          <DialogContent className="sm:max-w-md bg-white">
            <DialogHeader>
              <DialogTitle>แก้ไขผู้ใช้งาน</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-username">ชื่อผู้ใช้</Label>
                <Input
                  id="edit-username"
                  value={formData.username}
                  onChange={(e) => setFormData({...formData, username: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="edit-email">อีเมล</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="edit-password">รหัสผ่านใหม่ (เว้นว่างหากไม่ต้องการเปลี่ยน)</Label>
                <Input
                  id="edit-password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  placeholder="ใส่รหัสผ่านใหม่ (ถ้าต้องการเปลี่ยน)"
                />
              </div>
              <div>
                <Label htmlFor="edit-role">บทบาท</Label>
                <Select value={formData.role} onValueChange={(value) => setFormData({...formData, role: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">ผู้ดูแลระบบ</SelectItem>
                    <SelectItem value="doctor">แพทย์</SelectItem>
                    <SelectItem value="cashier">แคชเชียร์</SelectItem>
                    <SelectItem value="pharmacist">เภสัชกร</SelectItem>
                    <SelectItem value="staff">พนักงาน</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="edit-status">สถานะ</Label>
                <Select value={formData.status} onValueChange={(value) => setFormData({...formData, status: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">ใช้งาน</SelectItem>
                    <SelectItem value="inactive">ไม่ใช้งาน</SelectItem>
                    <SelectItem value="suspended">ระงับการใช้งาน</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-3 pt-4">
                <Button onClick={handleUpdateUser} className="flex-1" disabled={loading}>
                  {loading ? 'กำลังบันทึก...' : 'บันทึกการเปลี่ยนแปลง'}
                </Button>
                <Button variant="outline" onClick={() => setIsEditModalOpen(false)} className="flex-1">
                  ยกเลิก
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </PageGuard>
  )
}