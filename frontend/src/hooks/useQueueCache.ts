/**
 * Queue Cache Management Hook
 * 
 * This hook provides proper cache invalidation and state management for queue operations
 * without relying on arbitrary timeouts that can cause race conditions.
 */

import { useCallback } from 'react';
import { GraphQLAPI } from '@/clients/graphql';
import { logger } from '@/lib/logger';

export interface QueueCacheOptions {
  /**
   * Whether to invalidate cache after operations
   * @default true
   */
  invalidateCache?: boolean;
  
  /**
   * Whether to force refresh data after cache invalidation
   * @default true
   */
  forceRefresh?: boolean;
  
  /**
   * Custom cache invalidation callback
   */
  onCacheInvalidated?: () => void | Promise<void>;
  
  /**
   * Whether to log cache operations
   * @default true
   */
  enableLogging?: boolean;
}

export interface QueueOperationResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  cacheInvalidated?: boolean;
}

export function useQueueCache(options: QueueCacheOptions = {}) {
  const {
    invalidateCache = true,
    forceRefresh = true,
    onCacheInvalidated,
    enableLogging = true
  } = options;

  /**
   * Invalidate queue-related cache entries
   */
  const invalidateQueueCache = useCallback(async (operation: string, context?: string) => {
    try {
      if (enableLogging) {
        logger.debug(`Invalidating queue cache for operation: ${operation}`, { context }, 'QUEUE_CACHE');
      }

      // Clear queue-related cache entries
      GraphQLAPI.clearAllQueueCache();
      
      // Invalidate specific queue operations
      GraphQLAPI.invalidateCacheByNamespace('queue');
      GraphQLAPI.invalidateCacheByNamespace('triage');
      
      // Invalidate specific operation if provided
      if (operation) {
        GraphQLAPI.invalidateCache(operation);
      }

      if (enableLogging) {
        logger.debug('Queue cache invalidated successfully', { operation, context }, 'QUEUE_CACHE');
      }

      // Call custom callback if provided
      if (onCacheInvalidated) {
        await onCacheInvalidated();
      }

      return true;
    } catch (error) {
      if (enableLogging) {
        logger.error('Failed to invalidate queue cache', error as Error, 'QUEUE_CACHE');
      }
      return false;
    }
  }, [onCacheInvalidated, enableLogging]);

  /**
   * Execute a queue operation with proper cache invalidation
   */
  const executeQueueOperation = useCallback(async <T>(
    operation: () => Promise<T>,
    operationName: string,
    context?: string
  ): Promise<QueueOperationResult<T>> => {
    try {
      if (enableLogging) {
        logger.debug(`Executing queue operation: ${operationName}`, { context }, 'QUEUE_CACHE');
      }

      // Execute the operation
      const result = await operation();

      // Invalidate cache if enabled
      let cacheInvalidated = false;
      if (invalidateCache) {
        cacheInvalidated = await invalidateQueueCache(operationName, context);
      }

      if (enableLogging) {
        logger.debug(`Queue operation completed: ${operationName}`, { 
          success: true, 
          cacheInvalidated 
        }, 'QUEUE_CACHE');
      }

      return {
        success: true,
        data: result,
        cacheInvalidated
      };
    } catch (error: any) {
      if (enableLogging) {
        logger.error(`Queue operation failed: ${operationName}`, error, 'QUEUE_CACHE');
      }

      return {
        success: false,
        error: error.message || 'Operation failed',
        cacheInvalidated: false
      };
    }
  }, [invalidateCache, invalidateQueueCache, enableLogging]);

  /**
   * Update local state and invalidate cache atomically
   */
  const updateStateAndCache = useCallback(async <T>(
    stateUpdater: (prev: T[]) => T[],
    setState: React.Dispatch<React.SetStateAction<T[]>>,
    operationName: string,
    context?: string
  ): Promise<QueueOperationResult> => {
    try {
      // Update local state immediately for responsive UI
      setState(stateUpdater);

      // Invalidate cache in the background
      let cacheInvalidated = false;
      if (invalidateCache) {
        cacheInvalidated = await invalidateQueueCache(operationName, context);
      }

      if (enableLogging) {
        logger.debug(`State updated and cache invalidated: ${operationName}`, { 
          cacheInvalidated 
        }, 'QUEUE_CACHE');
      }

      return {
        success: true,
        cacheInvalidated
      };
    } catch (error: any) {
      if (enableLogging) {
        logger.error(`Failed to update state and cache: ${operationName}`, error, 'QUEUE_CACHE');
      }

      return {
        success: false,
        error: error.message || 'State update failed',
        cacheInvalidated: false
      };
    }
  }, [invalidateCache, invalidateQueueCache, enableLogging]);

  /**
   * Batch multiple cache invalidations
   */
  const batchInvalidateCache = useCallback(async (
    operations: Array<{ operation: string; context?: string }>
  ): Promise<boolean> => {
    try {
      if (enableLogging) {
        logger.debug('Starting batch cache invalidation', { 
          operationCount: operations.length 
        }, 'QUEUE_CACHE');
      }

      // Clear all queue cache first
      GraphQLAPI.clearAllQueueCache();

      // Invalidate specific operations
      for (const { operation, context } of operations) {
        GraphQLAPI.invalidateCache(operation);
        if (context) {
          GraphQLAPI.invalidateCacheByNamespaceContext('queue', context);
        }
      }

      // Call custom callback if provided
      if (onCacheInvalidated) {
        await onCacheInvalidated();
      }

      if (enableLogging) {
        logger.debug('Batch cache invalidation completed', { 
          operationCount: operations.length 
        }, 'QUEUE_CACHE');
      }

      return true;
    } catch (error) {
      if (enableLogging) {
        logger.error('Batch cache invalidation failed', error as Error, 'QUEUE_CACHE');
      }
      return false;
    }
  }, [onCacheInvalidated, enableLogging]);

  return {
    invalidateQueueCache,
    executeQueueOperation,
    updateStateAndCache,
    batchInvalidateCache
  };
}
