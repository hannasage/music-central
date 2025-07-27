'use client'

import { useEffect } from 'react'
import { initializeAccessibility } from '@/lib/accessibility'

export default function AccessibilityProvider() {
  useEffect(() => {
    initializeAccessibility()
  }, [])

  return (
    <>
      {/* Skip to content link will be added by accessibility.ts */}
      <div id="main-content" className="sr-only">
        Main content starts here
      </div>
    </>
  )
}