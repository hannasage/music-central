import { Album } from './types'

export interface SearchFilters {
  genres?: string[]
  yearMin?: number
  yearMax?: number
  vibes?: string[]
}

export interface SearchOptions {
  query?: string
  filters?: SearchFilters
  page?: number
  limit?: number
  sortBy?: 'relevance' | 'year' | 'artist' | 'title'
  sortOrder?: 'asc' | 'desc'
  includeRemoved?: boolean // For agent searches to see removed albums
}

export interface SearchResult {
  albums: Album[]
  total: number
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

// Flexible search function that can be used by both API routes and agent tools
export async function searchAlbums(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  options: SearchOptions
): Promise<SearchResult> {
  const {
    query,
    filters,
    page = 1,
    limit = 20,
    sortBy = 'relevance',
    sortOrder = 'desc',
    includeRemoved = false
  } = options

  let dbQuery = supabase.from('albums').select('*', { count: 'exact' })
  
  // Filter by removed status unless explicitly requested to include removed albums
  if (!includeRemoved) {
    dbQuery = dbQuery.eq('removed', false)
  }

  // Text search with multiple strategies
  if (query && query.trim()) {
    const searchTerm = query.trim()
    const words = searchTerm.split(' ').filter(word => word.length > 0)
    
    if (words.length === 1) {
      // Single word: search in title or artist
      dbQuery = dbQuery.or(`title.ilike.%${searchTerm}%,artist.ilike.%${searchTerm}%`)
    } else if (words.length === 2) {
      // Two words: try exact phrase OR cross-field matching (word1 in title, word2 in artist OR vice versa)
      const [word1, word2] = words
      const searchPattern = `or(title.ilike.%${searchTerm}%,artist.ilike.%${searchTerm}%,and(title.ilike.%${word1}%,artist.ilike.%${word2}%),and(title.ilike.%${word2}%,artist.ilike.%${word1}%))`
      dbQuery = dbQuery.or(searchPattern)
    } else {
      // Multiple words: try exact phrase match first, then all-words-must-appear approach
      const allWordsPattern = words.map(word => `or(title.ilike.%${word}%,artist.ilike.%${word}%)`).join(',')
      const searchPattern = `or(title.ilike.%${searchTerm}%,artist.ilike.%${searchTerm}%,and(${allWordsPattern}))`
      dbQuery = dbQuery.or(searchPattern)
    }
  }

  // Apply filters
  if (filters) {
    if (filters.genres && filters.genres.length > 0) {
      dbQuery = dbQuery.overlaps('genres', filters.genres)
    }

    if (filters.yearMin !== undefined) {
      dbQuery = dbQuery.gte('year', filters.yearMin)
    }
    if (filters.yearMax !== undefined) {
      dbQuery = dbQuery.lte('year', filters.yearMax)
    }

    if (filters.vibes && filters.vibes.length > 0) {
      dbQuery = dbQuery.overlaps('personal_vibes', filters.vibes)
    }
  }

  // Apply sorting
  switch (sortBy) {
    case 'year':
      dbQuery = dbQuery.order('year', { ascending: sortOrder === 'asc' })
      break
    case 'title':
      dbQuery = dbQuery.order('title', { ascending: sortOrder === 'asc' })
      break
    case 'artist':
      dbQuery = dbQuery.order('artist', { ascending: sortOrder === 'asc' })
      break
    case 'relevance':
    default:
      if (!query) {
        dbQuery = dbQuery.order('created_at', { ascending: false })
      }
      break
  }

  // Get total count
  const { count } = await dbQuery

  // Apply pagination
  const offset = (page - 1) * limit
  const { data: albums, error } = await dbQuery.range(offset, offset + limit - 1)

  if (error) {
    throw new Error(`Search failed: ${error.message}`)
  }

  return {
    albums: albums || [],
    total: count || 0,
    pagination: {
      page,
      limit,
      total: count || 0,
      totalPages: Math.ceil((count || 0) / limit)
    }
  }
}

// Simple search for agent tools - returns formatted string
export async function searchAlbumsForAgent(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  query: string,
  limit: number = 10
): Promise<string> {
  try {
    const result = await searchAlbums(supabase, {
      query,
      limit,
      page: 1,
      includeRemoved: true // Agent searches should see removed albums
    })

    if (result.albums.length === 0) {
      return `No albums found matching "${query}". Try searching for individual words like the artist name or part of the album title.`
    }

    const results = result.albums.map(album => {
      const status = album.removed ? 'REMOVED (previously owned)' : 'In Collection'
      const featuredStatus = album.removed ? 'N/A' : (album.featured ? 'Yes' : 'No')
      
      return `"${album.title}" by ${album.artist} (${album.year})\n  Database ID: ${album.id}\n  Status: ${status}\n  Featured: ${featuredStatus}`
    }).join('\n\n')
    
    return `Found ${result.albums.length} album(s):\n\n${results}\n\nTo feature/unfeature an album, use the Database ID shown above.`
  } catch (error) {
    return `Error searching albums: ${error}`
  }
}

// Calculate search relevance score for highlighting
export function calculateSearchScore(album: Album, searchTerm: string): number {
  if (!searchTerm) return 0

  const term = searchTerm.toLowerCase()
  let score = 0

  // Title match (highest weight)
  if (album.title.toLowerCase().includes(term)) {
    score += 10
    if (album.title.toLowerCase().startsWith(term)) score += 5
  }

  // Artist match (high weight)
  if (album.artist.toLowerCase().includes(term)) {
    score += 8
    if (album.artist.toLowerCase().startsWith(term)) score += 4
  }

  // Genre match (medium weight)
  album.genres.forEach(genre => {
    if (genre.toLowerCase().includes(term)) {
      score += 3
    }
  })

  // Personal vibes match (low weight)
  album.personal_vibes.forEach(vibe => {
    if (vibe.toLowerCase().includes(term)) {
      score += 1
    }
  })

  return score
}