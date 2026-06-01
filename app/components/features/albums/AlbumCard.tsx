'use client'

import React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Album } from '@/lib/types'
import { Music } from 'lucide-react'
import { Badge } from '@hannasage/projection-ui'
import { useTheme } from '@/app/context/ThemeContext'
import { genreColorFromPalette } from '@/lib/genre-color'

interface AlbumCardProps {
  album: Album
  size?: 'small' | 'medium' | 'large'
  layout?: 'vertical' | 'horizontal'
  className?: string
  /** When filtering, the matched genre/vibe to show instead of album.genres[0] */
  displayGenre?: string
}

const AlbumCard = React.memo(function AlbumCard({
  album, size = 'medium', layout = 'vertical', className = '', displayGenre,
}: AlbumCardProps) {
  const { theme } = useTheme()
  const primaryGenre = album.genres?.[0] ?? ''
  const displayTag   = displayGenre ?? primaryGenre
  const isFeatured   = album.featured
  const genreColor   = genreColorFromPalette(displayTag, theme.planColors)

  const artworkBg    = { background: 'var(--ui-border)' }
  const cardSurface  = { background: 'var(--ui-surface)', border: '1px solid var(--ui-border)' }
  const textPrimary  = { color: 'var(--color-text)' }
  const textMuted    = { color: 'var(--color-text-dim)', fontFamily: 'var(--ui-font)' }

  const genreBadgeStyle = {
    borderRadius: 'var(--ui-radius-full)',
    borderColor:  `color-mix(in srgb, ${genreColor} 40%, var(--ui-border))`,
    background:   `color-mix(in srgb, ${genreColor} 10%, var(--ui-bg))`,
  }

  const featuredEyebrow = (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <span aria-hidden style={{ display: 'inline-block', width: 5, height: 5, borderRadius: '50%', background: 'var(--color-accent)', flexShrink: 0 }} />
      <span style={{ fontSize: 9, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--color-accent-text-safe, var(--color-accent))', fontFamily: 'var(--ui-font)', fontWeight: 500 }}>
        Featured Album
      </span>
    </div>
  )

  const artworkPlaceholder = (iconSize: string) => (
    <div className="w-full h-full flex items-center justify-center" style={artworkBg}>
      <Music className={iconSize} style={{ color: 'var(--ui-muted)' }} />
    </div>
  )

  // ── Horizontal layout ──────────────────────────────────────────────────────
  if (layout === 'horizontal') {
    return (
      <article
        className={`album-card-glow backdrop-blur-sm rounded-lg transition-all duration-200 group ${className}`}
        style={isFeatured ? undefined : cardSurface}
      >
        <Link
          href={`/albums/${album.id}`}
          className={isFeatured ? 'album-card-featured block rounded-lg' : 'block'}
          aria-labelledby={`album-title-${album.id}`}
          aria-describedby={`album-artist-${album.id}`}
        >
          <div className="flex items-center gap-4 p-4">
            <div className="w-16 h-16 flex-shrink-0 relative rounded overflow-hidden" style={artworkBg}>
              {album.cover_art_url
                ? <Image src={album.cover_art_url} alt={`${album.title} by ${album.artist}`} fill className="object-cover group-hover:scale-105 transition-transform duration-200" sizes="64px" />
                : artworkPlaceholder('w-6 h-6')
              }
            </div>

            <div className="flex-1 min-w-0">
              {isFeatured && <div className="mb-1">{featuredEyebrow}</div>}
              <h3 id={`album-title-${album.id}`} className="font-semibold text-base truncate" style={textPrimary}>
                {album.title}
              </h3>
              <p id={`album-artist-${album.id}`} className="text-sm truncate" style={textMuted}>
                by {album.artist}
              </p>
              <div className="flex items-center gap-2 text-xs mt-1" style={textMuted}>
                <span>{album.year}</span>
                {displayTag && <><span>·</span><span className="truncate">{displayTag.toLowerCase()}</span></>}
              </div>
            </div>
          </div>
        </Link>
      </article>
    )
  }

  // ── Vertical layout (default) ──────────────────────────────────────────────
  const textSize = size === 'large' ? 'text-lg' : size === 'small' ? 'text-sm' : 'text-base'

  return (
    <article className={`group transition-transform duration-300 hover:scale-105 ${className}`}>
      <Link
        href={`/albums/${album.id}`}
        className="block"
        aria-labelledby={`album-title-${album.id}`}
        aria-describedby={`album-artist-${album.id}`}
      >
        <div
          className={`${isFeatured ? 'album-card-featured' : 'album-card-glow'} w-full rounded-lg overflow-hidden shadow-lg transition-all duration-300`}
          style={isFeatured ? undefined : cardSurface}
        >
          {/* Artwork */}
          <div className="relative aspect-square w-full overflow-hidden" style={artworkBg}>
            {album.cover_art_url
              ? <Image
                  src={album.cover_art_url}
                  alt={`${album.title} by ${album.artist}`}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-110"
                  sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
                />
              : artworkPlaceholder('w-8 h-8')
            }

            {isFeatured && (
              <div aria-hidden style={{
                position: 'absolute', top: 10, left: 10, zIndex: 2,
                display: 'inline-flex', alignItems: 'center', gap: 4,
                padding: '3px 8px',
                background: 'var(--color-accent)', color: 'var(--color-accent-text)',
                borderRadius: 3, fontSize: 9, fontWeight: 600,
                fontFamily: 'var(--ui-font)', letterSpacing: '0.12em', textTransform: 'uppercase',
              }}>
                ★ Featured
              </div>
            )}

            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" style={{ background: 'rgba(0,0,0,0.15)' }} />
          </div>

          {/* Info */}
          <div className="p-4 space-y-2">
            {isFeatured && featuredEyebrow}

            <h2 id={`album-title-${album.id}`} className={`font-semibold line-clamp-2 ${textSize}`} style={textPrimary}>
              {album.title}
            </h2>

            <p id={`album-artist-${album.id}`} className={`line-clamp-1 ${textSize === 'text-lg' ? 'text-base' : 'text-sm'}`} style={textMuted}>
              {album.artist}
            </p>

            <div className="flex items-center justify-between text-xs" style={textMuted}>
              <span>{album.year}</span>
              {primaryGenre && (
                <Badge dot dotColor={genreColor} style={{ ...genreBadgeStyle, maxWidth: '100%', overflow: 'hidden' }}>
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block', maxWidth: 80 }}>
                    {displayTag.toLowerCase()}
                  </span>
                </Badge>
              )}
            </div>
          </div>
        </div>
      </Link>
    </article>
  )
})

export default AlbumCard
