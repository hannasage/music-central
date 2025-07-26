'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Shuffle, Loader2, Sparkles } from 'lucide-react'
import { RandomSelectionService } from '@/lib/random-selection'

interface RandomButtonProps {
  className?: string
  variant?: 'icon' | 'button'
}

export default function RandomButton({ 
  className = '',
  variant = 'icon'
}: RandomButtonProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)
  const [justSelected, setJustSelected] = useState(false)
  const router = useRouter()


  const fetchAlbums = async () => {
    try {
      const response = await fetch('/api/albums')
      if (!response.ok) throw new Error('Failed to fetch albums')
      
      const data = await response.json()
      return data.albums || []
    } catch (error) {
      console.error('Error fetching albums:', error)
      return []
    }
  }

  const handleRandomSelection = async () => {
    if (isLoading) return

    setIsLoading(true)
    setIsAnimating(true)

    try {
      // Add a small delay for animation effect
      await new Promise(resolve => setTimeout(resolve, 300))

      const albums = await fetchAlbums()
      
      if (albums.length === 0) {
        console.warn('No albums available for random selection')
        return
      }

      // Use weighted selection to favor less popular albums
      const selectedAlbum = RandomSelectionService.selectRandomAlbum(albums, {
        avoidRecentSelections: true,
        favorLessPopular: true,
        sessionTrackingKey: 'random-button'
      })

      if (selectedAlbum) {
        setJustSelected(true)
        
        // Success animation then navigate
        setTimeout(() => {
          router.push(`/albums/${selectedAlbum.id}`)
        }, 400)
      }

    } catch (error) {
      console.error('Error selecting random album:', error)
    } finally {
      setTimeout(() => {
        setIsLoading(false)
        setIsAnimating(false)
        setJustSelected(false)
      }, 600)
    }
  }

  const getButtonContent = () => {
    if (variant === 'button') {
      return (
        <div className="flex items-center space-x-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg transition-colors duration-200 group">
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : justSelected ? (
            <Sparkles className="w-4 h-4 animate-pulse text-yellow-300" />
          ) : (
            <Shuffle className={`w-4 h-4 transition-transform duration-300 ${isAnimating ? 'rotate-180' : 'group-hover:rotate-12'}`} />
          )}
          <span className="text-sm font-medium">Random</span>
        </div>
      )
    }

    // Default icon variant
    return (
      <>
        {isLoading ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : justSelected ? (
          <Sparkles className="w-5 h-5 animate-pulse text-yellow-300" />
        ) : (
          <Shuffle className={`w-5 h-5 transition-transform duration-300 ${isAnimating ? 'rotate-180' : 'group-hover:rotate-12'}`} />
        )}
      </>
    )
  }

  const baseClasses = variant === 'button'
    ? 'inline-flex'
    : 'p-2 bg-zinc-800/50 hover:bg-zinc-700/50 border border-zinc-700/50 hover:border-zinc-600/50 rounded-lg text-zinc-300 hover:text-white transition-all duration-200 group'

  return (
    <button
      onClick={handleRandomSelection}
      disabled={isLoading}
      className={`${baseClasses} ${className} ${isLoading ? 'cursor-not-allowed opacity-75' : 'cursor-pointer'}`}
      title={variant === 'icon' ? 'Random Album' : 'Select Random Album'}
      aria-label="Select random album"
    >
      {getButtonContent()}
    </button>
  )
}

