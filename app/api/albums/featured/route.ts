import { NextRequest } from 'next/server'
import { createServerComponentClient } from '@/lib/supabase'
import { createErrorResponse, createSuccessResponse } from '@/lib/api-helpers'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerComponentClient()
    
    // Get query parameters
    const { searchParams } = new URL(request.url)
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!, 10) : 4

    // Get featured albums
    const { data: albums, error } = await supabase
      .from('albums')
      .select('*')
      .eq('featured', true)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('Error fetching featured albums:', error)
      return createErrorResponse('Failed to fetch featured albums', 500)
    }

    return createSuccessResponse({
      albums: albums || [],
      count: albums?.length || 0
    })

  } catch (error) {
    console.error('Featured albums API error:', error)
    return createErrorResponse('Internal server error', 500)
  }
}