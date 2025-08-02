import { tool } from '@openai/agents'
import { z } from 'zod'
import { notificationService } from '../services/notification.service'

/**
 * Acknowledge Notifications Tool - Marks notifications as acknowledged/resolved
 * Allows the admin agent to clear notifications after they've been addressed
 */
export const createAcknowledgeNotificationsTool = () => {
  return tool({
    name: 'acknowledge_notifications',
    description: 'Mark admin notifications as acknowledged/resolved to clear them from the notification list',
    parameters: z.object({
      notificationIds: z.array(z.string()).nullable().default(null).describe('Specific notification IDs to acknowledge. If not provided, acknowledges all unacknowledged notifications'),
      acknowledgeAll: z.boolean().default(false).describe('If true, acknowledges all unacknowledged notifications regardless of notificationIds')
    }),
    execute: async (input) => {
      try {
        console.log('Acknowledge notifications tool executed with input:', input)

        if (input.acknowledgeAll) {
          // Acknowledge all notifications
          const count = notificationService.acknowledgeAllNotifications()
          console.log(`Acknowledged all ${count} notifications`)
          
          // Broadcast acknowledgment to all subscribers
          notificationService.broadcastAcknowledgment('all')
          
          return `✅ **All Notifications Acknowledged**

Successfully marked ${count} notification${count !== 1 ? 's' : ''} as resolved.

The admin notification system is now clear. You'll continue to receive alerts for any new production issues that occur.`
        }

        if (input.notificationIds && input.notificationIds.length > 0) {
          // Acknowledge specific notifications
          let acknowledgedCount = 0
          const failedIds: string[] = []

          input.notificationIds.forEach(id => {
            if (notificationService.acknowledgeNotification(id)) {
              acknowledgedCount++
            } else {
              failedIds.push(id)
            }
          })

          let response = `✅ **Notifications Acknowledged**\n\n`
          
          if (acknowledgedCount > 0) {
            response += `Successfully resolved ${acknowledgedCount} notification${acknowledgedCount !== 1 ? 's' : ''}.\n`
          }
          
          if (failedIds.length > 0) {
            response += `⚠️ Could not find ${failedIds.length} notification${failedIds.length !== 1 ? 's' : ''} (they may have already been acknowledged):\n`
            failedIds.forEach(id => {
              response += `• \`${id}\`\n`
            })
          }

          response += `\nThe notification indicator should update momentarily to reflect these changes.`
          
          // Broadcast acknowledgment to all subscribers
          if (acknowledgedCount > 0) {
            notificationService.broadcastAcknowledgment(input.notificationIds)
          }
          
          console.log(`Acknowledged ${acknowledgedCount} notifications, ${failedIds.length} failed`)
          return response
        }

        // No specific action requested
        const pendingNotifications = notificationService.getPendingNotifications()
        const unacknowledgedNotifications = pendingNotifications.filter(n => !n.acknowledged)
        
        if (unacknowledgedNotifications.length === 0) {
          return `ℹ️ **No Notifications to Acknowledge**

There are currently no unacknowledged notifications in the system. All alerts have already been resolved.`
        }

        // Provide instructions on how to acknowledge
        return `📋 **Acknowledgment Options**

There are currently ${unacknowledgedNotifications.length} unacknowledged notification${unacknowledgedNotifications.length !== 1 ? 's' : ''} in the system.

To acknowledge notifications, you can:
• **Acknowledge all**: Set \`acknowledgeAll: true\`
• **Acknowledge specific**: Provide \`notificationIds\` array with specific notification IDs

Available notification IDs:
${unacknowledgedNotifications.map(n => `• \`${n.id}\` - ${n.type} (${n.severity})`).join('\n')}

Would you like me to acknowledge all of these notifications for you?`

      } catch (error) {
        console.error('Acknowledge notifications tool error:', error)
        return `❌ **Error acknowledging notifications:** ${error instanceof Error ? error.message : 'Unknown error occurred'}\n\nPlease try again or check the notification service status.`
      }
    }
  })
}

// Export the tool instance
export const acknowledgeNotificationsTool = createAcknowledgeNotificationsTool()