# Enhanced Cache System with Namespace + Context

## Overview

ระบบ cache ใหม่ใช้ **namespace + context key** เป็นค่าเริ่มต้นสำหรับข้อมูลอ่านบ่อย และมี **selective cache clearing** สำหรับข้อมูลอ่อนไหว

## Key Features

### 1. Namespace-based Cache Keys
- แยก cache ตามประเภทข้อมูล (products, users, queue, triage, etc.)
- ป้องกัน cache collision ระหว่างหน้าต่างๆ
- รองรับ TTL ที่แตกต่างกันตามประเภทข้อมูล

### 2. Context-based Cache Isolation
- แยก cache ตามหน้า/feature (dashboard:queue, queue:triage, etc.)
- ป้องกันการแชร์ข้อมูลระหว่างหน้าต่างๆ
- รองรับการใช้งานหลายหน้าพร้อมกัน

### 3. Selective Cache Clearing
- **Sensitive Data**: ล้างเมื่อเปลี่ยนหน้า (user, auth, session)
- **Auth Scope**: ล้างเมื่อ login/logout/เปลี่ยน role
- **Navigation**: ล้างเฉพาะข้อมูลที่จำเป็น

## Cache Configuration

```typescript
export const CACHE_CONFIG = {
  PRODUCTS: { TTL: 2 * 60 * 1000, NAMESPACE: 'products' },
  CATEGORIES: { TTL: 10 * 60 * 1000, NAMESPACE: 'categories' },
  USER_DATA: { TTL: 5 * 60 * 1000, NAMESPACE: 'user' },
  QUEUE: { TTL: 30 * 1000, NAMESPACE: 'queue' },
  PATIENTS: { TTL: 2 * 60 * 1000, NAMESPACE: 'patients' },
  ORDERS: { TTL: 1 * 60 * 1000, NAMESPACE: 'orders' },
  TRIAGE: { TTL: 30 * 1000, NAMESPACE: 'triage' }
}

export const CACHE_CONTEXTS = {
  DASHBOARD_QUEUE: 'dashboard:queue',
  QUEUE_TRIAGE: 'queue:triage',
  QUEUE_DOCTOR: 'queue:doctor',
  QUEUE_CASHIER: 'queue:cashier',
  DASHBOARD_PATIENTS: 'dashboard:patients',
  DASHBOARD_ORDERS: 'dashboard:orders',
  DASHBOARD_INVENTORY: 'dashboard:inventory',
  DASHBOARD_POS: 'dashboard:pos',
  DASHBOARD_REPORTS: 'dashboard:reports',
  DASHBOARD_ADMIN: 'dashboard:admin',
  DEFAULT: 'default'
}
```

## Usage Examples

### 1. Basic Page with Cache Context

```typescript
import { useCacheContext } from '@/hooks/useCacheContext';

export default function QueueManagementPage() {
  const { currentContext } = useCacheContext();
  
  // Cache context จะถูกตั้งค่าอัตโนมัติตาม pathname
  // dashboard/queue -> 'dashboard:queue'
  // queue/triage -> 'queue:triage'
  
  return <div>...</div>;
}
```

### 2. Sensitive Data Page (Optimized)

```typescript
import { useCacheContext, useSensitiveDataCache } from '@/hooks/useCacheContext';

export default function UserManagementPage() {
  const { currentContext } = useCacheContext();
  
  // Optimized: Only clear cache on unmount, not on mount
  useSensitiveDataCache({ 
    clearOnMount: false,    // Don't clear on mount (avoids redundant clearing)
    clearOnUnmount: true    // Clear on unmount for security
  });
  
  // Cache is automatically managed based on navigation patterns
  return <div>...</div>;
}
```

### 3. Form with Sensitive Data (Debounced Clearing)

```typescript
import { useFormDataCache } from '@/hooks/useCacheContext';

export default function PatientForm({ patientData }) {
  // Clear cache only when form data significantly changes
  useFormDataCache(patientData, {
    clearOnUnmount: true,
    debounceMs: 2000  // Wait 2 seconds before clearing
  });
  
  return <form>...</form>;
}
```

### 4. User-Specific Data (Selective Clearing)

```typescript
import { useUserDataCache } from '@/hooks/useCacheContext';

export default function UserProfile({ userId }) {
  // Only clear cache when switching between different users
  const { clearUserCache } = useUserDataCache(userId);
  
  return <div>...</div>;
}
```

### 5. Manual Cache Control

```typescript
import { useManualCacheControl } from '@/hooks/useCacheContext';

export default function AdminPanel() {
  const { clearSensitiveCache, getCacheStats } = useManualCacheControl();
  
  const handleClearCache = () => {
    clearSensitiveCache();
  };
  
  return <div>...</div>;
}
```

### 3. Auth-related Operations

```typescript
import { useAuthCacheManager } from '@/utils/cacheManager';

export default function LoginPage() {
  const { onLogin, onLogout, onRoleChange } = useAuthCacheManager();
  
  const handleLogin = async () => {
    // ... login logic
    onLogin(); // ล้าง auth scope cache
  };
  
  const handleLogout = () => {
    onLogout(); // ล้าง auth + sensitive cache
  };
  
  return <div>...</div>;
}
```

## Cache Key Format

```
{namespace}:{context}:{operation}:{variables}
```

### Examples:
- `queue:dashboard:queue:GetQueueTickets:{"skip":0,"take":100}`
- `triage:queue:triage:GetTriageQueue:{"skip":0,"take":100}`
- `user:dashboard:admin:GetAllUsers:{"filter":{},"pagination":{"skip":0,"take":50}}`

## Benefits

### 1. ป้องกัน Cache Collision
- หน้า queue management และ triage จะมี cache แยกกัน
- ไม่มีการแชร์ข้อมูลระหว่างหน้าต่างๆ

### 2. Performance Optimization
- ข้อมูลอ่านบ่อย (products, categories) มี TTL นาน
- ข้อมูลเปลี่ยนแปลงบ่อย (queue, orders) มี TTL สั้น

### 3. Security & Privacy
- ข้อมูลอ่อนไหวถูกล้างเมื่อเปลี่ยนหน้า
- Auth scope cache ถูกล้างเมื่อเปลี่ยนสิทธิ์

### 4. Developer Experience
- ใช้งานง่ายด้วย hooks
- ไม่ต้องจัดการ cache manually
- Debugging ง่ายขึ้นด้วย namespace

## Migration Guide

### Before (Old System)
```typescript
// Cache key: "GetTriageQueue:{\"skip\":0,\"take\":100}"
// ใช้ร่วมกันทุกหน้า
```

### After (New System)
```typescript
// Cache key: "triage:queue:triage:GetTriageQueue:{\"skip\":0,\"take\":100}"
// แยกตาม namespace และ context
```

## Debugging

```typescript
import { GraphQLAPI } from '@/clients/graphql';

// ดู cache stats
console.log(GraphQLAPI.getContext());

// ล้าง cache เฉพาะ context
GraphQLAPI.clearContextCache();

// ล้าง cache เฉพาะ namespace
GraphQLAPI.clearSensitiveCache();
```

## Performance Optimizations

### Cache Clearing Strategy
- **Smart Navigation Detection**: Only clears cache when entering sensitive pages from non-sensitive pages
- **Time-based Throttling**: Prevents excessive clearing with 5-minute cooldown periods
- **Selective Clearing**: Different hooks for different use cases (forms, user data, manual control)
- **Debounced Operations**: Form data changes are debounced to avoid excessive cache clearing

### Performance Benefits
- **Reduced Cache Thrashing**: Eliminates redundant cache clearing operations
- **Better User Experience**: Faster page loads due to preserved cache when appropriate
- **Memory Efficiency**: Prevents unnecessary cache rebuilds
- **Network Optimization**: Reduces redundant API calls

## Best Practices

1. **ใช้ `useCacheContext()` ในทุกหน้า** - ตั้งค่า context อัตโนมัติ
2. **ใช้ `useSensitiveDataCache()` อย่างระมัดระวัง** - กำหนด options ตามความเหมาะสม
3. **ใช้ `useFormDataCache()` สำหรับฟอร์ม** - มี debouncing และ selective clearing
4. **ใช้ `useUserDataCache()` สำหรับข้อมูลผู้ใช้** - clear เฉพาะเมื่อเปลี่ยน user
5. **ใช้ `useManualCacheControl()` เมื่อต้องการควบคุมเอง** - สำหรับกรณีพิเศษ
6. **หลีกเลี่ยงการ clear cache บ่อยเกินไป** - ใช้ time-based throttling
5. **ใช้ TTL ที่เหมาะสม** - ข้อมูลเปลี่ยนแปลงบ่อยใช้ TTL สั้น
