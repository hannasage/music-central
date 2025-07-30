import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    // Check authentication
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          },
        },
      }
    )

    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { featured } = await request.json()

    if (typeof featured !== 'boolean') {
      return NextResponse.json(
        { error: 'Featured must be a boolean value' },
        { status: 400 }
      )
    }

    // Update the album's featured status
    const { data: album, error } = await supabase
      .from('albums')
      .update({ featured })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating album featured status:', error)
      return NextResponse.json(
        { error: 'Failed to update album' },
        { status: 500 }
      )
    }

    if (!album) {
      return NextResponse.json(
        { error: 'Album not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      message: `Album "${album.title}" by ${album.artist} ${featured ? 'marked as featured' : 'removed from featured'}`,
      album
    })

  } catch (error) {
    console.error('Featured toggle API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}