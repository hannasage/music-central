'use client'

import { useState } from 'react'
import { SpotifyAudioFeatures } from '@/lib/types'
import { Info } from 'lucide-react'

interface AudioFeaturesProps {
  audioFeatures: SpotifyAudioFeatures
  className?: string
}

interface FeatureInfo {
  label: string
  description: string
  value: number
  displayValue: string
  color: string
}

export default function AudioFeatures({ audioFeatures, className = '' }: AudioFeaturesProps) {
  const [hoveredFeature, setHoveredFeature] = useState<string | null>(null)

  const formatTempo = (tempo: number) => `${Math.round(tempo)} BPM`
  const formatLoudness = (loudness: number) => `${loudness.toFixed(1)} dB`
  const formatPercentage = (value: number) => `${Math.round(value * 100)}%`
  const formatKey = (key: number) => {
    const keys = ['C', 'C♯', 'D', 'D♯', 'E', 'F', 'F♯', 'G', 'G♯', 'A', 'A♯', 'B']
    return keys[key] || 'Unknown'
  }
  const formatMode = (mode: number) => mode === 1 ? 'Major' : 'Minor'

  const features: FeatureInfo[] = [
    {
      label: 'Energy',
      description: 'Perceptual measure of intensity and power',
      value: audioFeatures.energy,
      displayValue: formatPercentage(audioFeatures.energy),
      color: 'from-red-500 to-orange-500'
    },
    {
      label: 'Danceability',
      description: 'How suitable a track is for dancing',
      value: audioFeatures.danceability,
      displayValue: formatPercentage(audioFeatures.danceability),
      color: 'from-purple-500 to-pink-500'
    },
    {
      label: 'Valence',
      description: 'Musical positiveness conveyed by a track',
      value: audioFeatures.valence,
      displayValue: formatPercentage(audioFeatures.valence),
      color: 'from-yellow-500 to-green-500'
    },
    {
      label: 'Acousticness',
      description: 'Confidence measure of whether the track is acoustic',
      value: audioFeatures.acousticness,
      displayValue: formatPercentage(audioFeatures.acousticness),
      color: 'from-green-500 to-teal-500'
    },
    {
      label: 'Instrumentalness',
      description: 'Predicts whether a track contains no vocals',
      value: audioFeatures.instrumentalness,
      displayValue: formatPercentage(audioFeatures.instrumentalness),
      color: 'from-blue-500 to-indigo-500'
    },
    {
      label: 'Liveness',
      description: 'Detects the presence of an audience in the recording',
      value: audioFeatures.liveness,
      displayValue: formatPercentage(audioFeatures.liveness),
      color: 'from-indigo-500 to-purple-500'
    },
    {
      label: 'Speechiness',
      description: 'Detects the presence of spoken words in a track',
      value: audioFeatures.speechiness,
      displayValue: formatPercentage(audioFeatures.speechiness),
      color: 'from-pink-500 to-red-500'
    }
  ]

  const technicalFeatures = [
    {
      label: 'Tempo',
      value: formatTempo(audioFeatures.tempo),
      description: 'Overall estimated tempo in beats per minute'
    },
    {
      label: 'Key',
      value: formatKey(audioFeatures.key),
      description: 'The key the track is in'
    },
    {
      label: 'Mode',
      value: formatMode(audioFeatures.mode),
      description: 'Modality (major or minor) of a track'
    },
    {
      label: 'Loudness',
      value: formatLoudness(audioFeatures.loudness),
      description: 'Overall loudness of a track in decibels'
    },
    {
      label: 'Time Signature',
      value: `${audioFeatures.time_signature}/4`,
      description: 'Estimated time signature'
    }
  ]

  return (
    <div className={`space-y-6 ${className}`}>
      <div className="flex items-center space-x-2">
        <h3 className="text-lg font-semibold text-white">Audio Features</h3>
        <Info className="w-4 h-4 text-zinc-400" />
      </div>

      {/* Main Features with Progress Bars */}
      <div className="space-y-4">
        {features.map((feature) => (
          <div
            key={feature.label}
            className="relative"
            onMouseEnter={() => setHoveredFeature(feature.label)}
            onMouseLeave={() => setHoveredFeature(null)}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-zinc-300">{feature.label}</span>
              <span className="text-sm text-zinc-400">{feature.displayValue}</span>
            </div>
            
            <div className="relative h-2 bg-zinc-800 rounded-full overflow-hidden">
              <div
                className={`h-full bg-gradient-to-r ${feature.color} transition-all duration-500 ease-out`}
                style={{ width: `${feature.value * 100}%` }}
              />
            </div>
            
            {/* Tooltip */}
            {hoveredFeature === feature.label && (
              <div className="absolute z-10 bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-xs text-zinc-300 whitespace-nowrap shadow-lg">
                {feature.description}
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-zinc-900" />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Technical Details Grid */}
      <div className="border-t border-zinc-800 pt-6">
        <h4 className="text-md font-medium text-zinc-300 mb-4">Technical Details</h4>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {technicalFeatures.map((tech) => (
            <div
              key={tech.label}
              className="bg-zinc-900/50 backdrop-blur-sm rounded-lg p-3 border border-zinc-800/50 hover:border-zinc-700/50 transition-colors duration-200 group"
              title={tech.description}
            >
              <div className="text-xs text-zinc-400 mb-1">{tech.label}</div>
              <div className="text-sm font-medium text-white group-hover:text-blue-400 transition-colors duration-200">
                {tech.value}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Overall Vibe Indicator */}
      <div className="bg-gradient-to-r from-zinc-900/50 to-zinc-800/50 backdrop-blur-sm rounded-lg p-4 border border-zinc-800/50">
        <h4 className="text-md font-medium text-zinc-300 mb-3">Overall Vibe</h4>
        <div className="flex flex-wrap gap-2">
          {audioFeatures.energy > 0.7 && (
            <span className="px-2 py-1 bg-red-500/20 text-red-400 rounded-full text-xs border border-red-500/30">
              High Energy
            </span>
          )}
          {audioFeatures.danceability > 0.7 && (
            <span className="px-2 py-1 bg-purple-500/20 text-purple-400 rounded-full text-xs border border-purple-500/30">
              Danceable
            </span>
          )}
          {audioFeatures.valence > 0.7 && (
            <span className="px-2 py-1 bg-yellow-500/20 text-yellow-400 rounded-full text-xs border border-yellow-500/30">
              Upbeat
            </span>
          )}
          {audioFeatures.valence < 0.3 && (
            <span className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded-full text-xs border border-blue-500/30">
              Melancholic
            </span>
          )}
          {audioFeatures.acousticness > 0.7 && (
            <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded-full text-xs border border-green-500/30">
              Acoustic
            </span>
          )}
          {audioFeatures.instrumentalness > 0.5 && (
            <span className="px-2 py-1 bg-indigo-500/20 text-indigo-400 rounded-full text-xs border border-indigo-500/30">
              Instrumental
            </span>
          )}
          {audioFeatures.liveness > 0.8 && (
            <span className="px-2 py-1 bg-orange-500/20 text-orange-400 rounded-full text-xs border border-orange-500/30">
              Live Recording
            </span>
          )}
        </div>
      </div>
    </div>
  )
}