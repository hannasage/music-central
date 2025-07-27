import { createClient, createServerComponentClient } from './supabase'
import { Album } from './types'

export async function getFeaturedAlbums(limit = 4): Promise<Album[]> {
  const supabase = createClient()
  
  const { data: albums, error } = await supabase
    .from('albums')
    .select('*')
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
  
  const offset = (page - 1) * limit

  const { data: albums, error, count } = await supabase
    .from('albums')
    .select('*', { count: 'exact' })
    .order('artist', { ascending: true })
    .order('year', { ascending: true })
    .range(offset, offset + limit - 1)

  if (error) {
    console.error('Error fetching albums:', error)
    return { albums: [], total: 0, totalPages: 0 }
  }

  const total = count || 0
  const totalPages = Math.ceil(total / limit)

  return { 
    albums: albums || [], 
    total,
    totalPages
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