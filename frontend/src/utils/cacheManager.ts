import { GraphQLAPI } from '@/clients/graphql';
import { CACHE_CONTEXTS } from '@/lib/cache';

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
