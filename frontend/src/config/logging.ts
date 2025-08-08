/**
 * Logging configuration for different environments
 */

export interface LoggingConfig {
  level: 'debug' | 'info' | 'warn' | 'error'
  enableConsole: boolean
  enableRemoteLogging: boolean
  remoteLoggingUrl?: string
  enablePerformanceLogging: boolean
}

const developmentConfig: LoggingConfig = {
  level: 'debug',
  enableConsole: true,
  enableRemoteLogging: false,
  enablePerformanceLogging: true
}

const productionConfig: LoggingConfig = {
  level: 'error',
  enableConsole: true, // Still enable for critical errors
  enableRemoteLogging: true,
  remoteLoggingUrl: process.env.NEXT_PUBLIC_LOGGING_ENDPOINT,
  enablePerformanceLogging: false
}

const testConfig: LoggingConfig = {
  level: 'warn',
  enableConsole: false,
  enableRemoteLogging: false,
  enablePerformanceLogging: false
}

export function getLoggingConfig(): LoggingConfig {
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

export const LOGGING_CONFIG = getLoggingConfig()
