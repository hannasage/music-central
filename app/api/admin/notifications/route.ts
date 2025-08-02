import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { notificationService } from '@/lib/services/notification.service'

/**
 * Admin notification management API
 * GET: Retrieve pending notifications
 * POST: Mark notifications as acknowledged
 * DELETE: Clear acknowledged notifications
 */

async function checkAuthentication() {
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
  return user
}

/**
 * GET /api/admin/notifications
 * Retrieve all pending notifications and counts
 */
export async function GET() {
  try {
    const user = await checkAuthentication()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const pendingNotifications = notificationService.getPendingNotifications()
    const unacknowledgedCount = notificationService.getUnacknowledgedCount()

    return NextResponse.json({
      notifications: pendingNotifications,
      unacknowledgedCount,
      total: pendingNotifications.length
    })

  } catch (error) {
    console.error('Error fetching notifications:', error)
    return NextResponse.json(
      { error: 'Failed to fetch notifications' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/admin/notifications
 * Mark notifications as acknowledged
 * Body: { notificationIds?: string[], acknowledgeAll?: boolean }
 */
export async function POST(request: NextRequest) {
  try {
    const user = await checkAuthentication()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { notificationIds, acknowledgeAll } = body

    if (acknowledgeAll) {
      const count = notificationService.acknowledgeAllNotifications()
      return NextResponse.json({
        success: true,
        message: `Acknowledged ${count} notifications`,
        acknowledgedCount: count
      })
    }

    if (notificationIds && Array.isArray(notificationIds)) {
      let acknowledgedCount = 0
      notificationIds.forEach(id => {
        if (notificationService.acknowledgeNotification(id)) {
          acknowledgedCount++
        }
      })
      
      return NextResponse.json({
        success: true,
        message: `Acknowledged ${acknowledgedCount} notifications`,
        acknowledgedCount
      })
    }

    return NextResponse.json(
      { error: 'Invalid request body. Provide notificationIds array or acknowledgeAll: true' },
      { status: 400 }
    )

  } catch (error) {
    console.error('Error acknowledging notifications:', error)
    return NextResponse.json(
      { error: 'Failed to acknowledge notifications' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/admin/notifications
 * Clear acknowledged notifications
 */
export async function DELETE() {
  try {
    const user = await checkAuthentication()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const clearedCount = notificationService.clearAcknowledgedNotifications()

    return NextResponse.json({
      success: true,
      message: `Cleared ${clearedCount} acknowledged notifications`,
      clearedCount
    })

  } catch (error) {
    console.error('Error clearing notifications:', error)
    return NextResponse.json(
      { error: 'Failed to clear notifications' },
      { status: 500 }
    )
  }
}