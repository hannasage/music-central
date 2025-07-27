import { Suspense } from 'react'
import Header from '@/app/components/Header'
import AlbumsPageClient from '@/app/components/AlbumsPageClient'
import { AlbumGridSkeleton } from '@/app/components/LoadingSkeleton'
import { getAllAlbums } from '@/lib/albums'

interface SearchParams {
  page?: string
}

interface AlbumsPageProps {
  searchParams: Promise<SearchParams>
}

export default async function AlbumsPage({ searchParams }: AlbumsPageProps) {
  const resolvedSearchParams = await searchParams
  const page = parseInt(resolvedSearchParams.page || '1')

  const result = await getAllAlbums(page, 24)
  
  const pagination = {
    page,
    limit: 24,
    total: result.total,
    totalPages: result.totalPages
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">All Albums</h1>
            <p className="text-zinc-400">
              {result.total} album{result.total !== 1 ? 's' : ''} in your collection
            </p>
          </div>
        </div>

        {/* Albums Content */}
        <Suspense fallback={<AlbumGridSkeleton count={24} />}>
          <AlbumsPageClient
            initialAlbums={result.albums}
            initialPagination={pagination}
          />
        </Suspense>
      </main>
    </div>
  )
}