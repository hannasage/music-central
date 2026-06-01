'use client'

import { useState, useEffect, useRef } from 'react'
import { BattleChoice } from '@/app/hooks/useBattleSession'
import { BarChart3, Music2, Palette, ChevronDown, ChevronUp } from 'lucide-react'
import { useTheme } from '@/app/context/ThemeContext'

interface CuratorChartsProps {
  battleHistory: BattleChoice[]
  className?: string
}

/** Deterministic palette slot from a string — same algorithm as AlbumCard. */
function paletteIdx(str: string, len: number): number {
  let h = 0
  for (const ch of str.toLowerCase()) h = (h * 31 + ch.charCodeAt(0)) % len
  return h
}

function AnimatedCollapsible({ isOpen, children }: { isOpen: boolean; children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)
  const [height, setHeight] = useState<number | undefined>(undefined)

  useEffect(() => {
    if (!ref.current) return
    const ro = new ResizeObserver(() => { if (ref.current) setHeight(ref.current.scrollHeight) })
    ro.observe(ref.current)
    return () => ro.disconnect()
  }, [])

  useEffect(() => { if (ref.current) setHeight(ref.current.scrollHeight) }, [children])

  return (
    <div style={{ height: isOpen ? height : 0, overflow: 'hidden', transition: 'height 0.3s cubic-bezier(0.4,0,0.2,1)' }}>
      <div ref={ref}>{children}</div>
    </div>
  )
}

export default function CuratorCharts({ battleHistory, className = '' }: CuratorChartsProps) {
  const [showAllGenres, setShowAllGenres] = useState(false)
  const [showAllVibes, setShowAllVibes]   = useState(false)
  const { theme } = useTheme()
  const palette = theme.planColors

  if (battleHistory.length === 0) return null

  const INITIAL = 3
  const chosenAlbums = battleHistory.map(c => c.chosenAlbum)

  const genreCounts = new Map<string, number>()
  chosenAlbums.forEach(a => a.genres.forEach(g => genreCounts.set(g, (genreCounts.get(g) ?? 0) + 1)))

  const vibeCounts = new Map<string, number>()
  chosenAlbums.forEach(a => a.personal_vibes?.forEach(v => vibeCounts.set(v, (vibeCounts.get(v) ?? 0) + 1)))

  const allGenres = [...genreCounts.entries()].sort((a, b) => b[1] - a[1])
  const allVibes  = [...vibeCounts.entries()].sort((a, b) => b[1] - a[1])
  const maxGenre  = allGenres[0]?.[1] ?? 0
  const maxVibe   = allVibes[0]?.[1]  ?? 0

  const color = (str: string) => palette[paletteIdx(str, palette.length)]?.value ?? 'var(--color-accent)'

  const BarRow = ({ label, count, max, glow }: { label: string; count: number; max: number; glow: string }) => {
    const pct  = max > 0 ? (count / max) * 100 : 0
    const clr  = color(label)
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {/* Colored swatch dot */}
        <span style={{ width: 7, height: 7, borderRadius: '50%', background: clr, flexShrink: 0 }} />
        {/* Label */}
        <div style={{ width: 110, fontSize: 12, color: 'var(--color-text)', fontFamily: 'var(--ui-font)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={label}>
          {label}
        </div>
        {/* Bar track */}
        <div style={{ flex: 1, height: 6, borderRadius: 3, background: 'var(--ui-border)', overflow: 'hidden' }}>
          <div style={{
            height: '100%',
            width: `${pct}%`,
            borderRadius: 3,
            background: clr,
            boxShadow: `0 0 8px color-mix(in srgb, ${clr} 50%, transparent)`,
            transition: 'width 0.8s cubic-bezier(0.4,0,0.2,1)',
          }} />
        </div>
        {/* Count */}
        <div style={{ width: 20, fontSize: 11, color: 'var(--color-text-dim)', fontFamily: 'var(--ui-font)', textAlign: 'right' }}>{count}</div>
      </div>
    )
  }

  const expandBtn = (show: boolean, toggle: () => void, allCount: number, label: string, accentClr: string) => (
    <button
      onClick={toggle}
      style={{
        width: '100%', padding: '8px 0', marginTop: 6,
        fontSize: 11, fontFamily: 'var(--ui-font)',
        color: accentClr, background: 'none', border: 'none',
        borderTop: `1px solid var(--ui-border)`,
        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
        letterSpacing: '0.04em',
      }}
    >
      {show
        ? <><span>Show less</span><ChevronUp size={11} /></>
        : <><span>See all {allCount} {label}</span><ChevronDown size={11} /></>}
    </button>
  )

  return (
    <div
      className={className}
      style={{
        background: 'var(--ui-surface)',
        border: '1px solid var(--ui-border)',
        borderRadius: 'var(--ui-radius-lg)',
        padding: 20,
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
        <BarChart3 size={15} style={{ color: 'var(--color-accent)', flexShrink: 0 }} />
        <h3 style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text)', fontFamily: 'var(--ui-font)', margin: 0 }}>
          Your Music Data
        </h3>
        <span style={{ fontSize: 10, color: 'var(--color-text-dim)', fontFamily: 'var(--ui-font)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
          {battleHistory.length} choice{battleHistory.length !== 1 ? 's' : ''}
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        {/* Genres */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
            <Music2 size={13} style={{ color: color(allGenres[0]?.[0] ?? 'genre'), flexShrink: 0 }} />
            <h4 style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text)', fontFamily: 'var(--ui-font)', letterSpacing: '0.08em', textTransform: 'uppercase', margin: 0 }}>
              Top Genres
            </h4>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {allGenres.slice(0, INITIAL).map(([g, c]) => <BarRow key={g} label={g} count={c} max={maxGenre} glow={color(g)} />)}
          </div>
          {allGenres.length > INITIAL && (
            <AnimatedCollapsible isOpen={showAllGenres}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingTop: 8 }}>
                {allGenres.slice(INITIAL).map(([g, c]) => <BarRow key={g} label={g} count={c} max={maxGenre} glow={color(g)} />)}
              </div>
            </AnimatedCollapsible>
          )}
          {allGenres.length > INITIAL && expandBtn(showAllGenres, () => setShowAllGenres(v => !v), allGenres.length, 'genres', color(allGenres[INITIAL]?.[0] ?? ''))}
        </div>

        {/* Vibes */}
        {allVibes.length > 0 && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
              <Palette size={13} style={{ color: color(allVibes[0]?.[0] ?? 'vibe'), flexShrink: 0 }} />
              <h4 style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text)', fontFamily: 'var(--ui-font)', letterSpacing: '0.08em', textTransform: 'uppercase', margin: 0 }}>
                Top Vibes
              </h4>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {allVibes.slice(0, INITIAL).map(([v, c]) => <BarRow key={v} label={v} count={c} max={maxVibe} glow={color(v)} />)}
            </div>
            {allVibes.length > INITIAL && (
              <AnimatedCollapsible isOpen={showAllVibes}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingTop: 8 }}>
                  {allVibes.slice(INITIAL).map(([v, c]) => <BarRow key={v} label={v} count={c} max={maxVibe} glow={color(v)} />)}
                </div>
              </AnimatedCollapsible>
            )}
            {allVibes.length > INITIAL && expandBtn(showAllVibes, () => setShowAllVibes(v => !v), allVibes.length, 'vibes', color(allVibes[INITIAL]?.[0] ?? ''))}
          </div>
        )}
      </div>

      {/* Quick stats */}
      <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--ui-border)', display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
        {[
          { value: battleHistory.length, label: 'Choices' },
          { value: genreCounts.size,      label: 'Genres' },
          { value: vibeCounts.size,       label: 'Vibes'  },
          { value: new Set(chosenAlbums.map(a => a.artist)).size, label: 'Artists' },
        ].map(({ value, label }) => (
          <div key={label} style={{ textAlign: 'center', padding: '8px 4px', borderRadius: 'var(--ui-radius-md)', background: 'var(--ui-bg)' }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--color-accent)', fontFamily: 'var(--ui-font)', lineHeight: 1.2 }}>{value}</div>
            <div style={{ fontSize: 9, color: 'var(--color-text-dim)', fontFamily: 'var(--ui-font)', letterSpacing: '0.1em', textTransform: 'uppercase', marginTop: 2 }}>{label}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
