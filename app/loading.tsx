import { PageHeaderSkeleton, ContentSkeleton } from './components/ui/feedback/LoadingSkeleton'

export default function Loading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950">
      {/*<NavigationSkeleton />*/}
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <PageHeaderSkeleton />
        
        <div className="space-y-8">
          <ContentSkeleton lines={5} />
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-zinc-900/50 rounded-xl p-6 space-y-3">
                <div className="animate-pulse rounded-md bg-zinc-800/50 h-6 w-3/4"></div>
                <div className="animate-pulse rounded-md bg-zinc-800/50 h-4 w-1/2"></div>
                <div className="animate-pulse rounded-md bg-zinc-800/50 h-4 w-2/3"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}