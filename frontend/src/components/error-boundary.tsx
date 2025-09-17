'use client'

import React, { Component, ErrorInfo, ReactNode } from 'react'
import { clearAuthCookies } from '@/utils/auth'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  }

  public static getDerivedStateFromError(error: Error): State {
    // Check if it's an authentication error
    const isAuthError = 
      error.message?.includes('Authentication required') ||
      error.message?.includes('Unauthorized') ||
      error.message?.includes('Not authenticated') ||
      error.message?.includes('Invalid token') ||
      error.message?.includes('Token expired')
    
    if (isAuthError) {
      // Clear auth cookies and redirect to login
      clearAuthCookies()
      if (typeof window !== 'undefined') {
        window.location.href = '/login'
      }
    }
    
    return { hasError: true, error }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
  }

  public render() {
    if (this.state.hasError) {
      // Check if it's an authentication error
      const isAuthError = 
        this.state.error?.message?.includes('Authentication required') ||
        this.state.error?.message?.includes('Unauthorized') ||
        this.state.error?.message?.includes('Not authenticated') ||
        this.state.error?.message?.includes('Invalid token') ||
        this.state.error?.message?.includes('Token expired')
      
      if (isAuthError) {
        // Don't render anything, let the redirect happen
        return null
      }
      
      // For other errors, show fallback or default error UI
      return this.props.fallback || (
        <div className="flex items-center justify-center min-h-screen bg-gray-50">
          <div className="text-center">
            <div className="text-red-500 text-6xl mb-4">⚠️</div>
            <h1 className="text-2xl font-semibold text-gray-700 mb-2">
              เกิดข้อผิดพลาดที่ไม่คาดคิด
            </h1>
            <p className="text-gray-500 mb-6">
              กรุณาลองรีเฟรชหน้าหรือติดต่อผู้ดูแลระบบ
            </p>
            <button
              onClick={() => window.location.reload()}
              className="bg-teal-500 hover:bg-teal-600 text-white px-6 py-2 rounded-lg"
            >
              รีเฟรชหน้า
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
