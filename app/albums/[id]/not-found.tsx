import Link from 'next/link'
import { ArrowLeft, Music, Search } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950 flex items-center justify-center">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {/* Icon */}
        <div className="mb-8">
          <div className="relative mx-auto w-32 h-32 rounded-full bg-zinc-800/50 flex items-center justify-center">
            <Music className="w-16 h-16 text-zinc-500" />
            <div className="absolute inset-0 rounded-full border-2 border-dashed border-zinc-600 animate-pulse" />
          </div>
        </div>

        {/* Content */}
        <div className="space-y-6">
          <div className="space-y-3">
            <h1 className="text-4xl lg:text-5xl font-bold text-white">
              Album Not Found
            </h1>
            <p className="text-xl text-zinc-400">
              We couldn't find the album you're looking for.
            </p>
          </div>

          <p className="text-zinc-500 max-w-md mx-auto">
            The album may have been removed, or the link might be incorrect. 
            Try searching for it or browse our collection.
          </p>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-8">
            <Link
              href="/"
              className="inline-flex items-center space-x-2 bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Home</span>
            </Link>
            
            <Link
              href="/albums"
              className="inline-flex items-center space-x-2 bg-zinc-800 hover:bg-zinc-700 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200 border border-zinc-700"
            >
              <Search className="w-4 h-4" />
              <span>Browse Albums</span>
            </Link>
          </div>
        </div>

        {/* Suggestions */}
        <div className="mt-12 pt-8 border-t border-zinc-800">
          <p className="text-sm text-zinc-500 mb-4">You might want to:</p>
          <div className="flex flex-wrap justify-center gap-4 text-sm">
            <Link
              href="/"
              className="text-zinc-400 hover:text-white transition-colors duration-200"
            >
              View Featured Albums
            </Link>
            <span className="text-zinc-600">•</span>
            <Link
              href="/genres"
              className="text-zinc-400 hover:text-white transition-colors duration-200"
            >
              Browse by Genre
            </Link>
            <span className="text-zinc-600">•</span>
            <Link
              href="/artists"
              className="text-zinc-400 hover:text-white transition-colors duration-200"
            >
              Explore Artists
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}