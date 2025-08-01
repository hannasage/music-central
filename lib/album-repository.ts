import { createClient } from './supabase'
import { Album } from './types'
import { sortAlbumsByArtist } from './sorting'
import { logger } from './logger'
import type { SupabaseClient } from '@supabase/supabase-js'

interface QueryOptions {
  limit?: number
  offset?: number
  orderBy?: string
  ascending?: boolean
  featured?: boolean
  random?: boolean
}

interface PaginationResult {
  albums: Album[]
  total: number
  totalPages: number
}

export class BaseAlbumRepository {
  private supabase: SupabaseClient

  constructor(supabase?: SupabaseClient) {
    this.supabase = supabase || createClient()
  }

  /**
   * Base query builder with common filters and options
   */
  private buildBaseQuery(options: QueryOptions = {}) {
    let query = this.supabase
      .from('albums')
      .select('*')
      .eq('removed', false) // Always exclude removed albums

    // Add featured filter if specified
    if (options.featured !== undefined) {
      query = query.eq('featured', options.featured)
    }

    // Add ordering
    if (options.random) {
      query = query.order('random()')
    } else if (options.orderBy) {
      query = query.order(options.orderBy, { ascending: options.ascending ?? false })
    } else {
      // Default ordering by created_at descending
      query = query.order('created_at', { ascending: false })
    }

    // Add limit
    if (options.limit) {
      query = query.limit(options.limit)
    }

    // Add offset for pagination
    if (options.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 10) - 1)
    }

    return query
  }

  /**
   * Execute query with proper error handling and logging
   */
  private async executeQuery(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    query: any,
    operation: string,
    context?: Record<string, unknown>
  ): Promise<Album[]> {
    try {
      const { data: albums, error } = await query

      if (error) {
        logger.dbError(operation, error, context)
        return []
      }

      logger.debug(`${operation} completed successfully`, { 
        ...context, 
        resultCount: albums?.length || 0 
      })

      return albums || []
    } catch (error) {
      logger.dbError(operation, error as Error, context)
      return []
    }
  }

  /**
   * Get total count of non-removed albums
   */
  async getTotalCount(): Promise<number> {
    try {
      const { count, error } = await this.supabase
        .from('albums')
        .select('*', { count: 'exact', head: true })
        .eq('removed', false)

      if (error) {
        logger.dbError('getTotalCount', error)
        return 0
      }

      return count || 0
    } catch (error) {
      logger.dbError('getTotalCount', error as Error)
      return 0
    }
  }

  /**
   * Get featured albums
   */
  async getFeaturedAlbums(limit = 4): Promise<Album[]> {
    const query = this.buildBaseQuery({
      featured: true,
      limit,
      orderBy: 'created_at',
      ascending: false
    })

    return this.executeQuery(query, 'getFeaturedAlbums', { limit })
  }

  /**
   * Get recently added albums
   */
  async getRecentlyAddedAlbums(limit = 12): Promise<Album[]> {
    const query = this.buildBaseQuery({
      limit,
      orderBy: 'created_at',
      ascending: false
    })

    return this.executeQuery(query, 'getRecentlyAddedAlbums', { limit })
  }

  /**
   * Get random albums
   */
  async getRandomAlbums(limit = 4): Promise<Album[]> {
    const query = this.buildBaseQuery({
      limit,
      random: true
    })

    return this.executeQuery(query, 'getRandomAlbums', { limit })
  }

  /**
   * Get album by ID
   */
  async getAlbumById(id: string, includeRemoved = false): Promise<Album | null> {
    try {
      let query = this.supabase
        .from('albums')
        .select('*')
        .eq('id', id)

      // Filter out removed albums unless explicitly requested
      if (!includeRemoved) {
        query = query.eq('removed', false)
      }

      const { data: albums, error } = await query.single()

      if (error) {
        logger.dbError('getAlbumById', error, { id, includeRemoved })
        return null
      }

      logger.debug('getAlbumById completed successfully', { id, found: !!albums })
      return albums
    } catch (error) {
      logger.dbError('getAlbumById', error as Error, { id, includeRemoved })
      return null
    }
  }

  /**
   * Get all albums with pagination and sorting
   */
  async getAllAlbums(
    page: number = 1,
    limit: number = 24
  ): Promise<PaginationResult> {
    try {
      // Get total count first
      const total = await this.getTotalCount()
      
      if (total === 0) {
        return { albums: [], total: 0, totalPages: 0 }
      }

      const totalPages = Math.ceil(total / limit)

      // For large collections, use client-side sorting for better accuracy
      const shouldUseClientSorting = total <= 1000

      if (shouldUseClientSorting) {
        // Get all albums for proper sorting, then paginate in memory
        const allAlbums = await this.executeQuery(
          this.buildBaseQuery(),
          'getAllAlbums_clientSort',
          { total, page, limit }
        )

        // Sort by artist (ignoring articles) then by year
        const sortedAlbums = sortAlbumsByArtist(allAlbums)
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

        logger.info('getAllAlbums (client-sorted) completed', {
          page,
          limit,
          total,
          totalPages,
          returnedCount: paginatedAlbums.length
        })

        return { 
          albums: paginatedAlbums, 
          total,
          totalPages
        }
      } else {
        // For very large datasets, use database sorting
        const offset = (page - 1) * limit
        const query = this.buildBaseQuery({
          limit,
          offset,
          orderBy: 'artist',
          ascending: true
        })

        const albums = await this.executeQuery(
          query,
          'getAllAlbums_dbSort',
          { page, limit, total, offset }
        )

        logger.info('getAllAlbums (db-sorted) completed', {
          page,
          limit,
          total,
          totalPages,
          returnedCount: albums.length
        })

        return { 
          albums, 
          total,
          totalPages
        }
      }
    } catch (error) {
      logger.error('getAllAlbums failed', { page, limit }, error as Error)
      return { albums: [], total: 0, totalPages: 0 }
    }
  }
}

// Export singleton instance for convenience
export const albumRepository = new BaseAlbumRepository()

// Export factory function for custom clients (e.g., server components)
export const createAlbumRepository = (supabase?: SupabaseClient) => 
  new BaseAlbumRepository(supabase)