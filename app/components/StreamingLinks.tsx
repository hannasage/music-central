'use client'

import { useState } from 'react'
import { Album, StreamingLinks } from '@/lib/types'
import { ExternalLink, Copy, Check, Share2 } from 'lucide-react'

// Spotify Icon Component
function SpotifyIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.42 1.56-.299.421-1.02.599-1.559.3z"/>
    </svg>
  )
}

// Apple Music Icon Component - Double Eighth Note
function AppleMusicIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M9 18V5l12-2v13"/>
      <circle cx="6" cy="18" r="3"/>
      <circle cx="18" cy="16" r="3"/>
    </svg>
  )
}

// YouTube Music Icon Component - Play Button
function YouTubeMusicIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M6.8 4.2v15.6l13.2-7.8z" fill="#ffffff"/>
    </svg>
  )
}

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
          <a
            href={streamingLinks.spotify}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center space-x-3 bg-green-500 hover:bg-green-400 text-white px-4 py-3 rounded-lg font-medium transition-colors duration-200 shadow-lg"
          >
            <SpotifyIcon className="w-5 h-5" />
            {showLabels && <span>Spotify</span>}
          </a>
          {showLabels && (
            <button
              onClick={() => copyToClipboard(streamingLinks.spotify!, 'spotify')}
              className="flex items-center justify-center space-x-2 text-xs text-zinc-400 hover:text-zinc-300 transition-colors duration-200"
            >
              {copiedLink === 'spotify' ? (
                <>
                  <Check className="w-3 h-3" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" />
                  <span>Copy link</span>
                </>
              )}
            </button>
          )}
        </div>

        {/* Apple Music */}
        <div className="flex flex-col space-y-2">
          <a
            href={streamingLinks.apple_music}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center space-x-3 bg-gradient-to-r from-[#fa5a72] to-[#fa253e] hover:from-[#fb6b7f] hover:to-[#fb3651] text-white px-4 py-3 rounded-lg font-medium transition-all duration-200 shadow-lg"
          >
            <AppleMusicIcon className="w-5 h-5" />
            {showLabels && <span>Apple Music</span>}
          </a>
          {showLabels && (
            <button
              onClick={() => copyToClipboard(streamingLinks.apple_music!, 'apple')}
              className="flex items-center justify-center space-x-2 text-xs text-zinc-400 hover:text-zinc-300 transition-colors duration-200"
            >
              {copiedLink === 'apple' ? (
                <>
                  <Check className="w-3 h-3" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" />
                  <span>Copy link</span>
                </>
              )}
            </button>
          )}
        </div>

        {/* YouTube */}
        <div className="flex flex-col space-y-2">
          <a
            href={streamingLinks.youtube_music}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center space-x-3 bg-red-500 hover:bg-red-400 text-white px-4 py-3 rounded-lg font-medium transition-colors duration-200 shadow-lg"
          >
            <YouTubeMusicIcon className="w-5 h-5" />
            {showLabels && <span>YouTube</span>}
          </a>
          {showLabels && (
            <button
              onClick={() => copyToClipboard(streamingLinks.youtube_music!, 'youtube')}
              className="flex items-center justify-center space-x-2 text-xs text-zinc-400 hover:text-zinc-300 transition-colors duration-200"
            >
              {copiedLink === 'youtube' ? (
                <>
                  <Check className="w-3 h-3" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" />
                  <span>Copy link</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}