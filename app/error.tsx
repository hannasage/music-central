'use client'

import { useEffect } from 'react'
import Header from './components/Header'
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to console (in production, this would go to monitoring service)
    console.error('Application error:', error)
  }, [error])

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950">
      <Header />
      
      <div className="flex items-center justify-center min-h-[80vh] p-4">
        <div className="max-w-md w-full">
          {/* Error Icon */}
          <div className="text-center mb-8">
            <div className="relative mx-auto w-20 h-20">
              <div className="absolute inset-0 bg-red-500/20 rounded-full blur-xl animate-pulse"></div>
              <div className="relative bg-red-500/20 rounded-full p-4 border border-red-500/30">
                <AlertTriangle className="w-12 h-12 text-red-400 mx-auto" />
              </div>
            </div>
          </div>

          {/* Error Content */}
          <div className="bg-zinc-900/50 backdrop-blur-sm rounded-xl border border-zinc-800/50 p-8 text-center">
            <h1 className="text-2xl font-bold text-white mb-4">
              Something Hit a Wrong Note
            </h1>
            
            <p className="text-zinc-400 mb-6 leading-relaxed">
              We encountered an unexpected error while playing your music collection. 
              Don't worry, your albums are safe and sound.
            </p>

            {/* Error Details (development only) */}
            {process.env.NODE_ENV === 'development' && (
              <details className="mb-6 text-left">
                <summary className="text-sm text-zinc-500 cursor-pointer hover:text-zinc-400 transition-colors duration-200 flex items-center justify-center space-x-2">
                  <Bug className="w-4 h-4" />
                  <span>Technical Details</span>
                </summary>
                <div className="mt-3 p-4 bg-zinc-800/50 rounded-lg border border-zinc-700/50">
                  <p className="text-xs text-red-400 font-mono break-all mb-2">
                    {error.message}
                  </p>
                  {error.digest && (
                    <p className="text-xs text-zinc-500">
                      Error ID: {error.digest}
                    </p>
                  )}
                </div>
              </details>
            )}

            {/* Action Buttons */}
            <div className="space-y-3">
              <button
                onClick={reset}
                className="w-full py-3 bg-blue-500 hover:bg-blue-400 text-white rounded-lg font-medium transition-colors duration-200 flex items-center justify-center space-x-2"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Try Again</span>
              </button>

              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => window.location.reload()}
                  className="py-2 bg-zinc-700 hover:bg-zinc-600 text-white rounded-lg text-sm transition-colors duration-200"
                >
                  Reload Page
                </button>
                
                <button
                  onClick={() => window.location.href = '/'}
                  className="py-2 bg-zinc-700 hover:bg-zinc-600 text-white rounded-lg text-sm transition-colors duration-200 flex items-center justify-center space-x-1"
                >
                  <Home className="w-3 h-3" />
                  <span>Go Home</span>
                </button>
              </div>
            </div>

            {/* Help Text */}
            <p className="text-xs text-zinc-500 mt-6">
              If this problem persists, please try refreshing the page or contact support.
            </p>
          </div>

          {/* Musical Error Note */}
          <div className="text-center mt-6 text-zinc-600">
            <div className="text-3xl animate-bounce">🎼</div>
            <p className="text-xs mt-2">
              Even the best orchestras hit a wrong note sometimes...
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}