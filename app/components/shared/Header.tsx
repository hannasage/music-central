'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { Search, Menu, X, Sparkles, LogOut, Plus } from 'lucide-react'
import { createClientSideClient } from '@/lib/supabase-client'
import { useRouter } from 'next/navigation'
import RandomButton from '../ui/buttons/RandomButton'
import { useAddAlbumModal } from '@/app/contexts/AddAlbumModalContext'
import ThemeSelector from './ThemeSelector'
import { useTheme } from '@/app/context/ThemeContext'
import type { User } from '@supabase/supabase-js'

export default function Header() {
  const [isSearchFocused, setIsSearchFocused] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [user, setUser] = useState<User | null>(null)
  const supabase = createClientSideClient()
  const router = useRouter()
  const { openModal } = useAddAlbumModal()
  const { colors: C } = useTheme()

  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setUser(session?.user ?? null)
    }
    getSession()
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null)
    })
    return () => subscription.unsubscribe()
  }, [supabase.auth])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) window.location.href = `/search?q=${encodeURIComponent(searchQuery.trim())}`
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/admin/login')
    router.refresh()
  }

  // 50/50 mix of text + muted ensures ≥4.5:1 contrast on all themes (passes WCAG AA)
  const navDefaultColor = `color-mix(in srgb, ${C.text} 50%, ${C.muted})`

  const navLinkStyle = {
    fontSize: 12,
    color: navDefaultColor,
    textDecoration: 'none',
    letterSpacing: '0.06em',
    transition: 'color 0.12s',
    fontFamily: 'var(--ui-font)',
    textTransform: 'uppercase' as const,
  }

  return (
    <header style={{
      position: 'sticky',
      top: 0,
      zIndex: 50,
      background: `${C.bg}cc`,
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
      borderBottom: `1px solid ${C.border}`,
    }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 56 }}>

          {/* Logo */}
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
            <span style={{ fontSize: 22, lineHeight: 1 }}>💿</span>
            <span style={{ fontFamily: 'var(--ui-font)', fontWeight: 600, fontSize: 14, color: C.text, letterSpacing: '0.04em' }} className="hidden md:inline">
              Music Central
            </span>
            <span style={{ fontFamily: 'var(--ui-font)', fontWeight: 600, fontSize: 14, color: C.text, letterSpacing: '0.04em' }} className="md:hidden">
              MC
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex" style={{ gap: 28 }}>
            {[
              { href: '/', label: 'Home' },
              { href: '/albums', label: 'Albums' },
            ].map(({ href, label }) => (
              <Link key={href} href={href} style={navLinkStyle}
                onMouseEnter={e => (e.currentTarget.style.color = C.accent)}
                onMouseLeave={e => (e.currentTarget.style.color = navDefaultColor)}
              >
                {label}
              </Link>
            ))}
            <Link href="/recommendations" style={{ ...navLinkStyle, display: 'inline-flex', alignItems: 'center', gap: 5 }}
              onMouseEnter={e => (e.currentTarget.style.color = C.accent)}
              onMouseLeave={e => (e.currentTarget.style.color = navDefaultColor)}
            >
              <Sparkles size={13} />
              AI Curator
            </Link>
          </nav>

          {/* Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {/* Search */}
            <form onSubmit={handleSearch}>
              <div style={{
                position: 'relative',
                width: isSearchFocused ? 280 : 180,
                transition: 'width 0.2s',
              }}>
                <Search size={13} style={{
                  position: 'absolute', left: 9, top: '50%',
                  transform: 'translateY(-50%)', color: C.muted, pointerEvents: 'none',
                }} />
                <input
                  type="text"
                  placeholder="Search albums, artists…"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  onFocus={() => setIsSearchFocused(true)}
                  onBlur={() => setIsSearchFocused(false)}
                  style={{
                    width: '100%',
                    paddingLeft: 28,
                    paddingRight: 10,
                    paddingTop: 6,
                    paddingBottom: 6,
                    fontSize: 12,
                    fontFamily: 'var(--ui-font)',
                    background: C.surface,
                    border: `1px solid ${isSearchFocused ? C.accent : C.border}`,
                    borderRadius: 4,
                    color: C.text,
                    outline: 'none',
                    transition: 'border-color 0.12s',
                  }}
                />
              </div>
            </form>

            {/* Theme switcher */}
            <div className="hidden md:block">
              <ThemeSelector />
            </div>

            {/* Add album */}
            {user && (
              <button
                onClick={openModal}
                className="hidden md:inline-flex"
                style={{
                  alignItems: 'center',
                  gap: 5,
                  padding: '5px 10px',
                  fontSize: 12,
                  fontFamily: 'var(--ui-font)',
                  background: C.accent,
                  color: C.textOnAccent,
                  border: 'none',
                  borderRadius: 4,
                  cursor: 'pointer',
                  transition: 'opacity 0.12s',
                }}
                onMouseEnter={e => (e.currentTarget.style.opacity = '0.85')}
                onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
              >
                <Plus size={13} />
                Add
              </button>
            )}

            {/* Random */}
            <div className="hidden md:block">
              <RandomButton />
            </div>

            {/* Logout */}
            {user && (
              <button
                onClick={handleLogout}
                className="hidden md:inline-flex"
                style={{
                  alignItems: 'center',
                  padding: '5px 8px',
                  background: 'transparent',
                  border: `1px solid ${C.border}`,
                  borderRadius: 4,
                  color: C.muted,
                  cursor: 'pointer',
                  transition: 'all 0.12s',
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = C.red; e.currentTarget.style.color = C.red }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.color = C.muted }}
                title="Logout"
              >
                <LogOut size={13} />
              </button>
            )}

            {/* Mobile menu toggle */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden"
              style={{ background: 'none', border: 'none', color: C.muted, cursor: 'pointer', padding: 4 }}
            >
              {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {isMobileMenuOpen && (
          <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 12, paddingBottom: 16 }}>
            {[
              { href: '/', label: 'Home' },
              { href: '/albums', label: 'Albums' },
              { href: '/recommendations', label: 'AI Curator' },
            ].map(({ href, label }) => (
              <Link key={href} href={href} onClick={() => setIsMobileMenuOpen(false)}
                style={{
                  display: 'block',
                  padding: '8px 4px',
                  fontSize: 13,
                  fontFamily: 'var(--ui-font)',
                  color: C.muted,
                  textDecoration: 'none',
                  borderBottom: `1px solid ${C.border}33`,
                }}
              >
                {label}
              </Link>
            ))}

            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0' }}>
              <ThemeSelector />
              <RandomButton variant="button" />
            </div>

            {user && (
              <>
                <button onClick={() => { openModal(); setIsMobileMenuOpen(false) }}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 0', width: '100%', background: 'none', border: 'none', color: C.muted, fontSize: 13, fontFamily: 'var(--ui-font)', cursor: 'pointer' }}
                >
                  <Plus size={13} /> Add Album
                </button>
                <button onClick={handleLogout}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 0', background: 'none', border: 'none', color: C.red, fontSize: 13, fontFamily: 'var(--ui-font)', cursor: 'pointer' }}
                >
                  <LogOut size={13} /> Logout
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </header>
  )
}
