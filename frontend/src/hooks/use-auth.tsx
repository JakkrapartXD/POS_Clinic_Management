import { useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { clearAuthCookies, handleAuthError } from '@/utils/auth'
import { GraphQLAPI } from '@/clients/graphql'
import { logger } from '@/lib/logger'

export const useAuth = () => {
  const router = useRouter()

  // Handle authentication errors and redirect to login
  const handleAuthErrorAndRedirect = useCallback((error: any) => {
    logger.error('Authentication error detected', error, 'AUTH')
    clearAuthCookies()
    router.replace('/login')
  }, [router])

  // Set up global authentication error handler for GraphQL
  useEffect(() => {
    // Set the auth error handler for GraphQL client
    GraphQLAPI.setAuthErrorHandler(handleAuthErrorAndRedirect)
    
    return () => {
      // Clean up when component unmounts
      GraphQLAPI.setAuthErrorHandler(() => {})
    }
  }, [handleAuthErrorAndRedirect])

  // Force logout function
  const logout = useCallback(async () => {
    try {
      // Call backend logout endpoint to clear HttpOnly cookies
      await fetch('http://localhost:4000/auth/sign-out', {
        method: 'GET',
        credentials: 'include',
      })
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      // Clear all auth data and redirect regardless of logout success
      clearAuthCookies()
      router.replace('/login')
    }
  }, [router])

  return {
    logout,
    handleAuthError: handleAuthErrorAndRedirect
  }
}
