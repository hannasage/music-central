import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'
import { Album, CuratorCriteria, CollectionMetadata } from '@/lib/types'
import { sortAlbumsByArtist } from '@/lib/sorting'
import { logger } from '@/lib/logger'
import {
  extractCollectionMetadata,
  selectAlbumPair,
  createExclusionSet
} from '@/lib/curator-criteria'
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
      logger.dbError('fetch albums for AI curator', error, { action: 'get_pair' })
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
      const { selection, reasoning } = await getBattlePairWithCriteria(albums, history, round, openai)
      const insights = history.length > 0 ? await analyzePreferencesWithAI(history, openai) : []
      
      if (!selection.album1 || !selection.album2) {
        return NextResponse.json({
          error: 'Unable to find suitable album pair'
        }, { status: 400 })
      }
      
      return NextResponse.json({
        album1: selection.album1,
        album2: selection.album2,
        insights,
        pairReasoning: reasoning,
        selectionMetadata: selection.metadata
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
    logger.criticalApiError('/api/ai-curator', error as Error, { action: 'ai_curator_request' })
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

async function getBattlePairWithCriteria(
  albums: Album[], 
  history: BattleChoice[], 
  round: number,
  openai: OpenAI
): Promise<{ selection: { album1: Album | null, album2: Album | null, metadata: { primaryMatches: number, secondaryMatches: number, totalAvailable: number } }, reasoning: string }> {
  // Extract collection metadata
  const collectionMetadata = extractCollectionMetadata(albums)
  
  // Create exclusion set from history
  const excludeIds = createExclusionSet(history, albums, {
    keepRecentChoices: Math.floor(albums.length / 3),
    enableArtistDiversity: true
  })

  let criteria: CuratorCriteria
  let selection: { album1: Album | null, album2: Album | null, metadata: { primaryMatches: number, secondaryMatches: number, totalAvailable: number } }
  
  if (round === 1 || history.length === 0) {
    // First round: Use AI to select strategic criteria
    criteria = await generateStrategicOpenerCriteria(collectionMetadata, openai)
    selection = selectAlbumPair(albums, criteria, excludeIds)
  } else {
    // Use AI to generate personalized criteria
    criteria = await generatePersonalizedCriteria(collectionMetadata, history, openai)
    selection = selectAlbumPair(albums, criteria, excludeIds)
  }
  
  // Generate reasoning based on actual selected albums
  if (selection.album1 && selection.album2) {
    const albumSpecificReasoning = await generateAlbumPairReasoning(
      selection.album1, 
      selection.album2, 
      history.length === 0,
      openai
    )
    return { selection, reasoning: albumSpecificReasoning }
  }
  
  return { selection, reasoning: "These albums offer an interesting contrast to explore your music preferences." }
}

async function generatePersonalizedCriteria(
  metadata: CollectionMetadata,
  history: BattleChoice[],
  openai: OpenAI
): Promise<CuratorCriteria> {
  const chosenAlbums = history.map(choice => choice.chosenAlbum)
  const rejectedAlbums = history.map(choice => choice.rejectedAlbum)

  const chosenDescriptions = chosenAlbums.map(album => 
    `"${album.title}" by ${album.artist} (${album.year}) - Genres: ${album.genres.join(', ')}${album.personal_vibes?.length ? `, Vibes: ${album.personal_vibes.join(', ')}` : ''}`
  )

  const rejectedDescriptions = rejectedAlbums.map(album => 
    `"${album.title}" by ${album.artist} (${album.year}) - Genres: ${album.genres.join(', ')}${album.personal_vibes?.length ? `, Vibes: ${album.personal_vibes.join(', ')}` : ''}`
  )

  const systemPrompt = `You are an expert music curator creating selection criteria for a preference learning game.

CHOSEN ALBUMS (user liked these):
${chosenDescriptions.join('\n')}

REJECTED ALBUMS (user didn't prefer these):
${rejectedDescriptions.join('\n')}

AVAILABLE GENRES: ${metadata.availableGenres.join(', ')}
AVAILABLE VIBES: ${metadata.availableVibes.join(', ')}
YEAR RANGE: ${metadata.yearRange.min} - ${metadata.yearRange.max}

Based on the user's preferences, create criteria to select two interesting albums. Think about:
1. What patterns do you see in their chosen albums?
2. What would create a meaningful choice that reveals more about their taste?
3. Balance familiarity with discovery potential

Create PRIMARY criteria (for one album that matches their preferences) and SECONDARY criteria (for contrast/discovery).

Respond with ONLY a JSON object:
{
  "primary": {
    "genres": ["genre1", "genre2"],
    "vibes": ["vibe1", "vibe2"],
    "weight": 0.8
  },
  "secondary": {
    "genres": ["different_genre"],
    "vibes": ["different_vibe"],
    "weight": 0.6
  },
  "constraints": {
    "excludeGenres": ["genre_to_avoid"],
    "artistDiversity": true
  },
  "reasoning": "One sentence explaining this pairing strategy for the user"
}`

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: 'Generate selection criteria for this user.' }
      ],
      temperature: 0.7,
      max_tokens: 400
    })

    const content = response.choices[0]?.message?.content?.trim()
    if (!content) throw new Error('No response from OpenAI')

    const criteria = JSON.parse(content) as CuratorCriteria
    console.log('AI Generated Criteria:', criteria.reasoning)
    return criteria

  } catch (error) {
    logger.agentError('AI criteria generation', error as Error, { 
      endpoint: '/api/ai-curator',
      operation: 'generatePersonalizedCriteria',
      historyLength: history.length 
    })
    
    // Fallback to basic criteria based on user's choices
    return generateFallbackPersonalizedCriteria(chosenAlbums, metadata)
  }
}

async function generateStrategicOpenerCriteria(
  metadata: CollectionMetadata,
  openai: OpenAI
): Promise<CuratorCriteria> {
  const systemPrompt = `You are an expert music curator creating selection criteria for the first round of a music preference discovery game.

AVAILABLE GENRES: ${metadata.availableGenres.join(', ')}
AVAILABLE VIBES: ${metadata.availableVibes.join(', ')}
YEAR RANGE: ${metadata.yearRange.min} - ${metadata.yearRange.max}
TOTAL ALBUMS: ${metadata.totalAlbums}

For the FIRST ROUND, create criteria that will select two albums representing different "listening journeys". The goal is to set up a meaningful choice that reveals significant preference information.

Consider:
1. Different genres, eras, or styles that appeal to different types of music lovers
2. Avoid criteria that are too similar (same genre family)
3. Avoid criteria that are so different the choice is obvious
4. Create distinct paths that will inform future selections

Create PRIMARY criteria (one direction) and SECONDARY criteria (different direction) to maximize learning potential.

Respond with ONLY a JSON object:
{
  "primary": {
    "genres": ["genre1", "genre2"],
    "vibes": ["vibe1", "vibe2"],
    "weight": 0.8
  },
  "secondary": {
    "genres": ["different_genre"],
    "vibes": ["different_vibe"],
    "weight": 0.8
  },
  "constraints": {
    "artistDiversity": true
  },
  "reasoning": "One sentence explaining this strategic first pairing to the user"
}`

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: 'Generate strategic opener criteria.' }
      ],
      temperature: 0.8,
      max_tokens: 400
    })

    const content = response.choices[0]?.message?.content?.trim()
    if (!content) throw new Error('No response from OpenAI')

    const criteria = JSON.parse(content) as CuratorCriteria
    console.log('AI Strategic Criteria:', criteria.reasoning)
    return criteria

  } catch (error) {
    logger.agentError('AI strategic criteria generation', error as Error, { 
      endpoint: '/api/ai-curator',
      operation: 'generateStrategicOpenerCriteria'
    })
    
    // Fallback to strategic criteria based on available genres/vibes
    return generateFallbackStrategicCriteria(metadata)
  }
}

// Fallback criteria generation functions
function generateFallbackPersonalizedCriteria(chosenAlbums: Album[], metadata: CollectionMetadata): CuratorCriteria {
  // Analyze user's chosen albums to create basic criteria
  const favoriteGenres = new Set<string>()
  const favoriteVibes = new Set<string>()
  
  chosenAlbums.forEach(album => {
    album.genres.forEach(genre => favoriteGenres.add(genre))
    album.personal_vibes.forEach(vibe => favoriteVibes.add(vibe))
  })
  
  const primaryGenres = Array.from(favoriteGenres).slice(0, 2)
  const primaryVibes = Array.from(favoriteVibes).slice(0, 2)
  
  // Create contrasting secondary criteria
  const unusedGenres = metadata.availableGenres.filter(g => !favoriteGenres.has(g))
  const unusedVibes = metadata.availableVibes.filter(v => !favoriteVibes.has(v))
  
  return {
    primary: {
      genres: primaryGenres,
      vibes: primaryVibes,
      weight: 0.8
    },
    secondary: {
      genres: unusedGenres.slice(0, 1),
      vibes: unusedVibes.slice(0, 1),
      weight: 0.6
    },
    constraints: {
      artistDiversity: true
    },
    reasoning: "I've selected one album that matches your taste patterns and another for discovery."
  }
}

function generateFallbackStrategicCriteria(metadata: CollectionMetadata): CuratorCriteria {
  // Create strategic first-round criteria using available genres/vibes
  const genres = metadata.availableGenres
  const vibes = metadata.availableVibes
  
  // Split genres into different categories for contrast
  const primaryGenres = genres.slice(0, Math.ceil(genres.length / 2))
  const secondaryGenres = genres.slice(Math.ceil(genres.length / 2))
  
  const primaryVibes = vibes.slice(0, Math.ceil(vibes.length / 2))
  const secondaryVibes = vibes.slice(Math.ceil(vibes.length / 2))
  
  return {
    primary: {
      genres: primaryGenres.slice(0, 2),
      vibes: primaryVibes.slice(0, 2),
      weight: 0.8
    },
    secondary: {
      genres: secondaryGenres.slice(0, 2),
      vibes: secondaryVibes.slice(0, 2),
      weight: 0.8
    },
    constraints: {
      artistDiversity: true
    },
    reasoning: "These albums represent different musical directions to help discover your preferences."
  }
}

async function generateAlbumPairReasoning(
  album1: Album,
  album2: Album,
  isFirstRound: boolean,
  openai: OpenAI
): Promise<string> {
  const album1Description = `"${album1.title}" by ${album1.artist} (${album1.year}) - Genres: ${album1.genres.join(', ')}${album1.personal_vibes?.length ? `, Vibes: ${album1.personal_vibes.join(', ')}` : ''}`
  const album2Description = `"${album2.title}" by ${album2.artist} (${album2.year}) - Genres: ${album2.genres.join(', ')}${album2.personal_vibes?.length ? `, Vibes: ${album2.personal_vibes.join(', ')}` : ''}`

  const systemPrompt = `You are an expert music curator explaining why these two specific albums make an interesting pairing for discovering music preferences.

ALBUM 1: ${album1Description}
ALBUM 2: ${album2Description}

${isFirstRound ? 
  'This is the FIRST pairing to kickstart preference discovery. Explain why these two albums create a meaningful choice that will reveal significant information about musical taste.' :
  'This pairing is designed to further explore and refine music preferences based on previous choices.'
}

Write a single sentence (max 25 words) that explains what makes this pairing interesting based on the actual genres, vibes, and musical characteristics. Focus on the contrast or complementary aspects that will help discover preferences.

Do NOT mention specific artist or album names.
Do NOT mention genres that aren't actually present in these albums.
Do NOT use generic phrases.
Focus on the musical styles, vibes, and characteristics rather than names.

Respond with ONLY the explanation sentence, no JSON or quotes.`

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: 'Generate a specific pairing explanation for these albums.' }
      ],
      temperature: 0.7,
      max_tokens: 150
    })

    const content = response.choices[0]?.message?.content?.trim()
    if (!content) throw new Error('No response from OpenAI')

    return content

  } catch (error) {
    logger.agentError('Album pair reasoning generation', error as Error, { 
      endpoint: '/api/ai-curator',
      operation: 'generateAlbumPairReasoning',
      album1: album1.title,
      album2: album2.title
    })
    
    // Fallback reasoning based on actual albums
    const genres1 = album1.genres.slice(0, 2).join(' and ')
    const genres2 = album2.genres.slice(0, 2).join(' and ')
    const yearDiff = Math.abs(album1.year - album2.year)
    
    // Use vibes for descriptive context if available
    const vibe1 = album1.personal_vibes.length > 0 ? album1.personal_vibes[0] : ''
    const vibe2 = album2.personal_vibes.length > 0 ? album2.personal_vibes[0] : ''
    
    if (yearDiff > 10) {
      return `This pairing contrasts ${vibe1 ? vibe1 + ' ' : ''}${genres1} with ${vibe2 ? vibe2 + ' ' : ''}${genres2}, spanning ${yearDiff} years of musical evolution.`
    } else {
      return `This pairing explores the differences between ${vibe1 ? vibe1 + ' ' : ''}${genres1} and ${vibe2 ? vibe2 + ' ' : ''}${genres2} approaches.`
    }
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

  const systemPrompt = `You are a music taste analyst. Look at what albums someone chose and figure out what kind of listener they are.

MORE FAVORED ALBUMS (${chosenAlbums.length} selections):
${chosenDescriptions.join('\n')}

LESS FAVORED ALBUMS (${rejectedAlbums.length} rejections):
${rejectedDescriptions.join('\n')}

Based on their choices, write about what kind of music listener they are. Think about:

- Do they like trying new music or sticking with what they know?
- Are they drawn to happy, sad, or energetic music?
- Do they prefer simple songs or more complex ones?
- What kind of mood are they usually in when listening?

Write 2-3 sentences about their music personality. Don't just list genres or years - explain what their choices say about them as a person who loves music.

Keep it simple and friendly. Write like you're talking to them directly using "you."

Respond with ONLY a JSON object:
{
  "summary": "Your music taste summary here...",
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
    logger.agentError('AI preference analysis', error as Error, { 
      endpoint: '/api/ai-curator',
      operation: 'analyzePreferencesWithAI',
      historyLength: history.length 
    })
    
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
    summary = `You love exploring new music and trying different sounds. You don't stick to just one type of music - you let your ears decide what's good, no matter what genre it is.`
  } else if (uniqueArtists < chosenAlbums.length * 0.7) {
    summary = `You tend to really connect with certain artists and want to hear more from them. When you find something you like, you dive in deep and explore more of their music.`
  } else if (yearSpread < 15) {
    summary = `You have a strong connection to music from a specific time period. There's something about the sound and vibe of that era that really clicks with you.`
  } else if (yearSpread > 30) {
    summary = `You don't care when music was made - good music is good music. You focus more on how songs make you feel than what decade they're from.`
  } else {
    summary = `You like a good mix of familiar favorites and new discoveries. You enjoy both the comfort of music you know and the excitement of finding something fresh.`
  }

  return [{
    summary,
    confidence: Math.min(history.length / 7, 0.7) // Slightly lower confidence for fallback
  }]
}