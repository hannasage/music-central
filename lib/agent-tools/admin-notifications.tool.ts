import { tool } from '@openai/agents'
import { z } from 'zod'
import { notificationService } from '../services/notification.service'

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

        // Filter notifications based on parameters
        let filteredNotifications = notifications

        if (!input.includeAcknowledged) {
          filteredNotifications = filteredNotifications.filter(n => !n.acknowledged)
        }

        if (input.severityFilter !== 'all') {
          filteredNotifications = filteredNotifications.filter(n => n.severity === input.severityFilter)
        }

        // If no notifications, return good news
        if (filteredNotifications.length === 0) {
          return `✅ **System Status: All Clear**

No ${input.includeAcknowledged ? '' : 'unacknowledged '}production errors or warnings detected${input.severityFilter !== 'all' ? ` for ${input.severityFilter} level` : ''}.

${unacknowledgedCount > 0 ? `📋 There are ${unacknowledgedCount} acknowledged notifications in the system.` : '🎉 All systems are running smoothly!'}`
        }

        // Format notifications for admin review
        const criticalCount = filteredNotifications.filter(n => n.severity === 'critical').length
        const warningCount = filteredNotifications.filter(n => n.severity === 'warning').length
        const infoCount = filteredNotifications.filter(n => n.severity === 'info').length

        let response = `🚨 **Admin Alert: ${filteredNotifications.length} Production Issue${filteredNotifications.length > 1 ? 's' : ''} Detected**\n\n`

        // Summary by severity
        const severitySummary = []
        if (criticalCount > 0) severitySummary.push(`🔴 ${criticalCount} Critical`)
        if (warningCount > 0) severitySummary.push(`🟡 ${warningCount} Warning`)
        if (infoCount > 0) severitySummary.push(`🔵 ${infoCount} Info`)
        
        response += `**Severity Breakdown:** ${severitySummary.join(', ')}\n\n`

        // Show critical notifications first
        const sortedNotifications = filteredNotifications.sort((a, b) => {
          const severityOrder = { critical: 0, warning: 1, info: 2 }
          return severityOrder[a.severity] - severityOrder[b.severity]
        })

        sortedNotifications.forEach((notification) => {
          const severityIcon = {
            critical: '🔴',
            warning: '🟡',
            info: '🔵'
          }[notification.severity]

          const timeAgo = getTimeAgo(new Date(notification.timestamp))
          
          response += `### ${severityIcon} ${notification.type.replace(/_/g, ' ').toUpperCase()}\n`
          response += `**Time:** ${timeAgo}\n`
          response += `**Error:** ${notification.message}\n`
          
          if (notification.userImpact) {
            response += `**User Impact:** ${notification.userImpact}\n`
          }
          
          if (notification.suggestedAction) {
            response += `**Recommended Action:** ${notification.suggestedAction}\n`
          }

          if (notification.endpoint) {
            response += `**Endpoint:** \`${notification.endpoint}\`\n`
          }

          if (notification.context && Object.keys(notification.context).length > 0) {
            const contextStr = Object.entries(notification.context)
              .filter(([key, value]) => key !== 'type' && value != null)
              .map(([key, value]) => `${key}: ${value}`)
              .join(', ')
            if (contextStr) {
              response += `**Context:** ${contextStr}\n`
            }
          }

          response += `**Status:** ${notification.acknowledged ? '✅ Acknowledged' : '⏳ Needs Attention'}\n`
          response += `**ID:** \`${notification.id}\`\n\n`
        })

        // Add actionable footer
        response += `---\n\n`
        response += `**Next Steps:**\n`
        
        if (criticalCount > 0) {
          response += `• 🚨 **Immediate attention required** for ${criticalCount} critical issue${criticalCount > 1 ? 's' : ''}\n`
        }
        
        if (warningCount > 0) {
          response += `• ⚠️ Monitor and address ${warningCount} warning${warningCount > 1 ? 's' : ''} when possible\n`
        }

        response += `• 📊 Check system dashboards and logs for additional context\n`
        response += `• 🔄 I can help investigate specific errors or trigger remediation actions\n`

        if (unacknowledgedCount > filteredNotifications.length) {
          response += `\n📝 *Note: ${unacknowledgedCount - filteredNotifications.length} additional notifications are available when including acknowledged items.*`
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

/**
 * Helper function to format time ago in human-readable format
 */
function getTimeAgo(date: Date): string {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMinutes = Math.floor(diffMs / (1000 * 60))
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffMinutes < 1) {
    return 'Just now'
  } else if (diffMinutes < 60) {
    return `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ago`
  } else if (diffHours < 24) {
    return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
  } else {
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`
  }
}

// Export the tool instance
export const adminNotificationsTool = createAdminNotificationsTool()