import OpenAI from 'openai'
import { Album } from './types'

export interface AIBackfillSuggestions {
  genres: string[]
  personalVibes: string[]
  thoughts: string
  confidence: number
  sources: string[]
}

export interface TavilyAlbumContext {
  reviews: string[]
  culturalContext: string
  genreInfo: string
  criticalReception: string
}

export class AIBackfillService {
  private openai: OpenAI
  private tavily: { search: (params: unknown) => Promise<unknown> } | null

  constructor() {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY environment variable is required')
    }

    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    })

    // Initialize Tavily if API key is available
    if (process.env.TAVILY_API_KEY && process.env.TAVILY_API_KEY !== 'your_tavily_api_key_here') {
      try {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const { tavily } = require('@tavily/core')
        this.tavily = tavily({ apiKey: process.env.TAVILY_API_KEY })
      } catch (error) {
        console.warn('Tavily initialization failed:', error)
        this.tavily = null
      }
    } else {
      this.tavily = null
    }
  }

  async generateSuggestions(album: Album): Promise<AIBackfillSuggestions> {
    try {
      // Get additional context from Tavily if available
      let tavilyContext: TavilyAlbumContext | null = null
      if (this.tavily) {
        tavilyContext = await this.getTavilyContext(album)
      }

      // Generate AI suggestions using OpenAI
      const suggestions = await this.generateOpenAISuggestions(album, tavilyContext)
      
      return suggestions
    } catch (error) {
      console.error('Error generating AI suggestions:', error)
      
      // Fallback suggestions based on existing data
      return this.generateFallbackSuggestions(album)
    }
  }

  private async getTavilyContext(album: Album): Promise<TavilyAlbumContext | null> {
    if (!this.tavily) return null

    try {
      const searchQuery = `"${album.artist}" "${album.title}" album review music genre ${album.year}`
      
      const searchResults = await this.tavily.search({
        query: searchQuery,
        searchDepth: 'basic',
        maxResults: 5,
        includeAnswer: true,
        includeRawContent: false
      }) as { results?: unknown[]; answer?: string }

      if (!searchResults?.results?.length) {
        return null
      }

      // Extract relevant information from search results
      const reviews = (searchResults.results as { content?: string }[])
        .filter((result) => result.content && result.content.length > 100)
        .map((result) => result.content as string)
        .slice(0, 3)

      const culturalContext = searchResults.answer || ''

      return {
        reviews,
        culturalContext,
        genreInfo: this.extractGenreInfo(searchResults.results as Record<string, unknown>[]),
        criticalReception: this.extractCriticalReception(searchResults.results as Record<string, unknown>[])
      }
    } catch (error) {
      console.warn('Tavily search failed:', error)
      return null
    }
  }

  private extractGenreInfo(results: Record<string, unknown>[]): string {
    const genreKeywords = ['genre', 'style', 'sound', 'music', 'rock', 'pop', 'jazz', 'electronic', 'classical', 'hip-hop', 'R&B', 'country', 'folk', 'metal', 'punk', 'indie', 'alternative']
    
    return results
      .map(result => String(result.content || ''))
      .join(' ')
      .split('.')
      .filter(sentence => genreKeywords.some(keyword => sentence.toLowerCase().includes(keyword)))
      .slice(0, 3)
      .join('. ')
  }

  private extractCriticalReception(results: Record<string, unknown>[]): string {
    const receptionKeywords = ['review', 'rating', 'critic', 'acclaimed', 'praised', 'reception', 'response']
    
    return results
      .map(result => String(result.content || ''))
      .join(' ')
      .split('.')
      .filter(sentence => receptionKeywords.some(keyword => sentence.toLowerCase().includes(keyword)))
      .slice(0, 2)
      .join('. ')
  }

  private async generateOpenAISuggestions(
    album: Album, 
    tavilyContext: TavilyAlbumContext | null
  ): Promise<AIBackfillSuggestions> {
    const spotifyGenres = album.genres?.length ? `Spotify genres: ${album.genres.join(', ')}` : ''
    
    // Generate dynamic vibe examples based on album characteristics
    const getVibeExamples = () => {
      const decade = Math.floor(album.year / 10) * 10
      const isVintage = album.year < 1990
      const isModern = album.year > 2010
      const hasElectronic = album.genres?.some(g => g.toLowerCase().includes('electronic'))
      const hasRock = album.genres?.some(g => g.toLowerCase().includes('rock'))
      const hasSoul = album.genres?.some(g => g.toLowerCase().includes('soul') || g.toLowerCase().includes('r&b'))
      
      let examples = []
      
      if (isVintage) examples.push('"analog-warm", "vinyl-crackling", "sepia-toned"')
      if (isModern) examples.push('"digital-crisp", "studio-polished", "genre-blending"')
      if (hasElectronic) examples.push('"synthesized", "pulsating", "cybernetic", "atmospheric"')
      if (hasRock) examples.push('"guitar-driven", "amplified", "rebellious", "stadium-sized"')
      if (hasSoul) examples.push('"groove-heavy", "emotionally-charged", "silky-smooth", "spiritually-uplifting"')
      
      // Add decade-specific vibes
      if (decade === 1960) examples.push('"revolutionary", "flower-power", "psychedelic"')
      if (decade === 1970) examples.push('"funky", "disco-infused", "groovy"')
      if (decade === 1980) examples.push('"neon-bright", "synth-heavy", "new-wave"')
      if (decade === 1990) examples.push('"grunge-influenced", "alternative", "MTV-ready"')
      if (decade === 2000) examples.push('"millennium-fresh", "radio-friendly", "digital-age"')
      
      return examples.length > 0 ? examples.slice(0, 2).join(', ') : '"vibrant", "textured", "immersive"'
    }
    
    const contextInfo = tavilyContext ? `
Additional context from music sources:
- Cultural context: ${tavilyContext.culturalContext}
- Genre information: ${tavilyContext.genreInfo}
- Critical reception: ${tavilyContext.criticalReception}
- Reviews: ${tavilyContext.reviews.slice(0, 2).join(' | ')}
` : ''

    const systemPrompt = `You are a music expert helping to categorize and describe albums in a personal vinyl collection. 

Album: "${album.title}" by ${album.artist} (${album.year})
${spotifyGenres}
${contextInfo}

Generate suggestions for:
1. GENRES: 2-4 specific, accurate music genres (avoid overly broad terms like "Pop" alone)
2. PERSONAL_VIBES: 3-5 descriptive mood/feeling words that capture the listening experience
3. THOUGHTS: A personal, thoughtful 2-3 sentence reflection about the album

Guidelines:
- Genres should be specific and accurate (e.g., "Indie Folk", "Progressive Rock", "Neo-Soul" rather than just "Rock")
- Personal vibes should be DIVERSE and specific to this album's unique character. Consider the full spectrum of human emotions and experiences:
  * Energy levels: "explosive", "kinetic", "laid-back", "frenzied", "pulsing", "languid"
  * Emotions: "euphoric", "haunting", "rebellious", "sensual", "whimsical", "fierce", "tender", "brooding"
  * Atmospheres: "cosmic", "gritty", "crystalline", "smoky", "neon-soaked", "pastoral", "industrial", "oceanic"
  * Physical sensations: "visceral", "hypnotic", "jarring", "silky", "thunderous", "delicate", "driving"
  * Social contexts: "party-ready", "intimate", "communal", "solitary", "cinematic", "danceable", "contemplative"
  * Temporal feelings: "timeless", "futuristic", "vintage", "urgent", "eternal", "fleeting"
  * Album-specific examples for this release: ${getVibeExamples()}
- AVOID overused words like "nostalgic", "introspective", "melancholic" unless they're genuinely the best fit
- Think about what makes THIS album unique - its production style, vocal delivery, instrumentation, cultural moment
- BE CREATIVE and use unexpected but accurate descriptors that capture the album's essence
- Thoughts should feel personal and authentic, not like a generic review
- Consider the album's cultural impact, musical innovation, and emotional resonance
- If existing genres are accurate, you may include them but add more specific sub-genres

Return valid JSON only:
{
  "genres": ["genre1", "genre2", "genre3"],
  "personalVibes": ["vibe1", "vibe2", "vibe3", "vibe4"],
  "thoughts": "Personal reflection about the album...",
  "confidence": 0.85,
  "sources": ["AI analysis", "Music database"]
}`

    const response = await this.openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Analyze "${album.title}" by ${album.artist}` }
      ],
      temperature: 0.8,
      max_tokens: 500
    })

    const content = response.choices[0]?.message?.content?.trim()
    if (!content) {
      throw new Error('No response from OpenAI')
    }

    try {
      const parsed = JSON.parse(content)
      const sources = ['AI analysis']
      if (tavilyContext) sources.push('Music reviews', 'Cultural context')
      
      return {
        genres: parsed.genres || [],
        personalVibes: parsed.personalVibes || [],
        thoughts: parsed.thoughts || '',
        confidence: parsed.confidence || 0.7,
        sources
      }
    } catch (parseError) {
      console.error('Failed to parse OpenAI response:', parseError)
      throw new Error('Invalid response format from AI')
    }
  }

  private generateFallbackSuggestions(album: Album): AIBackfillSuggestions {
    // Generate more interesting fallback suggestions based on year and existing genres
    const decade = Math.floor(album.year / 10) * 10
    const fallbackGenres = album.genres?.length ? [...album.genres] : ['Alternative Rock', 'Pop']
    
    // Generate diverse fallback vibes based on album characteristics
    const vibeOptions = [
      ['energetic', 'guitar-driven', 'anthemic', 'stadium-ready'],
      ['atmospheric', 'ethereal', 'cinematic', 'expansive'], 
      ['groove-heavy', 'danceable', 'infectious', 'rhythmic'],
      ['raw', 'unpolished', 'authentic', 'visceral'],
      ['polished', 'studio-crafted', 'pristine', 'refined'],
      ['experimental', 'boundary-pushing', 'innovative', 'genre-defying'],
      ['intimate', 'personal', 'confessional', 'vulnerable'],
      ['bold', 'confident', 'assertive', 'commanding']
    ]
    
    // Add decade-specific vibes
    let decadeVibes = []
    if (decade === 1960) decadeVibes = ['revolutionary', 'psychedelic', 'experimental']
    else if (decade === 1970) decadeVibes = ['groovy', 'funky', 'soulful']
    else if (decade === 1980) decadeVibes = ['synth-driven', 'new-wave', 'electronic']
    else if (decade === 1990) decadeVibes = ['grunge-influenced', 'alternative', 'rebellious']
    else if (decade >= 2000) decadeVibes = ['modern', 'digitally-enhanced', 'contemporary']
    
    const randomVibeSet = vibeOptions[Math.floor(Math.random() * vibeOptions.length)]
    const fallbackVibes = [...randomVibeSet.slice(0, 2), ...decadeVibes.slice(0, 2)].slice(0, 4)
    
    const fallbackThoughts = `"${album.title}" captures ${album.artist}'s distinctive sound from ${album.year}, showcasing their ability to create music that resonates across time.`

    return {
      genres: fallbackGenres,
      personalVibes: fallbackVibes,
      thoughts: fallbackThoughts,
      confidence: 0.3,
      sources: ['Fallback suggestion']
    }
  }

  // Batch processing for multiple albums
  async generateBatchSuggestions(
    albums: Album[], 
    progressCallback?: (progress: number, total: number) => void
  ): Promise<Map<string, AIBackfillSuggestions>> {
    const results = new Map<string, AIBackfillSuggestions>()
    
    for (let i = 0; i < albums.length; i++) {
      const album = albums[i]
      
      try {
        const suggestions = await this.generateSuggestions(album)
        results.set(album.id, suggestions)
        
        if (progressCallback) {
          progressCallback(i + 1, albums.length)
        }
        
        // Small delay to avoid rate limiting
        if (i < albums.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 200))
        }
      } catch (error) {
        console.error(`Failed to generate suggestions for ${album.title}:`, error)
        
        // Add fallback for failed albums
        results.set(album.id, this.generateFallbackSuggestions(album))
      }
    }
    
    return results
  }

  // Validate and merge AI suggestions with existing data
  mergeSuggestions(
    album: Album, 
    suggestions: AIBackfillSuggestions,
    options: {
      replaceGenres?: boolean
      replaceVibes?: boolean
      replaceThoughts?: boolean
    } = {}
  ): Partial<Album> {
    const updates: Partial<Album> = {}

    // Merge genres
    if (options.replaceGenres || !album.genres?.length) {
      updates.genres = suggestions.genres
    } else {
      // Combine existing and suggested genres, removing duplicates
      const combined = [...(album.genres || []), ...suggestions.genres]
      updates.genres = Array.from(new Set(combined))
    }

    // Merge personal vibes
    if (options.replaceVibes || !album.personal_vibes?.length) {
      updates.personal_vibes = suggestions.personalVibes
    } else {
      const combined = [...(album.personal_vibes || []), ...suggestions.personalVibes]
      updates.personal_vibes = Array.from(new Set(combined))
    }

    // Merge thoughts
    if (options.replaceThoughts || !album.thoughts?.trim()) {
      updates.thoughts = suggestions.thoughts
    }

    return updates
  }

  // Check if API services are available
  getServiceStatus(): { openai: boolean; tavily: boolean } {
    return {
      openai: !!process.env.OPENAI_API_KEY,
      tavily: !!this.tavily && !!process.env.TAVILY_API_KEY && process.env.TAVILY_API_KEY !== 'your_tavily_api_key_here'
    }
  }
}