import { tool } from '@openai/agents'
import { z } from 'zod'
import { ToolContext } from './types'

/**
 * Album Search Tool - Search vinyl collection with proper context
 * Provides secure access to album database with input validation
 */
export const createSearchAlbumsTool = (context: ToolContext) => {
  return tool({
    name: 'search_albums',
    description: 'Search for albums in the collection by title, artist, or other criteria',
    parameters: z.object({
      query: z.string().describe('Search query - can be album title, artist name, or other search terms'),
      limit: z.number().optional().default(10).describe('Maximum number of results to return')
    }),
    execute: async (input) => {
      try {
        // Input validation
        if (!input.query.trim()) {
          return 'Error: Search query cannot be empty'
        }

        if (input.limit && (input.limit < 1 || input.limit > 50)) {
          return 'Error: Search limit must be between 1 and 50'
        }

        const { searchAlbumsForAgent } = await import('@/lib/search-service')
        return await searchAlbumsForAgent(context.supabase, input.query, input.limit)
      } catch (error) {
        console.error('Album search tool error:', error)
        return `Error searching albums: ${error instanceof Error ? error.message : 'Unknown error'}`
      }
    }
  })
}

// Factory function to create tool with context
export const searchAlbumsTool = (context: ToolContext) => createSearchAlbumsTool(context)