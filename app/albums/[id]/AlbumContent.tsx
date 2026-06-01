'use client'

import { useState, useEffect } from 'react'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import { createClientSideClient } from '@/lib/supabase-client'
import StreamingLinks from '@/app/components/features/streaming/StreamingLinks'
import AudioFeatures from '@/app/components/features/albums/AudioFeatures'
import ArtworkEditModal from '@/app/components/features/albums/ArtworkEditModal'
import AlbumDetailsEditModal from '@/app/components/features/albums/AlbumDetailsEditModal'
import Header from '@/app/components/shared/Header'
import ScrollToTop from '@/app/components/shared/ScrollToTop'
import { Album } from '@/lib/types'
import { Calendar, Tag, Heart, MessageSquare, Music, Camera, Edit } from 'lucide-react'
import { Badge, Card } from '@hannasage/projection-ui'

export default function AlbumContent({ id }: { id: string }) {
  const [album, setAlbum] = useState<Album | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isArtworkEditOpen, setIsArtworkEditOpen] = useState(false)
  const [isDetailsEditOpen, setIsDetailsEditOpen] = useState(false)

  useEffect(() => {
    const fetchAlbum = async () => {
      try {
        const supabase = createClientSideClient()
        const { data: albumData, error } = await supabase
          .from('albums')
          .select('*')
          .eq('id', id)
          .eq('removed', false)
          .single()

        if (error || !albumData) {
          console.error('Error fetching album:', error)
          notFound()
        } else {
          setAlbum(albumData)
        }
      } catch (error) {
        console.error('Failed to fetch album:', error)
        notFound()
      } finally {
        setIsLoading(false)
      }
    }

    fetchAlbum()
  }, [id])

  const handleAlbumSaved = (updatedAlbum: Album) => {
    setAlbum(updatedAlbum)
  }

  if (isLoading || !album) {
    return <AlbumPageSkeleton />
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--color-bg)' }}>
      <ScrollToTop />
      <Header />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-16">

        {/* Main Layout: Full width */}
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
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
                  {/* Album Artwork */}
                  <div className="flex justify-center lg:justify-start lg:items-start">
                    <div className="relative w-full aspect-square max-w-md mx-auto lg:mx-0 lg:max-w-sm">
                      {/* Accent glow behind art */}
                      <div aria-hidden style={{
                        position: 'absolute', inset: '-20%',
                        background: 'radial-gradient(closest-side, var(--color-accent-soft), transparent)',
                        filter: 'blur(40px)',
                        pointerEvents: 'none',
                        zIndex: 0,
                      }} />
                    <div className="relative rounded-xl overflow-hidden shadow-2xl group" style={{ zIndex: 1 }}>
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
                      
                      {/* Artwork Edit Icon */}
                      <button
                        onClick={() => setIsArtworkEditOpen(true)}
                        className="absolute top-3 right-3 p-2 bg-black/60 backdrop-blur-sm text-white rounded-lg opacity-100 md:opacity-0 md:group-hover:opacity-100 hover:bg-black/80 transition-all duration-200"
                        title="Edit artwork"
                      >
                        <Camera className="w-4 h-4" />
                      </button>
                    </div>
                    </div> {/* closes glow wrapper */}
                  </div>

                  {/* Album Information */}
                  <div className="space-y-6">
                    {/* Title & Artist */}
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h1 className="text-3xl lg:text-5xl font-bold text-white leading-tight">
                          {album.title}
                        </h1>
                        <p className="text-xl lg:text-2xl text-zinc-300 mt-2">
                          by {album.artist}
                        </p>
                      </div>
                      
                      {/* Details Edit Icon */}
                      <button
                        onClick={() => setIsDetailsEditOpen(true)}
                        className="p-2 hover:bg-zinc-800/50 rounded-lg transition-colors group shrink-0 ml-4"
                        title="Edit album details"
                      >
                        <Edit className="w-5 h-5 text-zinc-400 group-hover:text-white" />
                      </button>
                    </div>
                  </div>

                  {/* Year & Descriptors */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-start space-x-2 text-zinc-400">
                      <Calendar className="w-4 h-4" />
                      <span>{album.year}</span>
                    </div>
                    
                    {/* Descriptors */}
                    {album.descriptors && album.descriptors.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {album.descriptors.map((descriptor, index) => {
                          const config: Record<string, { label: string; dotColor: string; bg: string; border: string; color: string }> = {
                            'vinyl-exclusive': { label: 'Vinyl Exclusive',  dotColor: '#c084fc', bg: 'rgba(168,85,247,0.12)',  border: 'rgba(168,85,247,0.3)',  color: '#c084fc' },
                            'alternate-cover': { label: 'Alternate Cover',  dotColor: '#fb923c', bg: 'rgba(249,115,22,0.12)',  border: 'rgba(249,115,22,0.3)',  color: '#fb923c' },
                            'bonus-tracks':    { label: 'Bonus Tracks',     dotColor: '#4ade80', bg: 'rgba(74,222,128,0.12)',  border: 'rgba(74,222,128,0.3)',  color: '#4ade80' },
                          }
                          const c = config[descriptor] ?? { label: descriptor, dotColor: 'var(--ui-muted)', bg: 'rgba(113,113,122,0.12)', border: 'rgba(113,113,122,0.3)', color: 'var(--ui-muted)' }
                          return (
                            <Badge
                              key={index}
                              dot
                              dotColor={c.dotColor}
                              style={{ background: c.bg, borderColor: c.border, color: c.color, borderRadius: 'var(--ui-radius-full)' }}
                            >
                              {c.label}
                            </Badge>
                          )
                        })}
                      </div>
                    )}
                    
                    <div className="space-y-2">
                      <div className="flex items-center justify-start space-x-2 text-zinc-300">
                        <Tag className="w-4 h-4" />
                        <span className="font-medium">Genres</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {album.genres.length === 0 ? (
                          <span className="text-zinc-500 italic">No genres assigned</span>
                        ) : (
                          album.genres.map((genre, index) => (
                            <Badge key={index} dot={false} style={{ borderRadius: 'var(--ui-radius-full)' }}>
                              {genre.toLowerCase()}
                            </Badge>
                          ))
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Personal Vibes */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-start space-x-2 text-zinc-300">
                      <Heart className="w-4 h-4" />
                      <span className="font-medium">Personal Vibes</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {album.personal_vibes.length === 0 ? (
                        <span className="text-zinc-500 italic">No personal vibes assigned</span>
                      ) : (
                        album.personal_vibes.map((vibe, index) => (
                          <Badge key={index} filled style={{ borderRadius: 'var(--ui-radius-full)' }}>
                            {vibe.toLowerCase()}
                          </Badge>
                        ))
                      )}
                    </div>
                  </div>

                    {/* Streaming Links */}
                    {!album.descriptors?.includes('vinyl-exclusive') && (
                      <div className="pt-4">
                        <StreamingLinks album={album} />
                      </div>
                    )}

                    {/* Personal Thoughts */}
                    {album.thoughts && (
                      <div className="pt-6 border-t border-zinc-700/50">
                        <div className="flex items-center space-x-2 mb-4">
                          <MessageSquare className="w-5 h-5 text-zinc-400" />
                          <h3 className="text-lg font-semibold text-white">Personal Thoughts</h3>
                        </div>
                        <div className="prose prose-zinc prose-invert max-w-none">
                          <p className="text-zinc-300 leading-relaxed whitespace-pre-wrap">
                            {album.thoughts}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Audio Features */}
            {album.audio_features && (
              <Card padding="lg">
                <AudioFeatures audioFeatures={album.audio_features} />
              </Card>
            )}
        </div>
      </div>

      {/* Edit Modals */}
      <ArtworkEditModal
        album={album}
        isOpen={isArtworkEditOpen}
        onClose={() => setIsArtworkEditOpen(false)}
        onSave={handleAlbumSaved}
      />
      
      <AlbumDetailsEditModal
        album={album}
        isOpen={isDetailsEditOpen}
        onClose={() => setIsDetailsEditOpen(false)}
        onSave={handleAlbumSaved}
      />
    </div>
  )
}

function AlbumPageSkeleton() {
  return (
    <div className="min-h-screen" style={{ background: 'var(--color-bg)' }}>
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