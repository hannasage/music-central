import { Album } from './types'

export interface DailyFeatures {
  date: string
  albums: Album[]
  rotationSeed: number
  generatedAt: string
}

export interface DailyFeaturesOptions {
  count?: number
  ensureDiversity?: boolean
  favorRecent?: boolean
  localStorageKey?: string
}

export class DailyFeaturesService {
  private static readonly DEFAULT_STORAGE_KEY = 'music-central-daily-features'
  private static readonly DEFAULT_COUNT = 4

  // Generate a seed from a date string for deterministic randomness
  private static generateDateSeed(date: string): number {
    let hash = 0
    for (let i = 0; i < date.length; i++) {
      const char = date.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32-bit integer
    }
    return Math.abs(hash)
  }

  // Seeded random number generator (Linear Congruential Generator)
  private static createSeededRandom(seed: number) {
    let state = seed
    return () => {
      state = (state * 1664525 + 1013904223) % Math.pow(2, 32)
      return state / Math.pow(2, 32)
    }
  }

  // Get today's date in YYYY-MM-DD format (local timezone)
  private static getTodayString(): string {
    const today = new Date()
    return today.getFullYear() + '-' + 
           String(today.getMonth() + 1).padStart(2, '0') + '-' + 
           String(today.getDate()).padStart(2, '0')
  }

  // Get stored daily features from localStorage
  private static getStoredFeatures(storageKey: string): DailyFeatures | null {
    if (typeof window === 'undefined') return null

    try {
      const stored = localStorage.getItem(storageKey)
      if (!stored) return null

      const features: DailyFeatures = JSON.parse(stored)
      
      // Check if stored features are for today
      const today = this.getTodayString()
      if (features.date === today) {
        return features
      }
      
      // Clear old features
      localStorage.removeItem(storageKey)
      return null
    } catch {
      return null
    }
  }

  // Store daily features in localStorage
  private static storeFeatures(features: DailyFeatures, storageKey: string): void {
    if (typeof window === 'undefined') return

    try {
      localStorage.setItem(storageKey, JSON.stringify(features))
    } catch {
      // Silently fail if localStorage is unavailable
    }
  }

  // Calculate diversity score for album selection
  private static calculateDiversityScore(
    album: Album, 
    selectedAlbums: Album[]
  ): number {
    if (selectedAlbums.length === 0) return 1.0

    let diversityScore = 1.0

    // Penalize same genres
    for (const selected of selectedAlbums) {
      const sharedGenres = album.genres.filter(g => 
        selected.genres.some(sg => sg.toLowerCase() === g.toLowerCase())
      )
      if (sharedGenres.length > 0) {
        diversityScore *= 0.7 // Reduce score for shared genres
      }

      // Penalize same artist
      if (album.artist.toLowerCase() === selected.artist.toLowerCase()) {
        diversityScore *= 0.3
      }

      // Penalize same decade
      const albumDecade = Math.floor(album.year / 10)
      const selectedDecade = Math.floor(selected.year / 10)
      if (albumDecade === selectedDecade) {
        diversityScore *= 0.8
      }

      // Penalize very similar audio features (if available)
      if (album.audio_features && selected.audio_features) {
        const energyDiff = Math.abs(album.audio_features.energy - selected.audio_features.energy)
        const valenceDiff = Math.abs(album.audio_features.valence - selected.audio_features.valence)
        
        if (energyDiff < 0.2 && valenceDiff < 0.2) {
          diversityScore *= 0.9
        }
      }
    }

    return diversityScore
  }

  // Select diverse set of albums using deterministic randomness
  private static selectDiverseSet(
    albums: Album[], 
    seededRandom: () => number,
    options: DailyFeaturesOptions
  ): Album[] {
    const { count = this.DEFAULT_COUNT, ensureDiversity = true, favorRecent = false } = options
    
    if (albums.length === 0) return []
    if (albums.length <= count) return [...albums]

    const selected: Album[] = []
    let candidates = [...albums]

    // Sort candidates to give some preference to recent additions if requested
    if (favorRecent) {
      candidates.sort((a, b) => {
        const dateA = new Date(a.created_at).getTime()
        const dateB = new Date(b.created_at).getTime()
        return dateB - dateA // Newer first
      })
    }

    for (let i = 0; i < count && candidates.length > 0; i++) {
      let weights: number[]

      if (ensureDiversity && selected.length > 0) {
        // Calculate diversity-based weights
        weights = candidates.map(album => {
          const diversityScore = this.calculateDiversityScore(album, selected)
          let weight = diversityScore

          // Boost recently added albums slightly if favorRecent is true
          if (favorRecent) {
            const albumDate = new Date(album.created_at).getTime()
            const now = Date.now()
            const daysOld = (now - albumDate) / (1000 * 60 * 60 * 24)
            if (daysOld < 30) { // Albums added in last 30 days
              weight *= 1.2
            }
          }

          return weight
        })
      } else {
        // Equal weights for pure random selection
        weights = candidates.map(() => 1.0)
      }

      // Weighted selection using seeded random
      const totalWeight = weights.reduce((sum, w) => sum + w, 0)
      let randomValue = seededRandom() * totalWeight
      
      let selectedIndex = 0
      for (let j = 0; j < weights.length; j++) {
        randomValue -= weights[j]
        if (randomValue <= 0) {
          selectedIndex = j
          break
        }
      }

      // Add selected album and remove it from candidates
      selected.push(candidates[selectedIndex])
      candidates.splice(selectedIndex, 1)
    }

    return selected
  }

  // Get daily featured albums (main public method)
  static getDailyFeatured(
    albums: Album[], 
    options: DailyFeaturesOptions = {}
  ): DailyFeatures {
    const storageKey = options.localStorageKey || this.DEFAULT_STORAGE_KEY
    const today = this.getTodayString()

    // Try to get stored features for today
    const stored = this.getStoredFeatures(storageKey)
    if (stored && stored.albums.length > 0) {
      // Verify that all stored albums still exist in the current collection
      const validAlbums = stored.albums.filter(storedAlbum => 
        albums.some(album => album.id === storedAlbum.id)
      )
      
      if (validAlbums.length === stored.albums.length) {
        return stored
      }
    }

    // Generate new daily features
    const seed = this.generateDateSeed(today)
    const seededRandom = this.createSeededRandom(seed)
    
    const selectedAlbums = this.selectDiverseSet(albums, seededRandom, options)
    
    const features: DailyFeatures = {
      date: today,
      albums: selectedAlbums,
      rotationSeed: seed,
      generatedAt: new Date().toISOString()
    }

    // Store for future use
    this.storeFeatures(features, storageKey)
    
    return features
  }

  // Force regenerate daily features (useful for testing or manual refresh)
  static regenerateDailyFeatured(
    albums: Album[], 
    options: DailyFeaturesOptions = {}
  ): DailyFeatures {
    const storageKey = options.localStorageKey || this.DEFAULT_STORAGE_KEY
    
    // Clear stored features
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem(storageKey)
      } catch {
        // Silently fail
      }
    }

    // Generate new features
    return this.getDailyFeatured(albums, options)
  }

  // Get time until next rotation (midnight local time)
  static getTimeUntilNextRotation(): {
    hours: number
    minutes: number
    seconds: number
    totalSeconds: number
  } {
    const now = new Date()
    const tomorrow = new Date(now)
    tomorrow.setDate(tomorrow.getDate() + 1)
    tomorrow.setHours(0, 0, 0, 0)
    
    const msUntilMidnight = tomorrow.getTime() - now.getTime()
    const totalSeconds = Math.floor(msUntilMidnight / 1000)
    
    const hours = Math.floor(totalSeconds / 3600)
    const minutes = Math.floor((totalSeconds % 3600) / 60)
    const seconds = totalSeconds % 60

    return { hours, minutes, seconds, totalSeconds }
  }

  // Check if daily features need refresh (useful for components)
  static needsRefresh(options: DailyFeaturesOptions = {}): boolean {
    const storageKey = options.localStorageKey || this.DEFAULT_STORAGE_KEY
    const stored = this.getStoredFeatures(storageKey)
    
    if (!stored) return true
    
    const today = this.getTodayString()
    return stored.date !== today
  }

  // Get statistics about daily features
  static getStats(albums: Album[], options: DailyFeaturesOptions = {}): {
    totalAlbums: number
    featuredCount: number
    isToday: boolean
    rotationSeed: number | null
    nextRotationIn: string
  } {
    const storageKey = options.localStorageKey || this.DEFAULT_STORAGE_KEY
    const stored = this.getStoredFeatures(storageKey)
    const timeUntil = this.getTimeUntilNextRotation()
    
    const nextRotationIn = `${timeUntil.hours}h ${timeUntil.minutes}m ${timeUntil.seconds}s`

    return {
      totalAlbums: albums.length,
      featuredCount: stored?.albums.length || 0,
      isToday: stored?.date === this.getTodayString(),
      rotationSeed: stored?.rotationSeed || null,
      nextRotationIn
    }
  }
}