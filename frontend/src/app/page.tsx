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
        // Use fetch with credentials to check HttpOnly cookies
        const response = await fetch('http://localhost:4000/auth/token-verify', {
          method: 'GET',
          credentials: 'include',
        });
        
        if (response.ok) {
          const res = await response.json();
          if (res.valid) {
            router.replace('/dashboard');
          } else {
            router.replace('/login');
          }
        } else {
          router.replace('/login');
        }
      } catch (err) {
        console.error('Token verification failed:', err);
        router.replace('/login');
      }
    }

    verifyToken()
  }, [router])

  return <div className="text-center mt-10 text-lg">กำลังตรวจสอบสิทธิ์...</div>
}
