'use client'

import { useEffect } from 'react'
import { initializeAccessibility } from '@/lib/accessibility'

export default function AccessibilityProvider() {
  useEffect(() => {
    initializeAccessibility()
  }, [])

  // Skip link is injected by initializeAccessibility() and targets #main-content
  // which lives on each page's <main id="main-content"> element.
  return null
}