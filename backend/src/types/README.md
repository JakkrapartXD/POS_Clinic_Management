# Authentication Types Quick Reference

This directory contains TypeScript type definitions for the authentication system.

## 📁 **Files**

- `auth.ts` - Core authentication types and helper functions

## 🔧 **Quick Usage**

### **Import Types**
```typescript
import { 
  CookieObject, 
  AuthResult, 
  PermissionResult,
  extractJwtToken 
} from '../types/auth';
```

### **Import Configuration**
```typescript
import { 
  getCookieNames, 
  getAuthConfig, 
  getJWTConfig 
} from '../config/auth';
```

## 🎯 **Common Patterns**

### **Cookie Handling**
```typescript
// Get cookie names from configuration
const cookieNames = getCookieNames();

// Extract JWT token safely
const jwtToken = extractJwtToken(cookie, cookieNames.jwtToken);

// Type-safe cookie access
if (jwtToken) {
  // Token is available
}
```

### **Authentication Results**
```typescript
const authResult = await middleware.verifyAuth(cookie);

if (authResult.success) {
  // TypeScript knows this is AuthSuccess
  console.log('User ID:', authResult.userId);
} else {
  // TypeScript knows this is AuthFailure
  console.log('Error:', authResult.message);
  console.log('Status:', authResult.statusCode);
}
```

### **Permission Checking**
```typescript
const permission = await middleware.checkEndpointPermission(cookie, 'admin/users');

if (permission.success) {
  // TypeScript knows this is PermissionSuccess
  console.log('User ID:', permission.userId);
  console.log('Role:', permission.role);
} else {
  // TypeScript knows this is PermissionFailure
  console.log('Access denied:', permission.message);
}
```

## 🔍 **Type Guards**

### **Cookie Value Checking**
```typescript
import { isCookieValue, isString } from '../types/auth';

const cookieValue = cookie['some-cookie'];

if (isString(cookieValue)) {
  // cookieValue is string
} else if (isCookieValue(cookieValue)) {
  // cookieValue is CookieValue object
  console.log('Value:', cookieValue.value);
  console.log('Expires:', cookieValue.expires);
}
```

## ⚙️ **Configuration**

### **Environment Variables**
```bash
# Cookie names
AUTH_JWT_COOKIE_NAME=next-auth.jwt-token
AUTH_SESSION_COOKIE_NAME=next-auth.session-token

# JWT settings
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=24h
JWT_ISSUER=sn-clinic
JWT_AUDIENCE=sn-clinic-users

# Session settings
SESSION_EXPIRES_IN=7d
SESSION_SAME_SITE=lax
```

### **Configuration Access**
```typescript
import { getAuthConfig, getCookieNames, getJWTConfig } from '../config/auth';

// Get full configuration
const config = getAuthConfig();

// Get specific parts
const cookieNames = getCookieNames();
const jwtConfig = getJWTConfig();
```

## 🚨 **Common Mistakes to Avoid**

### **❌ Don't Use `any` Type**
```typescript
// BAD
async verifyAuth(cookie: any) {
  const token = cookie["hardcoded-name"]?.value;
}

// GOOD
async verifyAuth(cookie: CookieObject): Promise<AuthResult> {
  const cookieNames = getCookieNames();
  const token = extractJwtToken(cookie, cookieNames.jwtToken);
}
```

### **❌ Don't Hardcode Cookie Names**
```typescript
// BAD
const token = cookie["next-auth.jwt-token"]?.value;

// GOOD
const cookieNames = getCookieNames();
const token = extractJwtToken(cookie, cookieNames.jwtToken);
```

### **❌ Don't Ignore Type Safety**
```typescript
// BAD
const result = await verifyAuth(cookie);
if (result.success) {
  // Accessing properties without type checking
  console.log(result.userId); // Could be undefined
}

// GOOD
const result = await verifyAuth(cookie);
if (result.success) {
  // TypeScript knows result.userId exists
  console.log(result.userId);
}
```

## 📚 **Further Reading**

- See `AUTHENTICATION_REFACTOR.md` for detailed documentation
- See `env.example` for all available environment variables
- See middleware files for implementation examples
