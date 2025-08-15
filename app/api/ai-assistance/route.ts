import { NextRequest } from 'next/server'
import { createErrorResponse, createSuccessResponse } from '@/lib/api-helpers'
import { z } from 'zod'

const aiAssistanceSchema = z.object({
  title: z.string().min(1, 'Album title is required'),
  artist: z.string().min(1, 'Artist name is required'),
  year: z.number().int().min(1900).max(new Date().getFullYear() + 1).optional(),
  selectedFields: z.array(z.enum(['genres', 'vibes', 'thoughts', 'artwork'])).min(1, 'At least one field must be selected')
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate request body
    const validation = aiAssistanceSchema.safeParse(body)
    if (!validation.success) {
      return createErrorResponse(
        `Validation error: ${validation.error.errors.map(e => e.message).join(', ')}`,
        400
      )
    }

    const { title, artist, year, selectedFields } = validation.data

    console.log(`🤖 AI assistance requested for "${title}" by ${artist}, fields: ${selectedFields.join(', ')}`)

    // Initialize response object
    const response: {
      genres?: string[]
      vibes?: string[]
      thoughts?: string
      artwork?: string
      confidence: number
      sources: string[]
    } = {
      confidence: 0,
      sources: []
    }

    // Handle artwork separately (Spotify + Tavily fallback)
    if (selectedFields.includes('artwork')) {
      console.log(`🎨 Fetching album artwork...`)
      const artworkUrl = await getAlbumArtwork(title, artist)
      if (artworkUrl) {
        response.artwork = artworkUrl
        response.sources.push('Spotify', 'Album artwork')
        response.confidence = Math.max(response.confidence, 0.9)
      }
    }

    // Handle metadata fields (genres, vibes, thoughts) using existing AI service
    const metadataFields = selectedFields.filter(field => ['genres', 'vibes', 'thoughts'].includes(field))
    if (metadataFields.length > 0) {
      // Create temporary album object for AI analysis
      const tempAlbum = {
        id: '',
        title: title.trim(),
        artist: artist.trim(),
        year: year || new Date().getFullYear(),
        genres: [],
        personal_vibes: [],
        thoughts: '',
        cover_art_url: undefined,
        streaming_links: {},
        tracks: [],
        featured: false,
        removed: false,
        descriptors: [],
        created_at: '',
        updated_at: ''
      }

      // Use AI service to generate suggestions
      const { AIBackfillService } = await import('@/lib/ai-backfill-service')
      const aiService = new AIBackfillService()
      
      console.log(`🔍 Generating AI suggestions using Tavily + OpenAI...`)
      const suggestions = await aiService.generateSuggestions(tempAlbum)
      console.log(`✨ AI suggestions generated with ${Math.round(suggestions.confidence * 100)}% confidence`)

      // Merge metadata suggestions
      if (selectedFields.includes('genres')) {
        response.genres = suggestions.genres
      }

      if (selectedFields.includes('vibes')) {
        response.vibes = suggestions.personalVibes
      }

      if (selectedFields.includes('thoughts')) {
        response.thoughts = suggestions.thoughts
      }

      // Update confidence and sources
      response.confidence = Math.max(response.confidence, suggestions.confidence)
      response.sources = [...new Set([...response.sources, ...suggestions.sources])]
    }

    return createSuccessResponse({
      suggestions: response,
      message: `AI suggestions generated for ${selectedFields.join(', ')}`
    })

  } catch (error) {
    console.error('AI assistance API error:', error)
    
    // Provide helpful error messages
    if (error instanceof Error) {
      if (error.message.includes('OPENAI_API_KEY')) {
        return createErrorResponse('AI service is not configured. Please check OpenAI API key.', 503)
      }
      if (error.message.includes('rate limit')) {
        return createErrorResponse('AI service is temporarily busy. Please try again in a moment.', 429)
      }
      return createErrorResponse(`AI assistance failed: ${error.message}`, 500)
    }
    
    return createErrorResponse('AI assistance service is temporarily unavailable', 503)
  }
}

/**
 * Get album artwork URL - tries Spotify first, then falls back to Tavily image search
 */
async function getAlbumArtwork(title: string, artist: string): Promise<string | null> {
  try {
    console.log(`🎨 Searching for artwork: "${title}" by ${artist}`)
    
    // Try Spotify first
    try {
      const { spotify } = await import('@/lib/spotify')
      const albumMatches = await spotify.findAlbumMatches(artist, title, 3)
      
      if (albumMatches.length > 0) {
        // Get the best match artwork
        const bestMatch = albumMatches[0]
        const artworkUrl = bestMatch.album.images?.[0]?.url
        
        if (artworkUrl) {
          console.log(`✅ Found artwork via Spotify: ${artworkUrl}`)
          return artworkUrl
        }
      }
    } catch (error) {
      console.log(`❌ Spotify artwork search failed:`, error)
    }

    // Fallback to Tavily image search
    try {
      if (!process.env.TAVILY_API_KEY || process.env.TAVILY_API_KEY === 'your_tavily_api_key_here') {
        console.log(`❌ Tavily not configured, skipping image search`)
        return null
      }

      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { tavily } = require('@tavily/core')
      const tavilyClient = tavily({ apiKey: process.env.TAVILY_API_KEY })

      const imageQuery = `"${artist}" "${title}" album cover art music`
      console.log(`🔍 Searching Tavily for images: ${imageQuery}`)

      const searchResults = await tavilyClient.search({
        query: imageQuery,
        search_depth: 'basic',
        max_results: 5,
        include_images: true,
        include_answer: false,
        include_raw_content: false
      })

      if (searchResults?.images?.length > 0) {
        // Get the first image result
        const imageUrl = searchResults.images[0]?.url
        if (imageUrl) {
          console.log(`✅ Found artwork via Tavily: ${imageUrl}`)
          return imageUrl
        }
      }
    } catch (error) {
      console.log(`❌ Tavily image search failed:`, error)
    }

    console.log(`❌ No artwork found for "${title}" by ${artist}`)
    return null

  } catch (error) {
    console.error('Artwork search error:', error)
    return null
  }
}