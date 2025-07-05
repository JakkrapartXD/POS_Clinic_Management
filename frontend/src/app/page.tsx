'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { apiClient } from '@/clients/api'
import { API_CONFIG } from '@/config/api'
import { log } from 'console'

export default function Home() {
  const router = useRouter()

  useEffect(() => {
    const verifyToken = async () => {
      try {
        const res = await apiClient.get<{ valid: boolean }>(API_CONFIG.ENDPOINTS.AUTH.VERIFY_TOKEN)
        console.log(res);
        if (res.valid) {
          router.replace('/dashboard')
        } else {
          router.replace('/login')
        }
      } catch (err) {
        console.error('Token verification failed:', err)
      }
    }

    verifyToken()
  }, [router])

  return <div className="text-center mt-10 text-lg">กำลังตรวจสอบสิทธิ์...</div>
}
