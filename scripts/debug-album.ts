#!/usr/bin/env npx tsx

import 'dotenv/config'
import spotify from '../lib/spotify'

async function debugSpecificAlbum() {
  console.log('🐛 Debugging Specific Album Issue')
  console.log('=================================\n')

  try {
    // Test the exact albums that were failing
    const testAlbums = [
      { artist: 'beabadoobee', title: 'Fake It Flowers' },
      { artist: 'The 1975', title: 'Live From Gorilla' }
    ]

    for (const testAlbum of testAlbums) {
      console.log(`\nTesting: ${testAlbum.artist} - ${testAlbum.title}`)
      console.log('=' .repeat(50))

      // Step 1: Find best match
      const match = await spotify.findBestAlbumMatch(testAlbum.artist, testAlbum.title)
      if (!match) {
        console.log('❌ No Spotify match found')
        continue
      }

      console.log(`✓ Found match: ${match.name} (${match.id})`)

      // Step 2: Get album with details (this is where the error occurs)
      console.log('\nGetting album details...')
      try {
        const detailed = await spotify.getAlbumWithDetails(match.id)
        console.log(`✓ Album details retrieved`)
        console.log(`  - Tracks: ${detailed.tracks?.items?.length || 0}`)
        console.log(`  - Audio features: ${detailed.audio_features?.length || 0}`)
        console.log(`  - Artists: ${detailed.artists?.length || 0}`)
        
        // Step 3: Test individual components
        console.log('\nTesting individual API calls...')
        
        // Test tracks separately
        const tracks = await spotify.getAlbumTracks(match.id)
        console.log(`✓ Tracks fetched: ${tracks.items?.length || 0}`)
        
        // Test audio features separately
        if (tracks.items && tracks.items.length > 0) {
          const trackIds = tracks.items.slice(0, 5).map(t => t.id).filter(Boolean)
          console.log(`Attempting audio features for ${trackIds.length} tracks: ${trackIds.slice(0, 3).join(', ')}...`)
          
          const audioFeatures = await spotify.getAudioFeatures(trackIds)
          console.log(`✓ Audio features response: ${audioFeatures.audio_features?.length || 0} items`)
          
          if (audioFeatures.audio_features?.length > 0) {
            const firstFeature = audioFeatures.audio_features[0]
            console.log(`  Sample feature: danceability=${firstFeature?.danceability}, energy=${firstFeature?.energy}`)
          }
        }

      } catch (error) {
        console.error(`❌ Error getting album details: ${error}`)
        
        // Let's see which specific call is failing
        console.log('\nTesting individual calls to isolate the issue...')
        
        try {
          await spotify.getAlbumDetails(match.id)
          console.log('✓ getAlbumDetails works')
        } catch (e) {
          console.log(`❌ getAlbumDetails fails: ${e}`)
        }
        
        try {
          await spotify.getAlbumTracks(match.id)
          console.log('✓ getAlbumTracks works')
        } catch (e) {
          console.log(`❌ getAlbumTracks fails: ${e}`)
        }
      }
    }

    console.log(`\n📊 Total API calls: ${spotify.getRequestCount()}`)

  } catch (error) {
    console.error('❌ Debug failed:', error)
  }
}

debugSpecificAlbum()