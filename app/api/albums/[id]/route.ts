import { NextRequest } from 'next/server'
import { withAuth, createErrorResponse, createSuccessResponse } from '@/lib/api-helpers'
import { validateAlbumUpdate, sanitizeStringArray } from '@/lib/validation'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    return await withAuth(async (user, supabase) => {
      const body = await request.json()
      
      // Validate the update data
      const validation = validateAlbumUpdate(body, false) // false = full update
      if (!validation.success) {
        return createErrorResponse(`Validation failed: ${validation.error}`, 400)
      }

      const updates = validation.data!

      // Sanitize array fields if they exist
      if (updates.genres) {
        updates.genres = sanitizeStringArray(updates.genres)
      }
      if (updates.personal_vibes) {
        updates.personal_vibes = sanitizeStringArray(updates.personal_vibes)
      }

      // Update the album
      const { data: album, error } = await supabase
        .from('albums')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) {
        console.error('Error updating album:', error)
        if (error.code === 'PGRST116') {
          return createErrorResponse('Album not found', 404)
        }
        return createErrorResponse('Failed to update album', 500)
      }

      if (!album) {
        return createErrorResponse('Album not found', 404)
      }

      return createSuccessResponse({
        message: `Album "${album.title}" by ${album.artist} has been updated successfully`,
        album
      })
    })

  } catch (error) {
    console.error('Album update API error:', error)
    return createErrorResponse('Internal server error', 500)
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    return await withAuth(async (user, supabase) => {
      const body = await request.json()
      
      // Validate the partial update data
      const validation = validateAlbumUpdate(body, true) // true = partial update
      if (!validation.success) {
        return createErrorResponse(`Validation failed: ${validation.error}`, 400)
      }

      const updates = validation.data!

      // Check if there's actually something to update
      if (Object.keys(updates).length === 0) {
        return createErrorResponse('At least one field must be provided for update', 400)
      }

      // Sanitize array fields if they exist
      if (updates.genres) {
        updates.genres = sanitizeStringArray(updates.genres)
      }
      if (updates.personal_vibes) {
        updates.personal_vibes = sanitizeStringArray(updates.personal_vibes)
      }

      // Update the album
      const { data: album, error } = await supabase
        .from('albums')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) {
        console.error('Error updating album:', error)
        if (error.code === 'PGRST116') {
          return createErrorResponse('Album not found', 404)
        }
        return createErrorResponse('Failed to update album', 500)
      }

      if (!album) {
        return createErrorResponse('Album not found', 404)
      }

      // Create a detailed update message
      const updatedFields = Object.keys(updates)
      const fieldList = updatedFields.join(', ')
      
      return createSuccessResponse({
        message: `Album "${album.title}" by ${album.artist} has been updated. Updated fields: ${fieldList}`,
        album,
        updatedFields
      })
    })

  } catch (error) {
    console.error('Album patch API error:', error)
    return createErrorResponse('Internal server error', 500)
  }
}

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