'use client'

import { useState, useEffect, useCallback } from 'react'
import { Album } from '@/lib/types'

export interface BattleChoice {
  round: number
  chosenAlbum: Album
  rejectedAlbum: Album
  timestamp: Date
}

export interface PreferenceInsight {
  summary: string
  confidence: number
}

interface BattleState {
  battleHistory: BattleChoice[]
  insights: PreferenceInsight[]
  round: number
  gameStarted: boolean
  currentAlbumPair: [Album, Album] | null
}

const STORAGE_KEY = 'music-central-battle-session'

const defaultState: BattleState = {
  battleHistory: [],
  insights: [],
  round: 1,
  gameStarted: true,
  currentAlbumPair: null
}

export function useBattleSession() {
  const [sessionState, setSessionState] = useState<BattleState>(defaultState)
  const [isLoaded, setIsLoaded] = useState(false)

  // Load persistent state from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      try {
        const parsed = JSON.parse(stored)
        // Convert timestamp strings back to Date objects
        const battleHistory = parsed.battleHistory?.map((choice: Omit<BattleChoice, 'timestamp'> & { timestamp: string }) => ({
          ...choice,
          timestamp: new Date(choice.timestamp)
        })) || []
        
        setSessionState({
          ...defaultState,
          ...parsed,
          battleHistory
        })
      } catch (error) {
        console.error('Failed to parse localStorage:', error)
        setSessionState(defaultState)
      }
    }
    setIsLoaded(true)
  }, [])

  // Save to localStorage whenever state changes
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sessionState))
    }
  }, [sessionState, isLoaded])

  const updateBattleHistory = useCallback((history: BattleChoice[]) => {
    setSessionState(prev => ({ ...prev, battleHistory: history }))
  }, [])

  const updateInsights = useCallback((insights: PreferenceInsight[]) => {
    setSessionState(prev => ({ ...prev, insights }))
  }, [])

  const updateRound = useCallback((round: number) => {
    setSessionState(prev => ({ ...prev, round }))
  }, [])

  const addBattleChoice = useCallback((choice: BattleChoice) => {
    setSessionState(prev => ({
      ...prev,
      battleHistory: [...prev.battleHistory, choice]
    }))
  }, [])

  const updateCurrentAlbumPair = useCallback((albumPair: [Album, Album] | null) => {
    setSessionState(prev => ({ ...prev, currentAlbumPair: albumPair }))
  }, [])

  const startOver = useCallback(() => {
    setSessionState(defaultState)
    localStorage.removeItem(STORAGE_KEY)
  }, [])

  return {
    ...sessionState,
    isLoaded,
    updateBattleHistory,
    updateInsights,
    updateRound,
    addBattleChoice,
    updateCurrentAlbumPair,
    startOver
  }
}