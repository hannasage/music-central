'use client'

import { useState, useMemo, useEffect, useRef } from 'react'
import AlbumCard from './AlbumCard'
import AlbumsControls from './AlbumsControls'
import { Album } from '@/lib/types'
import { useViewMode } from '@/app/hooks/useViewMode'
import { useTheme } from '@/app/context/ThemeContext'
import { genreColorFromPalette } from '@/lib/genre-color'
import { Music, ChevronDown, X, Check } from 'lucide-react'

interface PaginationInfo {
  page: number
  limit: number
  total: number
  totalPages: number
}

interface AlbumsPageClientProps {
  initialAlbums: Album[]
  initialPagination: PaginationInfo
}

function getDisplayTag(album: Album, activeGenres: string[], activeVibes: string[]): string | undefined {
  if (!activeGenres.length && !activeVibes.length) return undefined
  const g = album.genres?.find(g => activeGenres.includes(g.toLowerCase()))
  if (g) return g
  const v = album.personal_vibes?.find(v => activeVibes.includes(v.toLowerCase()))
  return v ?? undefined
}

// ── Multi-select dropdown ───────────────────────────────────────────────────
function FilterDropdown({
  label,
  options,
  selected,
  onToggle,
  onClear,
  tagColor,
}: {
  label: string
  options: string[]
  selected: string[]
  onToggle: (tag: string) => void
  onClear: () => void
  tagColor: (tag: string) => string
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', handler)
    document.addEventListener('keydown', esc)
    return () => {
      document.removeEventListener('mousedown', handler)
      document.removeEventListener('keydown', esc)
    }
  }, [open])

  const hasSelection = selected.length > 0

  const triggerStyle: React.CSSProperties = {
    display: 'inline-flex', alignItems: 'center', gap: 6,
    padding: '6px 12px',
    borderRadius: 'var(--ui-radius-md)',
    border: hasSelection
      ? '1px solid var(--color-accent)'
      : `1px solid var(--ui-border)`,
    background: hasSelection
      ? 'color-mix(in srgb, var(--color-accent) 10%, var(--ui-surface))'
      : 'var(--ui-surface)',
    color: 'var(--color-text)',
    fontSize: 12, fontFamily: 'var(--ui-font)',
    cursor: 'pointer', whiteSpace: 'nowrap',
    transition: 'all 0.12s',
  }

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button onClick={() => setOpen(o => !o)} style={triggerStyle} aria-expanded={open} aria-haspopup="listbox">
        <span style={{ fontWeight: hasSelection ? 600 : 400 }}>{label}</span>

        {hasSelection && (
          <span style={{
            minWidth: 18, height: 18, padding: '0 4px',
            borderRadius: 9,
            background: 'var(--color-accent)', color: 'var(--color-accent-text)',
            fontSize: 10, fontWeight: 700,
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          }}>
            {selected.length}
          </span>
        )}

        <ChevronDown size={11} style={{ transition: 'transform 0.15s', transform: open ? 'rotate(180deg)' : 'none', opacity: 0.6 }} />
      </button>

      {open && (
        <div
          role="listbox"
          aria-multiselectable="true"
          aria-label={`${label} filter`}
          style={{
            position: 'absolute', top: 'calc(100% + 6px)', left: 0, zIndex: 100,
            minWidth: 220, maxHeight: 300, overflowY: 'auto',
            background: 'var(--ui-surface)',
            border: '1px solid var(--ui-border)',
            borderRadius: 'var(--ui-radius-md)',
            boxShadow: '0 10px 36px rgba(0,0,0,0.25)',
            padding: 4,
          }}
        >
          {hasSelection && (
            <button
              onClick={() => { onClear(); setOpen(false) }}
              style={{
                display: 'flex', alignItems: 'center', gap: 6, width: '100%',
                padding: '6px 10px', border: 'none', borderBottom: '1px solid var(--ui-border)',
                marginBottom: 4, background: 'transparent',
                color: 'var(--color-text-dim)', fontSize: 11, fontFamily: 'var(--ui-font)',
                cursor: 'pointer',
              }}
            >
              <X size={10} />
              Clear {selected.length} selected
            </button>
          )}

          {options.map(option => {
            const isSelected = selected.includes(option)
            const c = tagColor(option)
            return (
              <button
                key={option}
                role="option"
                aria-selected={isSelected}
                onClick={() => onToggle(option)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8, width: '100%',
                  padding: '6px 10px', border: 'none',
                  borderRadius: 'var(--ui-radius-sm)',
                  background: isSelected
                    ? `color-mix(in srgb, ${c} 14%, var(--ui-surface))`
                    : 'transparent',
                  color: 'var(--color-text)',
                  fontSize: 12, fontFamily: 'var(--ui-font)',
                  cursor: 'pointer', textAlign: 'left',
                  transition: 'background 0.1s',
                }}
              >
                <span aria-hidden style={{ width: 6, height: 6, borderRadius: '50%', background: c, flexShrink: 0, opacity: isSelected ? 1 : 0.45 }} />
                <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {option}
                </span>
                {isSelected && <Check size={11} style={{ color: c, flexShrink: 0 }} />}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ── Main component ─────────────────────────────────────────────────────────
export default function AlbumsPageClient({ initialAlbums, initialPagination: _ }: AlbumsPageClientProps) {
  const albums = initialAlbums
  const { viewMode, setViewMode } = useViewMode()
  const [activeGenres, setActiveGenres] = useState<string[]>([])
  const [activeVibes,  setActiveVibes]  = useState<string[]>([])
  const [filterMode,   setFilterMode]   = useState<'OR' | 'AND'>('OR')
  const { theme } = useTheme()

  const allGenres = useMemo(() => {
    const s = new Set<string>()
    albums.forEach(a => a.genres?.forEach(g => { if (g.trim()) s.add(g.toLowerCase()) }))
    return Array.from(s).sort((a, b) => a.localeCompare(b))
  }, [albums])

  const allVibes = useMemo(() => {
    const s = new Set<string>()
    albums.forEach(a => a.personal_vibes?.forEach(v => { if (v.trim()) s.add(v.toLowerCase()) }))
    return Array.from(s).sort((a, b) => a.localeCompare(b))
  }, [albums])

  const tagColor = (tag: string) => genreColorFromPalette(tag, theme.planColors)

  const toggle = (list: string[], setList: React.Dispatch<React.SetStateAction<string[]>>) =>
    (tag: string) => setList(prev => prev.includes(tag) ? prev.filter(f => f !== tag) : [...prev, tag])

  const filteredAlbums = useMemo(() => {
    const allActive = [...activeGenres, ...activeVibes]
    if (!allActive.length) return albums

    return albums.filter(album => {
      const albumTags = [
        ...(album.genres?.map(g => g.toLowerCase()) ?? []),
        ...(album.personal_vibes?.map(v => v.toLowerCase()) ?? []),
      ]
      return filterMode === 'AND'
        ? allActive.every(f => albumTags.includes(f))
        : activeGenres.some(f => album.genres?.some(g => g.toLowerCase() === f)) ||
          activeVibes.some(f => album.personal_vibes?.some(v => v.toLowerCase() === f))
    })
  }, [albums, activeGenres, activeVibes, filterMode])

  const totalActive = activeGenres.length + activeVibes.length
  const clearAll = () => { setActiveGenres([]); setActiveVibes([]) }

  return (
    <>
      {/* ── Toolbar: filters + view toggle ──────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
        <FilterDropdown
          label="Genres"
          options={allGenres}
          selected={activeGenres}
          onToggle={toggle(activeGenres, setActiveGenres)}
          onClear={() => setActiveGenres([])}
          tagColor={tagColor}
        />
        <FilterDropdown
          label="Vibes"
          options={allVibes}
          selected={activeVibes}
          onToggle={toggle(activeVibes, setActiveVibes)}
          onClear={() => setActiveVibes([])}
          tagColor={tagColor}
        />

        {/* AND / OR mode toggle — only meaningful with 2+ active filters */}
        {totalActive >= 2 && (
          <div
            role="group"
            aria-label="Filter match mode"
            style={{
              display: 'inline-flex',
              border: '1px solid var(--ui-border)',
              borderRadius: 'var(--ui-radius-md)',
              overflow: 'hidden',
            }}
          >
            {(['OR', 'AND'] as const).map((mode, idx) => (
              <button
                key={mode}
                onClick={() => setFilterMode(mode)}
                aria-pressed={filterMode === mode}
                title={mode === 'OR' ? 'Show albums matching any filter' : 'Show albums matching all filters'}
                style={{
                  padding: '5px 10px',
                  fontSize: 11,
                  fontFamily: 'var(--ui-font)',
                  fontWeight: filterMode === mode ? 600 : 400,
                  background: filterMode === mode
                    ? 'color-mix(in srgb, var(--color-accent) 13%, transparent)'
                    : 'transparent',
                  color: filterMode === mode ? 'var(--color-accent)' : 'var(--color-text-dim)',
                  border: 'none',
                  borderLeft: idx > 0 ? '1px solid var(--ui-border)' : 'none',
                  cursor: 'pointer',
                  transition: 'all 0.12s',
                  letterSpacing: '0.04em',
                }}
              >
                {mode}
              </button>
            ))}
          </div>
        )}

        {totalActive > 0 && (
          <button
            onClick={clearAll}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 4,
              padding: '6px 10px', border: 'none', background: 'transparent',
              color: 'var(--color-text-dim)', fontSize: 11, fontFamily: 'var(--ui-font)',
              cursor: 'pointer',
            }}
          >
            <X size={10} />
            Clear all
          </button>
        )}

        {/* Spacer */}
        <div style={{ flex: 1 }} />

        <span style={{ fontSize: 11, color: 'var(--color-text-dim)', fontFamily: 'var(--ui-font)' }}>
          {totalActive > 0 ? `${filteredAlbums.length} of ${albums.length}` : `${albums.length} albums`}
        </span>

        <AlbumsControls viewMode={viewMode} onViewModeChange={setViewMode} />
      </div>

      {/* ── Albums ──────────────────────────────────────────────────── */}
      {filteredAlbums.length > 0 ? (
        <>
          <div className="hidden md:grid grid-cols-4 lg:grid-cols-6 gap-4 mb-8">
            {filteredAlbums.map(album => (
              <AlbumCard key={album.id} album={album} size="small"
                displayGenre={getDisplayTag(album, activeGenres, activeVibes)} />
            ))}
          </div>

          <div className="md:hidden">
            {viewMode === 'grid' ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
                {filteredAlbums.map(album => (
                  <AlbumCard key={album.id} album={album} size="small"
                    displayGenre={getDisplayTag(album, activeGenres, activeVibes)} />
                ))}
              </div>
            ) : (
              <div className="space-y-3 mb-8">
                {filteredAlbums.map(album => (
                  <AlbumCard key={album.id} album={album} layout="horizontal"
                    displayGenre={getDisplayTag(album, activeGenres, activeVibes)} />
                ))}
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="text-center py-16">
          <div className="w-14 h-14 mx-auto mb-4 rounded-full flex items-center justify-center"
            style={{ background: 'var(--ui-surface)', border: '1px solid var(--ui-border)' }}>
            <Music className="w-6 h-6" style={{ color: 'var(--ui-muted)' }} />
          </div>
          <p style={{ fontSize: 14, fontWeight: 500, color: 'var(--color-text)', fontFamily: 'var(--ui-font)', marginBottom: 8 }}>
            No albums match these filters
          </p>
          <button onClick={clearAll} style={{ fontSize: 12, fontFamily: 'var(--ui-font)', color: 'var(--color-accent)', background: 'none', border: 'none', cursor: 'pointer' }}>
            Clear all filters
          </button>
        </div>
      )}
    </>
  )
}
