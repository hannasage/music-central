import { tool } from '@openai/agents'
import { z } from 'zod'
import { ToolContext } from './types'

/**
 * Album Update Tool - Update album fields with granular control
 * Supports adding/removing items from arrays and setting scalar values
 */
export const createUpdateAlbumTool = (context: ToolContext) => {
  return tool({
    name: 'update_album_field',
    description: 'Update specific fields of an album with fine-grained control over operations',
    parameters: z.object({
      albumId: z.string().describe('The UUID of the album to update'),
      field: z.enum([
        'genres', 
        'personal_vibes', 
        'thoughts', 
        'title', 
        'artist', 
        'year', 
        'cover_art_url'
      ]).describe('The field to update'),
      operation: z.enum(['set', 'add', 'remove']).describe('How to update the field: set (replace), add (append to array), remove (from array)'),
      value: z.union([
        z.string(),
        z.number(),
        z.array(z.string())
      ]).describe('The value to set, add, or remove. For arrays: single string or array of strings. For scalars: string or number.')
    }),
    execute: async (input) => {
      try {
        // Validate UUID format
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
        if (!uuidRegex.test(input.albumId)) {
          return `Invalid album ID format. Please use the correct Database ID from the search results (should be a UUID like: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx)`
        }

        // Validate operations for different field types
        const arrayFields = ['genres', 'personal_vibes']
        const scalarFields = ['thoughts', 'title', 'artist', 'cover_art_url']
        const numberFields = ['year']

        if (arrayFields.includes(input.field)) {
          if (!['set', 'add', 'remove'].includes(input.operation)) {
            return `Invalid operation "${input.operation}" for array field "${input.field}". Use: set, add, or remove`
          }
        } else if (scalarFields.includes(input.field) || numberFields.includes(input.field)) {
          if (input.operation !== 'set') {
            return `Invalid operation "${input.operation}" for field "${input.field}". Only "set" is allowed for scalar fields`
          }
        }

        // First, get the current album data for array operations
        let currentAlbum = null
        if (arrayFields.includes(input.field) && ['add', 'remove'].includes(input.operation)) {
          const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
          const response = await fetch(`${siteUrl}/api/albums/${input.albumId}`, {
            method: 'GET',
            headers: {
              'Cookie': context.cookieStore.getAll().map(cookie => `${cookie.name}=${cookie.value}`).join('; ')
            }
          })

          if (!response.ok) {
            return `Error fetching album: Album not found or access denied`
          }

          const result = await response.json()
          currentAlbum = result.album
        }

        // Prepare the update data based on field type and operation
        const updateData: Record<string, unknown> = {}

        if (arrayFields.includes(input.field)) {
          const fieldArray = currentAlbum?.[input.field] || []
          
          if (input.operation === 'set') {
            // Set entire array - normalize input to array
            const newArray = Array.isArray(input.value) ? input.value : [String(input.value)]
            updateData[input.field] = newArray.map(v => String(v).toLowerCase())
          } else if (input.operation === 'add') {
            // Add to array - normalize input to array
            const toAdd = Array.isArray(input.value) ? input.value : [String(input.value)]
            const normalizedToAdd = toAdd.map(v => String(v).toLowerCase())
            
            // Remove duplicates and add new items
            const existingSet = new Set(fieldArray.map((v: string) => v.toLowerCase()))
            const newItems = normalizedToAdd.filter(item => !existingSet.has(item))
            
            if (newItems.length === 0) {
              return `No new items to add - all specified values already exist in ${input.field}`
            }
            
            updateData[input.field] = [...fieldArray, ...newItems]
          } else if (input.operation === 'remove') {
            // Remove from array - normalize input to array
            const toRemove = Array.isArray(input.value) ? input.value : [String(input.value)]
            const normalizedToRemove = new Set(toRemove.map(v => String(v).toLowerCase()))
            
            const filteredArray = fieldArray.filter((item: string) => 
              !normalizedToRemove.has(item.toLowerCase())
            )
            
            if (filteredArray.length === fieldArray.length) {
              return `No items removed - specified values not found in ${input.field}`
            }
            
            updateData[input.field] = filteredArray
          }
        } else if (numberFields.includes(input.field)) {
          // Handle number fields
          const numValue = typeof input.value === 'number' ? input.value : parseInt(String(input.value))
          if (isNaN(numValue)) {
            return `Invalid number value for ${input.field}: ${input.value}`
          }
          updateData[input.field] = numValue
        } else {
          // Handle scalar string fields
          updateData[input.field] = String(input.value)
        }

        // Make the API call to update the album
        const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
        const response = await fetch(`${siteUrl}/api/albums/${input.albumId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Cookie': context.cookieStore.getAll().map(cookie => `${cookie.name}=${cookie.value}`).join('; ')
          },
          body: JSON.stringify(updateData)
        })

        if (!response.ok) {
          const error = await response.json()
          return `Error updating album: ${error.error || 'Unknown error'}`
        }

        const result = await response.json()
        return result.message || 'Album updated successfully'
      } catch (error) {
        console.error('Update album tool error:', error)
        return `Error updating album: ${error instanceof Error ? error.message : 'Unknown error'}`
      }
    }
  })
}

// Factory function to create tool with context
export const updateAlbumTool = (context: ToolContext) => createUpdateAlbumTool(context)