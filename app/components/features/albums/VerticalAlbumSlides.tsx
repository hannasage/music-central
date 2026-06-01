'use client'

import React, { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Album } from '@/lib/types'
import { Music, ExternalLink, ChevronDown, ChevronUp } from 'lucide-react'
import { useTheme } from '@/app/context/ThemeContext'

function genreColor(genre: string, palette: { value: string }[]): string {
  if (!palette?.length || !genre) return 'var(--color-accent)'
  let h = 0
  for (const ch of genre.toLowerCase()) h = (h * 31 + ch.charCodeAt(0)) % palette.length
  return palette[h].value
}

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
  const { theme } = useTheme()

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
      <div className="h-full flex items-center justify-center" style={{ background: 'var(--color-bg)' }}>
        <div className="text-center" style={{ color: 'var(--color-text-dim)' }}>
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
            style={{
              width: index === currentSlide ? 10 : 6,
              height: index === currentSlide ? 10 : 6,
              borderRadius: '50%',
              border: 'none',
              cursor: 'pointer',
              transition: 'all 0.3s',
              background: index === currentSlide ? 'var(--color-accent)' : 'var(--color-text)',
              opacity: index === currentSlide ? 1 : 0.3,
              padding: 0,
            }}
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
          className="hidden 2xl:block fixed top-24 left-1/2 transform -translate-x-1/2 z-50 p-1.5 transition-colors duration-200"
          style={{ color: 'var(--color-text-dim)', background: 'none', border: 'none', cursor: 'pointer' }}
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
          className="hidden 2xl:block fixed bottom-16 left-1/2 transform -translate-x-1/2 z-50 p-1.5 transition-colors duration-200"
          style={{ color: 'var(--color-text-dim)', background: 'none', border: 'none', cursor: 'pointer' }}
          aria-label="Next slide"
        >
          <ChevronDown className="w-5 h-5" />
        </button>
      )}

      {/* Progress Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-50">
        <div className="h-px" style={{ background: 'var(--color-border)' }}>
          <div
            className="h-full transition-all duration-100 ease-linear"
            style={{ width: `${progress}%`, background: 'var(--color-accent)' }}
          />
        </div>
      </div>

      {/* Slide Counter */}
      <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50 backdrop-blur-sm rounded-full px-3 py-1.5 text-xs font-medium"
        style={{
          background: theme.isDark ? 'rgba(0,0,0,0.55)' : 'rgba(255,255,255,0.75)',
          color: 'var(--color-text)',
          fontFamily: 'var(--ui-font)',
          border: '1px solid var(--color-border)',
        }}
      >
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
  const { theme } = useTheme()
  const palette = theme.planColors
  const primaryGenre = album.genres?.[0] ?? ''
  const secondaryGenres = album.genres?.slice(1, 3) ?? []

  const gColor = (g: string) => genreColor(g, palette)

  // Overlay strategy: dark themes use theme-bg vignette; light themes use a very light veil
  const overlaySide = theme.isDark
    ? 'linear-gradient(to right, color-mix(in srgb, var(--color-bg) 82%, transparent) 0%, color-mix(in srgb, var(--color-bg) 18%, transparent) 50%, color-mix(in srgb, var(--color-bg) 82%, transparent) 100%)'
    : 'linear-gradient(to right, rgba(255,255,255,0.12) 0%, transparent 50%, rgba(255,255,255,0.12) 100%)'
  const overlayVert = theme.isDark
    ? 'linear-gradient(to top, color-mix(in srgb, var(--color-bg) 88%, transparent) 0%, transparent 45%, color-mix(in srgb, var(--color-bg) 55%, transparent) 100%)'
    : 'linear-gradient(to top, rgba(255,255,255,0.4) 0%, transparent 40%, rgba(255,255,255,0.18) 100%)'

  // Frosted glass panel behind text for light themes
  const textPanelStyle: React.CSSProperties = theme.isDark ? {} : {
    background: 'rgba(255,255,255,0.58)',
    backdropFilter: 'blur(14px)',
    WebkitBackdropFilter: 'blur(14px)',
    borderRadius: 'var(--ui-radius-lg)',
    padding: '20px 24px',
    border: '1px solid rgba(255,255,255,0.75)',
  }

  const genrePillStyle = (g: string): React.CSSProperties => {
    const c = gColor(g)
    return {
      display: 'inline-flex', alignItems: 'center',
      padding: '4px 10px',
      borderRadius: 'var(--ui-radius-full)',
      border: `1px solid color-mix(in srgb, ${c} 50%, transparent)`,
      background: `color-mix(in srgb, ${c} 18%, ${theme.isDark ? 'rgba(0,0,0,0.35)' : 'rgba(255,255,255,0.5)'})`,
      color: c,
      fontSize: 11,
      fontFamily: 'var(--ui-font)',
      fontWeight: 500,
      letterSpacing: '0.03em',
      backdropFilter: 'blur(4px)',
    }
  }

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
              filter: 'brightness(0.35) blur(2px) saturate(1.2)',
              transform: isActive ? 'scale(1.05)' : 'scale(1.1)',
              transition: 'transform 8s ease-out'
            }}
            priority={slideIndex < 2}
          />
        ) : (
          <div className="w-full h-full" style={{ background: 'var(--color-bg)' }} />
        )}
        
        {/* Theme-aware gradient overlays */}
        <div className="absolute inset-0" style={{ background: overlaySide }} />
        <div className="absolute inset-0" style={{ background: overlayVert }} />
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
                      <div className="w-full h-full flex items-center justify-center group-active:scale-95 transition-transform duration-200" style={{ background: 'var(--ui-border)' }}>
                        <Music className="w-16 h-16" style={{ color: 'var(--ui-muted)' }} />
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
              <div className="px-6 pb-8 space-y-6" style={theme.isDark ? {} : { background: 'rgba(255,255,255,0.55)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}>
                {/* Featured Badge */}
                <div className="flex justify-center">
                  <div className="btn-cta inline-flex items-center px-4 py-2 rounded-full text-sm font-medium shadow-lg">
                    <Music className="w-4 h-4 mr-2" />
                    Featured Album
                  </div>
                </div>

                {/* Title and Artist */}
                <Link href={`/albums/${album.id}`} className="block text-center space-y-2 group">
                  <h1 className="text-3xl font-bold leading-tight transition-colors duration-200" style={{ color: 'var(--color-text)' }}>
                    {album.title}
                  </h1>
                  <p className="text-xl font-light transition-colors duration-200" style={{ color: 'var(--color-text-dim)' }}>
                    by {album.artist}
                  </p>
                </Link>

                {/* Genres */}
                {album.genres && album.genres.length > 0 && (
                  <div className="flex flex-wrap justify-center gap-2">
                    {album.genres.slice(0, 3).map((genre, idx) => (
                      <span key={idx} style={genrePillStyle(genre)}>
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
                transition: 'all 1.2s ease-out 0.1s',
                position: 'relative',
              }}
            >
              {/* Accent glow blob */}
              <div aria-hidden style={{
                position: 'absolute', inset: '-30%',
                background: 'radial-gradient(closest-side, var(--color-accent-soft), transparent)',
                filter: 'blur(48px)',
                pointerEvents: 'none',
                zIndex: 0,
                opacity: isActive ? 1 : 0,
                transition: 'opacity 1.2s ease-out',
              }} />
              <div className="relative group" style={{ zIndex: 1 }}>
                <Link href={`/albums/${album.id}`} aria-label={`View ${album.title} by ${album.artist}`}>
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
                      <div className="w-full h-full flex items-center justify-center" style={{ background: 'var(--ui-border)' }}>
                        <Music className="w-16 h-16" style={{ color: 'var(--ui-muted)' }} />
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
                transition: 'all 1.2s ease-out 0.3s',
                ...textPanelStyle,
              }}
            >
              {/* Featured Badge */}
              <div className="flex justify-start">
                <div className="btn-cta inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium shadow-lg backdrop-blur-sm">
                  <Music className="w-3 h-3 mr-1.5" />
                  Featured Album
                </div>
              </div>

              {/* Title and Artist */}
              <div className="space-y-2">
                <h1 className="text-4xl lg:text-4xl xl:text-5xl 2xl:text-6xl font-bold leading-tight tracking-tight" style={{ color: 'var(--color-text)' }}>
                  {album.title}
                </h1>
                <p className="text-xl lg:text-xl xl:text-2xl 2xl:text-3xl font-light" style={{ color: 'var(--color-text-dim)' }}>
                  by {album.artist}
                </p>
              </div>

              {/* Metadata Tags */}
              <div className="flex flex-wrap items-center justify-start gap-2">
                {primaryGenre && (
                  <span style={genrePillStyle(primaryGenre)}>
                    {primaryGenre}
                  </span>
                )}
                {secondaryGenres.map((genre, idx) => (
                  <span key={idx} style={genrePillStyle(genre)}>
                    {genre}
                  </span>
                ))}
              </div>

              {/* Thoughts */}
              {album.thoughts && (
                <div className="pt-2">
                  <p className="text-base lg:text-base xl:text-lg leading-relaxed max-w-lg xl:max-w-xl 2xl:max-w-2xl" style={{ color: 'var(--color-text-dim)' }}>
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
                  className="btn-cta inline-flex items-center justify-center px-8 py-3.5 rounded-xl font-semibold text-base group"
                  style={{ textDecoration: 'none' }}
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