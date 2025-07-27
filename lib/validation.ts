import { Album, SpotifyAudioFeatures } from './types'

export interface ValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
}

// Interface for track validation (handles partial/unknown data)
interface TrackValidationInput {
  name?: string
  track_number?: number
  duration_ms?: number
  id?: string
  preview_url?: string
  spotify_id?: string
}

export interface DataQualityReport {
  total_albums: number
  valid_albums: number
  albums_with_spotify: number
  albums_with_audio_features: number
  albums_with_tracks: number
  genre_coverage: number
  avg_tracks_per_album: number
  common_issues: string[]
  validation_summary: ValidationResult
}

export class AlbumValidator {
  static validateAlbum(album: Partial<Album>): ValidationResult {
    const errors: string[] = []
    const warnings: string[] = []

    // Required field validation
    if (!album.title || album.title.trim().length === 0) {
      errors.push('Title is required and cannot be empty')
    }

    if (!album.artist || album.artist.trim().length === 0) {
      errors.push('Artist is required and cannot be empty')
    }

    if (!album.year || album.year < 1900 || album.year > new Date().getFullYear() + 2) {
      errors.push(`Year must be between 1900 and ${new Date().getFullYear() + 2}`)
    }

    // Data quality checks
    if (album.title && album.title.length > 200) {
      warnings.push('Title is unusually long (>200 characters)')
    }

    if (album.artist && album.artist.length > 100) {
      warnings.push('Artist name is unusually long (>100 characters)')
    }

    if (album.genres && album.genres.length === 0) {
      warnings.push('No genres specified - consider adding at least one genre')
    }

    if (album.personal_vibes && album.personal_vibes.length === 0) {
      warnings.push('No personal vibes specified - consider adding descriptive tags')
    }

    // Spotify data validation
    if (album.spotify_id) {
      if (!/^[a-zA-Z0-9]{22}$/.test(album.spotify_id)) {
        errors.push('Invalid Spotify ID format')
      }
    }

    // Audio features validation
    if (album.audio_features) {
      const audioValidation = this.validateAudioFeatures(album.audio_features)
      errors.push(...audioValidation.errors)
      warnings.push(...audioValidation.warnings)
    }

    // URL validation
    if (album.cover_art_url && !this.isValidUrl(album.cover_art_url)) {
      warnings.push('Cover art URL appears to be invalid')
    }

    // Streaming links validation
    if (album.streaming_links) {
      Object.entries(album.streaming_links).forEach(([platform, url]) => {
        if (url && !this.isValidUrl(url)) {
          warnings.push(`Invalid URL for ${platform}`)
        }
      })
    }

    // Tracks validation
    if (album.tracks) {
      if (album.tracks.length === 0) {
        warnings.push('Tracks array is empty')
      } else {
        const trackValidation = this.validateTracks(album.tracks)
        errors.push(...trackValidation.errors)
        warnings.push(...trackValidation.warnings)
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    }
  }

  private static validateAudioFeatures(features: SpotifyAudioFeatures): ValidationResult {
    const errors: string[] = []
    const warnings: string[] = []

    const numericFields = [
      'acousticness', 'danceability', 'energy', 'instrumentalness',
      'liveness', 'speechiness', 'valence'
    ]

    numericFields.forEach(field => {
      const value = features[field as keyof SpotifyAudioFeatures] as number
      if (typeof value !== 'number' || value < 0 || value > 1) {
        errors.push(`${field} must be a number between 0 and 1`)
      }
    })

    if (typeof features.loudness !== 'number' || features.loudness < -60 || features.loudness > 0) {
      warnings.push('Loudness value is outside typical range (-60 to 0 dB)')
    }

    if (typeof features.tempo !== 'number' || features.tempo < 50 || features.tempo > 200) {
      warnings.push('Tempo value is outside typical range (50-200 BPM)')
    }

    if (![0, 1].includes(features.mode)) {
      errors.push('Mode must be 0 (minor) or 1 (major)')
    }

    if (features.key < 0 || features.key > 11) {
      errors.push('Key must be between 0 and 11')
    }

    return { isValid: errors.length === 0, errors, warnings }
  }

  private static validateTracks(tracks: unknown[]): ValidationResult {
    const errors: string[] = []
    const warnings: string[] = []

    // Type guard function to safely check track properties
    const isValidTrackInput = (track: unknown): track is TrackValidationInput => {
      return track !== null && typeof track === 'object'
    }

    tracks.forEach((track, index) => {
      if (!isValidTrackInput(track)) {
        errors.push(`Track ${index + 1}: Invalid track data`)
        return
      }

      // Validate track name
      if (!track.name || track.name.trim().length === 0) {
        errors.push(`Track ${index + 1}: Name is required`)
      }

      // Validate track number
      if (typeof track.track_number !== 'number' || track.track_number < 1) {
        errors.push(`Track ${index + 1}: Invalid track number`)
      }

      // Validate duration
      if (typeof track.duration_ms === 'number') {
        if (track.duration_ms < 1000) {
          warnings.push(`Track ${index + 1}: Duration seems unusually short`)
        }
        if (track.duration_ms > 1800000) { // 30 minutes
          warnings.push(`Track ${index + 1}: Duration seems unusually long`)
        }
      }
    })

    // Check for duplicate track numbers (only warn since we fix them automatically)
    const trackNumbers = tracks
      .filter(isValidTrackInput)
      .map(t => t.track_number)
      .filter((n): n is number => typeof n === 'number')
    
    const duplicateNumbers = trackNumbers.filter((n, i) => trackNumbers.indexOf(n) !== i)
    if (duplicateNumbers.length > 0) {
      warnings.push(`Track numbers were automatically resequenced (original had duplicates)`)
    }

    return { isValid: errors.length === 0, errors, warnings }
  }

  private static isValidUrl(url: string): boolean {
    try {
      new URL(url)
      return true
    } catch {
      return false
    }
  }

  static generateDataQualityReport(albums: Album[]): DataQualityReport {
    const validationResults = albums.map(album => this.validateAlbum(album))
    const validAlbums = validationResults.filter(r => r.isValid).length
    const albumsWithSpotify = albums.filter(a => a.spotify_id).length
    const albumsWithAudioFeatures = albums.filter(a => a.audio_features).length
    const albumsWithTracks = albums.filter(a => a.tracks && a.tracks.length > 0).length
    const albumsWithGenres = albums.filter(a => a.genres && a.genres.length > 0).length

    const totalTracks = albums.reduce((sum, album) => sum + (album.tracks?.length || 0), 0)
    const avgTracksPerAlbum = albums.length > 0 ? totalTracks / albums.length : 0

    // Collect common issues
    const allErrors = validationResults.flatMap(r => r.errors)
    const allWarnings = validationResults.flatMap(r => r.warnings)
    const issueFrequency = new Map<string, number>()

    ;[...allErrors, ...allWarnings].forEach(issue => {
      issueFrequency.set(issue, (issueFrequency.get(issue) || 0) + 1)
    })

    const commonIssues = Array.from(issueFrequency.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([issue, count]) => `${issue} (${count} occurrences)`)

    const overallValidation: ValidationResult = {
      isValid: validAlbums === albums.length,
      errors: allErrors,
      warnings: allWarnings
    }

    return {
      total_albums: albums.length,
      valid_albums: validAlbums,
      albums_with_spotify: albumsWithSpotify,
      albums_with_audio_features: albumsWithAudioFeatures,
      albums_with_tracks: albumsWithTracks,
      genre_coverage: albumsWithGenres / albums.length * 100,
      avg_tracks_per_album: Math.round(avgTracksPerAlbum * 10) / 10,
      common_issues: commonIssues,
      validation_summary: overallValidation
    }
  }

  static printQualityReport(report: DataQualityReport): void {
    console.log('\n📊 DATA QUALITY REPORT')
    console.log('='.repeat(40))
    console.log(`Total Albums: ${report.total_albums}`)
    console.log(`Valid Albums: ${report.valid_albums} (${(report.valid_albums / report.total_albums * 100).toFixed(1)}%)`)
    console.log(`Albums with Spotify Data: ${report.albums_with_spotify} (${(report.albums_with_spotify / report.total_albums * 100).toFixed(1)}%)`)
    console.log(`Albums with Audio Features: ${report.albums_with_audio_features} (${(report.albums_with_audio_features / report.total_albums * 100).toFixed(1)}%)`)
    console.log(`Albums with Track Lists: ${report.albums_with_tracks} (${(report.albums_with_tracks / report.total_albums * 100).toFixed(1)}%)`)
    console.log(`Genre Coverage: ${report.genre_coverage.toFixed(1)}%`)
    console.log(`Average Tracks per Album: ${report.avg_tracks_per_album}`)

    if (report.common_issues.length > 0) {
      console.log('\nMost Common Issues:')
      report.common_issues.forEach((issue, index) => {
        console.log(`${index + 1}. ${issue}`)
      })
    }

    const errorCount = report.validation_summary.errors.length
    const warningCount = report.validation_summary.warnings.length

    console.log(`\nValidation Summary: ${errorCount} errors, ${warningCount} warnings`)

    if (report.validation_summary.isValid) {
      console.log('✅ All albums passed validation!')
    } else {
      console.log('⚠️  Some albums have validation issues that should be reviewed.')
    }
  }
}

export default AlbumValidator