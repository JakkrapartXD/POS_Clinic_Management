# Cache Invalidation Refactor

This document describes the refactoring of timeout-based cache invalidation to use proper state management and cache invalidation callbacks, eliminating race conditions and unpredictable behavior.

## 🎯 **Problems Addressed**

### **1. Race Conditions**
- **Problem**: Arbitrary 100ms timeouts created unpredictable timing
- **Solution**: Replaced with proper cache invalidation callbacks

### **2. Unpredictable Behavior**
- **Problem**: Timeouts could fire at wrong times or not at all
- **Solution**: Implemented deterministic cache invalidation flow

### **3. Poor State Management**
- **Problem**: Local state updates and cache invalidation were disconnected
- **Solution**: Created atomic state updates with cache invalidation

### **4. Inconsistent Error Handling**
- **Problem**: Timeout failures were not properly handled
- **Solution**: Implemented proper error handling in cache operations

## 🏗️ **New Architecture**

### **1. Queue Cache Management Hook** (`/src/hooks/useQueueCache.ts`)

#### **Core Features**
```typescript
export function useQueueCache(options: QueueCacheOptions = {}) {
  const {
    invalidateCache = true,
    forceRefresh = true,
    onCacheInvalidated,
    enableLogging = true
  } = options;

  return {
    invalidateQueueCache,
    executeQueueOperation,
    updateStateAndCache,
    batchInvalidateCache
  };
}
```

#### **Key Methods**

##### **`executeQueueOperation`**
```typescript
const executeQueueOperation = async <T>(
  operation: () => Promise<T>,
  operationName: string,
  context?: string
): Promise<QueueOperationResult<T>>
```
- Executes queue operations with proper error handling
- Automatically invalidates cache after successful operations
- Returns structured results with success/error status

##### **`updateStateAndCache`**
```typescript
const updateStateAndCache = async <T>(
  stateUpdater: (prev: T[]) => T[],
  setState: React.Dispatch<React.SetStateAction<T[]>>,
  operationName: string,
  context?: string
): Promise<QueueOperationResult>
```
- Updates local state immediately for responsive UI
- Invalidates cache in the background
- Ensures atomic state and cache consistency

##### **`invalidateQueueCache`**
```typescript
const invalidateQueueCache = async (
  operation: string, 
  context?: string
): Promise<boolean>
```
- Clears queue-related cache entries
- Uses proper GraphQL cache invalidation methods
- Provides logging and error handling

## 🔧 **Implementation Details**

### **Before (Problematic)**
```typescript
// Race condition prone approach
const callTicket = async (ticketId: string) => {
  try {
    await GraphQLAPI.queueCall(ticketId);
    
    // Update state immediately
    setTriageTickets(prev => prev.map(ticket => 
      ticket.id === ticketId 
        ? { ...ticket, status: 'called', called_at: new Date().toISOString() }
        : ticket
    ));
    
    // Unreliable cache invalidation with arbitrary timeout
    setTimeout(() => {
      fetchTriageQueue(true); // Could fire at wrong time or not at all
    }, 100);
    
    toast.success('เรียกผู้ป่วยแล้ว');
  } catch (error) {
    // Error handling
  }
};
```

### **After (Improved)**
```typescript
// Deterministic, race-condition-free approach
const callTicket = async (ticketId: string) => {
  try {
    setIsUpdating(ticketId);
    
    // Execute queue operation with proper cache invalidation
    const result = await executeQueueOperation(
      () => GraphQLAPI.queueCall(ticketId),
      'queueCall',
      'triage'
    );
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to call ticket');
    }
    
    // Update state immediately with proper cache invalidation
    await updateStateAndCache(
      (prev) => prev.map(ticket => 
        ticket.id === ticketId 
          ? { ...ticket, status: 'called', called_at: new Date().toISOString() }
          : ticket
      ),
      setTriageTickets,
      'queueCall',
      'triage'
    );
    
    toast.success('เรียกผู้ป่วยแล้ว');
  } catch (error: any) {
    console.error('Error calling ticket:', error);
    toast.error(error.message || 'ไม่สามารถเรียกผู้ป่วยได้');
  } finally {
    setIsUpdating(null);
  }
};
```

## 📁 **Files Modified**

### **New Files Created**
1. `/src/hooks/useQueueCache.ts` - Queue cache management hook

### **Files Updated**
1. `/src/app/queue/triage/page.tsx` - Replaced all timeout-based cache invalidation

## 🚀 **Benefits Achieved**

### **1. Eliminated Race Conditions**
- ✅ **Deterministic Timing**: Cache invalidation happens immediately after operations
- ✅ **Atomic Operations**: State updates and cache invalidation are synchronized
- ✅ **Predictable Behavior**: No more arbitrary timeouts

### **2. Improved Error Handling**
- ✅ **Structured Results**: All operations return success/error status
- ✅ **Proper Error Propagation**: Errors are properly caught and handled
- ✅ **Logging Integration**: All cache operations are logged for debugging

### **3. Better State Management**
- ✅ **Immediate UI Updates**: Local state updates happen instantly
- ✅ **Background Cache Invalidation**: Cache is updated without blocking UI
- ✅ **Consistent State**: State and cache are always in sync

### **4. Enhanced Developer Experience**
- ✅ **Type Safety**: Full TypeScript support with proper types
- ✅ **Reusable Hook**: Can be used across different queue components
- ✅ **Configurable Options**: Flexible configuration for different use cases

## 🔍 **Cache Invalidation Strategy**

### **Multi-Level Cache Invalidation**
```typescript
// 1. Clear all queue-related cache
GraphQLAPI.clearAllQueueCache();

// 2. Invalidate specific namespaces
GraphQLAPI.invalidateCacheByNamespace('queue');
GraphQLAPI.invalidateCacheByNamespace('triage');

// 3. Invalidate specific operations
GraphQLAPI.invalidateCache(operationName);
```

### **Context-Aware Invalidation**
```typescript
// Invalidate with specific context
GraphQLAPI.invalidateCacheByNamespaceContext('queue', 'triage');
```

## 📊 **Performance Improvements**

### **Before (Inefficient)**
- ❌ **Arbitrary Delays**: 100ms delays on every operation
- ❌ **Unnecessary Refetches**: Cache invalidation triggered regardless of success
- ❌ **Race Conditions**: Multiple timeouts could conflict

### **After (Optimized)**
- ✅ **Immediate Operations**: No artificial delays
- ✅ **Selective Invalidation**: Only invalidate when operations succeed
- ✅ **Batch Operations**: Multiple cache invalidations can be batched

## 🧪 **Testing Considerations**

### **Unit Tests**
- Test cache invalidation hooks with different configurations
- Test error handling in cache operations
- Test state update and cache invalidation synchronization

### **Integration Tests**
- Test queue operations with cache invalidation
- Test multiple concurrent operations
- Test error scenarios and recovery

### **Performance Tests**
- Measure cache invalidation performance
- Test with large datasets
- Compare with previous timeout-based approach

## 🔮 **Future Enhancements**

### **Planned Improvements**
1. **Optimistic Updates**: Update UI before server confirmation
2. **Conflict Resolution**: Handle concurrent modifications
3. **Cache Warming**: Pre-populate cache for better performance
4. **Selective Invalidation**: More granular cache invalidation

### **Advanced Features**
1. **Real-time Updates**: WebSocket-based cache invalidation
2. **Offline Support**: Cache invalidation for offline scenarios
3. **Batch Operations**: Group multiple operations for efficiency
4. **Cache Analytics**: Monitor cache hit/miss ratios

## 📋 **Migration Guide**

### **For Existing Code**
1. Import the `useQueueCache` hook
2. Replace `setTimeout` patterns with `executeQueueOperation`
3. Use `updateStateAndCache` for state updates
4. Remove arbitrary timeout delays

### **For New Code**
1. Always use the queue cache hook for queue operations
2. Follow the established patterns for state management
3. Use proper error handling with structured results
4. Leverage logging for debugging

## 🎉 **Results**

### **Before (Issues)**
- ❌ Race conditions with arbitrary timeouts
- ❌ Unpredictable cache invalidation timing
- ❌ Poor error handling for cache operations
- ❌ Disconnected state and cache management

### **After (Fixed)**
- ✅ Deterministic cache invalidation flow
- ✅ Atomic state and cache updates
- ✅ Proper error handling and logging
- ✅ Consistent and predictable behavior
- ✅ Better performance and user experience

This refactor eliminates the unreliable timeout-based cache invalidation and replaces it with a robust, deterministic system that ensures data consistency and provides better error handling and performance.
