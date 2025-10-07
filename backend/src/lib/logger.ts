/**
 * Backend Logger utility with environment-based configuration
 * Provides structured logging with proper levels and production-ready output
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error'

interface LogEntry {
  level: LogLevel
  message: string
  data?: any
  timestamp: string
  context?: string
  service: string
}

class BackendLogger {
  private isDevelopment: boolean
  private enabledLevels: Set<LogLevel>
  private serviceName: string

  constructor(serviceName = 'SN-Medical-API') {
    this.isDevelopment = process.env.NODE_ENV === 'development'
    this.serviceName = serviceName
    
    // Configure enabled log levels based on environment
    if (this.isDevelopment) {
      this.enabledLevels = new Set(['debug', 'info', 'warn', 'error'])
    } else {
      // Production: info, warn and error
      this.enabledLevels = new Set(['info', 'warn', 'error'])
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
      context,
      service: this.serviceName
    }

    // In development, use colorful console output
    if (this.isDevelopment) {
      const emoji = this.getEmoji(level)
      const contextStr = context ? `[${context}] ` : ''
      const prefix = `${emoji} ${timestamp} ${contextStr}`
      
      switch (level) {
        case 'debug':
          console.log(`${prefix}${message}`, data ? JSON.stringify(data, null, 2) : '')
          break
        case 'info':
          console.info(`${prefix}${message}`, data ? JSON.stringify(data, null, 2) : '')
          break
        case 'warn':
          console.warn(`${prefix}${message}`, data ? JSON.stringify(data, null, 2) : '')
          break
        case 'error':
          console.error(`${prefix}${message}`, data ? JSON.stringify(data, null, 2) : '')
          break
      }
    } else {
      // In production, use structured JSON logging for log aggregation
      const output = JSON.stringify(logEntry)
      
      switch (level) {
        case 'info':
          console.info(output)
          break
        case 'warn':
          console.warn(output)
          break
        case 'error':
          console.error(output)
          break
      }
    }
  }

  private getEmoji(level: LogLevel): string {
    switch (level) {
      case 'debug': return '🔍'
      case 'info': return '📝'
      case 'warn': return '⚠️'
      case 'error': return '❌'
      default: return '📋'
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

  // Server lifecycle logging
  server = {
    starting: (port: number) => {
      this.info('Server starting', { port }, 'SERVER')
    },
    ready: (port: number, endpoints: string[]) => {
      this.info('Server ready', { port, endpoints }, 'SERVER')
    },
    shutdown: (signal?: string) => {
      this.info('Server shutting down', { signal }, 'SERVER')
    },
    error: (error: any) => {
      this.error('Server error', error, 'SERVER')
    }
  }

  // Database logging
  database = {
    connected: () => {
      this.info('Database connected successfully', {}, 'DATABASE')
    },
    disconnected: () => {
      this.info('Database disconnected', {}, 'DATABASE')
    },
    error: (operation: string, error: any) => {
      this.error('Database operation failed', { operation, error }, 'DATABASE')
    },
    query: (query: string, duration?: number) => {
      this.debug('Database query', { query, duration }, 'DATABASE')
    }
  }

  // Redis logging
  redis = {
    connected: () => {
      this.info('Redis connected successfully', {}, 'REDIS')
    },
    disconnected: () => {
      this.info('Redis disconnected', {}, 'REDIS')
    },
    error: (operation: string, error: any) => {
      this.error('Redis operation failed', { operation, error }, 'REDIS')
    }
  }

  // Authentication logging
  auth = {
    attempt: (username: string, success: boolean, ip?: string) => {
      if (success) {
        this.info('Authentication successful', { username, ip }, 'AUTH')
      } else {
        this.warn('Authentication failed', { username, ip }, 'AUTH')
      }
    },
    tokenGenerated: (userId: string) => {
      this.info('JWT token generated', { userId }, 'AUTH')
    },
    tokenVerified: (userId: string) => {
      this.debug('JWT token verified', { userId }, 'AUTH')
    },
    tokenExpired: (userId: string) => {
      this.warn('JWT token expired', { userId }, 'AUTH')
    },
    permissionDenied: (userId: string, permission: string, resource?: string) => {
      this.warn('Permission denied', { userId, permission, resource }, 'AUTH')
    }
  }

  // GraphQL logging
  graphql = {
    query: (operationName: string, userId?: string) => {
      // this.debug('GraphQL query', { operationName, userId }, 'GRAPHQL')
    },
    mutation: (operationName: string, userId?: string) => {
      // this.debug('GraphQL mutation', { operationName, userId }, 'GRAPHQL')
    },
    error: (operationName: string, error: any, userId?: string) => {
      this.error('GraphQL operation failed', { operationName, error, userId }, 'GRAPHQL')
    },
    rateLimited: (userId: string, operationType: string) => {
      this.warn('Rate limit exceeded', { userId, operationType }, 'GRAPHQL')
    }
  }

  // Security logging
  security = {
    auditLog: (userId: string, operation: string, entityType: string, entityId: string, details?: any) => {
      this.info('Audit log entry', { 
        userId, 
        operation, 
        entityType, 
        entityId, 
        details 
      }, 'AUDIT')
    },
    suspiciousActivity: (userId: string, activity: string, details?: any) => {
      this.warn('Suspicious activity detected', { userId, activity, details }, 'SECURITY')
    },
    rateLimitExceeded: (identifier: string, limit: number) => {
      this.warn('Rate limit exceeded', { identifier, limit }, 'SECURITY')
    }
  }
}

// Export singleton instance
export const logger = new BackendLogger()

// Export default for convenience
export default logger
