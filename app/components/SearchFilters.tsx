'use client'

import { useState, useEffect } from 'react'
import { Filter, X, RotateCcw, ChevronDown, ChevronUp } from 'lucide-react'

interface SearchFilters {
  genres?: string[]
  yearMin?: number
  yearMax?: number
  vibes?: string[]
  energyMin?: number
  energyMax?: number
  danceabilityMin?: number
  danceabilityMax?: number
  valenceMin?: number
  valenceMax?: number
}

interface SearchFiltersProps {
  filters: SearchFilters
  onFiltersChange: (filters: SearchFilters) => void
  availableGenres?: string[]
  availableVibes?: string[]
  className?: string
}

interface FilterSection {
  id: string
  title: string
  isOpen: boolean
}

export default function SearchFiltersComponent({
  filters,
  onFiltersChange,
  availableGenres = [],
  availableVibes = [],
  className = ''
}: SearchFiltersProps) {
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    genres: true,
    years: true,
    vibes: false,
    audioFeatures: false
  })

  // Common genres if none provided
  const defaultGenres = [
    'Rock', 'Pop', 'Hip Hop', 'Electronic', 'Jazz', 'Classical', 'Folk', 'Country',
    'R&B', 'Soul', 'Funk', 'Reggae', 'Blues', 'Punk', 'Metal', 'Alternative',
    'Indie', 'Ambient', 'House', 'Techno', 'Drum & Bass', 'Dubstep'
  ]

  const genres = availableGenres.length > 0 ? availableGenres : defaultGenres

  // Common vibes if none provided
  const defaultVibes = [
    'Chill', 'Energetic', 'Melancholic', 'Uplifting', 'Nostalgic', 'Romantic',
    'Party', 'Study', 'Workout', 'Road Trip', 'Late Night', 'Morning'
  ]

  const vibes = availableVibes.length > 0 ? availableVibes : defaultVibes

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

  // Handle audio feature range change
  const handleAudioFeatureChange = (
    field: 'energyMin' | 'energyMax' | 'danceabilityMin' | 'danceabilityMax' | 'valenceMin' | 'valenceMax',
    value: number
  ) => {
    onFiltersChange({
      ...filters,
      [field]: value / 100 // Convert percentage to decimal
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
    if (filters.energyMin !== undefined || filters.energyMax !== undefined) count++
    if (filters.danceabilityMin !== undefined || filters.danceabilityMax !== undefined) count++
    if (filters.valenceMin !== undefined || filters.valenceMax !== undefined) count++
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
              {genres.map((genre) => (
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
                    {genre}
                  </span>
                </label>
              ))}
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
              {vibes.map((vibe) => (
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
                    {vibe}
                  </span>
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Audio Features */}
        <div>
          <button
            onClick={() => toggleSection('audioFeatures')}
            className="flex items-center justify-between w-full mb-3 text-left"
          >
            <h4 className="font-medium text-zinc-300">Audio Features</h4>
            {openSections.audioFeatures ? (
              <ChevronUp className="w-4 h-4 text-zinc-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-zinc-400" />
            )}
          </button>
          
          {openSections.audioFeatures && (
            <div className="space-y-4">
              {/* Energy */}
              <div>
                <label className="flex items-center justify-between text-sm text-zinc-400 mb-2">
                  <span>Energy</span>
                  <span>
                    {Math.round((filters.energyMin || 0) * 100)}% - {Math.round((filters.energyMax || 1) * 100)}%
                  </span>
                </label>
                <div className="flex space-x-2">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={Math.round((filters.energyMin || 0) * 100)}
                    onChange={(e) => handleAudioFeatureChange('energyMin', parseInt(e.target.value))}
                    className="flex-1 h-2 bg-zinc-700 rounded-lg appearance-none cursor-pointer slider"
                  />
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={Math.round((filters.energyMax || 1) * 100)}
                    onChange={(e) => handleAudioFeatureChange('energyMax', parseInt(e.target.value))}
                    className="flex-1 h-2 bg-zinc-700 rounded-lg appearance-none cursor-pointer slider"
                  />
                </div>
              </div>

              {/* Danceability */}
              <div>
                <label className="flex items-center justify-between text-sm text-zinc-400 mb-2">
                  <span>Danceability</span>
                  <span>
                    {Math.round((filters.danceabilityMin || 0) * 100)}% - {Math.round((filters.danceabilityMax || 1) * 100)}%
                  </span>
                </label>
                <div className="flex space-x-2">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={Math.round((filters.danceabilityMin || 0) * 100)}
                    onChange={(e) => handleAudioFeatureChange('danceabilityMin', parseInt(e.target.value))}
                    className="flex-1 h-2 bg-zinc-700 rounded-lg appearance-none cursor-pointer slider"
                  />
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={Math.round((filters.danceabilityMax || 1) * 100)}
                    onChange={(e) => handleAudioFeatureChange('danceabilityMax', parseInt(e.target.value))}
                    className="flex-1 h-2 bg-zinc-700 rounded-lg appearance-none cursor-pointer slider"
                  />
                </div>
              </div>

              {/* Valence (Positivity) */}
              <div>
                <label className="flex items-center justify-between text-sm text-zinc-400 mb-2">
                  <span>Positivity</span>
                  <span>
                    {Math.round((filters.valenceMin || 0) * 100)}% - {Math.round((filters.valenceMax || 1) * 100)}%
                  </span>
                </label>
                <div className="flex space-x-2">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={Math.round((filters.valenceMin || 0) * 100)}
                    onChange={(e) => handleAudioFeatureChange('valenceMin', parseInt(e.target.value))}
                    className="flex-1 h-2 bg-zinc-700 rounded-lg appearance-none cursor-pointer slider"
                  />
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={Math.round((filters.valenceMax || 1) * 100)}
                    onChange={(e) => handleAudioFeatureChange('valenceMax', parseInt(e.target.value))}
                    className="flex-1 h-2 bg-zinc-700 rounded-lg appearance-none cursor-pointer slider"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}