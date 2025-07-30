import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { Agent, run, tool } from '@openai/agents'
import { cookies } from 'next/headers'
import { z } from 'zod'

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          },
        },
      }
    )

    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { messages } = await request.json()

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: 'Messages array is required' }, { status: 400 })
    }

    // Create tools for album management
    const searchAlbumsTool = tool({
      name: 'search_albums',
      description: 'Search for albums in the collection by title, artist, or other criteria',
      parameters: z.object({
        query: z.string().describe('Search query - can be album title, artist name, or other search terms'),
        limit: z.number().optional().default(10).describe('Maximum number of results to return')
      }),
      execute: async (input) => {
        const { searchAlbumsForAgent } = await import('@/lib/search-service')
        return searchAlbumsForAgent(supabase, input.query, input.limit)
      }
    })

    const toggleFeaturedTool = tool({
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

          const response = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/albums/${input.albumId}/featured`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Cookie': cookieStore.getAll().map(cookie => `${cookie.name}=${cookie.value}`).join('; ')
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
          return `Error updating album featured status: ${error}`
        }
      }
    })

    // Create the vinyl collection assistant agent
    const musicAgent = new Agent({
      name: 'Vinyl Collection Assistant',
      instructions: `You are a personal vinyl collection assistant for the owner of Music Central. You help manage, organize, and enhance their vinyl record collection.

Your primary role:
- Help manage and organize their existing vinyl collection
- Suggest new additions based on their collection patterns and preferences
- Provide insights about albums they own or are considering
- Help identify gaps in their collection or missing releases
- Assist with cataloging and organizing their records
- Manage featured albums for the collection showcase

You have access to their complete vinyl collection and can:
- Search their existing albums by artist, title, genre, or year using the search_albums tool
- Analyze their collection for patterns and preferences
- Recommend new albums that complement what they already own
- Help find specific pressings, variants, or rare editions
- Provide detailed information about albums in their collection
- Mark albums as featured or remove featured status using the toggle_album_featured tool

Featured Album Management:
- You can help manage which albums are featured in the collection showcase
- When asked to feature an album, ALWAYS search for it first using search_albums to get the correct Database ID
- The Database ID is a UUID (like: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx) - use this exact ID with toggle_album_featured
- NEVER guess album IDs - always search first to get the correct Database ID
- You can feature multiple albums or remove featured status from albums
- Always confirm what you found in the search before making changes

Your personality:
- Knowledgeable about vinyl records, pressings, and music history
- Enthusiastic but respectful of their personal taste
- Focused on practical collection management
- Helpful with organizing and discovering music
- Conversational and friendly, like a knowledgeable record store owner

Always remember: This is THEIR personal collection. Ask questions about their preferences, help them organize what they have, and suggest additions that make sense for their specific taste and collection goals.`,
      tools: [searchAlbumsTool, toggleFeaturedTool]
    })

    // Get the latest user message
    const latestMessage = messages[messages.length - 1]
    if (!latestMessage || latestMessage.role !== 'user') {
      return NextResponse.json({ error: 'Latest message must be from user' }, { status: 400 })
    }

    // For now, we'll pass the conversation context as part of the input
    // This is a simplified approach - the Agents SDK handles conversation state differently
    let contextualInput = latestMessage.content
    
    if (messages.length > 1) {
      const conversationHistory = messages.slice(0, -1)
        .map(msg => `${msg.role}: ${msg.content}`)
        .join('\n')
      
      contextualInput = `Previous conversation:\n${conversationHistory}\n\nCurrent message: ${latestMessage.content}`
    }

    // Run the agent
    const result = await run(musicAgent, contextualInput)

    return NextResponse.json({
      message: {
        role: 'assistant',
        content: result.finalOutput
      }
    })

  } catch (error) {
    console.error('Chat API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}