import { ImageProps } from 'next/image'

// Image size configurations for different breakpoints
export const IMAGE_SIZES = {
  album: {
    small: { width: 120, height: 120 },
    medium: { width: 200, height: 200 },
    large: { width: 300, height: 300 },
    xl: { width: 400, height: 400 }
  },
  hero: {
    mobile: { width: 400, height: 400 },
    tablet: { width: 600, height: 600 },
    desktop: { width: 800, height: 800 }
  },
  thumbnail: {
    xs: { width: 60, height: 60 },
    sm: { width: 80, height: 80 },
    md: { width: 100, height: 100 }
  }
} as const

// Responsive image sizes string for Next.js Image
export const RESPONSIVE_SIZES = {
  album: {
    small: '120px',
    medium: '(max-width: 640px) 160px, (max-width: 768px) 180px, 200px',
    large: '(max-width: 640px) 200px, (max-width: 768px) 250px, 300px',
    xl: '(max-width: 640px) 280px, (max-width: 768px) 350px, 400px'
  },
  hero: '(max-width: 640px) 400px, (max-width: 1024px) 600px, 800px',
  thumbnail: '(max-width: 640px) 60px, (max-width: 768px) 80px, 100px'
} as const

// Quality settings for different use cases
export const IMAGE_QUALITY = {
  thumbnail: 75,
  album: 85,
  hero: 90,
  highRes: 95
} as const

// Image format priorities (Next.js will automatically choose the best supported format)
export const IMAGE_FORMATS = ['image/webp', 'image/avif', 'image/jpeg'] as const

// CDN configuration (placeholder for future implementation)
export const CDN_CONFIG = {
  baseUrl: process.env.NEXT_PUBLIC_CDN_BASE_URL || '',
  albumArtPath: '/album-art',
  transformations: {
    webp: 'f_webp',
    quality: (q: number) => `q_${q}`,
    resize: (w: number, h: number) => `w_${w},h_${h},c_fill`
  }
} as const

/**
 * Generates optimized image URL with CDN transformations
 */
export function getOptimizedImageUrl(
  originalUrl: string,
  options: {
    width?: number
    height?: number
    quality?: number
    format?: 'webp' | 'jpeg' | 'auto'
  } = {}
): string {
  // If no CDN is configured, return original URL
  if (!CDN_CONFIG.baseUrl) {
    return originalUrl
  }

  const { width, height, quality = IMAGE_QUALITY.album, format = 'auto' } = options
  
  // Build transformation string
  const transformations: string[] = []
  
  if (width && height) {
    transformations.push(CDN_CONFIG.transformations.resize(width, height))
  }
  
  transformations.push(CDN_CONFIG.transformations.quality(quality))
  
  if (format === 'webp') {
    transformations.push(CDN_CONFIG.transformations.webp)
  }

  // const transformString = transformations.join(',')
  // TODO: Apply transformations when CDN is configured
  
  // For now, return original URL until CDN is set up
  return originalUrl
}

/**
 * Generates a low-quality placeholder image URL
 */
export function getPlaceholderUrl(
  originalUrl: string,
  options: { width?: number; height?: number } = {}
): string {
  const { width = 40, height = 40 } = options
  
  // Generate a blurred, low-quality placeholder
  return getOptimizedImageUrl(originalUrl, {
    width,
    height,
    quality: 10,
    format: 'jpeg'
  })
}

/**
 * Common Next.js Image props for album artwork
 */
export function getAlbumImageProps(
  src: string,
  alt: string,
  size: keyof typeof IMAGE_SIZES.album = 'medium',
  priority: boolean = false
): Partial<ImageProps> {
  const dimensions = IMAGE_SIZES.album[size]
  
  return {
    src: getOptimizedImageUrl(src, dimensions),
    alt,
    width: dimensions.width,
    height: dimensions.height,
    sizes: RESPONSIVE_SIZES.album[size],
    quality: IMAGE_QUALITY.album,
    priority,
    placeholder: 'blur',
    blurDataURL: getPlaceholderUrl(src, { width: 20, height: 20 }),
    className: 'transition-opacity duration-300'
  }
}

/**
 * Common Next.js Image props for hero images
 */
export function getHeroImageProps(
  src: string,
  alt: string,
  priority: boolean = true
): Partial<ImageProps> {
  const dimensions = IMAGE_SIZES.hero.desktop
  
  return {
    src: getOptimizedImageUrl(src, dimensions),
    alt,
    width: dimensions.width,
    height: dimensions.height,
    sizes: RESPONSIVE_SIZES.hero,
    quality: IMAGE_QUALITY.hero,
    priority,
    placeholder: 'blur',
    blurDataURL: getPlaceholderUrl(src, { width: 40, height: 40 }),
    className: 'transition-opacity duration-500'
  }
}

/**
 * Common Next.js Image props for thumbnails
 */
export function getThumbnailImageProps(
  src: string,
  alt: string,
  size: keyof typeof IMAGE_SIZES.thumbnail = 'md'
): Partial<ImageProps> {
  const dimensions = IMAGE_SIZES.thumbnail[size]
  
  return {
    src: getOptimizedImageUrl(src, dimensions),
    alt,
    width: dimensions.width,
    height: dimensions.height,
    sizes: RESPONSIVE_SIZES.thumbnail,
    quality: IMAGE_QUALITY.thumbnail,
    priority: false,
    placeholder: 'blur',
    blurDataURL: getPlaceholderUrl(src, { width: 10, height: 10 }),
    className: 'transition-opacity duration-200'
  }
}

/**
 * Preload critical images
 */
export function preloadImage(src: string, sizes: string = '300px'): void {
  if (typeof window !== 'undefined') {
    const link = document.createElement('link')
    link.rel = 'preload'
    link.as = 'image'
    link.href = src
    link.sizes = sizes
    document.head.appendChild(link)
  }
}

/**
 * Lazy load images with Intersection Observer
 */
export function createImageObserver(
  callback: (entries: IntersectionObserverEntry[]) => void,
  options: IntersectionObserverInit = {}
): IntersectionObserver | null {
  if (typeof window === 'undefined' || !('IntersectionObserver' in window)) {
    return null
  }

  return new IntersectionObserver(callback, {
    rootMargin: '50px 0px', // Start loading 50px before the image enters viewport
    threshold: 0.01,
    ...options
  })
}

/**
 * Check if WebP is supported
 */
export function supportsWebP(): Promise<boolean> {
  return new Promise((resolve) => {
    const webP = new Image()
    webP.onload = webP.onerror = () => {
      resolve(webP.height === 2)
    }
    webP.src = 'data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA'
  })
}

/**
 * Check if AVIF is supported
 */
export function supportsAVIF(): Promise<boolean> {
  return new Promise((resolve) => {
    const avif = new Image()
    avif.onload = avif.onerror = () => {
      resolve(avif.height === 2)
    }
    avif.src = 'data:image/avif;base64,AAAAIGZ0eXBhdmlmAAAAAGF2aWZtaWYxbWlhZk1BMUIAAADybWV0YQAAAAAAAAAoaGRscgAAAAAAAAAAcGljdAAAAAAAAAAAAAAAAGxpYmF2aWYAAAAADnBpdG0AAAAAAAEAAAAeaWxvYwAAAABEAAABAAEAAAABAAABGgAAAB0AAAAoaWluZgAAAAAAAQAAABppbmZlAgAAAAABAABhdjAxQ29sb3IAAAAAamlwcnAAAABLaXBjbwAAABRpc3BlAAAAAAAAAAIAAAACAAAAEHBpeGkAAAAAAwgICAAAAAxhdjFDgQ0MAAAAABNjb2xybmNseAACAAIAAYAAAAAXaXBtYQAAAAAAAAABAAEEAQKDBAAAACVtZGF0EgAKCBgABogQEAwgMg8f8D///8WfhwB8+ErK42A='
  })
}

/**
 * Optimize album artwork URLs from external sources
 */
export function optimizeSpotifyImageUrl(
  spotifyUrl: string,
  targetSize: number = 300
): string {
  // Spotify URLs often have size parameters we can modify
  // Example: https://i.scdn.co/image/ab67616d0000b273... (640x640)
  // We can replace with: https://i.scdn.co/image/ab67616d00001e02... (300x300)
  
  const sizeMap: Record<number, string> = {
    64: '00001e02',
    300: '00001e02',
    640: '0000b273'
  }
  
  let bestSize = 640 // Default to highest quality
  for (const size of Object.keys(sizeMap).map(Number).sort((a, b) => a - b)) {
    if (size >= targetSize) {
      bestSize = size
      break
    }
  }
  
  // Replace the size identifier in Spotify URLs
  if (spotifyUrl.includes('i.scdn.co/image/')) {
    return spotifyUrl.replace(/ab67616d[0-9a-f]{8}/, `ab67616d${sizeMap[bestSize]}`)
  }
  
  return spotifyUrl
}