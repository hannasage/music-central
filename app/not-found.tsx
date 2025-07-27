import Link from 'next/link'
import Header from './components/Header'
import { Home, Search, Shuffle, ArrowLeft } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950">
      <Header />
      
      <div className="flex items-center justify-center min-h-[80vh] p-4">
        <div className="max-w-md w-full text-center">
          {/* 404 Animation */}
          <div className="mb-8">
            <div className="text-8xl font-bold text-zinc-700 mb-4 select-none">
              404
            </div>
            <div className="relative">
              <div className="absolute inset-0 bg-blue-500/20 rounded-full blur-xl animate-pulse"></div>
              <div className="relative bg-zinc-900/50 backdrop-blur-sm rounded-full p-8 border border-zinc-800/50">
                <Shuffle className="w-16 h-16 text-blue-400 mx-auto animate-spin" />
              </div>
            </div>
          </div>

          {/* Error Message */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-white mb-4">
              Album Not Found
            </h1>
            <p className="text-zinc-400 leading-relaxed">
              The album you're looking for has skipped to another dimension. 
              Don't worry, there's plenty of great music waiting for you in your collection.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="space-y-4">
            <Link
              href="/"
              className="w-full inline-flex items-center justify-center space-x-2 py-3 bg-blue-500 hover:bg-blue-400 text-white rounded-lg font-medium transition-colors duration-200"
            >
              <Home className="w-4 h-4" />
              <span>Go Home</span>
            </Link>

            <div className="grid grid-cols-2 gap-3">
              <Link
                href="/search"
                className="inline-flex items-center justify-center space-x-2 py-2 bg-zinc-700 hover:bg-zinc-600 text-white rounded-lg text-sm transition-colors duration-200"
              >
                <Search className="w-3 h-3" />
                <span>Search Albums</span>
              </Link>
              
              <button
                onClick={() => window.history.back()}
                className="inline-flex items-center justify-center space-x-2 py-2 bg-zinc-700 hover:bg-zinc-600 text-white rounded-lg text-sm transition-colors duration-200"
              >
                <ArrowLeft className="w-3 h-3" />
                <span>Go Back</span>
              </button>
            </div>
          </div>

          {/* Musical Note */}
          <div className="mt-8 text-zinc-600">
            <div className="text-4xl animate-bounce">🎵</div>
            <p className="text-xs mt-2">
              Every collection has a missing track or two...
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}