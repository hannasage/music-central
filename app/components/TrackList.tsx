'use client'

import { useState, useRef, useEffect } from 'react'
import { Track } from '@/lib/types'
import { Play, Pause, ExternalLink, Clock } from 'lucide-react'

interface TrackListProps {
  tracks: Track[]
  className?: string
}

export default function TrackList({ tracks, className = '' }: TrackListProps) {
  const [currentlyPlaying, setCurrentlyPlaying] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState<string | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    // Cleanup audio when component unmounts
    return () => {
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current = null
      }
    }
  }, [])

  const formatDuration = (durationMs: number): string => {
    const minutes = Math.floor(durationMs / 60000)
    const seconds = Math.floor((durationMs % 60000) / 1000)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  const handlePlayPreview = async (track: Track) => {
    if (!track.preview_url) return

    // If this track is currently playing, pause it
    if (currentlyPlaying === track.id) {
      if (audioRef.current) {
        audioRef.current.pause()
        setCurrentlyPlaying(null)
      }
      return
    }

    // Stop any currently playing audio
    if (audioRef.current) {
      audioRef.current.pause()
    }

    setIsLoading(track.id)

    try {
      // Create new audio element
      const audio = new Audio(track.preview_url)
      audioRef.current = audio

      // Set up event listeners
      audio.addEventListener('loadstart', () => setIsLoading(track.id))
      audio.addEventListener('canplay', () => setIsLoading(null))
      audio.addEventListener('ended', () => setCurrentlyPlaying(null))
      audio.addEventListener('error', () => {
        setIsLoading(null)
        setCurrentlyPlaying(null)
      })

      // Start playing
      await audio.play()
      setCurrentlyPlaying(track.id)
    } catch (error) {
      console.error('Error playing preview:', error)
      setIsLoading(null)
      setCurrentlyPlaying(null)
    }
  }

  const openSpotifyTrack = (track: Track) => {
    if (track.spotify_id) {
      window.open(`https://open.spotify.com/track/${track.spotify_id}`, '_blank')
    }
  }

  if (!tracks || tracks.length === 0) {
    return (
      <div className={`${className}`}>
        <h3 className="text-lg font-semibold text-white mb-4">Track Listing</h3>
        <div className="text-center py-8 text-zinc-400">
          <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>No track information available</p>
        </div>
      </div>
    )
  }

  const totalDuration = tracks.reduce((sum, track) => sum + track.duration_ms, 0)

  return (
    <div className={`${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">Track Listing</h3>
        <div className="text-sm text-zinc-400">
          {tracks.length} track{tracks.length !== 1 ? 's' : ''} • {formatDuration(totalDuration)}
        </div>
      </div>

      <div className="space-y-1">
        {tracks.map((track) => (
          <div
            key={track.id}
            className="group flex items-center space-x-4 p-3 rounded-lg hover:bg-zinc-800/50 transition-colors duration-200"
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                handlePlayPreview(track)
              }
            }}
            tabIndex={0}
            role="button"
            aria-label={`${track.preview_url ? 'Play preview of' : 'Track'} ${track.name}`}
          >
            {/* Track Number & Play Button */}
            <div className="flex items-center justify-center w-8 h-8 text-zinc-400 group-hover:text-white transition-colors duration-200">
              {track.preview_url ? (
                <button
                  onClick={() => handlePlayPreview(track)}
                  className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors duration-200"
                  disabled={isLoading === track.id}
                >
                  {isLoading === track.id ? (
                    <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                  ) : currentlyPlaying === track.id ? (
                    <Pause className="w-4 h-4" />
                  ) : (
                    <Play className="w-4 h-4" />
                  )}
                </button>
              ) : (
                <span className="text-sm font-medium">{track.track_number}</span>
              )}
            </div>

            {/* Track Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2">
                <h4 className="text-white font-medium truncate group-hover:text-blue-400 transition-colors duration-200">
                  {track.name}
                </h4>
                {currentlyPlaying === track.id && (
                  <div className="flex space-x-1">
                    <div className="w-1 h-3 bg-green-500 animate-pulse rounded-full" />
                    <div className="w-1 h-3 bg-green-500 animate-pulse rounded-full" style={{ animationDelay: '0.1s' }} />
                    <div className="w-1 h-3 bg-green-500 animate-pulse rounded-full" style={{ animationDelay: '0.2s' }} />
                  </div>
                )}
              </div>
              {!track.preview_url && (
                <p className="text-xs text-zinc-500 mt-1">No preview available</p>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              {track.spotify_id && (
                <button
                  onClick={() => openSpotifyTrack(track)}
                  className="p-1.5 text-zinc-400 hover:text-green-400 transition-colors duration-200"
                  title="Open in Spotify"
                >
                  <ExternalLink className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Duration */}
            <div className="text-sm text-zinc-400 font-medium tabular-nums">
              {formatDuration(track.duration_ms)}
            </div>
          </div>
        ))}
      </div>

      {/* Preview Notice */}
      {tracks.some(track => track.preview_url) && (
        <div className="mt-4 text-xs text-zinc-500 bg-zinc-900/50 rounded-lg p-3 border border-zinc-800/50">
          <p className="flex items-center space-x-2">
            <Play className="w-3 h-3" />
            <span>Click the play button to hear 30-second previews powered by Spotify</span>
          </p>
        </div>
      )}
    </div>
  )
}