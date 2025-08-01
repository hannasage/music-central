import { NextRequest } from 'next/server'
import { withAuth, createErrorResponse, createSuccessResponse } from '@/lib/api-helpers'
import { z } from 'zod'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    return await withAuth(async (user, supabase) => {
      const { data: album, error } = await supabase
        .from('albums')
        .select('*')
        .eq('id', id)
        .single()

      if (error) {
        console.error('Error fetching album:', error)
        if (error.code === 'PGRST116') {
          return createErrorResponse('Album not found', 404)
        }
        return createErrorResponse('Failed to fetch album', 500)
      }

      if (!album) {
        return createErrorResponse('Album not found', 404)
      }

      return createSuccessResponse({ album })
    })

  } catch (error) {
    console.error('Album fetch API error:', error)
    return createErrorResponse('Internal server error', 500)
  }
}

// Validation schemas for album updates
const streamingLinksSchema = z.object({
  spotify: z.string().url().optional(),
  apple_music: z.string().url().optional(),
  youtube_music: z.string().url().optional()
}).optional()

const albumUpdateSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  artist: z.string().min(1).max(200).optional(),
  year: z.number().int().min(1900).max(new Date().getFullYear() + 10).optional(),
  genres: z.array(z.string().min(1).max(50)).optional(),
  personal_vibes: z.array(z.string().min(1).max(50)).optional(),
  thoughts: z.string().max(5000).optional(),
  cover_art_url: z.string().url().optional(),
  streaming_links: streamingLinksSchema,
  removed: z.boolean().optional(),
  featured: z.boolean().optional()
}).refine(
  (data) => Object.keys(data).length > 0,
  { message: "At least one field must be provided for update" }
)

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(id)) {
      return createErrorResponse('Invalid album ID format', 400)
    }

    const body = await request.json()
    
    // Validate request body
    const validation = albumUpdateSchema.safeParse(body)
    if (!validation.success) {
      return createErrorResponse(
        `Validation error: ${validation.error.errors.map(e => e.message).join(', ')}`,
        400
      )
    }

    const updateData = validation.data

    // Normalize array fields to lowercase for consistency
    if (updateData.genres) {
      updateData.genres = updateData.genres.map(g => g.toLowerCase())
    }
    if (updateData.personal_vibes) {
      updateData.personal_vibes = updateData.personal_vibes.map(v => v.toLowerCase())
    }

    return await withAuth(async (user, supabase) => {
      // Check if album exists first
      const { data: existingAlbum, error: fetchError } = await supabase
        .from('albums')
        .select('id, title, artist')
        .eq('id', id)
        .single()

      if (fetchError || !existingAlbum) {
        return createErrorResponse('Album not found', 404)
      }

      // Perform the update
      const { data: album, error: updateError } = await supabase
        .from('albums')
        .update(updateData)
        .eq('id', id)
        .select()
        .single()

      if (updateError) {
        console.error('Error updating album:', updateError)
        return createErrorResponse('Failed to update album', 500)
      }

      const updatedFields = Object.keys(updateData).join(', ')
      return createSuccessResponse({ 
        album,
        message: `Successfully updated ${updatedFields} for "${existingAlbum.title}" by ${existingAlbum.artist}`
      })
    })

  } catch (error) {
    console.error('Album update API error:', error)
    return createErrorResponse('Internal server error', 500)
  }
}