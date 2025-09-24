'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { GraphQLAPI } from '@/clients/graphql'
import { User } from '@/types/user'
import { logger } from '@/lib/logger'

interface UserContextType {
  user: User | null
  loading: boolean
  error: string | null
  refreshUser: () => Promise<void>
  clearUser: () => void
}

const UserContext = createContext<UserContextType | undefined>(undefined)

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isHydrated, setIsHydrated] = useState(false)

  const loadUser = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Debug: Clear console for fresh debug session
      if (process.env.NODE_ENV === 'development') {
        console.clear()
        logger.debug('Loading user data', {}, 'USER')
      }
      
      const response = await GraphQLAPI.getCurrentUser()
      if (response.me) {
        if (process.env.NODE_ENV === 'development') {
          logger.info('User data loaded successfully', { userId: response.me?.id }, 'USER')
        }
        
        // Check if user actually changed
        if (user?.id !== response.me.id || user?.role !== response.me.role) {
          if (process.env.NODE_ENV === 'development') {
            logger.debug('User data changed, triggering storage event', {}, 'USER')
          }
          localStorage.setItem('user_changed', Date.now().toString())
          localStorage.removeItem('user_changed')
        }
        
        setUser(response.me)
      } else {
        if (process.env.NODE_ENV === 'development') {
          logger.debug('No user data found', {}, 'USER')
        }
        setUser(null)
        setError('Unable to load user data')
      }
    } catch (err) {
      if (process.env.NODE_ENV === 'development') {
        logger.error('Failed to load user data', err, 'USER')
      }
      
      // Check if it's an authentication error - let the AuthProvider handle it
      if (err instanceof Error && (
        err.message.includes('Authentication required') ||
        err.message.includes('Unauthorized') ||
        err.message.includes('Not authenticated') ||
        err.message.includes('Invalid token') ||
        err.message.includes('Token expired')
      )) {
        // Don't set error here, let the AuthProvider handle the redirect
        setUser(null)
        return
      }
      
      setError('Error loading user data')
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // Mark as hydrated on client side
    setIsHydrated(true)
    loadUser()
    
    // Only refresh user data when storage changes (for same-origin tabs)
    // Remove window focus listener to prevent excessive permission checks
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'user_changed') {
        if (process.env.NODE_ENV === 'development') {
          logger.debug('User change detected from storage event', {}, 'USER')
        }
        loadUser()
      }
    }
    
    window.addEventListener('storage', handleStorageChange)
    
    return () => {
      window.removeEventListener('storage', handleStorageChange)
    }
  }, [])

  const refreshUser = async () => {
    if (process.env.NODE_ENV === 'development') {
      logger.debug('Manual user data refresh triggered', {}, 'USER')
    }
    await loadUser()
  }

  const clearUser = () => {
    if (process.env.NODE_ENV === 'development') {
      logger.info('User data cleared', {}, 'USER')
    }
    setUser(null)
    setError(null)
    
    // Trigger storage event to notify other tabs
    localStorage.setItem('user_changed', Date.now().toString())
    localStorage.removeItem('user_changed')
  }

  return (
    <UserContext.Provider value={{ user, loading: loading || !isHydrated, error, refreshUser, clearUser }}>
      {children}
    </UserContext.Provider>
  )
}

export function useUser() {
  const context = useContext(UserContext)
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider')
  }
  return context
} 