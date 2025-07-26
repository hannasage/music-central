interface LoadingSkeletonProps {
  className?: string
}

export function AlbumCardSkeleton({ className = '' }: LoadingSkeletonProps) {
  return (
    <div className={`bg-zinc-900/50 backdrop-blur-sm rounded-lg overflow-hidden shadow-lg border border-zinc-800/50 animate-pulse ${className}`}>
      {/* Album Artwork Skeleton */}
      <div className="w-48 h-48 bg-zinc-800/50" />
      
      {/* Album Info Skeleton */}
      <div className="p-4 space-y-2">
        {/* Title */}
        <div className="h-5 bg-zinc-700/50 rounded w-3/4" />
        
        {/* Artist */}
        <div className="h-4 bg-zinc-700/50 rounded w-1/2" />
        
        {/* Year and Genre */}
        <div className="flex items-center justify-between">
          <div className="h-3 bg-zinc-700/50 rounded w-12" />
          <div className="h-6 bg-zinc-700/50 rounded-full w-16" />
        </div>
      </div>
    </div>
  )
}

export function FeaturedBannerSkeleton({ className = '' }: LoadingSkeletonProps) {
  return (
    <div className={`relative h-96 bg-zinc-900 rounded-2xl overflow-hidden animate-pulse ${className}`}>
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-r from-zinc-800 to-zinc-900" />
      
      {/* Content */}
      <div className="relative h-full flex items-center">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 w-full">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            {/* Album Artwork Skeleton */}
            <div className="flex justify-center lg:justify-start">
              <div className="w-64 h-64 bg-zinc-800/50 rounded-xl" />
            </div>

            {/* Album Info Skeleton */}
            <div className="text-center lg:text-left space-y-6">
              <div className="space-y-4">
                <div className="h-4 bg-zinc-700/50 rounded w-32 mx-auto lg:mx-0" />
                <div className="h-12 bg-zinc-700/50 rounded w-3/4 mx-auto lg:mx-0" />
                <div className="h-6 bg-zinc-700/50 rounded w-1/2 mx-auto lg:mx-0" />
              </div>

              <div className="flex items-center justify-center lg:justify-start space-x-4">
                <div className="h-4 bg-zinc-700/50 rounded w-12" />
                <div className="h-6 bg-zinc-700/50 rounded-full w-20" />
              </div>

              <div className="flex items-center justify-center lg:justify-start space-x-4">
                <div className="h-12 bg-zinc-700/50 rounded-lg w-32" />
                <div className="h-12 bg-zinc-700/50 rounded-lg w-40" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Dots Skeleton */}
      <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2">
        <div className="flex space-x-2">
          {[...Array(4)].map((_, index) => (
            <div key={index} className="w-3 h-3 bg-zinc-700/50 rounded-full" />
          ))}
        </div>
      </div>
    </div>
  )
}

export function AlbumGridSkeleton({ count = 12, className = '' }: LoadingSkeletonProps & { count?: number }) {
  return (
    <div className={`grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 ${className}`}>
      {[...Array(count)].map((_, index) => (
        <AlbumCardSkeleton key={index} />
      ))}
    </div>
  )
}