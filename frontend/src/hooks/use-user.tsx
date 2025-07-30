'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { GraphQLAPI } from '@/clients/graphql'
import { User } from '@/types/user'

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

  const loadUser = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Debug: Clear console for fresh debug session
      console.clear()
      console.log('🔄 Loading user data...')
      
      const response = await GraphQLAPI.getCurrentUser()
      if (response.me) {
        console.log('✅ User data loaded:', response.me)
        
        // Check if user actually changed
        if (user?.id !== response.me.id || user?.role !== response.me.role) {
          console.log('🔄 User changed! Triggering storage event')
          localStorage.setItem('user_changed', Date.now().toString())
          localStorage.removeItem('user_changed')
        }
        
        setUser(response.me)
      } else {
        console.log('❌ No user data found')
        setUser(null)
        setError('Unable to load user data')
      }
    } catch (err) {
      console.error('❌ Error loading user:', err)
      setError('Error loading user data')
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadUser()
    
    // Refresh user data when window gains focus (better than polling)
    const handleFocus = () => {
      console.log('🖼️ Window focused - checking for user changes')
      loadUser()
    }
    
    // Refresh user data when storage changes (for same-origin tabs)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'user_changed') {
        console.log('🔄 User change detected from storage event')
        loadUser()
      }
    }
    
    window.addEventListener('focus', handleFocus)
    window.addEventListener('storage', handleStorageChange)
    
    return () => {
      window.removeEventListener('focus', handleFocus)
      window.removeEventListener('storage', handleStorageChange)
    }
  }, [])

  const refreshUser = async () => {
    console.log('🔄 Manual refresh triggered')
    await loadUser()
  }

  const clearUser = () => {
    console.log('🗑️ Clearing user data')
    setUser(null)
    setError(null)
    
    // Trigger storage event to notify other tabs
    localStorage.setItem('user_changed', Date.now().toString())
    localStorage.removeItem('user_changed')
  }

  return (
    <UserContext.Provider value={{ user, loading, error, refreshUser, clearUser }}>
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