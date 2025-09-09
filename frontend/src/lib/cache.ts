// Simple in-memory cache for GraphQL API responses
interface CacheEntry<T> {
  data: T
  timestamp: number
  ttl: number // Time to live in milliseconds
}

class SimpleCache {
  private cache = new Map<string, CacheEntry<any>>()
  private defaultTTL = 5 * 60 * 1000 // 5 minutes default TTL

  set<T>(key: string, data: T, ttl?: number): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.defaultTTL
    })
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key)
    
    if (!entry) {
      return null
    }

    // Check if entry has expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key)
      return null
    }

    return entry.data
  }

  has(key: string): boolean {
    const entry = this.cache.get(key)
    
    if (!entry) {
      return false
    }

    // Check if entry has expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key)
      return false
    }

    return true
  }

  delete(key: string): void {
    this.cache.delete(key)
  }

  clear(): void {
    this.cache.clear()
  }

  // Generate cache key for GraphQL queries
  generateKey(operation: string, variables?: any): string {
    const variablesStr = variables ? JSON.stringify(variables) : ''
    return `${operation}:${variablesStr}`
  }

  // Get cache statistics
  getStats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    }
  }
}

// Export singleton instance
export const cache = new SimpleCache()

// Cache configuration for different operations
export const CACHE_CONFIG = {
  PRODUCTS: {
    TTL: 2 * 60 * 1000, // 2 minutes for products
    KEY_PREFIX: 'products'
  },
  CATEGORIES: {
    TTL: 10 * 60 * 1000, // 10 minutes for categories (rarely change)
    KEY_PREFIX: 'categories'
  },
  USER_DATA: {
    TTL: 5 * 60 * 1000, // 5 minutes for user data
    KEY_PREFIX: 'user'
  }
}
