'use client'

import React, { useState } from 'react'
import Image from 'next/image'
import { Album } from '@/lib/types'
import { StreamingIcon, StreamingService } from '../../ui/icons'
import { Music, Play } from 'lucide-react'
import { useStreamingPreference } from '@/app/contexts/StreamingPreferenceContext'
import { useTheme } from '@/app/context/ThemeContext'

interface AICuratorCardProps {
  album: Album
  onChoose: () => void
  isChosen?: boolean
  isDisabled?: boolean
  side: 'left' | 'right'
  mobile?: boolean
}

function genreColor(genre: string, palette: { value: string }[]): string {
  if (!palette?.length || !genre) return 'var(--color-accent)'
  let h = 0
  for (const ch of genre.toLowerCase()) h = (h * 31 + ch.charCodeAt(0)) % palette.length
  return palette[h].value
}

const AICuratorCard = React.memo(function AICuratorCard({
  album, onChoose, isChosen = false, isDisabled = false, side, mobile = false,
}: AICuratorCardProps) {
  const [imageLoaded, setImageLoaded] = useState(false)
  const { preferredService } = useStreamingPreference()
  const { theme } = useTheme()
  const palette = theme.planColors
  const primaryGenre = album.genres?.[0] ?? ''
  const gColor = genreColor(primaryGenre, palette)

  const generateStreamingLinks = (a: Album) => {
    const q = encodeURIComponent(`${a.artist} ${a.title}`)
    return {
      spotify:       a.streaming_links?.spotify       || (a.spotify_id ? `https://open.spotify.com/album/${a.spotify_id}` : `https://open.spotify.com/search/${q}`),
      apple_music:   a.streaming_links?.apple_music   || `https://music.apple.com/search?term=${q}`,
      youtube_music: a.streaming_links?.youtube_music || `https://music.youtube.com/search?q=${q}`,
    }
  }

  const links = generateStreamingLinks(album)
  const ytSearch = `https://www.youtube.com/results?search_query=${encodeURIComponent(`${album.artist} ${album.title}`)}`

  // Outlined style: brand tint background + border, text uses --color-text (always accessible)
  const STREAM_STYLE: Record<StreamingService, React.CSSProperties> = {
    spotify:       { background: 'color-mix(in srgb, #1DB954 15%, var(--ui-surface))', border: '1px solid #1DB954', color: 'var(--color-text)' },
    apple_music:   { background: 'color-mix(in srgb, #fc3c44 12%, var(--ui-surface))', border: '1px solid #fc3c44', color: 'var(--color-text)' },
    youtube_music: { background: 'color-mix(in srgb, #ff0000 10%, var(--ui-surface))', border: '1px solid #ff4444', color: 'var(--color-text)' },
  }
  const STREAM_ICON_COLOR: Record<StreamingService, string> = {
    spotify: '#1DB954', apple_music: '#fc3c44', youtube_music: '#ff4444',
  }
  const SERVICE_CONFIG = {
    spotify:       { url: links.spotify,       title: 'Listen on Spotify' },
    apple_music:   { url: links.apple_music,   title: 'Listen on Apple Music' },
    youtube_music: { url: links.youtube_music, title: 'Listen on YouTube Music' },
  }
  const SERVICE_LABELS: Record<StreamingService, string> = { spotify: 'Spotify', apple_music: 'Apple Music', youtube_music: 'YouTube' }

  const StreamingBtn = ({ size = 'md', isMobile = false }: { size?: 'sm' | 'md'; isMobile?: boolean }) => {
    const btnBase: React.CSSProperties = {
      display: 'inline-flex', alignItems: 'center', gap: 6,
      padding: isMobile ? '6px 10px' : '5px 10px',
      borderRadius: 'var(--ui-radius-sm)',
      fontFamily: 'var(--ui-font)', fontWeight: 500, fontSize: 12,
      textDecoration: 'none', cursor: 'pointer',
      transition: 'opacity 0.12s',
    }

    if (preferredService && preferredService !== 'all') {
      const svc = preferredService
      return (
        <a href={SERVICE_CONFIG[svc].url} target="_blank" rel="noopener noreferrer"
          title={SERVICE_CONFIG[svc].title}
          style={{ ...btnBase, ...STREAM_STYLE[svc] }}
          onClick={e => e.stopPropagation()}
          aria-label={`${SERVICE_LABELS[svc]} — opens in new tab`}
        >
          <span style={{ color: STREAM_ICON_COLOR[svc], display: 'flex' }}><StreamingIcon service={svc} size={size} /></span>
          <span>{SERVICE_LABELS[svc]}</span>
        </a>
      )
    }
    if (!preferredService) {
      return (
        <a href={ytSearch} target="_blank" rel="noopener noreferrer"
          style={{ ...btnBase, ...STREAM_STYLE.youtube_music }}
          aria-label="Search on YouTube — opens in new tab"
          onClick={e => e.stopPropagation()}
        >
          <span style={{ color: STREAM_ICON_COLOR.youtube_music, display: 'flex' }}><StreamingIcon service="youtube_music" size={size} /></span>
          <span>YouTube</span>
        </a>
      )
    }
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 8 : 4 }}>
        {(['spotify', 'apple_music', 'youtube_music'] as StreamingService[]).map(svc => (
          <a key={svc} href={SERVICE_CONFIG[svc].url} target="_blank" rel="noopener noreferrer"
            title={SERVICE_CONFIG[svc].title}
            aria-label={`${SERVICE_LABELS[svc]} — opens in new tab`}
            style={{ ...btnBase, ...STREAM_STYLE[svc], padding: isMobile ? '6px 8px' : '4px 7px' }}
            onClick={e => e.stopPropagation()}
          >
            <span style={{ color: STREAM_ICON_COLOR[svc], display: 'flex' }}><StreamingIcon service={svc} size={size} /></span>
          </a>
        ))}
      </div>
    )
  }

  const artworkPlaceholder = (sz: string) => (
    <div className={`w-full h-full flex items-center justify-center ${sz}`} style={{ background: 'var(--ui-border)' }}>
      <Music style={{ color: 'var(--ui-muted)' }} />
    </div>
  )

  // ── Mobile ─────────────────────────────────────────────────────────────────
  if (mobile) {
    return (
      <div className={`relative transition-all duration-300 ${isChosen ? 'scale-[1.02]' : ''} ${isDisabled ? 'opacity-50 pointer-events-none' : ''}`}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12, padding: 12,
          background: isChosen ? `color-mix(in srgb, var(--color-accent) 10%, var(--ui-surface))` : 'var(--ui-surface)',
          border: `2px solid ${isChosen ? 'var(--color-accent)' : 'var(--ui-border)'}`,
          borderRadius: 'var(--ui-radius-lg)',
          transition: 'all 0.25s',
        }}>
          <button
            onClick={onChoose} disabled={isDisabled}
            className="flex-shrink-0 relative rounded overflow-hidden hover:opacity-80 transition-opacity duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ width: 96, height: 96, background: 'var(--ui-border)' }}
          >
            {album.cover_art_url
              ? <Image src={album.cover_art_url} alt={`${album.title} by ${album.artist}`} fill className={`object-cover transition-all duration-500 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`} onLoadingComplete={() => setImageLoaded(true)} priority />
              : artworkPlaceholder('w-6 h-6')
            }
          </button>

          <div className="flex-1 min-w-0">
            <h4 style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text)', fontFamily: 'var(--ui-font)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 2 }}>
              {album.title}
            </h4>
            <p style={{ fontSize: 11, color: 'var(--color-text-dim)', fontFamily: 'var(--ui-font)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 4 }}>
              by {album.artist}
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--color-text-dim)', fontFamily: 'var(--ui-font)', marginBottom: 8 }}>
              <span>{album.year}</span>
              {primaryGenre && <>
                <span style={{ width: 5, height: 5, borderRadius: '50%', background: gColor, display: 'inline-block', flexShrink: 0 }} />
                <span>{primaryGenre.toLowerCase()}</span>
              </>}
            </div>
            <StreamingBtn size="sm" isMobile />
          </div>
        </div>
      </div>
    )
  }

  // ── Desktop ────────────────────────────────────────────────────────────────
  return (
    <div
      className={`relative group transition-all duration-500 ${isDisabled ? 'opacity-50 pointer-events-none' : 'hover:scale-[1.02]'}`}
      style={isChosen ? { transform: 'scale(1.05)', boxShadow: `0 0 0 3px var(--color-accent), 0 12px 40px color-mix(in srgb, var(--color-accent) 25%, transparent)`, borderRadius: 'var(--ui-radius-lg)' } : undefined}
    >
      <div style={{
        background: isChosen ? `color-mix(in srgb, var(--color-accent) 8%, var(--ui-surface))` : 'var(--ui-surface)',
        border: `2px solid ${isChosen ? 'var(--color-accent)' : 'var(--ui-border)'}`,
        borderRadius: 'var(--ui-radius-lg)',
        overflow: 'hidden',
        transition: 'all 0.25s',
      }}>
        {/* Cover */}
        <div className="relative aspect-square">
          {album.cover_art_url
            ? <Image src={album.cover_art_url} alt={`${album.title} by ${album.artist}`} fill className={`object-cover transition-all duration-500 ${imageLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-105'}`} onLoadingComplete={() => setImageLoaded(true)} priority />
            : artworkPlaceholder('w-12 h-12')
          }
          <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 50%)' }} />

          {/* Choose overlay */}
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <button
              onClick={onChoose} disabled={isDisabled}
              style={{
                padding: '10px 24px', borderRadius: 'var(--ui-radius-md)',
                fontWeight: 600, fontSize: 14, fontFamily: 'var(--ui-font)',
                background: isChosen ? 'var(--color-accent)' : 'rgba(255,255,255,0.95)',
                color: isChosen ? 'var(--color-accent-text)' : '#000',
                border: 'none', cursor: 'pointer',
                transform: 'translateY(8px)', transition: 'all 0.25s',
                boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
              }}
              className="group-hover:!translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isChosen ? '✓ Chosen' : 'Choose This'}
            </button>
          </div>
        </div>

        {/* Info */}
        <div style={{ padding: 14 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-text)', fontFamily: 'var(--ui-font)', lineHeight: 1.3, marginBottom: 4, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                {album.title}
              </h2>
              <p style={{ fontSize: 13, color: 'var(--color-text-dim)', fontFamily: 'var(--ui-font)', marginBottom: 6, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                by {album.artist}
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--color-text-dim)', fontFamily: 'var(--ui-font)' }}>
                <span>{album.year}</span>
                {primaryGenre && (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 'var(--ui-radius-full)', border: `1px solid color-mix(in srgb, ${gColor} 40%, var(--ui-border))`, background: `color-mix(in srgb, ${gColor} 10%, var(--ui-bg))`, color: gColor }}>
                    {primaryGenre}
                  </span>
                )}
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6, flexShrink: 0, marginLeft: 4 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--color-text-dim)', fontSize: 11, fontFamily: 'var(--ui-font)' }}>
                <Play size={11} />
                <span>Listen</span>
              </div>
              <StreamingBtn size="sm" />
            </div>
          </div>
        </div>
      </div>

      {/* Side indicator */}
      <div style={{ position: 'absolute', top: 10, [side === 'left' ? 'left' : 'right']: 10 }}>
        <div style={{
          width: 24, height: 24, borderRadius: '50%',
          background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
          border: '1px solid rgba(255,255,255,0.2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: '#fff', fontFamily: 'var(--ui-font)' }}>
            {side === 'left' ? 'A' : 'B'}
          </span>
        </div>
      </div>
    </div>
  )
})

export default AICuratorCard
