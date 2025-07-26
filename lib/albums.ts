import { createClient } from './supabase'
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