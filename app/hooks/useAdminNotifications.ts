'use client'

import { useState, useEffect, useCallback } from 'react'
import { AdminNotification } from '@/lib/services/notification.service'

interface AdminNotificationsState {
  notifications: AdminNotification[]
  unreadCount: number
  isConnected: boolean
  error: string | null
  lastUpdate: Date | null
}

interface AdminNotificationsActions {
  acknowledgeNotification: (notificationId: string) => Promise<boolean>
  acknowledgeAllNotifications: () => Promise<boolean>
  clearAcknowledgedNotifications: () => Promise<boolean>
  refreshNotifications: () => Promise<void>
}

export interface UseAdminNotificationsReturn extends AdminNotificationsState, AdminNotificationsActions {}

/**
 * Hook for managing admin notifications with real-time SSE updates
 * Provides notification state, counts, and actions for the admin UI
 */
export function useAdminNotifications(): UseAdminNotificationsReturn {
  const [state, setState] = useState<AdminNotificationsState>({
    notifications: [],
    unreadCount: 0,
    isConnected: false,
    error: null,
    lastUpdate: null
  })

  // Refresh notifications from API
  const refreshNotifications = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/notifications')
      if (!response.ok) {
        throw new Error(`Failed to fetch notifications: ${response.status}`)
      }
      
      const data = await response.json()
      setState(prev => ({
        ...prev,
        notifications: data.notifications || [],
        unreadCount: data.unacknowledgedCount || 0,
        error: null,
        lastUpdate: new Date()
      }))
    } catch (error) {
      console.error('Error refreshing notifications:', error)
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to fetch notifications'
      }))
    }
  }, [])

  // Acknowledge a specific notification
  const acknowledgeNotification = useCallback(async (notificationId: string): Promise<boolean> => {
    try {
      const response = await fetch('/api/admin/notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          notificationIds: [notificationId]
        })
      })

      if (!response.ok) {
        throw new Error(`Failed to acknowledge notification: ${response.status}`)
      }

      // Update local state
      setState(prev => ({
        ...prev,
        notifications: prev.notifications.map(notification =>
          notification.id === notificationId
            ? { ...notification, acknowledged: true }
            : notification
        ),
        unreadCount: Math.max(0, prev.unreadCount - 1),
        lastUpdate: new Date()
      }))

      return true
    } catch (error) {
      console.error('Error acknowledging notification:', error)
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to acknowledge notification'
      }))
      return false
    }
  }, [])

  // Acknowledge all notifications
  const acknowledgeAllNotifications = useCallback(async (): Promise<boolean> => {
    try {
      const response = await fetch('/api/admin/notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          acknowledgeAll: true
        })
      })

      if (!response.ok) {
        throw new Error(`Failed to acknowledge all notifications: ${response.status}`)
      }

      // Update local state
      setState(prev => ({
        ...prev,
        notifications: prev.notifications.map(notification => ({
          ...notification,
          acknowledged: true
        })),
        unreadCount: 0,
        lastUpdate: new Date()
      }))

      return true
    } catch (error) {
      console.error('Error acknowledging all notifications:', error)
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to acknowledge all notifications'
      }))
      return false
    }
  }, [])

  // Clear acknowledged notifications
  const clearAcknowledgedNotifications = useCallback(async (): Promise<boolean> => {
    try {
      const response = await fetch('/api/admin/notifications', {
        method: 'DELETE'
      })

      if (!response.ok) {
        throw new Error(`Failed to clear notifications: ${response.status}`)
      }

      // Update local state - remove acknowledged notifications
      setState(prev => ({
        ...prev,
        notifications: prev.notifications.filter(notification => !notification.acknowledged),
        lastUpdate: new Date()
      }))

      return true
    } catch (error) {
      console.error('Error clearing notifications:', error)
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to clear notifications'
      }))
      return false
    }
  }, [])

  // Set up SSE connection for real-time updates
  useEffect(() => {
    let eventSource: EventSource | null = null
    let reconnectTimeout: NodeJS.Timeout | null = null

    const connect = () => {
      try {
        // Close existing connection if any
        if (eventSource) {
          eventSource.close()
        }

        console.log('Connecting to SSE stream...')
        eventSource = new EventSource('/api/admin/notifications/stream')
        
        eventSource.onopen = () => {
          console.log('SSE connection opened')
          setState(prev => ({
            ...prev,
            isConnected: true,
            error: null
          }))
        }

        eventSource.onmessage = (event) => {
          try {
            console.log('SSE message received:', event.data)
            const data = JSON.parse(event.data)
            
            // Handle connection message
            if (data.type === 'connection') {
              console.log('SSE connection confirmed:', data.message)
              return
            }

            // Handle new notification
            const newNotification = data as AdminNotification
            console.log('New notification received:', newNotification)
            setState(prev => {
              // Check if notification already exists to avoid duplicates
              const exists = prev.notifications.some(n => n.id === newNotification.id)
              if (exists) {
                return prev
              }

              return {
                ...prev,
                notifications: [newNotification, ...prev.notifications],
                unreadCount: prev.unreadCount + 1,
                lastUpdate: new Date()
              }
            })
          } catch (error) {
            console.error('Error parsing SSE message:', error)
          }
        }

        eventSource.onerror = (error) => {
          console.error('SSE connection error:', error)
          setState(prev => ({
            ...prev,
            isConnected: false,
            error: 'Connection to notification stream lost'
          }))

          // Close the connection
          if (eventSource) {
            eventSource.close()
          }

          // Attempt to reconnect after 5 seconds
          reconnectTimeout = setTimeout(() => {
            console.log('Attempting to reconnect SSE...')
            connect()
          }, 5000)
        }

      } catch (error) {
        console.error('Error creating SSE connection:', error)
        setState(prev => ({
          ...prev,
          isConnected: false,
          error: 'Failed to connect to notification stream'
        }))
      }
    }

    // Initial connection and data fetch
    connect()
    refreshNotifications()

    // Cleanup function
    return () => {
      console.log('Cleaning up SSE connection')
      if (eventSource) {
        eventSource.close()
      }
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout)
      }
    }
  }, [refreshNotifications])

  return {
    notifications: state.notifications,
    unreadCount: state.unreadCount,
    isConnected: state.isConnected,
    error: state.error,
    lastUpdate: state.lastUpdate,
    acknowledgeNotification,
    acknowledgeAllNotifications,
    clearAcknowledgedNotifications,
    refreshNotifications
  }
}