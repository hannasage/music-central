export interface AdminNotification {
  id: string
  timestamp: string
  type: 'database_connection' | 'spotify_api_limit' | 'auth_failure' | 'memory_leak' | 'deployment_failure' | 'api_error' | 'unknown'
  severity: 'critical' | 'warning' | 'info'
  message: string
  context?: Record<string, unknown>
  error?: {
    name: string
    message: string
    stack?: string
  }
  endpoint?: string
  userImpact?: string
  suggestedAction?: string
  acknowledged: boolean
}

export interface NotificationSubscriber {
  id: string
  controller: ReadableStreamDefaultController<string>
}

/**
 * Centralized notification service for admin error alerts
 * Handles real-time streaming via Server-Sent Events (SSE)
 */
export class NotificationService {
  private static instance: NotificationService
  private pendingNotifications: Map<string, AdminNotification> = new Map()
  private subscribers: Map<string, NotificationSubscriber> = new Map()
  private errorCooldowns: Map<string, number> = new Map()
  private readonly COOLDOWN_DURATION = 5 * 60 * 1000 // 5 minutes

  private constructor() {}

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService()
    }
    return NotificationService.instance
  }

  /**
   * Add a new notification and stream to subscribers
   */
  addNotification(notificationData: Omit<AdminNotification, 'id' | 'timestamp' | 'acknowledged'>): AdminNotification | null {
    // Check cooldown to prevent spam
    const cooldownKey = `${notificationData.type}-${notificationData.message}`
    const now = Date.now()
    const lastNotification = this.errorCooldowns.get(cooldownKey)
    
    if (lastNotification && (now - lastNotification) < this.COOLDOWN_DURATION) {
      return null // Skip notification due to cooldown
    }

    // Create notification
    const notification: AdminNotification = {
      id: `notif_${now}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      acknowledged: false,
      ...notificationData
    }

    // Store notification
    this.pendingNotifications.set(notification.id, notification)
    this.errorCooldowns.set(cooldownKey, now)

    // Stream to all subscribers
    this.streamToSubscribers(notification)

    // Clean up old notifications (keep last 100)
    this.cleanupOldNotifications()

    return notification
  }

  /**
   * Add a new SSE subscriber
   */
  addSubscriber(subscriberId: string, controller: ReadableStreamDefaultController<string>): void {
    const subscriber: NotificationSubscriber = {
      id: subscriberId,
      controller
    }
    this.subscribers.set(subscriberId, subscriber)
  }

  /**
   * Remove a subscriber
   */
  removeSubscriber(subscriberId: string): void {
    this.subscribers.delete(subscriberId)
  }

  /**
   * Broadcast acknowledgment to all subscribers to update UI
   */
  broadcastAcknowledgment(acknowledgedIds: string[] | 'all'): void {
    const acknowledgmentMessage = {
      type: 'acknowledgment',
      acknowledgedIds,
      timestamp: new Date().toISOString()
    }
    
    const data = `data: ${JSON.stringify(acknowledgmentMessage)}\n\n`
    
    // Remove dead subscribers while streaming
    const deadSubscribers: string[] = []
    
    this.subscribers.forEach((subscriber, id) => {
      try {
        subscriber.controller.enqueue(data)
      } catch {
        // Subscriber connection is dead, mark for removal
        deadSubscribers.push(id)
      }
    })

    // Clean up dead subscribers
    deadSubscribers.forEach(id => this.subscribers.delete(id))
  }

  /**
   * Stream notification to all active subscribers
   */
  private streamToSubscribers(notification: AdminNotification): void {
    const data = `data: ${JSON.stringify(notification)}\n\n`
    
    // Remove dead subscribers while streaming
    const deadSubscribers: string[] = []
    
    this.subscribers.forEach((subscriber, id) => {
      try {
        subscriber.controller.enqueue(data)
      } catch {
        // Subscriber connection is dead, mark for removal
        deadSubscribers.push(id)
      }
    })

    // Clean up dead subscribers
    deadSubscribers.forEach(id => this.subscribers.delete(id))
  }

  /**
   * Send pending critical notifications to a new subscriber
   */
  private sendPendingCriticalNotifications(controller: ReadableStreamDefaultController<string>): void {
    this.pendingNotifications.forEach(notification => {
      if (notification.severity === 'critical' && !notification.acknowledged) {
        const data = `data: ${JSON.stringify(notification)}\n\n`
        try {
          controller.enqueue(data)
        } catch (error) {
          // Subscriber connection failed
          console.error('Failed to send pending notification to subscriber:', error)
        }
      }
    })
  }

  /**
   * Get all pending notifications
   */
  getPendingNotifications(): AdminNotification[] {
    return Array.from(this.pendingNotifications.values())
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
  }

  /**
   * Get unacknowledged notifications count
   */
  getUnacknowledgedCount(): number {
    return Array.from(this.pendingNotifications.values())
      .filter(notification => !notification.acknowledged).length
  }

  /**
   * Mark notification as acknowledged
   */
  acknowledgeNotification(notificationId: string): boolean {
    const notification = this.pendingNotifications.get(notificationId)
    if (notification) {
      notification.acknowledged = true
      this.pendingNotifications.set(notificationId, notification)
      return true
    }
    return false
  }

  /**
   * Mark all notifications as acknowledged
   */
  acknowledgeAllNotifications(): number {
    let count = 0
    this.pendingNotifications.forEach(notification => {
      if (!notification.acknowledged) {
        notification.acknowledged = true
        count++
      }
    })
    return count
  }

  /**
   * Clear acknowledged notifications
   */
  clearAcknowledgedNotifications(): number {
    let count = 0
    this.pendingNotifications.forEach((notification, id) => {
      if (notification.acknowledged) {
        this.pendingNotifications.delete(id)
        count++
      }
    })
    return count
  }

  /**
   * Clean up old notifications (keep last 100)
   */
  private cleanupOldNotifications(): void {
    const notifications = this.getPendingNotifications()
    if (notifications.length > 100) {
      const toRemove = notifications.slice(100)
      toRemove.forEach(notification => {
        this.pendingNotifications.delete(notification.id)
      })
    }
  }

  /**
   * Generate error type from error details
   */
  static classifyError(error: Error, endpoint?: string): AdminNotification['type'] {
    const message = error.message.toLowerCase()
    
    if (message.includes('supabase') || message.includes('database') || message.includes('connection')) {
      return 'database_connection'
    }
    if (message.includes('spotify') || message.includes('rate limit') || message.includes('429')) {
      return 'spotify_api_limit'
    }
    if (message.includes('auth') || message.includes('unauthorized') || message.includes('401')) {
      return 'auth_failure'
    }
    if (endpoint?.includes('vercel') || message.includes('deployment') || message.includes('build')) {
      return 'deployment_failure'
    }
    if (endpoint) {
      return 'api_error'
    }
    
    return 'unknown'
  }

  /**
   * Generate user impact assessment
   */
  static assessUserImpact(type: AdminNotification['type'], severity: AdminNotification['severity']): string {
    const impacts = {
      database_connection: {
        critical: 'Users cannot access album data or save preferences',
        warning: 'Some database operations may be slower than normal',
        info: 'Minor database performance impact'
      },
      spotify_api_limit: {
        critical: 'Spotify links and data completely unavailable',
        warning: 'Limited Spotify functionality, some features may fail',
        info: 'Spotify API performance may be degraded'
      },
      auth_failure: {
        critical: 'Users cannot log in or access protected features',
        warning: 'Some users experiencing login issues',
        info: 'Minor authentication delays'
      },
      memory_leak: {
        critical: 'Application may crash or become unresponsive',
        warning: 'Performance degradation for all users',
        info: 'Slight performance impact'
      },
      deployment_failure: {
        critical: 'New deployments blocked, site updates unavailable',
        warning: 'Deployment process unstable',
        info: 'Minor deployment delays'
      },
      api_error: {
        critical: 'Core API functionality unavailable',
        warning: 'Some API endpoints experiencing issues',
        info: 'Minor API performance impact'
      },
      unknown: {
        critical: 'Unknown error with potential severe impact',
        warning: 'Unknown error with moderate impact',
        info: 'Unknown error with minimal impact'
      }
    }

    return impacts[type][severity]
  }

  /**
   * Generate suggested action for error type
   */
  static suggestAction(type: AdminNotification['type'], severity: AdminNotification['severity']): string {
    const actions = {
      database_connection: {
        critical: 'Check Supabase dashboard and connection status immediately',
        warning: 'Monitor database performance and consider connection pool adjustments',
        info: 'Monitor database metrics for trends'
      },
      spotify_api_limit: {
        critical: 'Check Spotify API quotas and consider temporary fallback options',
        warning: 'Review API usage patterns and implement rate limiting',
        info: 'Monitor Spotify API usage trends'
      },
      auth_failure: {
        critical: 'Check authentication service status and user session validity',
        warning: 'Review authentication logs for patterns',
        info: 'Monitor authentication success rates'
      },
      memory_leak: {
        critical: 'Restart application services and investigate memory usage patterns',
        warning: 'Monitor memory usage and identify potential leak sources',
        info: 'Continue monitoring memory trends'
      },
      deployment_failure: {
        critical: 'Check Vercel dashboard and build logs for deployment issues',
        warning: 'Review recent deployment changes and build pipeline',
        info: 'Monitor deployment success rates'
      },
      api_error: {
        critical: 'Check API endpoint health and recent code changes',
        warning: 'Review API logs and error patterns',
        info: 'Monitor API performance metrics'
      },
      unknown: {
        critical: 'Investigate error details and check application logs immediately',
        warning: 'Review error context and monitor for related issues',
        info: 'Document error details for future reference'
      }
    }

    return actions[type][severity]
  }
}

// Export singleton instance
export const notificationService = NotificationService.getInstance()