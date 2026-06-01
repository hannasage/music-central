import { Suspense } from 'react'
import Header from '@/app/components/shared/Header'
import AlbumsPageClient from '@/app/components/features/albums/AlbumsPageClient'
import { AlbumGridSkeleton } from '@/app/components/ui/feedback/LoadingSkeleton'
import { getAllAlbums } from '@/lib/albums'

export default async function AlbumsPage() {
  const result = await getAllAlbums(1, 1000) // load all for client-side filtering

  const pagination = {
    page: 1, limit: 24,
    total: result.total,
    totalPages: result.totalPages,
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg)' }}>
      <Header />

      <main id="main-content" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page header with accent glow */}
        <div style={{ position: 'relative', marginBottom: 32 }}>
          {/* Glow blob */}
          <div aria-hidden style={{
            position: 'absolute',
            top: -40, left: 0,
            width: 480, height: 160,
            background: 'radial-gradient(closest-side, var(--color-accent-soft), transparent)',
            filter: 'blur(48px)',
            pointerEvents: 'none',
            zIndex: 0,
          }} />

          <div style={{ position: 'relative', zIndex: 1 }}>
            {/* Accent line */}
            <div style={{ width: 32, height: 2, background: 'var(--color-accent)', marginBottom: 12, borderRadius: 1 }} />
            <h1 style={{
              fontSize: 28, fontWeight: 700, color: 'var(--color-text)',
              fontFamily: 'var(--ui-font)', letterSpacing: '-0.01em', marginBottom: 4,
            }}>
              All Albums
            </h1>
            <p style={{ fontSize: 13, color: 'var(--color-text-dim)', fontFamily: 'var(--ui-font)' }}>
              {result.total} album{result.total !== 1 ? 's' : ''} in your collection
            </p>
          </div>
        </div>

        <Suspense fallback={<AlbumGridSkeleton count={24} />}>
          <AlbumsPageClient
            initialAlbums={result.albums}
            initialPagination={pagination}
          />
        </Suspense>
      </main>
    </div>
  )
}
