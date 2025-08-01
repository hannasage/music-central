import OpenAI from 'openai'
import { Album } from './types'
import { RecommendationEngine } from './recommendation-engine'
import { logger } from './logger'

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  recommendations?: Album[]
}

export interface AIRecommendationResponse {
  message: string
  recommendations: Album[]
  reasoning: string[]
}

export class AIRecommendationService {
  private openai: OpenAI
  private recommendationEngine: RecommendationEngine
  private albums: Album[]

  constructor(albums: Album[]) {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY environment variable is required')
    }
    
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    })
    
    this.albums = albums
    this.recommendationEngine = new RecommendationEngine(albums, this.openai)
  }

  // Parse user preferences from natural language
  private async parseUserPreferences(userMessage: string, conversationHistory: ChatMessage[] = []): Promise<{
    genres: string[]
    vibes: string[]
    audioFeatures: Record<string, unknown>
    keywords: string[]
    yearRange?: { min?: number; max?: number }
    temporalPreference?: 'older' | 'newer' | 'classic' | 'vintage' | 'retro'
  }> {
    const context = conversationHistory
      .slice(-3) // Last 3 messages for context
      .map(msg => `${msg.role}: ${msg.content}`)
      .join('\n')

    const systemPrompt = `
You are a music preference parser. Extract structured preferences from user messages about music.

Available genres in collection: ${Array.from(new Set(this.albums.flatMap(a => a.genres))).slice(0, 20).join(', ')}
Available vibes in collection: ${Array.from(new Set(this.albums.flatMap(a => a.personal_vibes))).slice(0, 20).join(', ')}

Context from conversation:
${context}

User message: "${userMessage}"

Extract and return a JSON object with:
{
  "genres": ["genre1", "genre2"], // Matched genres from available list
  "vibes": ["vibe1", "vibe2"], // Matched vibes from available list  
  "audioFeatures": {
    "energy": 0.7, // 0-1 if mentioned (high energy = 0.8+, low = 0.3-)
    "danceability": 0.6, // 0-1 if mentioned
    "valence": 0.8 // 0-1 if mentioned (happy = 0.7+, sad = 0.3-)
  },
  "keywords": ["word1", "word2"], // Other descriptive words
  "yearRange": {"min": 1990, "max": 2000}, // If specific era mentioned
  "temporalPreference": "older" | "newer" | "classic" | "vintage" | "retro" // Temporal bias if implied
}

IMPORTANT: Extract temporal preferences from context clues:
- "nostalgic", "classic", "vintage", "old school", "throwback" → "older" preference + earlier year ranges
- "retro", "80s vibe", "90s feel" → "retro" preference + specific decades  
- "modern", "contemporary", "recent", "current" → "newer" preference + recent years
- "timeless", "from my youth", "reminds me of..." → consider age context and bias older

For "nostalgic" specifically:
- Set temporalPreference to "older"
- Bias yearRange toward 1960-2000 unless other context suggests otherwise
- Consider what would evoke nostalgia based on conversation context

Only include fields that are clearly mentioned or implied. Return valid JSON only.`

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage }
        ],
        temperature: 0.3,
        max_tokens: 300
      })

      const content = response.choices[0]?.message?.content?.trim()
      if (!content) throw new Error('No response from OpenAI')

      return JSON.parse(content)
    } catch (error) {
      logger.agentError('parse user preferences', error as Error, { userMessage })
      // Fallback: simple keyword extraction
      return {
        genres: [],
        vibes: [],
        audioFeatures: {},
        keywords: userMessage.toLowerCase().split(/\s+/).filter(word => word.length > 3),
        temporalPreference: userMessage.toLowerCase().includes('nostalgic') ? 'older' : undefined
      }
    }
  }

  // Generate AI response with recommendations
  async generateRecommendations(
    userMessage: string,
    conversationHistory: ChatMessage[] = []
  ): Promise<AIRecommendationResponse> {
    try {
      // Parse user preferences
      const preferences = await this.parseUserPreferences(userMessage, conversationHistory)
      
      // Get recommendations using the engine
      const recommendationScores = await this.recommendationEngine.getRecommendationsByPreferences(
        preferences,
        { count: 3, diversityFactor: 0.3, userMessage }
      )

      let recommendations = recommendationScores.map(r => r.album)
      let reasoning = recommendationScores.flatMap(r => r.reasons)

      // If no good matches, try fallback strategies
      if (recommendations.length === 0) {
        // Try broader search or trending albums
        if (preferences.genres.length > 0) {
          const genreAlbums = this.albums.filter(album => 
            album.genres.some(g => 
              preferences.genres.some(pg => g.toLowerCase().includes(pg.toLowerCase()))
            )
          ).slice(0, 3)
          recommendations = genreAlbums
          reasoning = ['Found albums with related genres']
        } else {
          recommendations = this.recommendationEngine.getTrendingAlbums(3)
          reasoning = ['Here are some recently added albums you might enjoy']
        }
      }

      // Generate conversational response
      const aiResponse = await this.generateConversationalResponse(
        userMessage,
        recommendations,
        reasoning,
        conversationHistory
      )

      return {
        message: aiResponse,
        recommendations,
        reasoning
      }

    } catch (error) {
      logger.agentError('generate AI recommendations', error as Error, { userMessage, albumCount: this.albums.length })
      
      // Fallback to random albums
      const fallbackAlbums = this.recommendationEngine.getDiscoveryAlbums(3)
      
      return {
        message: "I'm having trouble processing your request right now, but here are some great albums from your collection you might enjoy!",
        recommendations: fallbackAlbums,
        reasoning: ['Random selection from your collection']
      }
    }
  }

  // Generate conversational AI response
  private async generateConversationalResponse(
    userMessage: string,
    recommendations: Album[],
    reasoning: string[],
    conversationHistory: ChatMessage[]
  ): Promise<string> {
    const context = conversationHistory
      .slice(-2)
      .map(msg => `${msg.role}: ${msg.content}`)
      .join('\n')

    const albumSummaries = recommendations.map(album => 
      `"${album.title}" by ${album.artist} (${album.year}) - Genres: ${album.genres.slice(0, 2).join(', ')}${album.personal_vibes.length > 0 ? `, Vibes: ${album.personal_vibes.slice(0, 2).join(', ')}` : ''}`
    ).join('\n')

    const systemPrompt = `
You are an enthusiastic and knowledgeable music curator helping someone explore their personal vinyl collection of ${this.albums.length} albums. 

Respond conversationally and naturally. Be friendly but not overly casual. Show genuine enthusiasm for music.

Context: ${context || 'First conversation'}

User said: "${userMessage}"

You're recommending these albums from their collection:
${albumSummaries}

Reasoning: ${reasoning.join(', ')}

Write a warm, conversational response (2-3 sentences) explaining why these albums match their request. Don't just list the albums - the interface will show them. Focus on the connection to their preferences and what makes these albums special.`

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage }
        ],
        temperature: 0.7,
        max_tokens: 150
      })

      return response.choices[0]?.message?.content?.trim() || 
        "Based on your preferences, I found some great matches in your collection!"

    } catch (error) {
      logger.agentError('generate conversational response', error as Error, { albumCount: this.albums.length })
      return "I found some albums in your collection that should match what you're looking for!"
    }
  }

  // Get conversation starters based on collection
  getConversationStarters(): string[] {
    const starters = [
      "Suggest something energetic for a workout",
      "I'm feeling nostalgic, any recommendations?",
      "What's good for a chill evening?",
      "Recommend something I might have overlooked",
      "I'm in the mood for something melancholic",
      "Surprise me with something upbeat",
      "What would be good for studying?",
      "Recommend albums similar to my pop collection"
    ]

    // Add genre-specific starters if collection has those genres
    const topGenres = Array.from(new Set(this.albums.flatMap(a => a.genres)))
      .slice(0, 5)
    
    topGenres.forEach(genre => {
      starters.push(`Recommend some ${genre.toLowerCase()} albums`)
    })

    return starters.slice(0, 8)
  }

  // Validate that all recommended albums exist in collection
  validateRecommendations(albumIds: string[]): boolean {
    const collectionIds = new Set(this.albums.map(a => a.id))
    return albumIds.every(id => collectionIds.has(id))
  }
}