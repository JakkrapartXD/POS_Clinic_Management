import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { GraphQLAPI } from '@/clients/graphql';
import { CACHE_CONTEXTS } from '@/lib/cache';

/**
 * Hook to manage cache context based on current page/route
 * Automatically sets the appropriate cache context and clears sensitive data on navigation
 */
export function useCacheContext() {
  const pathname = usePathname();

  useEffect(() => {
    // Determine cache context based on current path
    let context = CACHE_CONTEXTS.DEFAULT;
    
    if (pathname.includes('/dashboard/queue')) {
      context = CACHE_CONTEXTS.DASHBOARD_QUEUE;
    } else if (pathname.includes('/queue/triage')) {
      context = CACHE_CONTEXTS.QUEUE_TRIAGE;
    } else if (pathname.includes('/queue/doctor')) {
      context = CACHE_CONTEXTS.QUEUE_DOCTOR;
    } else if (pathname.includes('/queue/cashier')) {
      context = CACHE_CONTEXTS.QUEUE_CASHIER;
    } else if (pathname.includes('/dashboard/patients')) {
      context = CACHE_CONTEXTS.DASHBOARD_PATIENTS;
    } else if (pathname.includes('/dashboard/orders')) {
      context = CACHE_CONTEXTS.DASHBOARD_ORDERS;
    } else if (pathname.includes('/dashboard/inventory')) {
      context = CACHE_CONTEXTS.DASHBOARD_INVENTORY;
    } else if (pathname.includes('/dashboard/pos')) {
      context = CACHE_CONTEXTS.DASHBOARD_POS;
    } else if (pathname.includes('/dashboard/reports')) {
      context = CACHE_CONTEXTS.DASHBOARD_REPORTS;
    } else if (pathname.includes('/dashboard/admin')) {
      context = CACHE_CONTEXTS.DASHBOARD_ADMIN;
    }
    
    // Set the context
    GraphQLAPI.setContext(context);

    // Clear sensitive data when navigating to sensitive pages
    const sensitivePages = [
      '/dashboard/admin',
      '/dashboard/patients',
      '/dashboard/visits'
    ];

    if (sensitivePages.some(page => pathname.includes(page))) {
      GraphQLAPI.clearSensitiveCache();
    }

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
 * Automatically clears sensitive cache when component unmounts
 */
export function useSensitiveDataCache() {
  useEffect(() => {
    // Clear sensitive cache when component mounts
    GraphQLAPI.clearSensitiveCache();

    // Cleanup function - clear sensitive cache when component unmounts
    return () => {
      GraphQLAPI.clearSensitiveCache();
    };
  }, []);
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
