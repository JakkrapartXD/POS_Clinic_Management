/**
 * Authentication Configuration
 * 
 * This module provides centralized configuration for authentication settings,
 * including cookie names, JWT settings, and other authentication-related constants.
 */

import { getAuthCookieConfig, type AuthCookieConfig } from '../types/auth';

// Authentication configuration interface
export interface AuthConfig {
  cookies: AuthCookieConfig;
  jwt: {
    secret: string;
    expiresIn: string;
    issuer?: string;
    audience?: string;
  };
  session: {
    expiresIn: string;
    secure: boolean;
    httpOnly: boolean;
    sameSite: 'strict' | 'lax' | 'none';
  };
  security: {
    maxLoginAttempts: number;
    lockoutDuration: number; // in minutes
    passwordMinLength: number;
    requireStrongPassword: boolean;
  };
}

// Default authentication configuration
const DEFAULT_AUTH_CONFIG: AuthConfig = {
  cookies: getAuthCookieConfig(),
  jwt: {
    secret: process.env.JWT_SECRET || 'your-secret-key',
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
    issuer: process.env.JWT_ISSUER || 'sn-clinic',
    audience: process.env.JWT_AUDIENCE || 'sn-clinic-users'
  },
  session: {
    expiresIn: process.env.SESSION_EXPIRES_IN || '7d',
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: (process.env.SESSION_SAME_SITE as 'strict' | 'lax' | 'none') || 'lax'
  },
  security: {
    maxLoginAttempts: parseInt(process.env.MAX_LOGIN_ATTEMPTS || '5'),
    lockoutDuration: parseInt(process.env.LOCKOUT_DURATION || '15'),
    passwordMinLength: parseInt(process.env.PASSWORD_MIN_LENGTH || '8'),
    requireStrongPassword: process.env.REQUIRE_STRONG_PASSWORD === 'true'
  }
};

// Singleton instance of auth configuration
let authConfig: AuthConfig | null = null;

/**
 * Get the authentication configuration
 * This function returns a singleton instance to ensure consistency across the application
 */
export function getAuthConfig(): AuthConfig {
  if (!authConfig) {
    authConfig = {
      ...DEFAULT_AUTH_CONFIG,
      cookies: getAuthCookieConfig() // Refresh cookie config in case env vars changed
    };
  }
  return authConfig;
}

/**
 * Reset the authentication configuration
 * Useful for testing or when environment variables change
 */
export function resetAuthConfig(): void {
  authConfig = null;
}

/**
 * Get cookie names from configuration
 */
export function getCookieNames(): AuthCookieConfig {
  return getAuthConfig().cookies;
}

/**
 * Get JWT configuration
 */
export function getJWTConfig() {
  return getAuthConfig().jwt;
}

/**
 * Get session configuration
 */
export function getSessionConfig() {
  return getAuthConfig().session;
}

/**
 * Get security configuration
 */
export function getSecurityConfig() {
  return getAuthConfig().security;
}

/**
 * Validate authentication configuration
 * Throws an error if the configuration is invalid
 */
export function validateAuthConfig(): void {
  const config = getAuthConfig();
  
  // Validate JWT secret
  if (!config.jwt.secret || config.jwt.secret === 'your-secret-key') {
    console.warn('⚠️  JWT_SECRET is not set or using default value. This is insecure for production!');
  }
  
  // Validate cookie names
  if (!config.cookies.jwtToken || !config.cookies.sessionToken) {
    throw new Error('Cookie names must be defined');
  }
  
  // Validate security settings
  if (config.security.maxLoginAttempts < 1) {
    throw new Error('maxLoginAttempts must be at least 1');
  }
  
  if (config.security.lockoutDuration < 1) {
    throw new Error('lockoutDuration must be at least 1 minute');
  }
  
  if (config.security.passwordMinLength < 6) {
    throw new Error('passwordMinLength must be at least 6 characters');
  }
  
  console.log('✅ Authentication configuration validated successfully');
}

// Environment variable documentation
export const ENV_VARS_DOCS = {
  AUTH_JWT_COOKIE_NAME: 'Name of the JWT token cookie (default: next-auth.jwt-token)',
  AUTH_SESSION_COOKIE_NAME: 'Name of the session token cookie (default: next-auth.session-token)',
  JWT_SECRET: 'Secret key for JWT signing (REQUIRED for production)',
  JWT_EXPIRES_IN: 'JWT expiration time (default: 24h)',
  JWT_ISSUER: 'JWT issuer claim (default: sn-clinic)',
  JWT_AUDIENCE: 'JWT audience claim (default: sn-clinic-users)',
  SESSION_EXPIRES_IN: 'Session expiration time (default: 7d)',
  SESSION_SAME_SITE: 'Session cookie SameSite attribute (default: lax)',
  MAX_LOGIN_ATTEMPTS: 'Maximum login attempts before lockout (default: 5)',
  LOCKOUT_DURATION: 'Lockout duration in minutes (default: 15)',
  PASSWORD_MIN_LENGTH: 'Minimum password length (default: 8)',
  REQUIRE_STRONG_PASSWORD: 'Require strong password validation (default: false)'
} as const;
