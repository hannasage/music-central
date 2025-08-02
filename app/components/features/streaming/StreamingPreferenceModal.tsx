'use client'

import { useEffect } from 'react'
import { StreamingIcon, StreamingService } from '@/app/components/ui/icons/StreamingIcons'
import { useStreamingPreference } from '@/app/contexts/StreamingPreferenceContext'
import { X } from 'lucide-react'

const STREAMING_SERVICES: { 
  id: StreamingService
  name: string
  color: string
  hoverColor: string
}[] = [
  {
    id: 'spotify',
    name: 'Spotify',
    color: 'bg-green-500',
    hoverColor: 'hover:bg-green-400'
  },
  {
    id: 'apple_music',
    name: 'Apple Music',
    color: 'bg-gradient-to-r from-[#fa5a72] to-[#fa253e]',
    hoverColor: 'hover:from-[#fb6b7f] hover:to-[#fb3651]'
  },
  {
    id: 'youtube_music',
    name: 'YouTube Music',
    color: 'bg-red-500',
    hoverColor: 'hover:bg-red-400'
  }
]

export default function StreamingPreferenceModal() {
  const { isModalOpen, setPreferredService, hideModal } = useStreamingPreference()

  // Handle escape key to close modal
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isModalOpen) {
        hideModal()
      }
    }

    if (isModalOpen) {
      document.addEventListener('keydown', handleEscape)
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
    }
  }, [isModalOpen, hideModal])

  if (!isModalOpen) return null

  const handleServiceSelect = (service: StreamingService) => {
    setPreferredService(service)
  }

  const handleShowAll = () => {
    setPreferredService('all')
  }

  const handleBackdropClick = (event: React.MouseEvent) => {
    if (event.target === event.currentTarget) {
      hideModal()
    }
  }

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="streaming-modal-title"
    >
      <div className="relative w-full max-w-lg bg-zinc-900/95 backdrop-blur-sm border border-zinc-800/50 rounded-2xl shadow-2xl">
        {/* Close button */}
        <button
          onClick={hideModal}
          className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-white transition-colors duration-200 rounded-lg hover:bg-zinc-800/50"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-6">
          {/* Header */}
          <div className="text-center mb-6">
            <h2 id="streaming-modal-title" className="text-xl font-bold text-white mb-3">
              What&apos;s your streaming service of choice?
            </h2>
            <p className="text-zinc-400 text-sm leading-relaxed">
              We&apos;ll show you direct links to your preferred platform for a cleaner experience.
            </p>
          </div>

          {/* Service options */}
          <div className="space-y-3 mb-6">
            {STREAMING_SERVICES.map((service) => (
              <button
                key={service.id}
                onClick={() => handleServiceSelect(service.id)}
                className={`w-full p-4 rounded-lg border border-zinc-800/50 bg-zinc-800/30 hover:bg-zinc-800/50 transition-all duration-200 group`}
              >
                <div className="flex items-center space-x-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${service.color} group-hover:scale-105 transition-transform duration-200`}>
                    <StreamingIcon service={service.id} size="sm" className="text-white" />
                  </div>
                  <div className="flex-1 text-left">
                    <h3 className="text-base font-medium text-white group-hover:text-white transition-colors">
                      {service.name}
                    </h3>
                  </div>
                  <div className="text-zinc-500 group-hover:text-zinc-300 transition-colors">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* Alternative options */}
          <div className="border-t border-zinc-800/50 pt-4">
            <div className="flex flex-col gap-2 justify-center">
              <button
                onClick={handleShowAll}
                className="px-4 py-2 text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 rounded-lg transition-all duration-200 text-sm font-medium"
              >
                Show all services
              </button>
              <button
                onClick={hideModal}
                className="px-4 py-2 text-zinc-500 hover:text-zinc-400 hover:bg-zinc-800/50 rounded-lg transition-all duration-200 text-sm"
              >
                Skip for now
              </button>
            </div>
            <p className="text-center text-zinc-600 text-xs mt-3">
              You can change this anytime
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}