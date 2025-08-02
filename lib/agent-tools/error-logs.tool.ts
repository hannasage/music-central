import { tool } from '@openai/agents'
import { z } from 'zod'
import { createLogRepository } from '../repositories/log-repository'
import { createServerComponentClient } from '../supabase'
import type { ToolContext } from './types'
import type { ErrorLog } from '../types'

/**
 * Error Logs Tool - Provides comprehensive access to error and warning logs
 * Enables the admin agent to search, analyze, and understand system issues
 */
export const createErrorLogsTool = (context?: ToolContext) => {
  return tool({
    name: 'search_error_logs',
    description: 'Search and analyze error and warning logs to help debug system issues. Provides filtering, search, and analysis capabilities for comprehensive debugging assistance.',
    parameters: z.object({
      action: z.enum(['search', 'recent', 'by_type', 'by_fingerprint', 'stats', 'get_by_id']).describe('The type of log query to perform'),
      
      // Search parameters
      searchTerm: z.string().nullable().default(null).describe('Text to search for in log messages (for action: search)'),
      level: z.enum(['warn', 'error', 'both']).default('both').describe('Filter by log level'),
      errorType: z.string().nullable().default(null).describe('Filter by specific error type (database_connection, spotify_api_limit, etc.)'),
      severity: z.enum(['critical', 'warning', 'info']).nullable().default(null).describe('Filter by severity level'),
      
      // Time range parameters
      hours: z.number().default(24).describe('Number of hours to look back (for action: recent)'),
      startDate: z.string().nullable().default(null).describe('Start date for filtering (ISO string format)'),
      endDate: z.string().nullable().default(null).describe('End date for filtering (ISO string format)'),
      
      // Specific queries
      logId: z.string().nullable().default(null).describe('Specific log ID to retrieve (for action: get_by_id)'),
      fingerprint: z.string().nullable().default(null).describe('Error fingerprint to find all occurrences (for action: by_fingerprint)'),
      
      // Pagination
      page: z.number().default(1).describe('Page number for paginated results'),
      limit: z.number().default(20).describe('Number of results per page (max 100)')
    }),
    execute: async (input) => {
      try {
        console.log('Error logs tool executed with input:', input)
        
        // Create repository with proper context
        let logRepository
        if (context?.supabase) {
          logRepository = createLogRepository(context.supabase)
        } else {
          // Create server client for server-side operations
          const supabase = await createServerComponentClient()
          logRepository = createLogRepository(supabase)
        }

        // Validate limit
        const limit = Math.min(input.limit || 20, 100)

        switch (input.action) {
          case 'search':
            if (!input.searchTerm) {
              return '❌ **Error:** Search term is required for search action.'
            }
            const searchResults = await logRepository.searchLogs(input.searchTerm, limit)
            return formatSearchResults(searchResults, input.searchTerm)

          case 'recent':
            const recentLogs = await logRepository.getRecentLogs(input.hours || 24, limit)
            return formatRecentLogs(recentLogs, input.hours || 24)

          case 'by_type':
            if (!input.errorType) {
              // Get all error types if none specified
              const errorTypes = await logRepository.getErrorTypes()
              return formatErrorTypes(errorTypes)
            }
            const typeResults = await logRepository.getLogs(input.page || 1, limit, {
              errorType: input.errorType || undefined,
              level: input.level,
              severity: input.severity || undefined,
              startDate: input.startDate || undefined,
              endDate: input.endDate || undefined
            })
            return formatLogResults(typeResults, `Error Type: ${input.errorType}`)

          case 'by_fingerprint':
            if (!input.fingerprint) {
              return '❌ **Error:** Fingerprint is required for by_fingerprint action.'
            }
            // Note: Fingerprints are SHA256 hashes (64 hex chars), not UUIDs
            const fingerprintResults = await logRepository.getLogsByFingerprint(input.fingerprint)
            return formatFingerprintResults(fingerprintResults, input.fingerprint)

          case 'stats':
            const stats = await logRepository.getLogStats()
            return formatStats(stats)

          case 'get_by_id':
            if (!input.logId) {
              return '❌ **Error:** Log ID is required for get_by_id action.'
            }
            // Validate UUID format
            if (!isValidUUID(input.logId)) {
              return `❌ **Error:** Invalid log ID format. Expected UUID format (e.g., "550e8400-e29b-41d4-a716-446655440000"), got: "${input.logId}"\n\n💡 **Tip:** Use the "recent" or "search" actions to find valid log IDs.`
            }
            const log = await logRepository.getLogById(input.logId)
            if (!log) {
              return `❌ **Error:** No log found with ID: ${input.logId}`
            }
            return formatSingleLog(log)

          default:
            return '❌ **Error:** Invalid action specified.'
        }

      } catch (error) {
        console.error('Error logs tool error:', error)
        return `❌ **Error accessing logs:** ${error instanceof Error ? error.message : 'Unknown error occurred'}\n\nPlease check the logging system status and try again.`
      }
    }
  })
}

/**
 * Format search results
 */
function formatSearchResults(logs: ErrorLog[], searchTerm: string): string {
  if (logs.length === 0) {
    return `🔍 **Search Results for "${searchTerm}"**\n\nNo logs found matching your search term.`
  }

  let response = `🔍 **Search Results for "${searchTerm}"** (${logs.length} found)\n\n`
  
  logs.slice(0, 10).forEach((log, index) => {
    const timeAgo = getTimeAgo(new Date(log.timestamp))
    const severityIcon = getSeverityIcon(log.severity)
    
    response += `${index + 1}. ${severityIcon} **${log.error_type}** (${log.severity})\n`
    response += `   📅 ${timeAgo} • 🔢 ${log.occurrence_count}x\n`
    response += `   💬 ${log.message}\n`
    if (log.endpoint) response += `   🌐 ${log.endpoint}\n`
    response += `   🆔 \`${log.id}\`\n\n`
  })

  if (logs.length > 10) {
    response += `*... and ${logs.length - 10} more results. Use pagination to see more.*\n\n`
  }

  return response
}

/**
 * Format recent logs
 */
function formatRecentLogs(logs: ErrorLog[], hours: number): string {
  if (logs.length === 0) {
    return `⏰ **Recent Activity (Last ${hours}h)**\n\n✅ No errors or warnings in the last ${hours} hours. System running smoothly!`
  }

  let response = `⏰ **Recent Activity (Last ${hours}h)** - ${logs.length} issues found\n\n`
  
  // Group by severity for better overview
  const critical = logs.filter(l => l.severity === 'critical')
  const warnings = logs.filter(l => l.severity === 'warning')
  const info = logs.filter(l => l.severity === 'info')

  if (critical.length > 0) {
    response += `🚨 **CRITICAL ISSUES (${critical.length})**\n`
    critical.slice(0, 5).forEach(log => {
      const timeAgo = getTimeAgo(new Date(log.timestamp))
      response += `• ${log.error_type}: ${log.message} (${timeAgo}, ${log.occurrence_count}x)\n`
    })
    response += '\n'
  }

  if (warnings.length > 0) {
    response += `⚠️ **WARNINGS (${warnings.length})**\n`
    warnings.slice(0, 5).forEach(log => {
      const timeAgo = getTimeAgo(new Date(log.timestamp))
      response += `• ${log.error_type}: ${log.message} (${timeAgo}, ${log.occurrence_count}x)\n`
    })
    response += '\n'
  }

  if (info.length > 0) {
    response += `ℹ️ **INFO (${info.length})**\n`
    info.slice(0, 3).forEach(log => {
      const timeAgo = getTimeAgo(new Date(log.timestamp))
      response += `• ${log.error_type}: ${log.message} (${timeAgo}, ${log.occurrence_count}x)\n`
    })
    response += '\n'
  }

  response += `💡 **Need details?** Use \`get_by_id\` with any log ID for full context and debugging suggestions.`

  return response
}

/**
 * Format error types list
 */
function formatErrorTypes(types: string[]): string {
  if (types.length === 0) {
    return `📋 **Error Types**\n\nNo error types found in the logs.`
  }

  let response = `📋 **Available Error Types** (${types.length} types)\n\n`
  
  types.forEach((type, index) => {
    response += `${index + 1}. **${type}**\n`
  })

  response += `\n💡 **Usage:** Use \`by_type\` action with any of these error types to see specific occurrences.`

  return response
}

/**
 * Format log query results
 */
function formatLogResults(result: { logs: ErrorLog[], total: number, totalPages: number }, title: string): string {
  if (result.logs.length === 0) {
    return `📊 **${title}**\n\nNo logs found matching your criteria.`
  }

  let response = `📊 **${title}** (Page ${Math.floor((result.logs.length - 1) / 20) + 1}/${result.totalPages})\n`
  response += `Found ${result.total} total logs\n\n`

  result.logs.forEach((log: ErrorLog, index: number) => {
    const timeAgo = getTimeAgo(new Date(log.timestamp))
    const severityIcon = getSeverityIcon(log.severity)
    
    response += `${index + 1}. ${severityIcon} **${log.error_type}** (${log.severity})\n`
    response += `   📅 ${timeAgo} • 🔢 ${log.occurrence_count}x\n`
    response += `   💬 ${log.message}\n`
    if (log.endpoint) response += `   🌐 ${log.endpoint}\n`
    if (log.suggested_action) response += `   🔧 ${log.suggested_action}\n`
    response += `   🆔 \`${log.id}\`\n\n`
  })

  if (result.totalPages > 1) {
    response += `📄 **Pagination:** Use \`page\` parameter to navigate through ${result.totalPages} pages.`
  }

  return response
}

/**
 * Format fingerprint results (all occurrences of same error)
 */
function formatFingerprintResults(logs: ErrorLog[], fingerprint: string): string {
  if (logs.length === 0) {
    return `🔍 **Error Pattern "${fingerprint}"**\n\nNo logs found with this fingerprint.`
  }

  const firstLog = logs[0]
  const totalOccurrences = logs.reduce((sum, log) => sum + log.occurrence_count, 0)
  const timeSpan = logs.length > 1 ? 
    `${getTimeAgo(new Date(logs[logs.length - 1].timestamp))} to ${getTimeAgo(new Date(logs[0].timestamp))}` :
    getTimeAgo(new Date(firstLog.timestamp))

  let response = `🔍 **Error Pattern Analysis**\n\n`
  response += `**Fingerprint:** \`${fingerprint}\`\n`
  response += `**Error Type:** ${firstLog.error_type}\n`
  response += `**Severity:** ${getSeverityIcon(firstLog.severity)} ${firstLog.severity}\n`
  response += `**Total Occurrences:** ${totalOccurrences}\n`
  response += `**Time Span:** ${timeSpan}\n`
  response += `**Message Pattern:** ${firstLog.message}\n\n`

  if (firstLog.user_impact) {
    response += `**👥 User Impact:** ${firstLog.user_impact}\n\n`
  }

  if (firstLog.suggested_action) {
    response += `**🔧 Suggested Action:** ${firstLog.suggested_action}\n\n`
  }

  response += `**📊 Occurrence History:**\n`
  logs.slice(0, 10).forEach((log, index) => {
    const timeAgo = getTimeAgo(new Date(log.timestamp))
    response += `${index + 1}. ${timeAgo} - ${log.occurrence_count}x occurrences\n`
  })

  if (logs.length > 10) {
    response += `*... and ${logs.length - 10} more occurrences*\n`
  }

  return response
}

/**
 * Format system statistics
 */
function formatStats(stats: {
  totalLogs: number
  totalWarnings: number
  totalErrors: number
  criticalCount: number
  warningCount: number
  infoCount: number
  uniqueErrors: number
  mostCommonErrorType: string
  recentActivityCount: number
}): string {
  let response = `📊 **System Error Statistics**\n\n`
  
  response += `**📈 Overall Metrics:**\n`
  response += `• Total Logs: ${stats.totalLogs.toLocaleString()}\n`
  response += `• Unique Error Patterns: ${stats.uniqueErrors.toLocaleString()}\n`
  response += `• Recent Activity (24h): ${stats.recentActivityCount.toLocaleString()}\n\n`

  response += `**📊 By Level:**\n`
  response += `• 🔥 Errors: ${stats.totalErrors.toLocaleString()}\n`
  response += `• ⚠️ Warnings: ${stats.totalWarnings.toLocaleString()}\n\n`

  response += `**📊 By Severity:**\n`
  response += `• 🚨 Critical: ${stats.criticalCount.toLocaleString()}\n`
  response += `• ⚠️ Warning: ${stats.warningCount.toLocaleString()}\n`
  response += `• ℹ️ Info: ${stats.infoCount.toLocaleString()}\n\n`

  response += `**🎯 Most Common Issue:** ${stats.mostCommonErrorType}\n\n`

  // Health assessment
  if (stats.criticalCount > 0) {
    response += `🚨 **Health Status:** ATTENTION REQUIRED - ${stats.criticalCount} critical issues need immediate attention.`
  } else if (stats.recentActivityCount > 50) {
    response += `⚠️ **Health Status:** ELEVATED ACTIVITY - ${stats.recentActivityCount} recent issues detected.`
  } else {
    response += `✅ **Health Status:** STABLE - System operating within normal parameters.`
  }

  return response
}

/**
 * Format a single detailed log entry
 */
function formatSingleLog(log: ErrorLog): string {
  const timeAgo = getTimeAgo(new Date(log.timestamp))
  const severityIcon = getSeverityIcon(log.severity)
  
  let response = `🔍 **Detailed Log Analysis**\n\n`
  
  response += `**${severityIcon} ${log.error_type.toUpperCase()}** (${log.severity})\n`
  response += `**Message:** ${log.message}\n`
  response += `**Time:** ${timeAgo} (${log.timestamp})\n`
  response += `**Occurrences:** ${log.occurrence_count}x\n`
  if (log.endpoint) response += `**Endpoint:** ${log.endpoint}\n`
  response += `**Fingerprint:** \`${log.fingerprint}\`\n\n`

  if (log.user_impact) {
    response += `**👥 User Impact:**\n${log.user_impact}\n\n`
  }

  if (log.suggested_action) {
    response += `**🔧 Suggested Action:**\n${log.suggested_action}\n\n`
  }

  if (log.error_details) {
    response += `**🐛 Error Details:**\n`
    response += `• Name: ${log.error_details.name}\n`
    response += `• Message: ${log.error_details.message}\n`
    if (log.error_details.stack) {
      const stackLines = log.error_details.stack.split('\n').slice(0, 5)
      response += `• Stack (top 5 lines):\n\`\`\`\n${stackLines.join('\n')}\n\`\`\`\n`
    }
    response += '\n'
  }

  if (log.context && Object.keys(log.context).length > 0) {
    response += `**🔧 Technical Context:**\n\`\`\`json\n${JSON.stringify(log.context, null, 2)}\n\`\`\`\n\n`
  }

  response += `**🔗 Related Actions:**\n`
  response += `• Use \`by_fingerprint\` with \`${log.fingerprint}\` to see all occurrences\n`
  response += `• Use \`by_type\` with \`${log.error_type}\` to see similar errors\n`
  response += `• Check recent activity for patterns around this time\n`

  return response
}

/**
 * Get severity icon
 */
function getSeverityIcon(severity: string): string {
  const icons = {
    critical: '🚨',
    warning: '⚠️',
    info: 'ℹ️'
  }
  return icons[severity as keyof typeof icons] || '❓'
}

/**
 * Calculate time ago in human-readable format
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
    return `${diffMinutes}m ago`
  } else if (diffHours < 24) {
    return `${diffHours}h ago`
  } else {
    return `${diffDays}d ago`
  }
}

/**
 * Validate UUID format (RFC 4122 compliant)
 */
function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  return uuidRegex.test(uuid)
}

// Export the tool instance
export const errorLogsTool = createErrorLogsTool()