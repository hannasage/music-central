import { Album } from './types'

// Cache TTL configurations (in seconds)
export const CACHE_TTL = {
  albums: 3600,        // 1 hour - albums don't change frequently
  search: 1800,        // 30 minutes - search results can be cached
  genres: 7200,        // 2 hours - genres are relatively static
  artists: 3600,       // 1 hour - artist data is stable
  recommendations: 900, // 15 minutes - AI recommendations can change
  dailyFeatures: 86400, // 24 hours - daily features rotate daily
  userPreferences: 300  // 5 minutes - user preferences might change
} as const

// Cache key prefixes
export const CACHE_KEYS = {
  albums: 'albums',
  search: 'search',
  genres: 'genres',
  artists: 'artists',
  recommendations: 'recommendations',
  dailyFeatures: 'daily-features',
  userPreferences: 'user-prefs'
} as const

// Browser cache interface
interface BrowserCache {
  get<T>(key: string): Promise<T | null>
  set<T>(key: string, value: T, ttl?: number): Promise<void>
  delete(key: string): Promise<void>
  clear(): Promise<void>
}

// In-memory cache implementation
class MemoryCache implements BrowserCache {
  private cache = new Map<string, { value: unknown; expires: number }>()

  async get<T>(key: string): Promise<T | null> {
    const item = this.cache.get(key)
    
    if (!item) return null
    
    if (Date.now() > item.expires) {
      this.cache.delete(key)
      return null
    }
    
    return item.value as T
  }

  async set<T>(key: string, value: T, ttl: number = 3600): Promise<void> {
    const expires = Date.now() + (ttl * 1000)
    this.cache.set(key, { value, expires })
  }

  async delete(key: string): Promise<void> {
    this.cache.delete(key)
  }

  async clear(): Promise<void> {
    this.cache.clear()
  }

  // Cleanup expired entries
  cleanup(): void {
    const now = Date.now()
    for (const [key, item] of this.cache.entries()) {
      if (now > item.expires) {
        this.cache.delete(key)
      }
    }
  }
}

// LocalStorage cache implementation (with JSON serialization)
class LocalStorageCache implements BrowserCache {
  private prefix = 'music-central:'

  async get<T>(key: string): Promise<T | null> {
    try {
      const item = localStorage.getItem(this.prefix + key)
      if (!item) return null

      const parsed = JSON.parse(item)
      
      if (Date.now() > parsed.expires) {
        localStorage.removeItem(this.prefix + key)
        return null
      }
      
      return parsed.value as T
    } catch {
      return null
    }
  }

  async set<T>(key: string, value: T, ttl: number = 3600): Promise<void> {
    try {
      const expires = Date.now() + (ttl * 1000)
      const item = { value, expires }
      localStorage.setItem(this.prefix + key, JSON.stringify(item))
    } catch (error) {
      // Handle quota exceeded or other localStorage errors
      console.warn('Failed to set localStorage cache:', error)
    }
  }

  async delete(key: string): Promise<void> {
    try {
      localStorage.removeItem(this.prefix + key)
    } catch {
      // Silently ignore errors
    }
  }

  async clear(): Promise<void> {
    try {
      const keys = Object.keys(localStorage)
      keys.forEach(key => {
        if (key.startsWith(this.prefix)) {
          localStorage.removeItem(key)
        }
      })
    } catch {
      // Silently ignore errors
    }
  }
}

// Cache manager that chooses the best available storage
class CacheManager {
  private cache: BrowserCache
  private memoryCache = new MemoryCache()

  constructor() {
    // Try to use localStorage, fall back to memory cache
    if (typeof window !== 'undefined' && window.localStorage) {
      this.cache = new LocalStorageCache()
    } else {
      this.cache = this.memoryCache
    }

    // Clean up expired entries periodically
    if (typeof window !== 'undefined') {
      setInterval(() => {
        this.memoryCache.cleanup()
      }, 60000) // Every minute
    }
  }

  async get<T>(key: string): Promise<T | null> {
    // Try memory cache first (faster)
    const memoryResult = await this.memoryCache.get<T>(key)
    if (memoryResult !== null) {
      return memoryResult
    }

    // Fall back to persistent cache
    const result = await this.cache.get<T>(key)
    if (result !== null) {
      // Store in memory cache for faster access
      await this.memoryCache.set(key, result, 300) // 5 minutes in memory
    }

    return result
  }

  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    // Store in both caches
    await Promise.all([
      this.cache.set(key, value, ttl),
      this.memoryCache.set(key, value, Math.min(ttl || 300, 300)) // Max 5 minutes in memory
    ])
  }

  async delete(key: string): Promise<void> {
    await Promise.all([
      this.cache.delete(key),
      this.memoryCache.delete(key)
    ])
  }

  async clear(): Promise<void> {
    await Promise.all([
      this.cache.clear(),
      this.memoryCache.clear()
    ])
  }
}

// Global cache instance
export const cache = new CacheManager()

// Cached API functions
export const cachedAPI = {
  /**
   * Get all albums with caching
   */
  async getAlbums(): Promise<Album[]> {
    const cacheKey = `${CACHE_KEYS.albums}:all`
    
    let albums = await cache.get<Album[]>(cacheKey)
    if (albums) {
      return albums
    }

    try {
      const response = await fetch('/api/albums')
      if (!response.ok) throw new Error('Failed to fetch albums')
      
      const data = await response.json()
      albums = data.albums || []
      
      await cache.set(cacheKey, albums, CACHE_TTL.albums)
      return albums
    } catch (error) {
      console.error('Error fetching albums:', error)
      return []
    }
  },

  /**
   * Search albums with caching
   */
  async searchAlbums(query: string, filters: Record<string, unknown> = {}): Promise<unknown> {
    const cacheKey = `${CACHE_KEYS.search}:${btoa(JSON.stringify({ query, filters }))}`
    
    let results = await cache.get<unknown>(cacheKey)
    if (results) {
      return results
    }

    try {
      const params = new URLSearchParams()
      if (query) params.set('q', query)
      if (Object.keys(filters).length > 0) {
        params.set('filters', JSON.stringify(filters))
      }

      const response = await fetch(`/api/search?${params.toString()}`)
      if (!response.ok) throw new Error('Search failed')
      
      results = await response.json()
      
      await cache.set(cacheKey, results, CACHE_TTL.search)
      return results
    } catch (error) {
      console.error('Error searching albums:', error)
      return { results: [], pagination: { page: 1, limit: 20, total: 0, totalPages: 0 } }
    }
  },

  /**
   * Get AI recommendations with caching
   */
  async getRecommendations(message: string, conversationHistory: unknown[] = []): Promise<unknown> {
    // Don't cache personalized recommendations to avoid stale data
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, conversationHistory })
      })
      
      if (!response.ok) throw new Error('Failed to get recommendations')
      return await response.json()
    } catch (error) {
      console.error('Error getting recommendations:', error)
      return { message: 'Sorry, I had trouble getting recommendations right now.', recommendations: [] }
    }
  },

  /**
   * Get daily featured albums with caching
   */
  async getDailyFeatures(): Promise<Album[]> {
    const today = new Date().toISOString().split('T')[0]
    const cacheKey = `${CACHE_KEYS.dailyFeatures}:${today}`
    
    let features = await cache.get<Album[]>(cacheKey)
    if (features) {
      return features
    }

    // This would typically call a dedicated API endpoint
    // For now, we'll use the albums API and apply daily selection logic
    try {
      const albums = await this.getAlbums()
      
      // Simple daily selection (would be replaced with proper daily features service)
      // Use current date for consistent daily randomization
      const shuffled = albums.sort(() => 0.5 - Math.random())
      features = shuffled.slice(0, 4)
      
      await cache.set(cacheKey, features, CACHE_TTL.dailyFeatures)
      return features
    } catch (error) {
      console.error('Error getting daily features:', error)
      return []
    }
  }
}

// Cache warming utilities
export const cacheWarming = {
  /**
   * Preload critical data
   */
  async preloadCriticalData(): Promise<void> {
    if (typeof window !== 'undefined') {
      // Preload in the background after initial page load
      setTimeout(async () => {
        try {
          await Promise.all([
            cachedAPI.getAlbums(),
            cachedAPI.getDailyFeatures()
          ])
        } catch (error) {
          console.error('Error preloading data:', error)
        }
      }, 1000)
    }
  },

  /**
   * Invalidate cache when data changes
   */
  async invalidateAlbumsCache(): Promise<void> {
    await Promise.all([
      cache.delete(`${CACHE_KEYS.albums}:all`),
      cache.delete(`${CACHE_KEYS.genres}:all`),
      cache.delete(`${CACHE_KEYS.artists}:all`)
    ])
  }
}

// HTTP cache headers utilities
export const httpCacheHeaders = {
  /**
   * Get cache headers for static assets
   */
  staticAssets: {
    'Cache-Control': 'public, max-age=31536000, immutable', // 1 year
    'Vary': 'Accept-Encoding'
  },

  /**
   * Get cache headers for API responses
   */
  apiResponse: (ttl: number = 3600) => ({
    'Cache-Control': `public, max-age=${ttl}, s-maxage=${ttl}`,
    'Vary': 'Accept-Encoding, Authorization',
    'ETag': `"${Date.now()}"` // Simple ETag implementation
  }),

  /**
   * Get cache headers for dynamic content
   */
  dynamic: {
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0'
  }
}

// Service Worker cache strategies (for future implementation)
export const serviceWorkerCache = {
  /**
   * Cache first strategy for static assets
   */
  cacheFirst: [
    '/static/',
    '/_next/static/',
    '/images/',
    '/icons/'
  ],

  /**
   * Network first strategy for API calls
   */
  networkFirst: [
    '/api/'
  ],

  /**
   * Stale while revalidate for dynamic content
   */
  staleWhileRevalidate: [
    '/albums/',
    '/search',
    '/recommendations'
  ]
}