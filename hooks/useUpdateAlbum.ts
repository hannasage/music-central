'use client'

import { useState, useCallback } from 'react'
import { Album } from '@/lib/types'

interface UpdateAlbumData {
  genres?: string[]
  personal_vibes?: string[]
  thoughts?: string | null
}

interface UseUpdateAlbumReturn {
  updateAlbum: (albumId: string, updates: UpdateAlbumData) => Promise<Album | null>
  isUpdating: boolean
  error: string | null
  clearError: () => void
}

export function useUpdateAlbum(): UseUpdateAlbumReturn {
  const [isUpdating, setIsUpdating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  const updateAlbum = useCallback(async (albumId: string, updates: UpdateAlbumData): Promise<Album | null> => {
    setIsUpdating(true)
    setError(null)

    try {
      const response = await fetch(`/api/albums/${albumId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update album')
      }

      const result = await response.json()
      return result.album as Album
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update album'
      setError(errorMessage)
      console.error('Album update error:', err)
      return null
    } finally {
      setIsUpdating(false)
    }
  }, [])

  return {
    updateAlbum,
    isUpdating,
    error,
    clearError
  }
}