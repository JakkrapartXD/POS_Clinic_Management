/**
 * Authentication Types and Configuration
 * 
 * This module defines proper TypeScript types for authentication-related objects
 * and provides configuration for cookie names and authentication settings.
 */

// Cookie value types from Elysia
export interface CookieValue {
  value: string;
  expires?: Date;
  maxAge?: number;
  domain?: string;
  path?: string;
  secure?: boolean;
  httpOnly?: boolean;
  sameSite?: 'strict' | 'lax' | 'none';
}

// Cookie object type that can contain multiple cookies
export interface CookieObject {
  [key: string]: CookieValue | string | undefined;
}

// Authentication cookie names configuration
export interface AuthCookieConfig {
  jwtToken: string;
  sessionToken: string;
}

// Default cookie names (can be overridden by environment variables)
export const DEFAULT_AUTH_COOKIES: AuthCookieConfig = {
  jwtToken: 'next-auth.jwt-token',
  sessionToken: 'next-auth.session-token'
};

// Get authentication cookie configuration from environment variables
export function getAuthCookieConfig(): AuthCookieConfig {
  return {
    jwtToken: process.env.AUTH_JWT_COOKIE_NAME || DEFAULT_AUTH_COOKIES.jwtToken,
    sessionToken: process.env.AUTH_SESSION_COOKIE_NAME || DEFAULT_AUTH_COOKIES.sessionToken
  };
}

// JWT payload type
export interface JWTPayload {
  sub: string; // User ID
  iat?: number; // Issued at
  exp?: number; // Expiration time
  role?: string; // User role
  [key: string]: any; // Additional claims
}

// Authentication result types
export interface AuthSuccess {
  success: true;
  userId: string;
  role?: string;
}

export interface AuthFailure {
  success: false;
  message: string;
  statusCode: number;
}

export type AuthResult = AuthSuccess | AuthFailure;

// Permission check result types
export interface PermissionSuccess extends AuthSuccess {
  role: string;
}

export interface PermissionFailure extends AuthFailure {}

export type PermissionResult = PermissionSuccess | PermissionFailure;

// Helper function to extract JWT token from cookie object
export function extractJwtToken(cookie: CookieObject, cookieName: string): string | null {
  const cookieValue = cookie[cookieName];
  
  if (!cookieValue) {
    return null;
  }
  
  // Handle both string and CookieValue object formats
  if (typeof cookieValue === 'string') {
    return cookieValue;
  }
  
  if (typeof cookieValue === 'object' && cookieValue !== null && 'value' in cookieValue) {
    return cookieValue.value;
  }
  
  return null;
}

// Helper function to extract session token from cookie object
export function extractSessionToken(cookie: CookieObject, cookieName: string): string | null {
  return extractJwtToken(cookie, cookieName); // Same logic for session tokens
}

// Type guard to check if a value is a CookieValue object
export function isCookieValue(value: any): value is CookieValue {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof value.value === 'string' &&
    (value.expires === undefined || value.expires instanceof Date) &&
    (value.maxAge === undefined || typeof value.maxAge === 'number') &&
    (value.domain === undefined || typeof value.domain === 'string') &&
    (value.path === undefined || typeof value.path === 'string') &&
    (value.secure === undefined || typeof value.secure === 'boolean') &&
    (value.httpOnly === undefined || typeof value.httpOnly === 'boolean') &&
    (value.sameSite === undefined || ['strict', 'lax', 'none'].includes(value.sameSite))
  );
}

// Type guard to check if a value is a string
export function isString(value: any): value is string {
  return typeof value === 'string';
}

// Helper function to safely get cookie value
export function getCookieValue(cookie: CookieObject, cookieName: string): string | null {
  const cookieValue = cookie[cookieName];
  
  if (isString(cookieValue)) {
    return cookieValue;
  }
  
  if (isCookieValue(cookieValue)) {
    return cookieValue.value;
  }
  
  return null;
}
