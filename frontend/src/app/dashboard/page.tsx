'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function DashboardPage() {
  const router = useRouter()

  const handleLogout = async () => {
    try {
      const res = await fetch('http://localhost:4000/auth/sign-out', {
        method: 'GET',
        credentials: 'include', // ถ้าใช้ cookie ก็เปิดไว้
      })

      if (!res.ok) {
        throw new Error('ออกจากระบบไม่สำเร็จ')
      }

      // เคลียร์ token ที่เก็บไว้ (เช่น JWT ใน cookie)
      document.cookie = 'authToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;'

      router.push('/login')
    } catch (err) {
      console.error(err)
      alert('เกิดข้อผิดพลาดในการออกจากระบบ')
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-500">
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <button
          onClick={handleLogout}
          className="bg-red-500 text-white px-4 py-2 rounded-xl hover:bg-red-600"
        >
          ออกจากระบบ
        </button>
      </div>
    </div>
  )
}
