'use client'

import { useEffect, useState } from 'react'
import { createClientSideClient } from '@/lib/supabase-client'
import AIFloatingButton from './AIFloatingButton'
import type { User } from '@supabase/supabase-js'

export default function AuthenticatedAIChat() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClientSideClient()

  useEffect(() => {
    // Get initial session
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setUser(session?.user ?? null)
      setLoading(false)
    }

    getSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null)
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [supabase.auth])

  // Don't render anything while loading or if user is not authenticated
  if (loading || !user) {
    return null
  }

  return <AIFloatingButton />
}