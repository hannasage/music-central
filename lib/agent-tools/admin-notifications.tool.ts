import { tool } from '@openai/agents'
import { z } from 'zod'
import { notificationService } from '../services/notification.service'
import { formatNotificationResponse } from '../utils/notification-formatter'

/**
 * Admin Notifications Tool - Checks for critical production errors and system alerts
 * Provides proactive error monitoring and actionable insights for administrators
 */
export const createAdminNotificationsTool = () => {
  return tool({
    name: 'check_admin_notifications',
    description: 'Check for critical production errors, warnings, and system alerts that require admin attention',
    parameters: z.object({
      includeAcknowledged: z.boolean().optional().default(false).describe('Include already acknowledged notifications in the results'),
      severityFilter: z.enum(['critical', 'warning', 'info', 'all']).optional().default('all').describe('Filter notifications by severity level')
    }),
    execute: async (input) => {
      try {
        console.log('Admin notifications tool executed with input:', input)
        const notifications = notificationService.getPendingNotifications()
        const unacknowledgedCount = notificationService.getUnacknowledgedCount()
        console.log(`Found ${notifications.length} total notifications, ${unacknowledgedCount} unacknowledged`)

        // Format response using utility functions
        const formattedResponse = formatNotificationResponse(
          notifications,
          unacknowledgedCount,
          {
            includeAcknowledged: input.includeAcknowledged,
            severityFilter: input.severityFilter
          }
        )

        // Build complete response
        let response = `${formattedResponse.header}\n\n`
        
        if (formattedResponse.notifications.length === 0) {
          response += `${formattedResponse.summary}\n\n${formattedResponse.footer}`
        } else {
          response += `${formattedResponse.summary}\n\n`
          response += formattedResponse.notifications.join('')
          response += formattedResponse.footer
        }

        console.log('Admin notifications tool returning response:', response)
        return response

      } catch (error) {
        console.error('Admin notifications tool error:', error)
        return `❌ **Error checking notifications:** ${error instanceof Error ? error.message : 'Unknown error occurred'}\n\nPlease check the notification service status and try again.`
      }
    }
  })
}


// Export the tool instance
export const adminNotificationsTool = createAdminNotificationsTool()