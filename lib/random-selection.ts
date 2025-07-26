import { Album } from './types'

export interface RandomSelectionOptions {
  avoidRecentSelections?: boolean
  favorLessPopular?: boolean
  sessionTrackingKey?: string
}

export interface WeightedAlbum extends Album {
  weight: number
}

export class RandomSelectionService {
  private static readonly SESSION_STORAGE_KEY = 'music-central-recent-selections'
  private static readonly MAX_RECENT_SELECTIONS = 10

  // Get recent selections from session storage
  private static getRecentSelections(sessionKey?: string): string[] {
    if (typeof window === 'undefined') return []
    
    try {
      const key = sessionKey || this.SESSION_STORAGE_KEY
      const stored = sessionStorage.getItem(key)
      return stored ? JSON.parse(stored) : []
    } catch {
      return []
    }
  }

  // Store recent selection in session storage
  private static storeRecentSelection(albumId: string, sessionKey?: string): void {
    if (typeof window === 'undefined') return

    try {
      const key = sessionKey || this.SESSION_STORAGE_KEY
      const recent = this.getRecentSelections(sessionKey)
      const updated = [albumId, ...recent.filter(id => id !== albumId)]
        .slice(0, this.MAX_RECENT_SELECTIONS)
      
      sessionStorage.setItem(key, JSON.stringify(updated))
    } catch {
      // Silently fail if session storage is unavailable
    }
  }

  // Calculate weight for an album (higher weight = more likely to be selected)
  private static calculateWeight(
    album: Album, 
    options: RandomSelectionOptions,
    totalAlbums: number
  ): number {
    let weight = 1.0

    if (options.favorLessPopular) {
      // Favor albums added earlier (presumably less frequently accessed)
      const albumDate = new Date(album.created_at).getTime()
      const now = Date.now()
      const daysSinceAdded = (now - albumDate) / (1000 * 60 * 60 * 24)
      
      // Older albums get higher weight (up to 2x)
      weight *= Math.min(2.0, 1.0 + (daysSinceAdded / 365))

      // Albums with fewer personal vibes (less categorized) get slight boost
      if (album.personal_vibes.length === 0) {
        weight *= 1.3
      } else if (album.personal_vibes.length === 1) {
        weight *= 1.1
      }

      // Albums without thoughts/notes get slight boost (less explored)
      if (!album.thoughts || album.thoughts.trim().length === 0) {
        weight *= 1.2
      }
    }

    return weight
  }

  // Weighted random selection algorithm
  private static weightedRandomSelection(weightedAlbums: WeightedAlbum[]): Album {
    const totalWeight = weightedAlbums.reduce((sum, item) => sum + item.weight, 0)
    let random = Math.random() * totalWeight
    
    for (const album of weightedAlbums) {
      random -= album.weight
      if (random <= 0) {
        return album
      }
    }
    
    // Fallback to last album if something goes wrong
    return weightedAlbums[weightedAlbums.length - 1]
  }

  // Pure random selection (no weights, no filters)
  static selectPureRandom(albums: Album[]): Album | null {
    if (albums.length === 0) return null
    
    const randomIndex = Math.floor(Math.random() * albums.length)
    return albums[randomIndex]
  }

  // Main random selection method with options
  static selectRandomAlbum(
    albums: Album[], 
    options: RandomSelectionOptions = {}
  ): Album | null {
    if (albums.length === 0) return null

    let candidates = [...albums]

    // Filter out recent selections if requested
    if (options.avoidRecentSelections) {
      const recentSelections = this.getRecentSelections(options.sessionTrackingKey)
      candidates = candidates.filter(album => !recentSelections.includes(album.id))
      
      // If we filtered out everything, fall back to all albums
      if (candidates.length === 0) {
        candidates = albums
      }
    }

    // Apply weighting if requested
    if (options.favorLessPopular) {
      const weightedCandidates: WeightedAlbum[] = candidates.map(album => ({
        ...album,
        weight: this.calculateWeight(album, options, albums.length)
      }))

      const selected = this.weightedRandomSelection(weightedCandidates)
      this.storeRecentSelection(selected.id, options.sessionTrackingKey)
      return selected
    }

    // Simple random selection
    const selected = this.selectPureRandom(candidates)
    if (selected) {
      this.storeRecentSelection(selected.id, options.sessionTrackingKey)
    }
    
    return selected
  }


}