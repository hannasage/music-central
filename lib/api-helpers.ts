import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { Database } from './types'

// Standardized error response helper
export function createErrorResponse(message: string, status: number = 500, details?: string) {
  return NextResponse.json(
    { 
      error: message,
      ...(details && { details })
    },
    { status }
  )
}

// Standardized success response helper
export function createSuccessResponse(data: unknown, status: number = 200) {
  return NextResponse.json(data, { status })
}

// Authentication helper that returns both user and supabase client
export async function authenticateRequest() {
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient<Database>(
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
    
    if (error || !user) {
      return {
        user: null,
        supabase,
        error: 'Unauthorized'
      }
    }

    return {
      user,
      supabase,
      error: null
    }
  } catch {
    return {
      user: null,
      supabase: null,
      error: 'Authentication failed'
    }
  }
}

// Helper for handling common API patterns
export async function withAuth<T>(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  handler: (user: any, supabase: any) => Promise<T>
): Promise<NextResponse | T> {
  const { user, supabase, error } = await authenticateRequest()
  
  if (error || !user || !supabase) {
    return createErrorResponse(error || 'Authentication required', 401)
  }

  return handler(user, supabase)
}

// Environment validation helper
export function validateEnvVars(requiredVars: string[]) {
  const missing = requiredVars.filter(varName => !process.env[varName])
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`)
  }
}