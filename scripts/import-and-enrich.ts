#!/usr/bin/env npx tsx

import 'dotenv/config'
import { readFileSync } from 'fs'
import { createClient } from '@supabase/supabase-js'
import spotify from '../lib/spotify'
import { Album, SpotifyAudioFeatures } from '../lib/types'
import { AlbumValidator } from '../lib/validation'

interface ExportedAlbum {
  id: number
  title: string
  artist_id: number
  artist_name: string
  variant: string
  purchase_date: string
  acquired_date: string
  preordered: boolean
  artwork_url: string
  release_year: number
  created_at: string
}

interface ImportOptions {
  filename: string
  batchSize: number
  delay: number
  testMode: boolean
  skipSpotify: boolean
  startIndex: number
  maxAlbums?: number
}

class VinylImporter {
  private client: any
  private processedCount = 0
  private successCount = 0
  private errorCount = 0
  private spotifyMatches = 0

  constructor() {
    this.client = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
  }

  async importFromFile(options: ImportOptions) {
    console.log('🎵 Vinyl Data Import & Enrichment')
    console.log('=================================\n')

    // Read export file
    const exportData = JSON.parse(readFileSync(options.filename, 'utf8'))
    let albums: ExportedAlbum[] = exportData.albums

    console.log(`📁 Source: ${options.filename}`)
    console.log(`📊 Total albums in export: ${albums.length}`)
    console.log(`🎯 Spotify enrichment: ${options.skipSpotify ? 'DISABLED' : 'ENABLED'}`)

    // Apply filters
    if (options.startIndex > 0) {
      albums = albums.slice(options.startIndex)
      console.log(`▶️  Starting from index: ${options.startIndex}`)
    }

    if (options.maxAlbums) {
      albums = albums.slice(0, options.maxAlbums)
      console.log(`🔢 Limited to: ${options.maxAlbums} albums`)
    }

    if (options.testMode) {
      albums = albums.slice(0, 5)
      console.log(`🧪 Test mode: Processing only 5 albums`)
    }

    console.log(`\nReady to process ${albums.length} albums`)

    if (!options.testMode && albums.length > 10) {
      const confirmed = await this.confirmImport(albums.length)
      if (!confirmed) {
        console.log('Import cancelled')
        process.exit(0)
      }
    }

    // Process in batches
    console.log('\n🚀 Starting import...\n')
    
    for (let i = 0; i < albums.length; i += options.batchSize) {
      const batch = albums.slice(i, i + options.batchSize)
      const batchNum = Math.floor(i / options.batchSize) + 1
      const totalBatches = Math.ceil(albums.length / options.batchSize)
      
      console.log(`📦 Batch ${batchNum}/${totalBatches} (${batch.length} albums)`)
      
      for (const album of batch) {
        await this.processAlbum(album, options.skipSpotify)
        
        // Small delay between albums
        if (!options.skipSpotify) {
          await this.delay(100)
        }
      }

      // Delay between batches
      if (i + options.batchSize < albums.length) {
        console.log(`⏳ Waiting ${options.delay}ms before next batch...\n`)
        await this.delay(options.delay)
      }
    }

    // Summary
    this.printSummary()
  }

  private async processAlbum(album: ExportedAlbum, skipSpotify: boolean) {
    this.processedCount++
    
    try {
      console.log(`${this.processedCount}. ${album.artist_name} - ${album.title}`)

      // Transform basic data
      let targetAlbum: Omit<Album, 'id' | 'created_at' | 'updated_at'> = {
        title: album.title,
        artist: album.artist_name,
        year: album.release_year,
        spotify_id: undefined,
        genres: [],
        audio_features: undefined,
        personal_vibes: [], // Leave empty for user to add personal vibes later
        thoughts: undefined, // Leave empty for user to add personal thoughts later
        cover_art_url: album.artwork_url,
        streaming_links: {},
        tracks: undefined
      }

      // Enrich with Spotify data
      if (!skipSpotify) {
        try {
          const spotifyData = await this.enrichWithSpotify(album)
          if (spotifyData) {
            targetAlbum = { ...targetAlbum, ...spotifyData }
            this.spotifyMatches++
            console.log(`   ✓ Spotify match found`)
          } else {
            console.log(`   ⚠ No Spotify match`)
          }
        } catch (error) {
          console.log(`   ⚠ Spotify error: ${error}`)
        }
      }

      // Validate
      const validation = AlbumValidator.validateAlbum(targetAlbum)
      if (!validation.isValid) {
        console.log(`   ❌ Validation failed: ${validation.errors[0]}`)
        this.errorCount++
        return
      }

      // Check for existing Spotify ID to avoid duplicates
      if (targetAlbum.spotify_id) {
        const { data: existing } = await this.client
          .from('albums')
          .select('id')
          .eq('spotify_id', targetAlbum.spotify_id)
          .single()

        if (existing) {
          console.log(`   ⚠ Skipped: Album already exists with Spotify ID ${targetAlbum.spotify_id}`)
          this.processedCount-- // Don't count as processed
          return
        }
      }

      // Insert into database
      const { error } = await this.client
        .from('albums')
        .insert(targetAlbum)

      if (error) {
        console.log(`   ❌ Database error: ${error.message}`)
        this.errorCount++
      } else {
        console.log(`   ✅ Imported successfully`)
        this.successCount++
      }

    } catch (error) {
      console.log(`   ❌ Failed: ${error}`)
      this.errorCount++
    }
  }

  private async enrichWithSpotify(album: ExportedAlbum) {
    const spotifyAlbum = await spotify.findBestAlbumMatch(album.artist_name, album.title)
    
    if (!spotifyAlbum) return null

    try {
      const detailed = await spotify.getAlbumWithDetails(spotifyAlbum.id)
      
      // Get artist genres
      let genres: string[] = []
      if (detailed.artists?.[0]) {
        const artist = await spotify.getArtist(detailed.artists[0].id)
        genres = artist.genres || []
      }

      // Audio features are no longer available (deprecated API)
      // We'll rely on genre-based inference instead
      let audioFeatures: SpotifyAudioFeatures | undefined

      // Process tracks - handle duplicate track numbers from multi-disc albums
      const tracks = detailed.tracks?.items?.map((track, index) => ({
        id: crypto.randomUUID(),
        name: track.name,
        track_number: track.track_number || (index + 1), // Fallback to sequence number
        duration_ms: track.duration_ms,
        preview_url: track.preview_url,
        spotify_id: track.id
      })) || []

      // Fix duplicate track numbers by making them sequential
      tracks.forEach((track, index) => {
        track.track_number = index + 1
      })

      return {
        spotify_id: spotifyAlbum.id,
        genres,
        audio_features: audioFeatures,
        cover_art_url: detailed.images?.[0]?.url || album.artwork_url,
        streaming_links: {
          spotify: detailed.external_urls?.spotify
        },
        tracks: tracks.length > 0 ? tracks : undefined
      }
    } catch (error) {
      console.log(`     Spotify detail fetch failed: ${error}`)
      return null
    }
  }


  private average(numbers: number[]): number {
    return numbers.reduce((sum, n) => sum + n, 0) / numbers.length
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  private async confirmImport(count: number): Promise<boolean> {
    const readline = require('readline').createInterface({
      input: process.stdin,
      output: process.stdout
    })

    return new Promise((resolve) => {
      readline.question(
        `Import ${count} albums with Spotify enrichment? This will make API calls. (y/N): `,
        (answer: string) => {
          readline.close()
          resolve(answer.toLowerCase() === 'y')
        }
      )
    })
  }

  private printSummary() {
    console.log('\n' + '='.repeat(50))
    console.log('🎉 IMPORT COMPLETE')
    console.log('='.repeat(50))
    console.log(`📊 Processed: ${this.processedCount}`)
    console.log(`✅ Successful: ${this.successCount}`)
    console.log(`❌ Failed: ${this.errorCount}`)
    console.log(`🎵 Spotify matches: ${this.spotifyMatches}`)
    console.log(`🔗 API calls made: ${spotify.getRequestCount()}`)
    
    if (this.successCount > 0) {
      console.log(`\n🚀 Success! Check your database for ${this.successCount} imported albums.`)
    }
  }
}

// CLI
async function main() {
  const args = process.argv.slice(2)
  
  if (args.length === 0 || args.includes('--help')) {
    console.log(`
Usage: npx tsx scripts/import-and-enrich.ts <export-file.json> [options]

Options:
  --batch-size <n>     Albums per batch (default: 5)
  --delay <ms>         Delay between batches (default: 2000)
  --test               Test mode - import only 5 albums
  --skip-spotify       Skip Spotify enrichment
  --start-index <n>    Start from album index (default: 0)
  --max-albums <n>     Maximum albums to import

Examples:
  # Test import
  npx tsx scripts/import-and-enrich.ts vinyl-export-2025-01-26.json --test

  # Import without Spotify (fast)
  npx tsx scripts/import-and-enrich.ts vinyl-export-2025-01-26.json --skip-spotify

  # Full import with enrichment
  npx tsx scripts/import-and-enrich.ts vinyl-export-2025-01-26.json
`)
    process.exit(0)
  }

  const filename = args[0]
  const options: ImportOptions = {
    filename,
    batchSize: 5,
    delay: 2000,
    testMode: false,
    skipSpotify: false,
    startIndex: 0
  }

  // Parse options
  for (let i = 1; i < args.length; i += 2) {
    const flag = args[i]
    const value = args[i + 1]

    switch (flag) {
      case '--batch-size':
        options.batchSize = parseInt(value)
        break
      case '--delay':
        options.delay = parseInt(value)
        break
      case '--start-index':
        options.startIndex = parseInt(value)
        break
      case '--max-albums':
        options.maxAlbums = parseInt(value)
        break
      case '--test':
        options.testMode = true
        i-- // No value
        break
      case '--skip-spotify':
        options.skipSpotify = true
        i-- // No value
        break
    }
  }

  const importer = new VinylImporter()
  await importer.importFromFile(options)
}

main().catch(console.error)