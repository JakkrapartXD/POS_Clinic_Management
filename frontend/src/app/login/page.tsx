'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    try {
      const res = await fetch('http://localhost:4000/auth/sign-in', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      })

      if (!res.ok) {
        throw new Error('ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง')
      }

      const data = await res.json()

      // สมมติว่า API ส่ง token กลับมาใน data.accessToken หรือ data.token
      const token = data.accessToken || data.token
      if (!token) throw new Error('ไม่พบโทเคนจากเซิร์ฟเวอร์')

      // เก็บ token ลง cookie แทน localStorage
      document.cookie = `next-auth.jwt-token=${token}; path=/; secure; samesite=strict`

      // redirect ไปหน้า dashboard
      router.push('/dashboard')
    } catch (err: any) {
      setError(err.message || 'เกิดข้อผิดพลาด')
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-500">
      <form
        onSubmit={handleLogin}
        className="bg-black p-6 rounded-2xl shadow-md w-full max-w-sm"
      >
        <h2 className="text-2xl font-bold mb-4 text-center">เข้าสู่ระบบ</h2>

        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

        <input
          type="text"
          placeholder="ชื่อผู้ใช้"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="w-full p-2 border rounded-xl mb-4"
          required
        />

        <input
          type="password"
          placeholder="รหัสผ่าน"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full p-2 border rounded-xl mb-4"
          required
        />

        <button
          type="submit"
          className="w-full bg-blue-500 text-white py-2 rounded-xl hover:bg-blue-600"
        >
          เข้าสู่ระบบ
        </button>
      </form>
    </div>
  )
}
