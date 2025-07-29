import { NextRequest, NextResponse } from 'next/server'
import { createServerComponentClient } from '@/lib/supabase'

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
      return NextResponse.json(
        { error: 'Failed to fetch featured albums' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      albums: albums || [],
      count: albums?.length || 0
    })

  } catch (error) {
    console.error('Featured albums API error:', error)
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}