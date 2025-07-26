import { Album } from './types'

export interface CurationCriteria {
  seasonalRelevance?: number
  genreDiversity?: number
  personalFavorites?: number
  recentlyAdded?: number
  historicalSignificance?: number
  energyBalance?: number
}

export interface SeasonalContext {
  month: number
  season: 'spring' | 'summer' | 'fall' | 'winter'
  isHoliday?: boolean
  weatherMood?: 'cozy' | 'energetic' | 'reflective' | 'celebratory'
}

export interface FeaturedAlgorithmOptions {
  criteria?: CurationCriteria
  seasonalContext?: SeasonalContext
  userPreferences?: {
    favoriteGenres?: string[]
    favoriteVibes?: string[]
    blacklistedAlbums?: string[]
  }
}

export class FeaturedAlgorithm {
  private static readonly DEFAULT_CRITERIA: CurationCriteria = {
    seasonalRelevance: 0.15,
    genreDiversity: 0.25,
    personalFavorites: 0.20,
    recentlyAdded: 0.15,
    historicalSignificance: 0.15,
    energyBalance: 0.10
  }

  // Get current seasonal context
  private static getCurrentSeasonalContext(): SeasonalContext {
    const now = new Date()
    const month = now.getMonth() + 1 // 1-12

    let season: 'spring' | 'summer' | 'fall' | 'winter'
    let weatherMood: 'cozy' | 'energetic' | 'reflective' | 'celebratory'

    if (month >= 3 && month <= 5) {
      season = 'spring'
      weatherMood = 'energetic'
    } else if (month >= 6 && month <= 8) {
      season = 'summer' 
      weatherMood = 'energetic'
    } else if (month >= 9 && month <= 11) {
      season = 'fall'
      weatherMood = 'reflective'
    } else {
      season = 'winter'
      weatherMood = 'cozy'
    }

    // Check for holiday periods (rough approximations)
    const isHoliday = (month === 12) || // December holidays
                     (month === 1) ||  // New Year
                     (month === 10)    // Halloween/harvest season

    if (isHoliday) {
      weatherMood = 'celebratory'
    }

    return { month, season, isHoliday, weatherMood }
  }

  // Calculate seasonal relevance score
  private static calculateSeasonalScore(
    album: Album, 
    seasonalContext: SeasonalContext
  ): number {
    let score = 0.5 // Base score

    const { season, weatherMood, month } = seasonalContext
    const albumGenres = album.genres.map(g => g.toLowerCase())
    const albumVibes = album.personal_vibes.map(v => v.toLowerCase())
    const allText = [...albumGenres, ...albumVibes, album.title.toLowerCase()].join(' ')

    // Season-specific scoring
    switch (season) {
      case 'spring':
        if (albumGenres.some(g => ['folk', 'indie', 'alternative', 'pop'].includes(g))) score += 0.2
        if (albumVibes.some(v => ['uplifting', 'fresh', 'optimistic', 'energetic'].includes(v))) score += 0.3
        if (album.audio_features?.valence && album.audio_features.valence > 0.6) score += 0.2
        break

      case 'summer':
        if (albumGenres.some(g => ['reggae', 'pop', 'rock', 'electronic', 'funk'].includes(g))) score += 0.2
        if (albumVibes.some(v => ['upbeat', 'fun', 'energetic', 'party', 'sunny'].includes(v))) score += 0.3
        if (album.audio_features?.energy && album.audio_features.energy > 0.7) score += 0.2
        if (album.audio_features?.danceability && album.audio_features.danceability > 0.6) score += 0.1
        break

      case 'fall':
        if (albumGenres.some(g => ['folk', 'indie', 'alternative', 'acoustic', 'singer-songwriter'].includes(g))) score += 0.2
        if (albumVibes.some(v => ['cozy', 'reflective', 'nostalgic', 'mellow', 'contemplative'].includes(v))) score += 0.3
        if (album.audio_features?.acousticness && album.audio_features.acousticness > 0.5) score += 0.2
        break

      case 'winter':
        if (albumGenres.some(g => ['folk', 'indie', 'ambient', 'classical', 'jazz'].includes(g))) score += 0.2
        if (albumVibes.some(v => ['cozy', 'warm', 'intimate', 'peaceful', 'contemplative'].includes(v))) score += 0.3
        if (album.audio_features?.energy && album.audio_features.energy < 0.4) score += 0.2
        break
    }

    // Weather mood adjustments
    switch (weatherMood) {
      case 'cozy':
        if (allText.includes('cozy') || allText.includes('warm') || allText.includes('intimate')) score += 0.2
        break
      case 'energetic':
        if (album.audio_features?.energy && album.audio_features.energy > 0.6) score += 0.2
        break
      case 'reflective':
        if (albumVibes.some(v => ['contemplative', 'introspective', 'deep', 'thoughtful'].includes(v))) score += 0.2
        break
      case 'celebratory':
        if (albumVibes.some(v => ['fun', 'party', 'upbeat', 'festive'].includes(v))) score += 0.2
        break
    }

    // Holiday-specific boosts
    if (seasonalContext.isHoliday) {
      if (month === 12 && allText.includes('christmas')) score += 0.3
      if (allText.includes('holiday') || allText.includes('festive')) score += 0.2
    }

    return Math.min(1.0, score)
  }

  // Calculate genre diversity contribution
  private static calculateGenreDiversityScore(
    album: Album,
    selectedAlbums: Album[]
  ): number {
    if (selectedAlbums.length === 0) return 1.0

    const selectedGenres = new Set(selectedAlbums.flatMap(a => a.genres.map(g => g.toLowerCase())))
    const albumGenres = album.genres.map(g => g.toLowerCase())
    
    // Score based on how many new genres this album introduces
    const newGenres = albumGenres.filter(g => !selectedGenres.has(g))
    const diversityScore = newGenres.length / Math.max(1, albumGenres.length)
    
    return diversityScore
  }

  // Calculate personal favorites score
  private static calculatePersonalFavoritesScore(
    album: Album,
    userPreferences?: FeaturedAlgorithmOptions['userPreferences']
  ): number {
    let score = 0.5 // Base score

    // Boost if album has personal vibes (indicates curation)
    if (album.personal_vibes.length > 0) {
      score += 0.2
    }

    // Boost if album has thoughts/notes (indicates engagement)
    if (album.thoughts && album.thoughts.trim().length > 0) {
      score += 0.3
    }

    // User preference matching
    if (userPreferences?.favoriteGenres) {
      const genreMatches = album.genres.filter(g => 
        userPreferences.favoriteGenres!.some(fg => fg.toLowerCase() === g.toLowerCase())
      )
      if (genreMatches.length > 0) {
        score += 0.3 * (genreMatches.length / userPreferences.favoriteGenres.length)
      }
    }

    if (userPreferences?.favoriteVibes) {
      const vibeMatches = album.personal_vibes.filter(v => 
        userPreferences.favoriteVibes!.some(fv => fv.toLowerCase() === v.toLowerCase())
      )
      if (vibeMatches.length > 0) {
        score += 0.2 * (vibeMatches.length / userPreferences.favoriteVibes.length)
      }
    }

    return Math.min(1.0, score)
  }

  // Calculate recently added score
  private static calculateRecentlyAddedScore(album: Album): number {
    const albumDate = new Date(album.created_at).getTime()
    const now = Date.now()
    const daysOld = (now - albumDate) / (1000 * 60 * 60 * 24)

    // Boost recently added albums (within last 30 days)
    if (daysOld <= 7) return 1.0      // Last week
    if (daysOld <= 14) return 0.8     // Last 2 weeks  
    if (daysOld <= 30) return 0.6     // Last month
    if (daysOld <= 90) return 0.4     // Last 3 months
    
    return 0.2 // Older albums get lower score
  }

  // Calculate historical significance score
  private static calculateHistoricalSignificanceScore(album: Album): number {
    let score = 0.5 // Base score

    // Influential decades
    const decade = Math.floor(album.year / 10) * 10
    if ([1960, 1970, 1980, 1990].includes(decade)) {
      score += 0.3
    }

    // Classic album years (rough heuristic based on cultural impact)
    const significantYears = [1967, 1969, 1971, 1973, 1975, 1977, 1979, 1982, 1991, 1994, 1997]
    if (significantYears.includes(album.year)) {
      score += 0.2
    }

    // Well-established albums (20+ years old) get slight boost
    const albumAge = new Date().getFullYear() - album.year
    if (albumAge >= 20) {
      score += 0.1
    }

    return Math.min(1.0, score)
  }

  // Calculate energy balance score for a set
  private static calculateEnergyBalanceScore(
    album: Album,
    selectedAlbums: Album[]
  ): number {
    if (!album.audio_features || selectedAlbums.length === 0) return 0.5

    // Calculate average energy of selected albums
    const selectedWithFeatures = selectedAlbums.filter(a => a.audio_features)
    if (selectedWithFeatures.length === 0) return 0.5

    const avgEnergy = selectedWithFeatures.reduce((sum, a) => sum + a.audio_features!.energy, 0) / selectedWithFeatures.length
    const avgValence = selectedWithFeatures.reduce((sum, a) => sum + a.audio_features!.valence, 0) / selectedWithFeatures.length

    // Prefer albums that balance the energy/mood
    const energyDiff = Math.abs(album.audio_features.energy - avgEnergy)
    const valenceDiff = Math.abs(album.audio_features.valence - avgValence)

    // Higher score for albums that provide good contrast
    const balanceScore = (energyDiff + valenceDiff) / 2
    
    return Math.min(1.0, balanceScore)
  }

  // Main curation algorithm
  static curateAlbums(
    albums: Album[],
    count: number = 4,
    options: FeaturedAlgorithmOptions = {}
  ): Album[] {
    if (albums.length === 0) return []
    if (albums.length <= count) return [...albums]

    const criteria = { ...this.DEFAULT_CRITERIA, ...options.criteria }
    const seasonalContext = options.seasonalContext || this.getCurrentSeasonalContext()
    
    // Filter out blacklisted albums
    let candidates = albums
    if (options.userPreferences?.blacklistedAlbums) {
      candidates = candidates.filter(album => 
        !options.userPreferences!.blacklistedAlbums!.includes(album.id)
      )
    }

    const selected: Album[] = []

    for (let i = 0; i < count && candidates.length > 0; i++) {
      // Calculate composite scores for all candidates
      const scoredCandidates = candidates.map(album => {
        let totalScore = 0

        // Apply all criteria with their weights
        if (criteria.seasonalRelevance) {
          totalScore += criteria.seasonalRelevance * this.calculateSeasonalScore(album, seasonalContext)
        }

        if (criteria.genreDiversity) {
          totalScore += criteria.genreDiversity * this.calculateGenreDiversityScore(album, selected)
        }

        if (criteria.personalFavorites) {
          totalScore += criteria.personalFavorites * this.calculatePersonalFavoritesScore(album, options.userPreferences)
        }

        if (criteria.recentlyAdded) {
          totalScore += criteria.recentlyAdded * this.calculateRecentlyAddedScore(album)
        }

        if (criteria.historicalSignificance) {
          totalScore += criteria.historicalSignificance * this.calculateHistoricalSignificanceScore(album)
        }

        if (criteria.energyBalance) {
          totalScore += criteria.energyBalance * this.calculateEnergyBalanceScore(album, selected)
        }

        return { album, score: totalScore }
      })

      // Sort by score and select the best candidate
      scoredCandidates.sort((a, b) => b.score - a.score)
      const selectedAlbum = scoredCandidates[0].album

      selected.push(selectedAlbum)
      candidates = candidates.filter(album => album.id !== selectedAlbum.id)
    }

    return selected
  }

  // Get current seasonal recommendations
  static getSeasonalRecommendations(albums: Album[], count: number = 4): Album[] {
    return this.curateAlbums(albums, count, {
      criteria: {
        seasonalRelevance: 0.4,
        genreDiversity: 0.2,
        personalFavorites: 0.2,
        recentlyAdded: 0.1,
        historicalSignificance: 0.05,
        energyBalance: 0.05
      }
    })
  }

  // Get discovery-focused recommendations (favor lesser-known albums)
  static getDiscoveryRecommendations(albums: Album[], count: number = 4): Album[] {
    return this.curateAlbums(albums, count, {
      criteria: {
        seasonalRelevance: 0.1,
        genreDiversity: 0.3,
        personalFavorites: 0.1, // Lower weight for favorites
        recentlyAdded: 0.3,
        historicalSignificance: 0.1,
        energyBalance: 0.1
      }
    })
  }
}