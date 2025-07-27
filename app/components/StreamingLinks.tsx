'use client'

import { useState } from 'react'
import { Album, StreamingLinks } from '@/lib/types'
import { Copy, Check, Share2 } from 'lucide-react'
import { StreamingButton, IconButton } from '@/app/components/ui'

interface StreamingLinksProps {
  album: Album
  showLabels?: boolean
  className?: string
}

export default function StreamingLinksComponent({ album, showLabels = true, className = '' }: StreamingLinksProps) {
  const [copiedLink, setCopiedLink] = useState<string | null>(null)

  const generateStreamingLinks = (album: Album): StreamingLinks => {
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

  const copyToClipboard = async (url: string, platform: string) => {
    try {
      await navigator.clipboard.writeText(url)
      setCopiedLink(platform)
      setTimeout(() => setCopiedLink(null), 2000)
    } catch (err) {
      console.error('Failed to copy link:', err)
    }
  }

  const shareAlbum = async () => {
    const shareData = {
      title: `${album.title} by ${album.artist}`,
      text: `Check out this album: ${album.title} by ${album.artist}`,
      url: window.location.href
    }

    try {
      if (navigator.share) {
        await navigator.share(shareData)
      } else {
        await copyToClipboard(window.location.href, 'page')
      }
    } catch (err) {
      console.error('Error sharing:', err)
    }
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center space-x-2 mb-4">
        <h3 className="text-lg font-semibold text-white">Listen Now</h3>
        <button
          onClick={shareAlbum}
          className="p-2 text-zinc-400 hover:text-white transition-colors duration-200"
          title="Share album"
        >
          <Share2 className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Spotify */}
        <div className="flex flex-col space-y-2">
          <StreamingButton
            service="spotify"
            url={streamingLinks.spotify!}
            showLabel={showLabels}
          />
          {showLabels && (
            <IconButton
              variant="ghost"
              size="sm"
              icon={copiedLink === 'spotify' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
              label={copiedLink === 'spotify' ? 'Copied!' : 'Copy link'}
              showLabel={true}
              onClick={() => copyToClipboard(streamingLinks.spotify!, 'spotify')}
              className="text-xs text-zinc-400 hover:text-zinc-300"
            />
          )}
        </div>

        {/* Apple Music */}
        <div className="flex flex-col space-y-2">
          <StreamingButton
            service="apple_music"
            url={streamingLinks.apple_music!}
            showLabel={showLabels}
          />
          {showLabels && (
            <IconButton
              variant="ghost"
              size="sm"
              icon={copiedLink === 'apple' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
              label={copiedLink === 'apple' ? 'Copied!' : 'Copy link'}
              showLabel={true}
              onClick={() => copyToClipboard(streamingLinks.apple_music!, 'apple')}
              className="text-xs text-zinc-400 hover:text-zinc-300"
            />
          )}
        </div>

        {/* YouTube Music */}
        <div className="flex flex-col space-y-2">
          <StreamingButton
            service="youtube_music"
            url={streamingLinks.youtube_music!}
            showLabel={showLabels}
          />
          {showLabels && (
            <IconButton
              variant="ghost"
              size="sm"
              icon={copiedLink === 'youtube' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
              label={copiedLink === 'youtube' ? 'Copied!' : 'Copy link'}
              showLabel={true}
              onClick={() => copyToClipboard(streamingLinks.youtube_music!, 'youtube')}
              className="text-xs text-zinc-400 hover:text-zinc-300"
            />
          )}
        </div>
      </div>
    </div>
  )
}