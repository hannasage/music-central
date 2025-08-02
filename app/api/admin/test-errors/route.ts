import { NextResponse } from 'next/server'
import { logger } from '@/lib/logger'
import { withTestAuth } from '@/lib/api/admin-auth'

/**
 * Test Error Endpoint - Generates random errors for testing the notification system
 * POST: Trigger a random error to test admin notifications
 * For development and testing purposes only
 */

const TEST_ERRORS = [
  {
    type: 'database_connection',
    error: new Error('Supabase connection timeout after 30 seconds'),
    severity: 'critical' as const,
    context: { operation: 'fetch_albums', timeout: 30000, retries: 3 }
  },
  {
    type: 'spotify_api_limit',
    error: new Error('Spotify API rate limit exceeded: 429 Too Many Requests'),
    severity: 'warning' as const,
    context: { service: 'spotify', rateLimitReset: Date.now() + 3600000, endpoint: '/v1/search' }
  },
  {
    type: 'auth_failure',
    error: new Error('JWT token validation failed: signature verification failed'),
    severity: 'critical' as const,
    context: { userId: 'user_12345', endpoint: '/api/admin/notifications', action: 'token_validation' }
  },
  {
    type: 'memory_leak',
    error: new Error('High memory usage detected: 85% of available memory consumed'),
    severity: 'warning' as const,
    context: { memoryUsage: '850MB', threshold: '1GB', component: 'image_processing' }
  },
  {
    type: 'deployment_failure',
    error: new Error('Vercel build pipeline failed: TypeScript compilation errors'),
    severity: 'critical' as const,
    context: { buildId: 'build_67890', failedStep: 'typescript_check', deploymentId: 'dpl_abc123' }
  },
  {
    type: 'ai_agent',
    error: new Error('AI selected invalid album IDs'),
    severity: 'warning' as const,
    context: { operation: 'album_selection', availableAlbumsCount: 50, endpoint: '/api/ai-curator' }
  }
]


/**
 * POST /api/admin/test-errors
 * Trigger a random error to test the notification system
 * Query params:
 * - errorType: specific error type to trigger (optional)
 * - severity: override severity level (optional)
 * Headers:
 * - X-Custom-Error: custom error message to trigger (optional)
 * - X-Error-Type: error type when using custom error (optional, defaults to 'ai_agent')
 */
export const POST = withTestAuth(async (request) => {
  // Only allow in development environment
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json(
      { error: 'Test errors endpoint is only available in development environment' },
      { status: 403 }
    )
  }

  try {
    const url = new URL(request.url)
    const errorType = url.searchParams.get('errorType')
    const severityOverride = url.searchParams.get('severity') as 'critical' | 'warning' | 'info' | null

    // Check for custom error headers
    const customErrorMessage = request.headers.get('X-Custom-Error')
    const customErrorType = (request.headers.get('X-Error-Type') as 'database_connection' | 'spotify_api_limit' | 'auth_failure' | 'memory_leak' | 'deployment_failure' | 'api_error' | 'ai_agent' | 'unknown') || 'ai_agent'

    // Determine selected error
    let selectedError

    // Handle custom error from header
    if (customErrorMessage) {
      // Validate custom error type
      const validTypes = ['database_connection', 'spotify_api_limit', 'auth_failure', 'memory_leak', 'deployment_failure', 'api_error', 'ai_agent', 'unknown']
      if (!validTypes.includes(customErrorType)) {
        return NextResponse.json(
          { error: `Invalid X-Error-Type header. Valid types: ${validTypes.join(', ')}` },
          { status: 400 }
        )
      }

      selectedError = {
        type: customErrorType,
        error: new Error(customErrorMessage),
        severity: severityOverride || 'warning' as const,
        context: { 
          operation: 'custom_test_error', 
          endpoint: '/api/admin/test-errors',
          triggeredVia: 'custom_header'
        }
      }
    } else {
      // Select error to trigger from predefined list
      if (errorType) {
        const foundError = TEST_ERRORS.find(e => e.type === errorType)
        if (!foundError) {
          return NextResponse.json(
            { error: `Invalid errorType. Available types: ${TEST_ERRORS.map(e => e.type).join(', ')}` },
            { status: 400 }
          )
        }
        selectedError = foundError
      } else {
        // Random selection
        const randomIndex = Math.floor(Math.random() * TEST_ERRORS.length)
        selectedError = TEST_ERRORS[randomIndex]
      }
    }

    // Apply severity override if provided
    const severity = severityOverride || selectedError.severity

    // Create context with test metadata
    const testContext = {
      ...selectedError.context,
      isTestError: true,
      triggeredAt: new Date().toISOString(),
      endpoint: '/api/admin/test-errors',
      userAgent: request.headers.get('user-agent') || 'Unknown'
    }

    // Trigger the appropriate logging method based on error type
    switch (selectedError.type) {
      case 'database_connection':
        logger.dbError('test_operation', selectedError.error, testContext)
        break
      case 'spotify_api_limit':
        logger.serviceError('spotify', selectedError.error, testContext)
        break
      case 'auth_failure':
        logger.authError(selectedError.error, testContext)
        break
      case 'deployment_failure':
        logger.criticalApiError('/api/admin/test-errors', selectedError.error, testContext)
        break
      case 'ai_agent':
        logger.agentError('test_ai_operation', selectedError.error, testContext)
        break
      default:
        // Generic notification for memory_leak and other types
        logger.notifyAdmin(selectedError.error, severity, testContext)
        break
    }

    // Return test result
    return NextResponse.json({
      success: true,
      message: customErrorMessage ? 'Custom test error triggered successfully' : 'Test error triggered successfully',
      testDetails: {
        errorType: selectedError.type,
        severity,
        errorMessage: selectedError.error.message,
        timestamp: new Date().toISOString(),
        willTriggerNotification: process.env.ALLOW_DEV_NOTIFICATIONS === 'true',
        triggeredVia: customErrorMessage ? 'custom_header' : 'predefined_error',
        customError: !!customErrorMessage
      }
    })

  } catch (error) {
    logger.criticalApiError('/api/admin/test-errors', error as Error, { operation: 'trigger_test_error' })
    return NextResponse.json(
      { error: 'Failed to trigger test error' },
      { status: 500 }
    )
  }
})

/**
 * GET /api/admin/test-errors
 * List available test error types
 */
export const GET = withTestAuth(async () => {
  // Only allow in development environment
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json(
      { error: 'Test errors endpoint is only available in development environment' },
      { status: 403 }
    )
  }

  try {
    return NextResponse.json({
      availableErrorTypes: TEST_ERRORS.map(error => ({
        type: error.type,
        defaultSeverity: error.severity,
        description: error.error.message,
        sampleContext: Object.keys(error.context)
      })),
      usage: {
        trigger: 'POST /api/admin/test-errors',
        parameters: {
          errorType: 'Optional - specific error type to trigger',
          severity: 'Optional - override severity (critical, warning, info)'
        },
        headers: {
          'X-Custom-Error': 'Optional - custom error message to trigger',
          'X-Error-Type': 'Optional - error type for custom error (defaults to ai_agent)'
        },
        examples: [
          'POST /api/admin/test-errors (random error)',
          'POST /api/admin/test-errors?errorType=database_connection',
          'POST /api/admin/test-errors?errorType=spotify_api_limit&severity=critical',
          'POST /api/admin/test-errors -H "X-Custom-Error: AI selected invalid album IDs"',
          'POST /api/admin/test-errors -H "X-Custom-Error: Custom failure" -H "X-Error-Type: api_error"'
        ]
      }
    })

  } catch (error) {
    logger.criticalApiError('/api/admin/test-errors', error as Error, { operation: 'get_test_error_types' })
    return NextResponse.json(
      { error: 'Failed to get test error types' },
      { status: 500 }
    )
  }
})