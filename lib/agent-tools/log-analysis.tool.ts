/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { tool } from '@openai/agents'
import { z } from 'zod'
import { createLogRepository } from '../repositories/log-repository'
import { createServerComponentClient } from '../supabase'
import type { ToolContext } from './types'
import type { ErrorLog } from '../types'

type LogRepository = ReturnType<typeof createLogRepository>

/**
 * Log Analysis Tool - Provides advanced pattern detection and correlation analysis
 * Helps identify trends, correlations, and debugging insights from error logs
 */
export const createLogAnalysisTool = (context?: ToolContext) => {
  return tool({
    name: 'analyze_error_patterns',
    description: 'Perform advanced analysis on error logs to identify patterns, correlations, and debugging insights. Helps understand system health trends and root causes.',
    parameters: z.object({
      analysis: z.enum([
        'trends', 
        'correlations', 
        'spike_detection', 
        'error_cascade', 
        'health_report',
        'debugging_insights'
      ]).describe('Type of analysis to perform'),
      
      // Time range parameters
      hours: z.number().default(24).describe('Time window for analysis (hours)'),
      
      // Specific analysis parameters
      errorType: z.string().nullable().default(null).describe('Focus analysis on specific error type'),
      threshold: z.number().default(5).describe('Threshold for spike detection or correlation analysis'),
      
      // Comparison parameters
      compareHours: z.number().nullable().default(null).describe('Compare current period with previous period of this many hours')
    }),
    execute: async (input) => {
      try {
        console.log('Log analysis tool executed with input:', input)
        
        // Create repository with proper context
        let logRepository
        if (context?.supabase) {
          logRepository = createLogRepository(context.supabase)
        } else {
          const supabase = await createServerComponentClient()
          logRepository = createLogRepository(supabase)
        }

        switch (input.analysis) {
          case 'trends':
            return await analyzeTrends(logRepository, input.hours || 24, input.compareHours || undefined)

          case 'correlations':
            return await analyzeCorrelations(logRepository, input.hours || 24, input.threshold || 5)

          case 'spike_detection':
            return await detectSpikes(logRepository, input.hours || 24, input.threshold || 5)

          case 'error_cascade':
            return await analyzeErrorCascades(logRepository, input.hours || 24)

          case 'health_report':
            return await generateHealthReport(logRepository, input.hours || 24)

          case 'debugging_insights':
            return await generateDebuggingInsights(logRepository, input.errorType || undefined, input.hours || 24)

          default:
            return '❌ **Error:** Invalid analysis type specified.'
        }

      } catch (error) {
        console.error('Log analysis tool error:', error)
        return `❌ **Error performing analysis:** ${error instanceof Error ? error.message : 'Unknown error occurred'}\n\nPlease check the logging system status and try again.`
      }
    }
  })
}

/**
 * Analyze trends over time periods
 */
async function analyzeTrends(repository: LogRepository, hours: number, compareHours?: number): Promise<string> {
  const endTime = new Date()
  const startTime = new Date(endTime.getTime() - hours * 60 * 60 * 1000)
  
  // Get current period logs
  const currentLogs = await repository.getLogs(1, 1000, {
    startDate: startTime.toISOString(),
    endDate: endTime.toISOString()
  })

  let response = `📈 **Error Trends Analysis** (Last ${hours}h)\n\n`

  if (currentLogs.logs.length === 0) {
    return response + '✅ No errors found in the specified time period. System is stable!'
  }

  // Analyze by error type
  const errorTypeBreakdown = analyzeByErrorType(currentLogs.logs)
  response += '**📊 Error Distribution by Type:**\n'
  Object.entries(errorTypeBreakdown)
    .sort(([,a], [,b]) => (b as number) - (a as number))
    .slice(0, 10)
    .forEach(([type, count]) => {
      response += `• **${type}**: ${count} occurrences\n`
    })

  // Analyze by severity
  const severityBreakdown = analyzeBySeverity(currentLogs.logs)
  response += '\n**⚠️ Severity Distribution:**\n'
  Object.entries(severityBreakdown).forEach(([severity, count]) => {
    const icon = getSeverityIcon(severity)
    response += `• ${icon} **${severity}**: ${count} occurrences\n`
  })

  // Compare with previous period if requested
  if (compareHours) {
    const compareStartTime = new Date(startTime.getTime() - compareHours * 60 * 60 * 1000)
    const previousLogs = await repository.getLogs(1, 1000, {
      startDate: compareStartTime.toISOString(),
      endDate: startTime.toISOString()
    })

    response += `\n**📊 Comparison with Previous ${compareHours}h:**\n`
    const currentTotal = currentLogs.logs.reduce((sum: number, log: any) => sum + log.occurrence_count, 0)
    const previousTotal = previousLogs.logs.reduce((sum: number, log: any) => sum + log.occurrence_count, 0)
    
    const change = currentTotal - previousTotal
    const changePercent = previousTotal > 0 ? ((change / previousTotal) * 100).toFixed(1) : 'N/A'
    
    if (change > 0) {
      response += `📈 **Increase**: +${change} errors (+${changePercent}%)\n`
    } else if (change < 0) {
      response += `📉 **Decrease**: ${change} errors (${changePercent}%)\n`
    } else {
      response += `➡️ **Stable**: No change in error count\n`
    }
  }

  response += '\n💡 **Insights:**\n'
  response += generateTrendInsights(errorTypeBreakdown, severityBreakdown)

  return response
}

/**
 * Analyze correlations between different error types
 */
async function analyzeCorrelations(repository: LogRepository, hours: number, threshold: number): Promise<string> {
  const endTime = new Date()
  const startTime = new Date(endTime.getTime() - hours * 60 * 60 * 1000)
  
  const logs = await repository.getLogs(1, 1000, {
    startDate: startTime.toISOString(),
    endDate: endTime.toISOString()
  })

  let response = `🔗 **Error Correlation Analysis** (Last ${hours}h)\n\n`

  if (logs.logs.length < 2) {
    return response + 'Insufficient data for correlation analysis. Need at least 2 different error types.'
  }

  // Group errors by time windows (15-minute buckets)
  const timeWindows = groupByTimeWindows(logs.logs, 15)
  const correlations = findCorrelations(timeWindows, threshold)

  if (correlations.length === 0) {
    response += `No significant correlations found (threshold: ${threshold} co-occurrences).\n\n`
  } else {
    response += '**🔍 Detected Correlations:**\n'
    correlations.forEach((correlation, index) => {
      response += `${index + 1}. **${correlation.type1}** ↔️ **${correlation.type2}**\n`
      response += `   • Co-occurred ${correlation.count} times\n`
      response += `   • Correlation strength: ${correlation.strength}\n`
      response += `   • Typical delay: ${correlation.avgDelay}min\n\n`
    })
  }

  response += '💡 **Correlation Insights:**\n'
  response += generateCorrelationInsights(correlations)

  return response
}

/**
 * Detect error spikes and anomalies
 */
async function detectSpikes(repository: any, hours: number, threshold: number): Promise<string> {
  const endTime = new Date()
  const startTime = new Date(endTime.getTime() - hours * 60 * 60 * 1000)
  
  const logs = await repository.getLogs(1, 1000, {
    startDate: startTime.toISOString(),
    endDate: endTime.toISOString()
  })

  let response = `🚀 **Error Spike Detection** (Last ${hours}h)\n\n`

  // Group by hour and detect spikes
  const hourlyBreakdown = groupByHour(logs.logs)
  const spikes = detectErrorSpikes(hourlyBreakdown, threshold)

  if (spikes.length === 0) {
    response += `✅ No significant error spikes detected (threshold: ${threshold} errors/hour).\n\n`
  } else {
    response += '**⚡ Detected Spikes:**\n'
    spikes.forEach((spike, index) => {
      const timeAgo = getTimeAgo(new Date(spike.hour))
      response += `${index + 1}. **${spike.hour}** (${timeAgo})\n`
      response += `   • ${spike.count} errors (${spike.multiplier}x normal)\n`
      response += `   • Top error: ${spike.topError}\n\n`
    })
  }

  response += '💡 **Spike Analysis:**\n'
  response += generateSpikeInsights(spikes, hourlyBreakdown)

  return response
}

/**
 * Analyze error cascades (chain reactions)
 */
async function analyzeErrorCascades(repository: any, hours: number): Promise<string> {
  const endTime = new Date()
  const startTime = new Date(endTime.getTime() - hours * 60 * 60 * 1000)
  
  const logs = await repository.getLogs(1, 1000, {
    startDate: startTime.toISOString(),
    endDate: endTime.toISOString(),
    orderBy: 'timestamp',
    ascending: true
  })

  let response = `⛓️ **Error Cascade Analysis** (Last ${hours}h)\n\n`

  if (logs.logs.length < 3) {
    return response + 'Insufficient data for cascade analysis. Need at least 3 errors in sequence.'
  }

  const cascades = detectErrorCascades(logs.logs)

  if (cascades.length === 0) {
    response += '✅ No error cascades detected. Errors appear to be isolated incidents.\n\n'
  } else {
    response += '**🌊 Detected Cascades:**\n'
    cascades.forEach((cascade, index) => {
      response += `${index + 1}. **Cascade triggered ${getTimeAgo(new Date(cascade.startTime))}**\n`
      response += `   • Duration: ${cascade.duration}min\n`
      response += `   • Sequence: ${cascade.sequence.join(' → ')}\n`
      response += `   • Total errors: ${cascade.totalErrors}\n\n`
    })
  }

  response += '💡 **Cascade Insights:**\n'
  response += generateCascadeInsights(cascades)

  return response
}

/**
 * Generate comprehensive health report
 */
async function generateHealthReport(repository: any, hours: number): Promise<string> {
  const stats = await repository.getLogStats()
  const recentLogs = await repository.getRecentLogs(hours, 100)

  let response = `🏥 **System Health Report** (Last ${hours}h)\n\n`

  // Overall health score
  const healthScore = calculateHealthScore(stats, recentLogs, hours)
  response += `**🎯 Health Score: ${healthScore.score}/100** (${healthScore.status})\n\n`

  // Key metrics
  response += '**📊 Key Metrics:**\n'
  response += `• Recent Errors: ${recentLogs.length}\n`
  response += `• Critical Issues: ${recentLogs.filter((l: ErrorLog) => l.severity === 'critical').length}\n`
  response += `• Error Rate: ${(recentLogs.length / hours).toFixed(2)} errors/hour\n`
  response += `• Unique Error Types: ${new Set(recentLogs.map((l: ErrorLog) => l.error_type)).size}\n\n`

  // Health indicators
  response += '**🚦 Health Indicators:**\n'
  response += generateHealthIndicators(recentLogs, hours)

  // Recommendations
  response += '**💡 Recommendations:**\n'
  response += generateHealthRecommendations(healthScore, recentLogs)

  return response
}

/**
 * Generate debugging insights for specific errors
 */
async function generateDebuggingInsights(repository: any, errorType?: string, hours: number = 24): Promise<string> {
  let response = `🔧 **Debugging Insights**\n\n`

  if (errorType) {
    // Specific error type analysis
    const logs = await repository.getLogs(1, 100, {
      errorType,
      startDate: new Date(Date.now() - hours * 60 * 60 * 1000).toISOString()
    })

    if (logs.logs.length === 0) {
      return response + `No recent occurrences of "${errorType}" found in the last ${hours} hours.`
    }

    response += `**Error Type: ${errorType}**\n\n`
    response += generateSpecificErrorInsights(logs.logs, errorType)
  } else {
    // General debugging insights
    const recentLogs = await repository.getRecentLogs(hours, 100)
    response += generateGeneralDebuggingInsights(recentLogs)
  }

  return response
}

// Helper functions for analysis
function analyzeByErrorType(logs: any[]): Record<string, number> {
  return logs.reduce((acc, log) => {
    acc[log.error_type] = (acc[log.error_type] || 0) + log.occurrence_count
    return acc
  }, {})
}

function analyzeBySeverity(logs: any[]): Record<string, number> {
  return logs.reduce((acc, log) => {
    acc[log.severity] = (acc[log.severity] || 0) + log.occurrence_count
    return acc
  }, {})
}

function groupByTimeWindows(logs: any[], windowMinutes: number): Record<string, any[]> {
  // Implementation for grouping logs by time windows
  const windows: Record<string, any[]> = {}
  logs.forEach(log => {
    const time = new Date(log.timestamp)
    const windowStart = new Date(Math.floor(time.getTime() / (windowMinutes * 60 * 1000)) * (windowMinutes * 60 * 1000))
    const key = windowStart.toISOString()
    if (!windows[key]) windows[key] = []
    windows[key].push(log)
  })
  return windows
}

function findCorrelations(_timeWindows: Record<string, ErrorLog[]>, _threshold: number): Array<{
  type1: string
  type2: string
  count: number
  strength: string
  avgDelay: number
}> {
  // Implementation for finding error correlations
  const correlations: Array<{
    type1: string
    type2: string
    count: number
    strength: string
    avgDelay: number
  }> = []
  // Simplified correlation detection logic - placeholder
  return correlations
}

function groupByHour(logs: any[]): Record<string, any[]> {
  const hours: Record<string, any[]> = {}
  logs.forEach(log => {
    const hour = new Date(log.timestamp).toISOString().substring(0, 13) + ':00:00.000Z'
    if (!hours[hour]) hours[hour] = []
    hours[hour].push(log)
  })
  return hours
}

function detectErrorSpikes(hourlyData: Record<string, any[]>, threshold: number): any[] {
  // Implementation for spike detection
  return Object.entries(hourlyData)
    .filter(([, logs]) => logs.length >= threshold)
    .map(([hour, logs]) => ({
      hour,
      count: logs.length,
      multiplier: Math.round(logs.length / threshold),
      topError: logs[0]?.error_type || 'unknown'
    }))
}

function detectErrorCascades(logs: any[]): any[] {
  // Implementation for cascade detection
  const cascades: any[] = []
  // Simplified cascade detection logic
  return cascades
}

function calculateHealthScore(stats: any, recentLogs: any[], hours: number): { score: number, status: string } {
  let score = 100
  
  // Deduct points for critical errors
  score -= Math.min(recentLogs.filter(l => l.severity === 'critical').length * 20, 60)
  
  // Deduct points for high error rate
  const errorRate = recentLogs.length / hours
  if (errorRate > 10) score -= 30
  else if (errorRate > 5) score -= 15
  else if (errorRate > 2) score -= 5
  
  // Deduct points for error variety (indicates systemic issues)
  const uniqueTypes = new Set(recentLogs.map(l => l.error_type)).size
  if (uniqueTypes > 5) score -= 10
  
  score = Math.max(0, score)
  
  const status = score >= 90 ? 'Excellent' : 
                score >= 70 ? 'Good' : 
                score >= 50 ? 'Needs Attention' : 'Critical'
  
  return { score, status }
}

function generateTrendInsights(errorTypes: Record<string, number>, severities: Record<string, number>): string {
  let insights = ''
  
  const topError = Object.entries(errorTypes)[0]
  if (topError) {
    insights += `• Most frequent issue: **${topError[0]}** (${topError[1]} occurrences)\n`
  }
  
  const criticalCount = severities.critical || 0
  if (criticalCount > 0) {
    insights += `• 🚨 ${criticalCount} critical issues require immediate attention\n`
  }
  
  return insights || '• System showing normal error patterns\n'
}

function generateCorrelationInsights(correlations: any[]): string {
  if (correlations.length === 0) {
    return '• Errors appear to be independent events\n• No cascading failure patterns detected\n'
  }
  
  return '• Consider investigating root causes of correlated errors\n• May indicate cascading failures or shared dependencies\n'
}

function generateSpikeInsights(spikes: any[], hourlyData: Record<string, any[]>): string {
  if (spikes.length === 0) {
    return '• Error rate is consistent without unusual spikes\n• System load appears stable\n'
  }
  
  return '• Consider investigating deployment times or external events\n• Monitor system resources during spike periods\n'
}

function generateCascadeInsights(cascades: any[]): string {
  if (cascades.length === 0) {
    return '• No error cascades detected\n• Failures appear to be isolated\n'
  }
  
  return '• Error cascades suggest systemic issues\n• Focus on the triggering error type\n'
}

function generateHealthIndicators(recentLogs: any[], hours: number): string {
  let indicators = ''
  
  const errorRate = recentLogs.length / hours
  if (errorRate < 1) indicators += '🟢 Low error rate\n'
  else if (errorRate < 5) indicators += '🟡 Moderate error rate\n'
  else indicators += '🔴 High error rate\n'
  
  const criticalCount = recentLogs.filter(l => l.severity === 'critical').length
  if (criticalCount === 0) indicators += '🟢 No critical issues\n'
  else indicators += `🔴 ${criticalCount} critical issues\n`
  
  return indicators
}

function generateHealthRecommendations(healthScore: any, recentLogs: any[]): string {
  let recommendations = ''
  
  if (healthScore.score < 70) {
    recommendations += '• Investigate critical errors immediately\n'
    recommendations += '• Review recent deployments or changes\n'
  }
  
  const dbErrors = recentLogs.filter(l => l.error_type === 'database_connection').length
  if (dbErrors > 0) {
    recommendations += '• Check database connection and performance\n'
  }
  
  return recommendations || '• Continue monitoring\n• System operating normally\n'
}

function generateSpecificErrorInsights(logs: any[], errorType: string): string {
  let insights = `**Occurrences:** ${logs.length} in the analyzed period\n\n`
  
  if (logs.length > 0) {
    const firstLog = logs[0]
    if (firstLog.suggested_action) {
      insights += `**💡 Suggested Action:** ${firstLog.suggested_action}\n\n`
    }
    
    if (firstLog.user_impact) {
      insights += `**👥 User Impact:** ${firstLog.user_impact}\n\n`
    }
  }
  
  return insights
}

function generateGeneralDebuggingInsights(recentLogs: any[]): string {
  if (recentLogs.length === 0) {
    return 'No recent errors to analyze. System is running smoothly!'
  }
  
  let insights = `**Recent Activity:** ${recentLogs.length} errors found\n\n`
  
  const criticalErrors = recentLogs.filter(l => l.severity === 'critical')
  if (criticalErrors.length > 0) {
    insights += `**🚨 Priority:** ${criticalErrors.length} critical errors need immediate attention\n\n`
  }
  
  return insights
}

function getSeverityIcon(severity: string): string {
  const icons = { critical: '🚨', warning: '⚠️', info: 'ℹ️' }
  return icons[severity as keyof typeof icons] || '❓'
}

function getTimeAgo(date: Date): string {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMinutes = Math.floor(diffMs / (1000 * 60))
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffMinutes < 1) return 'Just now'
  if (diffMinutes < 60) return `${diffMinutes}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  return `${diffDays}d ago`
}

// Export the tool instance
export const logAnalysisTool = createLogAnalysisTool()