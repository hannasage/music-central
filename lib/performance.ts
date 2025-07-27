// Performance monitoring and Web Vitals tracking

import { getCLS, getFID, getFCP, getLCP, getTTFB, Metric } from 'web-vitals'

// Performance thresholds (Google's recommended values)
export const PERFORMANCE_THRESHOLDS = {
  // Core Web Vitals
  LCP: { good: 2500, poor: 4000 },      // Largest Contentful Paint (ms)
  FID: { good: 100, poor: 300 },        // First Input Delay (ms)
  CLS: { good: 0.1, poor: 0.25 },       // Cumulative Layout Shift

  // Other important metrics
  FCP: { good: 1800, poor: 3000 },      // First Contentful Paint (ms)
  TTFB: { good: 800, poor: 1800 },      // Time to First Byte (ms)
  
  // Custom app metrics
  searchResponse: { good: 200, poor: 1000 },     // Search API response (ms)
  pageLoad: { good: 2000, poor: 5000 },          // Full page load (ms)
  imageLoad: { good: 1000, poor: 3000 }          // Image loading (ms)
} as const

// Performance metric types
export interface PerformanceMetric extends Metric {
  timestamp: number
  userAgent: string
  connection?: string
  deviceMemory?: number
}

export interface CustomMetric {
  name: string
  value: number
  timestamp: number
  metadata?: Record<string, unknown>
}

// Performance data collector
class PerformanceCollector {
  private metrics: PerformanceMetric[] = []
  private customMetrics: CustomMetric[] = []
  private isEnabled: boolean = true

  constructor() {
    if (typeof window !== 'undefined') {
      this.initWebVitals()
      this.initCustomMetrics()
      this.initNavigationTiming()
    }
  }

  private initWebVitals(): void {
    // Core Web Vitals
    getCLS(this.handleMetric.bind(this))
    getFID(this.handleMetric.bind(this))
    getLCP(this.handleMetric.bind(this))
    
    // Other important metrics
    getFCP(this.handleMetric.bind(this))
    getTTFB(this.handleMetric.bind(this))
  }

  private initCustomMetrics(): void {
    // Track page load performance
    window.addEventListener('load', () => {
      const loadTime = performance.now()
      this.recordCustomMetric('page_load', loadTime, {
        path: window.location.pathname
      })
    })

    // Track navigation timing
    if ('navigation' in performance) {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
      
      setTimeout(() => {
        this.recordCustomMetric('dns_lookup', navigation.domainLookupEnd - navigation.domainLookupStart)
        this.recordCustomMetric('tcp_connect', navigation.connectEnd - navigation.connectStart)
        this.recordCustomMetric('server_response', navigation.responseEnd - navigation.requestStart)
        this.recordCustomMetric('dom_processing', navigation.domContentLoadedEventEnd - navigation.domLoading)
      }, 0)
    }
  }

  private initNavigationTiming(): void {
    // Resource loading performance
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.entryType === 'resource') {
          this.handleResourceLoad(entry as PerformanceResourceTiming)
        }
      }
    })

    observer.observe({ entryTypes: ['resource'] })
  }

  private handleMetric(metric: Metric): void {
    if (!this.isEnabled) return

    const performanceMetric: PerformanceMetric = {
      ...metric,
      timestamp: Date.now(),
      userAgent: navigator.userAgent,
      connection: (navigator as typeof navigator & { connection?: { effectiveType?: string } }).connection?.effectiveType,
      deviceMemory: (navigator as typeof navigator & { deviceMemory?: number }).deviceMemory
    }

    this.metrics.push(performanceMetric)
    this.logMetric(performanceMetric)
    this.checkThreshold(performanceMetric)
  }

  private handleResourceLoad(entry: PerformanceResourceTiming): void {
    // Track image loading performance
    if (entry.name.match(/\.(jpg|jpeg|png|gif|webp|avif)$/i)) {
      const loadTime = entry.responseEnd - entry.startTime
      this.recordCustomMetric('image_load', loadTime, {
        url: entry.name,
        size: entry.transferSize
      })
    }

    // Track API call performance
    if (entry.name.includes('/api/')) {
      const responseTime = entry.responseEnd - entry.startTime
      this.recordCustomMetric('api_response', responseTime, {
        endpoint: entry.name,
        method: 'GET' // We'd need to track this differently for POST requests
      })
    }
  }

  private logMetric(metric: PerformanceMetric): void {
    if (process.env.NODE_ENV === 'development') {
      console.log(`🔍 Performance: ${metric.name} = ${metric.value.toFixed(2)}${metric.name === 'CLS' ? '' : 'ms'}`)
    }
  }

  private checkThreshold(metric: PerformanceMetric): void {
    const threshold = PERFORMANCE_THRESHOLDS[metric.name as keyof typeof PERFORMANCE_THRESHOLDS]
    if (!threshold) return

    let status: 'good' | 'needs-improvement' | 'poor'
    if (metric.value <= threshold.good) {
      status = 'good'
    } else if (metric.value <= threshold.poor) {
      status = 'needs-improvement'
    } else {
      status = 'poor'
    }

    if (status === 'poor') {
      console.warn(`⚠️ Poor ${metric.name} performance: ${metric.value.toFixed(2)}${metric.name === 'CLS' ? '' : 'ms'}`)
    }
  }

  recordCustomMetric(name: string, value: number, metadata?: Record<string, unknown>): void {
    if (!this.isEnabled) return

    const metric: CustomMetric = {
      name,
      value,
      timestamp: Date.now(),
      metadata
    }

    this.customMetrics.push(metric)

    if (process.env.NODE_ENV === 'development') {
      console.log(`📊 Custom Metric: ${name} = ${value.toFixed(2)}ms`, metadata)
    }
  }

  getMetrics(): PerformanceMetric[] {
    return [...this.metrics]
  }

  getCustomMetrics(): CustomMetric[] {
    return [...this.customMetrics]
  }

  getSummary(): {
    coreWebVitals: Record<string, number>
    customMetrics: Record<string, number>
    performanceScore: number
  } {
    const coreWebVitals: Record<string, number> = {}
    const customMetrics: Record<string, number> = {}

    // Get latest Core Web Vitals
    for (const metric of this.metrics) {
      coreWebVitals[metric.name] = metric.value
    }

    // Get average custom metrics
    const metricGroups = this.customMetrics.reduce((acc, metric) => {
      if (!acc[metric.name]) acc[metric.name] = []
      acc[metric.name].push(metric.value)
      return acc
    }, {} as Record<string, number[]>)

    for (const [name, values] of Object.entries(metricGroups)) {
      customMetrics[name] = values.reduce((sum, val) => sum + val, 0) / values.length
    }

    // Calculate performance score (0-100)
    const performanceScore = this.calculatePerformanceScore(coreWebVitals)

    return { coreWebVitals, customMetrics, performanceScore }
  }

  private calculatePerformanceScore(vitals: Record<string, number>): number {
    let score = 100
    
    // Deduct points based on Core Web Vitals
    if (vitals.LCP > PERFORMANCE_THRESHOLDS.LCP.good) {
      score -= vitals.LCP > PERFORMANCE_THRESHOLDS.LCP.poor ? 30 : 15
    }
    
    if (vitals.FID > PERFORMANCE_THRESHOLDS.FID.good) {
      score -= vitals.FID > PERFORMANCE_THRESHOLDS.FID.poor ? 30 : 15
    }
    
    if (vitals.CLS > PERFORMANCE_THRESHOLDS.CLS.good) {
      score -= vitals.CLS > PERFORMANCE_THRESHOLDS.CLS.poor ? 20 : 10
    }

    if (vitals.FCP > PERFORMANCE_THRESHOLDS.FCP.good) {
      score -= vitals.FCP > PERFORMANCE_THRESHOLDS.FCP.poor ? 20 : 10
    }

    return Math.max(0, score)
  }

  disable(): void {
    this.isEnabled = false
  }

  enable(): void {
    this.isEnabled = true
  }

  clear(): void {
    this.metrics = []
    this.customMetrics = []
  }
}

// Global performance collector instance
export const performanceCollector = new PerformanceCollector()

// Search performance tracking
export const searchPerformance = {
  startTime: 0,

  start(): void {
    this.startTime = performance.now()
  },

  end(query: string, resultCount: number): void {
    if (this.startTime === 0) return

    const duration = performance.now() - this.startTime
    performanceCollector.recordCustomMetric('search_duration', duration, {
      query: query.length, // Don't log actual query for privacy
      resultCount
    })

    this.startTime = 0
  }
}

// API performance tracking
export const apiPerformance = {
  async measureAPICall<T>(
    apiCall: () => Promise<T>,
    endpoint: string
  ): Promise<T> {
    const startTime = performance.now()
    
    try {
      const result = await apiCall()
      const duration = performance.now() - startTime
      
      performanceCollector.recordCustomMetric('api_call_success', duration, {
        endpoint,
        status: 'success'
      })
      
      return result
    } catch (error) {
      const duration = performance.now() - startTime
      
      performanceCollector.recordCustomMetric('api_call_error', duration, {
        endpoint,
        status: 'error'
      })
      
      throw error
    }
  }
}

// Component render performance tracking
export const componentPerformance = {
  measureRender(componentName: string): () => void {
    const startTime = performance.now()
    
    return () => {
      const duration = performance.now() - startTime
      performanceCollector.recordCustomMetric('component_render', duration, {
        component: componentName
      })
    }
  }
}

// User interaction tracking
export const interactionTracking = {
  init(): void {
    if (typeof window === 'undefined') return

    // Track click interactions
    document.addEventListener('click', (event) => {
      const target = event.target as HTMLElement
      const component = target.closest('[data-component]')?.getAttribute('data-component')
      
      if (component) {
        performanceCollector.recordCustomMetric('user_interaction', Date.now(), {
          type: 'click',
          component,
          elementType: target.tagName.toLowerCase()
        })
      }
    })

    // Track form submissions
    document.addEventListener('submit', (event) => {
      const form = event.target as HTMLFormElement
      const formName = form.getAttribute('data-form') || 'unknown'
      
      performanceCollector.recordCustomMetric('form_submission', Date.now(), {
        form: formName
      })
    })
  }
}

// Performance optimization helpers
export const performanceOptimization = {
  /**
   * Debounce function for expensive operations
   */
  debounce<T extends (...args: unknown[]) => unknown>(
    func: T,
    delay: number
  ): (...args: Parameters<T>) => void {
    let timeoutId: NodeJS.Timeout
    
    return (...args: Parameters<T>) => {
      clearTimeout(timeoutId)
      timeoutId = setTimeout(() => func(...args), delay)
    }
  },

  /**
   * Throttle function for high-frequency events
   */
  throttle<T extends (...args: unknown[]) => unknown>(
    func: T,
    limit: number
  ): (...args: Parameters<T>) => void {
    let inThrottle: boolean
    
    return (...args: Parameters<T>) => {
      if (!inThrottle) {
        func(...args)
        inThrottle = true
        setTimeout(() => inThrottle = false, limit)
      }
    }
  },

  /**
   * Lazy load images with performance tracking
   */
  lazyLoadImage(img: HTMLImageElement, src: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const startTime = performance.now()
      
      img.onload = () => {
        const duration = performance.now() - startTime
        performanceCollector.recordCustomMetric('lazy_image_load', duration, {
          src: src.substring(src.lastIndexOf('/') + 1) // Just filename for privacy
        })
        resolve()
      }
      
      img.onerror = reject
      img.src = src
    })
  }
}

// Initialize performance tracking
if (typeof window !== 'undefined') {
  // Initialize interaction tracking after DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      interactionTracking.init()
    })
  } else {
    interactionTracking.init()
  }
}