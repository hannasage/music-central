'use client'

import { Album } from '@/lib/types'
import { Lightbulb } from 'lucide-react'
import { useTheme } from '@/app/context/ThemeContext'

interface AboutThisPairProps {
  albumPair: [Album, Album]
  reasoning?: string
  className?: string
}

export default function AboutThisPair({ albumPair, reasoning, className = '' }: AboutThisPairProps) {
  const { theme } = useTheme()
  const iconColor = theme.planColors[1]?.value ?? 'var(--color-accent)'

  if (!albumPair || !reasoning) return null

  return (
    <div
      className={className}
      style={{
        background:   'var(--ui-surface)',
        border:       '1px solid var(--ui-border)',
        borderRadius: 'var(--ui-radius-lg)',
        padding:      '14px 16px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        <div style={{
          width: 30, height: 30, flexShrink: 0,
          borderRadius: 'var(--ui-radius-sm)',
          background: `color-mix(in srgb, ${iconColor} 15%, var(--ui-bg))`,
          border: `1px solid color-mix(in srgb, ${iconColor} 30%, var(--ui-border))`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Lightbulb size={14} style={{ color: iconColor }} />
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <h4 style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text)', fontFamily: 'var(--ui-font)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 6 }}>
            About This Pair
          </h4>
          <p style={{ fontSize: 13, color: 'var(--color-text-dim)', fontFamily: 'var(--ui-font)', lineHeight: 1.55, margin: 0 }}>
            {reasoning}
          </p>
        </div>
      </div>
    </div>
  )
}
