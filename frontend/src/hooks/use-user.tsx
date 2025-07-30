'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { GraphQLAPI } from '@/clients/graphql'
import { User } from '@/types/user'

interface UserContextType {
  user: User | null
  loading: boolean
  error: string | null
  refreshUser: () => Promise<void>
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
      const response = await GraphQLAPI.getCurrentUser()
      if (response.me) {
        setUser(response.me)
      } else {
        setUser(null)
        setError('Unable to load user data')
      }
    } catch (err) {
      setError('Error loading user data')
      setUser(null)
      console.error('Error loading user:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadUser()
  }, [])

  const refreshUser = async () => {
    await loadUser()
  }

  return (
    <UserContext.Provider value={{ user, loading, error, refreshUser }}>
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