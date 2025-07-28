'use client'

import { useState, useEffect } from 'react'
import { Album } from '@/lib/types'
import AlbumBattleCard from './AlbumBattleCard'
import { Zap, RotateCcw, TrendingUp, Brain, Music } from 'lucide-react'

interface BattleChoice {
  round: number
  chosenAlbum: Album
  rejectedAlbum: Album
  timestamp: Date
}

interface PreferenceInsight {
  category: string
  value: string
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
  const [gameStarted, setGameStarted] = useState(false)
  const [isTransitioning, setIsTransitioning] = useState(false)

  // Load initial album pair
  useEffect(() => {
    if (gameStarted && !albumPair) {
      loadNextBattle()
    }
  }, [gameStarted, albumPair])

  const loadNextBattle = async () => {
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
  }

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
      setIsTransitioning(false)
    }, 2000)
  }

  const resetGame = () => {
    setBattleHistory([])
    setInsights([])
    setRound(1)
    setAlbumPair(null)
    setChosenAlbum(null)
    setGameStarted(false)
    setIsTransitioning(false)
  }

  const startGame = () => {
    setGameStarted(true)
  }

  if (!gameStarted) {
    return (
      <div className={`flex flex-col items-center justify-center min-h-[600px] text-center space-y-8 ${className}`}>
        <div className="space-y-4">
          <div className="w-20 h-20 mx-auto bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
            <Zap className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-white">Discover Your Music Taste</h2>
          <p className="text-xl text-zinc-300 max-w-2xl">
            Choose between pairs of albums from your collection. 
            I'll learn your preferences and help you discover hidden gems!
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl">
          <div className="bg-zinc-900/50 backdrop-blur-sm rounded-xl p-6 border border-zinc-800/50">
            <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center mb-4">
              <Music className="w-6 h-6 text-green-400" />
            </div>
            <h3 className="font-semibold text-white mb-2">Listen & Compare</h3>
            <p className="text-zinc-400 text-sm">
              Preview albums on your favorite streaming platforms before choosing
            </p>
          </div>

          <div className="bg-zinc-900/50 backdrop-blur-sm rounded-xl p-6 border border-zinc-800/50">
            <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center mb-4">
              <Brain className="w-6 h-6 text-purple-400" />
            </div>
            <h3 className="font-semibold text-white mb-2">AI Learning</h3>
            <p className="text-zinc-400 text-sm">
              Each choice teaches me about your taste in genres, eras, and vibes
            </p>
          </div>

          <div className="bg-zinc-900/50 backdrop-blur-sm rounded-xl p-6 border border-zinc-800/50">
            <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center mb-4">
              <TrendingUp className="w-6 h-6 text-blue-400" />
            </div>
            <h3 className="font-semibold text-white mb-2">Get Smarter</h3>
            <p className="text-zinc-400 text-sm">
              Recommendations improve with every round as I understand you better
            </p>
          </div>
        </div>

        <button
          onClick={startGame}
          className="px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold text-lg rounded-xl hover:from-blue-400 hover:to-purple-500 transition-all duration-300 transform hover:scale-105 shadow-lg"
        >
          Start Music Battle
        </button>
      </div>
    )
  }

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
          {/* Header */}
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center space-x-4">
              <h2 className="text-2xl font-bold text-white">Round {round}</h2>
              <button
                onClick={resetGame}
                className="p-2 text-zinc-400 hover:text-white transition-colors duration-200"
                title="Reset game"
              >
                <RotateCcw className="w-5 h-5" />
              </button>
            </div>
            <p className="text-zinc-300">
              Choose the album you prefer. Listen to previews first!
            </p>
          </div>

          {/* Battle Arena */}
          <div className="relative">
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

          {/* Mobile Insights Panel */}
          {insights.length > 0 && (
            <div className="lg:hidden">
              <div className="bg-zinc-900/50 backdrop-blur-sm rounded-xl p-6 border border-zinc-800/50">
                <div className="flex items-center space-x-3 mb-4">
                  <Brain className="w-5 h-5 text-purple-400" />
                  <h3 className="font-semibold text-white">What I've Learned About Your Taste</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {insights.map((insight, index) => (
                    <div key={index} className="bg-zinc-800/50 rounded-lg p-4">
                      <h4 className="font-medium text-zinc-300 mb-1">{insight.category}</h4>
                      <p className="text-white">{insight.value}</p>
                      <div className="mt-2 w-full bg-zinc-700 rounded-full h-2">
                        <div 
                          className="bg-purple-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${insight.confidence * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Battle History Grid */}
          {battleHistory.length > 0 && (
            <div className="max-w-4xl mx-auto">
              <div className="bg-zinc-900/30 backdrop-blur-sm rounded-xl p-6 border border-zinc-800/30">
                <h3 className="font-semibold text-white mb-6 flex items-center space-x-2">
                  <TrendingUp className="w-5 h-5 text-blue-400" />
                  <span>Your Choices ({battleHistory.length} rounds)</span>
                </h3>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4">
                  {battleHistory.slice(-16).reverse().map((choice, index) => (
                    <div key={choice.round} className="group">
                      <div className="relative aspect-square rounded-lg overflow-hidden mb-2">
                        {choice.chosenAlbum.cover_art_url ? (
                          <img
                            src={choice.chosenAlbum.cover_art_url}
                            alt={choice.chosenAlbum.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
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

        {/* Desktop Sidebar */}
        <div className="hidden lg:block w-80 space-y-6">
          {/* Insights Panel */}
          <div className="bg-zinc-900/50 backdrop-blur-sm rounded-xl p-4 border border-zinc-800/50">
            <div className="flex items-center space-x-2 mb-4">
              <Brain className="w-4 h-4 text-purple-400" />
              <h3 className="font-semibold text-white text-sm">Your Music Taste</h3>
            </div>
            
            {insights.length > 0 ? (
              <div className="space-y-3">
                {insights.map((insight, index) => (
                  <div key={index} className="bg-zinc-800/50 rounded-lg p-3">
                    <h4 className="font-medium text-zinc-300 mb-1 text-sm">{insight.category}</h4>
                    <p className="text-white text-sm">{insight.value}</p>
                    <div className="mt-2 w-full bg-zinc-700 rounded-full h-1.5">
                      <div 
                        className="bg-purple-500 h-1.5 rounded-full transition-all duration-300"
                        style={{ width: `${insight.confidence * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="w-16 h-16 mx-auto mb-4 bg-zinc-800/50 rounded-full flex items-center justify-center">
                  <Brain className="w-6 h-6 text-zinc-500" />
                </div>
                <h4 className="font-medium text-zinc-300 mb-2 text-sm">Learning Your Taste</h4>
                <p className="text-zinc-400 text-xs leading-relaxed">
                  {round === 1 
                    ? "Make your first choice to start discovering your music preferences!"
                    : "Keep choosing albums - insights will appear as I learn your taste patterns."
                  }
                </p>
                <div className="mt-4 flex items-center justify-center space-x-1">
                  <div className="w-1.5 h-1.5 bg-purple-500/50 rounded-full animate-pulse" />
                  <div className="w-1.5 h-1.5 bg-purple-500/50 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }} />
                  <div className="w-1.5 h-1.5 bg-purple-500/50 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }} />
                </div>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  )
}