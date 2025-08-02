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

}

// Export singleton instance
export const notificationService = NotificationService.getInstance()