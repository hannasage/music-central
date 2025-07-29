import { NextRequest, NextResponse } from 'next/server'
import { createServerComponentClient } from '@/lib/supabase'
import { sortAlbumsByArtist } from '@/lib/sorting'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerComponentClient()
    
    // Get query parameters
    const { searchParams } = new URL(request.url)
    const limit = searchParams.get('limit')
    const offset = searchParams.get('offset')

    // Get all albums and count
    const { data: allAlbums, error, count } = await supabase
      .from('albums')
      .select('*', { count: 'exact' })

    if (error) {
      console.error('Error fetching albums:', error)
      return NextResponse.json(
        { error: 'Failed to fetch albums' },
        { status: 500 }
      )
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

    return NextResponse.json({
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
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}