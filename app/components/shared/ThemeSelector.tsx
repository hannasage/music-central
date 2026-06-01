'use client'

import { useState, useEffect, useRef } from 'react'
import type { RefObject } from 'react'
import { THEMES, type Theme, type ThemeColors } from '@/lib/projection-themes'
import { useTheme } from '@/app/context/ThemeContext'

export default function ThemeSelector() {
  const { theme: currentTheme, setTheme, colors: COLORS } = useTheme()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const handleSelect = (next: Theme) => {
    if (next.id !== currentTheme.id) setTheme(next)
    setOpen(false)
  }

  const darkThemes  = THEMES.filter(t => t.isDark)
  const lightThemes: typeof THEMES = [] // light themes disabled pending polish

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        aria-label="Change theme"
        aria-expanded={open}
        style={{
          display:     'inline-flex',
          alignItems:  'center',
          gap:         6,
          borderRadius: 4,
          border:      `1px solid ${COLORS.border}`,
          padding:     '5px 10px',
          fontSize:    12,
          fontFamily:  'var(--ui-font)',
          cursor:      'pointer',
          background:  open ? `${COLORS.accent}22` : 'transparent',
          color:       COLORS.muted,
          transition:  'all 0.12s',
        }}
      >
        <svg width="13" height="13" viewBox="0 0 14 14" fill="none" aria-hidden>
          <circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1.2"/>
          <circle cx="4.5" cy="5.5" r="1.2" fill={currentTheme.planColors[0]?.value ?? COLORS.accent}/>
          <circle cx="7"   cy="4"   r="1.2" fill={currentTheme.planColors[1]?.value ?? COLORS.blue}/>
          <circle cx="9.5" cy="5.5" r="1.2" fill={currentTheme.planColors[2]?.value ?? COLORS.orange}/>
          <circle cx="9"   cy="8.5" r="1.2" fill={currentTheme.planColors[3]?.value ?? COLORS.purple}/>
          <circle cx="5"   cy="8.5" r="1.2" fill={currentTheme.planColors[4]?.value ?? COLORS.red}/>
        </svg>
        <span style={{ width: 8, height: 8, borderRadius: '50%', background: COLORS.accent, display: 'inline-block', flexShrink: 0 }} />
      </button>

      {open && (
        <ThemeDropdown
          COLORS={COLORS}
          currentTheme={currentTheme}
          darkThemes={darkThemes}
          lightThemes={lightThemes}
          onSelect={handleSelect}
          anchorRef={ref}
        />
      )}
    </div>
  )
}

function ThemeDropdown({ COLORS, currentTheme, darkThemes, lightThemes, onSelect, anchorRef }: {
  COLORS: ThemeColors
  currentTheme: Theme
  darkThemes: Theme[]
  lightThemes: Theme[]
  onSelect: (t: Theme) => void
  anchorRef: RefObject<HTMLDivElement | null>
}) {
  const [pos, setPos] = useState({ top: 60, right: 20 })

  useEffect(() => {
    const el = anchorRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    setPos({ top: rect.bottom + 6, right: window.innerWidth - rect.right })
  }, [anchorRef])

  return (
    <div
      style={{
        position:   'fixed',
        zIndex:     200,
        top:        pos.top,
        right:      pos.right,
        minWidth:   210,
        maxHeight:  400,
        overflowY:  'auto',
        borderRadius: 6,
        border:     `1px solid ${COLORS.border}`,
        background: COLORS.surface,
        boxShadow:  `0 8px 32px ${COLORS.bg}cc`,
        fontFamily: 'var(--ui-font)',
      }}
    >
      <SectionLabel label="Dark" COLORS={COLORS} />
      {darkThemes.map(t => (
        <ThemeRow key={t.id} theme={t} isCurrent={t.id === currentTheme.id} onSelect={() => onSelect(t)} COLORS={COLORS} />
      ))}
      {lightThemes.length > 0 && <SectionLabel label="Light" COLORS={COLORS} top />}
      {lightThemes.length > 0 && lightThemes.map(t => (
        <ThemeRow key={t.id} theme={t} isCurrent={t.id === currentTheme.id} onSelect={() => onSelect(t)} COLORS={COLORS} />
      ))}
    </div>
  )
}

function SectionLabel({ label, COLORS, top = false }: { label: string; COLORS: ThemeColors; top?: boolean }) {
  return (
    <div style={{
      padding:      '5px 12px',
      fontSize:     9,
      letterSpacing: '0.18em',
      textTransform: 'uppercase',
      color:        COLORS.muted,
      borderTop:    top ? `1px solid ${COLORS.border}` : 'none',
      borderBottom: `1px solid ${COLORS.border}`,
    }}>
      {label}
    </div>
  )
}

function ThemeRow({ theme, isCurrent, onSelect, COLORS }: {
  theme: Theme; isCurrent: boolean; onSelect: () => void; COLORS: ThemeColors
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      style={{
        display:      'flex',
        width:        '100%',
        alignItems:   'center',
        gap:          10,
        padding:      '8px 12px',
        border:       'none',
        borderBottom: `1px solid ${COLORS.border}33`,
        background:   isCurrent ? `${theme.colors.accent}22` : 'transparent',
        cursor:       'pointer',
        fontFamily:   'var(--ui-font)',
        textAlign:    'left',
        color:        COLORS.text,
      }}
    >
      <span style={{ fontSize: 11, width: 16, textAlign: 'center', flexShrink: 0 }}>
        {theme.isDark ? '🌙' : '☀️'}
      </span>
      <span style={{
        width: 14, height: 14, borderRadius: 3, flexShrink: 0,
        background: theme.colors.accent,
        border: `1px solid ${theme.colors.accent}66`,
      }} />
      <span style={{
        flex: 1, fontSize: 12,
        color:      isCurrent ? theme.colors.accent : COLORS.text,
        fontWeight: isCurrent ? 600 : 400,
      }}>
        {theme.name}
      </span>
      {isCurrent && <span style={{ fontSize: 11, color: theme.colors.accent }}>✓</span>}
    </button>
  )
}
