import type { Album, CollectionMetadata, CuratorCriteria, CuratorConstraints } from './types'

/**
 * Extract metadata about available genres and vibes from album collection
 */
export function extractCollectionMetadata(albums: Album[]): CollectionMetadata {
  const genres = new Set<string>()
  const vibes = new Set<string>()
  let minYear = Infinity
  let maxYear = -Infinity

  albums.forEach(album => {
    // Collect genres
    album.genres.forEach(genre => genres.add(genre))
    
    // Collect vibes
    album.personal_vibes.forEach(vibe => vibes.add(vibe))
    
    // Track year range
    minYear = Math.min(minYear, album.year)
    maxYear = Math.max(maxYear, album.year)
  })

  return {
    availableGenres: Array.from(genres).sort(),
    availableVibes: Array.from(vibes).sort(),
    yearRange: { 
      min: minYear === Infinity ? new Date().getFullYear() : minYear, 
      max: maxYear === -Infinity ? new Date().getFullYear() : maxYear 
    },
    totalAlbums: albums.length
  }
}

/**
 * Filter albums based on curator criteria
 */
export function filterAlbumsByCriteria(
  albums: Album[], 
  criteria: CuratorCriteria,
  excludeIds: Set<string> = new Set()
): { primary: Album[], secondary: Album[] } {
  // Filter out excluded albums first
  const availableAlbums = albums.filter(album => !excludeIds.has(album.id))
  
  // Apply constraints
  const constrainedAlbums = applyConstraints(availableAlbums, criteria.constraints)
  
  // Filter by primary criteria
  const primaryMatches = constrainedAlbums.filter(album => 
    matchesPreference(album, criteria.primary)
  )
  
  // Filter remaining albums by secondary criteria (if specified)
  let secondaryMatches: Album[] = []
  if (criteria.secondary) {
    const remainingAlbums = constrainedAlbums.filter(album => 
      !primaryMatches.includes(album)
    )
    secondaryMatches = remainingAlbums.filter(album => 
      matchesPreference(album, criteria.secondary!)
    )
  }
  
  return {
    primary: primaryMatches,
    secondary: secondaryMatches
  }
}

/**
 * Select a pair of albums using criteria-based filtering
 */
export function selectAlbumPair(
  albums: Album[], 
  criteria: CuratorCriteria,
  excludeIds: Set<string> = new Set()
): { album1: Album | null, album2: Album | null, metadata: { primaryMatches: number, secondaryMatches: number, totalAvailable: number } } {
  const { primary, secondary } = filterAlbumsByCriteria(albums, criteria, excludeIds)
  
  let album1: Album | null = null
  let album2: Album | null = null
  
  // Strategy 1: One from primary, one from secondary
  if (primary.length > 0 && secondary.length > 0) {
    album1 = selectRandomAlbum(primary)
    album2 = selectRandomAlbum(secondary)
  }
  // Strategy 2: Two from primary if no secondary matches
  else if (primary.length >= 2) {
    const shuffled = [...primary].sort(() => Math.random() - 0.5)
    album1 = shuffled[0]
    album2 = shuffled[1]
  }
  // Strategy 3: Two from secondary if no primary matches
  else if (secondary.length >= 2) {
    const shuffled = [...secondary].sort(() => Math.random() - 0.5)
    album1 = shuffled[0]
    album2 = shuffled[1]
  }
  // Strategy 4: Fallback to any available albums
  else {
    const availableAlbums = albums.filter(album => !excludeIds.has(album.id))
    if (availableAlbums.length >= 2) {
      const shuffled = [...availableAlbums].sort(() => Math.random() - 0.5)
      album1 = shuffled[0]
      album2 = shuffled[1]
    }
  }
  
  return {
    album1,
    album2,
    metadata: {
      primaryMatches: primary.length,
      secondaryMatches: secondary.length,
      totalAvailable: albums.filter(album => !excludeIds.has(album.id)).length
    }
  }
}

/**
 * Check if an album matches a preference (genres and vibes)
 */
function matchesPreference(album: Album, preference: { genres: string[], vibes: string[] }): boolean {
  // Check genre match
  const hasGenreMatch = preference.genres.length === 0 || 
    preference.genres.some(genre => album.genres.includes(genre))
  
  // Check vibe match
  const hasVibeMatch = preference.vibes.length === 0 || 
    preference.vibes.some(vibe => album.personal_vibes.includes(vibe))
  
  // Album matches if it has at least one genre OR one vibe match
  // (empty arrays mean no constraint)
  return hasGenreMatch || hasVibeMatch
}

/**
 * Apply constraints to filter albums
 */
function applyConstraints(albums: Album[], constraints?: CuratorConstraints): Album[] {
  if (!constraints) return albums
  
  return albums.filter(album => {
    // Exclude specific genres
    if (constraints.excludeGenres?.length) {
      const hasExcludedGenre = constraints.excludeGenres.some(genre => 
        album.genres.includes(genre)
      )
      if (hasExcludedGenre) return false
    }
    
    // Exclude specific vibes
    if (constraints.excludeVibes?.length) {
      const hasExcludedVibe = constraints.excludeVibes.some(vibe => 
        album.personal_vibes.includes(vibe)
      )
      if (hasExcludedVibe) return false
    }
    
    // Year range constraint
    if (constraints.yearRange) {
      if (album.year < constraints.yearRange.min || album.year > constraints.yearRange.max) {
        return false
      }
    }
    
    // Exclude specific artists
    if (constraints.excludeArtists?.length) {
      if (constraints.excludeArtists.includes(album.artist)) {
        return false
      }
    }
    
    return true
  })
}

/**
 * Select a random album from an array
 */
function selectRandomAlbum(albums: Album[]): Album {
  return albums[Math.floor(Math.random() * albums.length)]
}

/**
 * Create exclusion set from battle history
 */
export function createExclusionSet(
  history: Array<{ chosenAlbum: Album, rejectedAlbum: Album }>,
  albums: Album[],
  options: { 
    keepRecentChoices?: number 
    enableArtistDiversity?: boolean 
  } = {}
): Set<string> {
  const excludeIds = new Set<string>()
  
  // Add all shown albums to exclusion set
  history.forEach(choice => {
    excludeIds.add(choice.chosenAlbum.id)
    excludeIds.add(choice.rejectedAlbum.id)
  })
  
  // If we're running out of albums, only exclude recent choices
  const availableCount = albums.length - excludeIds.size
  if (availableCount < 2 && options.keepRecentChoices) {
    excludeIds.clear()
    const recentChoices = history.slice(-options.keepRecentChoices)
    recentChoices.forEach(choice => {
      excludeIds.add(choice.chosenAlbum.id)
      excludeIds.add(choice.rejectedAlbum.id)
    })
  }
  
  return excludeIds
}