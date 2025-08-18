'use client'

import { useEffect, useCallback, createContext, useContext, ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { clearAuthCookies } from '@/utils/auth'
import { graphqlClient } from '@/clients/graphql'
import { logger } from '@/lib/logger'

interface AuthContextType {
  logout: () => Promise<void>
  handleAuthError: (error: any) => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter()

  // Handle authentication errors and redirect to login
  const handleAuthError = useCallback((error: any) => {
    logger.error('Authentication error detected in AuthProvider', error, 'AUTH')
    clearAuthCookies()
    router.replace('/login')
  }, [router])

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

  // Set up global authentication error handler for GraphQL
  useEffect(() => {
    // Set the auth error handler for GraphQL client
    graphqlClient.setAuthErrorHandler(handleAuthError)
    
    return () => {
      // Clean up when component unmounts
      graphqlClient.setAuthErrorHandler(() => {})
    }
  }, [handleAuthError])

  const value = {
    logout,
    handleAuthError
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
