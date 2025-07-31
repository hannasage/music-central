import { SpotifySearchResult, SpotifyAlbum, SpotifyAudioFeatures, SpotifyArtist } from './types'

class SpotifyAPI {
  private accessToken: string | null = null
  private tokenExpiry: number = 0
  private readonly baseURL = 'https://api.spotify.com/v1'
  private readonly authURL = 'https://accounts.spotify.com/api/token'
  private requestCount = 0
  private lastRequestTime = 0
  private readonly rateLimitDelay = 100 // 100ms between requests to avoid rate limits

  constructor(
    private clientId: string = process.env.SPOTIFY_CLIENT_ID!,
    private clientSecret: string = process.env.SPOTIFY_CLIENT_SECRET!
  ) {}

  private async ensureAuthenticated(): Promise<void> {
    if (this.accessToken && Date.now() < this.tokenExpiry) {
      return
    }

    try {
      const response = await fetch(this.authURL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64')}`
        },
        body: 'grant_type=client_credentials'
      })

      if (!response.ok) {
        throw new Error(`Auth failed: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      this.accessToken = data.access_token
      this.tokenExpiry = Date.now() + (data.expires_in * 1000) - 60000 // Refresh 1 min early
    } catch (error) {
      console.error('Spotify authentication failed:', error)
      throw error
    }
  }

  private async rateLimit(): Promise<void> {
    const now = Date.now()
    const timeSinceLastRequest = now - this.lastRequestTime
    
    if (timeSinceLastRequest < this.rateLimitDelay) {
      await new Promise(resolve => setTimeout(resolve, this.rateLimitDelay - timeSinceLastRequest))
    }
    
    this.lastRequestTime = Date.now()
    this.requestCount++
  }

  private async makeRequest<T>(endpoint: string, retries = 3): Promise<T> {
    await this.ensureAuthenticated()
    await this.rateLimit()

    const url = `${this.baseURL}${endpoint}`
    
    try {
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.status === 429) {
        const retryAfter = parseInt(response.headers.get('Retry-After') || '1') * 1000
        console.log(`Rate limited. Waiting ${retryAfter}ms before retry...`)
        await new Promise(resolve => setTimeout(resolve, retryAfter))
        
        if (retries > 0) {
          return this.makeRequest<T>(endpoint, retries - 1)
        }
        throw new Error(`Rate limit exceeded after retries`)
      }

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status} ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      if (retries > 0 && (error as Error).message.includes('fetch')) {
        console.log(`Network error, retrying... (${retries} attempts left)`)
        await new Promise(resolve => setTimeout(resolve, 1000))
        return this.makeRequest<T>(endpoint, retries - 1)
      }
      throw error
    }
  }

  async searchAlbum(artist: string, title: string, limit = 10): Promise<SpotifySearchResult> {
    const query = encodeURIComponent(`album:"${title}" artist:"${artist}"`)
    const endpoint = `/search?q=${query}&type=album&limit=${limit}`
    
    try {
      return await this.makeRequest<SpotifySearchResult>(endpoint)
    } catch (error) {
      console.error(`Search failed for "${artist} - ${title}":`, error)
      throw error
    }
  }

  async getAlbumDetails(albumId: string): Promise<SpotifyAlbum> {
    const endpoint = `/albums/${albumId}`
    
    try {
      return await this.makeRequest<SpotifyAlbum>(endpoint)
    } catch (error) {
      console.error(`Failed to get album details for ID ${albumId}:`, error)
      throw error
    }
  }

  async getAlbumTracks(albumId: string): Promise<SpotifyAlbum['tracks']> {
    const endpoint = `/albums/${albumId}/tracks?limit=50`
    
    try {
      return await this.makeRequest<SpotifyAlbum['tracks']>(endpoint)
    } catch (error) {
      console.error(`Failed to get tracks for album ID ${albumId}:`, error)
      throw error
    }
  }

  async getAudioFeatures(trackIds: string[]): Promise<{ audio_features: SpotifyAudioFeatures[] }> {
    if (trackIds.length === 0) return { audio_features: [] }
    
    const ids = trackIds.slice(0, 100).join(',') // API limit is 100 tracks
    const endpoint = `/audio-features?ids=${ids}`
    
    try {
      return await this.makeRequest<{ audio_features: SpotifyAudioFeatures[] }>(endpoint)
    } catch {
      // Audio features require special permissions - return empty array instead of throwing
      console.warn(`Audio features not available (requires premium API access)`)
      return { audio_features: [] }
    }
  }

  async getArtist(artistId: string): Promise<SpotifyArtist> {
    const endpoint = `/artists/${artistId}`
    
    try {
      return await this.makeRequest<SpotifyArtist>(endpoint)
    } catch (error) {
      console.error(`Failed to get artist details for ID ${artistId}:`, error)
      throw error
    }
  }

  async findBestAlbumMatch(artist: string, title: string): Promise<SpotifyAlbum | null> {
    const matches = await this.findAlbumMatches(artist, title, 1)
    return matches.length > 0 ? matches[0].album : null
  }

  async findAlbumMatches(artist: string, title: string, limit = 5): Promise<Array<{ album: SpotifyAlbum; score: number; reason: string }>> {
    try {
      const searchResult = await this.searchAlbum(artist, title, Math.max(limit, 5))
      
      if (!searchResult.albums.items.length) {
        // Try a broader search without quotes
        const broadQuery = encodeURIComponent(`${title} ${artist}`)
        const broadEndpoint = `/search?q=${broadQuery}&type=album&limit=${Math.max(limit * 2, 10)}`
        const broadResult = await this.makeRequest<SpotifySearchResult>(broadEndpoint)
        
        if (!broadResult.albums.items.length) {
          return []
        }
        searchResult.albums.items = broadResult.albums.items
      }

      // Score matches based on similarity
      const scoredResults = searchResult.albums.items.map(album => {
        const albumTitle = album.name.toLowerCase()
        const albumArtist = album.artists[0]?.name.toLowerCase() || ''
        const searchTitle = title.toLowerCase()
        const searchArtist = artist.toLowerCase()

        let score = 0
        const reasons: string[] = []
        
        // Exact title match gets high score
        if (albumTitle === searchTitle) {
          score += 50
          reasons.push('exact title match')
        } else if (albumTitle.includes(searchTitle)) {
          score += 30
          reasons.push('title contains search term')
        } else if (searchTitle.includes(albumTitle)) {
          score += 25
          reasons.push('search term contains title')
        }
        
        // Exact artist match gets high score
        if (albumArtist === searchArtist) {
          score += 50
          reasons.push('exact artist match')
        } else if (albumArtist.includes(searchArtist)) {
          score += 30
          reasons.push('artist contains search term')
        } else if (searchArtist.includes(albumArtist)) {
          score += 25
          reasons.push('search term contains artist')
        }
        
        // Prefer studio albums over compilations/live albums
        if (!albumTitle.includes('live') && !albumTitle.includes('compilation') && !albumTitle.includes('remix')) {
          score += 10
          reasons.push('studio album')
        }

        // Bonus for newer releases (helps distinguish between multiple albums)
        const releaseYear = new Date(album.release_date).getFullYear()
        if (releaseYear >= 2020) score += 5
        
        const reason = reasons.length > 0 ? reasons.join(', ') : 'partial match'
        
        return { 
          album, 
          score, 
          reason: `${reason} (score: ${score})`
        }
      })

      // Sort by score and return top matches that meet minimum threshold
      scoredResults.sort((a, b) => b.score - a.score)
      
      // Return matches that meet minimum threshold, up to the limit
      return scoredResults
        .filter(match => match.score >= 25) // Lower threshold to allow more alternatives
        .slice(0, limit)
        
    } catch (error) {
      console.error(`Failed to find album matches for "${artist} - ${title}":`, error)
      return []
    }
  }

  async getAlbumWithDetails(albumId: string): Promise<SpotifyAlbum & { audio_features?: SpotifyAudioFeatures[] }> {
    try {
      const [album, tracks] = await Promise.all([
        this.getAlbumDetails(albumId),
        this.getAlbumTracks(albumId)
      ])

      // Skip audio features - endpoint is deprecated by Spotify
      console.log(`   Note: Audio features skipped (deprecated API)`)

      return {
        ...album,
        tracks,
        audio_features: [] // Always empty due to deprecated API
      }
    } catch (error) {
      console.error(`Failed to get complete album details for ID ${albumId}:`, error)
      throw error
    }
  }

  getRequestCount(): number {
    return this.requestCount
  }

  resetRequestCount(): void {
    this.requestCount = 0
  }
}

export const spotify = new SpotifyAPI()
export default spotify