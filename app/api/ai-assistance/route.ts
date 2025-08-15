import { NextRequest } from 'next/server'
import { createErrorResponse, createSuccessResponse } from '@/lib/api-helpers'
import { z } from 'zod'

const aiAssistanceSchema = z.object({
  title: z.string().min(1, 'Album title is required'),
  artist: z.string().min(1, 'Artist name is required'),
  year: z.number().int().min(1900).max(new Date().getFullYear() + 1).optional(),
  selectedFields: z.array(z.enum(['genres', 'vibes', 'thoughts'])).min(1, 'At least one field must be selected')
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

    // Create temporary album object for AI analysis
    const tempAlbum = {
      id: '',
      title: title.trim(),
      artist: artist.trim(),
      year: year || new Date().getFullYear(),
      genres: [],
      personal_vibes: [],
      thoughts: '',
      cover_art_url: null,
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

    // Filter response to only include requested fields
    const response: {
      genres?: string[]
      vibes?: string[]
      thoughts?: string
      confidence: number
      sources: string[]
    } = {
      confidence: suggestions.confidence,
      sources: suggestions.sources
    }

    if (selectedFields.includes('genres')) {
      response.genres = suggestions.genres
    }

    if (selectedFields.includes('vibes')) {
      response.vibes = suggestions.personalVibes
    }

    if (selectedFields.includes('thoughts')) {
      response.thoughts = suggestions.thoughts
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