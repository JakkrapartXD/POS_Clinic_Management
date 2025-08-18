import { removeCookie } from './common'
import { APP_CONSTANTS } from '@/constants'

/**
 * Clear all authentication-related cookies
 */
export const clearAuthCookies = (): void => {
  // Clear JWT token cookie
  removeCookie(APP_CONSTANTS.COOKIES.AUTH_TOKEN)
  
  // Clear session token cookie (if exists)
  removeCookie('next-auth.session-token')
  
  // Clear any other auth-related cookies
  removeCookie('next-auth.csrf-token')
  removeCookie('next-auth.callback-url')
  
  // Force clear cookies by setting them to expire in the past
  if (typeof document !== 'undefined') {
    const cookies = [
      APP_CONSTANTS.COOKIES.AUTH_TOKEN,
      'next-auth.session-token',
      'next-auth.csrf-token',
      'next-auth.callback-url'
    ]
    
    cookies.forEach(cookieName => {
      document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${window.location.hostname};`
    })
  }
}

/**
 * Handle authentication errors and redirect to login if needed
 */
export const handleAuthError = (error: any, redirectToLogin: () => void): void => {
  console.error('Authentication error:', error)
  
  // Check if it's an authentication error
  const isAuthError = 
    error?.message?.includes('Authentication required') ||
    error?.message?.includes('Unauthorized') ||
    error?.message?.includes('Not authenticated') ||
    error?.message?.includes('Invalid token') ||
    error?.message?.includes('Token expired') ||
    error?.status === 401 ||
    error?.statusCode === 401
  
  if (isAuthError) {
    // Clear all authentication cookies
    clearAuthCookies()
    
    // Clear any stored user data
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('user_changed')
      // Clear any other auth-related localStorage items
      Object.keys(localStorage).forEach(key => {
        if (key.includes('auth') || key.includes('user') || key.includes('token')) {
          localStorage.removeItem(key)
        }
      })
    }
    
    // Clear any stored session data
    if (typeof sessionStorage !== 'undefined') {
      Object.keys(sessionStorage).forEach(key => {
        if (key.includes('auth') || key.includes('user') || key.includes('token')) {
          sessionStorage.removeItem(key)
        }
      })
    }
    
    // Redirect to login page
    redirectToLogin()
  }
}

/**
 * Check if user is authenticated by verifying if auth cookies exist
 */
export const isAuthenticated = (): boolean => {
  if (typeof document === 'undefined') return false
  
  const jwtToken = document.cookie.includes(APP_CONSTANTS.COOKIES.AUTH_TOKEN)
  const sessionToken = document.cookie.includes('next-auth.session-token')
  
  return jwtToken || sessionToken
}

/**
 * Force logout and redirect to login
 */
export const forceLogout = (redirectToLogin: () => void): void => {
  // Clear all auth data
  clearAuthCookies()
  
  // Clear localStorage and sessionStorage
  if (typeof localStorage !== 'undefined') {
    localStorage.clear()
  }
  if (typeof sessionStorage !== 'undefined') {
    sessionStorage.clear()
  }
  
  // Redirect to login
  redirectToLogin()
}
