'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { apiClient } from '@/clients/api'
import { API_CONFIG } from '@/config/api'
import { APP_CONSTANTS } from '@/constants'
import { setCookie } from '@/utils/common'
import { AlertCircle, Eye, EyeOff, RefreshCw, Wifi, WifiOff } from 'lucide-react'

interface AuthResponse {
  accessToken?: string
  token?: string
  success?: boolean
  message?: string
  error?: string
}

interface LoginError {
  type: 'INVALID_CREDENTIALS' | 'NETWORK_ERROR' | 'SERVER_ERROR' | 'UNKNOWN_ERROR'
  message: string
  details?: string
  canRetry?: boolean
}

export default function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loginError, setLoginError] = useState<LoginError | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [retryCount, setRetryCount] = useState(0)
  const [validationErrors, setValidationErrors] = useState<{username?: string, password?: string}>({})
  const router = useRouter()

  // Validate form inputs
  const validateForm = () => {
    const errors: {username?: string, password?: string} = {}
    
    if (!username.trim()) {
      errors.username = 'กรุณากรอกชื่อผู้ใช้'
    } else if (username.trim().length < 3) {
      errors.username = 'ชื่อผู้ใช้ต้องมีความยาวอย่างน้อย 3 ตัวอักษร'
    }
    
    if (!password) {
      errors.password = 'กรุณากรอกรหัสผ่าน'
    } else if (password.length < 6) {
      errors.password = 'รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร'
    }
    
    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  // Parse different types of errors
  const parseError = (error: any): LoginError => {
    console.log('Error details:', error) // Debug logging
    
    // Network connectivity issues
    if (!navigator.onLine) {
      return {
        type: 'NETWORK_ERROR',
        message: 'ไม่มีการเชื่อมต่ออินเทอร์เน็ต',
        details: 'กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ตของคุณ',
        canRetry: true
      }
    }

    // Check for response payload first (when success: false)
    if (error.responseData) {
      const responseData = error.responseData
      
      // Handle specific error messages from API
      if (responseData.error) {
        if (responseData.error.includes('Invalid username or password') || 
            responseData.error.includes('invalid credentials')) {
          return {
            type: 'INVALID_CREDENTIALS',
            message: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง',
            details: 'กรุณาตรวจสอบความถูกต้องของข้อมูลที่กรอกแล้วลองใหม่อีกครั้ง',
            canRetry: false
          }
        }
        
        if (responseData.error.includes('Account disabled') || 
            responseData.error.includes('Account suspended')) {
          return {
            type: 'INVALID_CREDENTIALS',
            message: 'บัญชีของคุณถูกระงับการใช้งาน',
            details: 'กรุณาติดต่อผู้ดูแลระบบเพื่อเปิดใช้งานบัญชี',
            canRetry: false
          }
        }
      }
    }

    // Network timeout or connection refused
    if (error.name === 'TypeError' || error.message?.includes('fetch')) {
      return {
        type: 'NETWORK_ERROR',
        message: 'ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้',
        details: 'กรุณาลองใหม่อีกครั้ง หรือติดต่อผู้ดูแลระบบ',
        canRetry: true
      }
    }

    // HTTP status errors (from statusCode or status)
    const statusCode = error.statusCode || error.status
    if (statusCode) {
      switch (statusCode) {
        case 401:
        case 422:
          return {
            type: 'INVALID_CREDENTIALS',
            message: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง',
            details: 'กรุณาตรวจสอบชื่อผู้ใช้และรหัสผ่านแล้วลองใหม่อีกครั้ง',
            canRetry: false
          }
        case 403:
          return {
            type: 'INVALID_CREDENTIALS',
            message: 'บัญชีของคุณถูกระงับการใช้งาน',
            details: 'กรุณาติดต่อผู้ดูแลระบบเพื่อเปิดใช้งานบัญชี',
            canRetry: false
          }
        case 500:
          return {
            type: 'SERVER_ERROR',
            message: 'เซิร์ฟเวอร์ขัดข้อง',
            details: 'กรุณาลองใหม่อีกครั้งในอีกสักครู่',
            canRetry: true
          }
        case 503:
          return {
            type: 'SERVER_ERROR',
            message: 'ระบบอยู่ระหว่างการบำรุงรักษา',
            details: 'กรุณาลองใหม่อีกครั้งในภายหลัง',
            canRetry: true
          }
        default:
          return {
            type: 'SERVER_ERROR',
            message: 'เกิดข้อผิดพลาดจากเซิร์ฟเวอร์',
            details: `รหัสข้อผิดพลาด: ${statusCode}`,
            canRetry: true
          }
      }
    }

    // Extract status code from error message if not in properties
    if (!statusCode && error.message?.includes('HTTP error! status:')) {
      const statusMatch = error.message.match(/status:\s*(\d+)/);
      if (statusMatch) {
        const extractedStatus = parseInt(statusMatch[1]);
        if (extractedStatus === 401 || extractedStatus === 422) {
          return {
            type: 'INVALID_CREDENTIALS',
            message: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง',
            details: 'กรุณาตรวจสอบชื่อผู้ใช้และรหัสผ่านแล้วลองใหม่อีกครั้ง',
            canRetry: false
          }
        }
        if (extractedStatus === 403) {
          return {
            type: 'INVALID_CREDENTIALS',
            message: 'บัญชีของคุณถูกระงับการใช้งาน',
            details: 'กรุณาติดต่อผู้ดูแลระบบเพื่อเปิดใช้งานบัญชี',
            canRetry: false
          }
        }
        if (extractedStatus >= 500) {
          return {
            type: 'SERVER_ERROR',
            message: 'เซิร์ฟเวอร์ขัดข้อง',
            details: `รหัสข้อผิดพลาด: ${extractedStatus}`,
            canRetry: true
          }
        }
      }
    }

    // API response errors (fallback for message content)
    if (error.message?.includes('Login failed') || 
        error.message?.includes('Invalid username or password') ||
        error.message?.includes('Invalid credentials')) {
      return {
        type: 'INVALID_CREDENTIALS',
        message: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง',
        details: 'กรุณาตรวจสอบความถูกต้องของข้อมูลที่กรอก',
        canRetry: false
      }
    }

    // Unknown errors
    return {
      type: 'UNKNOWN_ERROR',
      message: 'เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ',
      details: error.message || 'กรุณาลองใหม่อีกครั้ง หรือติดต่อผู้ดูแลระบบ',
      canRetry: true
    }
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Clear previous errors
    setLoginError(null)
    setValidationErrors({})
    
    // Validate form
    if (!validateForm()) {
      return
    }
    
    setIsLoading(true)

    try {
      const response = await apiClient.post<AuthResponse>(API_CONFIG.ENDPOINTS.AUTH.SIGN_IN, {
        username: username.trim(),
        password,
      })

      // Backend automatically sets HttpOnly cookies, no need to set client-side cookies
      if (!response.success) {
        // Create error object with response data for better error handling
        const error = new Error(response.error || 'Login failed')
        ;(error as any).responseData = response
        ;(error as any).statusCode = 422 // Default to 422 for invalid credentials
        throw error
      }

      // Success - clear retry count and redirect
      setRetryCount(0)
      router.push(APP_CONSTANTS.ROUTES.DASHBOARD)
      
    } catch (err: any) {
      const errorInfo = parseError(err)
      setLoginError(errorInfo)
      
      // Track retry attempts for certain types of errors
      if (errorInfo.canRetry) {
        setRetryCount(prev => prev + 1)
      }
      
      console.error('Login error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleRetry = () => {
    setLoginError(null)
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    performLogin()
  }

  const handleRetry = () => {
    setLoginError(null)
    performLogin()
  }

  const handleInputChange = (field: 'username' | 'password', value: string) => {
    if (field === 'username') {
      setUsername(value)
      if (validationErrors.username) {
        setValidationErrors(prev => ({ ...prev, username: undefined }))
      }
    } else {
      setPassword(value)
      if (validationErrors.password) {
        setValidationErrors(prev => ({ ...prev, password: undefined }))
      }
    }
    
    // Clear login error when user starts typing
    if (loginError && (loginError.type === 'INVALID_CREDENTIALS' || !loginError.canRetry)) {
      setLoginError(null)
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-grey-lighter h-screen font-sans ">
      <form
        onSubmit={handleLogin}
        className="bg-white p-6 rounded-2xl shadow-lg w-full max-w-sm border-t-10 border-teal-500"
      >
        <h2 className="text-2xl font-bold mb-4 text-center">เข้าสู่ระบบ</h2>

        {/* Error Display */}
        {loginError && (
          <div className={`mb-4 p-4 rounded-lg border-l-4 ${
            loginError.type === 'INVALID_CREDENTIALS' 
              ? 'bg-red-50 border-red-400' 
              : loginError.type === 'NETWORK_ERROR'
              ? 'bg-yellow-50 border-yellow-400'
              : 'bg-red-50 border-red-400'
          }`}>
            <div className="flex items-start">
              <div className="flex-shrink-0">
                {loginError.type === 'NETWORK_ERROR' ? (
                  <WifiOff className={`h-5 w-5 ${
                    loginError.type === 'NETWORK_ERROR' ? 'text-yellow-400' : 'text-red-400'
                  }`} />
                ) : (
                  <AlertCircle className="h-5 w-5 text-red-400" />
                )}
              </div>
              <div className="ml-3 flex-1">
                <p className={`text-sm font-medium ${
                  loginError.type === 'NETWORK_ERROR' ? 'text-yellow-800' : 'text-red-800'
                }`}>
                  {loginError.message}
                </p>
                {loginError.details && (
                  <p className={`mt-1 text-sm ${
                    loginError.type === 'NETWORK_ERROR' ? 'text-yellow-700' : 'text-red-700'
                  }`}>
                    {loginError.details}
                  </p>
                )}
                {loginError.canRetry && retryCount > 0 && (
                  <p className="mt-2 text-xs text-gray-600">
                    ความพยายามครั้งที่ {retryCount} • <button 
                      type="button"
                      onClick={handleRetry}
                      className="text-teal-600 hover:text-teal-800 underline"
                      disabled={isLoading}
                    >
                      ลองใหม่อีกครั้ง
                    </button>
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Network Status Indicator */}
        {!navigator.onLine && (
          <div className="mb-4 p-3 bg-gray-100 rounded-lg flex items-center">
            <WifiOff className="h-4 w-4 text-gray-500 mr-2" />
            <span className="text-sm text-gray-700">ไม่มีการเชื่อมต่ออินเทอร์เน็ต</span>
          </div>
        )}

        <div className="mb-4">
          <input
            type="text"
            placeholder="ชื่อผู้ใช้"
            value={username}
            onChange={(e) => handleInputChange('username', e.target.value)}
            className={`w-full p-2 border rounded-xl block appearance-none bg-white transition-all duration-200 ${
              validationErrors.username 
                ? 'border-red-400 focus:border-red-500' 
                : loginError?.type === 'INVALID_CREDENTIALS'
                ? 'border-red-300 focus:border-red-400'
                : 'border-gray-300 hover:border-gray-400 focus:border-teal-500 hover:scale-[1.02] focus:scale-[1.02]'
            }`}
            required
            disabled={isLoading}
          />
          {validationErrors.username && (
            <p className="mt-1 text-sm text-red-600">{validationErrors.username}</p>
          )}
        </div>

        <div className="mb-6">
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="รหัสผ่าน"
              value={password}
              onChange={(e) => handleInputChange('password', e.target.value)}
              className={`w-full p-2 pr-10 border rounded-xl block appearance-none bg-white transition-all duration-200 ${
                validationErrors.password 
                  ? 'border-red-400 focus:border-red-500' 
                  : loginError?.type === 'INVALID_CREDENTIALS'
                  ? 'border-red-300 focus:border-red-400'
                  : 'border-gray-300 hover:border-gray-400 focus:border-teal-500 hover:scale-[1.02] focus:scale-[1.02]'
              }`}
              required
              disabled={isLoading}
            />
            <button 
              type="button" 
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
              disabled={isLoading}
            >
              {showPassword ? (
                <EyeOff className="w-5 h-5" />
              ) : (
                <Eye className="w-5 h-5" />
              )}
            </button>
          </div>
          {validationErrors.password && (
            <p className="mt-1 text-sm text-red-600">{validationErrors.password}</p>
          )}
        </div>

        <button
          type="submit"
          className="w-full bg-teal-500 hover:bg-teal-600 text-white py-3 rounded-xl transition-all duration-200 hover:scale-[1.02] active:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center"
          disabled={isLoading || !navigator.onLine}
        >
          {isLoading ? (
            <>
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              กำลังเข้าสู่ระบบ...
            </>
          ) : !navigator.onLine ? (
            <>
              <WifiOff className="w-4 h-4 mr-2" />
              ไม่มีการเชื่อมต่อ
            </>
          ) : (
            'เข้าสู่ระบบ'
          )}
        </button>

        {/* Retry Button for Network Errors */}
        {loginError?.canRetry && loginError.type === 'NETWORK_ERROR' && (
          <button
            type="button"
            onClick={handleRetry}
            className="w-full mt-3 bg-gray-500 hover:bg-gray-600 text-white py-2 rounded-xl transition-all duration-200 hover:scale-[1.02] disabled:opacity-50 flex items-center justify-center"
            disabled={isLoading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            ลองเชื่อมต่อใหม่
          </button>
        )}

        {/* Help Text */}
        <div className="mt-4 text-center">
          <p className="text-xs text-gray-500">
            หากมีปัญหาการเข้าสู่ระบบ กรุณาติดต่อผู้ดูแลระบบ
          </p>
        </div>
      </form>
    </div>
  )
}