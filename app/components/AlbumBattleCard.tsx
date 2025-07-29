'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Album } from '@/lib/types'
import { StreamingIcon } from '@/app/components/ui/icons'
import { Music, Play } from 'lucide-react'

interface AlbumBattleCardProps {
  album: Album
  onChoose: () => void
  isChosen?: boolean
  isDisabled?: boolean
  side: 'left' | 'right'
  mobile?: boolean
}

export default function AlbumBattleCard({ 
  album, 
  onChoose, 
  isChosen = false, 
  isDisabled = false,
  side,
  mobile = false
}: AlbumBattleCardProps) {
  const [imageLoaded, setImageLoaded] = useState(false)

  const generateStreamingLinks = (album: Album) => {
    const searchQuery = encodeURIComponent(`${album.artist} ${album.title}`)
    
    return {
      spotify: album.streaming_links?.spotify || 
               (album.spotify_id ? `https://open.spotify.com/album/${album.spotify_id}` : 
                `https://open.spotify.com/search/${searchQuery}`),
      apple_music: album.streaming_links?.apple_music || 
                   `https://music.apple.com/search?term=${searchQuery}`,
      youtube_music: album.streaming_links?.youtube_music || 
                     `https://music.youtube.com/search?q=${searchQuery}`
    }
  }

  const streamingLinks = generateStreamingLinks(album)
  const primaryGenre = album.genres && album.genres.length > 0 ? album.genres[0] : ''

  // Mobile layout - horizontal card with checkbox
  if (mobile) {
    return (
      <div className={`relative transition-all duration-300 ${
        isChosen ? 'scale-[1.02]' : ''
      } ${isDisabled ? 'opacity-50 pointer-events-none' : ''}`}>
        
        <div className={`flex items-center space-x-3 p-3 bg-zinc-900/50 backdrop-blur-sm rounded-lg border-2 transition-all duration-300 ${
          isChosen ? 'border-blue-500 bg-blue-500/10' : 'border-zinc-800/50 hover:border-zinc-700/50'
        }`}>
          
          {/* Album Artwork - Clickable */}
          <button 
            onClick={onChoose}
            disabled={isDisabled}
            className="w-24 h-24 flex-shrink-0 relative rounded overflow-hidden bg-zinc-700 hover:opacity-80 transition-opacity duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {album.cover_art_url ? (
              <Image
                src={album.cover_art_url}
                alt={`${album.title} by ${album.artist}`}
                fill
                className={`object-cover transition-all duration-500 ${
                  imageLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-105'
                }`}
                onLoadingComplete={() => setImageLoaded(true)}
                priority
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-zinc-700 to-zinc-900 flex items-center justify-center">
                <Music className="w-6 h-6 text-zinc-500" />
              </div>
            )}
          </button>

          {/* Album Info */}
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-white text-sm truncate">
              {album.title}
            </h4>
            <p className="text-zinc-400 text-xs truncate">
              by {album.artist}
            </p>
            <div className="flex items-center space-x-2 text-xs text-zinc-500 mt-1">
              <span>{album.year}</span>
              {primaryGenre && (
                <>
                  <span>•</span>
                  <span className="truncate">{primaryGenre}</span>
                </>
              )}
            </div>
            
            {/* Streaming Links - Moved below song info */}
            <div className="flex items-center space-x-2 mt-2">
              <a
                href={streamingLinks.spotify}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 bg-green-500 hover:bg-green-400 rounded-md transition-colors duration-200"
                title="Listen on Spotify"
                onClick={(e) => e.stopPropagation()}
              >
                <StreamingIcon service="spotify" size="md" />
              </a>
              <a
                href={streamingLinks.apple_music}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 bg-gradient-to-r from-[#fa5a72] to-[#fa253e] hover:from-[#fb6b7f] hover:to-[#fb3651] rounded-md transition-colors duration-200"
                title="Listen on Apple Music"
                onClick={(e) => e.stopPropagation()}
              >
                <StreamingIcon service="apple_music" size="md" />
              </a>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Desktop layout - original card design
  return (
    <div className={`relative group transition-all duration-500 ${
      isChosen ? 'scale-105 ring-4 ring-blue-500' : ''
    } ${isDisabled ? 'opacity-50 pointer-events-none' : 'hover:scale-[1.02]'}`}>
      
      {/* Main Card */}
      <div className={`bg-zinc-900/50 backdrop-blur-sm rounded-2xl border-2 transition-all duration-300 ${
        isChosen ? 'border-blue-500 bg-blue-500/10' : 'border-zinc-800/50 hover:border-zinc-700/50'
      } overflow-hidden`}>
        
        {/* Album Cover */}
        <div className="relative aspect-square">
          {album.cover_art_url ? (
            <Image
              src={album.cover_art_url}
              alt={`${album.title} by ${album.artist}`}
              fill
              className={`object-cover transition-all duration-500 ${
                imageLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-105'
              }`}
              onLoadingComplete={() => setImageLoaded(true)}
              priority
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-zinc-700 to-zinc-900 flex items-center justify-center">
              <Music className="w-12 h-12 text-zinc-500" />
            </div>
          )}
          
          {/* Overlay gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          
          {/* Choose button overlay */}
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <button
              onClick={onChoose}
              disabled={isDisabled}
              className={`px-6 py-3 rounded-lg font-semibold transition-all duration-300 transform translate-y-2 group-hover:translate-y-0 ${
                isChosen 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-white/95 text-black hover:bg-white hover:scale-105'
              } shadow-2xl backdrop-blur-sm disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {isChosen ? '✓ Chosen' : 'Choose This'}
            </button>
          </div>
        </div>

        {/* Album Info */}
        <div className="p-4">
          <div className="flex items-start justify-between">
            {/* Left side: Album details */}
            <div className="flex-1 space-y-1">
              <h3 className="text-lg font-bold text-white line-clamp-2 leading-tight pr-2">
                {album.title}
              </h3>
              <p className="text-base text-zinc-300 line-clamp-1">
                by {album.artist}
              </p>
              <div className="flex items-center space-x-2 text-xs text-zinc-400">
                <span>{album.year}</span>
                {primaryGenre && (
                  <>
                    <span>•</span>
                    <span className="bg-zinc-800/50 px-2 py-1 rounded-full border border-zinc-700/50">
                      {primaryGenre}
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Right side: Streaming Links */}
            <div className="flex flex-col items-end space-y-2 ml-3">
              <div className="flex items-center space-x-1 text-zinc-400">
                <Play className="w-3 h-3" />
                <span className="text-xs font-medium">Listen</span>
              </div>
              
              <div className="flex items-center space-x-1">
                <a
                  href={streamingLinks.spotify}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 bg-green-500 hover:bg-green-400 rounded-md transition-colors duration-200"
                  title="Listen on Spotify"
                >
                  <StreamingIcon service="spotify" size="sm" />
                </a>
                <a
                  href={streamingLinks.apple_music}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 bg-gradient-to-r from-[#fa5a72] to-[#fa253e] hover:from-[#fb6b7f] hover:to-[#fb3651] rounded-md transition-colors duration-200"
                  title="Listen on Apple Music"
                >
                  <StreamingIcon service="apple_music" size="sm" />
                </a>
                <a
                  href={streamingLinks.youtube_music}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 bg-red-500 hover:bg-red-400 rounded-md transition-colors duration-200"
                  title="Listen on YouTube Music"
                >
                  <StreamingIcon service="youtube_music" size="sm" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Side indicator */}
      <div className={`absolute top-3 ${side === 'left' ? 'left-3' : 'right-3'}`}>
        <div className="w-6 h-6 bg-zinc-800/80 backdrop-blur-sm rounded-full flex items-center justify-center border border-zinc-700/50">
          <span className="text-zinc-300 font-semibold text-xs">
            {side === 'left' ? 'A' : 'B'}
          </span>
        </div>
      </div>
    </div>
  )
}