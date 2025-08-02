'use client'

import { useState, useEffect } from 'react'

type ViewMode = 'grid' | 'list'

const VIEW_MODE_STORAGE_KEY = 'music-central-view-mode'

export function useViewMode() {
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [isLoaded, setIsLoaded] = useState(false)

  // Load view mode from localStorage on mount
  useEffect(() => {
    const savedViewMode = localStorage.getItem(VIEW_MODE_STORAGE_KEY) as ViewMode
    if (savedViewMode && (savedViewMode === 'grid' || savedViewMode === 'list')) {
      setViewMode(savedViewMode)
    }
    setIsLoaded(true)
  }, [])

  // Save view mode to localStorage when it changes
  const updateViewMode = (newViewMode: ViewMode) => {
    setViewMode(newViewMode)
    localStorage.setItem(VIEW_MODE_STORAGE_KEY, newViewMode)
  }

  return {
    viewMode,
    setViewMode: updateViewMode,
    isLoaded
  }
}