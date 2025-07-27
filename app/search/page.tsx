'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import SearchInterface from '@/app/components/SearchInterface'
import SearchResults from '@/app/components/SearchResults'
import SearchFilters from '@/app/components/SearchFilters'
import Header from '@/app/components/Header'
import { Album } from '@/lib/types'
import { Filter, X } from 'lucide-react'

interface SearchFilters {
  genres?: string[]
  yearMin?: number
  yearMax?: number
  vibes?: string[]
}

interface SearchResponse {
  results: (Album & { _searchScore?: number })[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
  query: string
  filters?: SearchFilters
}

export default function SearchPage() {
  const searchParams = useSearchParams()
  const router = useRouter()

  const [query, setQuery] = useState(searchParams.get('q') || '')
  const [results, setResults] = useState<(Album & { _searchScore?: number })[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [filters, setFilters] = useState<SearchFilters>({})
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  })
  const [sortBy, setSortBy] = useState('year')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [showMobileFilters, setShowMobileFilters] = useState(false)

  // Debounced search function
  const performSearch = useCallback(async (
    searchQuery: string,
    searchFilters: SearchFilters = {},
    page: number = 1,
    sort: string = 'year',
    order: 'asc' | 'desc' = 'desc'
  ) => {
    if (!searchQuery.trim() && Object.keys(searchFilters).length === 0) {
      setResults([])
      setPagination({ page: 1, limit: 20, total: 0, totalPages: 0 })
      return
    }

    setIsLoading(true)

    try {
      const params = new URLSearchParams()
      if (searchQuery.trim()) params.set('q', searchQuery.trim())
      if (Object.keys(searchFilters).length > 0) {
        params.set('filters', JSON.stringify(searchFilters))
      }
      params.set('page', page.toString())
      params.set('limit', '20')
      params.set('sortBy', sort)
      params.set('sortOrder', order)

      const searchUrl = `/api/search?${params.toString()}`
      console.log('Fetching:', searchUrl)

      const response = await fetch(searchUrl)
      
      if (response.ok) {
        const data: SearchResponse = await response.json()
        console.log('Search response:', data)
        setResults(data.results)
        setPagination(data.pagination)
      } else {
        console.error('Search failed:', response.status, response.statusText)
        const errorText = await response.text()
        console.error('Error details:', errorText)
        setResults([])
        setPagination({ page: 1, limit: 20, total: 0, totalPages: 0 })
      }
    } catch (error) {
      console.error('Search error:', error)
      setResults([])
      setPagination({ page: 1, limit: 20, total: 0, totalPages: 0 })
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Update URL when search parameters change
  const updateURL = useCallback((searchQuery: string, searchFilters: SearchFilters, page: number = 1) => {
    const params = new URLSearchParams()
    if (searchQuery.trim()) params.set('q', searchQuery.trim())
    if (page > 1) params.set('page', page.toString())
    if (Object.keys(searchFilters).length > 0) {
      params.set('filters', JSON.stringify(searchFilters))
    }

    const newURL = `/search${params.toString() ? `?${params.toString()}` : ''}`
    router.replace(newURL)
  }, [router])

  // Handle search input change
  const handleSearch = useCallback((searchQuery: string) => {
    setQuery(searchQuery)
    setPagination(prev => ({ ...prev, page: 1 }))
    updateURL(searchQuery, filters, 1)
    performSearch(searchQuery, filters, 1, sortBy, sortOrder)
  }, [filters, sortBy, sortOrder, updateURL, performSearch])

  // Handle filter changes
  const handleFiltersChange = useCallback((newFilters: SearchFilters) => {
    setFilters(newFilters)
    setPagination(prev => ({ ...prev, page: 1 }))
    updateURL(query, newFilters, 1)
    performSearch(query, newFilters, 1, sortBy, sortOrder)
  }, [query, sortBy, sortOrder, updateURL, performSearch])

  // Handle pagination
  const handlePageChange = useCallback((page: number) => {
    setPagination(prev => ({ ...prev, page }))
    updateURL(query, filters, page)
    performSearch(query, filters, page, sortBy, sortOrder)
    
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [query, filters, sortBy, sortOrder, updateURL, performSearch])

  // Handle sort changes
  const handleSortChange = useCallback((newSortBy: string, newSortOrder: 'asc' | 'desc') => {
    setSortBy(newSortBy)
    setSortOrder(newSortOrder)
    setPagination(prev => ({ ...prev, page: 1 }))
    performSearch(query, filters, 1, newSortBy, newSortOrder)
  }, [query, filters, performSearch])

  // Load initial search from URL parameters
  useEffect(() => {
    const urlQuery = searchParams.get('q') || ''
    const urlPage = parseInt(searchParams.get('page') || '1')
    const urlFilters = searchParams.get('filters')

    let parsedFilters: SearchFilters = {}
    if (urlFilters) {
      try {
        parsedFilters = JSON.parse(urlFilters)
      } catch (e) {
        console.error('Error parsing URL filters:', e)
      }
    }

    setQuery(urlQuery)
    setFilters(parsedFilters)
    setPagination(prev => ({ ...prev, page: urlPage }))

    if (urlQuery || Object.keys(parsedFilters).length > 0) {
      performSearch(urlQuery, parsedFilters, urlPage, sortBy, sortOrder)
    }
  }, [performSearch, sortBy, sortOrder, searchParams]) // Dependencies added

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950">
      <Header />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-6">Search Albums</h1>
          <SearchInterface
            initialQuery={query}
            onSearch={handleSearch}
            placeholder="Search by album, artist, genre..."
            showSuggestions={true}
            className="max-w-2xl"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Desktop Filters Sidebar */}
          <div className="hidden lg:block lg:col-span-1">
            <div className="sticky top-8">
              <SearchFilters
                filters={filters}
                onFiltersChange={handleFiltersChange}
              />
            </div>
          </div>

          {/* Mobile Filter Toggle */}
          <div className="lg:hidden mb-4">
            <button
              onClick={() => setShowMobileFilters(!showMobileFilters)}
              className="flex items-center space-x-2 px-4 py-2 bg-zinc-800/50 border border-zinc-700/50 rounded-lg text-zinc-300 hover:text-white hover:bg-zinc-700/50 transition-colors duration-200"
            >
              <Filter className="w-4 h-4" />
              <span>Filters</span>
              {Object.keys(filters).length > 0 && (
                <span className="px-2 py-1 bg-blue-500 text-white text-xs rounded-full">
                  {Object.keys(filters).length}
                </span>
              )}
            </button>
          </div>

          {/* Mobile Filters Modal */}
          {showMobileFilters && (
            <div className="lg:hidden fixed inset-0 z-50 bg-black/50 backdrop-blur-sm">
              <div className="absolute right-0 top-0 h-full w-full max-w-sm bg-zinc-900 border-l border-zinc-800">
                <div className="flex items-center justify-between p-4 border-b border-zinc-800">
                  <h3 className="text-lg font-semibold text-white">Filters</h3>
                  <button
                    onClick={() => setShowMobileFilters(false)}
                    className="p-2 text-zinc-400 hover:text-white transition-colors duration-200"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="p-4 overflow-y-auto h-full pb-20">
                  <SearchFilters
                    filters={filters}
                    onFiltersChange={(newFilters) => {
                      handleFiltersChange(newFilters)
                      setShowMobileFilters(false)
                    }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Search Results */}
          <div className="lg:col-span-2">
            <SearchResults
              results={results}
              query={query}
              isLoading={isLoading}
              pagination={pagination}
              onPageChange={handlePageChange}
              onSortChange={handleSortChange}
              sortBy={sortBy}
              sortOrder={sortOrder}
            />
          </div>
        </div>
      </div>
    </div>
  )
}