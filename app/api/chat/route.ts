import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import OpenAI from 'openai'
import { cookies } from 'next/headers'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

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

    // System prompt for the music assistant
    const systemPrompt = {
      role: 'system' as const,
      content: `You are a knowledgeable and enthusiastic music assistant for Music Central, a digital vinyl collection platform. Your personality is friendly, passionate about music, and helpful.

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

Keep responses conversational and engaging. You're here to enhance their musical journey!`
    }

    // Prepare messages for OpenAI
    const openaiMessages = [
      systemPrompt,
      ...messages.map((msg: ChatMessage) => ({
        role: msg.role,
        content: msg.content
      }))
    ]

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: openaiMessages,
      max_tokens: 500,
      temperature: 0.7,
    })

    const assistantMessage = completion.choices[0]?.message?.content

    if (!assistantMessage) {
      return NextResponse.json({ error: 'No response generated' }, { status: 500 })
    }

    return NextResponse.json({
      message: {
        role: 'assistant',
        content: assistantMessage
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