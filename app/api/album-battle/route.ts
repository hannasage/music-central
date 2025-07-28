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
  summary: string
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

  const systemPrompt = `You are an expert music preference analyst. Analyze music choices to create a cohesive summary of the user's music taste.

MORE FAVORED ALBUMS (${chosenAlbums.length} selections):
${chosenDescriptions.join('\n')}

LESS FAVORED ALBUMS (${rejectedAlbums.length} rejections):
${rejectedDescriptions.join('\n')}

Analyze the patterns in their choices and write a single, cohesive paragraph (2-3 sentences) that captures their music taste. Consider:
- Genre preferences and patterns
- Era/decade preferences  
- Mood and vibe patterns
- Artist diversity vs. focus
- Style evolution trends
- Any unique characteristics

Don't overly focus on the less favored section in analyzing the user's listening taste. 
Don't point out specific examples of albums, only point out artists.


Write in second person ("you") and make it concise and impactful. Use an 8th grade reading level when writing.

Respond with ONLY a JSON object:
{
  "summary": "Your cohesive paragraph summary here...",
  "confidence": 0.85
}`

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: 'Analyze these music preferences and provide a cohesive summary.' }
      ],
      temperature: 0.7,
      max_tokens: 400
    })

    const content = response.choices[0]?.message?.content?.trim()
    if (!content) throw new Error('No response from OpenAI')

    const insight = JSON.parse(content)
    
    // Validate the single insight object
    if (insight.summary && typeof insight.confidence === 'number') {
      return [insight]
    }

    throw new Error('Invalid insight format')

  } catch (error) {
    console.error('Error with AI preference analysis:', error)
    
    // Fallback to basic analysis
    return getFallbackInsights(history)
  }
}

function getFallbackInsights(history: BattleChoice[]): PreferenceInsight[] {
  const chosenAlbums = history.map(choice => choice.chosenAlbum)
  
  // Basic genre analysis
  const genreCounts = new Map<string, number>()
  chosenAlbums.forEach(album => {
    album.genres.forEach(genre => {
      genreCounts.set(genre, (genreCounts.get(genre) || 0) + 1)
    })
  })

  const topGenres = Array.from(genreCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 2)
    .map(([genre]) => genre)

  // Basic era analysis
  const years = chosenAlbums.map(album => album.year).sort((a, b) => a - b)
  const avgYear = Math.round(years.reduce((sum, year) => sum + year, 0) / years.length)
  const decade = Math.floor(avgYear / 10) * 10

  let summary = `Based on your ${history.length} choices, you show a preference for ${topGenres.join(' and ')} music`
  if (topGenres.length > 0) {
    summary += `, particularly from the ${decade}s era`
  }
  summary += '. Your taste appears to favor '
  
  // Add some variety based on album diversity
  const uniqueArtists = new Set(chosenAlbums.map(album => album.artist)).size
  if (uniqueArtists === chosenAlbums.length) {
    summary += 'diverse artists and exploring different sounds.'
  } else {
    summary += 'certain artists or similar musical styles.'
  }

  return [{
    summary,
    confidence: Math.min(history.length / 5, 0.8)
  }]
}