import { NextRequest } from 'next/server'
import { createServerComponentClient } from '@/lib/supabase'
import { createErrorResponse, createSuccessResponse } from '@/lib/api-helpers'
import { sortAlbumsByArtist } from '@/lib/sorting'
import { Album } from '@/lib/types'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerComponentClient()
    
    // Get query parameters
    const { searchParams } = new URL(request.url)
    const limit = searchParams.get('limit')
    const offset = searchParams.get('offset')

    // Get all albums and count (exclude removed albums)
    const { data: allAlbums, error, count } = await supabase
      .from('albums')
      .select('*', { count: 'exact' })
      .eq('removed', false)

    if (error) {
      console.error('Error fetching albums:', error)
      return createErrorResponse('Failed to fetch albums', 500)
    }

    // Sort by artist (ignoring articles) then by year
    const sortedAlbums = sortAlbumsByArtist(allAlbums || [])
      .sort((a, b) => {
        // Secondary sort by year if artists are the same
        const artistCompare = a.artist.localeCompare(b.artist)
        if (artistCompare === 0) {
          return a.year - b.year
        }
        return 0 // Keep artist sort order
      })

    // Apply pagination if specified
    let albums = sortedAlbums
    if (limit) {
      const limitNum = parseInt(limit, 10)
      const offsetNum = offset ? parseInt(offset, 10) : 0
      albums = sortedAlbums.slice(offsetNum, offsetNum + limitNum)
    }

    return createSuccessResponse({
      albums,
      count,
      pagination: limit ? {
        limit: parseInt(limit, 10),
        offset: offset ? parseInt(offset, 10) : 0,
        total: count
      } : null
    })

  } catch (error) {
    console.error('Albums API error:', error)
    return createErrorResponse('Internal server error', 500)
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerComponentClient()
    
    // Parse request body
    const body = await request.json()
    
    // Validate required fields
    const { title, artist, year, spotify_id, genres, cover_art_url, tracks, personal_vibes, thoughts, streaming_links, descriptors } = body
    
    if (!title || !artist || !year) {
      return createErrorResponse('Missing required fields: title, artist, year', 400)
    }

    // Prepare album data for insertion
    const albumData: Omit<Album, 'id' | 'created_at' | 'updated_at'> = {
      title: String(title).trim(),
      artist: String(artist).trim(),
      year: parseInt(String(year), 10),
      spotify_id: spotify_id || null,
      genres: Array.isArray(genres) ? genres : [],
      personal_vibes: Array.isArray(personal_vibes) ? personal_vibes : [],
      thoughts: thoughts || null,
      cover_art_url: cover_art_url || null,
      streaming_links: streaming_links || {},
      tracks: Array.isArray(tracks) ? tracks : [],
      featured: false,
      removed: false,
      descriptors: Array.isArray(descriptors) ? descriptors : []
    }

    // Validate year
    if (isNaN(albumData.year) || albumData.year < 1900 || albumData.year > new Date().getFullYear() + 1) {
      return createErrorResponse('Invalid year. Must be between 1900 and current year + 1', 400)
    }

    // Insert the album
    const { data: album, error } = await supabase
      .from('albums')
      .insert(albumData)
      .select()
      .single()

    if (error) {
      console.error('Error creating album:', error)
      
      // Handle unique constraint violations (spotify_id)
      if (error.code === '23505' && error.message.includes('spotify_id')) {
        return createErrorResponse('Album with this Spotify ID already exists', 409)
      }
      
      return createErrorResponse('Failed to create album', 500)
    }

    return createSuccessResponse({ 
      album,
      message: 'Album created successfully' 
    }, 201)

  } catch (error) {
    console.error('Album creation API error:', error)
    return createErrorResponse('Internal server error', 500)
  }
}