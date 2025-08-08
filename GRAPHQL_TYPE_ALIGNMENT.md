# GraphQL Type Alignment Fix

This document outlines the fixes applied to align frontend TypeScript types with the actual GraphQL schema structure.

## Issue Summary

The frontend client had inconsistent return types and field naming that didn't match the actual GraphQL response structure, causing type mismatches and runtime errors.

## Problems Fixed

### 1. Return Type Structure Alignment

**Problem:** The `getAllUsers` function return type was incorrectly structured.

**Backend GraphQL Schema:**
```graphql
type UsersResponse {
  users: [User!]!
  total: Int!
}

type Query {
  users(filter: UserFilterInput, pagination: PaginationInput): UsersResponse!
}
```

**Frontend GraphQL Query:**
```graphql
query AllUsers($filter: UserFilterInput, $pagination: PaginationInput) {
  users(filter: $filter, pagination: $pagination) {
    users { ... }
    total
  }
}
```

**Actual Response Structure:**
```json
{
  "data": {
    "users": {
      "users": [...],
      "total": 123
    }
  }
}
```

**Fix Applied:**
- ✅ Kept return type as `Promise<{ users: UsersResponse }>` (correct)
- ✅ This properly reflects that GraphQL client returns `data.users` which contains the UsersResponse structure

### 2. Field Name Consistency

**Problem:** Frontend types used camelCase while GraphQL schema uses snake_case.

**Backend GraphQL User Type:**
```graphql
type User {
  id: String!
  username: String!
  email: String!
  role: String!
  status: String!
  created_at: DateTime!
  updated_at: DateTime!
}
```

**Frontend Type (Before Fix):**
```typescript
export interface User {
  id: string;
  username: string;
  email: string;
  role: string;
  status: string;
  createdAt?: string;  // ❌ Wrong field name
  updatedAt?: string;  // ❌ Wrong field name
}
```

**Frontend Type (After Fix):**
```typescript
export interface User {
  id: string;
  username: string;
  email: string;
  role: 'admin' | 'doctor' | 'staff' | 'cashier' | 'pharmacist';
  status: 'active' | 'inactive' | 'suspended';
  created_at?: string;  // ✅ Matches GraphQL schema
  updated_at?: string;  // ✅ Matches GraphQL schema
}
```

### 3. UsersResponse Type Simplification

**Problem:** Frontend UsersResponse had extra fields not present in GraphQL schema.

**Backend GraphQL Type:**
```graphql
type UsersResponse {
  users: [User!]!
  total: Int!
}
```

**Frontend Type (Before Fix):**
```typescript
export interface UsersResponse {
  users: User[];
  total: number;
  page: number;    // ❌ Not in GraphQL schema
  limit: number;   // ❌ Not in GraphQL schema
}
```

**Frontend Type (After Fix):**
```typescript
export interface UsersResponse {
  users: User[];
  total: number;
}
```

### 4. GraphQL Query Field Names

**Problem:** GraphQL queries used camelCase instead of snake_case.

**Query (Before Fix):**
```graphql
query UserProfile {
  me {
    id
    username
    email
    role
    status
    createdAt    # ❌ Wrong field name
    updatedAt    # ❌ Wrong field name
  }
}
```

**Query (After Fix):**
```graphql
query UserProfile {
  me {
    id
    username
    email
    role
    status
    created_at   # ✅ Matches GraphQL schema
    updated_at   # ✅ Matches GraphQL schema
  }
}
```

### 5. Usage Code Updates

**Problem:** Frontend code trying to access old field names.

**Usage (Before Fix):**
```typescript
const localUsers: LocalUser[] = response.users.users.map(user => ({
  id: user.id,
  username: user.username,
  email: user.email,
  role: user.role,
  status: user.status,
  created_at: user.createdAt || new Date().toISOString(),  // ❌ Wrong field access
  updated_at: user.updatedAt || new Date().toISOString()   // ❌ Wrong field access
}))
```

**Usage (After Fix):**
```typescript
const localUsers: LocalUser[] = response.users.users.map(user => ({
  id: user.id,
  username: user.username,
  email: user.email,
  role: user.role,
  status: user.status,
  created_at: user.created_at || new Date().toISOString(),  // ✅ Correct field access
  updated_at: user.updated_at || new Date().toISOString()   // ✅ Correct field access
}))
```

## Files Modified

### Frontend
1. **`frontend/src/types/user.ts`**
   - Fixed field names: `createdAt` → `created_at`, `updatedAt` → `updated_at`
   - Removed extra fields from `UsersResponse`: `page`, `limit`

2. **`frontend/src/clients/graphql.ts`**
   - Fixed GraphQL query field names in `USER_PROFILE` query
   - Return type structure was already correct

3. **`frontend/src/app/dashboard/admin/users/page.tsx`**
   - Fixed field access: `user.createdAt` → `user.created_at`
   - Fixed field access: `user.updatedAt` → `user.updated_at`

## Verification Steps

### 1. Type Consistency Check
```bash
# Check for any remaining camelCase field access
grep -r "\.createdAt\|\.updatedAt" frontend/src/
# Should return no results

# Check for consistent GraphQL field names
grep -r "createdAt\|updatedAt" frontend/src/clients/graphql.ts
# Should return no results
```

### 2. Runtime Testing
1. Test user management page loads without type errors
2. Verify user data displays correctly with proper timestamps
3. Check GraphQL queries return expected structure
4. Ensure no console errors related to undefined fields

### 3. Type Safety
```bash
# Run TypeScript compiler to check for type errors
cd frontend && npm run type-check
```

## Best Practices Going Forward

### 1. Field Naming Convention
- **Backend GraphQL**: Use `snake_case` for consistency with database conventions
- **Frontend Types**: Match backend GraphQL schema exactly
- **Local Transformations**: Convert to camelCase only if needed for UI components

### 2. Type Definition Workflow
1. Define types in GraphQL schema first
2. Generate or manually create matching TypeScript interfaces
3. Ensure GraphQL queries use exact field names from schema
4. Test both compile-time and runtime behavior

### 3. Response Structure Patterns
- GraphQL response: `{ data: { queryName: { ...result } } }`
- Client returns: `{ queryName: { ...result } }`
- Type accordingly: `Promise<{ queryName: ResultType }>`

### 4. Validation Steps
- Compare GraphQL schema types with frontend interfaces
- Test actual API responses against TypeScript types
- Use GraphQL introspection tools to verify schema consistency
- Implement runtime type validation for critical data paths

## Impact

✅ **Fixed Issues:**
- Eliminated type mismatches between frontend and backend
- Resolved runtime errors from undefined field access
- Improved type safety and developer experience
- Ensured consistent field naming across the application

✅ **Performance Benefits:**
- Reduced runtime errors and debugging time
- Better IDE support with accurate type definitions
- Improved maintainability with consistent naming conventions
