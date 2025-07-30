import { createClient, createServerComponentClient } from './supabase'
import { Album } from './types'
import { sortAlbumsByArtist } from './sorting'

export async function getFeaturedAlbums(limit = 4): Promise<Album[]> {
  const supabase = createClient()
  
  const { data: albums, error } = await supabase
    .from('albums')
    .select('*')
    .eq('featured', true)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('Error fetching featured albums:', error)
    return []
  }

  return albums || []
}


export async function getRecentlyAddedAlbums(limit = 12): Promise<Album[]> {
  const supabase = createClient()
  
  const { data: albums, error } = await supabase
    .from('albums')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('Error fetching recently added albums:', error)
    return []
  }

  return albums || []
}

export async function getRandomAlbums(limit = 4): Promise<Album[]> {
  const supabase = createClient()
  
  // Use PostgreSQL random() function for truly random albums
  const { data: albums, error } = await supabase
    .from('albums')
    .select('*')
    .order('random()')
    .limit(limit)

  if (error) {
    console.error('Error fetching random albums:', error)
    return []
  }

  return albums || []
}

export async function searchAlbums(query: string, limit = 20): Promise<Album[]> {
  const supabase = createClient()
  
  const { data: albums, error } = await supabase
    .from('albums')
    .select('*')
    .or(`title.ilike.%${query}%,artist.ilike.%${query}%`)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('Error searching albums:', error)
    return []
  }

  return albums || []
}

export async function getAllAlbums(
  page: number = 1,
  limit: number = 24
): Promise<{ albums: Album[]; total: number; totalPages: number }> {
  const supabase = await createServerComponentClient()
  
  // Get total count
  const { count } = await supabase
    .from('albums')
    .select('*', { count: 'exact', head: true })

  if (!count) {
    return { albums: [], total: 0, totalPages: 0 }
  }

  // For large collections, we still need client-side sorting for proper artist sorting
  // But we can optimize by using database pagination for very large datasets
  const shouldUseClientSorting = count <= 1000 // Threshold can be adjusted

  if (shouldUseClientSorting) {
    // Get all albums for proper sorting, then paginate in memory (current behavior)
    const { data: allAlbums, error } = await supabase
      .from('albums')
      .select('*')

    if (error) {
      console.error('Error fetching albums:', error)
      return { albums: [], total: 0, totalPages: 0 }
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

    // Apply pagination
    const offset = (page - 1) * limit
    const paginatedAlbums = sortedAlbums.slice(offset, offset + limit)

    return { 
      albums: paginatedAlbums, 
      total: count,
      totalPages: Math.ceil(count / limit)
    }
  } else {
    // For very large datasets, use database sorting (simpler but less precise for articles)
    const offset = (page - 1) * limit
    const { data: albums, error } = await supabase
      .from('albums')
      .select('*')
      .order('artist')
      .order('year')
      .range(offset, offset + limit - 1)

    if (error) {
      console.error('Error fetching albums:', error)
      return { albums: [], total: 0, totalPages: 0 }
    }

    return { 
      albums: albums || [], 
      total: count,
      totalPages: Math.ceil(count / limit)
    }
  }
}

export async function getAlbumById(id: string): Promise<Album | null> {
  const supabase = createClient()
  
  const { data: album, error } = await supabase
    .from('albums')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    console.error('Error fetching album:', error)
    return null
  }

  return album
}