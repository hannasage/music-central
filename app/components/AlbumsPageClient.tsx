'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import AlbumCard from '@/app/components/AlbumCard'
import AlbumsControls from '@/app/components/AlbumsControls'
import { Album } from '@/lib/types'
import { 
  ChevronLeft, 
  ChevronRight,
  Music
} from 'lucide-react'

interface PaginationInfo {
  page: number
  limit: number
  total: number
  totalPages: number
}

interface AlbumsPageClientProps {
  initialAlbums: Album[]
  initialPagination: PaginationInfo
}

export default function AlbumsPageClient({
  initialAlbums,
  initialPagination
}: AlbumsPageClientProps) {
  const router = useRouter()
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  const handlePageChange = useCallback((page: number) => {
    const params = new URLSearchParams()
    if (page > 1) params.set('page', page.toString())

    const newURL = `/albums${params.toString() ? `?${params.toString()}` : ''}`
    router.push(newURL)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [router])

  return (
    <>
      {/* Controls */}
      <div className="flex justify-end mb-6">
        <AlbumsControls
          viewMode={viewMode}
          onViewModeChange={setViewMode}
        />
      </div>

      {/* Albums Grid/List */}
      {initialAlbums.length > 0 ? (
        <>
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-8">
              {initialAlbums.map((album) => (
                <AlbumCard key={album.id} album={album} size="small" />
              ))}
            </div>
          ) : (
            <div className="space-y-4 mb-8">
              {initialAlbums.map((album) => (
                <div
                  key={album.id}
                  className="flex items-center space-x-4 p-4 bg-zinc-900/50 backdrop-blur-sm rounded-lg border border-zinc-800/50 hover:border-zinc-700/50 transition-all duration-200"
                >
                  <AlbumCard album={album} size="small" className="flex-shrink-0 w-16 h-16" />
                  <div className="flex-grow min-w-0">
                    <h3 className="text-white font-semibold truncate">{album.title}</h3>
                    <p className="text-zinc-400 text-sm truncate">{album.artist}</p>
                    <p className="text-zinc-500 text-xs">{album.year}</p>
                  </div>
                  {album.genres && album.genres.length > 0 && (
                    <div className="hidden sm:flex flex-wrap gap-1">
                      {album.genres.slice(0, 2).map((genre) => (
                        <span
                          key={genre}
                          className="px-2 py-1 bg-zinc-800/50 text-zinc-400 text-xs rounded-full"
                        >
                          {genre}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {initialPagination.totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between space-y-4 sm:space-y-0">
              <div className="text-sm text-zinc-400">
                Showing {((initialPagination.page - 1) * initialPagination.limit) + 1} to{' '}
                {Math.min(initialPagination.page * initialPagination.limit, initialPagination.total)} of{' '}
                {initialPagination.total} albums
              </div>
              
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handlePageChange(initialPagination.page - 1)}
                  disabled={initialPagination.page === 1}
                  className="flex items-center space-x-1 px-3 py-2 bg-zinc-800/50 border border-zinc-700/50 rounded-lg text-zinc-300 hover:text-white hover:bg-zinc-700/50 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Previous</span>
                </button>

                <div className="flex items-center space-x-1">
                  {Array.from({ length: Math.min(5, initialPagination.totalPages) }, (_, i) => {
                    let pageNum: number
                    if (initialPagination.totalPages <= 5) {
                      pageNum = i + 1
                    } else if (initialPagination.page <= 3) {
                      pageNum = i + 1
                    } else if (initialPagination.page >= initialPagination.totalPages - 2) {
                      pageNum = initialPagination.totalPages - 4 + i
                    } else {
                      pageNum = initialPagination.page - 2 + i
                    }

                    return (
                      <button
                        key={pageNum}
                        onClick={() => handlePageChange(pageNum)}
                        className={`px-3 py-2 rounded-lg text-sm transition-colors duration-200 ${
                          pageNum === initialPagination.page
                            ? 'bg-blue-500 text-white'
                            : 'bg-zinc-800/50 border border-zinc-700/50 text-zinc-300 hover:text-white hover:bg-zinc-700/50'
                        }`}
                      >
                        {pageNum}
                      </button>
                    )
                  })}
                </div>

                <button
                  onClick={() => handlePageChange(initialPagination.page + 1)}
                  disabled={initialPagination.page === initialPagination.totalPages}
                  className="flex items-center space-x-1 px-3 py-2 bg-zinc-800/50 border border-zinc-700/50 rounded-lg text-zinc-300 hover:text-white hover:bg-zinc-700/50 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span>Next</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-12">
          <div className="w-16 h-16 mx-auto mb-4 bg-zinc-800/50 rounded-full flex items-center justify-center">
            <Music className="w-8 h-8 text-zinc-500" />
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">No albums found</h3>
          <p className="text-zinc-400">Your album collection appears to be empty.</p>
        </div>
      )}
    </>
  )
}