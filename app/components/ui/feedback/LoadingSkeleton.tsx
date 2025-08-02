// Base skeleton component with shimmer animation
export function Skeleton({ 
  className = '', 
  ...props 
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`animate-pulse rounded-md bg-zinc-800/50 ${className}`}
      {...props}
    />
  )
}

// Album card skeleton
export function AlbumCardSkeleton({ size = 'medium' }: { size?: 'small' | 'medium' | 'large' }) {
  const sizeClasses = {
    small: 'w-32',
    medium: 'w-48',
    large: 'w-64'
  }

  const imageSizeClasses = {
    small: 'h-32',
    medium: 'h-48', 
    large: 'h-64'
  }

  return (
    <div className={`space-y-3 ${sizeClasses[size]}`}>
      <Skeleton className={`w-full rounded-lg ${imageSizeClasses[size]}`} />
      <div className="space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
      </div>
      <div className="space-y-1">
        <Skeleton className="h-3 w-1/4" />
        <div className="flex space-x-1">
          <Skeleton className="h-5 w-12 rounded-full" />
          <Skeleton className="h-5 w-16 rounded-full" />
        </div>
      </div>
    </div>
  )
}

// Grid of album cards skeleton
export function AlbumGridSkeleton({ count = 12 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <AlbumCardSkeleton key={i} />
      ))}
    </div>
  )
}

// Search results skeleton
export function SearchResultsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-5 w-48" />
        <div className="flex items-center space-x-4">
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-8 w-20" />
        </div>
      </div>
      <AlbumGridSkeleton count={8} />
      <div className="flex justify-center space-x-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-10" />
        ))}
      </div>
    </div>
  )
}

// Featured albums skeleton (horizontal scroll)
export function FeaturedAlbumsSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-4 w-20" />
      </div>
      <div className="flex space-x-4 overflow-hidden">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex-shrink-0 space-y-3 w-48">
            <Skeleton className="h-48 w-48 rounded-lg" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// Chat interface skeleton
export function ChatInterfaceSkeleton() {
  return (
    <div className="flex flex-col h-full bg-zinc-900/50 backdrop-blur-sm rounded-xl border border-zinc-800/50">
      <div className="flex items-center justify-between p-4 border-b border-zinc-800/50">
        <div className="flex items-center space-x-3">
          <Skeleton className="w-10 h-10 rounded-lg" />
          <div className="space-y-1">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-48" />
          </div>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <div className="space-y-3">
          <Skeleton className="h-4 w-24 mx-auto" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-12 rounded-lg" />
            ))}
          </div>
        </div>
      </div>
      <div className="p-4 border-t border-zinc-800/50">
        <div className="flex space-x-3">
          <Skeleton className="flex-1 h-12 rounded-xl" />
          <Skeleton className="h-12 w-12 rounded-xl" />
        </div>
        <Skeleton className="h-3 w-64 mx-auto mt-2" />
      </div>
    </div>
  )
}

// Page header skeleton
export function PageHeaderSkeleton() {
  return (
    <div className="text-center mb-8">
      <div className="flex items-center justify-center space-x-3 mb-4">
        <Skeleton className="w-12 h-12 rounded-xl" />
        <Skeleton className="h-8 w-64" />
      </div>
      <Skeleton className="h-4 w-96 mx-auto" />
    </div>
  )
}

// Generic content skeleton
export function ContentSkeleton({ lines = 3 }: { lines?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton 
          key={i} 
          className={`h-4 ${i === lines - 1 ? "w-3/4" : "w-full"}`}
        />
      ))}
    </div>
  )
}