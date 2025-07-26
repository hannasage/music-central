'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Album } from '@/lib/types'
import { ChevronLeft, ChevronRight, Music, ExternalLink } from 'lucide-react'

interface FeaturedBannerProps {
  albums: Album[]
}

export default function FeaturedBanner({ albums }: FeaturedBannerProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isAutoPlaying, setIsAutoPlaying] = useState(true)

  // Auto-advance every 8 seconds
  useEffect(() => {
    if (!isAutoPlaying || albums.length <= 1) return

    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % albums.length)
    }, 8000)

    return () => clearInterval(interval)
  }, [isAutoPlaying, albums.length])

  const goToSlide = (index: number) => {
    setCurrentIndex(index)
    setIsAutoPlaying(false)
    // Resume auto-play after 15 seconds of manual control
    setTimeout(() => setIsAutoPlaying(true), 15000)
  }

  const goToPrevious = () => {
    setCurrentIndex((prevIndex) => (prevIndex - 1 + albums.length) % albums.length)
    setIsAutoPlaying(false)
    setTimeout(() => setIsAutoPlaying(true), 15000)
  }

  const goToNext = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % albums.length)
    setIsAutoPlaying(false)
    setTimeout(() => setIsAutoPlaying(true), 15000)
  }

  if (!albums || albums.length === 0) {
    return (
      <div className="relative h-96 bg-gradient-to-r from-zinc-800 to-zinc-900 rounded-2xl overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center text-zinc-400">
            <Music className="w-16 h-16 mx-auto mb-4" />
            <p className="text-lg">No featured albums available</p>
          </div>
        </div>
      </div>
    )
  }

  const currentAlbum = albums[currentIndex]
  const primaryGenre = currentAlbum.genres && currentAlbum.genres.length > 0 ? currentAlbum.genres[0] : ''

  return (
    <div className="relative h-96 bg-zinc-900 rounded-2xl overflow-hidden group">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0">
        {currentAlbum.cover_art_url ? (
          <Image
            src={currentAlbum.cover_art_url}
            alt={`${currentAlbum.title} by ${currentAlbum.artist}`}
            fill
            className="object-cover blur-sm scale-110 opacity-40"
            priority={currentIndex === 0}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-zinc-700 to-zinc-900" />
        )}
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-black/80" />
      </div>

      {/* Content */}
      <div className="relative h-full flex items-center">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 w-full">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            {/* Album Artwork */}
            <div className="flex justify-center lg:justify-start">
              <div className="relative w-64 h-64 rounded-xl overflow-hidden shadow-2xl">
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
                    <Music className="w-16 h-16 text-zinc-500" />
                  </div>
                )}
              </div>
            </div>

            {/* Album Info */}
            <div className="text-center lg:text-left space-y-6">
              <div className="space-y-2">
                <p className="text-blue-400 font-medium text-sm uppercase tracking-wider">
                  Featured Album
                </p>
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight">
                  {currentAlbum.title}
                </h1>
                <p className="text-xl sm:text-2xl text-zinc-300">
                  by {currentAlbum.artist}
                </p>
              </div>

              <div className="flex items-center justify-center lg:justify-start space-x-4 text-sm text-zinc-400">
                <span>{currentAlbum.year}</span>
                {primaryGenre && (
                  <>
                    <span>•</span>
                    <span className="bg-zinc-800/50 px-3 py-1 rounded-full border border-zinc-700/50">
                      {primaryGenre}
                    </span>
                  </>
                )}
              </div>

              <div className="flex items-center justify-center lg:justify-start space-x-4">
                <Link
                  href={`/albums/${currentAlbum.id}`}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200 flex items-center space-x-2"
                >
                  <span>View Album</span>
                  <ExternalLink className="w-4 h-4" />
                </Link>
                
                {currentAlbum.streaming_links?.spotify && (
                  <a
                    href={currentAlbum.streaming_links.spotify}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200"
                  >
                    Listen on Spotify
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Arrows */}
      {albums.length > 1 && (
        <>
          <button
            onClick={goToPrevious}
            className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black/20 hover:bg-black/40 backdrop-blur-sm text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          
          <button
            onClick={goToNext}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black/20 hover:bg-black/40 backdrop-blur-sm text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </>
      )}

      {/* Dots Indicator */}
      {albums.length > 1 && (
        <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2">
          <div className="flex space-x-2">
            {albums.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`w-3 h-3 rounded-full transition-all duration-300 ${
                  index === currentIndex
                    ? 'bg-blue-400 shadow-lg shadow-blue-400/50'
                    : 'bg-white/30 hover:bg-white/50'
                }`}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}