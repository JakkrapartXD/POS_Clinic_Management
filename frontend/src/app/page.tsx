'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { apiClient } from '@/clients/api'
import { API_CONFIG } from '@/config/api'
import { APP_CONSTANTS } from '@/constants'

interface TokenVerifyResponse {
  valid: boolean;
  user?: {
    id: string;
    name?: string;
    email?: string;
    role?: string;
  };
}

export default function Home() {
  const router = useRouter()

  useEffect(() => {
    const verifyToken = async () => {
      try {
        // Use API client with configured endpoints
        const response = await apiClient.get<TokenVerifyResponse>(API_CONFIG.ENDPOINTS.AUTH.VERIFY_TOKEN);
        
        if (response.valid) {
          router.replace(APP_CONSTANTS.ROUTES.DASHBOARD);
        } else {
          router.replace(APP_CONSTANTS.ROUTES.LOGIN);
        }
      } catch (err) {
        console.error('Token verification failed:', err);
        router.replace(APP_CONSTANTS.ROUTES.LOGIN);
      }
    }

    verifyToken()
  }, [router])

  return <div className="text-center mt-10 text-lg">กำลังตรวจสอบสิทธิ์...</div>
}
