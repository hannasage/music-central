import { ErrorAnalyzer } from './error-analyzer.service'
import { createBrowserClient } from '@supabase/ssr'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '../types'
import crypto from 'crypto'

interface LogEntry {
  timestamp: string
  level: 'warn' | 'error'
  message: string
  context?: Record<string, unknown>
  error?: Error
}

interface ProcessedLogEntry {
  timestamp: string
  level: 'warn' | 'error'
  message: string
  error_type: string
  severity: 'critical' | 'warning' | 'info'
  context: Record<string, unknown>
  error_details: {
    name: string
    message: string
    stack?: string
  } | null
  endpoint: string | null
  user_impact: string | null
  suggested_action: string | null
  fingerprint: string
  first_seen: string
  last_seen: string
  occurrence_count: number
}

/**
 * Service for storing error and warning logs in the database
 * Handles deduplication, enrichment, and batch processing
 */
export class LogStorageService {
  private static instance: LogStorageService
  private supabase: SupabaseClient<Database> | null = null
  private pendingLogs: ProcessedLogEntry[] = []
  private batchTimeout: NodeJS.Timeout | null = null
  private readonly BATCH_SIZE = 10
  private readonly BATCH_DELAY = 5000 // 5 seconds
  private readonly DEDUPLICATION_WINDOW = 24 * 60 * 60 * 1000 // 24 hours
  private isClient = typeof window !== 'undefined'
  private isEnabled = process.env.ENABLE_LOG_PERSISTENCE !== 'false'

  private constructor() {
    // Create a browser client directly to avoid server/client import issues
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    
    if (supabaseUrl && supabaseAnonKey) {
      this.supabase = createBrowserClient<Database>(supabaseUrl, supabaseAnonKey)
    } else {
      console.warn('Supabase environment variables not found, disabling log persistence')
      this.isEnabled = false
    }
  }

  static getInstance(): LogStorageService {
    if (!LogStorageService.instance) {
      LogStorageService.instance = new LogStorageService()
    }
    return LogStorageService.instance
  }

  /**
   * Generate a unique fingerprint for error deduplication
   */
  private generateFingerprint(
    errorType: string,
    message: string,
    endpoint?: string,
    context?: Record<string, unknown>
  ): string {
    // Normalize message by removing timestamps, IDs, and variable parts
    const normalizedMessage = message
      .replace(/\d{4}-\d{2}-\d{2}[T\s]\d{2}:\d{2}:\d{2}/g, 'TIMESTAMP')
      .replace(/[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}/gi, 'UUID')
      .replace(/\d+ms|\d+s|\d+ seconds?|\d+ minutes?/g, 'DURATION')
      .replace(/\b\d+\b/g, 'NUMBER')
      .toLowerCase()
      .trim()

    // Include key context elements that affect error classification
    const relevantContext = context ? {
      operation: context.operation,
      type: context.type,
      service: context.service
    } : {}

    const fingerprintData = {
      errorType,
      message: normalizedMessage,
      endpoint: endpoint || null,
      context: relevantContext
    }

    return crypto
      .createHash('sha256')
      .update(JSON.stringify(fingerprintData))
      .digest('hex')
      .substring(0, 16) // Use first 16 characters for brevity
  }

  /**
   * Process and enrich a log entry with error analysis
   */
  private processLogEntry(entry: LogEntry): ProcessedLogEntry {
    const endpoint = entry.context?.endpoint as string || undefined
    
    // Use ErrorAnalyzer to classify and enrich the error
    let analysis
    if (entry.error) {
      analysis = ErrorAnalyzer.analyzeError(entry.error, endpoint, entry.context)
    } else {
      // For warnings without error objects, create a synthetic error for analysis
      const syntheticError = new Error(entry.message)
      analysis = ErrorAnalyzer.analyzeError(syntheticError, endpoint, entry.context)
    }

    const fingerprint = this.generateFingerprint(
      analysis.type,
      entry.message,
      endpoint || undefined,
      entry.context
    )

    const errorDetails = entry.error ? {
      name: entry.error.name,
      message: entry.error.message,
      stack: entry.error.stack
    } : null

    return {
      timestamp: entry.timestamp,
      level: entry.level,
      message: entry.message,
      error_type: analysis.type,
      severity: analysis.severity,
      context: entry.context || {},
      error_details: errorDetails,
      endpoint: endpoint || null,
      user_impact: analysis.userImpact,
      suggested_action: analysis.suggestedAction,
      fingerprint,
      first_seen: entry.timestamp,
      last_seen: entry.timestamp,
      occurrence_count: 1
    }
  }

  /**
   * Check if a similar error exists and handle deduplication
   */
  private async handleDeduplication(processedEntry: ProcessedLogEntry): Promise<void> {
    if (!this.supabase) {
      return // Skip if no database connection
    }

    try {
      const cutoffTime = new Date(Date.now() - this.DEDUPLICATION_WINDOW).toISOString()

      // Look for existing error with same fingerprint in the last 24 hours
      const { data: existingLog, error } = await this.supabase
        .from('error_logs')
        .select('*')
        .eq('fingerprint', processedEntry.fingerprint)
        .gte('last_seen', cutoffTime)
        .order('last_seen', { ascending: false })
        .limit(1)
        .single()

      if (error && error.code !== 'PGRST116') {
        // PGRST116 is "not found" which is expected for new errors
        console.error('Error checking for duplicate logs:', error)
        return
      }

      if (existingLog) {
        // Update existing log: increment count and update last_seen
        const { error: updateError } = await this.supabase
          .from('error_logs')
          .update({
            occurrence_count: existingLog.occurrence_count + 1,
            last_seen: processedEntry.timestamp,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingLog.id)

        if (updateError) {
          console.error('Error updating log occurrence count:', updateError)
        }
      } else {
        // Insert new log entry
        const { error: insertError } = await this.supabase
          .from('error_logs')
          .insert({
            timestamp: processedEntry.timestamp,
            level: processedEntry.level,
            message: processedEntry.message,
            error_type: processedEntry.error_type,
            severity: processedEntry.severity,
            context: processedEntry.context,
            error_details: processedEntry.error_details,
            endpoint: processedEntry.endpoint,
            user_impact: processedEntry.user_impact,
            suggested_action: processedEntry.suggested_action,
            fingerprint: processedEntry.fingerprint,
            occurrence_count: processedEntry.occurrence_count,
            first_seen: processedEntry.first_seen,
            last_seen: processedEntry.last_seen
          })

        if (insertError) {
          console.error('Error inserting new log entry:', insertError)
        }
      }
    } catch (error) {
      console.error('Error in handleDeduplication:', error)
    }
  }

  /**
   * Process pending logs in batch
   */
  private async processBatch(): Promise<void> {
    if (this.pendingLogs.length === 0) return

    const batch = this.pendingLogs.splice(0, this.BATCH_SIZE)
    
    try {
      // Process each log entry with deduplication
      for (const entry of batch) {
        await this.handleDeduplication(entry)
      }
    } catch (error) {
      console.error('Error processing log batch:', error)
    }

    // Schedule next batch if there are more logs
    if (this.pendingLogs.length > 0) {
      this.scheduleBatch()
    }
  }

  /**
   * Schedule batch processing
   */
  private scheduleBatch(): void {
    if (this.batchTimeout) {
      clearTimeout(this.batchTimeout)
    }

    this.batchTimeout = setTimeout(() => {
      this.processBatch()
    }, this.BATCH_DELAY)
  }

  /**
   * Store a log entry (public interface)
   */
  async storeLog(entry: LogEntry): Promise<void> {
    // Skip if logging is disabled, running on client, or not warn/error level
    if (!this.isEnabled || this.isClient || !['warn', 'error'].includes(entry.level)) {
      return
    }

    try {
      const processedEntry = this.processLogEntry(entry)
      
      // Add to pending batch
      this.pendingLogs.push(processedEntry)

      // Process immediately if batch is full, otherwise schedule
      if (this.pendingLogs.length >= this.BATCH_SIZE) {
        await this.processBatch()
      } else {
        this.scheduleBatch()
      }
    } catch (error) {
      // Don't let logging errors break the application
      console.error('Error in storeLog:', error)
    }
  }

  /**
   * Force flush all pending logs (useful for testing or shutdown)
   */
  async flushPendingLogs(): Promise<void> {
    if (this.batchTimeout) {
      clearTimeout(this.batchTimeout)
      this.batchTimeout = null
    }

    while (this.pendingLogs.length > 0) {
      await this.processBatch()
    }
  }

  /**
   * Get service status for monitoring
   */
  getStatus(): {
    isEnabled: boolean
    pendingLogsCount: number
    isClient: boolean
  } {
    return {
      isEnabled: this.isEnabled,
      pendingLogsCount: this.pendingLogs.length,
      isClient: this.isClient
    }
  }
}

// Export singleton instance
export const logStorageService = LogStorageService.getInstance()