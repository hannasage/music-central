'use client'

import { useState, useEffect } from 'react'
import { Filter, RotateCcw, ChevronDown, ChevronUp } from 'lucide-react'
import { createClientSideClient } from '@/lib/supabase-client'

interface SearchFilters {
  genres?: string[]
  yearMin?: number
  yearMax?: number
  vibes?: string[]
}

interface SearchFiltersProps {
  filters: SearchFilters
  onFiltersChange: (filters: SearchFilters) => void
  className?: string
}

export default function SearchFiltersComponent({
  filters,
  onFiltersChange,
  className = ''
}: SearchFiltersProps) {
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    genres: true,
    years: true,
    vibes: false
  })
  
  const [availableGenres, setAvailableGenres] = useState<string[]>([])
  const [availableVibes, setAvailableVibes] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Fetch available genres and vibes from database
  useEffect(() => {
    const fetchFilterOptions = async () => {
      setIsLoading(true)
      const supabase = createClientSideClient()
      
      try {
        // Fetch all albums to get unique genres and vibes (only active albums)
        const { data: albums, error } = await supabase
          .from('albums')
          .select('genres, personal_vibes')
          .eq('removed', false)
        
        if (error) {
          console.error('Error fetching filter options:', error)
          return
        }

        // Extract unique genres
        const genreSet = new Set<string>()
        const vibeSet = new Set<string>()
        
        albums?.forEach(album => {
          // Add genres
          if (album.genres && Array.isArray(album.genres)) {
            album.genres.forEach((genre: string) => {
              if (genre?.trim()) {
                // Capitalize only the first letter
                const formatted = genre.trim().charAt(0).toUpperCase() + genre.trim().slice(1).toLowerCase()
                genreSet.add(formatted)
              }
            })
          }
          
          // Add personal vibes
          if (album.personal_vibes && Array.isArray(album.personal_vibes)) {
            album.personal_vibes.forEach((vibe: string) => {
              if (vibe?.trim()) {
                // Capitalize only the first letter
                const formatted = vibe.trim().charAt(0).toUpperCase() + vibe.trim().slice(1).toLowerCase()
                vibeSet.add(formatted)
              }
            })
          }
        })

        // Sort alphabetically
        setAvailableGenres(Array.from(genreSet).sort())
        setAvailableVibes(Array.from(vibeSet).sort())
        
      } catch (error) {
        console.error('Error fetching filter options:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchFilterOptions()
  }, [])

  // Toggle section
  const toggleSection = (sectionId: string) => {
    setOpenSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }))
  }

  // Handle genre selection
  const handleGenreChange = (genre: string) => {
    const currentGenres = filters.genres || []
    const newGenres = currentGenres.includes(genre)
      ? currentGenres.filter(g => g !== genre)
      : [...currentGenres, genre]
    
    onFiltersChange({
      ...filters,
      genres: newGenres.length > 0 ? newGenres : undefined
    })
  }

  // Handle vibe selection
  const handleVibeChange = (vibe: string) => {
    const currentVibes = filters.vibes || []
    const newVibes = currentVibes.includes(vibe)
      ? currentVibes.filter(v => v !== vibe)
      : [...currentVibes, vibe]
    
    onFiltersChange({
      ...filters,
      vibes: newVibes.length > 0 ? newVibes : undefined
    })
  }

  // Handle year range change
  const handleYearChange = (field: 'yearMin' | 'yearMax', value: number) => {
    onFiltersChange({
      ...filters,
      [field]: value
    })
  }

  // Reset all filters
  const resetFilters = () => {
    onFiltersChange({})
  }

  // Check if any filters are active
  const hasActiveFilters = Object.keys(filters).some(key => {
    const value = filters[key as keyof SearchFilters]
    return value !== undefined && (Array.isArray(value) ? value.length > 0 : true)
  })

  // Get active filter count
  const getActiveFilterCount = () => {
    let count = 0
    if (filters.genres?.length) count++
    if (filters.yearMin !== undefined || filters.yearMax !== undefined) count++
    if (filters.vibes?.length) count++
    return count
  }

  return (
    <div className={`bg-zinc-900/50 backdrop-blur-sm rounded-xl border border-zinc-800/50 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-zinc-800/50">
        <div className="flex items-center space-x-2">
          <Filter className="w-5 h-5 text-zinc-400" />
          <h3 className="font-semibold text-white">Filters</h3>
          {hasActiveFilters && (
            <span className="px-2 py-1 bg-blue-500 text-white text-xs rounded-full">
              {getActiveFilterCount()}
            </span>
          )}
        </div>
        {hasActiveFilters && (
          <button
            onClick={resetFilters}
            className="flex items-center space-x-1 text-sm text-zinc-400 hover:text-white transition-colors duration-200"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Reset</span>
          </button>
        )}
      </div>

      <div className="p-4 space-y-6">
        {/* Genres */}
        <div>
          <button
            onClick={() => toggleSection('genres')}
            className="flex items-center justify-between w-full mb-3 text-left"
          >
            <h4 className="font-medium text-zinc-300">Genres</h4>
            {openSections.genres ? (
              <ChevronUp className="w-4 h-4 text-zinc-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-zinc-400" />
            )}
          </button>
          
          {openSections.genres && (
            <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
              {isLoading ? (
                <div className="col-span-2 text-center py-4">
                  <div className="inline-flex items-center space-x-2 text-zinc-400">
                    <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                    <span className="text-sm">Loading genres...</span>
                  </div>
                </div>
              ) : availableGenres.length > 0 ? (
                availableGenres.map((genre) => (
                  <label
                    key={genre}
                    className="flex items-center space-x-2 cursor-pointer group"
                  >
                    <input
                      type="checkbox"
                      checked={filters.genres?.includes(genre) || false}
                      onChange={() => handleGenreChange(genre)}
                      className="w-4 h-4 text-blue-500 bg-zinc-800 border-zinc-600 rounded focus:ring-blue-500 focus:ring-2"
                    />
                    <span className="text-sm text-zinc-400 group-hover:text-zinc-300 transition-colors duration-200">
                      {genre.toLowerCase()}
                    </span>
                  </label>
                ))
              ) : (
                <div className="col-span-2 text-center py-4 text-sm text-zinc-500">
                  No genres found
                </div>
              )}
            </div>
          )}
        </div>

        {/* Year Range */}
        <div>
          <button
            onClick={() => toggleSection('years')}
            className="flex items-center justify-between w-full mb-3 text-left"
          >
            <h4 className="font-medium text-zinc-300">Release Year</h4>
            {openSections.years ? (
              <ChevronUp className="w-4 h-4 text-zinc-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-zinc-400" />
            )}
          </button>
          
          {openSections.years && (
            <div className="space-y-3">
              <div className="flex space-x-3">
                <div className="flex-1">
                  <label className="block text-xs text-zinc-500 mb-1">From</label>
                  <input
                    type="number"
                    min="1950"
                    max="2024"
                    placeholder="1950"
                    value={filters.yearMin || ''}
                    onChange={(e) => handleYearChange('yearMin', parseInt(e.target.value) || 1950)}
                    className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-xs text-zinc-500 mb-1">To</label>
                  <input
                    type="number"
                    min="1950"
                    max="2024"
                    placeholder="2024"
                    value={filters.yearMax || ''}
                    onChange={(e) => handleYearChange('yearMax', parseInt(e.target.value) || 2024)}
                    className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Personal Vibes */}
        <div>
          <button
            onClick={() => toggleSection('vibes')}
            className="flex items-center justify-between w-full mb-3 text-left"
          >
            <h4 className="font-medium text-zinc-300">Personal Vibes</h4>
            {openSections.vibes ? (
              <ChevronUp className="w-4 h-4 text-zinc-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-zinc-400" />
            )}
          </button>
          
          {openSections.vibes && (
            <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto">
              {isLoading ? (
                <div className="col-span-2 text-center py-4">
                  <div className="inline-flex items-center space-x-2 text-zinc-400">
                    <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                    <span className="text-sm">Loading vibes...</span>
                  </div>
                </div>
              ) : availableVibes.length > 0 ? (
                availableVibes.map((vibe) => (
                  <label
                    key={vibe}
                    className="flex items-center space-x-2 cursor-pointer group"
                  >
                    <input
                      type="checkbox"
                      checked={filters.vibes?.includes(vibe) || false}
                      onChange={() => handleVibeChange(vibe)}
                      className="w-4 h-4 text-blue-500 bg-zinc-800 border-zinc-600 rounded focus:ring-blue-500 focus:ring-2"
                    />
                    <span className="text-sm text-zinc-400 group-hover:text-zinc-300 transition-colors duration-200">
                      {vibe.toLowerCase()}
                    </span>
                  </label>
                ))
              ) : (
                <div className="col-span-2 text-center py-4 text-sm text-zinc-500">
                  No personal vibes found
                </div>
              )}
            </div>
          )}
        </div>

      </div>
    </div>
  )
}