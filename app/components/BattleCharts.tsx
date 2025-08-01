'use client'

import { BattleChoice } from '@/app/hooks/useBattleSession'
import { BarChart3, Music2, Palette } from 'lucide-react'

interface BattleChartsProps {
  battleHistory: BattleChoice[]
  className?: string
}

export default function BattleCharts({ battleHistory, className = '' }: BattleChartsProps) {
  if (battleHistory.length === 0) return null

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

  // Sort and get top entries
  const topGenres = Array.from(genreCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)

  const topVibes = Array.from(vibeCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)

  const maxGenreCount = Math.max(...topGenres.map(([, count]) => count))
  const maxVibeCount = Math.max(...topVibes.map(([, count]) => count))

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
            {topGenres.map(([genre, count]) => (
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
        </div>

        {/* Vibes Chart */}
        {topVibes.length > 0 && (
          <div>
            <h4 className="font-medium text-white mb-4 flex items-center space-x-2">
              <Palette className="w-4 h-4 text-purple-400" />
              <span>Top Vibes</span>
            </h4>
            <div className="space-y-3">
              {topVibes.map(([vibe, count]) => (
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