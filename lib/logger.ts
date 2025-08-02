
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
  }

  /**
   * Enhanced API error logging
   */
  criticalApiError(endpoint: string, error: Error, context?: Record<string, unknown>): void {
    this.error(`Critical API Error: ${endpoint}`, { ...context, endpoint }, error)
  }

  /**
   * Authentication error logging
   */
  authError(error: Error, context?: Record<string, unknown>): void {
    this.error('Authentication Error', context, error)
  }

  /**
   * External service error logging
   */
  serviceError(service: string, error: Error, context?: Record<string, unknown>): void {
    this.error(`External Service Error: ${service}`, { ...context, service }, error)
  }

  /**
   * AI agent error logging
   */
  agentError(operation: string, error: Error, context?: Record<string, unknown>): void {
    this.error(`AI Agent Error: ${operation}`, { ...context, operation }, error)
  }
}

// Export singleton instance
export const logger = new Logger()

// Export default for easy importing
export default logger