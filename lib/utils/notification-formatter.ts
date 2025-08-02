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
 * Get severity icon and style for display
 */
export function getSeverityIcon(severity: AdminNotification['severity']): string {
  const icons = {
    critical: '🚨',
    warning: '⚠️',
    info: 'ℹ️'
  }
  return icons[severity]
}

/**
 * Get severity badge with rich formatting
 */
export function getSeverityBadge(severity: AdminNotification['severity']): string {
  const badges = {
    critical: '🚨 **CRITICAL**',
    warning: '⚠️ **WARNING**',
    info: 'ℹ️ *Info*'
  }
  return badges[severity]
}

/**
 * Format notification type for display with rich formatting
 */
export function formatNotificationType(type: AdminNotification['type']): string {
  const typeLabels = {
    database_connection: '🗄️ **Database Connection**',
    spotify_api_limit: '🎵 **Spotify API Limit**',
    auth_failure: '🔐 **Authentication Failure**',
    memory_leak: '💾 **Memory Leak**',
    deployment_failure: '🚀 **Deployment Failure**',
    api_error: '🌐 **API Error**',
    ai_agent: '🤖 **AI Agent Error**',
    unknown: '❓ **Unknown Error**'
  }
  return typeLabels[type] || `❓ **${type.replace(/_/g, ' ').toUpperCase()}**`
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
 * Format context information for display with rich formatting
 */
export function formatNotificationContext(context?: Record<string, unknown>): string {
  if (!context || Object.keys(context).length === 0) {
    return ''
  }

  return Object.entries(context)
    .filter(([key, value]) => key !== 'type' && value != null)
    .map(([key, value]) => {
      // Format different types of context values
      if (key === 'endpoint') return `🌐 Endpoint: ${value}`
      if (key === 'operation') return `⚙️ Operation: ${value}`
      if (key === 'service') return `🔗 Service: ${value}`
      if (key.includes('Count')) return `📊 ${key}: ${value}`
      if (key.includes('time') || key.includes('Time')) return `🕐 ${key}: ${value}`
      if (typeof value === 'boolean') return `${key}: ${value ? '✅' : '❌'}`
      return `${key}: ${value}`
    })
    .join('\n')
}

/**
 * Format error message with intelligent highlighting
 */
export function formatErrorMessage(message: string): string {
  // Bold critical keywords
  return message
    .replace(/(failed|error|timeout|invalid|unauthorized|denied)/gi, '**$1**')
    .replace(/(\d+ms|\d+s|\d+ seconds?|\d+ minutes?)/gi, '*$1*')
    .replace(/(https?:\/\/[^\s]+)/gi, '`$1`')
    .replace(/(AI selected|OpenAI|GPT)/gi, '***$1***')
}

/**
 * Format AI agent specific errors with enhanced context
 */
export function formatAIAgentNotification(notification: AdminNotification): string {
  const timeAgo = getTimeAgo(new Date(notification.timestamp))
  const contextStr = formatNotificationContext(notification.context)
  const formattedMessage = formatErrorMessage(notification.message)

  let formatted = `## 🤖 **AI Agent Error** ⚠️\n\n`
  
  // AI-specific visual treatment
  formatted += `> 🧠 **AI Operation Failed** • 🔄 **Graceful Fallback Active**\n\n`
  formatted += `**⏰ ${timeAgo}** • **🌐 ${notification.endpoint || 'AI System'}**\n\n`
  
  formatted += `### 🚨 **Error Details**\n`
  formatted += `> *${formattedMessage}*\n\n`
  
  if (notification.userImpact) {
    formatted += `### 👥 **User Impact**\n`
    formatted += `${notification.userImpact}\n\n`
  }
  
  if (notification.suggestedAction) {
    formatted += `### 🛠️ **Recommended Action**\n`
    formatted += `${notification.suggestedAction}\n\n`
  }

  if (contextStr) {
    formatted += `### 🔧 **Technical Context**\n`
    formatted += `\`\`\`\n${contextStr}\n\`\`\`\n\n`
  }

  // AI-specific status with emphasis
  const statusIcon = notification.acknowledged ? '✅' : '🔴'
  const statusText = notification.acknowledged ? '***Issue Acknowledged***' : '***⚡ Requires Review***'
  formatted += `**📊 Status:** ${statusIcon} ${statusText}\n`
  formatted += `**🆔 Reference:** \`${notification.id}\`\n\n`
  
  // AI-specific footer
  formatted += `> 💡 **Note:** AI fallback logic is active - users experience reduced AI quality but no service interruption\n\n`
  formatted += `---\n\n`

  return formatted
}

/**
 * Format a single notification for display with enhanced rich text
 */
export function formatSingleNotification(notification: AdminNotification): string {
  // Use specialized formatter for AI agent errors
  if (notification.type === 'ai_agent') {
    return formatAIAgentNotification(notification)
  }

  const severityBadge = getSeverityBadge(notification.severity)
  const typeLabel = formatNotificationType(notification.type)
  const timeAgo = getTimeAgo(new Date(notification.timestamp))
  const contextStr = formatNotificationContext(notification.context)
  const formattedMessage = formatErrorMessage(notification.message)

  // Create a visually appealing card-like format
  let formatted = `## ${severityBadge} ${typeLabel}\n\n`
  
  // Main error info with better visual hierarchy
  formatted += `> **🕐 ${timeAgo}** • **📍 ${notification.endpoint || 'System'}**\n\n`
  formatted += `**💥 Error Details:**\n`
  formatted += `*${formattedMessage}*\n\n`
  
  if (notification.userImpact) {
    formatted += `**👥 User Impact:**\n`
    formatted += `${notification.userImpact}\n\n`
  }
  
  if (notification.suggestedAction) {
    formatted += `**🔧 Recommended Action:**\n`
    formatted += `${notification.suggestedAction}\n\n`
  }

  if (contextStr) {
    formatted += `**📊 Technical Context:**\n`
    formatted += `\`\`\`\n${contextStr}\n\`\`\`\n\n`
  }

  // Status with appropriate styling
  const statusIcon = notification.acknowledged ? '✅' : '🔴'
  const statusText = notification.acknowledged ? '***Acknowledged***' : '***⚡ Needs Immediate Attention***'
  formatted += `**📋 Status:** ${statusIcon} ${statusText}\n`
  formatted += `**🆔 Reference:** \`${notification.id}\`\n\n`
  formatted += `---\n\n`

  return formatted
}

/**
 * Generate severity breakdown summary with enhanced formatting
 */
export function generateSeverityBreakdown(summary: NotificationSummary): string {
  const severitySummary = []
  if (summary.critical > 0) severitySummary.push(`🚨 **${summary.critical} Critical**`)
  if (summary.warning > 0) severitySummary.push(`⚠️ **${summary.warning} Warning**`)
  if (summary.info > 0) severitySummary.push(`ℹ️ *${summary.info} Info*`)
  
  return severitySummary.join(' • ')
}

/**
 * Generate footer with next steps and enhanced formatting
 */
export function generateNotificationFooter(summary: NotificationSummary, totalUnacknowledged: number, filteredCount: number): string {
  let footer = `---\n\n## 📢 **Next Steps & Recommendations**\n\n`
  
  if (summary.critical > 0) {
    footer += `### 🚨 **Immediate Action Required**\n`
    footer += `> ⚡ **${summary.critical} critical issue${summary.critical > 1 ? 's' : ''} need${summary.critical === 1 ? 's' : ''} immediate attention**\n\n`
  }
  
  if (summary.warning > 0) {
    footer += `### ⚠️ **Monitor & Address**\n`
    footer += `> 🔍 Review and address **${summary.warning} warning${summary.warning > 1 ? 's' : ''}** when possible\n\n`
  }

  footer += `### 🔧 **Standard Actions**\n`
  footer += `- 📊 **Check dashboards** and system logs for additional context\n`
  footer += `- 🔍 **Investigate patterns** to prevent future occurrences\n`
  footer += `- 🤖 **Ask me to help** with specific error investigation or remediation\n\n`

  if (totalUnacknowledged > filteredCount) {
    footer += `> 📝 ***Note:*** *${totalUnacknowledged - filteredCount} additional notifications available when including acknowledged items*\n\n`
  }

  footer += `---\n`
  footer += `👨‍💻 *Generated by Music Central Admin System*`

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

  // Handle empty case with enhanced formatting
  if (filteredNotifications.length === 0) {
    const header = `# ✅ **System Status: All Clear** 🎆`
    const summary = `> 🚀 **Excellent!** No ${filterOptions.includeAcknowledged ? '' : 'unacknowledged '}production errors or warnings detected${filterOptions.severityFilter !== 'all' ? ` for *${filterOptions.severityFilter}* severity level` : ''}.`
    const footer = unacknowledgedCount > 0 
      ? `📋 *There are **${unacknowledgedCount}** acknowledged notifications in the system.*`
      : `🎉 **All systems operational!** 🚀\n\n*Keep up the great work maintaining system health!*`
    
    return {
      header,
      summary,
      notifications: [],
      footer
    }
  }

  // Generate response components with enhanced formatting
  const sortedNotifications = sortNotificationsBySeverity(filteredNotifications)
  const notificationSummary = generateNotificationSummary(sortedNotifications)
  
  const urgencyLevel = notificationSummary.critical > 0 ? '🚨 **URGENT**' : notificationSummary.warning > 0 ? '⚠️ **ATTENTION**' : 'ℹ️ **NOTICE**'
  const header = `# ${urgencyLevel} Admin Alert\n\n📋 **${filteredNotifications.length} Production Issue${filteredNotifications.length > 1 ? 's' : ''} Detected**`
  const severityBreakdown = `## 📊 **Issue Breakdown**\n\n${generateSeverityBreakdown(notificationSummary)}`
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
 * Format acknowledgment instructions with enhanced rich text
 */
export function formatAcknowledgmentInstructions(unacknowledgedNotifications: AdminNotification[]): string {
  let response = `## 📋 **Notification Management**\n\n`
  response += `> 🔔 **${unacknowledgedNotifications.length} unacknowledged notification${unacknowledgedNotifications.length !== 1 ? 's' : ''}** awaiting your review\n\n`
  
  response += `### 🛠️ **Acknowledgment Options**\n\n`
  response += `**Option 1:** 🔄 **Acknowledge All**\n`
  response += `- Set \`acknowledgeAll: true\` to clear all pending notifications\n\n`
  response += `**Option 2:** 🎯 **Acknowledge Specific**\n`
  response += `- Provide \`notificationIds\` array with specific notification IDs\n\n`
  
  response += `### 📝 **Available Notifications**\n\n`
  response += unacknowledgedNotifications.map(n => {
    const typeFormatted = formatNotificationType(n.type)
    const severityBadge = getSeverityBadge(n.severity)
    return `- \`${n.id}\` → ${typeFormatted} (${severityBadge})`
  }).join('\n')
  
  response += `\n\n---\n\n🤖 **Quick Action:** Would you like me to acknowledge all of these notifications for you?`
  
  return response
}