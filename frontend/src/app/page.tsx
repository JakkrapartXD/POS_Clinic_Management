'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function Home() {
  const router = useRouter()

  useEffect(() => {
    const verifyToken = async () => {
      try {
        const res = await fetch('http://localhost:4000/auth/token-verify', {
          method: 'GET',
          credentials: 'include', 
        })

        if (res.ok) {
          router.replace('/dashboard')
        } else {
          router.replace('/login')
        }
      } catch (err) {
        console.error('Token verification failed:', err)
        router.replace('/login')
      }
    }

    verifyToken()
  }, [router])

  return <div className="text-center mt-10 text-lg">กำลังตรวจสอบสิทธิ์...</div>
}
