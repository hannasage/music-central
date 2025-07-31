import { SupabaseClient } from '@supabase/supabase-js'

// Common types for agent tools
export interface ToolContext {
  supabase: SupabaseClient
  cookieStore: {
    getAll(): Array<{ name: string; value: string }>
    set(name: string, value: string, options?: Record<string, unknown>): void
  }
}

export interface VercelDeploymentResult {
  deploymentId: string
  status: string
  message: string
}

export interface VercelStatusResult {
  status: string
  isReady: boolean
  isFailed: boolean
  isBuilding: boolean
  url?: string
  message: string
}

export interface AlbumSearchResult {
  results: Array<{
    id: string
    title: string
    artist: string
    year: number
    genres?: string[]
    personal_vibes?: string[]
    featured?: boolean
  }>
  total: number
}

// Environment validation types
export interface VercelConfig {
  token: string
  githubOrg: string
  repoName: string
  projectName: string
}

export interface EnvironmentValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
}