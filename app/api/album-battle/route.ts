import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'
import { Album } from '@/lib/types'
import { sortAlbumsByArtist } from '@/lib/sorting'
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

    // Get all albums from collection (exclude removed albums)
    const supabase = createClient()
    const { data: allAlbums, error } = await supabase
      .from('albums')
      .select('*')
      .eq('removed', false)
    
    // Sort albums by artist (ignoring articles)
    const albums = allAlbums ? sortAlbumsByArtist(allAlbums) : []

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
    // First round: Use AI to select strategically opposing albums
    return await selectFirstPairWithAI(availableAlbums, openai)
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

async function selectFirstPairWithAI(
  availableAlbums: Album[], 
  openai: OpenAI
): Promise<[Album, Album]> {
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

  const systemPrompt = `You are an expert music curator selecting the perfect first pair of albums for a music preference discovery game.

AVAILABLE ALBUMS:
${albumDescriptions.map((album, i) => `${i + 1}. "${album.title}" by ${album.artist} (${album.year}) - Genres: ${album.genres.join(', ')}${album.vibes.length ? `, Vibes: ${album.vibes.join(', ')}` : ''} [ID: ${album.id}]`).join('\n')}

For the FIRST ROUND, select TWO albums that will maximize the learning potential by being strategically different. Consider:

1. Choose albums from different genres, eras, or styles that represent distinct listening paths
2. Avoid albums that are too similar (same artist, same genre, same era)
3. Avoid albums that are so different the choice is obvious (underground experimental vs mainstream pop)
4. Pick albums that could each appeal to different types of music lovers
5. Create a meaningful choice that will reveal significant preference information

The goal is to set up two different "listening journeys" - if someone picks Album A, what does that suggest about their taste vs if they pick Album B?

Respond with ONLY a JSON object:
{
  "album1_id": "album_id_here",
  "album2_id": "album_id_here",
  "reasoning": "Brief explanation of why this first pairing will kickstart effective preference learning"
}`

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: 'Select the best first pair of albums to start learning music preferences.' }
      ],
      temperature: 0.8,
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

    console.log('AI First Pair Selection Reasoning:', selection.reasoning)
    return [album1, album2]

  } catch (error) {
    console.error('Error with AI first pair selection:', error)
    // Fallback to strategic manual selection
    return selectStrategicFirstPair(availableAlbums)
  }
}

function selectStrategicFirstPair(availableAlbums: Album[]): [Album, Album] {
  // Group albums by decade and genre for strategic selection
  const albumsByDecade = new Map<number, Album[]>()
  const albumsByGenre = new Map<string, Album[]>()
  
  availableAlbums.forEach(album => {
    const decade = Math.floor(album.year / 10) * 10
    if (!albumsByDecade.has(decade)) {
      albumsByDecade.set(decade, [])
    }
    albumsByDecade.get(decade)!.push(album)
    
    album.genres.forEach(genre => {
      if (!albumsByGenre.has(genre)) {
        albumsByGenre.set(genre, [])
      }
      albumsByGenre.get(genre)!.push(album)
    })
  })
  
  // Try to find albums from different decades and genres
  const decades = Array.from(albumsByDecade.keys()).sort()
  const genres = Array.from(albumsByGenre.keys())
  
  if (decades.length >= 2 && genres.length >= 2) {
    // Pick from different decades and genres
    const earlyDecade = decades[0]
    const lateDecade = decades[decades.length - 1]
    
    const earlyAlbums = albumsByDecade.get(earlyDecade) || []
    const lateAlbums = albumsByDecade.get(lateDecade) || []
    
    if (earlyAlbums.length > 0 && lateAlbums.length > 0) {
      const album1 = earlyAlbums[Math.floor(Math.random() * earlyAlbums.length)]
      const album2 = lateAlbums[Math.floor(Math.random() * lateAlbums.length)]
      
      // Make sure they're not the same album
      if (album1.id !== album2.id) {
        return [album1, album2]
      }
    }
  }
  
  // Fallback to random selection
  const shuffled = [...availableAlbums].sort(() => Math.random() - 0.5)
  return [shuffled[0], shuffled[1]]
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

  const systemPrompt = `You are an expert music preference analyst who interprets deeper listening patterns and emotional connections to music.

MORE FAVORED ALBUMS (${chosenAlbums.length} selections):
${chosenDescriptions.join('\n')}

LESS FAVORED ALBUMS (${rejectedAlbums.length} rejections):
${rejectedDescriptions.join('\n')}

Analyze what these choices reveal about the user's deeper music preferences and listening psychology. Instead of listing genres and stats, interpret what these patterns suggest about:

- Musical sophistication level and listening depth
- Emotional connection style (nostalgic, energetic, contemplative, etc.)
- Discovery mindset vs comfort zone preferences
- How they likely experience and engage with music
- What draws them to certain artistic expressions
- Their balance between accessibility and complexity
- Whether they seek familiarity or novelty in their listening

Write a single, insightful paragraph (2-3 sentences) that captures their music listening personality and what motivates their choices. Focus on the "why" behind their preferences rather than the "what." 

Avoid simply stating genres, years, or artist names. Instead, interpret what those choices reveal about their inner musical preferences and emotional connections.

Write in second person ("you") with warmth and insight. Use an 8th grade reading level.

Respond with ONLY a JSON object:
{
  "summary": "Your interpretive insight about their musical psychology...",
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
  
  // Analyze diversity and patterns for interpretive insights
  const uniqueArtists = new Set(chosenAlbums.map(album => album.artist)).size
  const uniqueGenres = new Set(chosenAlbums.flatMap(album => album.genres)).size
  const years = chosenAlbums.map(album => album.year).sort((a, b) => a - b)
  const yearSpread = years[years.length - 1] - years[0]
  
  // Generate interpretive summary based on patterns
  let summary = ''
  
  if (uniqueArtists === chosenAlbums.length && uniqueGenres > 3) {
    summary = `You seem to be a musical explorer who values discovering new artists and sounds. Your choices suggest you enjoy variety and aren't bound by a single genre, preferring to let your ears guide you to interesting music regardless of category.`
  } else if (uniqueArtists < chosenAlbums.length * 0.7) {
    summary = `You appear to form strong connections with specific artists and their musical worlds. When you find something you like, you dive deeper, suggesting you value artistic consistency and the emotional familiarity that comes with favorite creators.`
  } else if (yearSpread < 15) {
    summary = `Your choices suggest you have a strong connection to a particular musical era that resonates with you. You seem drawn to the sounds and cultural energy of that time period, valuing the nostalgia and authenticity it brings to your listening experience.`
  } else if (yearSpread > 30) {
    summary = `You have a timeless approach to music that transcends decades. Your choices suggest you focus on the emotional core of songs rather than when they were made, appreciating how great music can connect across generations.`
  } else {
    summary = `Your musical choices show a thoughtful balance between familiar comfort and new discovery. You seem to appreciate both the emotional security of known sounds and the excitement of finding something that surprises you.`
  }

  return [{
    summary,
    confidence: Math.min(history.length / 7, 0.7) // Slightly lower confidence for fallback
  }]
}