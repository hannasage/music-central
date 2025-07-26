#!/usr/bin/env npx tsx

import 'dotenv/config'
import spotify from '../lib/spotify'

async function testSpotify() {
  console.log('🎵 Testing Spotify API Connection')
  console.log('================================\n')

  // Check environment variables
  console.log('Environment Variables:')
  console.log(`SPOTIFY_CLIENT_ID: ${process.env.SPOTIFY_CLIENT_ID ? '✓ Set' : '❌ Missing'}`)
  console.log(`SPOTIFY_CLIENT_SECRET: ${process.env.SPOTIFY_CLIENT_SECRET ? '✓ Set' : '❌ Missing'}`)
  
  if (!process.env.SPOTIFY_CLIENT_ID || !process.env.SPOTIFY_CLIENT_SECRET) {
    console.error('\n❌ Spotify credentials not set in .env file')
    process.exit(1)
  }

  try {
    // Test 1: Basic search
    console.log('\n1. Testing basic album search...')
    const searchResult = await spotify.searchAlbum('The Beatles', 'Abbey Road', 1)
    console.log(`   ✓ Search successful: Found ${searchResult.albums.items.length} results`)
    
    if (searchResult.albums.items.length > 0) {
      const album = searchResult.albums.items[0]
      console.log(`   Album: ${album.name} by ${album.artists[0]?.name}`)
      console.log(`   Spotify ID: ${album.id}`)

      // Test 2: Get album details
      console.log('\n2. Testing album details...')
      const details = await spotify.getAlbumDetails(album.id)
      console.log(`   ✓ Album details retrieved`)
      console.log(`   Tracks: ${details.tracks?.items?.length || 0}`)
      console.log(`   Images: ${details.images?.length || 0}`)

      // Test 3: Get tracks
      console.log('\n3. Testing track listing...')
      const tracks = await spotify.getAlbumTracks(album.id)
      console.log(`   ✓ Tracks retrieved: ${tracks.items?.length || 0}`)
      
      // Test 4: Try audio features (this might fail)
      if (tracks.items && tracks.items.length > 0) {
        console.log('\n4. Testing audio features...')
        const trackIds = tracks.items.slice(0, 3).map(t => t.id).filter(Boolean)
        console.log(`   Attempting to get audio features for ${trackIds.length} tracks`)
        
        try {
          const audioFeatures = await spotify.getAudioFeatures(trackIds)
          console.log(`   ✓ Audio features retrieved: ${audioFeatures.audio_features?.length || 0}`)
        } catch (error) {
          console.log(`   ❌ Audio features failed: ${error}`)
          console.log(`   This might be due to API permissions or account type`)
        }
      }

      // Test 5: Try artist details
      if (album.artists?.[0]?.id) {
        console.log('\n5. Testing artist details...')
        try {
          const artist = await spotify.getArtist(album.artists[0].id)
          console.log(`   ✓ Artist details retrieved`)
          console.log(`   Genres: ${artist.genres?.join(', ') || 'None'}`)
        } catch (error) {
          console.log(`   ❌ Artist details failed: ${error}`)
        }
      }
    }

    console.log(`\n📊 Total API calls made: ${spotify.getRequestCount()}`)
    console.log('✅ Spotify API test completed')

  } catch (error) {
    console.error('\n❌ Spotify API test failed:', error)
    
    if (error instanceof Error) {
      if (error.message.includes('401')) {
        console.error('\n💡 This suggests authentication issues. Check your client ID and secret.')
      } else if (error.message.includes('403')) {
        console.error('\n💡 This suggests permission issues. Your app might need additional scopes or premium access.')
      } else if (error.message.includes('429')) {
        console.error('\n💡 Rate limit exceeded. Wait a moment and try again.')
      }
    }
    
    process.exit(1)
  }
}

testSpotify()