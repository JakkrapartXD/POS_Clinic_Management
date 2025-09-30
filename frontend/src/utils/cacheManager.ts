import { GraphQLAPI } from '@/clients/graphql';
import { CACHE_CONTEXTS } from '@/lib/cache';

/**
 * Determines the appropriate cache context based on the current pathname
 * @param pathname - The current pathname to match against
 * @returns The corresponding cache context
 */
export function getCacheContextFromPathname(pathname: string): string {
  if (pathname.includes('/dashboard/queue')) {
    return CACHE_CONTEXTS.DASHBOARD_QUEUE;
  } else if (pathname.includes('/queue/triage')) {
    return CACHE_CONTEXTS.QUEUE_TRIAGE;
  } else if (pathname.includes('/queue/doctor')) {
    return CACHE_CONTEXTS.QUEUE_DOCTOR;
  } else if (pathname.includes('/queue/cashier')) {
    return CACHE_CONTEXTS.QUEUE_CASHIER;
  } else if (pathname.includes('/dashboard/patients')) {
    return CACHE_CONTEXTS.DASHBOARD_PATIENTS;
  } else if (pathname.includes('/dashboard/orders')) {
    return CACHE_CONTEXTS.DASHBOARD_ORDERS;
  } else if (pathname.includes('/dashboard/inventory')) {
    return CACHE_CONTEXTS.DASHBOARD_INVENTORY;
  } else if (pathname.includes('/dashboard/pos')) {
    return CACHE_CONTEXTS.DASHBOARD_POS;
  } else if (pathname.includes('/dashboard/reports')) {
    return CACHE_CONTEXTS.DASHBOARD_REPORTS;
  } else if (pathname.includes('/dashboard/admin')) {
    return CACHE_CONTEXTS.DASHBOARD_ADMIN;
  }
  
  return CACHE_CONTEXTS.DEFAULT;
}

/**
 * Cache Manager utility for handling cache operations across the application
 */
export class CacheManager {
  /**
   * Clear cache when user logs in
   */
  static onLogin(): void {
    GraphQLAPI.clearAuthScopeCache();
    GraphQLAPI.setContext(CACHE_CONTEXTS.DEFAULT);
  }

  /**
   * Clear cache when user logs out
   */
  static onLogout(): void {
    GraphQLAPI.clearAuthScopeCache();
    GraphQLAPI.clearSensitiveCache();
    GraphQLAPI.setContext(CACHE_CONTEXTS.DEFAULT);
  }

  /**
   * Clear cache when user role changes
   */
  static onRoleChange(): void {
    GraphQLAPI.clearAuthScopeCache();
    GraphQLAPI.clearSensitiveCache();
  }

  /**
   * Clear cache when navigating to sensitive pages
   */
  static onSensitiveNavigation(): void {
    GraphQLAPI.clearSensitiveCache();
  }

  /**
   * Set context for specific page/feature
   */
  static setPageContext(pathname: string): void {
    const context = getCacheContextFromPathname(pathname);
    GraphQLAPI.setContext(context);
  }

  /**
   * Get cache statistics for debugging
   */
  static getCacheStats() {
    return {
      currentContext: GraphQLAPI.getContext(),
      // Note: We would need to expose cache stats from GraphQLAPI if needed
    };
  }
}

/**
 * Hook for auth-related cache management
 */
export function useAuthCacheManager() {
  return {
    onLogin: CacheManager.onLogin,
    onLogout: CacheManager.onLogout,
    onRoleChange: CacheManager.onRoleChange,
  };
}

/**
 * Hook for navigation-related cache management
 */
export function useNavigationCacheManager() {
  return {
    onSensitiveNavigation: CacheManager.onSensitiveNavigation,
    setPageContext: CacheManager.setPageContext,
  };
}
