export interface SpotifyAudioFeatures {
  acousticness: number
  danceability: number
  energy: number
  instrumentalness: number
  liveness: number
  loudness: number
  speechiness: number
  tempo: number
  valence: number
  key: number
  mode: number
  time_signature: number
}

export interface Track {
  id: string
  name: string
  track_number: number
  duration_ms: number
  preview_url?: string
  spotify_id?: string
}

export interface StreamingLinks {
  spotify?: string
  apple_music?: string
  youtube_music?: string
}

export interface Album {
  id: string
  title: string
  artist: string
  year: number
  spotify_id?: string
  genres: string[]
  audio_features?: SpotifyAudioFeatures
  personal_vibes: string[]
  thoughts?: string
  cover_art_url?: string
  streaming_links: StreamingLinks
  tracks?: Track[]
  featured: boolean
  removed: boolean
  created_at: string
  updated_at: string
}

export interface SpotifySearchResult {
  albums: {
    items: SpotifyAlbum[]
    total: number
  }
}

export interface SpotifyAlbum {
  id: string
  name: string
  artists: Array<{ id: string; name: string }>
  release_date: string
  images: Array<{ url: string; width: number; height: number }>
  genres: string[]
  external_urls: { spotify: string }
  tracks: {
    items: Array<{
      id: string
      name: string
      track_number: number
      duration_ms: number
      preview_url?: string
    }>
  }
}

export interface SpotifyArtist {
  id: string
  name: string
  genres: string[]
}


export interface ErrorLog {
  id: string
  timestamp: string
  level: 'warn' | 'error'
  message: string
  error_type: string
  severity: 'critical' | 'warning' | 'info'
  context: Record<string, unknown>
  error_details: {
    name: string
    message: string
    stack?: string
  } | null
  endpoint: string | null
  user_impact: string | null
  suggested_action: string | null
  fingerprint: string
  occurrence_count: number
  first_seen: string
  last_seen: string
  created_at: string
  updated_at: string
}

// AI Curator Types
export interface CuratorPreference {
  genres: string[]
  vibes: string[]
  weight: number
}

export interface CuratorConstraints {
  excludeGenres?: string[]
  excludeVibes?: string[]
  yearRange?: { min: number, max: number }
  artistDiversity?: boolean
  excludeArtists?: string[]
}

export interface CuratorCriteria {
  primary: CuratorPreference
  secondary?: CuratorPreference
  constraints?: CuratorConstraints
  reasoning: string
}

export interface CollectionMetadata {
  availableGenres: string[]
  availableVibes: string[]
  yearRange: { min: number, max: number }
  totalAlbums: number
}

export interface CuratorSelection {
  album1: Album
  album2: Album
  criteria: CuratorCriteria
  metadata: {
    primaryMatches: number
    secondaryMatches: number
    totalAvailable: number
  }
}

export type Database = {
  public: {
    Tables: {
      albums: {
        Row: Album
        Insert: Omit<Album, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Album, 'id' | 'created_at'>>
      }
      error_logs: {
        Row: ErrorLog
        Insert: Omit<ErrorLog, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<ErrorLog, 'id' | 'created_at'>>
      }
    }
  }
}