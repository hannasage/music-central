'use client'

import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import { Album } from '@/lib/types'
import AlbumBattleCard from './AlbumBattleCard'
import MusicTastePanel from './MusicTastePanel'
import { TrendingUp, Music } from 'lucide-react'

interface BattleChoice {
  round: number
  chosenAlbum: Album
  rejectedAlbum: Album
  timestamp: Date
}

interface PreferenceInsight {
  summary: string
  confidence: number
}

interface AlbumBattleInterfaceProps {
  className?: string
}

export default function AlbumBattleInterface({ className = '' }: AlbumBattleInterfaceProps) {
  const [albumPair, setAlbumPair] = useState<[Album, Album] | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [chosenAlbum, setChosenAlbum] = useState<Album | null>(null)
  const [battleHistory, setBattleHistory] = useState<BattleChoice[]>([])
  const [insights, setInsights] = useState<PreferenceInsight[]>([])
  const [round, setRound] = useState(1)
  const [gameStarted] = useState(true)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [selectedMobileAlbum, setSelectedMobileAlbum] = useState<Album | null>(null)

  const loadNextBattle = useCallback(async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/album-battle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'get_pair',
          history: battleHistory,
          round
        })
      })

      if (!response.ok) throw new Error('Failed to load battle')
      
      const data = await response.json()
      setAlbumPair([data.album1, data.album2])
      
      if (data.insights) {
        setInsights(data.insights)
      }
    } catch (error) {
      console.error('Error loading battle:', error)
    } finally {
      setIsLoading(false)
    }
  }, [battleHistory, round])

  const handleChoice = async (chosenAlbum: Album) => {
    if (!albumPair || isTransitioning) return

    setChosenAlbum(chosenAlbum)
    setIsTransitioning(true)

    const rejectedAlbum = albumPair[0].id === chosenAlbum.id ? albumPair[1] : albumPair[0]
    
    const newChoice: BattleChoice = {
      round,
      chosenAlbum,
      rejectedAlbum,
      timestamp: new Date()
    }

    // Submit choice for analysis
    try {
      const response = await fetch('/api/album-battle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'submit_choice',
          choice: newChoice,
          history: [...battleHistory, newChoice]
        })
      })

      if (response.ok) {
        const data = await response.json()
        if (data.insights) {
          setInsights(data.insights)
        }
      }
    } catch (error) {
      console.error('Error submitting choice:', error)
    }

    // Update local state
    setBattleHistory(prev => [...prev, newChoice])
    
    // Wait for animation, then load next round
    setTimeout(() => {
      setRound(prev => prev + 1)
      setAlbumPair(null)
      setChosenAlbum(null)
      setSelectedMobileAlbum(null)
      setIsTransitioning(false)
    }, 2000)
  }

  // Handle mobile album selection (radio button behavior)
  const handleMobileSelection = (album: Album) => {
    setSelectedMobileAlbum(album)
  }

  // Handle mobile submission
  const handleMobileSubmit = () => {
    if (selectedMobileAlbum && !isTransitioning) {
      handleChoice(selectedMobileAlbum)
    }
  }


  // Load initial album pair
  useEffect(() => {
    if (gameStarted && !albumPair) {
      loadNextBattle()
    }
  }, [gameStarted, albumPair, loadNextBattle])


  if (isLoading || !albumPair) {
    return (
      <div className={`flex items-center justify-center min-h-[600px] ${className}`}>
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto" />
          <p className="text-zinc-300 text-lg">
            {round === 1 ? 'Selecting your first battle...' : 'Finding your next perfect match...'}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className={className}>
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Main Battle Area */}
        <div className="flex-1 space-y-8">

          {/* Battle Arena */}
          <div className="relative">
            {/* Desktop View - Side by side cards */}
            <div className="hidden md:block">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-4xl mx-auto">
                <AlbumBattleCard
                  album={albumPair[0]}
                  onChoose={() => handleChoice(albumPair[0])}
                  isChosen={chosenAlbum?.id === albumPair[0].id}
                  isDisabled={isTransitioning}
                  side="left"
                />
                
                <div className="flex items-center justify-center lg:hidden">
                  <div className="text-4xl font-bold text-zinc-600">VS</div>
                </div>

                <AlbumBattleCard
                  album={albumPair[1]}
                  onChoose={() => handleChoice(albumPair[1])}
                  isChosen={chosenAlbum?.id === albumPair[1].id}
                  isDisabled={isTransitioning}
                  side="right"
                />
              </div>

              {/* VS indicator for desktop */}
              <div className="hidden lg:block absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10">
                <div className="w-12 h-12 bg-zinc-800/90 backdrop-blur-sm rounded-full border-2 border-zinc-700/50 flex items-center justify-center">
                  <span className="text-lg font-bold text-zinc-300">VS</span>
                </div>
              </div>
            </div>

            {/* Mobile View - Horizontal cards with checkboxes */}
            <div className="md:hidden space-y-4">
              <div className="space-y-3">
                <AlbumBattleCard
                  album={albumPair[0]}
                  onChoose={() => handleMobileSelection(albumPair[0])}
                  isChosen={selectedMobileAlbum?.id === albumPair[0].id}
                  isDisabled={isTransitioning}
                  side="left"
                  mobile={true}
                />
                
                <AlbumBattleCard
                  album={albumPair[1]}
                  onChoose={() => handleMobileSelection(albumPair[1])}
                  isChosen={selectedMobileAlbum?.id === albumPair[1].id}
                  isDisabled={isTransitioning}
                  side="right"
                  mobile={true}
                />
              </div>

              {/* Submit Button */}
              {selectedMobileAlbum && (
                <button
                  onClick={handleMobileSubmit}
                  disabled={isTransitioning}
                  className="w-full py-4 bg-blue-500 hover:bg-blue-400 disabled:bg-zinc-700 disabled:opacity-50 text-white font-semibold rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2"
                >
                  <span>Submit Choice</span>
                </button>
              )}
            </div>
          </div>

          {/* Mobile Insights Panel */}
          <div className="lg:hidden">
            <MusicTastePanel insights={insights} round={round} />
          </div>

          {/* Battle History Grid */}
          {battleHistory.length > 0 && (
            <div className="max-w-4xl mx-auto">
              <div className="bg-zinc-900/30 backdrop-blur-sm rounded-xl p-6 border border-zinc-800/30">
                <h3 className="font-semibold text-white mb-6 flex items-center space-x-2">
                  <TrendingUp className="w-5 h-5 text-blue-400" />
                  <span>Your Choices ({battleHistory.length} rounds)</span>
                </h3>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4">
                  {battleHistory.slice(-16).reverse().map((choice) => (
                    <div key={choice.round} className="group">
                      <div className="relative aspect-square rounded-lg overflow-hidden mb-2">
                        {choice.chosenAlbum.cover_art_url ? (
                          <Image
                            src={choice.chosenAlbum.cover_art_url}
                            alt={choice.chosenAlbum.title}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-200"
                          />
                        ) : (
                          <div className="w-full h-full bg-zinc-700 flex items-center justify-center">
                            <Music className="w-6 h-6 text-zinc-500" />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                        <div className="absolute top-1 right-1 bg-blue-500/90 text-white text-xs font-semibold px-1.5 py-0.5 rounded">
                          {choice.round}
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-xs text-white font-medium line-clamp-1 mb-1">
                          {choice.chosenAlbum.title}
                        </div>
                        <div className="text-xs text-zinc-400 line-clamp-1">
                          {choice.chosenAlbum.artist}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar - Desktop only */}
        <div className="hidden lg:block w-80 space-y-6">
          <MusicTastePanel insights={insights} round={round} />
        </div>
      </div>
    </div>
  )
}