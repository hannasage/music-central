'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Album } from '@/lib/types'
import { StreamingButton } from '@/app/components/ui'
import { Music, Play } from 'lucide-react'

interface AlbumBattleCardProps {
  album: Album
  onChoose: () => void
  isChosen?: boolean
  isDisabled?: boolean
  side: 'left' | 'right'
}

export default function AlbumBattleCard({ 
  album, 
  onChoose, 
  isChosen = false, 
  isDisabled = false,
  side 
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
              <Music className="w-16 h-16 text-zinc-500" />
            </div>
          )}
          
          {/* Overlay gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          
          {/* Choose button overlay */}
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <button
              onClick={onChoose}
              disabled={isDisabled}
              className={`px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-300 transform translate-y-2 group-hover:translate-y-0 ${
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
        <div className="p-6">
          <div className="space-y-3 mb-4">
            <h3 className="text-xl font-bold text-white line-clamp-2 leading-tight">
              {album.title}
            </h3>
            <p className="text-lg text-zinc-300 line-clamp-1">
              by {album.artist}
            </p>
            <div className="flex items-center space-x-3 text-sm text-zinc-400">
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

          {/* Streaming Links */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2 text-zinc-400">
              <Play className="w-4 h-4" />
              <span className="text-sm font-medium">Preview on:</span>
            </div>
            
            <div className="grid grid-cols-1 gap-2">
              <StreamingButton
                service="spotify"
                url={streamingLinks.spotify}
                showLabel={true}
                size="sm"
              />
              <StreamingButton
                service="apple_music"
                url={streamingLinks.apple_music}
                showLabel={true}
                size="sm"
              />
              <StreamingButton
                service="youtube_music"
                url={streamingLinks.youtube_music}
                showLabel={true}
                size="sm"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Side indicator */}
      <div className={`absolute top-4 ${side === 'left' ? 'left-4' : 'right-4'}`}>
        <div className="w-8 h-8 bg-zinc-800/80 backdrop-blur-sm rounded-full flex items-center justify-center border border-zinc-700/50">
          <span className="text-zinc-300 font-semibold text-sm">
            {side === 'left' ? 'A' : 'B'}
          </span>
        </div>
      </div>
    </div>
  )
}