'use client'

import { useState, useEffect, useRef } from 'react'
import { BattleChoice } from '@/app/hooks/useBattleSession'
import { BarChart3, Music2, Palette, ChevronDown, ChevronUp } from 'lucide-react'

interface CuratorChartsProps {
  battleHistory: BattleChoice[]
  className?: string
}

export default function CuratorCharts({ battleHistory, className = '' }: CuratorChartsProps) {
  if (battleHistory.length === 0) return null

  // State for expanding/collapsing charts
  const [showAllGenres, setShowAllGenres] = useState(false)
  const [showAllVibes, setShowAllVibes] = useState(false)
  
  // Constants for limiting displayed items
  const INITIAL_DISPLAY_COUNT = 3

  // Extract chosen albums
  const chosenAlbums = battleHistory.map(choice => choice.chosenAlbum)

  // Count genres
  const genreCounts = new Map<string, number>()
  chosenAlbums.forEach(album => {
    album.genres.forEach(genre => {
      genreCounts.set(genre, (genreCounts.get(genre) || 0) + 1)
    })
  })

  // Count vibes
  const vibeCounts = new Map<string, number>()
  chosenAlbums.forEach(album => {
    if (album.personal_vibes) {
      album.personal_vibes.forEach(vibe => {
        vibeCounts.set(vibe, (vibeCounts.get(vibe) || 0) + 1)
      })
    }
  })

  // Sort entries (get all, not just top 6)
  const allGenres = Array.from(genreCounts.entries())
    .sort((a, b) => b[1] - a[1])

  const allVibes = Array.from(vibeCounts.entries())
    .sort((a, b) => b[1] - a[1])

  // Get displayed entries (limited or all)
  const displayedGenres = showAllGenres ? allGenres : allGenres.slice(0, INITIAL_DISPLAY_COUNT)
  const displayedVibes = showAllVibes ? allVibes : allVibes.slice(0, INITIAL_DISPLAY_COUNT)

  const maxGenreCount = allGenres.length > 0 ? Math.max(...allGenres.map(([, count]) => count)) : 0
  const maxVibeCount = allVibes.length > 0 ? Math.max(...allVibes.map(([, count]) => count)) : 0

  // Animated Collapsible component
  const AnimatedCollapsible = ({ 
    isOpen, 
    children 
  }: { 
    isOpen: boolean
    children: React.ReactNode 
  }) => {
    const contentRef = useRef<HTMLDivElement>(null)
    const [height, setHeight] = useState<number | undefined>(undefined)

    useEffect(() => {
      if (!contentRef.current) return

      const resizeObserver = new ResizeObserver(() => {
        if (contentRef.current) {
          setHeight(contentRef.current.scrollHeight)
        }
      })

      resizeObserver.observe(contentRef.current)
      return () => resizeObserver.disconnect()
    }, [])

    useEffect(() => {
      if (contentRef.current) {
        setHeight(contentRef.current.scrollHeight)
      }
    }, [children])

    return (
      <div
        style={{
          height: isOpen ? height : 0,
          overflow: 'hidden',
          transition: 'height 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
        }}
      >
        <div ref={contentRef}>
          {children}
        </div>
      </div>
    )
  }

  return (
    <div className={`bg-zinc-900/30 backdrop-blur-sm rounded-xl p-6 border border-zinc-800/30 ${className}`}>
      <h3 className="font-semibold text-white mb-6 flex items-center space-x-2">
        <BarChart3 className="w-5 h-5 text-green-400" />
        <span>Your Music Data ({battleHistory.length} choices)</span>
      </h3>

      <div className="space-y-8">
        {/* Genres Chart */}
        <div>
          <h4 className="font-medium text-white mb-4 flex items-center space-x-2">
            <Music2 className="w-4 h-4 text-blue-400" />
            <span>Top Genres</span>
          </h4>
          <div className="space-y-3">
            {displayedGenres.map(([genre, count]) => (
              <div key={genre} className="flex items-center space-x-3">
                <div className="w-32 text-sm text-zinc-300 truncate" title={genre}>
                  {genre}
                </div>
                <div className="flex-1 bg-zinc-800 rounded-full h-2 overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-blue-500 to-blue-400 rounded-full transition-all duration-1000 ease-out"
                    style={{ width: `${(count / maxGenreCount) * 100}%` }}
                  />
                </div>
                <div className="w-8 text-sm text-zinc-400 text-right">
                  {count}
                </div>
              </div>
            ))}
            
            {/* Expandable additional genres */}
            {allGenres.length > INITIAL_DISPLAY_COUNT && (
              <AnimatedCollapsible isOpen={showAllGenres}>
                <div className="space-y-3 pt-3">
                  {allGenres.slice(INITIAL_DISPLAY_COUNT).map(([genre, count]) => (
                    <div key={genre} className="flex items-center space-x-3">
                      <div className="w-32 text-sm text-zinc-300 truncate" title={genre}>
                        {genre}
                      </div>
                      <div className="flex-1 bg-zinc-800 rounded-full h-2 overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-blue-500 to-blue-400 rounded-full transition-all duration-1000 ease-out"
                          style={{ width: `${(count / maxGenreCount) * 100}%` }}
                        />
                      </div>
                      <div className="w-8 text-sm text-zinc-400 text-right">
                        {count}
                      </div>
                    </div>
                  ))}
                </div>
              </AnimatedCollapsible>
            )}
          </div>
          
          {/* See All / Show Less button for genres */}
          {allGenres.length > INITIAL_DISPLAY_COUNT && (
            <button
              onClick={() => setShowAllGenres(!showAllGenres)}
              className="w-full text-center py-3 mt-3 text-sm text-blue-400 hover:text-blue-300 transition-colors duration-200 border-t border-zinc-800/50 pt-3"
            >
              {showAllGenres ? (
                <span className="flex items-center justify-center space-x-1">
                  <span>Show less</span>
                  <ChevronUp className="w-3 h-3" />
                </span>
              ) : (
                <span className="flex items-center justify-center space-x-1">
                  <span>See all {allGenres.length} genres</span>
                  <ChevronDown className="w-3 h-3" />
                </span>
              )}
            </button>
          )}
        </div>

        {/* Vibes Chart */}
        {allVibes.length > 0 && (
          <div>
            <h4 className="font-medium text-white mb-4 flex items-center space-x-2">
              <Palette className="w-4 h-4 text-purple-400" />
              <span>Top Vibes</span>
            </h4>
            <div className="space-y-3">
              {displayedVibes.map(([vibe, count]) => (
                <div key={vibe} className="flex items-center space-x-3">
                  <div className="w-32 text-sm text-zinc-300 truncate" title={vibe}>
                    {vibe}
                  </div>
                  <div className="flex-1 bg-zinc-800 rounded-full h-2 overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-purple-500 to-purple-400 rounded-full transition-all duration-1000 ease-out"
                      style={{ width: `${(count / maxVibeCount) * 100}%` }}
                    />
                  </div>
                  <div className="w-8 text-sm text-zinc-400 text-right">
                    {count}
                  </div>
                </div>
              ))}
              
              {/* Expandable additional vibes */}
              {allVibes.length > INITIAL_DISPLAY_COUNT && (
                <AnimatedCollapsible isOpen={showAllVibes}>
                  <div className="space-y-3 pt-3">
                    {allVibes.slice(INITIAL_DISPLAY_COUNT).map(([vibe, count]) => (
                      <div key={vibe} className="flex items-center space-x-3">
                        <div className="w-32 text-sm text-zinc-300 truncate" title={vibe}>
                          {vibe}
                        </div>
                        <div className="flex-1 bg-zinc-800 rounded-full h-2 overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-purple-500 to-purple-400 rounded-full transition-all duration-1000 ease-out"
                            style={{ width: `${(count / maxVibeCount) * 100}%` }}
                          />
                        </div>
                        <div className="w-8 text-sm text-zinc-400 text-right">
                          {count}
                        </div>
                      </div>
                    ))}
                  </div>
                </AnimatedCollapsible>
              )}
            </div>
            
            {/* See All / Show Less button for vibes */}
            {allVibes.length > INITIAL_DISPLAY_COUNT && (
              <button
                onClick={() => setShowAllVibes(!showAllVibes)}
                className="w-full text-center py-3 mt-3 text-sm text-purple-400 hover:text-purple-300 transition-colors duration-200 border-t border-zinc-800/50 pt-3"
              >
                {showAllVibes ? (
                  <span className="flex items-center justify-center space-x-1">
                    <span>Show less</span>
                    <ChevronUp className="w-3 h-3" />
                  </span>
                ) : (
                  <span className="flex items-center justify-center space-x-1">
                    <span>See all {allVibes.length} vibes</span>
                    <ChevronDown className="w-3 h-3" />
                  </span>
                )}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Quick Stats */}
      <div className="mt-6 pt-4 border-t border-zinc-800/50">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
          <div>
            <div className="text-lg font-semibold text-white">{battleHistory.length}</div>
            <div className="text-xs text-zinc-400">Total Choices</div>
          </div>
          <div>
            <div className="text-lg font-semibold text-white">{genreCounts.size}</div>
            <div className="text-xs text-zinc-400">Unique Genres</div>
          </div>
          <div>
            <div className="text-lg font-semibold text-white">{vibeCounts.size}</div>
            <div className="text-xs text-zinc-400">Unique Vibes</div>
          </div>
          <div>
            <div className="text-lg font-semibold text-white">
              {new Set(chosenAlbums.map(album => album.artist)).size}
            </div>
            <div className="text-xs text-zinc-400">Unique Artists</div>
          </div>
        </div>
      </div>
    </div>
  )
}