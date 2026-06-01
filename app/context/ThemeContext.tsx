'use client'

import React, { createContext, useCallback, useContext, useLayoutEffect, useMemo, useState } from 'react'
import { THEMES, DEFAULT_THEME, type Theme } from '@/lib/projection-themes'
import { applyVisualPalette } from '@/lib/apply-visual-palette'

const STORAGE_KEY = 'music-central-theme-id'

interface ThemeContextType {
  theme: Theme
  colors: Theme['colors']
  setTheme: (theme: Theme) => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(DEFAULT_THEME)

  useLayoutEffect(() => {
    const id = localStorage.getItem(STORAGE_KEY)
    const found = id ? THEMES.find(t => t.id === id) : null
    const next = (found?.isDark ? found : null) || DEFAULT_THEME // light themes disabled
    setThemeState(next)
    applyVisualPalette(next.colors, next.isDark)
  }, [])

  const setTheme = useCallback((next: Theme) => {
    setThemeState(next)
    localStorage.setItem(STORAGE_KEY, next.id)
    applyVisualPalette(next.colors, next.isDark)
  }, [])

  const value = useMemo(() => ({ theme, colors: theme.colors, setTheme }), [theme, setTheme])

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider')
  return ctx
}
