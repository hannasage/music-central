'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { Search, Menu, X, Disc3, Sparkles, LogOut, Plus } from 'lucide-react'
import { createClientSideClient } from '@/lib/supabase-client'
import { useRouter } from 'next/navigation'
import RandomButton from '../ui/buttons/RandomButton'
import { useAddAlbumModal } from '@/app/contexts/AddAlbumModalContext'
import type { User } from '@supabase/supabase-js'

export default function Header() {
  const [isSearchFocused, setIsSearchFocused] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [user, setUser] = useState<User | null>(null)
  const supabase = createClientSideClient()
  const router = useRouter()
  const { openModal } = useAddAlbumModal()

  useEffect(() => {
    // Get initial session
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setUser(session?.user ?? null)
    }

    getSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null)
      }
    )

    return () => subscription.unsubscribe()
  }, [supabase.auth])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      // Navigate to search results
      window.location.href = `/search?q=${encodeURIComponent(searchQuery.trim())}`
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/admin/login')
    router.refresh()
  }


  return (
    <header className="sticky top-0 z-50 bg-zinc-950/80 backdrop-blur-md border-b border-zinc-800/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link 
            href="/" 
            className="flex items-center space-x-2 text-white hover:text-blue-400 transition-colors duration-200"
          >
            <Disc3 className="w-8 h-8" />
            <span className="font-bold text-xl hidden md:block">Music Central</span>
            <span className="font-bold text-xl md:hidden">MC</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link 
              href="/" 
              className="text-zinc-300 hover:text-white transition-colors duration-200"
            >
              Home
            </Link>
            <Link 
              href="/albums" 
              className="text-zinc-300 hover:text-white transition-colors duration-200"
            >
              Albums
            </Link>
            <Link 
              href="/recommendations" 
              className="text-zinc-300 hover:text-white transition-colors duration-200 flex items-center space-x-1"
            >
              <Sparkles className="w-4 h-4" />
              <span>AI Curator</span>
            </Link>
          </nav>

          {/* Search Bar & Actions */}
          <div className="flex items-center space-x-4">
            <form onSubmit={handleSearch} className="relative">
              <div className={`flex items-center space-x-2 transition-all duration-300 ${
                isSearchFocused ? 'w-64 md:w-80' : 'w-40 sm:w-48 md:w-64'
              }`}>
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-zinc-400" />
                  <input
                    type="text"
                    placeholder="Search albums, artists..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onFocus={() => setIsSearchFocused(true)}
                    onBlur={() => setIsSearchFocused(false)}
                    className="w-full pl-10 pr-4 py-2 bg-zinc-800/50 border border-zinc-700/50 rounded-lg text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-200"
                  />
                </div>
              </div>
            </form>

            {/* Add Album Button - Desktop Only (when authenticated) */}
            {user && (
              <button
                onClick={openModal}
                className="hidden md:flex items-center space-x-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all duration-200"
                title="Add Album"
              >
                <Plus className="w-4 h-4" />
                <span>Add Album</span>
              </button>
            )}

            {/* Random Button - Desktop Only */}
            <div className="hidden md:block">
              <RandomButton />
            </div>

            {/* Admin Logout Button - Only show when authenticated */}
            {user && (
              <button
                onClick={handleLogout}
                className="hidden md:flex items-center space-x-2 px-3 py-2 text-zinc-300 hover:text-white hover:bg-zinc-800/50 rounded-lg transition-all duration-200"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 text-zinc-300 hover:text-white transition-colors duration-200"
            >
              {isMobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>

          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-zinc-800/50 py-4 space-y-2">
            <Link 
              href="/"
              onClick={() => setIsMobileMenuOpen(false)}
              className="block px-4 py-2 text-zinc-300 hover:text-white hover:bg-zinc-800/50 rounded-lg transition-all duration-200"
            >
              Home
            </Link>
            <Link 
              href="/albums"
              onClick={() => setIsMobileMenuOpen(false)}
              className="block px-4 py-2 text-zinc-300 hover:text-white hover:bg-zinc-800/50 rounded-lg transition-all duration-200"
            >
              Albums
            </Link>
            <Link 
              href="/recommendations"
              onClick={() => setIsMobileMenuOpen(false)}
              className="flex items-center space-x-2 px-4 py-2 text-zinc-300 hover:text-white hover:bg-zinc-800/50 rounded-lg transition-all duration-200"
            >
              <Sparkles className="w-4 h-4" />
              <span>AI Curator</span>
            </Link>

            {/* Mobile Add Album Button - Only show when authenticated */}
            {user && (
              <button
                onClick={() => {
                  openModal()
                  setIsMobileMenuOpen(false)
                }}
                className="flex items-center space-x-2 px-4 py-2 text-zinc-300 hover:text-white hover:bg-zinc-800/50 rounded-lg transition-all duration-200 w-full text-left"
              >
                <Plus className="w-4 h-4" />
                <span>Add Album</span>
              </button>
            )}
            
            {/* Mobile Random Button */}
            <div className="px-4 py-2">
              <RandomButton 
                variant="button" 
                className="w-full justify-center"
              />
            </div>

            {/* Mobile Logout Button - Only show when authenticated */}
            {user && (
              <button
                onClick={handleLogout}
                className="flex items-center justify-center space-x-2 mx-4 py-2 px-4 text-zinc-300 hover:text-white hover:bg-zinc-800/50 rounded-lg transition-all duration-200"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout (Admin)</span>
              </button>
            )}
          </div>
        )}

      </div>
    </header>
  )
}