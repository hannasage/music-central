import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'
import { Album } from '@/lib/types'
import OpenAI from 'openai'

interface BattleChoice {
  round: number
  chosenAlbum: Album
  rejectedAlbum: Album
  timestamp: Date
}

interface PreferenceInsight {
  category: string
  value: string
  confidence: number
}

export async function POST(request: NextRequest) {
  try {
    const { action, history = [], round = 1 } = await request.json()

    // Initialize OpenAI
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY environment variable is required')
    }
    
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    })

    // Get all albums from collection
    const supabase = createClient()
    const { data: albums, error } = await supabase
      .from('albums')
      .select('*')
      .order('artist', { ascending: true })

    if (error) {
      console.error('Error fetching albums:', error)
      return NextResponse.json(
        { error: 'Failed to fetch album collection' },
        { status: 500 }
      )
    }

    if (!albums || albums.length < 2) {
      return NextResponse.json({
        error: 'Need at least 2 albums in collection for battles'
      }, { status: 400 })
    }

    if (action === 'get_pair') {
      const pair = await getAlbumPairWithAI(albums, history, round, openai)
      const insights = history.length > 0 ? await analyzePreferencesWithAI(history, openai) : []
      
      return NextResponse.json({
        album1: pair[0],
        album2: pair[1],
        insights
      })
    }

    if (action === 'submit_choice') {
      const insights = await analyzePreferencesWithAI(history, openai)
      
      return NextResponse.json({
        success: true,
        insights
      })
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    )

  } catch (error) {
    console.error('Album battle API error:', error)
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

async function getAlbumPairWithAI(
  albums: Album[], 
  history: BattleChoice[], 
  round: number,
  openai: OpenAI
): Promise<[Album, Album]> {
  // Get list of albums already shown
  const shownAlbumIds = new Set<string>()
  history.forEach(choice => {
    shownAlbumIds.add(choice.chosenAlbum.id)
    shownAlbumIds.add(choice.rejectedAlbum.id)
  })

  // Filter out already shown albums
  let availableAlbums = albums.filter(album => !shownAlbumIds.has(album.id))

  // If we're running out of albums, reset the pool but keep recent choices
  if (availableAlbums.length < 2) {
    const recentChoices = history.slice(-Math.floor(albums.length / 3))
    const recentIds = new Set<string>()
    recentChoices.forEach(choice => {
      recentIds.add(choice.chosenAlbum.id)
      recentIds.add(choice.rejectedAlbum.id)
    })
    
    availableAlbums = albums.filter(album => !recentIds.has(album.id))
    if (availableAlbums.length < 2) {
      // Last resort: use all albums
      availableAlbums = albums
    }
  }

  if (round === 1 || history.length === 0) {
    // First round: random selection
    const shuffled = [...availableAlbums].sort(() => Math.random() - 0.5)
    return [shuffled[0], shuffled[1]]
  }

  // Use AI to select the most interesting album pair
  return await selectPairWithAI(availableAlbums, history, openai)
}

async function selectPairWithAI(
  availableAlbums: Album[], 
  history: BattleChoice[],
  openai: OpenAI
): Promise<[Album, Album]> {
  const chosenAlbums = history.map(choice => choice.chosenAlbum)
  const rejectedAlbums = history.map(choice => choice.rejectedAlbum)

  // Create simplified album descriptions for AI and shuffle them
  const shuffledAlbums = [...availableAlbums].sort(() => Math.random() - 0.5)
  const albumDescriptions = shuffledAlbums.map(album => ({
    id: album.id,
    artist: album.artist,
    title: album.title,
    year: album.year,
    genres: album.genres,
    vibes: album.personal_vibes || []
  })).slice(0, 50) // Limit to prevent token overflow

  const chosenDescriptions = chosenAlbums.map(album => 
    `"${album.title}" by ${album.artist} (${album.year}) - Genres: ${album.genres.join(', ')}${album.personal_vibes?.length ? `, Vibes: ${album.personal_vibes.join(', ')}` : ''}`
  )

  const rejectedDescriptions = rejectedAlbums.map(album => 
    `"${album.title}" by ${album.artist} (${album.year}) - Genres: ${album.genres.join(', ')}${album.personal_vibes?.length ? `, Vibes: ${album.personal_vibes.join(', ')}` : ''}`
  )

  const systemPrompt = `You are an expert music curator selecting album pairs for a preference learning game.

CHOSEN ALBUMS (you liked these):
${chosenDescriptions.join('\n')}

REJECTED ALBUMS (you didn't prefer these):
${rejectedDescriptions.join('\n')}

AVAILABLE ALBUMS:
${albumDescriptions.map((album, i) => `${i + 1}. "${album.title}" by ${album.artist} (${album.year}) - Genres: ${album.genres.join(', ')}${album.vibes.length ? `, Vibes: ${album.vibes.join(', ')}` : ''} [ID: ${album.id}]`).join('\n')}

Select TWO albums that will create an interesting choice for learning your preferences. Consider:
1. One album that aligns with emerging patterns from your chosen albums
2. One album that offers contrast or discovery potential
3. Make choices meaningful - avoid albums that are too similar or obviously different
4. Consider genre, era, vibe, and style patterns

Respond with ONLY a JSON object:
{
  "album1_id": "album_id_here",
  "album2_id": "album_id_here",
  "reasoning": "Brief explanation of why this pairing will reveal your preferences"
}`

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: 'Select the best album pair for this user.' }
      ],
      temperature: 0.7,
      max_tokens: 300
    })

    const content = response.choices[0]?.message?.content?.trim()
    if (!content) throw new Error('No response from OpenAI')

    const selection = JSON.parse(content)
    
    const album1 = availableAlbums.find(a => a.id === selection.album1_id)
    const album2 = availableAlbums.find(a => a.id === selection.album2_id)

    if (!album1 || !album2) {
      throw new Error('AI selected invalid album IDs')
    }

    console.log('AI Album Selection Reasoning:', selection.reasoning)
    return [album1, album2]

  } catch (error) {
    console.error('Error with AI album selection:', error)
    // Fallback to random selection
    const shuffled = [...availableAlbums].sort(() => Math.random() - 0.5)
    return [shuffled[0], shuffled[1]]
  }
}

async function analyzePreferencesWithAI(history: BattleChoice[], openai: OpenAI): Promise<PreferenceInsight[]> {
  if (history.length === 0) return []

  const chosenAlbums = history.map(choice => choice.chosenAlbum)
  const rejectedAlbums = history.map(choice => choice.rejectedAlbum)

  const chosenDescriptions = chosenAlbums.map(album => 
    `"${album.title}" by ${album.artist} (${album.year}) - Genres: ${album.genres.join(', ')}${album.personal_vibes?.length ? `, Vibes: ${album.personal_vibes.join(', ')}` : ''}`
  )

  const rejectedDescriptions = rejectedAlbums.map(album => 
    `"${album.title}" by ${album.artist} (${album.year}) - Genres: ${album.genres.join(', ')}${album.personal_vibes?.length ? `, Vibes: ${album.personal_vibes.join(', ')}` : ''}`
  )

  const systemPrompt = `You are an expert music preference analyst. Analyze music choices to extract key insights.

CHOSEN ALBUMS (${chosenAlbums.length} selections):
${chosenDescriptions.join('\n')}

REJECTED ALBUMS (${rejectedAlbums.length} rejections):
${rejectedDescriptions.join('\n')}

Analyze patterns and extract up to 6 key insights about your music preferences. Consider:
- Genre preferences and patterns
- Era/decade preferences  
- Mood and vibe patterns
- Artist diversity vs. focus
- Style evolution trends
- Any unique characteristics

For each insight, provide a confidence score (0.0-1.0) based on consistency of the pattern.

Respond with ONLY a JSON array:
[
  {
    "category": "Insight Category",
    "value": "Clear, specific insight about your taste",
    "confidence": 0.85
  }
]`

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: 'Analyze these music preferences and provide insights.' }
      ],
      temperature: 0.3,
      max_tokens: 500
    })

    const content = response.choices[0]?.message?.content?.trim()
    if (!content) throw new Error('No response from OpenAI')

    const insights = JSON.parse(content)
    
    // Validate and clean insights
    if (Array.isArray(insights)) {
      return insights
        .filter(insight => insight.category && insight.value && typeof insight.confidence === 'number')
        .slice(0, 6)
    }

    throw new Error('Invalid insights format')

  } catch (error) {
    console.error('Error with AI preference analysis:', error)
    
    // Fallback to basic analysis
    return getFallbackInsights(history)
  }
}

function getFallbackInsights(history: BattleChoice[]): PreferenceInsight[] {
  const insights: PreferenceInsight[] = []
  const chosenAlbums = history.map(choice => choice.chosenAlbum)

  // Basic genre analysis
  const genreCounts = new Map<string, number>()
  chosenAlbums.forEach(album => {
    album.genres.forEach(genre => {
      genreCounts.set(genre, (genreCounts.get(genre) || 0) + 1)
    })
  })

  const topGenre = Array.from(genreCounts.entries())
    .sort((a, b) => b[1] - a[1])[0]

  if (topGenre && topGenre[1] >= 2) {
    insights.push({
      category: 'Favorite Genre',
      value: topGenre[0],
      confidence: Math.min(topGenre[1] / history.length, 1)
    })
  }

  return insights.slice(0, 3)
}