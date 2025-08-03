'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Search, X, Clock, TrendingUp } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface SearchInterfaceProps {
  initialQuery?: string
  onSearch?: (query: string) => void
  placeholder?: string
  showSuggestions?: boolean
  className?: string
}


export default function SearchInterface({ 
  initialQuery = '', 
  onSearch,
  placeholder = "Search albums, artists, genres...",
  showSuggestions = true,
  className = ''
}: SearchInterfaceProps) {
  const [query, setQuery] = useState(initialQuery)
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [searchHistory, setSearchHistory] = useState<string[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  
  const inputRef = useRef<HTMLInputElement>(null)
  const suggestionsRef = useRef<HTMLDivElement>(null)
  const debounceRef = useRef<NodeJS.Timeout | null>(null)
  const router = useRouter()

  // Load search history from localStorage
  useEffect(() => {
    const history = localStorage.getItem('music-search-history')
    if (history) {
      try {
        setSearchHistory(JSON.parse(history))
      } catch (e) {
        console.error('Error loading search history:', e)
      }
    }
  }, [])

  // Fetch suggestions from API
  const fetchSuggestions = useCallback(async (searchTerm: string) => {
    if (searchTerm.length < 2) {
      setSuggestions([])
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: searchTerm })
      })
      
      if (response.ok) {
        const data = await response.json()
        setSuggestions(data.suggestions || [])
      }
    } catch (error) {
      console.error('Error fetching suggestions:', error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Debounced suggestion fetching
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }

    if (query.trim() && showSuggestions) {
      debounceRef.current = setTimeout(() => {
        fetchSuggestions(query.trim())
      }, 300)
    } else {
      setSuggestions([])
    }

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
    }
  }, [query, fetchSuggestions, showSuggestions])

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setQuery(value)
    setSelectedIndex(-1)
    
    if (value.trim()) {
      setIsOpen(true)
    } else {
      setIsOpen(false)
    }
  }

  // Handle search submission
  const handleSearch = (searchTerm: string = query) => {
    const trimmedQuery = searchTerm.trim()
    if (!trimmedQuery) return

    // Add to search history
    const newHistory = [trimmedQuery, ...searchHistory.filter(h => h !== trimmedQuery)].slice(0, 10)
    setSearchHistory(newHistory)
    localStorage.setItem('music-search-history', JSON.stringify(newHistory))

    setIsOpen(false)
    setSelectedIndex(-1)

    if (onSearch) {
      onSearch(trimmedQuery)
    } else {
      // Navigate to search results page
      router.push(`/search?q=${encodeURIComponent(trimmedQuery)}`)
    }
  }

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    handleSearch()
  }

  // Handle suggestion selection
  const handleSuggestionClick = (suggestion: string) => {
    setQuery(suggestion)
    handleSearch(suggestion)
  }

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) return

    const allSuggestions = [
      ...searchHistory.slice(0, 3),
      ...suggestions
    ]

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex(prev => 
          prev < allSuggestions.length - 1 ? prev + 1 : prev
        )
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex(prev => prev > -1 ? prev - 1 : -1)
        break
      case 'Enter':
        e.preventDefault()
        if (selectedIndex >= 0 && allSuggestions[selectedIndex]) {
          handleSuggestionClick(allSuggestions[selectedIndex])
        } else {
          handleSearch()
        }
        break
      case 'Escape':
        setIsOpen(false)
        setSelectedIndex(-1)
        inputRef.current?.blur()
        break
    }
  }

  // Clear search
  const clearSearch = () => {
    setQuery('')
    setIsOpen(false)
    setSelectedIndex(-1)
    inputRef.current?.focus()
  }

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        setSelectedIndex(-1)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const allSuggestions = [
    ...searchHistory.slice(0, 3),
    ...suggestions
  ]

  const hasContent = allSuggestions.length > 0

  return (
    <div className={`relative ${className}`}>
      <form onSubmit={handleSubmit} className="relative">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-zinc-400" />
          <input
            ref={inputRef}
            type="text"
            placeholder={placeholder}
            value={query}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onFocus={() => query.trim() && setIsOpen(true)}
            aria-label="Search albums, artists, and songs"
            aria-expanded={isOpen && showSuggestions && hasContent}
            aria-autocomplete="list"
            aria-owns={hasContent ? "search-suggestions" : undefined}
            aria-activedescendant={selectedIndex >= 0 ? `suggestion-${selectedIndex}` : undefined}
            role="combobox"
            className="w-full pl-12 pr-12 py-3 bg-zinc-800/50 border border-zinc-700/50 rounded-xl text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-200"
          />
          {query && (
            <button
              type="button"
              onClick={clearSearch}
              aria-label="Clear search"
              className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 text-zinc-400 hover:text-white transition-colors duration-200"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </form>

      {/* Suggestions Dropdown */}
      {isOpen && showSuggestions && hasContent && (
        <div
          ref={suggestionsRef}
          id="search-suggestions"
          role="listbox"
          aria-label="Search suggestions"
          className="absolute top-full left-0 right-0 mt-2 bg-zinc-900/95 backdrop-blur-sm border border-zinc-700/50 rounded-xl shadow-2xl z-50 max-h-80 overflow-y-auto"
        >
          {/* Search History */}
          {searchHistory.length > 0 && (
            <div className="p-2">
              <div className="px-3 py-2 text-xs font-medium text-zinc-400 uppercase tracking-wider">
                Recent Searches
              </div>
              {searchHistory.slice(0, 3).map((item, index) => (
                <button
                  key={`history-${index}`}
                  id={`suggestion-${index}`}
                  role="option"
                  aria-selected={selectedIndex === index}
                  onClick={() => handleSuggestionClick(item)}
                  className={`w-full flex items-center space-x-3 px-3 py-2 text-left text-zinc-300 hover:bg-zinc-800/50 rounded-lg transition-colors duration-200 ${
                    selectedIndex === index ? 'bg-zinc-800/50' : ''
                  }`}
                >
                  <Clock className="w-4 h-4 text-zinc-500" />
                  <span className="truncate">{item}</span>
                </button>
              ))}
            </div>
          )}

          {/* Suggestions */}
          {suggestions.length > 0 && (
            <div className="p-2 border-t border-zinc-800/50">
              <div className="px-3 py-2 text-xs font-medium text-zinc-400 uppercase tracking-wider">
                Suggestions
              </div>
              {suggestions.map((suggestion, index) => {
                const actualIndex = searchHistory.slice(0, 3).length + index
                return (
                  <button
                    key={`suggestion-${index}`}
                    id={`suggestion-${actualIndex}`}
                    role="option"
                    aria-selected={selectedIndex === actualIndex}
                    onClick={() => handleSuggestionClick(suggestion)}
                    className={`w-full flex items-center space-x-3 px-3 py-2 text-left text-zinc-300 hover:bg-zinc-800/50 rounded-lg transition-colors duration-200 ${
                      selectedIndex === actualIndex ? 'bg-zinc-800/50' : ''
                    }`}
                  >
                    <TrendingUp className="w-4 h-4 text-zinc-500" />
                    <span className="truncate">{suggestion}</span>
                  </button>
                )
              })}
            </div>
          )}

          {/* Loading State */}
          {isLoading && (
            <div className="p-4 text-center text-zinc-400">
              <div className="inline-flex items-center space-x-2">
                <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                <span>Loading suggestions...</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}