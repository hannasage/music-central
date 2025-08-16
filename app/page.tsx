import { Suspense } from 'react'
import type { Metadata } from 'next'
import Header from './components/shared/Header'
import { FeaturedAlbumsSkeleton } from './components/ui/feedback/LoadingSkeleton'
import { getFeaturedAlbums } from '@/lib/albums'
import VerticalAlbumSlides from './components/features/albums/VerticalAlbumSlides'

export const metadata: Metadata = {
  title: "Hanna's Record Collection",
  description: "Welcome to my personal vinyl collection featuring carefully curated albums with personal thoughts, streaming links, and AI-powered music discovery.",
  openGraph: {
    title: "Hanna's Record Collection",
    description: "Welcome to my personal vinyl collection featuring carefully curated albums with personal thoughts, streaming links, and AI-powered music discovery.",
    type: "website",
  },
  twitter: {
    card: 'summary',
    title: "Hanna's Record Collection",
    description: "Welcome to my personal vinyl collection featuring carefully curated albums with personal thoughts, streaming links, and AI-powered music discovery.",
  },
}

async function FeaturedAlbumsSection() {
  const featuredAlbums = await getFeaturedAlbums(6)
  
  return <VerticalAlbumSlides albums={featuredAlbums} />
}


export default function HomePage() {
  return (
    <div className="h-screen overflow-hidden bg-black">
      <Header />
      
      <main className="h-full">
        <Suspense fallback={<FeaturedAlbumsSkeleton />}>
          <FeaturedAlbumsSection />
        </Suspense>
      </main>
    </div>
  )
}