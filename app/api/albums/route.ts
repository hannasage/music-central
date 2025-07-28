import { NextRequest, NextResponse } from 'next/server'
import { createServerComponentClient } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerComponentClient()
    
    // Get query parameters
    const { searchParams } = new URL(request.url)
    const limit = searchParams.get('limit')
    const offset = searchParams.get('offset')
    const orderBy = searchParams.get('order_by') || 'created_at'
    const orderDirection = searchParams.get('order_direction') || 'desc'

    // Build query with count
    let query = supabase
      .from('albums')
      .select('*', { count: 'exact' })

    // Apply ordering
    const validOrderFields = ['created_at', 'title', 'artist', 'year'] as const
    const orderField = validOrderFields.includes(orderBy as typeof validOrderFields[number]) 
      ? orderBy as typeof validOrderFields[number] 
      : 'created_at'
    
    query = query.order(orderField, { ascending: orderDirection === 'asc' })

    // Apply pagination if specified
    if (limit) {
      const limitNum = parseInt(limit, 10)
      const offsetNum = offset ? parseInt(offset, 10) : 0
      query = query.range(offsetNum, offsetNum + limitNum - 1)
    }

    const { data: albums, error, count } = await query

    if (error) {
      console.error('Error fetching albums:', error)
      return NextResponse.json(
        { error: 'Failed to fetch albums' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      albums: albums || [],
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