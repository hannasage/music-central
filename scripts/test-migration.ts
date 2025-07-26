#!/usr/bin/env npx tsx

import 'dotenv/config'
import { MigrationRunner } from './migrate-data'

async function testMigration() {
  console.log('🧪 Running Test Migration')
  console.log('========================\n')

  // Check if required environment variables are set
  const requiredEnvVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SPOTIFY_CLIENT_ID',
    'SPOTIFY_CLIENT_SECRET'
  ]

  const missingVars = requiredEnvVars.filter(varName => !process.env[varName])
  
  if (missingVars.length > 0) {
    console.error('❌ Missing required environment variables:')
    missingVars.forEach(varName => console.error(`  - ${varName}`))
    console.error('\nPlease set these in your .env.local file')
    process.exit(1)
  }

  // You'll need to provide these when ready to test
  const SOURCE_URL = process.env.VINYL_DB_URL || 'https://dwnodxgkqevbqfkfyggd.supabase.co'
  const SOURCE_KEY = process.env.VINYL_DB_KEY || 'your-vinyl-db-anon-key'

  if (!process.env.VINYL_DB_KEY) {
    console.log('⚠️  VINYL_DB_KEY not set in environment variables')
    console.log('To run the test migration, add to your .env.local:')
    console.log('VINYL_DB_KEY=your-vinyl-db-anon-key')
    console.log('\nFor now, testing with mock data...\n')
    
    // Test with mock validation
    await testValidationOnly()
    return
  }

  try {
    const runner = new MigrationRunner({
      sourceUrl: SOURCE_URL,
      sourceKey: SOURCE_KEY,
      testMode: true,
      batchSize: 2
    })

    const summary = await runner.run()
    
    console.log('\n🎉 Test migration completed!')
    console.log(`Results: ${summary.successful}/${summary.total_processed} successful`)
    
    if (summary.failed > 0) {
      console.log('❌ Some migrations failed - review errors above')
    }
    
  } catch (error) {
    console.error('❌ Test migration failed:', error)
    process.exit(1)
  }
}

async function testValidationOnly() {
  console.log('Testing validation functions with mock data...\n')
  
  const { AlbumValidator } = await import('../lib/validation')
  
  // Mock album data for testing
  const mockAlbum = {
    id: 'test-id',
    title: 'Abbey Road',
    artist: 'The Beatles',
    year: 1969,
    spotify_id: '0ETFjACtuP2ADo6LFhL6HN',
    genres: ['rock', 'pop'],
    personal_vibes: ['classic', 'innovative'],
    cover_art_url: 'https://example.com/cover.jpg',
    streaming_links: {
      spotify: 'https://open.spotify.com/album/0ETFjACtuP2ADo6LFhL6HN'
    },
    tracks: [
      {
        id: 'track-1',
        name: 'Come Together',
        track_number: 1,
        duration_ms: 259000
      },
      {
        id: 'track-2', 
        name: 'Something',
        track_number: 2,
        duration_ms: 183000
      }
    ],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }

  const validation = AlbumValidator.validateAlbum(mockAlbum)
  
  console.log('Mock Album Validation:')
  console.log(`✅ Valid: ${validation.isValid}`)
  console.log(`Errors: ${validation.errors.length}`)
  console.log(`Warnings: ${validation.warnings.length}`)
  
  if (validation.errors.length > 0) {
    console.log('\nErrors:')
    validation.errors.forEach(error => console.log(`  - ${error}`))
  }
  
  if (validation.warnings.length > 0) {
    console.log('\nWarnings:')
    validation.warnings.forEach(warning => console.log(`  - ${warning}`))
  }

  // Test quality report
  const report = AlbumValidator.generateDataQualityReport([mockAlbum])
  AlbumValidator.printQualityReport(report)
  
  console.log('\n✅ Validation testing completed!')
}

// Run the test
testMigration().catch(console.error)