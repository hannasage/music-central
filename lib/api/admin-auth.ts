import { NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { User } from '@supabase/supabase-js'

/**
 * Admin authentication wrapper for API routes
 * Provides DRY authentication logic for admin-only endpoints
 */

export type AuthenticatedApiHandler<T = unknown> = (
  request: NextRequest,
  user: User,
  context?: T
) => Promise<Response>

export interface AdminAuthOptions {
  allowDevelopment?: boolean
  requireAuth?: boolean
}

/**
 * Higher-order function that wraps API handlers with admin authentication
 * @param handler - The authenticated API handler function
 * @param options - Authentication options
 */
export function withAdminAuth<T = unknown>(
  handler: AuthenticatedApiHandler<T>,
  options: AdminAuthOptions = { allowDevelopment: false, requireAuth: true }
) {
  return async (request: NextRequest, context?: T): Promise<Response> => {
    try {
      // Skip authentication in development if allowed
      if (options.allowDevelopment && process.env.NODE_ENV === 'development') {
        const mockUser = { id: 'dev-user', email: 'dev@example.com' } as User
        return await handler(request, mockUser, context)
      }

      // Skip authentication if not required
      if (!options.requireAuth) {
        const mockUser = { id: 'anonymous', email: 'anonymous@example.com' } as User
        return await handler(request, mockUser, context)
      }

      // Perform authentication
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

      const { data: { user }, error } = await supabase.auth.getUser()
      
      if (error) {
        console.error('Auth error:', error)
        return new Response('Authentication error', { status: 500 })
      }

      if (!user) {
        return new Response('Unauthorized', { status: 401 })
      }

      // Call the authenticated handler
      return await handler(request, user, context)

    } catch (error) {
      console.error('Admin auth wrapper error:', error)
      return new Response('Internal server error', { status: 500 })
    }
  }
}

/**
 * Simplified wrapper for handlers that don't need the request object
 */
export function withAdminAuthSimple(
  handler: (user: User) => Promise<Response>,
  options?: AdminAuthOptions
) {
  return withAdminAuth(async (request, user) => {
    return await handler(user)
  }, options)
}

/**
 * Wrapper for GET endpoints that typically don't need the request object
 */
export function withAdminAuthGet(
  handler: (user: User) => Promise<Response>,
  options?: AdminAuthOptions
) {
  return withAdminAuthSimple(handler, options)
}

/**
 * Wrapper for POST endpoints that need both request and user
 */
export function withAdminAuthPost(
  handler: (request: NextRequest, user: User) => Promise<Response>,
  options?: AdminAuthOptions
) {
  return withAdminAuth(handler, options)
}

/**
 * Wrapper for test endpoints (allows development access)
 */
export function withTestAuth(
  handler: AuthenticatedApiHandler,
  options: AdminAuthOptions = { allowDevelopment: true, requireAuth: true }
) {
  return withAdminAuth(handler, options)
}