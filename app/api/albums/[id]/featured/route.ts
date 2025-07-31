import { NextRequest } from 'next/server'
import { withAuth, createErrorResponse, createSuccessResponse } from '@/lib/api-helpers'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    return await withAuth(async (user, supabase) => {
      const { featured } = await request.json()

      if (typeof featured !== 'boolean') {
        return createErrorResponse('Featured must be a boolean value', 400)
      }

      // Check if album exists and is not removed
      const { data: existingAlbum, error: fetchError } = await supabase
        .from('albums')
        .select('id, title, artist, removed')
        .eq('id', id)
        .single()

      if (fetchError || !existingAlbum) {
        return createErrorResponse('Album not found', 404)
      }

      if (existingAlbum.removed) {
        return createErrorResponse('Cannot modify featured status of removed albums', 400)
      }

      // Update the album's featured status
      const { data: album, error } = await supabase
        .from('albums')
        .update({ featured })
        .eq('id', id)
        .eq('removed', false) // Extra safety check
        .select()
        .single()

      if (error) {
        console.error('Error updating album featured status:', error)
        return createErrorResponse('Failed to update album', 500)
      }

      if (!album) {
        return createErrorResponse('Album not found or already removed', 404)
      }

      return createSuccessResponse({
        message: `Album "${album.title}" by ${album.artist} ${featured ? 'marked as featured' : 'removed from featured'}`,
        album
      })
    })

  } catch (error) {
    console.error('Featured toggle API error:', error)
    return createErrorResponse('Internal server error', 500)
  }
}