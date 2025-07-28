'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import AlbumCard from '@/app/components/AlbumCard'
import AlbumsControls from '@/app/components/AlbumsControls'
import { Album } from '@/lib/types'
import { 
  Music,
  Loader
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
  const [albums, setAlbums] = useState<Album[]>(initialAlbums)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [isLoading, setIsLoading] = useState(false)
  const [hasMore, setHasMore] = useState(albums.length < initialPagination.total)
  const [offset, setOffset] = useState(24) // Start with next batch
  const loaderRef = useRef<HTMLDivElement>(null)

  const loadMoreAlbums = useCallback(async () => {
    if (isLoading || !hasMore) return

    setIsLoading(true)
    try {
      const response = await fetch(`/api/albums?limit=24&offset=${offset}`)
      if (!response.ok) throw new Error('Failed to fetch albums')
      
      const data = await response.json()
      const newAlbums = data.albums || []
      
      setAlbums(prev => {
        // Create a Set of existing album IDs for fast lookup
        const existingIds = new Set(prev.map(album => album.id))
        
        // Filter out any albums that are already in the list
        const uniqueNewAlbums = newAlbums.filter((album: Album) => !existingIds.has(album.id))
        
        const updatedAlbums = [...prev, ...uniqueNewAlbums]
        setHasMore(updatedAlbums.length < initialPagination.total && uniqueNewAlbums.length > 0)
        return updatedAlbums
      })
      setOffset(prev => prev + 24)
    } catch (error) {
      console.error('Error loading more albums:', error)
    } finally {
      setIsLoading(false)
    }
  }, [isLoading, hasMore, offset, initialPagination.total])

  // Intersection Observer for infinite scroll
  useEffect(() => {
    const currentLoader = loaderRef.current
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoading) {
          loadMoreAlbums()
        }
      },
      { threshold: 0.1 }
    )

    if (currentLoader) {
      observer.observe(currentLoader)
    }

    return () => {
      if (currentLoader) {
        observer.unobserve(currentLoader)
      }
    }
  }, [hasMore, isLoading, loadMoreAlbums])

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
      {albums.length > 0 ? (
        <>
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-8">
              {albums.map((album) => (
                <AlbumCard key={album.id} album={album} size="small" />
              ))}
            </div>
          ) : (
            <div className="space-y-4 mb-8">
              {albums.map((album) => (
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

          {/* Loading indicator and intersection observer target */}
          <div ref={loaderRef} className="flex justify-center py-8">
            {isLoading && (
              <div className="flex items-center space-x-2 text-zinc-400">
                <Loader className="w-5 h-5 animate-spin" />
                <span>Loading more albums...</span>
              </div>
            )}
          </div>

          {/* Status indicator */}
          <div className="text-center text-sm text-zinc-400 mb-8">
            Showing {albums.length} of {initialPagination.total} albums
            {!hasMore && albums.length > 0 && (
              <div className="mt-2 text-zinc-500">
                You&apos;ve reached the end of your collection
              </div>
            )}
          </div>
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