/**
 * Logger utility with environment-based configuration
 * Provides structured logging with proper levels for development and production
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error'

interface LogEntry {
  level: LogLevel
  message: string
  data?: any
  timestamp: string
  context?: string
}

class Logger {
  private isDevelopment: boolean
  private enabledLevels: Set<LogLevel>

  constructor() {
    this.isDevelopment = process.env.NODE_ENV === 'development'
    
    // Configure enabled log levels based on environment
    if (this.isDevelopment) {
      this.enabledLevels = new Set(['debug', 'info', 'warn', 'error'])
    } else {
      // Production: only warn and error
      this.enabledLevels = new Set(['warn', 'error'])
    }
  }

  private shouldLog(level: LogLevel): boolean {
    return this.enabledLevels.has(level)
  }

  private formatMessage(level: LogLevel, message: string, data?: any, context?: string): void {
    if (!this.shouldLog(level)) return

    const timestamp = new Date().toISOString()
    const logEntry: LogEntry = {
      level,
      message,
      data,
      timestamp,
      context
    }

    // In development, use colorful console output
    if (this.isDevelopment) {
      const emoji = this.getEmoji(level)
      const contextStr = context ? `[${context}] ` : ''
      
      switch (level) {
        case 'debug':
          console.log(`${emoji} ${contextStr}${message}`, data || '')
          break
        case 'info':
          console.info(`${emoji} ${contextStr}${message}`, data || '')
          break
        case 'warn':
          console.warn(`${emoji} ${contextStr}${message}`, data || '')
          break
        case 'error':
          console.error(`${emoji} ${contextStr}${message}`, data || '')
          break
      }
    } else {
      // In production, use structured JSON logging
      if (level === 'error') {
        console.error(JSON.stringify(logEntry))
      } else if (level === 'warn') {
        console.warn(JSON.stringify(logEntry))
      }
    }
  }

  private getEmoji(level: LogLevel): string {
    switch (level) {
      case 'debug': return '🔍'
      case 'info': return 'ℹ️'
      case 'warn': return '⚠️'
      case 'error': return '❌'
      default: return '📝'
    }
  }

  debug(message: string, data?: any, context?: string): void {
    this.formatMessage('debug', message, data, context)
  }

  info(message: string, data?: any, context?: string): void {
    this.formatMessage('info', message, data, context)
  }

  warn(message: string, data?: any, context?: string): void {
    this.formatMessage('warn', message, data, context)
  }

  error(message: string, error?: any, context?: string): void {
    // Extract error details if it's an Error object
    let errorData = error
    if (error instanceof Error) {
      errorData = {
        name: error.name,
        message: error.message,
        stack: this.isDevelopment ? error.stack : undefined
      }
    }
    this.formatMessage('error', message, errorData, context)
  }

  // Utility methods for common use cases
  auth = {
    login: (userId: string, success: boolean) => {
      if (success) {
        this.info('User login successful', { userId }, 'AUTH')
      } else {
        this.warn('User login failed', { userId }, 'AUTH')
      }
    },
    logout: (userId: string) => {
      this.info('User logout', { userId }, 'AUTH')
    },
    permissionCheck: (permission: string, role: string, hasAccess: boolean) => {
      this.debug('Permission check', { permission, role, hasAccess }, 'AUTH')
    }
  }

  api = {
    request: (endpoint: string, method: string) => {
      this.debug('API request', { endpoint, method }, 'API')
    },
    response: (endpoint: string, status: number) => {
      if (status >= 400) {
        this.warn('API error response', { endpoint, status }, 'API')
      } else {
        this.debug('API response', { endpoint, status }, 'API')
      }
    },
    error: (endpoint: string, error: any) => {
      this.error('API request failed', { endpoint, error }, 'API')
    }
  }

  user = {
    action: (action: string, data?: any) => {
      this.info('User action', { action, ...data }, 'USER')
    },
    navigation: (from: string, to: string) => {
      this.debug('Navigation', { from, to }, 'USER')
    }
  }
}

// Export singleton instance
export const logger = new Logger()

// Export default for convenience
export default logger
