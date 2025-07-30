'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Album } from '@/lib/types'
import { Music, ExternalLink, Eye } from 'lucide-react'


interface FeaturedBannerProps {
  albums: Album[]
}

export default function FeaturedBanner({ albums }: FeaturedBannerProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isAutoPlaying] = useState(true)
  const [isTransitioning] = useState(false)

  // Auto-advance every 8 seconds
  useEffect(() => {
    if (!isAutoPlaying || albums.length <= 1) return

    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % albums.length)
    }, 8000)

    return () => clearInterval(interval)
  }, [isAutoPlaying, albums.length])



  if (!albums || albums.length === 0) {
    return (
      <div className="relative h-96 bg-gradient-to-r from-zinc-800 to-zinc-900 rounded-2xl overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center text-zinc-400">
            <Music className="w-16 h-16 mx-auto mb-4" />
            <p className="text-lg">No Featured Albums</p>
          </div>
        </div>
      </div>
    )
  }

  const currentAlbum = albums[currentIndex]
  const primaryGenre = currentAlbum.genres && currentAlbum.genres.length > 0 ? currentAlbum.genres[0] : ''

  return (
    <div className="relative h-96 bg-zinc-800 rounded-2xl overflow-hidden group">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0">
        {currentAlbum.cover_art_url ? (
          <Image
            src={currentAlbum.cover_art_url}
            alt={`${currentAlbum.title} by ${currentAlbum.artist}`}
            fill
            className={`object-cover blur-sm scale-110 opacity-60 transition-opacity duration-500 ${
              isTransitioning ? 'opacity-40' : 'opacity-60'
            }`}
            priority={currentIndex === 0}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-zinc-600 to-zinc-800" />
        )}
        <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/20 to-black/60" />
      </div>


      {/* Content */}
      <div className="relative h-full flex items-center py-4 sm:py-6 lg:py-8">
        <div className="max-w-7xl mx-auto px-12 sm:px-6 lg:px-16 w-full">
          <div className={`grid grid-cols-1 sm:grid-cols-2 gap-6 lg:gap-8 items-center min-h-[18rem] lg:min-h-[20rem] transition-all duration-500 ${
            isTransitioning ? 'opacity-80 transform translate-x-2' : 'opacity-100 transform translate-x-0'
          }`}>
            {/* Album Artwork */}
            <div className="flex justify-center order-1 lg:order-1">
              <div className={`relative w-40 h-40 sm:w-48 sm:h-48 lg:w-64 lg:h-64 rounded-lg lg:rounded-xl overflow-hidden shadow-2xl transition-all duration-500 ${
                isTransitioning ? 'scale-95' : 'scale-100'
              }`}>
                {currentAlbum.cover_art_url ? (
                  <Image
                    src={currentAlbum.cover_art_url}
                    alt={`${currentAlbum.title} by ${currentAlbum.artist}`}
                    fill
                    className="object-cover"
                    priority={currentIndex === 0}
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-zinc-700 to-zinc-900 flex items-center justify-center">
                    <Music className="w-12 h-12 lg:w-16 lg:h-16 text-zinc-500" />
                  </div>
                )}
              </div>
            </div>

            {/* Album Info */}
            <div className={`text-center lg:text-left space-y-2 lg:space-y-4 max-w-lg mx-auto lg:mx-0 order-2 lg:order-2 transition-all duration-500 delay-100 ${
              isTransitioning ? 'opacity-60 transform translate-y-2' : 'opacity-100 transform translate-y-0'
            }`}>
              <div className="space-y-1 lg:space-y-3">
                <p className="text-blue-400 font-medium text-xs sm:text-sm uppercase tracking-wider">
                  Featured Album
                </p>
                <h1 className="text-2xl sm:text-3xl lg:text-5xl font-bold text-white leading-tight line-clamp-1 lg:line-clamp-2">
                  {currentAlbum.title}
                </h1>
                <p className="text-base sm:text-lg lg:text-xl text-zinc-300 line-clamp-1">
                  by {currentAlbum.artist}
                </p>
              </div>

              <div className="flex items-center justify-center lg:justify-start space-x-3 lg:space-x-4 text-xs sm:text-sm text-zinc-400 py-1">
                <span>{currentAlbum.year}</span>
                {primaryGenre && (
                  <>
                    <span>•</span>
                    <span className="bg-zinc-800/50 px-2 py-1 lg:px-3 lg:py-1 rounded-full border border-zinc-700/50 truncate max-w-24 sm:max-w-32">
                      {primaryGenre}
                    </span>
                  </>
                )}
              </div>

              <div className="flex items-center justify-center lg:justify-start gap-3 pt-2">
                {/* Mobile: Icon buttons, Desktop: Full buttons */}
                <Link
                  href={`/albums/${currentAlbum.id}`}
                  className="lg:hidden bg-white hover:bg-zinc-100 text-black px-6 py-2.5 rounded-lg font-medium transition-colors duration-200 shadow-lg flex items-center justify-center space-x-2 w-32"
                  title="View Album"
                >
                  <Eye className="w-4 h-4" />
                  <span className="text-sm">View</span>
                </Link>
                
                <Link
                  href={`/albums/${currentAlbum.id}`}
                  className="hidden lg:flex bg-white hover:bg-zinc-100 text-black px-6 py-3 rounded-lg font-medium transition-colors duration-200 items-center space-x-2 justify-center shadow-lg"
                >
                  <span>View Album</span>
                  <ExternalLink className="w-4 h-4" />
                </Link>
                
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Page Indicators */}
      {albums.length > 1 && (
        <div className="absolute left-4 top-1/2 transform -translate-y-1/2 lg:bottom-4 lg:left-1/2 lg:top-auto lg:transform lg:-translate-x-1/2 lg:translate-y-0 flex flex-col space-y-2 lg:flex-row lg:space-y-0 lg:space-x-2 z-10">
          {albums.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                index === currentIndex
                  ? 'bg-white scale-125'
                  : 'bg-white/50 hover:bg-white/75'
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}

    </div>
  )
}