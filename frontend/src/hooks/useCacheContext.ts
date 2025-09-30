import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { GraphQLAPI } from '@/clients/graphql';
import { CACHE_CONTEXTS } from '@/lib/cache';
import { getCacheContextFromPathname } from '@/utils/cacheManager';

// Track cache clearing state to avoid redundant operations
const cacheStateTracker = {
  lastSensitiveClear: 0,
  lastContext: '',
  isSensitivePage: false
};

/**
 * Hook to manage cache context based on current page/route
 * Optimized to avoid redundant cache clearing operations
 */
export function useCacheContext() {
  const pathname = usePathname();
  const previousPathname = useRef(pathname);

  useEffect(() => {
    // Determine cache context based on current path
    const context = getCacheContextFromPathname(pathname);
    
    // Set the context
    GraphQLAPI.setContext(context);

    // Define sensitive pages that require cache clearing
    const sensitivePages = [
      '/dashboard/admin',
      '/dashboard/patients',
      '/dashboard/visits'
    ];

    const isCurrentlySensitive = sensitivePages.some(page => pathname.includes(page));
    const wasSensitive = sensitivePages.some(page => previousPathname.current.includes(page));
    
    // Only clear sensitive cache when:
    // 1. Entering a sensitive page from a non-sensitive page
    // 2. Or if it's been more than 5 minutes since last clear
    const shouldClearSensitive = isCurrentlySensitive && 
      (!wasSensitive || Date.now() - cacheStateTracker.lastSensitiveClear > 5 * 60 * 1000);

    if (shouldClearSensitive) {
      GraphQLAPI.clearSensitiveCache();
      cacheStateTracker.lastSensitiveClear = Date.now();
    }

    // Update tracking state
    cacheStateTracker.lastContext = context;
    cacheStateTracker.isSensitivePage = isCurrentlySensitive;
    previousPathname.current = pathname;

  }, [pathname]);

  return {
    currentContext: GraphQLAPI.getContext(),
    clearSensitiveCache: GraphQLAPI.clearSensitiveCache,
    clearAuthScopeCache: GraphQLAPI.clearAuthScopeCache,
    clearContextCache: GraphQLAPI.clearContextCache
  };
}

/**
 * Hook for pages that handle sensitive data or forms with PII
 * Optimized to clear cache only when necessary (on unmount or when data changes)
 */
export function useSensitiveDataCache(options: {
  clearOnMount?: boolean;
  clearOnUnmount?: boolean;
  clearOnDataChange?: boolean;
  dataDependencies?: any[];
} = {}) {
  const {
    clearOnMount = false, // Don't clear on mount by default
    clearOnUnmount = true, // Clear on unmount by default
    clearOnDataChange = false,
    dataDependencies = []
  } = options;

  const hasClearedOnMount = useRef(false);

  useEffect(() => {
    // Only clear on mount if explicitly requested and not already cleared
    if (clearOnMount && !hasClearedOnMount.current) {
      // Check if we're already on a sensitive page (avoid redundant clearing)
      if (!cacheStateTracker.isSensitivePage) {
        GraphQLAPI.clearSensitiveCache();
        cacheStateTracker.lastSensitiveClear = Date.now();
      }
      hasClearedOnMount.current = true;
    }
  }, [clearOnMount]);

  // Handle data change clearing
  useEffect(() => {
    if (clearOnDataChange && dataDependencies.length > 0) {
      GraphQLAPI.clearSensitiveCache();
      cacheStateTracker.lastSensitiveClear = Date.now();
    }
  }, dataDependencies);

  // Cleanup function - clear sensitive cache when component unmounts
  useEffect(() => {
    return () => {
      if (clearOnUnmount) {
        // Only clear if we're leaving a sensitive page or it's been a while
        const timeSinceLastClear = Date.now() - cacheStateTracker.lastSensitiveClear;
        if (cacheStateTracker.isSensitivePage || timeSinceLastClear > 2 * 60 * 1000) {
          GraphQLAPI.clearSensitiveCache();
          cacheStateTracker.lastSensitiveClear = Date.now();
        }
      }
    };
  }, [clearOnUnmount]);
}

/**
 * Hook for auth-related operations
 * Clears auth scope cache when auth state changes
 */
export function useAuthScopeCache() {
  const clearAuthCache = () => {
    GraphQLAPI.clearAuthScopeCache();
  };

  return { clearAuthCache };
}

/**
 * Hook for components that handle user data with selective cache clearing
 * Only clears cache when user data actually changes
 */
export function useUserDataCache(userId?: string) {
  const previousUserId = useRef(userId);

  useEffect(() => {
    // Only clear cache if user ID has changed
    if (userId && previousUserId.current && userId !== previousUserId.current) {
      GraphQLAPI.clearSensitiveCache();
      cacheStateTracker.lastSensitiveClear = Date.now();
    }
    previousUserId.current = userId;
  }, [userId]);

  return {
    clearUserCache: () => {
      GraphQLAPI.clearSensitiveCache();
      cacheStateTracker.lastSensitiveClear = Date.now();
    }
  };
}

/**
 * Hook for forms that handle sensitive data
 * Clears cache only when form data changes or on unmount
 */
export function useFormDataCache(formData: any, options: {
  clearOnUnmount?: boolean;
  debounceMs?: number;
} = {}) {
  const { clearOnUnmount = true, debounceMs = 1000 } = options;
  const previousFormData = useRef(formData);
  const debounceTimeout = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Debounce form data changes to avoid excessive cache clearing
    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }

    debounceTimeout.current = setTimeout(() => {
      const hasSignificantChange = JSON.stringify(formData) !== JSON.stringify(previousFormData.current);
      if (hasSignificantChange) {
        GraphQLAPI.clearSensitiveCache();
        cacheStateTracker.lastSensitiveClear = Date.now();
        previousFormData.current = formData;
      }
    }, debounceMs);

    return () => {
      if (debounceTimeout.current) {
        clearTimeout(debounceTimeout.current);
      }
    };
  }, [formData, debounceMs]);

  useEffect(() => {
    return () => {
      if (clearOnUnmount) {
        GraphQLAPI.clearSensitiveCache();
        cacheStateTracker.lastSensitiveClear = Date.now();
      }
    };
  }, [clearOnUnmount]);
}

/**
 * Hook for components that need to clear cache on specific actions
 * Provides manual control over cache clearing
 */
export function useManualCacheControl() {
  return {
    clearSensitiveCache: () => {
      GraphQLAPI.clearSensitiveCache();
      cacheStateTracker.lastSensitiveClear = Date.now();
    },
    clearAuthScopeCache: GraphQLAPI.clearAuthScopeCache,
    clearContextCache: GraphQLAPI.clearContextCache,
    clearOperationCache: GraphQLAPI.clearOperationCache,
    getCacheStats: () => GraphQLAPI.getCacheStats()
  };
}
