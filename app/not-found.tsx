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
              This Track Doesn't Exist
            </h1>
            <p className="text-zinc-400 leading-relaxed">
              Looks like this page hit a wrong note and wandered off the playlist. 
              Time to get back to the main stage where all the good music lives!
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
          </div>

          {/* Musical Note */}
          <div className="mt-8 text-zinc-600">
            <div className="text-4xl animate-bounce">🎵</div>
            <p className="text-xs mt-2">
              Even the best playlists have a few missing beats...
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}