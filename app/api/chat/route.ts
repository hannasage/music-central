import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { Agent, run } from '@openai/agents'
import { cookies } from 'next/headers'
import { 
  triggerVercelBuildTool, 
  checkBuildStatusTool,
  searchAlbumsTool,
  toggleFeaturedTool,
  ToolContext 
} from '@/lib/agent-tools'

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

    // Create tool context for context-dependent tools
    const toolContext: ToolContext = {
      supabase,
      cookieStore: {
        getAll: () => cookieStore.getAll(),
        set: (name, value, options) => cookieStore.set(name, value, options)
      }
    }

    // Initialize tools with context where needed
    const searchTool = searchAlbumsTool(toolContext)
    const toggleTool = toggleFeaturedTool(toolContext)

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

Build and Deployment Management:
- You can trigger production builds of the Music Central website when content changes are made
- Use trigger_vercel_build when the user makes significant changes to their collection data and wants to update the live site
- Always explain what the build will do before triggering it (regenerate static pages, deploy new content, etc.)
- Use check_build_status when the user wants to check on a deployment's progress
- Provide clear status updates and deployment URLs when builds complete
- If a build fails, help interpret the error and suggest next steps
- Common reasons to trigger builds: featured album changes, bulk collection updates, new content additions

Your personality:
- Knowledgeable about vinyl records, pressings, and music history
- Enthusiastic but respectful of their personal taste
- Focused on practical collection management
- Helpful with organizing and discovering music
- Conversational and friendly, like a knowledgeable record store owner

Always remember: This is THEIR personal collection. Ask questions about their preferences, help them organize what they have, and suggest additions that make sense for their specific taste and collection goals.`,
      tools: [searchTool, toggleTool, triggerVercelBuildTool, checkBuildStatusTool]
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