'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { StreamingService } from '@/app/components/ui/icons/StreamingIcons'

type PreferenceValue = StreamingService | 'all' | null

interface StreamingPreferenceContextType {
  preferredService: PreferenceValue
  setPreferredService: (service: StreamingService | 'all') => void
  hasSeenModal: boolean
  showModal: () => void
  hideModal: () => void
  isModalOpen: boolean
}

const StreamingPreferenceContext = createContext<StreamingPreferenceContextType | undefined>(undefined)

const STORAGE_KEYS = {
  PREFERENCE: 'streaming_preference',
  HAS_SEEN_MODAL: 'has_seen_streaming_modal'
}

interface StreamingPreferenceProviderProps {
  children: ReactNode
}

export function StreamingPreferenceProvider({ children }: StreamingPreferenceProviderProps) {
  const [preferredService, setPreferredServiceState] = useState<PreferenceValue>(null)
  const [hasSeenModal, setHasSeenModal] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isLoaded, setIsLoaded] = useState(false)

  // Load preferences from localStorage on mount
  useEffect(() => {
    try {
      const savedPreference = localStorage.getItem(STORAGE_KEYS.PREFERENCE) as PreferenceValue
      const savedHasSeenModal = localStorage.getItem(STORAGE_KEYS.HAS_SEEN_MODAL) === 'true'
      
      setPreferredServiceState(savedPreference)
      setHasSeenModal(savedHasSeenModal)
      
      // Show modal if user hasn't seen it and no preference is set
      if (!savedHasSeenModal && !savedPreference) {
        setIsModalOpen(true)
      }
    } catch (error) {
      console.error('Failed to load streaming preferences from localStorage:', error)
    } finally {
      setIsLoaded(true)
    }
  }, [])

  const setPreferredService = (service: StreamingService | 'all') => {
    try {
      setPreferredServiceState(service)
      localStorage.setItem(STORAGE_KEYS.PREFERENCE, service)
      
      // Mark that user has seen the modal
      if (!hasSeenModal) {
        setHasSeenModal(true)
        localStorage.setItem(STORAGE_KEYS.HAS_SEEN_MODAL, 'true')
      }
      
      // Close modal after selection
      setIsModalOpen(false)
    } catch (error) {
      console.error('Failed to save streaming preference to localStorage:', error)
    }
  }

  const showModal = () => {
    setIsModalOpen(true)
  }

  const hideModal = () => {
    setIsModalOpen(false)
    // Mark as seen even if no preference was selected
    if (!hasSeenModal) {
      try {
        setHasSeenModal(true)
        localStorage.setItem(STORAGE_KEYS.HAS_SEEN_MODAL, 'true')
      } catch (error) {
        console.error('Failed to save modal seen status:', error)
      }
    }
  }

  const contextValue: StreamingPreferenceContextType = {
    preferredService,
    setPreferredService,
    hasSeenModal,
    showModal,
    hideModal,
    isModalOpen
  }

  // Don't render children until preferences are loaded to prevent hydration issues
  if (!isLoaded) {
    return null
  }

  return (
    <StreamingPreferenceContext.Provider value={contextValue}>
      {children}
    </StreamingPreferenceContext.Provider>
  )
}

export function useStreamingPreference() {
  const context = useContext(StreamingPreferenceContext)
  if (context === undefined) {
    throw new Error('useStreamingPreference must be used within a StreamingPreferenceProvider')
  }
  return context
}