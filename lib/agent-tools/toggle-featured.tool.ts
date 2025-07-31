import { tool } from '@openai/agents'
import { z } from 'zod'
import { ToolContext } from './types'

/**
 * Toggle Featured Tool - Manage featured album status securely
 * Validates UUID format and provides proper error handling
 */
export const createToggleFeaturedTool = (context: ToolContext) => {
  return tool({
    name: 'toggle_album_featured',
    description: 'Mark an album as featured or remove it from featured status',
    parameters: z.object({
      albumId: z.string().describe('The ID of the album to update'),
      featured: z.boolean().describe('Whether to mark the album as featured (true) or remove featured status (false)')
    }),
    execute: async (input) => {
      try {
        // Validate UUID format
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
        if (!uuidRegex.test(input.albumId)) {
          return `Invalid album ID format. Please use the correct Database ID from the search results (should be a UUID like: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx)`
        }

        // Get site URL from environment, fallback to localhost for development
        const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
        
        const response = await fetch(`${siteUrl}/api/albums/${input.albumId}/featured`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Cookie': context.cookieStore.getAll().map(cookie => `${cookie.name}=${cookie.value}`).join('; ')
          },
          body: JSON.stringify({ featured: input.featured })
        })

        if (!response.ok) {
          const error = await response.json()
          return `Error updating album: ${error.error || 'Unknown error'}`
        }

        const result = await response.json()
        return result.message
      } catch (error) {
        console.error('Toggle featured tool error:', error)
        return `Error updating album featured status: ${error instanceof Error ? error.message : 'Unknown error'}`
      }
    }
  })
}

// Factory function to create tool with context
export const toggleFeaturedTool = (context: ToolContext) => createToggleFeaturedTool(context)