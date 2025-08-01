import { Suspense } from 'react'
import type { Metadata } from 'next'
import Header from './components/Header'
import FeaturedBanner from './components/FeaturedBanner'
import AlbumCard from './components/AlbumCard'
import { FeaturedAlbumsSkeleton, AlbumGridSkeleton } from './components/LoadingSkeleton'
import { getFeaturedAlbums, getRecentlyAddedAlbums } from '@/lib/albums'
import Link from 'next/link'
import { ArrowRight, Clock, Sparkles } from 'lucide-react'

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

async function FeaturedSection() {
  const featuredAlbums = await getFeaturedAlbums(4)
  
  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <Sparkles className="w-6 h-6 text-blue-400" />
        <h2 className="text-2xl font-bold text-white">Featured Albums</h2>
      </div>
      <FeaturedBanner albums={featuredAlbums} />
    </div>
  )
}

async function RecentlyAddedSection() {
  const recentAlbums = await getRecentlyAddedAlbums(12)
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Clock className="w-6 h-6 text-green-400" />
          <h2 className="text-2xl font-bold text-white">Recently Added</h2>
        </div>
        <Link 
          href="/albums"
          className="flex items-center space-x-1 text-blue-400 hover:text-blue-300 transition-colors duration-200 group"
        >
          <span>View All</span>
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-200" />
        </Link>
      </div>
      
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 px-2 sm:px-0">
        {recentAlbums.map((album) => (
          <AlbumCard key={album.id} album={album} size="small" />
        ))}
      </div>
    </div>
  )
}

function Footer() {
  return (
    <footer className="border-t border-zinc-800/50 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2">
            <h3 className="text-lg font-semibold text-white mb-4">Music Central</h3>
            <p className="text-zinc-400 max-w-md">
              Your personal vinyl collection, enhanced with AI-powered music discovery. 
              Explore your music like never before.
            </p>
          </div>
          
          <div>
            <h4 className="text-sm font-semibold text-white mb-3 uppercase tracking-wider">Explore</h4>
            <nav className="space-y-2">
              <Link href="/albums" className="block text-zinc-400 hover:text-white transition-colors duration-200">
                All Albums
              </Link>
              <Link href="/recommendations" className="block text-zinc-400 hover:text-white transition-colors duration-200">
                AI Curator
              </Link>
              <Link href="/search" className="block text-zinc-400 hover:text-white transition-colors duration-200">
                Search
              </Link>
            </nav>
          </div>
          
          <div>
            <h4 className="text-sm font-semibold text-white mb-3 uppercase tracking-wider">Connect</h4>
            <nav className="space-y-2">
              <a 
                href="https://github.com/hannasage" 
                target="_blank" 
                rel="noopener noreferrer"
                className="block text-zinc-400 hover:text-white transition-colors duration-200"
              >
                GitHub
              </a>
              <a 
                href="https://linkedin.com/in/hannasage" 
                target="_blank" 
                rel="noopener noreferrer"
                className="block text-zinc-400 hover:text-white transition-colors duration-200"
              >
                LinkedIn
              </a>
              <a 
                href="https://open.spotify.com/playlist/5v6rho05qMtlqC829KfDjR?si=cf9e63e089ff41f0" 
                target="_blank" 
                rel="noopener noreferrer"
                className="block text-zinc-400 hover:text-white transition-colors duration-200"
              >
                My Spotify Playlist
              </a>
            </nav>
          </div>
        </div>
        
        <div className="border-t border-zinc-800/50 mt-8 pt-8 flex flex-col sm:flex-row justify-between items-center">
          <p className="text-zinc-400 text-sm">
            © 2025 Music Central. Powered by Spotify & Supabase.
          </p>
          <p className="text-zinc-500 text-xs mt-2 sm:mt-0">
            Built with Next.js & TypeScript
          </p>
        </div>
      </div>
    </footer>
  )
}

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">
        {/* Featured Albums Section */}
        <Suspense fallback={<FeaturedAlbumsSkeleton />}>
          <FeaturedSection />
        </Suspense>

        {/* Recently Added Section */}
        <Suspense fallback={<AlbumGridSkeleton count={12} />}>
          <RecentlyAddedSection />
        </Suspense>

      </main>

      <Footer />
    </div>
  )
}