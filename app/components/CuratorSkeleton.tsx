export default function CuratorSkeleton() {
  return (
    <div className="relative">
      {/* Desktop View - Side by side skeleton cards */}
      <div className="hidden md:block">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {/* Left skeleton card */}
          <div className="bg-zinc-900/50 backdrop-blur-sm rounded-xl p-6 border border-zinc-800/50 animate-pulse">
            <div className="aspect-square rounded-lg bg-zinc-800/50 mb-4"></div>
            <div className="space-y-3">
              <div className="h-5 bg-zinc-800/50 rounded w-3/4"></div>
              <div className="h-4 bg-zinc-800/50 rounded w-1/2"></div>
              <div className="space-y-2">
                <div className="h-3 bg-zinc-800/50 rounded w-full"></div>
                <div className="h-3 bg-zinc-800/50 rounded w-2/3"></div>
              </div>
            </div>
          </div>
          
          {/* Right skeleton card */}
          <div className="bg-zinc-900/50 backdrop-blur-sm rounded-xl p-6 border border-zinc-800/50 animate-pulse">
            <div className="aspect-square rounded-lg bg-zinc-800/50 mb-4"></div>
            <div className="space-y-3">
              <div className="h-5 bg-zinc-800/50 rounded w-3/4"></div>
              <div className="h-4 bg-zinc-800/50 rounded w-1/2"></div>
              <div className="space-y-2">
                <div className="h-3 bg-zinc-800/50 rounded w-full"></div>
                <div className="h-3 bg-zinc-800/50 rounded w-2/3"></div>
              </div>
            </div>
          </div>
        </div>

        {/* VS indicator skeleton */}
        <div className="hidden lg:block absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10">
          <div className="w-12 h-12 bg-zinc-800/50 rounded-full border-2 border-zinc-700/50 flex items-center justify-center animate-pulse">
            <div className="w-6 h-4 bg-zinc-700/50 rounded"></div>
          </div>
        </div>
      </div>

      {/* Mobile View - Horizontal skeleton cards */}
      <div className="md:hidden space-y-4">
        <div className="space-y-3">
          {/* Mobile skeleton card 1 */}
          <div className="bg-zinc-900/50 backdrop-blur-sm rounded-xl p-4 border border-zinc-800/50 animate-pulse">
            <div className="flex space-x-4">
              <div className="w-20 h-20 rounded-lg bg-zinc-800/50 flex-shrink-0"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-zinc-800/50 rounded w-3/4"></div>
                <div className="h-3 bg-zinc-800/50 rounded w-1/2"></div>
                <div className="h-3 bg-zinc-800/50 rounded w-full"></div>
              </div>
              <div className="w-5 h-5 bg-zinc-800/50 rounded-full flex-shrink-0"></div>
            </div>
          </div>
          
          {/* Mobile skeleton card 2 */}
          <div className="bg-zinc-900/50 backdrop-blur-sm rounded-xl p-4 border border-zinc-800/50 animate-pulse">
            <div className="flex space-x-4">
              <div className="w-20 h-20 rounded-lg bg-zinc-800/50 flex-shrink-0"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-zinc-800/50 rounded w-3/4"></div>
                <div className="h-3 bg-zinc-800/50 rounded w-1/2"></div>
                <div className="h-3 bg-zinc-800/50 rounded w-full"></div>
              </div>
              <div className="w-5 h-5 bg-zinc-800/50 rounded-full flex-shrink-0"></div>
            </div>
          </div>
        </div>

        {/* Submit button skeleton */}
        <div className="w-full h-12 bg-zinc-800/50 rounded-lg animate-pulse"></div>
      </div>
    </div>
  )
}