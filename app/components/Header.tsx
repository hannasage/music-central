'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Search, Shuffle, Menu, X, Disc3 } from 'lucide-react'

export default function Header() {
  const [isSearchFocused, setIsSearchFocused] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      // Navigate to search results
      window.location.href = `/search?q=${encodeURIComponent(searchQuery.trim())}`
    }
  }

  const handleRandomShuffle = () => {
    // Navigate to random album
    window.location.href = '/random'
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
            <span className="font-bold text-xl hidden sm:block">Music Central</span>
            <span className="font-bold text-xl sm:hidden">MC</span>
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
              className="text-zinc-300 hover:text-white transition-colors duration-200"
            >
              AI Curator
            </Link>
            <Link 
              href="/genres" 
              className="text-zinc-300 hover:text-white transition-colors duration-200"
            >
              Genres
            </Link>
            <Link 
              href="/artists" 
              className="text-zinc-300 hover:text-white transition-colors duration-200"
            >
              Artists
            </Link>
          </nav>

          {/* Search Bar & Actions */}
          <div className="flex items-center space-x-4">
            <form onSubmit={handleSearch} className="relative">
              <div className={`flex items-center space-x-2 transition-all duration-300 ${
                isSearchFocused ? 'w-80' : 'w-48 sm:w-64'
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

            {/* Random Shuffle Button - Desktop Only */}
            <button
              onClick={handleRandomShuffle}
              className="hidden md:block p-2 bg-zinc-800/50 hover:bg-zinc-700/50 border border-zinc-700/50 hover:border-zinc-600/50 rounded-lg text-zinc-300 hover:text-white transition-all duration-200 group"
              title="Random Album"
            >
              <Shuffle className="w-5 h-5 group-hover:rotate-12 transition-transform duration-200" />
            </button>

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
              className="block px-4 py-2 text-zinc-300 hover:text-white hover:bg-zinc-800/50 rounded-lg transition-all duration-200"
            >
              AI Curator
            </Link>
            <Link 
              href="/genres"
              onClick={() => setIsMobileMenuOpen(false)}
              className="block px-4 py-2 text-zinc-300 hover:text-white hover:bg-zinc-800/50 rounded-lg transition-all duration-200"
            >
              Genres
            </Link>
            <Link 
              href="/artists"
              onClick={() => setIsMobileMenuOpen(false)}
              className="block px-4 py-2 text-zinc-300 hover:text-white hover:bg-zinc-800/50 rounded-lg transition-all duration-200"
            >
              Artists
            </Link>
            
            {/* Mobile Shuffle Button */}
            <button
              onClick={() => {
                handleRandomShuffle()
                setIsMobileMenuOpen(false)
              }}
              className="flex items-center space-x-3 w-full px-4 py-2 text-zinc-300 hover:text-white hover:bg-zinc-800/50 rounded-lg transition-all duration-200 group"
            >
              <Shuffle className="w-5 h-5 group-hover:rotate-12 transition-transform duration-200" />
              <span>Random Album</span>
            </button>
          </div>
        )}
      </div>
    </header>
  )
}