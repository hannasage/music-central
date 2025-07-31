import { NextRequest } from 'next/server'
import { withAuth, createErrorResponse, createSuccessResponse } from '@/lib/api-helpers'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    return await withAuth(async (user, supabase) => {
      const { data: album, error } = await supabase
        .from('albums')
        .select('*')
        .eq('id', id)
        .single()

      if (error) {
        console.error('Error fetching album:', error)
        if (error.code === 'PGRST116') {
          return createErrorResponse('Album not found', 404)
        }
        return createErrorResponse('Failed to fetch album', 500)
      }

      if (!album) {
        return createErrorResponse('Album not found', 404)
      }

      return createSuccessResponse({ album })
    })

  } catch (error) {
    console.error('Album fetch API error:', error)
    return createErrorResponse('Internal server error', 500)
  }
}