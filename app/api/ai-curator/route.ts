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
import Anthropic from '@anthropic-ai/sdk'

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

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY
})

/** Extract text from an Anthropic message response. */
function extractText(response: Anthropic.Message): string {
  const block = response.content[0]
  return block?.type === 'text' ? block.text.trim() : ''
}

/** Strip markdown code fences Claude sometimes adds even when asked not to. */
function stripFences(s: string): string {
  return s.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim()
}

/** Strip markdown formatting from plain-text responses. */
function stripMarkdown(s: string): string {
  return s
    .replace(/^#+\s*/gm, '')              // headings
    .replace(/\*\*([^*]+)\*\*/g, '$1')    // bold
    .replace(/\*([^*]+)\*/g, '$1')        // italic
    .replace(/`([^`]+)`/g, '$1')          // inline code
    .replace(/^[-*]\s+/gm, '')            // list items
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // links
    .split('\n').filter(l => l.trim()).join(' ') // collapse multi-line to single
    .trim()
}

/** Top N tags (genre or vibe) by frequency across the collection. */
function topTags(albums: Album[], field: 'genres' | 'personal_vibes', n: number): string[] {
  const counts = new Map<string, number>()
  albums.forEach(a => {
    const tags = (a[field] as string[]) ?? []
    tags.forEach(t => counts.set(t, (counts.get(t) ?? 0) + 1))
  })
  return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, n).map(([t]) => t)
}

/** Compact single-line album description for prompts. */
function albumLine(a: Album): string {
  const g = a.genres.slice(0, 2).join('/')
  return `"${a.title}" ${a.year}${g ? ` [${g}]` : ''}`
}

export async function POST(request: NextRequest) {
  try {
    const { action, history = [], round = 1 } = await request.json()

    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error('ANTHROPIC_API_KEY environment variable is required')
    }

    const supabase = createClient()
    const { data: allAlbums, error } = await supabase
      .from('albums')
      .select('*')
      .eq('removed', false)

    const albums = allAlbums ? sortAlbumsByArtist(allAlbums) : []

    if (error) {
      logger.dbError('fetch albums for AI curator', error, { action: 'get_pair' })
      return NextResponse.json({ error: 'Failed to fetch album collection' }, { status: 500 })
    }

    if (!albums || albums.length < 2) {
      return NextResponse.json({ error: 'Need at least 2 albums in collection for battles' }, { status: 400 })
    }

    if (action === 'get_pair') {
      const { selection, reasoning } = await getBattlePairWithCriteria(albums, history, round)

      if (!selection.album1 || !selection.album2) {
        return NextResponse.json({ error: 'Unable to find suitable album pair' }, { status: 400 })
      }

      return NextResponse.json({
        album1: selection.album1,
        album2: selection.album2,
        pairReasoning: reasoning,
        selectionMetadata: selection.metadata
      })
    }

    if (action === 'submit_choice') {
      // Only run AI analysis after enough data exists for meaningful patterns
      const insights = history.length >= 3
        ? await analyzePreferencesWithAI(history, albums)
        : getFallbackInsights(history)
      return NextResponse.json({ success: true, insights })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })

  } catch (error) {
    logger.criticalApiError('/api/ai-curator', error as Error, { action: 'ai_curator_request' })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

async function getBattlePairWithCriteria(
  albums: Album[],
  history: BattleChoice[],
  round: number
): Promise<{ selection: { album1: Album | null, album2: Album | null, metadata: { primaryMatches: number, secondaryMatches: number, totalAvailable: number } }, reasoning: string }> {
  const collectionMetadata = extractCollectionMetadata(albums)
  const excludeIds = createExclusionSet(history, albums, {
    keepRecentChoices: Math.floor(albums.length / 3),
    enableArtistDiversity: true
  })

  let criteria: CuratorCriteria
  if (round === 1 || history.length === 0) {
    criteria = await generateStrategicOpenerCriteria(albums)
  } else {
    criteria = await generatePersonalizedCriteria(albums, history)
  }

  const result = selectAlbumPair(albums, criteria, excludeIds)

  if (result.album1 && result.album2) {
    const reasoning = await generateAlbumPairReasoning(result.album1, result.album2, history.length === 0)
    return { selection: result, reasoning }
  }

  return { selection: result, reasoning: 'These albums offer an interesting contrast to explore your music preferences.' }
}

async function generatePersonalizedCriteria(
  albums: Album[],
  history: BattleChoice[]
): Promise<CuratorCriteria> {
  const chosenAlbums   = history.map(c => c.chosenAlbum)
  const rejectedAlbums = history.map(c => c.rejectedAlbum)
  const genres = topTags(albums, 'genres', 15).join(', ')
  const vibes  = topTags(albums, 'personal_vibes', 10).join(', ')

  const systemPrompt = `Music curator selecting album pairs for a preference game. Pick genre/vibe criteria to surface contrasting albums.

LIKED: ${chosenAlbums.map(albumLine).join(' | ')}
PASSED: ${rejectedAlbums.map(albumLine).join(' | ')}
GENRES: ${genres}
VIBES: ${vibes}

Return JSON only:
{"primary":{"genres":["g1"],"vibes":["v1"],"weight":0.8},"secondary":{"genres":["g2"],"vibes":["v2"],"weight":0.6},"constraints":{"artistDiversity":true},"reasoning":"one sentence"}`

  try {
    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      system: systemPrompt,
      messages: [{ role: 'user', content: 'Generate criteria.' }],
      temperature: 0.7,
      max_tokens: 200
    })

    const content = extractText(response)
    if (!content) throw new Error('Empty response from Claude')
    const criteria = JSON.parse(stripFences(content)) as CuratorCriteria
    console.log('AI Criteria:', criteria.reasoning)
    return criteria

  } catch (error) {
    logger.agentError('AI criteria generation', error as Error, {
      endpoint: '/api/ai-curator', operation: 'generatePersonalizedCriteria', historyLength: history.length
    })
    return generateFallbackPersonalizedCriteria(chosenAlbums, extractCollectionMetadata(albums))
  }
}

async function generateStrategicOpenerCriteria(albums: Album[]): Promise<CuratorCriteria> {
  const metadata = extractCollectionMetadata(albums)
  const genres   = topTags(albums, 'genres', 12).join(', ')
  const vibes    = topTags(albums, 'personal_vibes', 8).join(', ')

  const systemPrompt = `Music curator. First-round album pair for preference discovery — pick two contrasting directions.

GENRES: ${genres}
VIBES: ${vibes}
YEARS: ${metadata.yearRange.min}–${metadata.yearRange.max}

Return JSON only:
{"primary":{"genres":["g1"],"vibes":["v1"],"weight":0.8},"secondary":{"genres":["g2"],"vibes":["v2"],"weight":0.8},"constraints":{"artistDiversity":true},"reasoning":"one sentence"}`

  try {
    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      system: systemPrompt,
      messages: [{ role: 'user', content: 'Generate opener criteria.' }],
      temperature: 0.8,
      max_tokens: 180
    })

    const content = extractText(response)
    if (!content) throw new Error('Empty response from Claude')
    const criteria = JSON.parse(stripFences(content)) as CuratorCriteria
    console.log('AI Strategic Criteria:', criteria.reasoning)
    return criteria

  } catch (error) {
    logger.agentError('AI strategic criteria generation', error as Error, {
      endpoint: '/api/ai-curator', operation: 'generateStrategicOpenerCriteria'
    })
    return generateFallbackStrategicCriteria(metadata)
  }
}

async function generateAlbumPairReasoning(
  album1: Album,
  album2: Album,
  isFirstRound: boolean
): Promise<string> {
  const a1 = `${album1.year} [${album1.genres.slice(0, 2).join('/')}]${album1.personal_vibes[0] ? `, ${album1.personal_vibes[0]}` : ''}`
  const a2 = `${album2.year} [${album2.genres.slice(0, 2).join('/')}]${album2.personal_vibes[0] ? `, ${album2.personal_vibes[0]}` : ''}`

  const systemPrompt = `Write one conversational sentence for a music discovery app explaining what makes this album pair an interesting choice. Plain text only — no markdown, no labels, no colons introducing the answer.

Album A: ${a1}
Album B: ${a2}

Good examples:
- "One pulls you into raw, communal energy while the other invites you into something more interior and still."
- "A test of whether you're drawn to music that pushes forward or music that opens up space."
- "Both are maximalist, but one drowns in noise while the other wraps you in atmosphere."

Bad (do not do this): "# Analysis **The contrast**: ..." or "The Contrast: ..."

One sentence, starting directly with the insight:`

  try {
    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      system: systemPrompt,
      messages: [{ role: 'user', content: 'Write the sentence.' }],
      temperature: 0.8,
      max_tokens: 80
    })

    const content = extractText(response)
    if (!content) throw new Error('Empty response from Claude')
    return stripMarkdown(content)

  } catch (error) {
    logger.agentError('Album pair reasoning generation', error as Error, {
      endpoint: '/api/ai-curator',
      operation: 'generateAlbumPairReasoning',
      album1: album1.title,
      album2: album2.title
    })

    // Fallback: generate a natural-feeling sentence from the album data
    const g1 = album1.genres[0] ?? 'experimental'
    const g2 = album2.genres[0] ?? 'alternative'
    const v1 = album1.personal_vibes[0]
    const v2 = album2.personal_vibes[0]
    const yearDiff = Math.abs(album1.year - album2.year)

    if (v1 && v2) {
      return `One leans ${v1} and ${g1}, the other ${v2} and ${g2} — a choice that says a lot about your listening mood.`
    }
    return yearDiff > 8
      ? `${g1} from ${album1.year} meets ${g2} from ${album2.year} — a generational contrast in sound.`
      : `Two takes on ${g1 === g2 ? g1 : `${g1} and ${g2}`}, pulled in very different directions.`
  }
}

async function analyzePreferencesWithAI(history: BattleChoice[], albums: Album[]): Promise<PreferenceInsight[]> {
  if (history.length === 0) return []

  const chosen   = history.map(c => albumLine(c.chosenAlbum)).join(' | ')
  const rejected = history.map(c => albumLine(c.rejectedAlbum)).join(' | ')

  const systemPrompt = `Analyze music choices and write 2 friendly sentences about this listener's taste. Use "you". No genre lists, no years — speak to their personality as a music lover.

LIKED: ${chosen}
PASSED: ${rejected}

Return JSON only: {"summary":"...","confidence":0.8}`

  try {
    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      system: systemPrompt,
      messages: [{ role: 'user', content: 'Analyze.' }],
      temperature: 0.7,
      max_tokens: 150
    })

    const content = extractText(response)
    if (!content) throw new Error('Empty response from Claude')

    const insight = JSON.parse(stripFences(content))
    if (insight.summary && typeof insight.confidence === 'number') return [insight]
    throw new Error('Invalid insight format')

  } catch (error) {
    logger.agentError('AI preference analysis', error as Error, {
      endpoint: '/api/ai-curator', operation: 'analyzePreferencesWithAI', historyLength: history.length
    })
    return getFallbackInsights(history)
  }
}

// ── Fallback helpers (unchanged) ────────────────────────────────────────────

function generateFallbackPersonalizedCriteria(chosenAlbums: Album[], metadata: CollectionMetadata): CuratorCriteria {
  const favoriteGenres = new Set<string>()
  const favoriteVibes  = new Set<string>()
  chosenAlbums.forEach(album => {
    album.genres.forEach(g => favoriteGenres.add(g))
    album.personal_vibes.forEach(v => favoriteVibes.add(v))
  })
  const unusedGenres = metadata.availableGenres.filter(g => !favoriteGenres.has(g))
  const unusedVibes  = metadata.availableVibes.filter(v => !favoriteVibes.has(v))
  return {
    primary:    { genres: Array.from(favoriteGenres).slice(0, 2), vibes: Array.from(favoriteVibes).slice(0, 2), weight: 0.8 },
    secondary:  { genres: unusedGenres.slice(0, 1), vibes: unusedVibes.slice(0, 1), weight: 0.6 },
    constraints: { artistDiversity: true },
    reasoning: "I've selected one album that matches your taste patterns and another for discovery."
  }
}

function generateFallbackStrategicCriteria(metadata: CollectionMetadata): CuratorCriteria {
  const genres = metadata.availableGenres
  const vibes  = metadata.availableVibes
  const mid    = Math.ceil(genres.length / 2)
  const vmid   = Math.ceil(vibes.length / 2)
  return {
    primary:    { genres: genres.slice(0, mid).slice(0, 2), vibes: vibes.slice(0, vmid).slice(0, 2), weight: 0.8 },
    secondary:  { genres: genres.slice(mid).slice(0, 2),    vibes: vibes.slice(vmid).slice(0, 2),    weight: 0.8 },
    constraints: { artistDiversity: true },
    reasoning: 'These albums represent different musical directions to help discover your preferences.'
  }
}

function getFallbackInsights(history: BattleChoice[]): PreferenceInsight[] {
  const chosenAlbums  = history.map(c => c.chosenAlbum)
  const uniqueArtists = new Set(chosenAlbums.map(a => a.artist)).size
  const uniqueGenres  = new Set(chosenAlbums.flatMap(a => a.genres)).size
  const years         = chosenAlbums.map(a => a.year).sort((a, b) => a - b)
  const yearSpread    = years[years.length - 1] - years[0]

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

  return [{ summary, confidence: Math.min(history.length / 7, 0.7) }]
}
