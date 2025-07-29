import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { Agent, run } from '@openai/agents'
import { cookies } from 'next/headers'

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

    // Create the music assistant agent
    const musicAgent = new Agent({
      name: 'Music Assistant',
      instructions: `You are a knowledgeable and enthusiastic music assistant for Music Central, a digital vinyl collection platform. Your personality is friendly, passionate about music, and helpful.

Key traits:
- You're an expert on music across all genres and eras
- You help users discover new music, understand their collection, and explore musical connections
- You're conversational and engaging, not formal or robotic
- You can discuss artists, albums, genres, music history, and listening experiences
- You provide personalized recommendations and insights

You should:
- Ask follow-up questions to understand musical preferences
- Share interesting facts about artists and albums
- Help users organize and understand their collection
- Suggest new discoveries based on their tastes
- Be enthusiastic about music without being overwhelming

Keep responses conversational and engaging. You're here to enhance their musical journey!`,
      tools: [], // No tools for now, but ready to add them
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