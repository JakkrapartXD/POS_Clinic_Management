# Authentication System Refactor

This document describes the refactoring of the authentication system to improve type safety, reduce coupling, and make cookie names configurable through environment variables.

## 🎯 **Problems Addressed**

### 1. **Type Safety Issues**
- **Problem**: Cookie parameters used `any` type, reducing type safety
- **Solution**: Created proper TypeScript interfaces for cookie objects

### 2. **Hardcoded Cookie Names**
- **Problem**: Cookie names like `'next-auth.jwt-token'` were hardcoded throughout the codebase
- **Solution**: Made cookie names configurable through environment variables

### 3. **Tight Coupling**
- **Problem**: Authentication logic was tightly coupled to specific cookie names
- **Solution**: Introduced configuration layer and helper functions

### 4. **Inconsistent Error Handling**
- **Problem**: Different parts of the system handled authentication errors differently
- **Solution**: Standardized authentication result types

## 🏗️ **New Architecture**

### **1. Type Definitions** (`/src/types/auth.ts`)

#### Core Types
```typescript
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
```

#### Helper Functions
```typescript
// Extract JWT token from cookie object
export function extractJwtToken(cookie: CookieObject, cookieName: string): string | null

// Type guards for runtime type checking
export function isCookieValue(value: any): value is CookieValue
export function isString(value: any): value is string
```

### **2. Configuration System** (`/src/config/auth.ts`)

#### Configuration Interface
```typescript
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
    lockoutDuration: number;
    passwordMinLength: number;
    requireStrongPassword: boolean;
  };
}
```

#### Environment Variables
- `AUTH_JWT_COOKIE_NAME`: JWT token cookie name (default: `next-auth.jwt-token`)
- `AUTH_SESSION_COOKIE_NAME`: Session token cookie name (default: `next-auth.session-token`)
- `JWT_SECRET`: JWT signing secret (required for production)
- `JWT_EXPIRES_IN`: JWT expiration time (default: `24h`)
- `SESSION_EXPIRES_IN`: Session expiration time (default: `7d`)
- `SESSION_SAME_SITE`: Session cookie SameSite attribute (default: `lax`)

### **3. Updated Middleware**

#### RolePermissionsMiddleware
```typescript
export class RolePermissionsMiddleware {
  async verifyAuth(cookie: CookieObject): Promise<AuthResult>
  async checkEndpointPermission(cookie: CookieObject, endpoint: string): Promise<PermissionResult>
  async checkQueuePermission(cookie: CookieObject, station: string): Promise<PermissionResult>
  async checkAnyQueuePermission(cookie: CookieObject): Promise<PermissionResult>
  async checkAdminRights(cookie: CookieObject): Promise<PermissionResult>
}
```

#### AuthMiddleware
```typescript
export class AuthMiddleware {
  async verifyAuth(cookie: CookieObject): Promise<AuthResult>
  async checkAdminRights(cookie: CookieObject): Promise<PermissionResult>
}
```

## 🔧 **Implementation Details**

### **Before (Problematic)**
```typescript
// Hardcoded cookie name and any type
async verifyAuth(cookie: any) {
  const jwtToken = cookie["next-auth.jwt-token"]?.value;
  // ... rest of implementation
}
```

### **After (Improved)**
```typescript
// Proper types and configurable cookie names
async verifyAuth(cookie: CookieObject): Promise<AuthResult> {
  const cookieNames = getCookieNames();
  const jwtToken = extractJwtToken(cookie, cookieNames.jwtToken);
  // ... rest of implementation
}
```

### **Configuration Usage**
```typescript
// Get cookie names from environment or defaults
const cookieNames = getCookieNames();
// Returns: { jwtToken: 'next-auth.jwt-token', sessionToken: 'next-auth.session-token' }

// Get JWT configuration
const jwtConfig = getJWTConfig();
// Returns: { secret: '...', expiresIn: '24h', issuer: 'sn-clinic', audience: 'sn-clinic-users' }

// Get session configuration
const sessionConfig = getSessionConfig();
// Returns: { expiresIn: '7d', secure: false, httpOnly: true, sameSite: 'lax' }
```

## 📁 **Files Modified**

### **New Files Created**
1. `/src/types/auth.ts` - Type definitions and helper functions
2. `/src/config/auth.ts` - Configuration management
3. `env.example` - Environment variable documentation

### **Files Updated**
1. `/src/middleware/RolePermissionsMiddleware.ts` - Updated to use new types and config
2. `/src/middleware/AuthMiddleware.ts` - Updated to use new types and config
3. `/src/controllers/AuthController.ts` - Updated cookie handling

## 🚀 **Benefits Achieved**

### **1. Type Safety**
- ✅ Proper TypeScript interfaces for all cookie objects
- ✅ Type guards for runtime type checking
- ✅ Compile-time error detection for cookie access

### **2. Configuration Flexibility**
- ✅ Cookie names configurable via environment variables
- ✅ JWT settings configurable via environment variables
- ✅ Session settings configurable via environment variables
- ✅ Security settings configurable via environment variables

### **3. Reduced Coupling**
- ✅ Authentication logic no longer depends on hardcoded cookie names
- ✅ Easy to change cookie names without code changes
- ✅ Centralized configuration management

### **4. Better Error Handling**
- ✅ Standardized authentication result types
- ✅ Consistent error messages and status codes
- ✅ Type-safe error handling

### **5. Maintainability**
- ✅ Single source of truth for authentication configuration
- ✅ Easy to add new authentication features
- ✅ Clear separation of concerns

## 🔍 **Usage Examples**

### **Environment Configuration**
```bash
# .env file
AUTH_JWT_COOKIE_NAME=my-app.jwt-token
AUTH_SESSION_COOKIE_NAME=my-app.session-token
JWT_SECRET=my-super-secret-key
JWT_EXPIRES_IN=48h
SESSION_SAME_SITE=strict
```

### **Middleware Usage**
```typescript
// In route handlers
app.get('/protected', async ({ cookie }) => {
  const authMiddleware = new AuthMiddleware();
  const result = await authMiddleware.verifyAuth(cookie);
  
  if (!result.success) {
    return { error: result.message, statusCode: result.statusCode };
  }
  
  // User is authenticated, proceed with request
  return { userId: result.userId };
});
```

### **Permission Checking**
```typescript
// Check specific endpoint permissions
const roleMiddleware = new RolePermissionsMiddleware();
const permission = await roleMiddleware.checkEndpointPermission(cookie, 'admin/users');

if (!permission.success) {
  return { error: permission.message, statusCode: permission.statusCode };
}

// User has permission, proceed
return { userId: permission.userId, role: permission.role };
```

## 🧪 **Testing Considerations**

### **Unit Tests**
- Test cookie extraction with different cookie formats
- Test configuration loading with various environment variables
- Test type guards with different input types

### **Integration Tests**
- Test authentication flow with custom cookie names
- Test middleware with different cookie configurations
- Test error handling with invalid tokens

### **Environment Testing**
- Test with different environment configurations
- Test configuration validation
- Test fallback to default values

## 📋 **Migration Guide**

### **For Existing Code**
1. Replace `any` cookie parameters with `CookieObject`
2. Replace hardcoded cookie names with `getCookieNames()`
3. Use `extractJwtToken()` helper function
4. Update error handling to use new result types

### **For New Code**
1. Always use `CookieObject` type for cookie parameters
2. Use configuration functions instead of hardcoded values
3. Use helper functions for cookie extraction
4. Follow the established authentication patterns

## 🔮 **Future Enhancements**

### **Planned Improvements**
1. **Cookie Encryption**: Add support for encrypted cookies
2. **Multi-Factor Authentication**: Extend types for MFA support
3. **Session Management**: Add Redis-based session storage
4. **Rate Limiting**: Integrate with authentication middleware
5. **Audit Logging**: Add authentication event logging

### **Configuration Extensions**
1. **Cookie Domains**: Support for different cookie domains
2. **Path Restrictions**: Configurable cookie paths
3. **Secure Flags**: Environment-based security settings
4. **Custom Claims**: Configurable JWT claims

This refactor significantly improves the authentication system's type safety, configurability, and maintainability while maintaining backward compatibility and following TypeScript best practices.
