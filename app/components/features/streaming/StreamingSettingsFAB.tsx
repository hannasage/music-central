'use client'

import { useState, useRef, useEffect } from 'react'
import { Settings, Check } from 'lucide-react'
import { StreamingIcon, StreamingService } from '@/app/components/ui/icons/StreamingIcons'
import { useStreamingPreference } from '@/app/contexts/StreamingPreferenceContext'
import { FAB } from '@/app/components/shared/FloatingActionButtons'

const STREAMING_SERVICES: { 
  id: StreamingService
  name: string
  color: string
}[] = [
  {
    id: 'spotify',
    name: 'Spotify',
    color: 'bg-green-500 hover:bg-green-400'
  },
  {
    id: 'apple_music',
    name: 'Apple Music',
    color: 'bg-gradient-to-r from-[#fa5a72] to-[#fa253e] hover:from-[#fb6b7f] hover:to-[#fb3651]'
  },
  {
    id: 'youtube_music',
    name: 'YouTube Music',
    color: 'bg-red-500 hover:bg-red-400'
  }
]

export default function StreamingSettingsFAB() {
  const [isExpanded, setIsExpanded] = useState(false)
  const { preferredService, setPreferredService } = useStreamingPreference()
  const containerRef = useRef<HTMLDivElement>(null)

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsExpanded(false)
      }
    }

    if (isExpanded) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isExpanded])

  // Close on escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isExpanded) {
        setIsExpanded(false)
      }
    }

    if (isExpanded) {
      document.addEventListener('keydown', handleEscape)
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
    }
  }, [isExpanded])

  const handleServiceSelect = (service: StreamingService | 'all') => {
    setPreferredService(service)
    setIsExpanded(false)
  }

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded)
  }

  return (
    <div ref={containerRef} className="relative">
      {/* Expanded Options Panel */}
      {isExpanded && (
        <div className="absolute bottom-16 right-0 bg-zinc-900/95 backdrop-blur-sm border border-zinc-800/50 rounded-xl shadow-2xl p-3 min-w-[200px] animate-in slide-in-from-bottom-2 duration-200">
          <div className="space-y-2">
            {/* Header */}
            <div className="text-center mb-3">
              <h3 className="text-sm font-medium text-white">Streaming Service</h3>
              <p className="text-xs text-zinc-400">Choose your preferred platform</p>
            </div>

            {/* Service Options */}
            {STREAMING_SERVICES.map((service) => (
              <button
                key={service.id}
                onClick={() => handleServiceSelect(service.id)}
                className={`
                  w-full flex items-center space-x-3 p-2 rounded-lg transition-all duration-200
                  ${preferredService === service.id 
                    ? 'bg-zinc-800/80 border border-zinc-700' 
                    : 'hover:bg-zinc-800/50 border border-transparent'
                  }
                `}
              >
                <div className={`w-8 h-8 rounded-md flex items-center justify-center ${service.color}`}>
                  <StreamingIcon service={service.id} size="sm" className="text-white" />
                </div>
                <span className="flex-1 text-left text-sm text-white">{service.name}</span>
                {preferredService === service.id && (
                  <Check className="w-4 h-4 text-blue-400" />
                )}
              </button>
            ))}

            {/* Show All Option */}
            <button
              onClick={() => handleServiceSelect('all')}
              className={`
                w-full flex items-center space-x-3 p-2 rounded-lg transition-all duration-200
                ${preferredService === 'all' 
                  ? 'bg-zinc-800/80 border border-zinc-700' 
                  : 'hover:bg-zinc-800/50 border border-transparent'
                }
              `}
            >
              <div className="w-8 h-8 rounded-md bg-zinc-700 flex items-center justify-center">
                <Settings className="w-4 h-4 text-zinc-300" />
              </div>
              <span className="flex-1 text-left text-sm text-white">Show All</span>
              {preferredService === 'all' && (
                <Check className="w-4 h-4 text-blue-400" />
              )}
            </button>

            {/* YouTube Default Indicator */}
            {!preferredService && (
              <div className="text-center pt-2 border-t border-zinc-800/50">
                <p className="text-xs text-zinc-500">Currently using YouTube search as default</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Main FAB Button */}
      <FAB
        onClick={toggleExpanded}
        title="Streaming Settings"
        className={`
          ${isExpanded ? 'bg-zinc-700 hover:bg-zinc-600' : ''}
          transition-all duration-200
        `}
      >
        <Settings 
          className={`w-6 h-6 transition-transform duration-200 ${
            isExpanded ? 'rotate-180' : ''
          }`} 
        />
      </FAB>
    </div>
  )
}