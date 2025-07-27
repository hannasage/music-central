import { createClient } from '@supabase/supabase-js'
import spotify from './spotify'
import { Album, MigrationResult, MigrationSummary, SpotifyAudioFeatures } from './types'

// Types for the source vinyl-db data
interface SourceAlbum {
  id: number
  title: string
  artist_id: number
  variant: string
  purchase_date: string
  acquired_date: string
  preordered: boolean
  artwork_url: string
  release_year: number
  created_at: string
}

interface SourceArtist {
  id: number
  name: string
  album_ids: number[]
  created_at: string
}

interface SourceAlbumWithArtist extends SourceAlbum {
  artist_name: string
}

class VinylMigrationService {
  private sourceClient: unknown
  private targetClient: unknown
  private batchSize = 10
  private delayBetweenBatches = 2000 // 2 seconds

  constructor(
    sourceSupabaseUrl: string,
    sourceSupabaseKey: string,
    targetSupabaseUrl: string = process.env.NEXT_PUBLIC_SUPABASE_URL!,
    targetSupabaseKey: string = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  ) {
    this.sourceClient = createClient(sourceSupabaseUrl, sourceSupabaseKey)
    this.targetClient = createClient(targetSupabaseUrl, targetSupabaseKey)
  }

  async fetchSourceAlbums(): Promise<SourceAlbumWithArtist[]> {
    console.log('Fetching source albums from vinyl-db...')
    
    const { data: albums, error: albumError } = await this.sourceClient
      .from('album')
      .select('*')
      .order('created_at', { ascending: true })

    if (albumError) {
      throw new Error(`Failed to fetch albums: ${albumError.message}`)
    }

    const { data: artists, error: artistError } = await this.sourceClient
      .from('artist')
      .select('*')

    if (artistError) {
      throw new Error(`Failed to fetch artists: ${artistError.message}`)
    }

    // Create artist lookup map
    const artistMap = new Map<number, string>()
    artists.forEach((artist: SourceArtist) => {
      artistMap.set(artist.id, artist.name)
    })

    // Join albums with artist names
    const albumsWithArtists: SourceAlbumWithArtist[] = albums.map((album: SourceAlbum) => ({
      ...album,
      artist_name: artistMap.get(album.artist_id) || 'Unknown Artist'
    }))

    console.log(`Found ${albumsWithArtists.length} albums to migrate`)
    return albumsWithArtists
  }

  async migrateAlbum(sourceAlbum: SourceAlbumWithArtist): Promise<MigrationResult> {
    const startTime = Date.now()
    
    try {
      console.log(`Migrating: ${sourceAlbum.artist_name} - ${sourceAlbum.title}`)
      
      // 1. Search for Spotify match
      let spotifyAlbum = null
      let spotifyMatch = false
      
      try {
        spotifyAlbum = await spotify.findBestAlbumMatch(
          sourceAlbum.artist_name, 
          sourceAlbum.title
        )
        spotifyMatch = !!spotifyAlbum
        
        if (spotifyMatch) {
          console.log(`  ✓ Found Spotify match: ${spotifyAlbum!.id}`)
        } else {
          console.log(`  ⚠ No Spotify match found`)
        }
      } catch (error) {
        console.log(`  ⚠ Spotify search failed: ${error}`)
      }

      // 2. Get enhanced data if Spotify match found
      let genres: string[] = []
      let audioFeatures: SpotifyAudioFeatures | undefined
      let tracks: unknown[] = []
      let coverArtUrl = sourceAlbum.artwork_url
      const streamingLinks: Record<string, unknown> = {}

      if (spotifyAlbum) {
        try {
          const detailedAlbum = await spotify.getAlbumWithDetails(spotifyAlbum.id)
          
          // Extract genres from artist or album
          if (detailedAlbum.artists?.[0]) {
            try {
              const artist = await spotify.getArtist(detailedAlbum.artists[0].id)
              genres = artist.genres || []
            } catch (error) {
              console.log(`    Could not fetch artist genres: ${error}`)
            }
          }

          // Use Spotify cover art if better quality available
          if (detailedAlbum.images?.[0]?.url) {
            coverArtUrl = detailedAlbum.images[0].url
          }

          // Set streaming links
          streamingLinks.spotify = detailedAlbum.external_urls?.spotify

          // Process tracks
          if (detailedAlbum.tracks?.items) {
            tracks = detailedAlbum.tracks.items.map(track => ({
              id: crypto.randomUUID(),
              name: track.name,
              track_number: track.track_number,
              duration_ms: track.duration_ms,
              preview_url: track.preview_url,
              spotify_id: track.id
            }))
          }

          // Calculate average audio features if available
          if (detailedAlbum.audio_features?.length) {
            const validFeatures = detailedAlbum.audio_features.filter(f => f !== null)
            if (validFeatures.length > 0) {
              audioFeatures = {
                acousticness: this.average(validFeatures.map(f => f.acousticness)),
                danceability: this.average(validFeatures.map(f => f.danceability)),
                energy: this.average(validFeatures.map(f => f.energy)),
                instrumentalness: this.average(validFeatures.map(f => f.instrumentalness)),
                liveness: this.average(validFeatures.map(f => f.liveness)),
                loudness: this.average(validFeatures.map(f => f.loudness)),
                speechiness: this.average(validFeatures.map(f => f.speechiness)),
                tempo: this.average(validFeatures.map(f => f.tempo)),
                valence: this.average(validFeatures.map(f => f.valence)),
                key: Math.round(this.average(validFeatures.map(f => f.key))),
                mode: Math.round(this.average(validFeatures.map(f => f.mode))),
                time_signature: Math.round(this.average(validFeatures.map(f => f.time_signature)))
              }
            }
          }
        } catch (error) {
          console.log(`    Failed to get detailed Spotify data: ${error}`)
        }
      }

      // 3. Create target album object
      const targetAlbum: Omit<Album, 'id' | 'created_at' | 'updated_at'> = {
        title: sourceAlbum.title,
        artist: sourceAlbum.artist_name,
        year: sourceAlbum.release_year,
        spotify_id: spotifyAlbum?.id,
        genres,
        audio_features: audioFeatures,
        personal_vibes: this.inferPersonalVibes(sourceAlbum.variant, genres),
        thoughts: this.generateInitialThoughts(sourceAlbum),
        cover_art_url: coverArtUrl,
        streaming_links: streamingLinks,
        tracks: tracks.length > 0 ? tracks : undefined
      }

      // 4. Insert into target database
      const { data: insertedAlbum, error: insertError } = await this.targetClient
        .from('albums')
        .insert(targetAlbum)
        .select()
        .single()

      if (insertError) {
        throw new Error(`Database insertion failed: ${insertError.message}`)
      }

      const processingTime = Date.now() - startTime
      console.log(`  ✓ Migrated successfully in ${processingTime}ms`)

      return {
        success: true,
        album: insertedAlbum,
        spotify_match: spotifyMatch,
        original_data: {
          title: sourceAlbum.title,
          artist: sourceAlbum.artist_name,
          year: sourceAlbum.release_year
        }
      }

    } catch (error) {
      const processingTime = Date.now() - startTime
      console.log(`  ✗ Migration failed in ${processingTime}ms: ${error}`)

      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        spotify_match: false,
        original_data: {
          title: sourceAlbum.title,
          artist: sourceAlbum.artist_name,
          year: sourceAlbum.release_year
        }
      }
    }
  }

  private average(numbers: number[]): number {
    return numbers.reduce((sum, n) => sum + n, 0) / numbers.length
  }

  private inferPersonalVibes(variant: string, genres: string[]): string[] {
    const vibes: string[] = []
    
    // Add variant-based vibes
    if (variant && variant.toLowerCase() !== 'standard') {
      vibes.push(`${variant} edition`)
    }
    
    // Add genre-based vibes (simplified mapping)
    const genreVibeMap: Record<string, string[]> = {
      'rock': ['energetic', 'guitar-driven'],
      'pop': ['catchy', 'accessible'],
      'jazz': ['sophisticated', 'improvisational'],
      'electronic': ['synthetic', 'danceable'],
      'folk': ['acoustic', 'storytelling'],
      'classical': ['orchestral', 'timeless'],
      'hip hop': ['rhythmic', 'lyrical'],
      'metal': ['heavy', 'intense']
    }

    genres.forEach(genre => {
      const lowerGenre = genre.toLowerCase()
      Object.entries(genreVibeMap).forEach(([key, values]) => {
        if (lowerGenre.includes(key)) {
          vibes.push(...values)
        }
      })
    })

    return [...new Set(vibes)] // Remove duplicates
  }

  private generateInitialThoughts(sourceAlbum: SourceAlbumWithArtist): string {
    const thoughts: string[] = []
    
    if (sourceAlbum.preordered) {
      thoughts.push('Pre-ordered this album.')
    }
    
    if (sourceAlbum.variant && sourceAlbum.variant !== 'standard') {
      thoughts.push(`${sourceAlbum.variant} variant.`)
    }

    const purchaseYear = new Date(sourceAlbum.purchase_date).getFullYear()
    const releaseYear = sourceAlbum.release_year
    
    if (purchaseYear > releaseYear + 5) {
      thoughts.push('Discovered this as a classic/retrospective find.')
    }

    return thoughts.join(' ')
  }

  async migrateBatch(albums: SourceAlbumWithArtist[], startIndex = 0): Promise<MigrationSummary> {
    const startTime = Date.now()
    const results: MigrationResult[] = []
    const errors: string[] = []

    console.log(`\nStarting batch migration from index ${startIndex}...`)
    console.log(`Batch size: ${this.batchSize}, Total albums: ${albums.length}`)

    for (let i = startIndex; i < albums.length; i += this.batchSize) {
      const batch = albums.slice(i, i + this.batchSize)
      console.log(`\nProcessing batch ${Math.floor(i / this.batchSize) + 1}/${Math.ceil(albums.length / this.batchSize)}`)
      console.log(`Albums ${i + 1}-${Math.min(i + this.batchSize, albums.length)} of ${albums.length}`)

      // Process batch sequentially to respect rate limits
      for (const album of batch) {
        const result = await this.migrateAlbum(album)
        results.push(result)
        
        if (!result.success && result.error) {
          errors.push(`${album.artist_name} - ${album.title}: ${result.error}`)
        }

        // Small delay between albums to be gentle on APIs
        await this.delay(100)
      }

      // Delay between batches
      if (i + this.batchSize < albums.length) {
        console.log(`\nWaiting ${this.delayBetweenBatches}ms before next batch...`)
        await this.delay(this.delayBetweenBatches)
      }
    }

    const endTime = Date.now()
    const successful = results.filter(r => r.success).length
    const failed = results.filter(r => !r.success).length
    const spotifyMatches = results.filter(r => r.spotify_match).length

    const summary: MigrationSummary = {
      total_processed: results.length,
      successful,
      failed,
      spotify_matches: spotifyMatches,
      errors,
      processing_time_ms: endTime - startTime
    }

    console.log('\n=== MIGRATION SUMMARY ===')
    console.log(`Total processed: ${summary.total_processed}`)
    console.log(`Successful: ${summary.successful}`)
    console.log(`Failed: ${summary.failed}`)
    console.log(`Spotify matches: ${summary.spotify_matches}`)
    console.log(`Processing time: ${(summary.processing_time_ms / 1000).toFixed(2)}s`)
    console.log(`Spotify API calls: ${spotify.getRequestCount()}`)

    if (errors.length > 0) {
      console.log('\nErrors:')
      errors.forEach(error => console.log(`  - ${error}`))
    }

    return summary
  }

  async validateMigration(): Promise<{ isValid: boolean; issues: string[] }> {
    const issues: string[] = []
    
    try {
      // Check if target table exists and has data
      const { count, error } = await this.targetClient
        .from('albums')
        .select('*', { count: 'exact', head: true })

      if (error) {
        issues.push(`Cannot query target table: ${error.message}`)
      } else if (count === 0) {
        issues.push('Target albums table is empty')
      }

      // Test Spotify API connectivity
      try {
        await spotify.searchAlbum('The Beatles', 'Abbey Road', 1)
      } catch (error) {
        issues.push(`Spotify API not accessible: ${error}`)
      }

      // Validate required environment variables
      if (!process.env.SPOTIFY_CLIENT_ID) {
        issues.push('SPOTIFY_CLIENT_ID environment variable not set')
      }
      if (!process.env.SPOTIFY_CLIENT_SECRET) {
        issues.push('SPOTIFY_CLIENT_SECRET environment variable not set')
      }

    } catch (error) {
      issues.push(`Validation failed: ${error}`)
    }

    return {
      isValid: issues.length === 0,
      issues
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  setBatchSize(size: number): void {
    this.batchSize = Math.max(1, Math.min(size, 50)) // Clamp between 1-50
  }

  setDelayBetweenBatches(ms: number): void {
    this.delayBetweenBatches = Math.max(1000, ms) // Minimum 1 second
  }
}

export default VinylMigrationService