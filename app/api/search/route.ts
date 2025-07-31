import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase'
import { Album } from '@/lib/types'
import { createErrorResponse, createSuccessResponse } from '@/lib/api-helpers'
import { searchAlbums, calculateSearchScore, type SearchOptions } from '@/lib/search-service'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    const searchOptions: SearchOptions = {
      query: searchParams.get('q') || undefined,
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '20'),
      sortBy: (searchParams.get('sortBy') as SearchOptions['sortBy']) || 'relevance',
      sortOrder: (searchParams.get('sortOrder') as SearchOptions['sortOrder']) || 'desc'
    }

    // Parse filters from query string
    const filtersParam = searchParams.get('filters')
    if (filtersParam) {
      try {
        searchOptions.filters = JSON.parse(filtersParam)
      } catch (e) {
        console.error('Error parsing filters:', e)
      }
    }

    const supabase = createClient()
    const result = await searchAlbums(supabase, searchOptions)

    // Calculate relevance scores for client-side highlighting
    const resultsWithScores = result.albums.map((album: Album) => ({
      ...album,
      _searchScore: calculateSearchScore(album, searchOptions.query || '')
    }))

    return createSuccessResponse({
      results: resultsWithScores,
      pagination: result.pagination,
      query: searchOptions.query,
      filters: searchOptions.filters
    })

  } catch (error) {
    console.error('Search API error:', error)
    return createErrorResponse('Search failed', 500, error instanceof Error ? error.message : undefined)
  }
}


// Autocomplete/suggestions endpoint
export async function POST(request: NextRequest) {
  try {
    const { query } = await request.json()
    
    if (!query || query.length < 2) {
      return createSuccessResponse({ suggestions: [] })
    }

    const supabase = createClient()
    
    // Get suggestions from titles and artists (exclude removed albums)
    const { data: albums } = await supabase
      .from('albums')
      .select('title, artist')
      .eq('removed', false)
      .or(`title.ilike.%${query}%,artist.ilike.%${query}%`)
      .limit(10)

    const suggestions = new Set<string>()
    
    albums?.forEach(album => {
      const titleMatch = album.title.toLowerCase().includes(query.toLowerCase())
      const artistMatch = album.artist.toLowerCase().includes(query.toLowerCase())
      
      if (titleMatch) suggestions.add(album.title)
      if (artistMatch) suggestions.add(album.artist)
    })

    return createSuccessResponse({
      suggestions: Array.from(suggestions).slice(0, 8)
    })

  } catch (error) {
    console.error('Autocomplete error:', error)
    return createSuccessResponse({ suggestions: [] })
  }
}