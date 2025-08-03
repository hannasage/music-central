// Accessibility utilities and helpers

/**
 * Screen reader announcements
 */
export const announceToScreenReader = (message: string, priority: 'polite' | 'assertive' = 'polite') => {
  if (typeof window === 'undefined') return

  const announcement = document.createElement('div')
  announcement.setAttribute('aria-live', priority)
  announcement.setAttribute('aria-atomic', 'true')
  announcement.className = 'sr-only'
  announcement.textContent = message

  document.body.appendChild(announcement)

  // Remove after announcement
  setTimeout(() => {
    document.body.removeChild(announcement)
  }, 1000)
}

/**
 * Focus management utilities
 */
export const focusManagement = {
  /**
   * Trap focus within an element
   */
  trapFocus(element: HTMLElement): () => void {
    const focusableElements = element.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    ) as NodeListOf<HTMLElement>

    const firstElement = focusableElements[0]
    const lastElement = focusableElements[focusableElements.length - 1]

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          lastElement.focus()
          e.preventDefault()
        }
      } else {
        if (document.activeElement === lastElement) {
          firstElement.focus()
          e.preventDefault()
        }
      }
    }

    element.addEventListener('keydown', handleTabKey)

    // Focus first element
    firstElement?.focus()

    // Return cleanup function
    return () => {
      element.removeEventListener('keydown', handleTabKey)
    }
  },

  /**
   * Focus first error in form
   */
  focusFirstError(): void {
    const firstError = document.querySelector('[aria-invalid="true"]') as HTMLElement
    firstError?.focus()
  },

  /**
   * Restore focus to previous element
   */
  restoreFocus(previousElement: HTMLElement | null): void {
    if (previousElement && document.contains(previousElement)) {
      previousElement.focus()
    }
  }
}

/**
 * Keyboard navigation helpers
 */
export const keyboardNavigation = {
  /**
   * Handle arrow key navigation in a list
   */
  handleArrowKeys(
    e: KeyboardEvent,
    items: NodeListOf<HTMLElement> | HTMLElement[],
    currentIndex: number,
    onIndexChange: (newIndex: number) => void,
    options: {
      wrap?: boolean
      horizontal?: boolean
    } = {}
  ): void {
    const { wrap = true, horizontal = false } = options
    const itemsArray = Array.from(items)
    
    let newIndex = currentIndex

    if (horizontal) {
      if (e.key === 'ArrowLeft') {
        newIndex = wrap ? (currentIndex - 1 + itemsArray.length) % itemsArray.length : Math.max(0, currentIndex - 1)
      } else if (e.key === 'ArrowRight') {
        newIndex = wrap ? (currentIndex + 1) % itemsArray.length : Math.min(itemsArray.length - 1, currentIndex + 1)
      }
    } else {
      if (e.key === 'ArrowUp') {
        newIndex = wrap ? (currentIndex - 1 + itemsArray.length) % itemsArray.length : Math.max(0, currentIndex - 1)
      } else if (e.key === 'ArrowDown') {
        newIndex = wrap ? (currentIndex + 1) % itemsArray.length : Math.min(itemsArray.length - 1, currentIndex + 1)
      }
    }

    if (newIndex !== currentIndex) {
      e.preventDefault()
      onIndexChange(newIndex)
      itemsArray[newIndex]?.focus()
    }
  },

  /**
   * Handle escape key
   */
  handleEscape(e: KeyboardEvent, callback: () => void): void {
    if (e.key === 'Escape') {
      e.preventDefault()
      callback()
    }
  }
}

/**
 * Color contrast utilities
 */
export const colorContrast = {
  /**
   * Calculate relative luminance
   */
  getLuminance(r: number, g: number, b: number): number {
    const [rs, gs, bs] = [r, g, b].map(c => {
      c = c / 255
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
    })
    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs
  },

  /**
   * Calculate contrast ratio
   */
  getContrastRatio(color1: [number, number, number], color2: [number, number, number]): number {
    const lum1 = this.getLuminance(...color1)
    const lum2 = this.getLuminance(...color2)
    const brightest = Math.max(lum1, lum2)
    const darkest = Math.min(lum1, lum2)
    return (brightest + 0.05) / (darkest + 0.05)
  },

  /**
   * Check if contrast meets WCAG standards
   */
  meetsWCAG(contrastRatio: number, level: 'AA' | 'AAA' = 'AA', size: 'normal' | 'large' = 'normal'): boolean {
    if (level === 'AAA') {
      return size === 'large' ? contrastRatio >= 4.5 : contrastRatio >= 7
    }
    return size === 'large' ? contrastRatio >= 3 : contrastRatio >= 4.5
  }
}

/**
 * ARIA label generators
 */
export const ariaLabels = {
  /**
   * Generate album card label
   */
  albumCard(album: { title: string; artist: string; year: number }): string {
    return `Album: ${album.title} by ${album.artist}, released in ${album.year}`
  },

  /**
   * Generate search result label
   */
  searchResult(resultCount: number, query: string): string {
    return `Found ${resultCount} result${resultCount === 1 ? '' : 's'} for "${query}"`
  },

  /**
   * Generate pagination label
   */
  pagination(currentPage: number, totalPages: number): string {
    return `Page ${currentPage} of ${totalPages}`
  },

  /**
   * Generate loading state label
   */
  loading(context: string): string {
    return `Loading ${context}, please wait`
  },

  /**
   * Generate error state label
   */
  error(context: string): string {
    return `Error loading ${context}. Please try again`
  }
}

/**
 * Skip link utilities
 */
export const skipLinks = {
  /**
   * Add skip to content link
   */
  addSkipToContent(): void {
    if (typeof window === 'undefined') return
    if (document.querySelector('#skip-to-content')) return

    const skipLink = document.createElement('a')
    skipLink.id = 'skip-to-content'
    skipLink.href = '#main-content'
    skipLink.textContent = 'Skip to main content'
    skipLink.className = 'sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-blue-500 focus:text-white focus:rounded-lg'
    
    document.body.insertBefore(skipLink, document.body.firstChild)
  }
}

/**
 * Reduced motion preferences
 */
export const reducedMotion = {
  /**
   * Check if user prefers reduced motion
   */
  prefersReducedMotion(): boolean {
    if (typeof window === 'undefined') return false
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
  },

  /**
   * Apply reduced motion styles
   */
  applyReducedMotionStyles(): void {
    if (!this.prefersReducedMotion()) return

    const style = document.createElement('style')
    style.textContent = `
      *, *::before, *::after {
        animation-duration: 0.01ms !important;
        animation-iteration-count: 1 !important;
        transition-duration: 0.01ms !important;
        scroll-behavior: auto !important;
      }
    `
    document.head.appendChild(style)
  }
}

/**
 * High contrast mode detection
 */
export const highContrast = {
  /**
   * Check if high contrast mode is enabled
   */
  isHighContrastMode(): boolean {
    if (typeof window === 'undefined') return false
    
    // Windows high contrast detection
    return window.matchMedia('(prefers-contrast: high)').matches ||
           window.matchMedia('(-ms-high-contrast: active)').matches
  },

  /**
   * Apply high contrast styles
   */
  applyHighContrastStyles(): void {
    if (!this.isHighContrastMode()) return

    document.documentElement.classList.add('high-contrast')
  }
}

/**
 * Direct export of trapFocus for convenience
 */
export const trapFocus = focusManagement.trapFocus

/**
 * Initialize accessibility features
 */
export const initializeAccessibility = (): void => {
  if (typeof window === 'undefined') return

  // Add skip links
  skipLinks.addSkipToContent()

  // Apply motion preferences
  reducedMotion.applyReducedMotionStyles()

  // Apply high contrast if needed
  highContrast.applyHighContrastStyles()

  // Listen for preference changes
  window.matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', () => {
    reducedMotion.applyReducedMotionStyles()
  })

  window.matchMedia('(prefers-contrast: high)').addEventListener('change', () => {
    highContrast.applyHighContrastStyles()
  })
}

/**
 * Accessible form validation
 */
export const accessibleValidation = {
  /**
   * Set field error state
   */
  setFieldError(field: HTMLElement, errorMessage: string): void {
    field.setAttribute('aria-invalid', 'true')
    
    let errorElement = document.getElementById(`${field.id}-error`)
    if (!errorElement) {
      errorElement = document.createElement('div')
      errorElement.id = `${field.id}-error`
      errorElement.className = 'text-red-400 text-sm mt-1'
      errorElement.setAttribute('role', 'alert')
      field.parentNode?.insertBefore(errorElement, field.nextSibling)
    }
    
    errorElement.textContent = errorMessage
    field.setAttribute('aria-describedby', errorElement.id)
  },

  /**
   * Clear field error state
   */
  clearFieldError(field: HTMLElement): void {
    field.setAttribute('aria-invalid', 'false')
    field.removeAttribute('aria-describedby')
    
    const errorElement = document.getElementById(`${field.id}-error`)
    if (errorElement) {
      errorElement.remove()
    }
  }
}