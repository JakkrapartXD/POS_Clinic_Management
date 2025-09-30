// Enhanced in-memory cache with namespace and context support
interface CacheEntry<T> {
  data: T
  timestamp: number
  ttl: number // Time to live in milliseconds
  namespace?: string
  context?: string
}

interface CacheKeyOptions {
  namespace?: string
  context?: string
  variables?: any
}

class SimpleCache {
  private cache = new Map<string, CacheEntry<any>>()
  private defaultTTL = 5 * 60 * 1000 // 5 minutes default TTL
  private currentContext: string = 'default'

  // Set current context (e.g., page, user session, etc.)
  setContext(context: string): void {
    this.currentContext = context
  }

  // Get current context
  getContext(): string {
    return this.currentContext
  }

  set<T>(key: string, data: T, ttl?: number, options?: CacheKeyOptions): void {
    const fullKey = this.buildFullKey(key, options)
    this.cache.set(fullKey, {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.defaultTTL,
      namespace: options?.namespace,
      context: options?.context || this.currentContext
    })
  }

  get<T>(key: string, options?: CacheKeyOptions): T | null {
    const fullKey = this.buildFullKey(key, options)
    const entry = this.cache.get(fullKey)
    
    if (!entry) {
      return null
    }

    // Check if entry has expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(fullKey)
      return null
    }

    return entry.data
  }

  has(key: string, options?: CacheKeyOptions): boolean {
    const fullKey = this.buildFullKey(key, options)
    const entry = this.cache.get(fullKey)
    
    if (!entry) {
      return false
    }

    // Check if entry has expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(fullKey)
      return false
    }

    return true
  }

  delete(key: string, options?: CacheKeyOptions): void {
    const fullKey = this.buildFullKey(key, options)
    this.cache.delete(fullKey)
  }

  clear(): void {
    this.cache.clear()
  }

  // Clear cache by namespace (optimized with direct deletion)
  clearNamespace(namespace: string): void {
    for (const [key, entry] of this.cache.entries()) {
      if (entry.namespace === namespace) {
        this.cache.delete(key)
      }
    }
  }

  // Clear cache by context (optimized with direct deletion)
  clearContext(context: string): void {
    for (const [key, entry] of this.cache.entries()) {
      if (entry.context === context) {
        this.cache.delete(key)
      }
    }
  }

  // Clear cache by exact prefix match (more precise than includes)
  clearByPrefix(prefix: string): void {
    for (const key of this.cache.keys()) {
      if (key.startsWith(prefix)) {
        this.cache.delete(key)
      }
    }
  }

  // Clear cache by regex pattern (supports complex patterns)
  clearByRegex(pattern: RegExp): void {
    for (const key of this.cache.keys()) {
      if (pattern.test(key)) {
        this.cache.delete(key)
      }
    }
  }

  // Clear cache by pattern with namespace:context structure
  clearByNamespaceContext(namespace: string, context?: string): void {
    const prefix = context ? `${namespace}:${context}:` : `${namespace}:`
    this.clearByPrefix(prefix)
  }

  // Legacy method for backward compatibility (now uses prefix matching)
  clearPattern(pattern: string): void {
    // Convert simple pattern to prefix if it looks like a namespace:context pattern
    if (pattern.includes(':') && !pattern.includes('*')) {
      this.clearByPrefix(pattern)
    } else {
      // For complex patterns, use regex
      const regexPattern = pattern.replace(/\*/g, '.*')
      this.clearByRegex(new RegExp(regexPattern))
    }
  }

  // Build full cache key with namespace and context
  private buildFullKey(key: string, options?: CacheKeyOptions): string {
    const namespace = options?.namespace || 'default'
    const context = options?.context || this.currentContext
    const variablesStr = options?.variables ? JSON.stringify(options.variables) : ''
    
    return `${namespace}:${context}:${key}:${variablesStr}`
  }

  // Parse cache key to extract components
  parseCacheKey(fullKey: string): { namespace: string; context: string; operation: string; variables: string } | null {
    const parts = fullKey.split(':')
    if (parts.length < 3) return null
    
    return {
      namespace: parts[0],
      context: parts[1],
      operation: parts[2],
      variables: parts.slice(3).join(':') || ''
    }
  }

  // Validate cache key structure
  isValidCacheKey(key: string): boolean {
    const parsed = this.parseCacheKey(key)
    return parsed !== null && Boolean(parsed.namespace) && Boolean(parsed.context) && Boolean(parsed.operation)
  }

  // Get all keys matching a specific namespace and context
  getKeysByNamespaceContext(namespace: string, context?: string): string[] {
    const prefix = context ? `${namespace}:${context}:` : `${namespace}:`
    return Array.from(this.cache.keys()).filter(key => key.startsWith(prefix))
  }

  // Generate cache key for GraphQL queries (backward compatibility)
  generateKey(operation: string, variables?: any, options?: CacheKeyOptions): string {
    return this.buildFullKey(operation, { ...options, variables })
  }

  // Get cache statistics
  getStats() {
    const stats = {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
      namespaces: new Set<string>(),
      contexts: new Set<string>()
    }

    this.cache.forEach(entry => {
      if (entry.namespace) stats.namespaces.add(entry.namespace)
      if (entry.context) stats.contexts.add(entry.context)
    })

    return {
      ...stats,
      namespaces: Array.from(stats.namespaces),
      contexts: Array.from(stats.contexts)
    }
  }
}

// Export singleton instance
export const cache = new SimpleCache()

// Cache configuration for different operations
export const CACHE_CONFIG = {
  PRODUCTS: {
    TTL: 2 * 60 * 1000, // 2 minutes for products
    NAMESPACE: 'products'
  },
  CATEGORIES: {
    TTL: 10 * 60 * 1000, // 10 minutes for categories (rarely change)
    NAMESPACE: 'categories'
  },
  USER_DATA: {
    TTL: 5 * 60 * 1000, // 5 minutes for user data
    NAMESPACE: 'user'
  },
  QUEUE: {
    TTL: 30 * 1000, // 30 seconds for queue data (frequently updated)
    NAMESPACE: 'queue'
  },
  PATIENTS: {
    TTL: 2 * 60 * 1000, // 2 minutes for patient data
    NAMESPACE: 'patients'
  },
  ORDERS: {
    TTL: 1 * 60 * 1000, // 1 minute for orders (frequently updated)
    NAMESPACE: 'orders'
  },
  TRIAGE: {
    TTL: 30 * 1000, // 30 seconds for triage data
    NAMESPACE: 'triage'
  }
}

// Cache contexts for different pages/features
export const CACHE_CONTEXTS = {
  DASHBOARD_QUEUE: 'dashboard:queue',
  QUEUE_TRIAGE: 'triage',
  QUEUE_DOCTOR: 'doctor',
  QUEUE_CASHIER: 'cashier',
  DASHBOARD_PATIENTS: 'dashboard:patients',
  DASHBOARD_ORDERS: 'dashboard:orders',
  DASHBOARD_INVENTORY: 'dashboard:inventory',
  DASHBOARD_POS: 'dashboard:pos',
  DASHBOARD_REPORTS: 'dashboard:reports',
  DASHBOARD_ADMIN: 'dashboard:admin',
  DEFAULT: 'default'
}

// Sensitive data that should be cleared on navigation
export const SENSITIVE_NAMESPACES = [
  'user', // User profile data
  'auth', // Authentication data
  'session' // Session-specific data
]

// Data that should be cleared when auth scope changes
export const AUTH_SCOPE_NAMESPACES = [
  'user',
  'auth',
  'permissions',
  'roles'
]

// Cache key patterns for common operations
export const CACHE_KEY_PATTERNS = {
  // Queue operations
  QUEUE_OPERATIONS: /:GetQueue|:GetTriage|:GetDoctor|:GetCashier/i,
  // Patient operations
  PATIENT_OPERATIONS: /:GetPatient|:SearchPatient|:CreatePatient/i,
  // Product operations
  PRODUCT_OPERATIONS: /:GetProduct|:SearchProduct|:CreateProduct/i,
  // Order operations
  ORDER_OPERATIONS: /:GetOrder|:CreateOrder|:UpdateOrder/i,
  // User operations
  USER_OPERATIONS: /:GetUser|:UpdateUser|:GetProfile/i,
} as const

// Utility functions for cache management
export const CacheUtils = {
  // Check if a key matches a specific operation pattern
  matchesOperation: (key: string, pattern: RegExp): boolean => {
    return pattern.test(key)
  },

  // Get all keys matching a specific operation pattern
  getKeysByOperation: (pattern: RegExp): string[] => {
    return Array.from(cache.getStats().keys).filter(key => pattern.test(key))
  },

  // Clear cache by operation pattern
  clearByOperation: (pattern: RegExp): number => {
    const beforeCount = cache.getStats().size
    cache.clearByRegex(pattern)
    const afterCount = cache.getStats().size
    return beforeCount - afterCount
  },

  // Validate and sanitize cache key
  sanitizeKey: (key: string): string => {
    return key.replace(/[^a-zA-Z0-9:_-]/g, '_')
  },

  // Build cache key with validation
  buildValidatedKey: (namespace: string, context: string, operation: string, variables?: any): string => {
    const sanitizedNamespace = CacheUtils.sanitizeKey(namespace)
    const sanitizedContext = CacheUtils.sanitizeKey(context)
    const sanitizedOperation = CacheUtils.sanitizeKey(operation)
    const variablesStr = variables ? JSON.stringify(variables) : ''
    
    return `${sanitizedNamespace}:${sanitizedContext}:${sanitizedOperation}:${variablesStr}`
  }
}
