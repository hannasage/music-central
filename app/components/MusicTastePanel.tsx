'use client'

import { Brain, Zap, Music, TrendingUp } from 'lucide-react'

interface PreferenceInsight {
  summary: string
  confidence: number
}

interface MusicTastePanelProps {
  insights: PreferenceInsight[]
  round: number
  className?: string
}

export default function MusicTastePanel({ insights, round, className = '' }: MusicTastePanelProps) {
  return (
    <div className={`bg-zinc-900/50 backdrop-blur-sm rounded-xl p-4 border border-zinc-800/50 ${className}`}>
      <div className="flex items-center space-x-2 mb-4">
        <Brain className="w-4 h-4 text-purple-400" />
        <h3 className="font-semibold text-white text-sm">Your Music Taste</h3>
      </div>
      
      {insights.length > 0 ? (
        <div className="bg-zinc-800/50 rounded-lg p-4">
          <p className="text-white text-sm leading-relaxed">
            {insights[0].summary}
          </p>
        </div>
      ) : round === 1 ? (
        <div className="space-y-4">
          {/* Welcome message */}
          <div className="text-center mb-6">
            <div className="w-12 h-12 mx-auto mb-3 bg-gradient-to-br from-blue-500/20 to-purple-600/20 rounded-full flex items-center justify-center">
              <Zap className="w-6 h-6 text-blue-400" />
            </div>
            <h4 className="font-semibold text-white text-sm mb-2">Discover Your Music Taste</h4>
            <p className="text-zinc-400 text-xs leading-relaxed">
              Choose between albums and I&apos;ll learn your preferences!
            </p>
          </div>

          {/* How it works cards */}
          <div className="space-y-3">
            <div className="bg-zinc-800/30 rounded-lg p-3 border border-zinc-700/30">
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-green-500/20 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Music className="w-4 h-4 text-green-400" />
                </div>
                <div>
                  <h5 className="font-medium text-white text-xs mb-1">Listen & Compare</h5>
                  <p className="text-zinc-400 text-xs leading-relaxed">
                    Preview albums on streaming platforms before choosing
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-zinc-800/30 rounded-lg p-3 border border-zinc-700/30">
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-purple-500/20 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Brain className="w-4 h-4 text-purple-400" />
                </div>
                <div>
                  <h5 className="font-medium text-white text-xs mb-1">AI Learning</h5>
                  <p className="text-zinc-400 text-xs leading-relaxed">
                    Each choice teaches me about your taste in genres, eras, and vibes
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-zinc-800/30 rounded-lg p-3 border border-zinc-700/30">
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                  <TrendingUp className="w-4 h-4 text-blue-400" />
                </div>
                <div>
                  <h5 className="font-medium text-white text-xs mb-1">Get Smarter</h5>
                  <p className="text-zinc-400 text-xs leading-relaxed">
                    Recommendations improve as I understand you better
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-8">
          <div className="w-16 h-16 mx-auto mb-4 bg-zinc-800/50 rounded-full flex items-center justify-center">
            <Brain className="w-6 h-6 text-zinc-500" />
          </div>
          <h4 className="font-medium text-zinc-300 mb-2 text-sm">Learning Your Taste</h4>
          <p className="text-zinc-400 text-xs leading-relaxed">
            Keep choosing albums - insights will appear as I learn your taste patterns.
          </p>
          <div className="mt-4 flex items-center justify-center space-x-1">
            <div className="w-1.5 h-1.5 bg-purple-500/50 rounded-full animate-pulse" />
            <div className="w-1.5 h-1.5 bg-purple-500/50 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }} />
            <div className="w-1.5 h-1.5 bg-purple-500/50 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }} />
          </div>
        </div>
      )}
    </div>
  )
}