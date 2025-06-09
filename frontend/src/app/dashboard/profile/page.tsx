'use client'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useRouter } from "next/navigation"

export default function ProfilePage() {
  const router = useRouter()

  // ฟังก์ชันสำหรับ logout
  const handleLogout = () => {
    // ลบ cookie authToken โดยตั้งค่าวันหมดอายุเป็นอดีต
    document.cookie = "next-auth.jwt-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC; samesite=strict"
    router.replace("/login")
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
        <h1 className="text-2xl font-semibold text-center text-gray-700">เจ้าของร้าน — SN clinic </h1>
      </header>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-1 flex flex-col items-center">
          <div className="w-32 h-32 bg-gray-100 rounded-full mb-4"></div>
          <h2 className="text-xl font-medium">SN clinic</h2>
          <p className="text-gray-500">test@gmail.com</p>
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
                <div className="col-span-2 text-gray-500">jakkrapart.x78@gmail.com</div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-gray-500">แพ็กเกจ:</div>
                <div className="col-span-2 flex items-center gap-2 text-gray-500">
                  Basic
                  <Button variant="link" className="text-purple-500 p-0 h-auto">
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
