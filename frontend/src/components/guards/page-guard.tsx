'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useUser } from '@/hooks/use-user'
import { hasPermission } from '@/config/role-permissions'
import { Card, CardContent } from '@/components/ui/card'
import { AlertTriangle, Lock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { logger } from '@/lib/logger'

interface PageGuardProps {
  children: React.ReactNode
  requiredPermission: string
}

export default function PageGuard({ children, requiredPermission }: PageGuardProps) {
  const { user, loading, error } = useUser()
  const router = useRouter()
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null)

  useEffect(() => {
    if (loading) {
      setIsAuthorized(null)
      return
    }

    if (error || !user) {
      // User not found or error - redirect to login
      router.replace('/login')
      return
    }

    // Check if user has permission to access this page
    const hasAccess = hasPermission(user.role as any, requiredPermission)
    
    // Only log permission check in development mode to reduce noise
    if (process.env.NODE_ENV === 'development') {
      logger.auth.permissionCheck(requiredPermission, user.role, hasAccess)
    }
    
    if (!hasAccess) {
      setIsAuthorized(false)
      return
    }

    setIsAuthorized(true)
  }, [user, loading, error, requiredPermission, router])

  // Loading state
  if (loading || isAuthorized === null) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <Card>
          <CardContent className="p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto mb-4"></div>
            <p className="text-gray-600">กำลังตรวจสอบสิทธิ์การเข้าถึง...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Unauthorized access
  if (isAuthorized === false) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <Card className="border-red-200">
          <CardContent className="p-8 text-center">
            <div className="mb-4">
              <Lock className="h-16 w-16 text-red-500 mx-auto mb-4" />
              <AlertTriangle className="h-8 w-8 text-yellow-500 mx-auto" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">ไม่มีสิทธิ์เข้าถึง</h2>
            <p className="text-gray-600 mb-4">
              คุณไม่มีสิทธิ์ในการเข้าถึงหน้านี้ด้วยบทบาท <span className="font-semibold">{user?.role}</span>
            </p>
            <p className="text-sm text-gray-500 mb-6">
              ต้องการสิทธิ์: <span className="font-mono bg-gray-100 px-2 py-1 rounded">{requiredPermission}</span>
            </p>
            <div className="space-x-3">
              <Button variant="outline" onClick={() => router.back()}>
                ย้อนกลับ
              </Button>
              <Button onClick={() => router.push('/dashboard/notifications')}>
                ไปหน้าแจ้งเตือน
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Authorized access
  return <>{children}</>
}