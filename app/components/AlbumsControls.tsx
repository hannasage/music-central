'use client'

import { useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Grid3X3, 
  List, 
  ArrowUpDown,
  Calendar,
  Music,
  User
} from 'lucide-react'

interface AlbumsControlsProps {
  sortBy: string
  sortOrder: 'asc' | 'desc'
  viewMode: 'grid' | 'list'
  onViewModeChange: (mode: 'grid' | 'list') => void
}

export default function AlbumsControls({ 
  sortBy, 
  sortOrder, 
  viewMode, 
  onViewModeChange 
}: AlbumsControlsProps) {
  const router = useRouter()

  const updateURL = useCallback((newSortBy: string, newSortOrder: 'asc' | 'desc') => {
    const params = new URLSearchParams()
    if (newSortBy !== 'created_at') params.set('sort', newSortBy)
    if (newSortOrder !== 'desc') params.set('order', newSortOrder)

    const newURL = `/albums${params.toString() ? `?${params.toString()}` : ''}`
    router.push(newURL)
  }, [router])

  const handleSortChange = useCallback((newSortBy: string) => {
    const newOrder = newSortBy === sortBy && sortOrder === 'desc' ? 'asc' : 'desc'
    updateURL(newSortBy, newOrder)
  }, [sortBy, sortOrder, updateURL])

  const sortOptions = [
    { value: 'created_at', label: 'Recently Added', icon: Calendar },
    { value: 'title', label: 'Album Title', icon: Music },
    { value: 'artist', label: 'Artist Name', icon: User },
    { value: 'year', label: 'Release Year', icon: Calendar }
  ]

  return (
    <div className="flex items-center space-x-4 mt-4 sm:mt-0">
      {/* Sort Dropdown */}
      <div className="relative">
        <select
          value={sortBy}
          onChange={(e) => handleSortChange(e.target.value)}
          className="appearance-none bg-zinc-800/50 border border-zinc-700/50 rounded-lg px-4 py-2 pr-10 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          {sortOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <ArrowUpDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
      </div>

      {/* Sort Order Toggle */}
      <button
        onClick={() => handleSortChange(sortBy)}
        className="flex items-center space-x-2 px-3 py-2 bg-zinc-800/50 border border-zinc-700/50 rounded-lg text-zinc-300 hover:text-white hover:bg-zinc-700/50 transition-colors duration-200 text-sm"
        title={`Sort ${sortOrder === 'desc' ? 'ascending' : 'descending'}`}
      >
        <span>{sortOrder === 'desc' ? '↓' : '↑'}</span>
        <span className="hidden sm:inline">{sortOrder === 'desc' ? 'Desc' : 'Asc'}</span>
      </button>

      {/* View Mode Toggle */}
      <div className="flex items-center bg-zinc-800/50 border border-zinc-700/50 rounded-lg p-1">
        <button
          onClick={() => onViewModeChange('grid')}
          className={`p-2 rounded transition-colors duration-200 ${
            viewMode === 'grid'
              ? 'bg-blue-500 text-white'
              : 'text-zinc-400 hover:text-white'
          }`}
          title="Grid view"
        >
          <Grid3X3 className="w-4 h-4" />
        </button>
        <button
          onClick={() => onViewModeChange('list')}
          className={`p-2 rounded transition-colors duration-200 ${
            viewMode === 'list'
              ? 'bg-blue-500 text-white'
              : 'text-zinc-400 hover:text-white'
          }`}
          title="List view"
        >
          <List className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}