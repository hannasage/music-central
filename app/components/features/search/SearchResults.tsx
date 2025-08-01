'use client'

import React from 'react'
import { Album } from '@/lib/types'
import AlbumCard from '../albums/AlbumCard'
import AlbumsControls from '../albums/AlbumsControls'
import { useViewMode } from '@/app/hooks/useViewMode'
import { Search, SortAsc, SortDesc, ChevronLeft, ChevronRight } from 'lucide-react'
import { LoadingWithText } from '@/app/components/ui'

interface SearchResultsProps {
  results: (Album & { _searchScore?: number })[]
  query: string
  isLoading?: boolean
  pagination?: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
  onPageChange?: (page: number) => void
  onSortChange?: (sortBy: string, sortOrder: 'asc' | 'desc') => void
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  className?: string
}

const SearchResults = React.memo(function SearchResults({
  results,
  query,
  isLoading = false,
  pagination,
  onPageChange,
  onSortChange,
  sortBy = 'year',
  sortOrder = 'desc',
  className = ''
}: SearchResultsProps) {
  const { viewMode, setViewMode } = useViewMode()

  // Highlight search terms in text
  const highlightText = (text: string, searchTerm: string): React.JSX.Element => {
    if (!searchTerm.trim()) return <span>{text}</span>

    const regex = new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi')
    const parts = text.split(regex)

    return (
      <span>
        {parts.map((part, index) =>
          regex.test(part) ? (
            <mark key={index} className="bg-yellow-400/30 text-yellow-200 px-1 rounded">
              {part}
            </mark>
          ) : (
            <span key={index}>{part}</span>
          )
        )}
      </span>
    )
  }

  // Handle sort change
  const handleSortChange = (newSortBy: string) => {
    const newSortOrder = sortBy === newSortBy && sortOrder === 'desc' ? 'asc' : 'desc'
    onSortChange?.(newSortBy, newSortOrder)
  }

  // Generate pagination buttons
  const generatePaginationButtons = () => {
    if (!pagination || pagination.totalPages <= 1) return []

    const buttons = []
    const { page, totalPages } = pagination
    const maxButtons = 7

    if (totalPages <= maxButtons) {
      for (let i = 1; i <= totalPages; i++) {
        buttons.push(i)
      }
    } else {
      if (page <= 4) {
        for (let i = 1; i <= 5; i++) buttons.push(i)
        buttons.push('...')
        buttons.push(totalPages)
      } else if (page >= totalPages - 3) {
        buttons.push(1)
        buttons.push('...')
        for (let i = totalPages - 4; i <= totalPages; i++) buttons.push(i)
      } else {
        buttons.push(1)
        buttons.push('...')
        for (let i = page - 1; i <= page + 1; i++) buttons.push(i)
        buttons.push('...')
        buttons.push(totalPages)
      }
    }

    return buttons
  }

  // Loading state
  if (isLoading) {
    return (
      <div className={`space-y-6 ${className}`}>
        <div className="flex items-center justify-center py-12">
          <LoadingWithText 
            text="Searching..." 
            size="lg"
            textClassName="text-zinc-400 text-lg"
          />
        </div>
      </div>
    )
  }

  // Empty state
  if (!results || results.length === 0) {
    return (
      <div className={`space-y-6 ${className}`}>
        <div className="text-center py-12 space-y-4">
          <div className="relative mx-auto w-24 h-24 rounded-full bg-zinc-800/50 flex items-center justify-center">
            <Search className="w-12 h-12 text-zinc-500" />
            <div className="absolute inset-0 rounded-full border-2 border-dashed border-zinc-600 animate-pulse" />
          </div>
          
          <div className="space-y-2">
            <h3 className="text-xl font-semibold text-white">
              {query ? `No results found for "${query}"` : 'Start your search'}
            </h3>
            <p className="text-zinc-400 max-w-md mx-auto">
              {query 
                ? "Try adjusting your search terms or filters to find what you're looking for."
                : "Search through our music collection by album, artist, or genre."
              }
            </p>
          </div>

          {query && (
            <div className="space-y-3">
              <p className="text-sm text-zinc-500">Try searching for:</p>
              <div className="flex flex-wrap justify-center gap-2">
                {['rock', 'jazz', 'electronic', 'indie', 'classical'].map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => window.location.href = `/search?q=${suggestion}`}
                    className="px-3 py-1 bg-zinc-800/50 text-zinc-400 rounded-full text-sm hover:bg-zinc-700/50 hover:text-zinc-300 transition-colors duration-200"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Results Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center space-x-4">
          <h2 className="text-xl font-semibold text-white">
            {pagination?.total ? (
              <>
                {pagination.total.toLocaleString()} result{pagination.total !== 1 ? 's' : ''}
                {query && (
                  <span className="text-zinc-400 font-normal">
                    {' '}for &quot;{highlightText(query, query)}&quot;
                  </span>
                )}
              </>
            ) : (
              'Search Results'
            )}
          </h2>
        </div>

        <div className="flex items-center space-x-3">
          {/* View Mode Toggle - Mobile Only */}
          <AlbumsControls
            viewMode={viewMode}
            onViewModeChange={setViewMode}
          />
          
          {/* Sort Options */}
          <div className="flex space-x-2">
            {['year', 'artist', 'title'].map((option) => (
              <button
                key={option}
                onClick={() => handleSortChange(option)}
                className={`flex items-center space-x-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
                  sortBy === option
                    ? 'bg-blue-500 text-white'
                    : 'bg-zinc-800/50 text-zinc-400 hover:text-white hover:bg-zinc-700/50'
                }`}
              >
                <span className="capitalize">{option}</span>
                {sortBy === option && (
                  sortOrder === 'desc' ? <SortDesc className="w-3 h-3" /> : <SortAsc className="w-3 h-3" />
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Results Grid/List */}
      {/* Desktop - Always Grid */}
      <div className="hidden md:grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {results.map((album) => (
          <AlbumCard
            key={album.id}
            album={album}
            size="medium"
            className="transform hover:scale-105 transition-transform duration-200"
          />
        ))}
      </div>

      {/* Mobile - Toggle between Grid and List */}
      <div className="md:hidden">
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {results.map((album) => (
              <AlbumCard
                key={album.id}
                album={album}
                size="small"
                className="transform hover:scale-105 transition-transform duration-200"
              />
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {results.map((album) => (
              <AlbumCard
                key={album.id}
                album={album}
                layout="horizontal"
                className="transform hover:scale-[1.01] transition-transform duration-200"
              />
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-center space-x-2 pt-8">
          <button
            onClick={() => onPageChange?.(pagination.page - 1)}
            disabled={pagination.page <= 1}
            className="flex items-center space-x-1 px-3 py-2 rounded-lg bg-zinc-800/50 text-zinc-400 hover:text-white hover:bg-zinc-700/50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Previous</span>
          </button>

          <div className="flex space-x-1">
            {generatePaginationButtons().map((button, index) => (
              button === '...' ? (
                <span key={index} className="px-3 py-2 text-zinc-500">
                  ...
                </span>
              ) : (
                <button
                  key={index}
                  onClick={() => onPageChange?.(button as number)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
                    pagination.page === button
                      ? 'bg-blue-500 text-white'
                      : 'bg-zinc-800/50 text-zinc-400 hover:text-white hover:bg-zinc-700/50'
                  }`}
                >
                  {button}
                </button>
              )
            ))}
          </div>

          <button
            onClick={() => onPageChange?.(pagination.page + 1)}
            disabled={pagination.page >= pagination.totalPages}
            className="flex items-center space-x-1 px-3 py-2 rounded-lg bg-zinc-800/50 text-zinc-400 hover:text-white hover:bg-zinc-700/50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
          >
            <span>Next</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  )
})

export default SearchResults