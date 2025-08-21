'use client'

import React, { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Album } from '@/lib/types'
import { Music, ExternalLink, Play, ChevronDown, ChevronUp } from 'lucide-react'

interface VerticalAlbumSlidesProps {
  albums: Album[]
}

export default function VerticalAlbumSlides({ albums }: VerticalAlbumSlidesProps) {
  const [currentSlide, setCurrentSlide] = useState(0)
  const [isScrolling, setIsScrolling] = useState(false)
  const [isAutoPlaying, setIsAutoPlaying] = useState(true)
  const [progress, setProgress] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)
  const autoSlideIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Auto-slide functionality
  useEffect(() => {
    if (!isAutoPlaying || albums.length <= 1) return

    const startAutoSlide = () => {
      // Reset progress
      setProgress(0)
      
      // Start progress animation
      progressIntervalRef.current = setInterval(() => {
        setProgress(prev => {
          if (prev >= 100) {
            return 100
          }
          return prev + (100 / (8000 / 50)) // 8 seconds total, update every 50ms
        })
      }, 50)

      // Auto advance slide after 8 seconds
      autoSlideIntervalRef.current = setTimeout(() => {
        setCurrentSlide(prev => {
          const nextSlide = prev + 1
          if (nextSlide >= albums.length) {
            return 0 // Loop back to first slide
          }
          return nextSlide
        })
      }, 8000)
    }

    startAutoSlide()

    return () => {
      if (autoSlideIntervalRef.current) {
        clearTimeout(autoSlideIntervalRef.current)
      }
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current)
      }
    }
  }, [isAutoPlaying, albums.length, currentSlide])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const handleScroll = (e: WheelEvent) => {
      e.preventDefault()
      
      if (isScrolling) return

      // Pause auto-slide when user scrolls
      setIsAutoPlaying(false)
      
      // Simple one-scroll-event = one-slide behavior
      setIsScrolling(true)
      
      if (e.deltaY > 0 && currentSlide < albums.length - 1) {
        // Scroll down - move to next slide
        setCurrentSlide(prev => Math.min(prev + 1, albums.length - 1))
      } else if (e.deltaY < 0 && currentSlide > 0) {
        // Scroll up - move to previous slide
        setCurrentSlide(prev => Math.max(prev - 1, 0))
      }

      // Resume auto-slide after 3 seconds of no interaction
      setTimeout(() => {
        setIsScrolling(false)
        setTimeout(() => setIsAutoPlaying(true), 3000)
      }, 500)
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown' && currentSlide < albums.length - 1) {
        setIsAutoPlaying(false)
        setCurrentSlide(prev => Math.min(prev + 1, albums.length - 1))
        setTimeout(() => setIsAutoPlaying(true), 3000)
      } else if (e.key === 'ArrowUp' && currentSlide > 0) {
        setIsAutoPlaying(false)
        setCurrentSlide(prev => Math.max(prev - 1, 0))
        setTimeout(() => setIsAutoPlaying(true), 3000)
      }
    }

    container.addEventListener('wheel', handleScroll, { passive: false })
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      container.removeEventListener('wheel', handleScroll)
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [currentSlide, albums.length, isScrolling])

  if (!albums || albums.length === 0) {
    return (
      <div className="h-full flex items-center justify-center bg-gradient-to-br from-zinc-900 to-black">
        <div className="text-center text-zinc-400">
          <Music className="w-24 h-24 mx-auto mb-6" />
          <p className="text-xl">No Featured Albums Available</p>
        </div>
      </div>
    )
  }

  return (
    <div 
      ref={containerRef}
      className="h-full relative overflow-hidden"
      style={{ height: 'calc(100vh - 4rem)' }} // Account for header
    >
      {/* Album Slides */}
      <div 
        className="flex flex-col transition-transform duration-700 ease-out h-full"
        style={{ 
          transform: `translateY(-${currentSlide * 100}vh)`,
          height: `${albums.length * 100}vh`
        }}
      >
        {albums.map((album, index) => (
          <AlbumSlide 
            key={album.id} 
            album={album} 
            isActive={index === currentSlide}
            slideIndex={index}
          />
        ))}
      </div>

      {/* Navigation Indicators - Desktop Only */}
      <div className="hidden 2xl:flex fixed right-4 top-1/2 transform -translate-y-1/2 z-50 flex-col space-y-2">
        {albums.map((_, index) => (
          <button
            key={index}
            onClick={() => {
              setIsAutoPlaying(false)
              setCurrentSlide(Math.max(0, Math.min(index, albums.length - 1)))
              setTimeout(() => setIsAutoPlaying(true), 3000)
            }}
            className={`w-2 h-2 rounded-full transition-all duration-300 ${
              index === currentSlide
                ? 'bg-white scale-125'
                : 'bg-white/30 hover:bg-white/50'
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>

      {/* Navigation Arrows - Desktop Only */}
      {currentSlide > 0 && (
        <button
          onClick={() => {
            setIsAutoPlaying(false)
            setCurrentSlide(prev => Math.max(prev - 1, 0))
            setTimeout(() => setIsAutoPlaying(true), 3000)
          }}
          className="hidden 2xl:block fixed top-24 left-1/2 transform -translate-x-1/2 z-50 p-1.5 text-white/50 hover:text-white/80 transition-colors duration-200"
          aria-label="Previous slide"
        >
          <ChevronUp className="w-5 h-5" />
        </button>
      )}

      {currentSlide < albums.length - 1 && (
        <button
          onClick={() => {
            setIsAutoPlaying(false)
            setCurrentSlide(prev => Math.min(prev + 1, albums.length - 1))
            setTimeout(() => setIsAutoPlaying(true), 3000)
          }}
          className="hidden 2xl:block fixed bottom-16 left-1/2 transform -translate-x-1/2 z-50 p-1.5 text-white/50 hover:text-white/80 transition-colors duration-200"
          aria-label="Next slide"
        >
          <ChevronDown className="w-5 h-5" />
        </button>
      )}

      {/* Progress Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-50">
        <div className="h-1 bg-white/20">
          <div 
            className="h-full bg-gradient-to-r from-blue-400 to-purple-500 transition-all duration-100 ease-linear"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Slide Counter */}
      <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50 bg-black/40 backdrop-blur-sm rounded-full px-3 py-1.5 text-white text-xs font-medium">
        {currentSlide + 1} / {albums.length}
      </div>
    </div>
  )
}

interface AlbumSlideProps {
  album: Album
  isActive: boolean
  slideIndex: number
}

function AlbumSlide({ album, isActive, slideIndex }: AlbumSlideProps) {
  const primaryGenre = album.genres && album.genres.length > 0 ? album.genres[0] : ''
  const secondaryGenres = album.genres?.slice(1, 3) || []

  return (
    <div className="h-screen relative overflow-hidden">
      {/* Background Image with Parallax Effect */}
      <div className="absolute inset-0">
        {album.cover_art_url ? (
          <Image
            src={album.cover_art_url}
            alt={`${album.title} by ${album.artist}`}
            fill
            className="object-cover scale-110"
            style={{
              filter: 'brightness(0.25) blur(2px)',
              transform: isActive ? 'scale(1.05)' : 'scale(1.1)',
              transition: 'transform 8s ease-out'
            }}
            priority={slideIndex < 2}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-zinc-800 via-zinc-900 to-black" />
        )}
        
        {/* Enhanced Gradient Overlays */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/40 to-black/90" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-transparent to-black/70" />
      </div>

      {/* Perfectly Centered Content Container */}
      <div className="absolute inset-0 flex items-center justify-center px-6 sm:px-8 md:px-12 lg:px-16 xl:px-20" style={{ transform: 'translateY(-3rem)' }}>
        <div className="w-full max-w-5xl">
          
          {/* Mobile-First Responsive Layout */}
          <div className="flex flex-col items-center text-left space-y-4 md:flex-row md:space-y-0 md:space-x-8 md:items-center xl:grid xl:grid-cols-2 xl:gap-12">
            
            {/* Mobile: Full Landing Page Layout */}
            <div className="md:hidden w-full h-full flex flex-col">
              {/* Hero Section with Album Art */}
              <div className="flex-1 relative flex items-center justify-center px-6 py-8">
                <Link href={`/albums/${album.id}`} className="w-full max-w-sm group">
                  <div className="relative w-full aspect-square rounded-3xl overflow-hidden shadow-2xl">
                    {album.cover_art_url ? (
                      <Image
                        src={album.cover_art_url}
                        alt={`${album.title} by ${album.artist}`}
                        fill
                        className="object-cover group-active:scale-95 transition-transform duration-200"
                        priority={slideIndex < 2}
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-zinc-700 to-zinc-900 flex items-center justify-center group-active:scale-95 transition-transform duration-200">
                        <Music className="w-16 h-16 text-zinc-500" />
                      </div>
                    )}
                    
                    {/* Explore Overlay */}
                    <div className="absolute inset-0 bg-black/20 opacity-0 group-active:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                      <div className="bg-white/10 backdrop-blur-sm rounded-full p-4">
                        <ExternalLink className="w-8 h-8 text-white" />
                      </div>
                    </div>
                  </div>
                </Link>
              </div>

              {/* Album Information Section */}
              <div className="px-6 pb-8 space-y-6">
                {/* Featured Badge */}
                <div className="flex justify-center">
                  <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full text-sm font-medium text-white shadow-lg">
                    <Music className="w-4 h-4 mr-2" />
                    Featured Album
                  </div>
                </div>

                {/* Title and Artist */}
                <Link href={`/albums/${album.id}`} className="block text-center space-y-2 group">
                  <h1 className="text-3xl font-bold text-white leading-tight group-active:text-zinc-200 transition-colors duration-200">
                    {album.title}
                  </h1>
                  <p className="text-xl text-zinc-300 font-light group-active:text-zinc-400 transition-colors duration-200">
                    by {album.artist}
                  </p>
                </Link>

                {/* Genres */}
                {album.genres && album.genres.length > 0 && (
                  <div className="flex flex-wrap justify-center gap-2">
                    {album.genres.slice(0, 3).map((genre, idx) => (
                      <span key={idx} className="px-3 py-1.5 bg-zinc-800/60 rounded-full border border-zinc-700/60 text-sm font-medium text-zinc-300 backdrop-blur-sm">
                        {genre}
                      </span>
                    ))}
                  </div>
                )}


              </div>
            </div>

            {/* Desktop: Album Artwork */}
            <div 
              className="hidden md:block w-full flex-shrink-0 md:w-64 md:h-64 lg:w-72 lg:h-72 xl:w-80 xl:h-80 2xl:w-96 2xl:h-96 xl:order-1"
              style={{
                transform: isActive ? 'translateY(0) scale(1)' : 'translateY(20px) scale(0.96)',
                opacity: isActive ? 1 : 0.8,
                transition: 'all 1.2s ease-out 0.1s'
              }}
            >
              <div className="relative group">
                <Link href={`/albums/${album.id}`}>
                  <div className="relative w-full aspect-square rounded-2xl overflow-hidden shadow-2xl group-hover:scale-105 transition-transform duration-700">
                    {album.cover_art_url ? (
                      <Image
                        src={album.cover_art_url}
                        alt={`${album.title} by ${album.artist}`}
                        fill
                        className="object-cover"
                        priority={slideIndex < 2}
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-zinc-700 to-zinc-900 flex items-center justify-center">
                        <Music className="w-16 h-16 text-zinc-500" />
                      </div>
                    )}
                    
                    {/* Desktop: Subtle Hover Effect */}
                    <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  </div>
                </Link>
              </div>
            </div>

            {/* Album Information - Hidden on Mobile, Full Desktop */}
            <div 
              className="hidden md:flex flex-1 flex-col space-y-3 lg:space-y-4 xl:space-y-5 xl:order-2 max-w-lg md:max-w-none"
              style={{
                transform: isActive ? 'translateX(0) translateY(0)' : 'translateX(20px) translateY(15px)',
                opacity: isActive ? 1 : 0.85,
                transition: 'all 1.2s ease-out 0.3s'
              }}
            >
              {/* Featured Badge */}
              <div className="flex justify-start">
                <div className="inline-flex items-center px-3 py-1.5 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full text-xs font-medium text-white shadow-lg backdrop-blur-sm">
                  <Music className="w-3 h-3 mr-1.5" />
                  Featured Album
                </div>
              </div>

              {/* Title and Artist */}
              <div className="space-y-2">
                <h1 className="text-4xl lg:text-4xl xl:text-5xl 2xl:text-6xl font-bold text-white leading-tight tracking-tight">
                  {album.title}
                </h1>
                <p className="text-xl lg:text-xl xl:text-2xl 2xl:text-3xl text-zinc-300 font-light">
                  by {album.artist}
                </p>
              </div>

              {/* Metadata Tags */}
              <div className="flex flex-wrap items-center justify-start gap-2 text-zinc-400">
                {primaryGenre && (
                  <span className="px-3 py-1.5 bg-zinc-800/60 rounded-full border border-zinc-700/60 text-sm font-medium backdrop-blur-sm">
                    {primaryGenre}
                  </span>
                )}
                {secondaryGenres.map((genre, idx) => (
                  <span key={idx} className="px-3 py-1.5 bg-zinc-800/60 rounded-full border border-zinc-700/60 text-sm font-medium backdrop-blur-sm">
                    {genre}
                  </span>
                ))}
              </div>

              {/* Thoughts */}
              {album.thoughts && (
                <div className="pt-2">
                  <p className="text-base lg:text-base xl:text-lg text-zinc-300 leading-relaxed max-w-lg xl:max-w-xl 2xl:max-w-2xl">
                    {album.thoughts.length > 140 
                      ? `${album.thoughts.substring(0, 140)}...` 
                      : album.thoughts
                    }
                  </p>
                </div>
              )}

              {/* Action Button */}
              <div className="pt-4 flex justify-start">
                <Link
                  href={`/albums/${album.id}`}
                  className="inline-flex items-center justify-center px-8 py-3.5 bg-white text-black rounded-xl font-semibold text-base hover:bg-zinc-100 hover:scale-105 transition-all duration-200 shadow-xl hover:shadow-2xl group backdrop-blur-sm"
                >
                  <span>Explore Album</span>
                  <ExternalLink className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform duration-200" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}