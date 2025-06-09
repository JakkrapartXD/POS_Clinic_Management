'use client'
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useRouter } from "next/navigation"
import { log } from "node:console"

interface UserData {
  role: string
  email: string
  username: string
}

// GraphQL query function
async function fetchUserData(): Promise<UserData | null> {
  try {
    // Extract JWT token from cookie
    const getCookie = (name: string): string | null => {
      const value = `; ${document.cookie}`;
      const parts = value.split(`; ${name}=`);
      if (parts.length === 2) {
        return parts.pop()?.split(';').shift() || null;
      }
      return null;
    }

    const token = getCookie('next-auth.jwt-token');
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // Add Authorization header if token exists
    // console.log(token);
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch('http://localhost:4000/graphql', {
      method: 'POST',
      headers,
      // credentials: 'include', // Still include cookies for additional security
      body: JSON.stringify({
        query: `
          query Me {
            me {
              role
              email
              username
            }
          }
        `
      })
    })

    if (!response.ok) {
      throw new Error('Failed to fetch user data')
    }

    const result = await response.json()
    
    if (result.errors) {
      throw new Error(result.errors[0]?.message || 'GraphQL error')
    }

    return result.data?.me || null
  } catch (error) {
    console.error('Error fetching user data:', error)
    return null
  }
}

export default function ProfilePage() {
  const router = useRouter()
  const [userData, setUserData] = useState<UserData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch user data on component mount
  useEffect(() => {
    const loadUserData = async () => {
      try {
        setLoading(true)
        const data = await fetchUserData()
        if (data) {
          setUserData(data)
        } else {
          setError('Failed to load user data')
        }
      } catch (err) {
        setError('Error loading user data')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    loadUserData()
  }, [])

  // ฟังก์ชันสำหรับ logout
  const handleLogout = () => {
    // ลบ cookie authToken โดยตั้งค่าวันหมดอายุเป็นอดีต
    document.cookie = "next-auth.jwt-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC; samesite=strict"
    router.replace("/login")
  }

  if (loading) {
    return (
      <div className="p-6 max-w-5xl mx-auto bg-white relative">
        <div className="flex justify-center items-center h-64">
          <div className="text-gray-500">กำลังโหลดข้อมูล...</div>
        </div>
      </div>
    )
  }

  if (error || !userData) {
    return (
      <div className="p-6 max-w-5xl mx-auto bg-white relative">
        <div className="flex justify-center items-center h-64">
          <div className="text-red-500">{error || 'ไม่สามารถโหลดข้อมูลได้'}</div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-5xl mx-auto bg-white relative">
      {/* ปุ่ม Logout มุมขวาบน */}
      <button
        onClick={handleLogout}
        className="absolute top-6 right-6 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-xl shadow"
      >
        ออกจากระบบ
      </button>

      <header className="mb-8">
        <h1 className="text-2xl font-semibold text-center text-gray-700">เจ้าของร้าน — {userData.username}</h1>
      </header>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-1 flex flex-col items-center">
          <div className="w-32 h-32 bg-gray-100 rounded-full mb-4"></div>
          <h2 className="text-xl font-medium">{userData.username}</h2>
          <p className="text-gray-500">{userData.email}</p>
        </div>

        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl text-gray-700">ข้อมูลพิเศษ</CardTitle>
              <p className="text-sm text-gray-500">แสดงรายละเอียดพิเศษปัจจุบัน</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="text-gray-500">อีเมล:</div>
                <div className="col-span-2 text-gray-500">{userData.email}</div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-gray-500">บทบาท:</div>
                <div className="col-span-2 text-gray-500">{userData.role}</div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-gray-500">แพ็กเกจ:</div>
                <div className="col-span-2 flex items-center gap-2 text-gray-500">
                  Basic
                  <Button className="text-purple-500 p-0 h-auto bg-transparent hover:bg-transparent border-none shadow-none underline">
                    <span className="flex items-center">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="mr-1"
                      >
                        <path d="M20 7h-9"></path>
                        <path d="M14 17H5"></path>
                        <path d="M10 7 7 4l3-3"></path>
                        <path d="m10 17 3 3-3 3"></path>
                      </svg>
                      เปลี่ยนแพ็กเกจ
                    </span>
                  </Button>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-gray-500">รายละเอียด:</div>
                <div className="col-span-2 text-gray-500">แพ็กเกจ Basic - ฟรีตลอดชีพ ไม่มีค่าใช้จ่าย</div>
              </div>
            </CardContent>
          </Card>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="text-xl text-gray-700">ประวัติการชำระ</CardTitle>
              <p className="text-sm text-gray-500">แสดงประวัติการชำระของคุณทั้งหมด</p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 text-sm text-gray-500 pb-2 border-b">
                <div>สถานะ</div>
                <div>รายละเอียด</div>
                <div className="text-right">จำนวน</div>
              </div>
              <div className="py-8 text-center text-gray-500">ยังไม่พบประวัติการชำระ</div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
