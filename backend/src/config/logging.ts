/**
 * Backend logging configuration for different environments
 */

export interface BackendLoggingConfig {
  level: 'debug' | 'info' | 'warn' | 'error'
  enableConsole: boolean
  enableFileLogging: boolean
  logFilePath?: string
  enableStructuredLogging: boolean
  enableAuditLogging: boolean
  enablePerformanceLogging: boolean
  logRotation: {
    enabled: boolean
    maxFiles: number
    maxSize: string
  }
}

const developmentConfig: BackendLoggingConfig = {
  level: 'debug',
  enableConsole: true,
  enableFileLogging: false,
  enableStructuredLogging: false,
  enableAuditLogging: true,
  enablePerformanceLogging: true,
  logRotation: {
    enabled: false,
    maxFiles: 5,
    maxSize: '10m'
  }
}

const productionConfig: BackendLoggingConfig = {
  level: 'info',
  enableConsole: true,
  enableFileLogging: true,
  logFilePath: '/var/log/sn-medical/app.log',
  enableStructuredLogging: true,
  enableAuditLogging: true,
  enablePerformanceLogging: false,
  logRotation: {
    enabled: true,
    maxFiles: 10,
    maxSize: '50m'
  }
}

const testConfig: BackendLoggingConfig = {
  level: 'warn',
  enableConsole: false,
  enableFileLogging: false,
  enableStructuredLogging: true,
  enableAuditLogging: false,
  enablePerformanceLogging: false,
  logRotation: {
    enabled: false,
    maxFiles: 1,
    maxSize: '1m'
  }
}

export function getBackendLoggingConfig(): BackendLoggingConfig {
  const env = process.env.NODE_ENV || 'development'
  
  switch (env) {
    case 'production':
      return productionConfig
    case 'test':
      return testConfig
    case 'development':
    default:
      return developmentConfig
  }
}

export const BACKEND_LOGGING_CONFIG = getBackendLoggingConfig()

// Security logging levels
export const SECURITY_LOG_LEVELS = {
  AUTHENTICATION: 'info',
  AUTHORIZATION: 'warn', 
  SUSPICIOUS_ACTIVITY: 'error',
  AUDIT_TRAIL: 'info'
} as const
