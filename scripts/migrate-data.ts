#!/usr/bin/env npx tsx

import 'dotenv/config'
import VinylMigrationService from '../lib/migration'
import { MigrationSummary } from '../lib/types'

interface MigrationOptions {
  sourceUrl: string
  sourceKey: string
  batchSize?: number
  delay?: number
  startIndex?: number
  maxAlbums?: number
  testMode?: boolean
}

class MigrationRunner {
  private migrationService: VinylMigrationService

  constructor(private options: MigrationOptions) {
    this.migrationService = new VinylMigrationService(
      options.sourceUrl,
      options.sourceKey
    )
    
    if (options.batchSize) {
      this.migrationService.setBatchSize(options.batchSize)
    }
    
    if (options.delay) {
      this.migrationService.setDelayBetweenBatches(options.delay)
    }
  }

  async run(): Promise<MigrationSummary> {
    console.log('🎵 Vinyl Catalog 2.0 - Data Migration')
    console.log('=====================================\n')

    // 1. Validate environment and connections
    console.log('Step 1: Validating migration environment...')
    const validation = await this.migrationService.validateMigration()
    
    if (!validation.isValid) {
      console.error('❌ Migration validation failed:')
      validation.issues.forEach(issue => console.error(`  - ${issue}`))
      process.exit(1)
    }
    console.log('✅ Environment validation passed\n')

    // 2. Fetch source data
    console.log('Step 2: Fetching source album data...')
    const sourceAlbums = await this.migrationService.fetchSourceAlbums()
    
    if (sourceAlbums.length === 0) {
      console.log('No albums found to migrate')
      process.exit(0)
    }

    // 3. Apply filters if specified
    let albumsToMigrate = sourceAlbums
    
    if (this.options.startIndex && this.options.startIndex > 0) {
      albumsToMigrate = albumsToMigrate.slice(this.options.startIndex)
      console.log(`Starting from index ${this.options.startIndex}`)
    }
    
    if (this.options.maxAlbums && this.options.maxAlbums > 0) {
      albumsToMigrate = albumsToMigrate.slice(0, this.options.maxAlbums)
      console.log(`Limiting to ${this.options.maxAlbums} albums`)
    }

    if (this.options.testMode) {
      albumsToMigrate = albumsToMigrate.slice(0, 5)
      console.log('🧪 Running in test mode - migrating first 5 albums only')
    }

    console.log(`Ready to migrate ${albumsToMigrate.length} albums\n`)

    // 4. Confirm migration (unless in test mode)
    if (!this.options.testMode) {
      const confirmed = await this.confirmMigration(albumsToMigrate.length)
      if (!confirmed) {
        console.log('Migration cancelled by user')
        process.exit(0)
      }
    }

    // 5. Run migration
    console.log('Step 3: Starting migration...')
    const startTime = Date.now()
    
    const summary = await this.migrationService.migrateBatch(
      albumsToMigrate, 
      this.options.startIndex || 0
    )

    // 6. Generate final report
    this.generateReport(summary, startTime)
    
    return summary
  }

  private async confirmMigration(count: number): Promise<boolean> {
    const readline = require('readline').createInterface({
      input: process.stdin,
      output: process.stdout
    })

    return new Promise((resolve) => {
      readline.question(
        `Are you sure you want to migrate ${count} albums? This will make Spotify API calls and insert data into your database. (y/N): `,
        (answer: string) => {
          readline.close()
          resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes')
        }
      )
    })
  }

  private generateReport(summary: MigrationSummary, startTime: number): void {
    const totalTime = Date.now() - startTime
    const successRate = (summary.successful / summary.total_processed * 100).toFixed(1)
    const spotifyMatchRate = (summary.spotify_matches / summary.total_processed * 100).toFixed(1)

    console.log('\n' + '='.repeat(50))
    console.log('🎉 MIGRATION COMPLETE')
    console.log('='.repeat(50))
    console.log(`📊 Total Albums Processed: ${summary.total_processed}`)
    console.log(`✅ Successful Migrations: ${summary.successful} (${successRate}%)`)
    console.log(`❌ Failed Migrations: ${summary.failed}`)
    console.log(`🎵 Spotify Matches Found: ${summary.spotify_matches} (${spotifyMatchRate}%)`)
    console.log(`⏱️ Total Time: ${(totalTime / 1000).toFixed(2)} seconds`)
    console.log(`🔗 Spotify API Calls Made: ${require('../lib/spotify').default.getRequestCount()}`)

    if (summary.errors.length > 0) {
      console.log('\n❌ ERRORS ENCOUNTERED:')
      summary.errors.forEach((error, index) => {
        console.log(`${index + 1}. ${error}`)
      })
    }

    if (summary.failed > 0) {
      console.log('\n💡 RECOMMENDATIONS:')
      console.log('- Review failed albums and retry with manual corrections')
      console.log('- Check Spotify API rate limits if many failures occurred')
      console.log('- Verify network connectivity for timeouts')
    }

    console.log('\n🚀 Next Steps:')
    console.log('- Review migrated data in your new database')
    console.log('- Test the application with the migrated data')
    console.log('- Consider running additional data quality checks')
    console.log('')
  }
}

// CLI argument parsing
function parseArgs(): MigrationOptions {
  const args = process.argv.slice(2)
  const options: Partial<MigrationOptions> = {}

  for (let i = 0; i < args.length; i += 2) {
    const flag = args[i]
    const value = args[i + 1]

    switch (flag) {
      case '--source-url':
        options.sourceUrl = value
        break
      case '--source-key':
        options.sourceKey = value
        break
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
        i-- // No value for this flag
        break
      case '--help':
        printHelp()
        process.exit(0)
    }
  }

  // Validate required options
  if (!options.sourceUrl || !options.sourceKey) {
    console.error('❌ Required parameters missing.')
    console.error('Use --help for usage information.')
    process.exit(1)
  }

  return options as MigrationOptions
}

function printHelp(): void {
  console.log(`
🎵 Vinyl Catalog 2.0 - Data Migration Script

USAGE:
  npx tsx scripts/migrate-data.ts --source-url <URL> --source-key <KEY> [OPTIONS]

REQUIRED:
  --source-url     Supabase URL of the source vinyl-db project
  --source-key     Supabase anon/service key for source project

OPTIONS:
  --batch-size     Number of albums to process in each batch (default: 10)
  --delay          Milliseconds to wait between batches (default: 2000)
  --start-index    Start migration from this album index (default: 0)
  --max-albums     Maximum number of albums to migrate (default: all)
  --test           Run test migration with first 5 albums only
  --help           Show this help message

EXAMPLES:
  # Test migration with first 5 albums
  npx tsx scripts/migrate-data.ts --source-url https://xxx.supabase.co --source-key xxx --test

  # Migrate all albums with custom batch size
  npx tsx scripts/migrate-data.ts --source-url https://xxx.supabase.co --source-key xxx --batch-size 5

  # Resume migration from album index 50
  npx tsx scripts/migrate-data.ts --source-url https://xxx.supabase.co --source-key xxx --start-index 50

ENVIRONMENT VARIABLES:
  Make sure these are set in your .env.local file:
  - NEXT_PUBLIC_SUPABASE_URL (target database)
  - NEXT_PUBLIC_SUPABASE_ANON_KEY (target database)
  - SPOTIFY_CLIENT_ID
  - SPOTIFY_CLIENT_SECRET
`)
}

// Main execution
async function main(): Promise<void> {
  try {
    const options = parseArgs()
    const runner = new MigrationRunner(options)
    await runner.run()
  } catch (error) {
    console.error('\n❌ Migration failed:', error)
    process.exit(1)
  }
}

// Run if called directly
if (require.main === module) {
  main()
}

export { MigrationRunner, MigrationOptions }