import { Suspense } from 'react'
import type { Metadata } from 'next'
import { createServerComponentClient } from '@/lib/supabase'
import AlbumContent from './AlbumContent'

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  
  try {
    const supabase = await createServerComponentClient()
    const { data: album, error } = await supabase
      .from('albums')
      .select('*')
      .eq('id', id)
      .eq('removed', false)
      .single()

    if (error || !album) {
      return {
        title: 'Album Not Found | Hanna\'s Record Collection',
      }
    }

    const title = `${album.title} by ${album.artist} | Hanna's Record Collection`
    const description = album.thoughts 
      ? `${album.thoughts.slice(0, 160)}${album.thoughts.length > 160 ? '...' : ''}`
      : `Listen to ${album.title} by ${album.artist} (${album.year}) - Part of Hanna's curated record collection.`

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        type: 'website',
        images: album.cover_art_url ? [
          {
            url: album.cover_art_url,
            width: 640,
            height: 640,
            alt: `${album.title} by ${album.artist} album cover`,
          }
        ] : [],
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        images: album.cover_art_url ? [album.cover_art_url] : [],
      },
    }
  } catch (error) {
    console.error('Error generating metadata:', error)
    return {
      title: 'Album | Hanna\'s Record Collection',
    }
  }
}

interface AlbumPageProps {
  params: Promise<{ id: string }>
}

function AlbumPageSkeleton() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-16">
        {/* Back Button Skeleton */}
        <div className="h-6 w-32 bg-zinc-800 rounded mb-8 animate-pulse" />
        
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 lg:gap-12 items-start">
          {/* Album Artwork Skeleton */}
          <div className="lg:col-span-2 flex justify-center lg:justify-start">
            <div className="w-80 h-80 lg:w-96 lg:h-96 bg-zinc-800 rounded-2xl animate-pulse" />
          </div>

          {/* Album Info Skeleton */}
          <div className="lg:col-span-3 space-y-6">
            <div className="space-y-3">
              <div className="h-12 lg:h-16 bg-zinc-800 rounded animate-pulse" />
              <div className="h-6 lg:h-8 bg-zinc-800 rounded animate-pulse w-3/4" />
            </div>
            <div className="flex gap-4">
              <div className="h-6 w-20 bg-zinc-800 rounded animate-pulse" />
              <div className="h-6 w-32 bg-zinc-800 rounded animate-pulse" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="h-12 bg-zinc-800 rounded animate-pulse" />
              <div className="h-12 bg-zinc-800 rounded animate-pulse" />
              <div className="h-12 bg-zinc-800 rounded animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default async function AlbumPage({ params }: AlbumPageProps) {
  const { id } = await params
  
  return (
    <Suspense fallback={<AlbumPageSkeleton />}>
      <AlbumContent id={id} />
    </Suspense>
  )
}