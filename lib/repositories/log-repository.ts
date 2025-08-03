import { createBrowserClient } from '@supabase/ssr'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database, ErrorLog } from '../types'

interface LogQueryOptions {
  level?: 'warn' | 'error' | 'both'
  errorType?: string
  severity?: 'critical' | 'warning' | 'info'
  startDate?: string
  endDate?: string
  limit?: number
  offset?: number
  orderBy?: 'timestamp' | 'occurrence_count' | 'last_seen'
  ascending?: boolean
}

interface LogQueryResult {
  logs: ErrorLog[]
  total: number
  totalPages: number
}

interface LogStats {
  totalLogs: number
  totalWarnings: number
  totalErrors: number
  criticalCount: number
  warningCount: number
  infoCount: number
  uniqueErrors: number
  mostCommonErrorType: string
  recentActivityCount: number // last 24 hours
}

/**
 * Repository for managing error log database operations
 * Provides CRUD operations and advanced querying capabilities
 */
export class LogRepository {
  private supabase: SupabaseClient<Database>

  constructor(supabase?: SupabaseClient<Database>) {
    if (supabase) {
      this.supabase = supabase
    } else {
      // Create a browser client directly to avoid server/client import issues
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      this.supabase = createBrowserClient<Database>(supabaseUrl, supabaseAnonKey)
    }
  }

  /**
   * Build base query with common filters
   */
  private buildBaseQuery(options: LogQueryOptions = {}) {
    let query = this.supabase
      .from('error_logs')
      .select('*', { count: 'exact' })

    // Filter by level
    if (options.level && options.level !== 'both') {
      query = query.eq('level', options.level)
    }

    // Filter by error type
    if (options.errorType) {
      query = query.eq('error_type', options.errorType)
    }

    // Filter by severity
    if (options.severity) {
      query = query.eq('severity', options.severity)
    }

    // Filter by date range
    if (options.startDate) {
      query = query.gte('timestamp', options.startDate)
    }
    if (options.endDate) {
      query = query.lte('timestamp', options.endDate)
    }

    // Add ordering
    const orderField = options.orderBy || 'timestamp'
    query = query.order(orderField, { ascending: options.ascending ?? false })

    return query
  }

  /**
   * Get logs with filtering and pagination
   */
  async getLogs(
    page: number = 1,
    limit: number = 50,
    options: LogQueryOptions = {}
  ): Promise<LogQueryResult> {
    try {
      const offset = (page - 1) * limit

      // Build query with filters
      let query = this.buildBaseQuery(options)

      // Apply pagination
      query = query.range(offset, offset + limit - 1)

      const { data: logs, error, count } = await query

      if (error) {
        console.error('Error fetching logs:', error)
        return { logs: [], total: 0, totalPages: 0 }
      }

      const total = count || 0
      const totalPages = Math.ceil(total / limit)

      return {
        logs: logs || [],
        total,
        totalPages
      }
    } catch (error) {
      console.error('Error in getLogs:', error)
      return { logs: [], total: 0, totalPages: 0 }
    }
  }

  /**
   * Get a specific log by ID
   */
  async getLogById(id: string): Promise<ErrorLog | null> {
    try {
      const { data: log, error } = await this.supabase
        .from('error_logs')
        .select('*')
        .eq('id', id)
        .single()

      if (error) {
        console.error('Error fetching log by ID:', error)
        return null
      }

      return log
    } catch (error) {
      console.error('Error in getLogById:', error)
      return null
    }
  }

  /**
   * Get recent logs (last 24 hours by default)
   */
  async getRecentLogs(
    hours: number = 24,
    limit: number = 100
  ): Promise<ErrorLog[]> {
    try {
      const startDate = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString()

      const { data: logs, error } = await this.supabase
        .from('error_logs')
        .select('*')
        .gte('timestamp', startDate)
        .order('timestamp', { ascending: false })
        .limit(limit)

      if (error) {
        console.error('Error fetching recent logs:', error)
        return []
      }

      return logs || []
    } catch (error) {
      console.error('Error in getRecentLogs:', error)
      return []
    }
  }

  /**
   * Get logs by fingerprint (all occurrences of the same error)
   */
  async getLogsByFingerprint(fingerprint: string): Promise<ErrorLog[]> {
    try {
      const { data: logs, error } = await this.supabase
        .from('error_logs')
        .select('*')
        .eq('fingerprint', fingerprint)
        .order('timestamp', { ascending: false })

      if (error) {
        console.error('Error fetching logs by fingerprint:', error)
        return []
      }

      return logs || []
    } catch (error) {
      console.error('Error in getLogsByFingerprint:', error)
      return []
    }
  }

  /**
   * Get logs grouped by error type
   */
  async getLogsByErrorType(): Promise<Record<string, number>> {
    try {
      const { data: logs, error } = await this.supabase
        .from('error_logs')
        .select('error_type, occurrence_count')

      if (error) {
        console.error('Error fetching logs by error type:', error)
        return {}
      }

      // Aggregate by error type
      const grouped = logs?.reduce((acc, log) => {
        acc[log.error_type] = (acc[log.error_type] || 0) + log.occurrence_count
        return acc
      }, {} as Record<string, number>) || {}

      return grouped
    } catch (error) {
      console.error('Error in getLogsByErrorType:', error)
      return {}
    }
  }

  /**
   * Get comprehensive statistics about logs
   */
  async getLogStats(): Promise<LogStats> {
    try {
      // Get all logs for comprehensive stats
      const { data: logs, error } = await this.supabase
        .from('error_logs')
        .select('*')

      if (error) {
        console.error('Error fetching log stats:', error)
        return {
          totalLogs: 0,
          totalWarnings: 0,
          totalErrors: 0,
          criticalCount: 0,
          warningCount: 0,
          infoCount: 0,
          uniqueErrors: 0,
          mostCommonErrorType: 'unknown',
          recentActivityCount: 0
        }
      }

      const allLogs = logs || []
      const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000)

      // Calculate stats
      const totalLogs = allLogs.reduce((sum, log) => sum + log.occurrence_count, 0)
      const totalWarnings = allLogs
        .filter(log => log.level === 'warn')
        .reduce((sum, log) => sum + log.occurrence_count, 0)
      const totalErrors = allLogs
        .filter(log => log.level === 'error')
        .reduce((sum, log) => sum + log.occurrence_count, 0)

      const criticalCount = allLogs
        .filter(log => log.severity === 'critical')
        .reduce((sum, log) => sum + log.occurrence_count, 0)
      const warningCount = allLogs
        .filter(log => log.severity === 'warning')
        .reduce((sum, log) => sum + log.occurrence_count, 0)
      const infoCount = allLogs
        .filter(log => log.severity === 'info')
        .reduce((sum, log) => sum + log.occurrence_count, 0)

      const uniqueErrors = allLogs.length

      // Find most common error type
      const errorTypeCounts = allLogs.reduce((acc, log) => {
        acc[log.error_type] = (acc[log.error_type] || 0) + log.occurrence_count
        return acc
      }, {} as Record<string, number>)

      const mostCommonErrorType = Object.entries(errorTypeCounts)
        .sort(([, a], [, b]) => (b as number) - (a as number))[0]?.[0] || 'unknown'

      // Recent activity (last 24 hours)
      const recentActivityCount = allLogs
        .filter(log => new Date(log.last_seen) > last24Hours)
        .reduce((sum, log) => sum + log.occurrence_count, 0)

      return {
        totalLogs,
        totalWarnings,
        totalErrors,
        criticalCount,
        warningCount,
        infoCount,
        uniqueErrors,
        mostCommonErrorType,
        recentActivityCount
      }
    } catch (error) {
      console.error('Error in getLogStats:', error)
      return {
        totalLogs: 0,
        totalWarnings: 0,
        totalErrors: 0,
        criticalCount: 0,
        warningCount: 0,
        infoCount: 0,
        uniqueErrors: 0,
        mostCommonErrorType: 'unknown',
        recentActivityCount: 0
      }
    }
  }

  /**
   * Search logs by message content
   */
  async searchLogs(
    searchTerm: string,
    limit: number = 50
  ): Promise<ErrorLog[]> {
    try {
      const { data: logs, error } = await this.supabase
        .from('error_logs')
        .select('*')
        .ilike('message', `%${searchTerm}%`)
        .order('timestamp', { ascending: false })
        .limit(limit)

      if (error) {
        console.error('Error searching logs:', error)
        return []
      }

      return logs || []
    } catch (error) {
      console.error('Error in searchLogs:', error)
      return []
    }
  }

  /**
   * Delete old logs (cleanup operation)
   */
  async deleteOldLogs(daysOld: number = 30): Promise<number> {
    try {
      const cutoffDate = new Date(Date.now() - daysOld * 24 * 60 * 60 * 1000).toISOString()

      const { error, count } = await this.supabase
        .from('error_logs')
        .delete({ count: 'exact' })
        .lt('timestamp', cutoffDate)

      if (error) {
        console.error('Error deleting old logs:', error)
        return 0
      }

      return count || 0
    } catch (error) {
      console.error('Error in deleteOldLogs:', error)
      return 0
    }
  }

  /**
   * Get distinct error types
   */
  async getErrorTypes(): Promise<string[]> {
    try {
      const { data: logs, error } = await this.supabase
        .from('error_logs')
        .select('error_type')
        .order('error_type')

      if (error) {
        console.error('Error fetching error types:', error)
        return []
      }

      // Get unique error types
      const uniqueTypes = [...new Set(logs?.map(log => log.error_type) || [])]
      return uniqueTypes
    } catch (error) {
      console.error('Error in getErrorTypes:', error)
      return []
    }
  }
}

// Export singleton instance for convenience
export const logRepository = new LogRepository()

// Export factory function for custom clients
export const createLogRepository = (supabase?: SupabaseClient<Database>) => 
  new LogRepository(supabase)