import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'
import { Album } from '@/lib/types'

interface SearchFilters {
  genres?: string[]
  yearMin?: number
  yearMax?: number
  vibes?: string[]
}

interface SearchParams {
  q?: string
  filters?: SearchFilters
  page?: number
  limit?: number
  sortBy?: 'relevance' | 'year' | 'artist' | 'title'
  sortOrder?: 'asc' | 'desc'
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    const params: SearchParams = {
      q: searchParams.get('q') || undefined,
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '20'),
      sortBy: (searchParams.get('sortBy') as SearchParams['sortBy']) || 'relevance',
      sortOrder: (searchParams.get('sortOrder') as SearchParams['sortOrder']) || 'desc'
    }

    // Parse filters from query string
    const filtersParam = searchParams.get('filters')
    if (filtersParam) {
      try {
        params.filters = JSON.parse(filtersParam)
      } catch (e) {
        console.error('Error parsing filters:', e)
      }
    }

    const supabase = createClient()
    
    // First, let's check if we have any albums at all
    const { data: allAlbums, error: testError } = await supabase
      .from('albums')
      .select('id, title, artist')
      .limit(5)
    
    console.log('Database test:', { allAlbums, testError })
    
    let query = supabase.from('albums').select('*')

    // Text search
    if (params.q && params.q.trim()) {
      const searchTerm = params.q.trim()
      console.log('Searching for:', searchTerm)
      
      // Use simpler ILIKE search for better compatibility
      query = query.or(`title.ilike.%${searchTerm}%,artist.ilike.%${searchTerm}%`)
    } else {
      // If no search query but we have filters, or no query at all, show all albums
      console.log('No search query, showing all albums')
    }

    // Apply filters
    if (params.filters) {
      const { filters } = params

      // Genre filter
      if (filters.genres && filters.genres.length > 0) {
        query = query.overlaps('genres', filters.genres)
      }

      // Year range filter
      if (filters.yearMin !== undefined) {
        query = query.gte('year', filters.yearMin)
      }
      if (filters.yearMax !== undefined) {
        query = query.lte('year', filters.yearMax)
      }

      // Personal vibes filter
      if (filters.vibes && filters.vibes.length > 0) {
        query = query.overlaps('personal_vibes', filters.vibes)
      }
    }

    // Sorting
    switch (params.sortBy) {
      case 'year':
        query = query.order('year', { ascending: params.sortOrder === 'asc' })
        break
      case 'artist':
        query = query.order('artist', { ascending: params.sortOrder === 'asc' })
        break
      case 'title':
        query = query.order('title', { ascending: params.sortOrder === 'asc' })
        break
      case 'relevance':
      default:
        // For relevance, order by created_at desc if no search query, otherwise rely on textSearch ranking
        if (!params.q) {
          query = query.order('created_at', { ascending: false })
        }
        break
    }

    // Get total count first
    const { count } = await query

    // Then apply pagination
    const offset = ((params.page || 1) - 1) * (params.limit || 20)
    const { data: albums, error } = await query.range(offset, offset + (params.limit || 20) - 1)

    if (error) {
      console.error('Search error:', error)
      return NextResponse.json(
        { error: 'Search failed', details: error.message },
        { status: 500 }
      )
    }

    console.log('Search results:', { query: params.q, count, resultsLength: albums?.length })

    // Calculate relevance scores for client-side highlighting
    const results = albums?.map((album: Album) => ({
      ...album,
      _searchScore: calculateSearchScore(album, params.q || '')
    })) || []

    return NextResponse.json({
      results,
      pagination: {
        page: params.page || 1,
        limit: params.limit || 20,
        total: count || results.length,
        totalPages: Math.ceil((count || results.length) / (params.limit || 20))
      },
      query: params.q,
      filters: params.filters
    })

  } catch (error) {
    console.error('Search API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Simple search score calculation for highlighting
function calculateSearchScore(album: Album, searchTerm: string): number {
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

// Autocomplete/suggestions endpoint
export async function POST(request: NextRequest) {
  try {
    const { query } = await request.json()
    
    if (!query || query.length < 2) {
      return NextResponse.json({ suggestions: [] })
    }

    const supabase = createClient()
    
    // Get suggestions from titles and artists
    const { data: albums } = await supabase
      .from('albums')
      .select('title, artist')
      .or(`title.ilike.%${query}%,artist.ilike.%${query}%`)
      .limit(10)

    const suggestions = new Set<string>()
    
    albums?.forEach(album => {
      const titleMatch = album.title.toLowerCase().includes(query.toLowerCase())
      const artistMatch = album.artist.toLowerCase().includes(query.toLowerCase())
      
      if (titleMatch) suggestions.add(album.title)
      if (artistMatch) suggestions.add(album.artist)
    })

    return NextResponse.json({
      suggestions: Array.from(suggestions).slice(0, 8)
    })

  } catch (error) {
    console.error('Autocomplete error:', error)
    return NextResponse.json({ suggestions: [] })
  }
}