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

      {/* Navigation Indicators */}
      <div className="fixed right-4 top-1/2 transform -translate-y-1/2 z-50 flex flex-col space-y-2">
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

      {/* Navigation Arrows */}
      {currentSlide > 0 && (
        <button
          onClick={() => {
            setIsAutoPlaying(false)
            setCurrentSlide(prev => Math.max(prev - 1, 0))
            setTimeout(() => setIsAutoPlaying(true), 3000)
          }}
          className="fixed top-16 left-1/2 transform -translate-x-1/2 z-50 p-1.5 text-white/50 hover:text-white/80 transition-colors duration-200"
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
          className="fixed bottom-24 left-1/2 transform -translate-x-1/2 z-50 p-1.5 text-white/50 hover:text-white/80 transition-colors duration-200"
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
      <div className="fixed bottom-4 right-4 z-50 bg-black/40 backdrop-blur-sm rounded-full px-3 py-1.5 text-white text-xs font-medium">
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
    <div className="h-screen relative overflow-hidden flex items-center justify-center">
      {/* Background Image with Parallax Effect */}
      <div className="absolute inset-0">
        {album.cover_art_url ? (
          <Image
            src={album.cover_art_url}
            alt={`${album.title} by ${album.artist}`}
            fill
            className="object-cover scale-110"
            style={{
              filter: 'brightness(0.3) blur(1px)',
              transform: isActive ? 'scale(1.05)' : 'scale(1.1)',
              transition: 'transform 8s ease-out'
            }}
            priority={slideIndex < 2}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-zinc-800 via-zinc-900 to-black" />
        )}
        
        {/* Gradient Overlays */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/20 to-black/80" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-black/60" />
      </div>

      {/* Content */}
      <div className="relative z-10 w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          
          {/* Album Artwork */}
          <div className="flex justify-center lg:justify-start order-2 lg:order-1">
            <div 
              className="relative group"
              style={{
                transform: isActive ? 'translateY(0) scale(1)' : 'translateY(30px) scale(0.95)',
                opacity: isActive ? 1 : 0.7,
                transition: 'all 1s ease-out 0.2s'
              }}
            >
              <div className="relative w-64 h-64 sm:w-72 sm:h-72 lg:w-80 lg:h-80 rounded-xl overflow-hidden shadow-xl">
                {album.cover_art_url ? (
                  <Image
                    src={album.cover_art_url}
                    alt={`${album.title} by ${album.artist}`}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-700"
                    priority={slideIndex < 2}
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-zinc-700 to-zinc-900 flex items-center justify-center">
                    <Music className="w-16 h-16 text-zinc-500" />
                  </div>
                )}
                
                {/* Vinyl Record Effect */}
                <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              </div>
              
            </div>
          </div>

          {/* Album Information */}
          <div 
            className="text-center lg:text-left space-y-4 order-1 lg:order-2"
            style={{
              transform: isActive ? 'translateX(0) translateY(0)' : 'translateX(30px) translateY(20px)',
              opacity: isActive ? 1 : 0.8,
              transition: 'all 1s ease-out 0.4s'
            }}
          >
            {/* Badge */}
            <div className="inline-flex items-center px-3 py-1.5 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full text-xs font-medium text-white shadow-lg">
              <Music className="w-3 h-3 mr-1.5" />
              Featured Album
            </div>

            {/* Title and Artist */}
            <div className="space-y-2">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white leading-tight">
                {album.title}
              </h1>
              <p className="text-lg sm:text-xl lg:text-2xl text-zinc-300 font-light">
                by {album.artist}
              </p>
            </div>

            {/* Metadata */}
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2 text-zinc-400 text-sm">
              <span className="px-2.5 py-1 bg-zinc-800/50 rounded-full border border-zinc-700/50">
                {album.year}
              </span>
              {primaryGenre && (
                <span className="px-2.5 py-1 bg-zinc-800/50 rounded-full border border-zinc-700/50">
                  {primaryGenre}
                </span>
              )}
              {secondaryGenres.map((genre, idx) => (
                <span key={idx} className="px-2.5 py-1 bg-zinc-800/30 rounded-full border border-zinc-700/30 text-xs">
                  {genre}
                </span>
              ))}
            </div>

            {/* Thoughts */}
            {album.thoughts && (
              <p className="text-base text-zinc-300 max-w-xl leading-relaxed">
                {album.thoughts.length > 150 
                  ? `${album.thoughts.substring(0, 150)}...` 
                  : album.thoughts
                }
              </p>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3 pt-4">
              <Link
                href={`/albums/${album.id}`}
                className="w-full sm:w-auto bg-white text-black px-6 py-3 rounded-lg font-medium text-base hover:bg-zinc-100 transition-all duration-200 flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl group"
              >
                <span>Explore Album</span>
                <ExternalLink className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-200" />
              </Link>
              
              <button className="w-full sm:w-auto bg-transparent border-2 border-white text-white px-6 py-3 rounded-lg font-medium text-base hover:bg-white hover:text-black transition-all duration-200 flex items-center justify-center space-x-2">
                <Play className="w-4 h-4" />
                <span>Play Preview</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}