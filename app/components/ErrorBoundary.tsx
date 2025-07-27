'use client'

import { Component, ErrorInfo, ReactNode } from 'react'
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
  showDetails?: boolean
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null
  }

  public static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null
    }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
    
    this.setState({
      error,
      errorInfo
    })

    // Call optional error handler
    this.props.onError?.(error, errorInfo)

    // Log error for monitoring (in production, this would go to a service)
    if (process.env.NODE_ENV === 'production') {
      this.logError(error, errorInfo)
    }
  }

  private logError(error: Error, errorInfo: ErrorInfo) {
    // In a real app, this would send to an error tracking service like Sentry
    const errorData = {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href
    }

    console.error('Error logged:', errorData)
  }

  private handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    })
  }

  private handleReload = () => {
    window.location.reload()
  }

  private handleGoHome = () => {
    window.location.href = '/'
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-zinc-900/50 backdrop-blur-sm rounded-xl border border-zinc-800/50 p-8 text-center">
            {/* Error Icon */}
            <div className="mx-auto w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mb-6">
              <AlertTriangle className="w-8 h-8 text-red-400" />
            </div>

            {/* Error Title */}
            <h1 className="text-2xl font-bold text-white mb-4">
              Something went wrong
            </h1>

            {/* Error Description */}
            <p className="text-zinc-400 mb-6">
              We encountered an unexpected error. Don&apos;t worry, your music collection is safe.
            </p>

            {/* Error Details (only in development or if showDetails is true) */}
            {(process.env.NODE_ENV === 'development' || this.props.showDetails) && this.state.error && (
              <details className="mb-6 text-left">
                <summary className="text-sm text-zinc-500 cursor-pointer hover:text-zinc-400 transition-colors duration-200">
                  <Bug className="w-4 h-4 inline mr-2" />
                  Technical Details
                </summary>
                <div className="mt-3 p-4 bg-zinc-800/50 rounded-lg border border-zinc-700/50">
                  <p className="text-xs text-red-400 font-mono break-all mb-2">
                    {this.state.error.message}
                  </p>
                  {this.state.error.stack && (
                    <pre className="text-xs text-zinc-500 overflow-auto max-h-32">
                      {this.state.error.stack}
                    </pre>
                  )}
                </div>
              </details>
            )}

            {/* Action Buttons */}
            <div className="space-y-3">
              <button
                onClick={this.handleRetry}
                className="w-full py-3 bg-blue-500 hover:bg-blue-400 text-white rounded-lg font-medium transition-colors duration-200 flex items-center justify-center space-x-2"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Try Again</span>
              </button>

              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={this.handleReload}
                  className="py-2 bg-zinc-700 hover:bg-zinc-600 text-white rounded-lg text-sm transition-colors duration-200"
                >
                  Reload Page
                </button>
                <button
                  onClick={this.handleGoHome}
                  className="py-2 bg-zinc-700 hover:bg-zinc-600 text-white rounded-lg text-sm transition-colors duration-200 flex items-center justify-center space-x-1"
                >
                  <Home className="w-3 h-3" />
                  <span>Go Home</span>
                </button>
              </div>
            </div>

            {/* Help Text */}
            <p className="text-xs text-zinc-500 mt-6">
              If this problem persists, please refresh the page or contact support.
            </p>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

// Simpler error boundary for smaller components
export function SimpleErrorBoundary({ 
  children, 
  fallback 
}: { 
  children: ReactNode
  fallback?: ReactNode 
}) {
  return (
    <ErrorBoundary 
      fallback={fallback || (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
          <div className="flex items-center space-x-2 text-red-400">
            <AlertTriangle className="w-4 h-4" />
            <span className="text-sm">Something went wrong loading this component.</span>
          </div>
        </div>
      )}
    >
      {children}
    </ErrorBoundary>
  )
}

// Network error boundary for API failures
export function NetworkErrorBoundary({ 
  children,
  onRetry
}: { 
  children: ReactNode
  onRetry?: () => void
}) {
  return (
    <ErrorBoundary 
      fallback={
        <div className="text-center p-8">
          <div className="mx-auto w-12 h-12 bg-orange-500/20 rounded-full flex items-center justify-center mb-4">
            <AlertTriangle className="w-6 h-6 text-orange-400" />
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">Connection Error</h3>
          <p className="text-zinc-400 mb-4">
            Unable to load data. Please check your internet connection.
          </p>
          {onRetry && (
            <button
              onClick={onRetry}
              className="px-4 py-2 bg-orange-500 hover:bg-orange-400 text-white rounded-lg transition-colors duration-200 flex items-center space-x-2 mx-auto"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Retry</span>
            </button>
          )}
        </div>
      }
    >
      {children}
    </ErrorBoundary>
  )
}

// Async error boundary wrapper for handling promise rejections
export function AsyncErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary 
      onError={(error, errorInfo) => {
        // Handle async errors specifically
        console.error('Async error caught:', error, errorInfo)
      }}
      fallback={
        <div className="text-center p-8">
          <div className="mx-auto w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center mb-4">
            <AlertTriangle className="w-6 h-6 text-blue-400" />
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">Loading Error</h3>
          <p className="text-zinc-400 mb-4">
            There was a problem loading this content.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-500 hover:bg-blue-400 text-white rounded-lg transition-colors duration-200"
          >
            Reload Page
          </button>
        </div>
      }
    >
      {children}
    </ErrorBoundary>
  )
}