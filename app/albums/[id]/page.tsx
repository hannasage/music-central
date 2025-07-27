import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import { getAlbumById } from '@/lib/albums'
import StreamingLinks from '@/app/components/StreamingLinks'
import AudioFeatures from '@/app/components/AudioFeatures'
import TrackList from '@/app/components/TrackList'
import Header from '@/app/components/Header'
import ScrollToTop from '@/app/components/ScrollToTop'
import { Calendar, Tag, Heart, MessageSquare, Music } from 'lucide-react'

interface AlbumPageProps {
  params: { id: string }
}

async function AlbumContent({ id }: { id: string }) {
  const album = await getAlbumById(id)

  if (!album) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950">
      <ScrollToTop />
      <Header />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-16">

        {/* Main Layout: Desktop 2-column, Mobile stacked */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          {/* Left Column - Album Hero & Details */}
          <div className="space-y-8">
            {/* Hero Section with Background */}
            <div className="relative">
              {/* Background Image */}
              {album.cover_art_url && (
                <div className="absolute inset-0 rounded-2xl overflow-hidden">
                  <Image
                    src={album.cover_art_url}
                    alt={`${album.title} by ${album.artist}`}
                    fill
                    className="object-cover opacity-20 blur-sm"
                    priority
                  />
                  <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/60 to-black/80" />
                </div>
              )}

              {/* Hero Content */}
              <div className="relative z-10 bg-zinc-900/50 backdrop-blur-sm rounded-2xl p-6 lg:p-8 border border-zinc-800/50">
                <div className="space-y-6 text-center lg:text-left">
                  {/* Album Artwork */}
                  <div className="flex justify-center lg:justify-start">
                    <div className="relative w-64 h-64 lg:w-80 lg:h-80 rounded-xl overflow-hidden shadow-2xl">
                      {album.cover_art_url ? (
                        <Image
                          src={album.cover_art_url}
                          alt={`${album.title} by ${album.artist}`}
                          fill
                          className="object-cover"
                          priority
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-zinc-700 to-zinc-900 flex items-center justify-center">
                          <Music className="w-20 h-20 text-zinc-500" />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Title & Artist */}
                  <div className="space-y-3">
                    <h1 className="text-3xl lg:text-5xl font-bold text-white leading-tight">
                      {album.title}
                    </h1>
                    <p className="text-xl lg:text-2xl text-zinc-300">
                      by {album.artist}
                    </p>
                  </div>

                  {/* Year & Genres */}
                  <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 text-zinc-400">
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-4 h-4" />
                      <span>{album.year}</span>
                    </div>
                    {album.genres.length > 0 && (
                      <div className="flex items-center space-x-2">
                        <Tag className="w-4 h-4" />
                        <div className="flex flex-wrap gap-2">
                          {album.genres.slice(0, 3).map((genre) => (
                            <span
                              key={genre}
                              className="bg-zinc-800/50 px-3 py-1 rounded-full text-sm border border-zinc-700/50"
                            >
                              {genre}
                            </span>
                          ))}
                          {album.genres.length > 3 && (
                            <span className="text-zinc-500 text-sm">
                              +{album.genres.length - 3} more
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Personal Vibes */}
                  {album.personal_vibes.length > 0 && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-center lg:justify-start space-x-2 text-zinc-300">
                        <Heart className="w-4 h-4" />
                        <span className="font-medium">Personal Vibes</span>
                      </div>
                      <div className="flex flex-wrap gap-2 justify-center lg:justify-start">
                        {album.personal_vibes.map((vibe) => (
                          <span
                            key={vibe}
                            className="bg-blue-500/20 text-blue-400 px-3 py-1 rounded-full text-sm border border-blue-500/30"
                          >
                            {vibe}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Streaming Links */}
                  <div className="pt-4">
                    <StreamingLinks album={album} />
                  </div>
                </div>
              </div>
            </div>

            {/* Personal Thoughts */}
            {album.thoughts && (
              <div className="bg-zinc-900/50 backdrop-blur-sm rounded-2xl p-6 lg:p-8 border border-zinc-800/50">
                <div className="flex items-center space-x-2 mb-4">
                  <MessageSquare className="w-5 h-5 text-zinc-400" />
                  <h2 className="text-xl font-semibold text-white">Personal Thoughts</h2>
                </div>
                <div className="prose prose-zinc prose-invert max-w-none">
                  <p className="text-zinc-300 leading-relaxed whitespace-pre-wrap">
                    {album.thoughts}
                  </p>
                </div>
              </div>
            )}

            {/* Audio Features */}
            {album.audio_features && (
              <div className="bg-zinc-900/50 backdrop-blur-sm rounded-2xl p-6 lg:p-8 border border-zinc-800/50">
                <AudioFeatures audioFeatures={album.audio_features} />
              </div>
            )}
          </div>

          {/* Right Column - Track List */}
          <div className="space-y-8">
            {album.tracks && album.tracks.length > 0 && (
              <div className="bg-zinc-900/50 backdrop-blur-sm rounded-2xl p-6 lg:p-8 border border-zinc-800/50 lg:sticky lg:top-8">
                <TrackList tracks={album.tracks} />
              </div>
            )}
          </div>
        </div>

        {/* All Genres */}
        {album.genres.length > 3 && (
          <div className="mt-12 bg-zinc-900/50 backdrop-blur-sm rounded-2xl p-6 lg:p-8 border border-zinc-800/50">
            <h3 className="text-lg font-semibold text-white mb-4">All Genres</h3>
            <div className="flex flex-wrap gap-2">
              {album.genres.map((genre) => (
                <span
                  key={genre}
                  className="bg-zinc-800/50 text-zinc-300 px-3 py-2 rounded-lg text-sm border border-zinc-700/50 hover:bg-zinc-700/50 transition-colors duration-200"
                >
                  {genre}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
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

export default function AlbumPage({ params }: AlbumPageProps) {
  return (
    <Suspense fallback={<AlbumPageSkeleton />}>
      <AlbumContent id={params.id} />
    </Suspense>
  )
}