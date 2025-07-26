#!/usr/bin/env npx tsx

import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'
import { writeFileSync } from 'fs'

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

async function exportVinylData() {
  console.log('📦 Exporting Vinyl DB Data')
  console.log('==========================\n')

  const sourceUrl = process.argv[2]
  const sourceKey = process.argv[3]

  if (!sourceUrl || !sourceKey) {
    console.error('Usage: npx tsx scripts/export-vinyl-data.ts <SOURCE_URL> <SOURCE_KEY>')
    console.error('Example: npx tsx scripts/export-vinyl-data.ts https://xxx.supabase.co eyJ...')
    process.exit(1)
  }

  const client = createClient(sourceUrl, sourceKey)

  try {
    // Fetch albums
    console.log('Fetching albums...')
    const { data: albums, error: albumError } = await client
      .from('album')
      .select('*')
      .order('created_at', { ascending: true })

    if (albumError) {
      throw new Error(`Failed to fetch albums: ${albumError.message}`)
    }

    // Fetch artists
    console.log('Fetching artists...')
    const { data: artists, error: artistError } = await client
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

    // Combine albums with artist names
    const albumsWithArtists = albums.map((album: SourceAlbum) => ({
      ...album,
      artist_name: artistMap.get(album.artist_id) || 'Unknown Artist'
    }))

    // Write to JSON file
    const exportData = {
      exported_at: new Date().toISOString(),
      source_url: sourceUrl,
      total_albums: albumsWithArtists.length,
      total_artists: artists.length,
      albums: albumsWithArtists,
      artists: artists
    }

    const filename = `vinyl-export-${new Date().toISOString().split('T')[0]}.json`
    writeFileSync(filename, JSON.stringify(exportData, null, 2))

    console.log(`✅ Export complete!`)
    console.log(`📁 File: ${filename}`)
    console.log(`📊 Albums: ${albumsWithArtists.length}`)
    console.log(`👤 Artists: ${artists.length}`)
    console.log(`\nNext step: Run import script with this file`)

  } catch (error) {
    console.error('❌ Export failed:', error)
    process.exit(1)
  }
}

exportVinylData()