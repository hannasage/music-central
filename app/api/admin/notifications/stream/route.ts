import { notificationService } from '@/lib/services/notification.service'
import { withAdminAuthGet } from '@/lib/api/admin-auth'

/**
 * Server-Sent Events endpoint for real-time admin notifications
 * Streams critical production errors to authenticated admin users
 */
export const GET = withAdminAuthGet(async () => {
  try {
    // Create SSE stream directly
    const stream = new ReadableStream({
      start(controller) {
        // Store controller for this connection
        const subscriberId = `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        
        // Add to service subscribers
        notificationService.addSubscriber(subscriberId, controller)
        
        // Send initial connection message
        const connectionMessage = `data: ${JSON.stringify({
          type: 'connection',
          message: 'Connected to admin notifications',
          timestamp: new Date().toISOString()
        })}\n\n`
        
        controller.enqueue(connectionMessage)
        
        // Send any pending critical notifications
        const pendingNotifications = notificationService.getPendingNotifications()
        const criticalNotifications = pendingNotifications.filter(
          n => n.severity === 'critical' && !n.acknowledged
        )
        
        criticalNotifications.forEach(notification => {
          const data = `data: ${JSON.stringify(notification)}\n\n`
          controller.enqueue(data)
        })
      },
      cancel() {
        // Cleanup handled by service
      }
    })
    
    // Set up SSE headers
    const headers = new Headers({
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control',
    })

    return new Response(stream, {
      headers,
      status: 200,
    })

  } catch (error) {
    console.error('Admin notification stream error:', error)
    return new Response('Internal Server Error', { status: 500 })
  }
})