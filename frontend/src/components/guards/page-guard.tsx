"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useUser } from "@/hooks/use-user"
import { hasPermission } from "@/config/role-permissions"

interface PageGuardProps {
  children: React.ReactNode
  requiredPermission: string
  fallbackPath?: string
}

export default function PageGuard({ 
  children, 
  requiredPermission, 
  fallbackPath = "/dashboard/notifications" 
}: PageGuardProps) {
  const { user, loading } = useUser()
  const router = useRouter()

  useEffect(() => {
    if (!loading && user) {
      const hasAccess = hasPermission(user.role as any, requiredPermission)
      if (!hasAccess) {
        router.replace(fallbackPath)
      }
    }
  }, [user, loading, requiredPermission, fallbackPath, router])

  // Show loading while checking permissions
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  // Don't render if user doesn't have permission
  if (!user || !hasPermission(user.role as any, requiredPermission)) {
    return null
  }

  return <>{children}</>
}