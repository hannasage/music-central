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

interface BattleSessionState {
  battleHistory: BattleChoice[]
  insights: PreferenceInsight[]
  round: number
  gameStarted: boolean
}

const SESSION_KEY = 'music-central-battle-session'

const defaultState: BattleSessionState = {
  battleHistory: [],
  insights: [],
  round: 1,
  gameStarted: true
}

export function useBattleSession() {
  const [sessionState, setSessionState] = useState<BattleSessionState>(defaultState)
  const [isLoaded, setIsLoaded] = useState(false)

  // Load session from storage on mount
  useEffect(() => {
    const stored = sessionStorage.getItem(SESSION_KEY)
    if (stored) {
      try {
        const parsed = JSON.parse(stored)
        // Convert timestamp strings back to Date objects
        const battleHistory = parsed.battleHistory?.map((choice: any) => ({
          ...choice,
          timestamp: new Date(choice.timestamp)
        })) || []
        
        setSessionState({
          ...defaultState,
          ...parsed,
          battleHistory
        })
      } catch (error) {
        console.error('Failed to parse session storage:', error)
        setSessionState(defaultState)
      }
    }
    setIsLoaded(true)
  }, [])

  // Save to session storage whenever state changes
  useEffect(() => {
    if (isLoaded) {
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(sessionState))
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

  const startOver = useCallback(() => {
    setSessionState(defaultState)
    sessionStorage.removeItem(SESSION_KEY)
  }, [])

  return {
    ...sessionState,
    isLoaded,
    updateBattleHistory,
    updateInsights,
    updateRound,
    addBattleChoice,
    startOver
  }
}