import { Album, SpotifyAudioFeatures } from './types'

export interface RecommendationScore {
  album: Album
  score: number
  reasons: string[]
}

export interface RecommendationFilters {
  genres?: string[]
  vibes?: string[]
  yearRange?: { min?: number; max?: number }
  audioFeatures?: Partial<SpotifyAudioFeatures>
  excludeAlbums?: string[]
}

export class RecommendationEngine {
  private albums: Album[]
  private openaiInstance?: unknown

  constructor(albums: Album[], openaiInstance?: unknown) {
    this.albums = albums
    this.openaiInstance = openaiInstance
  }

  // Calculate similarity between two audio feature sets
  private calculateAudioSimilarity(
    features1: SpotifyAudioFeatures,
    features2: SpotifyAudioFeatures
  ): number {
    const weights = {
      energy: 0.2,
      danceability: 0.2,
      valence: 0.25,
      acousticness: 0.15,
      instrumentalness: 0.1,
      liveness: 0.05,
      speechiness: 0.05
    }

    let similarity = 0
    let totalWeight = 0

    Object.entries(weights).forEach(([feature, weight]) => {
      const key = feature as keyof typeof weights
      if (features1[key] !== undefined && features2[key] !== undefined) {
        const diff = Math.abs(features1[key] - features2[key])
        similarity += (1 - diff) * weight
        totalWeight += weight
      }
    })

    return totalWeight > 0 ? similarity / totalWeight : 0
  }

  // Calculate genre similarity
  private calculateGenreSimilarity(genres1: string[], genres2: string[]): number {
    if (genres1.length === 0 || genres2.length === 0) return 0
    
    const intersection = genres1.filter(g => 
      genres2.some(g2 => g2.toLowerCase() === g.toLowerCase())
    )
    
    return intersection.length / Math.max(genres1.length, genres2.length)
  }

  // Calculate vibe similarity
  private calculateVibeSimilarity(vibes1: string[], vibes2: string[]): number {
    if (vibes1.length === 0 || vibes2.length === 0) return 0
    
    const intersection = vibes1.filter(v => 
      vibes2.some(v2 => v2.toLowerCase() === v.toLowerCase())
    )
    
    return intersection.length / Math.max(vibes1.length, vibes2.length)
  }

  // AI-powered temporal preference scoring
  private async calculateTemporalScore(
    albumYear: number, 
    temporalPreference: string,
    userMessage: string,
    openaiInstance?: unknown
  ): Promise<{ score: number; reasoning: string | null }> {
    
    // Fallback to simple scoring if no OpenAI available
    if (!openaiInstance) {
      return this.getSimpleTemporalScore(albumYear, temporalPreference)
    }

    try {
      const currentYear = new Date().getFullYear()
      const albumAge = currentYear - albumYear
      const decade = Math.floor(albumYear / 10) * 10

      const prompt = `
Score how well this album's release year matches the user's temporal preference.

Album: Released in ${albumYear} (${albumAge} years ago, ${decade}s)
User said: "${userMessage}"
Temporal preference: "${temporalPreference}"

Context:
- Current year is ${currentYear}
- "Nostalgic" typically refers to music from 15-40 years ago that evokes memories
- "Classic" often means established, influential music (usually 20+ years old)
- "Vintage" suggests very old music (30+ years)
- "Retro" often refers to 80s/90s aesthetics
- "Newer/Modern" means recent releases (0-10 years)

Return a JSON object with:
{
  "score": 0.85, // 0.0-1.0 how well this album year matches the preference
  "reasoning": "Perfect nostalgic choice from the golden 90s era" // Brief explanation or null
}

Consider:
- What would actually feel nostalgic/classic/vintage to someone today?
- Cultural significance of different eras
- How the album's age relates to the emotional intent

Return valid JSON only.`

      const response = await openaiInstance.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
        max_tokens: 150
      })

      const content = response.choices[0]?.message?.content?.trim()
      if (!content) throw new Error('No response from OpenAI')

      const result = JSON.parse(content)
      return {
        score: Math.max(0, Math.min(1, result.score || 0)),
        reasoning: result.reasoning || null
      }

    } catch (error) {
      console.error('Error in AI temporal scoring:', error)
      return this.getSimpleTemporalScore(albumYear, temporalPreference)
    }
  }

  // Fallback simple temporal scoring
  private getSimpleTemporalScore(albumYear: number, temporalPreference: string): { score: number; reasoning: string | null } {
    const currentYear = new Date().getFullYear()
    const decade = Math.floor(albumYear / 10) * 10
    
    switch (temporalPreference) {
      case 'older':
      case 'classic':
        if (albumYear >= 1980 && albumYear <= 1995) return { score: 1.0, reasoning: `Classic ${decade}s album` }
        if (albumYear >= 1970 && albumYear <= 2000) return { score: 0.8, reasoning: 'From a classic era' }
        if (albumYear >= 1960 && albumYear <= 2005) return { score: 0.6, reasoning: null }
        if (albumYear <= 2010) return { score: 0.4, reasoning: null }
        return { score: 0.1, reasoning: null }
        
      case 'vintage':
        if (albumYear <= 1975) return { score: 1.0, reasoning: `Vintage ${decade}s album` }
        if (albumYear <= 1985) return { score: 0.8, reasoning: 'From the vintage era' }
        if (albumYear <= 1995) return { score: 0.5, reasoning: null }
        return { score: 0.2, reasoning: null }
        
      case 'retro':
        if (albumYear >= 1980 && albumYear <= 1989) return { score: 1.0, reasoning: 'Perfect 80s retro vibe' }
        if (albumYear >= 1990 && albumYear <= 1999) return { score: 1.0, reasoning: 'Classic 90s sound' }
        if (albumYear >= 1975 && albumYear <= 2005) return { score: 0.6, reasoning: 'Great retro feel' }
        return { score: 0.3, reasoning: null }
        
      case 'newer':
        const age = currentYear - albumYear
        if (age <= 5) return { score: 1.0, reasoning: 'Recent addition' }
        if (age <= 10) return { score: 0.8, reasoning: 'Modern classic' }
        if (age <= 15) return { score: 0.6, reasoning: 'Contemporary sound' }
        if (age <= 20) return { score: 0.4, reasoning: null }
        return { score: 0.2, reasoning: null }
        
      default:
        return { score: 0.5, reasoning: null }
    }
  }

  // Get recommendations based on a seed album
  getRecommendationsFromAlbum(
    seedAlbum: Album,
    options: {
      count?: number
      filters?: RecommendationFilters
      diversityFactor?: number
    } = {}
  ): RecommendationScore[] {
    const { count = 5, filters = {}, diversityFactor = 0.3 } = options
    
    const candidates = this.albums.filter(album => {
      // Exclude the seed album and any explicitly excluded albums
      if (album.id === seedAlbum.id) return false
      if (filters.excludeAlbums?.includes(album.id)) return false
      
      // Apply filters
      if (filters.genres?.length && !album.genres.some(g => 
        filters.genres!.some(fg => fg.toLowerCase() === g.toLowerCase())
      )) return false
      
      if (filters.vibes?.length && !album.personal_vibes.some(v => 
        filters.vibes!.some(fv => fv.toLowerCase() === v.toLowerCase())
      )) return false
      
      if (filters.yearRange?.min && album.year < filters.yearRange.min) return false
      if (filters.yearRange?.max && album.year > filters.yearRange.max) return false
      
      return true
    })

    const scored = candidates.map(album => {
      let score = 0
      const reasons: string[] = []

      // Audio features similarity (40% weight)
      if (seedAlbum.audio_features && album.audio_features) {
        const audioSim = this.calculateAudioSimilarity(seedAlbum.audio_features, album.audio_features)
        score += audioSim * 0.4
        if (audioSim > 0.7) reasons.push('Similar musical characteristics')
      }

      // Genre similarity (30% weight)
      const genreSim = this.calculateGenreSimilarity(seedAlbum.genres, album.genres)
      score += genreSim * 0.3
      if (genreSim > 0.5) {
        const sharedGenres = seedAlbum.genres.filter(g => 
          album.genres.some(ag => ag.toLowerCase() === g.toLowerCase())
        )
        reasons.push(`Shares ${sharedGenres.join(', ')} genre${sharedGenres.length > 1 ? 's' : ''}`)
      }

      // Vibe similarity (20% weight)
      const vibeSim = this.calculateVibeSimilarity(seedAlbum.personal_vibes, album.personal_vibes)
      score += vibeSim * 0.2
      if (vibeSim > 0.3) {
        const sharedVibes = seedAlbum.personal_vibes.filter(v => 
          album.personal_vibes.some(av => av.toLowerCase() === v.toLowerCase())
        )
        reasons.push(`Similar ${sharedVibes.join(', ')} vibe${sharedVibes.length > 1 ? 's' : ''}`)
      }

      // Year proximity bonus (10% weight)
      const yearDiff = Math.abs(seedAlbum.year - album.year)
      const yearSim = Math.max(0, 1 - yearDiff / 50) // Similar if within ~50 years
      score += yearSim * 0.1
      if (yearDiff <= 5) reasons.push('From similar era')

      // Add some randomness for diversity
      score += Math.random() * diversityFactor

      return { album, score, reasons }
    })

    return scored
      .sort((a, b) => b.score - a.score)
      .slice(0, count)
      .filter(item => item.score > 0.1) // Only return reasonably good matches
  }

  // Get recommendations based on user preferences
  async getRecommendationsByPreferences(
    preferences: {
      genres?: string[]
      vibes?: string[]
      audioFeatures?: Partial<SpotifyAudioFeatures>
      yearRange?: { min?: number; max?: number }
      keywords?: string[]
      temporalPreference?: 'older' | 'newer' | 'classic' | 'vintage' | 'retro'
    },
    options: {
      count?: number
      excludeAlbums?: string[]
      diversityFactor?: number
      userMessage?: string
    } = {}
  ): Promise<RecommendationScore[]> {
    const { count = 5, excludeAlbums = [], diversityFactor = 0.2 } = options
    
    const candidates = this.albums.filter(album => {
      if (excludeAlbums.includes(album.id)) return false
      
      // Apply hard filters
      if (preferences.yearRange?.min && album.year < preferences.yearRange.min) return false
      if (preferences.yearRange?.max && album.year > preferences.yearRange.max) return false
      
      return true
    })

    const scoredPromises = candidates.map(async album => {
      let score = 0
      const reasons: string[] = []

      // Genre matching (30% weight - reduced to make room for temporal)
      if (preferences.genres?.length) {
        const genreMatches = album.genres.filter(g => 
          preferences.genres!.some(pg => pg.toLowerCase() === g.toLowerCase())
        )
        if (genreMatches.length > 0) {
          score += (genreMatches.length / preferences.genres.length) * 0.3
          reasons.push(`Matches ${genreMatches.join(', ')} genre${genreMatches.length > 1 ? 's' : ''}`)
        }
      }

      // Vibe matching (20% weight - reduced)
      if (preferences.vibes?.length) {
        const vibeMatches = album.personal_vibes.filter(v => 
          preferences.vibes!.some(pv => pv.toLowerCase() === v.toLowerCase())
        )
        if (vibeMatches.length > 0) {
          score += (vibeMatches.length / preferences.vibes.length) * 0.2
          reasons.push(`Has ${vibeMatches.join(', ')} vibe${vibeMatches.length > 1 ? 's' : ''}`)
        }
      }

      // Audio features matching (20% weight - reduced)
      if (preferences.audioFeatures && album.audio_features) {
        let featureScore = 0
        let featureCount = 0
        
        Object.entries(preferences.audioFeatures).forEach(([feature, targetValue]) => {
          if (targetValue !== undefined && album.audio_features![feature as keyof SpotifyAudioFeatures] !== undefined) {
            const albumValue = album.audio_features![feature as keyof SpotifyAudioFeatures] as number
            const similarity = 1 - Math.abs(targetValue - albumValue)
            featureScore += similarity
            featureCount++
          }
        })
        
        if (featureCount > 0) {
          score += (featureScore / featureCount) * 0.2
          reasons.push('Matches your musical preferences')
        }
      }

      // Keyword matching (10% weight - reduced)
      if (preferences.keywords?.length) {
        const text = `${album.title} ${album.artist} ${album.genres.join(' ')} ${album.personal_vibes.join(' ')} ${album.thoughts || ''}`.toLowerCase()
        const keywordMatches = preferences.keywords.filter(keyword => 
          text.includes(keyword.toLowerCase())
        )
        if (keywordMatches.length > 0) {
          score += (keywordMatches.length / preferences.keywords.length) * 0.1
          reasons.push('Matches your description')
        }
      }

      // AI-powered temporal preference scoring (20% weight)
      if (preferences.temporalPreference) {
        const temporalResult = await this.calculateTemporalScore(
          album.year, 
          preferences.temporalPreference,
          options.userMessage || '',
          this.openaiInstance
        )
        score += temporalResult.score * 0.2
        if (temporalResult.reasoning) {
          reasons.push(temporalResult.reasoning)
        }
      }

      // Add diversity factor
      score += Math.random() * diversityFactor

      return { album, score, reasons }
    })

    const scored = await Promise.all(scoredPromises)

    return scored
      .sort((a, b) => b.score - a.score)
      .slice(0, count)
      .filter(item => item.score > 0.1)
  }

  // Get trending/popular albums from collection
  getTrendingAlbums(count: number = 5): Album[] {
    // Sort by creation date (recently added) and some randomness
    return this.albums
      .sort((a, b) => {
        const dateA = new Date(a.created_at).getTime()
        const dateB = new Date(b.created_at).getTime()
        return dateB - dateA + (Math.random() - 0.5) * 86400000 // Add some randomness
      })
      .slice(0, count)
  }

  // Get random albums for discovery
  getDiscoveryAlbums(count: number = 5, excludeAlbums: string[] = []): Album[] {
    const available = this.albums.filter(album => !excludeAlbums.includes(album.id))
    
    // Fisher-Yates shuffle
    const shuffled = [...available]
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }
    
    return shuffled.slice(0, count)
  }

  // Validate that recommended albums exist in collection
  validateRecommendations(albumIds: string[]): { valid: string[]; invalid: string[] } {
    const existingIds = new Set(this.albums.map(album => album.id))
    
    const valid = albumIds.filter(id => existingIds.has(id))
    const invalid = albumIds.filter(id => !existingIds.has(id))
    
    return { valid, invalid }
  }
}