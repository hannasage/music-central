import React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Album } from '@/lib/types'
import { Music } from 'lucide-react'

interface AlbumCardProps {
  album: Album
  size?: 'small' | 'medium' | 'large'
  layout?: 'vertical' | 'horizontal'
  className?: string
}

const AlbumCard = React.memo(function AlbumCard({ album, size = 'medium', layout = 'vertical', className = '' }: AlbumCardProps) {
  const artworkSizes = {
    small: 'aspect-square w-full',
    medium: 'aspect-square w-full',
    large: 'aspect-square w-full'
  }

  const textSizeClasses = {
    small: 'text-sm',
    medium: 'text-base',
    large: 'text-lg'
  }

  const primaryGenre = album.genres && album.genres.length > 0 ? album.genres[0] : ''

  // Horizontal layout
  if (layout === 'horizontal') {
    return (
      <article className={`bg-zinc-900/50 backdrop-blur-sm rounded-lg border border-zinc-800/50 hover:border-zinc-700/50 hover:bg-zinc-800/50 transition-all duration-200 group ${className}`}>
        <Link 
          href={`/albums/${album.id}`}
          className="block"
          aria-labelledby={`album-title-${album.id}`}
          aria-describedby={`album-artist-${album.id}`}
        >
          <div className="flex items-center space-x-4 p-4">
          {/* Album Artwork */}
          <div className="w-16 h-16 flex-shrink-0 relative rounded overflow-hidden bg-zinc-700">
            {album.cover_art_url ? (
              <Image
                src={album.cover_art_url}
                alt={`${album.title} by ${album.artist}`}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-200"
                sizes="64px"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-zinc-700 to-zinc-900 flex items-center justify-center">
                <Music className="w-6 h-6 text-zinc-500" />
              </div>
            )}
          </div>

          {/* Album Info */}
          <div className="flex-1 min-w-0">
            <h4 id={`album-title-${album.id}`} className="font-semibold text-white text-base truncate group-hover:text-blue-400 transition-colors duration-200">
              {album.title}
            </h4>
            <p id={`album-artist-${album.id}`} className="text-zinc-400 text-sm truncate">
              by {album.artist}
            </p>
            <div className="flex items-center space-x-2 text-xs text-zinc-500 mt-1">
              <span>{album.year}</span>
              {primaryGenre && (
                <>
                  <span>•</span>
                  <span className="truncate">{primaryGenre.toLowerCase()}</span>
                </>
              )}
            </div>
          </div>
          </div>
        </Link>
      </article>
    )
  }

  // Vertical layout (default)
  return (
    <article className={`group transition-transform duration-300 hover:scale-105 ${className}`}>
      <Link 
        href={`/albums/${album.id}`}
        className="block"
        aria-labelledby={`album-title-${album.id}`}
        aria-describedby={`album-artist-${album.id}`}
      >
        <div className="w-full bg-zinc-900/50 backdrop-blur-sm rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 border border-zinc-800/50 hover:border-zinc-700/50">
        {/* Album Artwork - Edge to Edge Square */}
        <div className={`relative ${artworkSizes[size]} bg-zinc-800/50 overflow-hidden`}>
          {album.cover_art_url ? (
            <Image
              src={album.cover_art_url}
              alt={`${album.title} by ${album.artist}`}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-110"
              sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-zinc-700 to-zinc-900 flex items-center justify-center">
              <Music className="w-8 h-8 text-zinc-500" />
            </div>
          )}
          
          {/* Overlay on hover */}
          <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </div>

        {/* Album Info */}
        <div className="p-4 space-y-2">
          <h3 id={`album-title-${album.id}`} className={`font-semibold text-white line-clamp-2 group-hover:text-blue-400 transition-colors duration-200 ${textSizeClasses[size]}`}>
            {album.title}
          </h3>
          
          <p id={`album-artist-${album.id}`} className={`text-zinc-400 line-clamp-1 ${textSizeClasses[size] === 'text-lg' ? 'text-base' : 'text-sm'}`}>
            {album.artist}
          </p>
          
          <div className="flex items-center justify-between text-xs text-zinc-500">
            <span>{album.year}</span>
            {primaryGenre && (
              <span className="bg-zinc-800/50 px-2 py-1 rounded-full text-xs border border-zinc-700/50 truncate">
                {primaryGenre.toLowerCase()}
              </span>
            )}
          </div>
        </div>
        </div>
      </Link>
    </article>
  )
})

export default AlbumCard