import { notificationService, AdminNotification } from './services/notification.service'
import { ErrorAnalyzer } from './services/error-analyzer.service'

type LogLevel = 'debug' | 'info' | 'warn' | 'error'

interface LogEntry {
  timestamp: string
  level: LogLevel
  message: string
  context?: Record<string, unknown>
  error?: Error
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development'
  private isClient = typeof window !== 'undefined'

  private formatTimestamp(): string {
    return new Date().toISOString()
  }

  private shouldLog(level: LogLevel): boolean {
    // In production, only log warnings and errors
    if (!this.isDevelopment && (level === 'debug' || level === 'info')) {
      return false
    }
    return true
  }

  private createLogEntry(
    level: LogLevel,
    message: string,
    context?: Record<string, unknown>,
    error?: Error
  ): LogEntry {
    return {
      timestamp: this.formatTimestamp(),
      level,
      message,
      context,
      error
    }
  }

  private outputLog(entry: LogEntry): void {
    if (!this.shouldLog(entry.level)) return

    const prefix = `[${entry.timestamp}] [${entry.level.toUpperCase()}]`
    const fullMessage = `${prefix} ${entry.message}`

    // In development, use console methods with appropriate styling
    if (this.isDevelopment) {
      switch (entry.level) {
        case 'debug':
          console.debug(fullMessage, entry.context || '', entry.error || '')
          break
        case 'info':
          console.info(fullMessage, entry.context || '', entry.error || '')
          break
        case 'warn':
          console.warn(fullMessage, entry.context || '', entry.error || '')
          break
        case 'error':
          console.error(fullMessage, entry.context || '', entry.error || '')
          break
      }
    } else {
      // In production, you could send logs to a service like LogRocket, Sentry, etc.
      // For now, we'll still use console for errors and warnings
      if (entry.level === 'error' || entry.level === 'warn') {
        console[entry.level](fullMessage, entry.context || '', entry.error || '')
      }
    }
  }

  debug(message: string, context?: Record<string, unknown>): void {
    const entry = this.createLogEntry('debug', message, context)
    this.outputLog(entry)
  }

  info(message: string, context?: Record<string, unknown>): void {
    const entry = this.createLogEntry('info', message, context)
    this.outputLog(entry)
  }

  warn(message: string, context?: Record<string, unknown>, error?: Error): void {
    const entry = this.createLogEntry('warn', message, context, error)
    this.outputLog(entry)
  }

  error(message: string, context?: Record<string, unknown>, error?: Error): void {
    const entry = this.createLogEntry('error', message, context, error)
    this.outputLog(entry)
  }

  // Convenience method for API errors
  apiError(endpoint: string, error: Error, context?: Record<string, unknown>): void {
    this.error(`API Error: ${endpoint}`, { ...context, endpoint }, error)
  }

  // Convenience method for database errors  
  dbError(operation: string, error: Error, context?: Record<string, unknown>): void {
    this.error(`Database Error: ${operation}`, { ...context, operation }, error)
    this.notifyAdmin(error, 'critical', { operation, type: 'database' })
  }

  /**
   * Notify admin of critical production errors
   * Only triggers in production and for server-side errors
   */
  notifyAdmin(
    error: Error, 
    severity: AdminNotification['severity'] = 'warning',
    context?: Record<string, unknown>
  ): void {
    // Only notify in production and on server-side (allow in dev for testing)
    if (this.isClient) {
      return
    }
    
    // Allow notifications in development for testing
    const allowDevNotifications = process.env.ALLOW_DEV_NOTIFICATIONS === 'true'
    if (this.isDevelopment && !allowDevNotifications) {
      return
    }

    // Analyze error for comprehensive details
    const analysis = ErrorAnalyzer.analyzeError(error, context?.endpoint as string, context)
    
    // Use provided severity or fallback to analyzed severity
    const finalSeverity = severity !== 'warning' ? severity : analysis.severity

    // Create notification
    notificationService.addNotification({
      type: analysis.type,
      severity: finalSeverity,
      message: error.message,
      context,
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack
      },
      endpoint: context?.endpoint as string,
      userImpact: analysis.userImpact,
      suggestedAction: analysis.suggestedAction
    })
  }

  /**
   * Enhanced API error logging with admin notification
   */
  criticalApiError(endpoint: string, error: Error, context?: Record<string, unknown>): void {
    this.error(`Critical API Error: ${endpoint}`, { ...context, endpoint }, error)
    this.notifyAdmin(error, 'critical', { ...context, endpoint, type: 'api' })
  }

  /**
   * Enhanced database error logging with admin notification
   */
  criticalDbError(operation: string, error: Error, context?: Record<string, unknown>): void {
    this.error(`Critical Database Error: ${operation}`, { ...context, operation }, error)
    this.notifyAdmin(error, 'critical', { ...context, operation, type: 'database' })
  }

  /**
   * Authentication error with admin notification
   */
  authError(error: Error, context?: Record<string, unknown>): void {
    this.error('Authentication Error', context, error)
    this.notifyAdmin(error, 'critical', { ...context, type: 'auth' })
  }

  /**
   * External service error with admin notification
   */
  serviceError(service: string, error: Error, context?: Record<string, unknown>): void {
    this.error(`External Service Error: ${service}`, { ...context, service }, error)
    const severity = service.toLowerCase().includes('spotify') ? 'warning' : 'critical'
    this.notifyAdmin(error, severity, { ...context, service, type: 'external_service' })
  }

  /**
   * AI agent error with medium-severity admin notification
   * These are technical failures that have graceful fallbacks
   */
  agentError(operation: string, error: Error, context?: Record<string, unknown>): void {
    this.error(`AI Agent Error: ${operation}`, { ...context, operation }, error)
    this.notifyAdmin(error, 'warning', { ...context, operation, type: 'ai_agent' })
  }
}

// Export singleton instance
export const logger = new Logger()

// Export default for easy importing
export default logger