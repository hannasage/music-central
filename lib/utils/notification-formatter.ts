import { AdminNotification } from '../services/notification.service'

/**
 * Utility functions for formatting admin notifications
 * Provides consistent, reusable formatting for different notification displays
 */

export interface NotificationSummary {
  total: number
  critical: number
  warning: number
  info: number
}

export interface FormattedNotificationResponse {
  header: string
  summary: string
  notifications: string[]
  footer: string
}

/**
 * Get severity icon for display
 */
export function getSeverityIcon(severity: AdminNotification['severity']): string {
  const icons = {
    critical: '🔴',
    warning: '🟡',
    info: '🔵'
  }
  return icons[severity]
}

/**
 * Format notification type for display
 */
export function formatNotificationType(type: AdminNotification['type']): string {
  return type.replace(/_/g, ' ').toUpperCase()
}

/**
 * Calculate time ago in human-readable format
 */
export function getTimeAgo(date: Date): string {
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

/**
 * Generate notification summary counts
 */
export function generateNotificationSummary(notifications: AdminNotification[]): NotificationSummary {
  return {
    total: notifications.length,
    critical: notifications.filter(n => n.severity === 'critical').length,
    warning: notifications.filter(n => n.severity === 'warning').length,
    info: notifications.filter(n => n.severity === 'info').length
  }
}

/**
 * Sort notifications by severity (critical first)
 */
export function sortNotificationsBySeverity(notifications: AdminNotification[]): AdminNotification[] {
  const severityOrder = { critical: 0, warning: 1, info: 2 }
  return [...notifications].sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity])
}

/**
 * Format context information for display
 */
export function formatNotificationContext(context?: Record<string, unknown>): string {
  if (!context || Object.keys(context).length === 0) {
    return ''
  }

  return Object.entries(context)
    .filter(([key, value]) => key !== 'type' && value != null)
    .map(([key, value]) => `${key}: ${value}`)
    .join(', ')
}

/**
 * Format a single notification for display
 */
export function formatSingleNotification(notification: AdminNotification): string {
  const severityIcon = getSeverityIcon(notification.severity)
  const typeLabel = formatNotificationType(notification.type)
  const timeAgo = getTimeAgo(new Date(notification.timestamp))
  const contextStr = formatNotificationContext(notification.context)

  let formatted = `### ${severityIcon} ${typeLabel}\n`
  formatted += `**Time:** ${timeAgo}\n`
  formatted += `**Error:** ${notification.message}\n`
  
  if (notification.userImpact) {
    formatted += `**User Impact:** ${notification.userImpact}\n`
  }
  
  if (notification.suggestedAction) {
    formatted += `**Recommended Action:** ${notification.suggestedAction}\n`
  }

  if (notification.endpoint) {
    formatted += `**Endpoint:** \`${notification.endpoint}\`\n`
  }

  if (contextStr) {
    formatted += `**Context:** ${contextStr}\n`
  }

  formatted += `**Status:** ${notification.acknowledged ? '✅ Acknowledged' : '⏳ Needs Attention'}\n`
  formatted += `**ID:** \`${notification.id}\`\n\n`

  return formatted
}

/**
 * Generate severity breakdown summary
 */
export function generateSeverityBreakdown(summary: NotificationSummary): string {
  const severitySummary = []
  if (summary.critical > 0) severitySummary.push(`🔴 ${summary.critical} Critical`)
  if (summary.warning > 0) severitySummary.push(`🟡 ${summary.warning} Warning`)
  if (summary.info > 0) severitySummary.push(`🔵 ${summary.info} Info`)
  
  return severitySummary.join(', ')
}

/**
 * Generate footer with next steps
 */
export function generateNotificationFooter(summary: NotificationSummary, totalUnacknowledged: number, filteredCount: number): string {
  let footer = `---\n\n**Next Steps:**\n`
  
  if (summary.critical > 0) {
    footer += `• 🚨 **Immediate attention required** for ${summary.critical} critical issue${summary.critical > 1 ? 's' : ''}\n`
  }
  
  if (summary.warning > 0) {
    footer += `• ⚠️ Monitor and address ${summary.warning} warning${summary.warning > 1 ? 's' : ''} when possible\n`
  }

  footer += `• 📊 Check system dashboards and logs for additional context\n`
  footer += `• 🔄 I can help investigate specific errors or trigger remediation actions\n`

  if (totalUnacknowledged > filteredCount) {
    footer += `\n📝 *Note: ${totalUnacknowledged - filteredCount} additional notifications are available when including acknowledged items.*`
  }

  return footer
}

/**
 * Format complete notification response for admin display
 */
export function formatNotificationResponse(
  notifications: AdminNotification[],
  unacknowledgedCount: number,
  filterOptions: {
    includeAcknowledged: boolean
    severityFilter: string
  }
): FormattedNotificationResponse {
  // Filter and sort notifications
  let filteredNotifications = [...notifications]
  
  if (!filterOptions.includeAcknowledged) {
    filteredNotifications = filteredNotifications.filter(n => !n.acknowledged)
  }

  if (filterOptions.severityFilter !== 'all') {
    filteredNotifications = filteredNotifications.filter(n => n.severity === filterOptions.severityFilter)
  }

  // Handle empty case
  if (filteredNotifications.length === 0) {
    const header = `✅ **System Status: All Clear**`
    const summary = `No ${filterOptions.includeAcknowledged ? '' : 'unacknowledged '}production errors or warnings detected${filterOptions.severityFilter !== 'all' ? ` for ${filterOptions.severityFilter} level` : ''}.`
    const footer = unacknowledgedCount > 0 
      ? `📋 There are ${unacknowledgedCount} acknowledged notifications in the system.`
      : '🎉 All systems are running smoothly!'
    
    return {
      header,
      summary,
      notifications: [],
      footer
    }
  }

  // Generate response components
  const sortedNotifications = sortNotificationsBySeverity(filteredNotifications)
  const notificationSummary = generateNotificationSummary(sortedNotifications)
  
  const header = `🚨 **Admin Alert: ${filteredNotifications.length} Production Issue${filteredNotifications.length > 1 ? 's' : ''} Detected**`
  const severityBreakdown = `**Severity Breakdown:** ${generateSeverityBreakdown(notificationSummary)}`
  const formattedNotifications = sortedNotifications.map(formatSingleNotification)
  const footer = generateNotificationFooter(notificationSummary, unacknowledgedCount, filteredNotifications.length)

  return {
    header,
    summary: severityBreakdown,
    notifications: formattedNotifications,
    footer
  }
}

/**
 * Format acknowledgment instructions
 */
export function formatAcknowledgmentInstructions(unacknowledgedNotifications: AdminNotification[]): string {
  let response = `📋 **Acknowledgment Options**\n\n`
  response += `There are currently ${unacknowledgedNotifications.length} unacknowledged notification${unacknowledgedNotifications.length !== 1 ? 's' : ''} in the system.\n\n`
  response += `To acknowledge notifications, you can:\n`
  response += `• **Acknowledge all**: Set \`acknowledgeAll: true\`\n`
  response += `• **Acknowledge specific**: Provide \`notificationIds\` array with specific notification IDs\n\n`
  response += `Available notification IDs:\n`
  response += unacknowledgedNotifications.map(n => `• \`${n.id}\` - ${formatNotificationType(n.type)} (${n.severity})`).join('\n')
  response += `\n\nWould you like me to acknowledge all of these notifications for you?`
  
  return response
}