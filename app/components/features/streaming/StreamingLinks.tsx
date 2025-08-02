'use client'

import { useState } from 'react'
import { Album, StreamingLinks } from '@/lib/types'
import { Copy, Check, Share2, Settings } from 'lucide-react'
import { StreamingButton, IconButton } from '../../ui'
import { useStreamingPreference } from '@/app/contexts/StreamingPreferenceContext'
import { StreamingService } from '@/app/components/ui/icons/StreamingIcons'

interface StreamingLinksProps {
  album: Album
  showLabels?: boolean
  className?: string
}

export default function StreamingLinksComponent({ album, showLabels = true, className = '' }: StreamingLinksProps) {
  const [copiedLink, setCopiedLink] = useState<string | null>(null)
  const { preferredService, showModal } = useStreamingPreference()

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

  // Generate YouTube search URL as default fallback
  const generateYouTubeSearchUrl = (album: Album): string => {
    const searchQuery = encodeURIComponent(`${album.artist} ${album.title}`)
    return `https://www.youtube.com/results?search_query=${searchQuery}`
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

  // Helper function to render a single service
  const renderSingleService = (service: StreamingService, url: string, copyKey: string) => (
    <div className="flex flex-col space-y-4">
      <StreamingButton
        service={service}
        url={url}
        showLabel={true}
        size="lg"
        className="text-lg py-4 shadow-xl justify-center"
      />
      {showLabels && (
        <div className="flex items-center justify-center space-x-4">
          <IconButton
            variant="ghost"
            size="sm"
            icon={copiedLink === copyKey ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
            label={copiedLink === copyKey ? 'Copied!' : 'Copy link'}
            showLabel={true}
            onClick={() => copyToClipboard(url, copyKey)}
            className="text-xs text-zinc-400 hover:text-zinc-300"
          />
          <button
            onClick={showModal}
            className="flex items-center space-x-1 text-xs text-zinc-500 hover:text-zinc-400 transition-colors duration-200"
            title="Change streaming preference"
          >
            <Settings className="w-3 h-3" />
            <span>Change</span>
          </button>
        </div>
      )}
    </div>
  )

  // Helper function to render YouTube search as default
  const renderYouTubeDefault = () => (
    <div className="flex flex-col space-y-4">
      <StreamingButton
        service="youtube_music"
        url={generateYouTubeSearchUrl(album)}
        showLabel={true}
        size="lg"
        className="text-lg py-4 shadow-xl justify-center"
      />
      {showLabels && (
        <div className="flex items-center justify-center space-x-4">
          <IconButton
            variant="ghost"
            size="sm"
            icon={copiedLink === 'youtube_default' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
            label={copiedLink === 'youtube_default' ? 'Copied!' : 'Copy link'}
            showLabel={true}
            onClick={() => copyToClipboard(generateYouTubeSearchUrl(album), 'youtube_default')}
            className="text-xs text-zinc-400 hover:text-zinc-300"
          />
          <button
            onClick={showModal}
            className="flex items-center space-x-1 text-xs text-zinc-500 hover:text-zinc-400 transition-colors duration-200"
            title="Choose streaming preference"
          >
            <Settings className="w-3 h-3" />
            <span>Choose</span>
          </button>
        </div>
      )}
    </div>
  )

  // Helper function to render all services
  const renderAllServices = () => (
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
  )

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
        {preferredService === 'all' && (
          <button
            onClick={showModal}
            className="p-2 text-zinc-500 hover:text-zinc-400 transition-colors duration-200"
            title="Set streaming preference"
          >
            <Settings className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Single service display */}
      {preferredService && preferredService !== 'all' && (
        <>
          {preferredService === 'spotify' && renderSingleService('spotify', streamingLinks.spotify!, 'spotify')}
          {preferredService === 'apple_music' && renderSingleService('apple_music', streamingLinks.apple_music!, 'apple')}
          {preferredService === 'youtube_music' && renderSingleService('youtube_music', streamingLinks.youtube_music!, 'youtube')}
        </>
      )}

      {/* Default YouTube search when no preference set */}
      {!preferredService && renderYouTubeDefault()}

      {/* All services display */}
      {preferredService === 'all' && renderAllServices()}
    </div>
  )
}