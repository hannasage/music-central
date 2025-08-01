// Re-export repository functions for backward compatibility
import { createServerComponentClient } from './supabase'
import { albumRepository, createAlbumRepository } from './album-repository'
import { Album } from './types'

export async function getFeaturedAlbums(limit = 4): Promise<Album[]> {
  return albumRepository.getFeaturedAlbums(limit)
}

export async function getRecentlyAddedAlbums(limit = 12): Promise<Album[]> {
  return albumRepository.getRecentlyAddedAlbums(limit)
}

export async function getRandomAlbums(limit = 4): Promise<Album[]> {
  return albumRepository.getRandomAlbums(limit)
}

// Note: searchAlbums functionality moved to /lib/search-service.ts
// Import { searchAlbums } from './search-service' for album search functionality

export async function getAllAlbums(
  page: number = 1,
  limit: number = 24
): Promise<{ albums: Album[]; total: number; totalPages: number }> {
  // Use server component client for this function
  const supabase = await createServerComponentClient()
  const serverRepository = createAlbumRepository(supabase)
  
  return serverRepository.getAllAlbums(page, limit)
}

export async function getAlbumById(id: string, includeRemoved = false): Promise<Album | null> {
  return albumRepository.getAlbumById(id, includeRemoved)
}