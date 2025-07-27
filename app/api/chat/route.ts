import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'
import { AIRecommendationService } from '@/lib/ai-recommendations'

export async function POST(request: NextRequest) {
  try {
    const { message, conversationHistory = [] } = await request.json()

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      )
    }

    // Get all albums from collection
    const supabase = createClient()
    const { data: albums, error } = await supabase
      .from('albums')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching albums:', error)
      return NextResponse.json(
        { error: 'Failed to fetch album collection' },
        { status: 500 }
      )
    }

    if (!albums || albums.length === 0) {
      return NextResponse.json({
        message: "It looks like your collection is empty! Add some albums first to get personalized recommendations.",
        recommendations: [],
        reasoning: []
      })
    }

    // Initialize AI service
    const aiService = new AIRecommendationService(albums)

    // Generate recommendations
    const response = await aiService.generateRecommendations(
      message,
      conversationHistory
    )

    // Validate that all recommendations exist in collection
    const recommendationIds = response.recommendations.map(r => r.id)
    const validation = aiService.validateRecommendations(recommendationIds)
    
    if (!validation) {
      console.warn('AI recommended albums not in collection:', recommendationIds)
    }

    return NextResponse.json({
      message: response.message,
      recommendations: response.recommendations,
      reasoning: response.reasoning,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Chat API error:', error)
    
    return NextResponse.json(
      { error: 'Failed to generate recommendations' },
      { status: 500 }
    )
  }
}

// Get conversation starters
export async function GET() {
  try {
    // Get albums to initialize AI service
    const supabase = createClient()
    const { data: albums, error } = await supabase
      .from('albums')
      .select('id, title, artist, genres, personal_vibes')
      .limit(100) // Just need a sample for starters

    if (error) {
      console.error('Error fetching albums for starters:', error)
      return NextResponse.json({
        starters: [
          "Surprise me with something good",
          "I'm feeling nostalgic today",
          "Recommend something energetic",
          "What's good for a chill evening?"
        ]
      })
    }

    if (!albums || albums.length === 0) {
      return NextResponse.json({
        starters: [
          "Add some albums to your collection first!",
          "Import your music to get started",
          "Build your collection for personalized recommendations"
        ]
      })
    }

    const aiService = new AIRecommendationService(albums)
    const starters = aiService.getConversationStarters()

    return NextResponse.json({ starters })

  } catch (error) {
    console.error('Error getting conversation starters:', error)
    
    return NextResponse.json({
      starters: [
        "Recommend something from my collection",
        "I'm in the mood for something new",
        "What matches my current vibe?",
        "Suggest albums I might have forgotten about"
      ]
    })
  }
}