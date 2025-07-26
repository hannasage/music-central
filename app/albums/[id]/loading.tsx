export default function Loading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-16">
        {/* Back Button Skeleton */}
        <div className="h-6 w-32 bg-zinc-800 rounded mb-8 animate-pulse" />
        
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 lg:gap-12 items-start">
          {/* Album Artwork Skeleton */}
          <div className="lg:col-span-2 flex justify-center lg:justify-start">
            <div className="w-80 h-80 lg:w-96 lg:h-96 bg-zinc-800 rounded-2xl animate-pulse" />
          </div>

          {/* Album Info Skeleton */}
          <div className="lg:col-span-3 space-y-6">
            <div className="space-y-3">
              <div className="h-12 lg:h-16 bg-zinc-800 rounded animate-pulse" />
              <div className="h-6 lg:h-8 bg-zinc-800 rounded animate-pulse w-3/4" />
            </div>
            
            <div className="flex gap-4">
              <div className="h-6 w-20 bg-zinc-800 rounded animate-pulse" />
              <div className="h-6 w-32 bg-zinc-800 rounded animate-pulse" />
            </div>
            
            <div className="space-y-2">
              <div className="h-4 w-24 bg-zinc-800 rounded animate-pulse" />
              <div className="flex gap-2">
                <div className="h-6 w-16 bg-zinc-800 rounded-full animate-pulse" />
                <div className="h-6 w-20 bg-zinc-800 rounded-full animate-pulse" />
                <div className="h-6 w-18 bg-zinc-800 rounded-full animate-pulse" />
              </div>
            </div>
            
            <div className="pt-4">
              <div className="h-4 w-24 bg-zinc-800 rounded animate-pulse mb-4" />
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="h-12 bg-zinc-800 rounded animate-pulse" />
                <div className="h-12 bg-zinc-800 rounded animate-pulse" />
                <div className="h-12 bg-zinc-800 rounded animate-pulse" />
              </div>
            </div>
          </div>
        </div>

        {/* Content Skeletons */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12 mt-16">
          <div className="lg:col-span-2 space-y-8">
            {/* Thoughts Skeleton */}
            <div className="bg-zinc-900/50 rounded-2xl p-6 lg:p-8 border border-zinc-800/50">
              <div className="h-6 w-40 bg-zinc-800 rounded animate-pulse mb-4" />
              <div className="space-y-3">
                <div className="h-4 bg-zinc-800 rounded animate-pulse" />
                <div className="h-4 bg-zinc-800 rounded animate-pulse w-5/6" />
                <div className="h-4 bg-zinc-800 rounded animate-pulse w-4/6" />
              </div>
            </div>
            
            {/* Track List Skeleton */}
            <div className="bg-zinc-900/50 rounded-2xl p-6 lg:p-8 border border-zinc-800/50">
              <div className="h-6 w-32 bg-zinc-800 rounded animate-pulse mb-4" />
              <div className="space-y-3">
                {[...Array(10)].map((_, i) => (
                  <div key={i} className="flex items-center space-x-4 p-3">
                    <div className="w-8 h-8 bg-zinc-800 rounded-full animate-pulse" />
                    <div className="flex-1 h-4 bg-zinc-800 rounded animate-pulse" />
                    <div className="w-12 h-4 bg-zinc-800 rounded animate-pulse" />
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          {/* Audio Features Skeleton */}
          <div className="lg:col-span-1">
            <div className="bg-zinc-900/50 rounded-2xl p-6 lg:p-8 border border-zinc-800/50">
              <div className="h-6 w-32 bg-zinc-800 rounded animate-pulse mb-6" />
              <div className="space-y-4">
                {[...Array(7)].map((_, i) => (
                  <div key={i} className="space-y-2">
                    <div className="flex justify-between">
                      <div className="h-4 w-20 bg-zinc-800 rounded animate-pulse" />
                      <div className="h-4 w-12 bg-zinc-800 rounded animate-pulse" />
                    </div>
                    <div className="h-2 bg-zinc-800 rounded-full animate-pulse" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}