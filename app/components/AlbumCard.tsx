import Image from 'next/image'
import Link from 'next/link'
import { Album } from '@/lib/types'
import { Music } from 'lucide-react'

interface AlbumCardProps {
  album: Album
  size?: 'small' | 'medium' | 'large'
  className?: string
}

export default function AlbumCard({ album, size = 'medium', className = '' }: AlbumCardProps) {
  const artworkSizes = {
    small: 'w-40 h-40',
    medium: 'w-48 h-48',
    large: 'w-56 h-56'
  }

  const cardWidths = {
    small: 'w-40',
    medium: 'w-48',
    large: 'w-56'
  }

  const textSizeClasses = {
    small: 'text-sm',
    medium: 'text-base',
    large: 'text-lg'
  }

  const primaryGenre = album.genres && album.genres.length > 0 ? album.genres[0] : ''

  return (
    <Link 
      href={`/albums/${album.id}`}
      className={`group block transition-transform duration-300 hover:scale-105 ${className}`}
    >
      <div className={`${cardWidths[size]} bg-zinc-900/50 backdrop-blur-sm rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 border border-zinc-800/50 hover:border-zinc-700/50`}>
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
          <h3 className={`font-semibold text-white line-clamp-2 group-hover:text-blue-400 transition-colors duration-200 ${textSizeClasses[size]}`}>
            {album.title}
          </h3>
          
          <p className={`text-zinc-400 line-clamp-1 ${textSizeClasses[size] === 'text-lg' ? 'text-base' : 'text-sm'}`}>
            {album.artist}
          </p>
          
          <div className="flex items-center justify-between text-xs text-zinc-500">
            <span>{album.year}</span>
            {primaryGenre && (
              <span className="bg-zinc-800/50 px-2 py-1 rounded-full text-xs border border-zinc-700/50 truncate">
                {primaryGenre}
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  )
}