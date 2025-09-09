# Authentication Error Handling System

## Overview

This document describes the comprehensive authentication error handling system implemented in the frontend application. The system automatically detects authentication errors from GraphQL API calls and handles them by clearing cookies and redirecting users to the login page.

## Components

### 1. Authentication Utilities (`/src/utils/auth.ts`)

Core utility functions for handling authentication:

- `clearAuthCookies()`: Removes all authentication-related cookies
- `handleAuthError(error, redirectToLogin)`: Processes authentication errors and triggers redirect
- `isAuthenticated()`: Checks if user has valid authentication cookies
- `forceLogout(redirectToLogin)`: Forces logout and redirects to login

### 2. GraphQL Client Enhancement (`/src/clients/graphql.ts`)

Enhanced GraphQL client with authentication error detection:

- Added `setAuthErrorHandler()` method to set global error handler
- Detects authentication errors in GraphQL responses
- Automatically triggers auth error handler when authentication fails
- Handles both HTTP 401 errors and GraphQL authentication error messages

### 3. AuthProvider Component (`/src/components/providers/auth-provider.tsx`)

Global authentication context provider:

- Provides `logout()` and `handleAuthError()` functions to all child components
- Sets up global GraphQL authentication error handler
- Manages authentication state across the application

### 4. Error Boundary (`/src/components/error-boundary.tsx`)

React error boundary for catching authentication errors:

- Catches any authentication errors that slip through other handlers
- Automatically clears cookies and redirects to login
- Provides fallback UI for non-authentication errors

### 5. Middleware (`/src/middleware.ts`)

Next.js middleware for route protection:

- Protects all `/dashboard/*` routes
- Redirects unauthenticated users to login
- Redirects authenticated users away from login page

## Error Detection

The system detects authentication errors by checking for:

- Error messages containing: "Authentication required", "Unauthorized", "Not authenticated", "Invalid token", "Token expired"
- HTTP status codes: 401
- GraphQL error responses with authentication-related messages

## Implementation in Pages

### Inventory Page (`/src/app/dashboard/inventory/page.tsx`)

```typescript
export default function InventoryPage() {
  const { handleAuthError } = useAuth()
  
  // In error handling:
  if (err instanceof Error && (
    err.message.includes('Authentication required') ||
    err.message.includes('Unauthorized') ||
    // ... other auth error checks
  )) {
    handleAuthError(err)
    return
  }
}
```

### Profile Page (`/src/app/dashboard/profile/page.tsx`)

```typescript
export default function ProfilePage() {
  const { logout, handleAuthError } = useAuth()
  
  // Uses the same error handling pattern
  // Simplified logout using the auth provider
}
```

## Usage

### 1. Using the AuthProvider

Wrap your dashboard layout with the AuthProvider:

```typescript
// In dashboard layout
<AuthProvider>
  <div className="flex h-screen">
    <Sidebar />
    <main>{children}</main>
  </div>
</AuthProvider>
```

### 2. Using the useAuth Hook

```typescript
import { useAuth } from '@/components/providers/auth-provider'

function MyComponent() {
  const { logout, handleAuthError } = useAuth()
  
  // Handle authentication errors
  const handleApiCall = async () => {
    try {
      await someApiCall()
    } catch (err) {
      if (isAuthError(err)) {
        handleAuthError(err)
        return
      }
      // Handle other errors
    }
  }
  
  // Manual logout
  const handleLogout = () => {
    logout()
  }
}
```

### 3. Error Handling in API Calls

```typescript
try {
  const response = await GraphQLAPI.someQuery()
  // Process response
} catch (err) {
  // Check for authentication errors
  if (err instanceof Error && (
    err.message.includes('Authentication required') ||
    err.message.includes('Unauthorized') ||
    err.message.includes('Not authenticated') ||
    err.message.includes('Invalid token') ||
    err.message.includes('Token expired')
  )) {
    handleAuthError(err)
    return
  }
  
  // Handle other errors
  setError(err.message)
}
```

## Flow Diagram

```
User makes API call
       ↓
GraphQL Client processes request
       ↓
Authentication error occurs
       ↓
GraphQL Client detects auth error
       ↓
Triggers AuthProvider error handler
       ↓
AuthProvider clears all cookies
       ↓
Redirects to /login page
       ↓
Middleware prevents access to dashboard
       ↓
User must re-authenticate
```

## Benefits

1. **Automatic Handling**: No need to manually handle authentication errors in every component
2. **Consistent Behavior**: All authentication errors are handled the same way
3. **Security**: Ensures users are properly logged out when authentication fails
4. **User Experience**: Smooth redirect to login without error messages
5. **Maintainability**: Centralized authentication error handling logic

## Testing

To test the authentication error handling:

1. **Expired Token**: Wait for JWT token to expire and make an API call
2. **Invalid Token**: Manually modify cookies to have invalid token
3. **Missing Token**: Clear authentication cookies and try to access dashboard
4. **Backend Auth Error**: Trigger authentication errors from backend

The system should automatically redirect to the login page in all these scenarios.
