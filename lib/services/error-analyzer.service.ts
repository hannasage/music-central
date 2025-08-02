import { AdminNotification } from './notification.service'

export type ErrorType = AdminNotification['type']
export type ErrorSeverity = AdminNotification['severity']

/**
 * Service for analyzing errors and providing intelligent classification
 * Handles error type detection, user impact assessment, and action suggestions
 */
export class ErrorAnalyzer {
  /**
   * Classify error type based on error message and context
   */
  static classifyError(error: Error, endpoint?: string): ErrorType {
    const message = error.message.toLowerCase()
    
    if (message.includes('supabase') || message.includes('database') || message.includes('connection')) {
      return 'database_connection'
    }
    if (message.includes('spotify') || message.includes('rate limit') || message.includes('429')) {
      return 'spotify_api_limit'
    }
    if (message.includes('auth') || message.includes('unauthorized') || message.includes('401')) {
      return 'auth_failure'
    }
    if (endpoint?.includes('vercel') || message.includes('deployment') || message.includes('build')) {
      return 'deployment_failure'
    }
    if (message.includes('memory') || message.includes('heap') || message.includes('leak')) {
      return 'memory_leak'
    }
    if (endpoint) {
      return 'api_error'
    }
    
    return 'unknown'
  }

  /**
   * Assess user impact based on error type and severity
   */
  static assessUserImpact(type: ErrorType, severity: ErrorSeverity): string {
    const impacts: Record<ErrorType, Record<ErrorSeverity, string>> = {
      database_connection: {
        critical: 'Users cannot access album data or save preferences',
        warning: 'Some database operations may be slower than normal',
        info: 'Minor database performance impact'
      },
      spotify_api_limit: {
        critical: 'Spotify links and data completely unavailable',
        warning: 'Limited Spotify functionality, some features may fail',
        info: 'Spotify API performance may be degraded'
      },
      auth_failure: {
        critical: 'Users cannot log in or access protected features',
        warning: 'Some users experiencing login issues',
        info: 'Minor authentication delays'
      },
      memory_leak: {
        critical: 'Application may crash or become unresponsive',
        warning: 'Performance degradation for all users',
        info: 'Slight performance impact'
      },
      deployment_failure: {
        critical: 'New deployments blocked, site updates unavailable',
        warning: 'Deployment process unstable',
        info: 'Minor deployment delays'
      },
      api_error: {
        critical: 'Core API functionality unavailable',
        warning: 'Some API endpoints experiencing issues',
        info: 'Minor API performance impact'
      },
      unknown: {
        critical: 'Unknown error with potential severe impact',
        warning: 'Unknown error with moderate impact',
        info: 'Unknown error with minimal impact'
      }
    }

    return impacts[type][severity]
  }

  /**
   * Suggest remediation actions based on error type and severity
   */
  static suggestAction(type: ErrorType, severity: ErrorSeverity): string {
    const actions: Record<ErrorType, Record<ErrorSeverity, string>> = {
      database_connection: {
        critical: 'Check Supabase dashboard and connection status immediately',
        warning: 'Monitor database performance and consider connection pool adjustments',
        info: 'Monitor database metrics for trends'
      },
      spotify_api_limit: {
        critical: 'Check Spotify API quotas and consider temporary fallback options',
        warning: 'Review API usage patterns and implement rate limiting',
        info: 'Monitor Spotify API usage trends'
      },
      auth_failure: {
        critical: 'Check authentication service status and user session validity',
        warning: 'Review authentication logs for patterns',
        info: 'Monitor authentication success rates'
      },
      memory_leak: {
        critical: 'Restart application services and investigate memory usage patterns',
        warning: 'Monitor memory usage and identify potential leak sources',
        info: 'Continue monitoring memory trends'
      },
      deployment_failure: {
        critical: 'Check Vercel dashboard and build logs for deployment issues',
        warning: 'Review recent deployment changes and build pipeline',
        info: 'Monitor deployment success rates'
      },
      api_error: {
        critical: 'Check API endpoint health and recent code changes',
        warning: 'Review API logs and error patterns',
        info: 'Monitor API performance metrics'
      },
      unknown: {
        critical: 'Investigate error details and check application logs immediately',
        warning: 'Review error context and monitor for related issues',
        info: 'Document error details for future reference'
      }
    }

    return actions[type][severity]
  }

  /**
   * Determine severity based on error type and context
   */
  static determineSeverity(type: ErrorType, context?: Record<string, unknown>): ErrorSeverity {
    // Critical errors that always need immediate attention
    const criticalTypes: ErrorType[] = ['database_connection', 'auth_failure', 'deployment_failure']
    if (criticalTypes.includes(type)) {
      return 'critical'
    }

    // Context-based severity determination
    if (context?.isTestError) {
      return 'warning' // Test errors are usually warnings unless specified
    }

    // API errors depend on endpoint criticality
    if (type === 'api_error') {
      const endpoint = context?.endpoint as string
      if (endpoint?.includes('auth') || endpoint?.includes('admin')) {
        return 'critical'
      }
      return 'warning'
    }

    // Default severity mapping
    const defaultSeverity: Record<ErrorType, ErrorSeverity> = {
      database_connection: 'critical',
      spotify_api_limit: 'warning',
      auth_failure: 'critical',
      memory_leak: 'warning',
      deployment_failure: 'critical',
      api_error: 'warning',
      unknown: 'warning'
    }

    return defaultSeverity[type]
  }

  /**
   * Generate a comprehensive error analysis
   */
  static analyzeError(
    error: Error, 
    endpoint?: string, 
    context?: Record<string, unknown>
  ): {
    type: ErrorType
    severity: ErrorSeverity
    userImpact: string
    suggestedAction: string
  } {
    const type = this.classifyError(error, endpoint)
    const severity = this.determineSeverity(type, context)
    const userImpact = this.assessUserImpact(type, severity)
    const suggestedAction = this.suggestAction(type, severity)

    return {
      type,
      severity,
      userImpact,
      suggestedAction
    }
  }
}