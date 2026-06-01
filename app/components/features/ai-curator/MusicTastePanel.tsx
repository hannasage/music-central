'use client'

import { useState } from 'react'
import { Brain, Zap, Music, TrendingUp, RotateCcw } from 'lucide-react'
import ConfirmationModal from '../../ui/feedback/ConfirmationModal'
import { useTheme } from '@/app/context/ThemeContext'

interface PreferenceInsight { summary: string; confidence: number }

interface MusicTastePanelProps {
  insights: PreferenceInsight[]
  round: number
  className?: string
  onStartOver?: () => void
}

export default function MusicTastePanel({ insights, round, className = '', onStartOver }: MusicTastePanelProps) {
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const { theme } = useTheme()
  const p = theme.planColors

  // Pick three distinct palette colors for the how-it-works icons
  const iconColors = [
    p[0]?.value  ?? 'var(--color-accent)',
    p[3]?.value  ?? 'var(--color-accent)',
    p[1]?.value  ?? 'var(--color-accent)',
  ]

  const HOW_IT_WORKS = [
    { icon: Music,       color: iconColors[0], title: 'Listen & Compare',  body: 'Preview albums on streaming platforms before choosing' },
    { icon: Brain,       color: iconColors[1], title: 'AI Learning',        body: 'Each choice teaches me about your taste in genres, eras, and vibes' },
    { icon: TrendingUp,  color: iconColors[2], title: 'Get Smarter',        body: 'Recommendations improve as I understand you better' },
  ]

  return (
    <div
      className={className}
      style={{
        background:   'var(--ui-surface)',
        border:       '1px solid var(--ui-border)',
        borderRadius: 'var(--ui-radius-lg)',
        padding:      16,
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <Brain size={14} style={{ color: 'var(--color-accent)', flexShrink: 0 }} />
          <h3 style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text)', fontFamily: 'var(--ui-font)', margin: 0 }}>
            Your Music Taste
          </h3>
        </div>
        {onStartOver && (
          <button
            onClick={() => setShowConfirmModal(true)}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 5,
              padding: '4px 8px', fontSize: 11, fontFamily: 'var(--ui-font)',
              color: 'var(--color-text-dim)', background: 'var(--ui-bg)',
              border: '1px solid var(--ui-border)', borderRadius: 'var(--ui-radius-sm)',
              cursor: 'pointer', transition: 'all 0.12s',
            }}
            title={round === 1 ? 'Get a new first pair' : 'Start Over (clears all saved progress)'}
          >
            <RotateCcw size={10} />
            <span>{round === 1 ? 'New First Pair' : 'Start Over'}</span>
          </button>
        )}
      </div>

      {/* Content */}
      {insights.length > 0 ? (
        <div style={{ background: 'var(--ui-bg)', borderRadius: 'var(--ui-radius-md)', padding: '12px 14px', border: '1px solid var(--ui-border)' }}>
          <p style={{ fontSize: 13, color: 'var(--color-text)', fontFamily: 'var(--ui-font)', lineHeight: 1.55, margin: 0 }}>
            {insights[0].summary}
          </p>
        </div>
      ) : round === 1 ? (
        <div>
          {/* Welcome */}
          <div style={{ textAlign: 'center', marginBottom: 16 }}>
            <div style={{
              width: 44, height: 44, margin: '0 auto 10px',
              borderRadius: '50%',
              background: `color-mix(in srgb, var(--color-accent) 15%, var(--ui-bg))`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Zap size={20} style={{ color: 'var(--color-accent)' }} />
            </div>
            <h4 style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text)', fontFamily: 'var(--ui-font)', marginBottom: 4 }}>
              Discover Your Music Taste
            </h4>
            <p style={{ fontSize: 11, color: 'var(--color-text-dim)', fontFamily: 'var(--ui-font)', lineHeight: 1.5 }}>
              Choose between albums and I&apos;ll learn your preferences!
            </p>
          </div>

          {/* How it works */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {HOW_IT_WORKS.map(({ icon: Icon, color, title, body }) => (
              <div
                key={title}
                style={{
                  display: 'flex', alignItems: 'flex-start', gap: 10, padding: 10,
                  background: 'var(--ui-bg)', borderRadius: 'var(--ui-radius-md)',
                  border: '1px solid var(--ui-border)',
                }}
              >
                <div style={{
                  width: 30, height: 30, flexShrink: 0,
                  borderRadius: 'var(--ui-radius-sm)',
                  background: `color-mix(in srgb, ${color} 15%, var(--ui-surface))`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Icon size={14} style={{ color }} />
                </div>
                <div>
                  <h5 style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text)', fontFamily: 'var(--ui-font)', marginBottom: 2 }}>{title}</h5>
                  <p style={{ fontSize: 11, color: 'var(--color-text-dim)', fontFamily: 'var(--ui-font)', lineHeight: 1.45 }}>{body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '24px 0' }}>
          <div style={{
            width: 44, height: 44, margin: '0 auto 12px',
            borderRadius: '50%', background: 'var(--ui-bg)', border: '1px solid var(--ui-border)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Brain size={18} style={{ color: 'var(--color-text-dim)' }} />
          </div>
          <h4 style={{ fontSize: 12, fontWeight: 500, color: 'var(--color-text)', fontFamily: 'var(--ui-font)', marginBottom: 6 }}>
            Learning Your Taste
          </h4>
          <p style={{ fontSize: 11, color: 'var(--color-text-dim)', fontFamily: 'var(--ui-font)', lineHeight: 1.5 }}>
            Keep choosing albums — insights will appear as I learn your patterns.
          </p>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, marginTop: 12 }}>
            {[0, 0.2, 0.4].map((delay, i) => (
              <span key={i} style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--color-accent)', opacity: 0.6, animation: 'pulse 1.5s ease-in-out infinite', animationDelay: `${delay}s` }} />
            ))}
          </div>
        </div>
      )}

      <ConfirmationModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={() => { setShowConfirmModal(false); onStartOver?.() }}
        title={round === 1 ? 'Get New First Pair?' : 'Start Over?'}
        message={round === 1
          ? 'This will give you a different starting album pair to choose from.'
          : 'This will permanently delete all your battle history, insights, and progress. This action cannot be undone.'}
        confirmText={round === 1 ? 'Get New Pair' : 'Yes, Start Over'}
        cancelText={round === 1 ? 'Keep Current Pair' : 'Keep My Progress'}
        isDangerous={round > 1}
      />
    </div>
  )
}
