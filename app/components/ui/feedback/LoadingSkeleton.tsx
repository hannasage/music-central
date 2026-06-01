'use client'

import { Skeleton as UISkeleton } from '@hannasage/projection-ui'

export function Skeleton({ className = '', style, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <UISkeleton
      borderRadius="var(--ui-radius-sm)"
      style={{ display: 'block', ...style }}
      className={className}
      {...(props as object)}
    />
  )
}

export function AlbumCardSkeleton({ size = 'medium' }: { size?: 'small' | 'medium' | 'large' }) {
  const w = { small: 128, medium: 192, large: 256 }[size]
  const h = { small: 128, medium: 192, large: 256 }[size]

  return (
    <div style={{ width: w, display: 'flex', flexDirection: 'column', gap: 12 }}>
      <UISkeleton width={w} height={h} borderRadius="var(--ui-radius-lg)" />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <UISkeleton width="75%" height={14} />
        <UISkeleton width="50%" height={12} />
      </div>
      <div style={{ display: 'flex', gap: 4 }}>
        <UISkeleton width={48} height={20} borderRadius="var(--ui-radius-full)" />
        <UISkeleton width={64} height={20} borderRadius="var(--ui-radius-full)" />
      </div>
    </div>
  )
}

export function AlbumGridSkeleton({ count = 12 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <AlbumCardSkeleton key={i} />
      ))}
    </div>
  )
}

export function SearchResultsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <UISkeleton width={192} height={20} />
        <div className="flex items-center space-x-4">
          <UISkeleton width={96} height={32} />
          <UISkeleton width={80} height={32} />
        </div>
      </div>
      <AlbumGridSkeleton count={8} />
      <div className="flex justify-center space-x-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <UISkeleton key={i} width={40} height={40} />
        ))}
      </div>
    </div>
  )
}

export function FeaturedAlbumsSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <UISkeleton width={128} height={24} />
        <UISkeleton width={80} height={16} />
      </div>
      <div className="flex space-x-4 overflow-hidden">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <UISkeleton width={192} height={192} borderRadius="var(--ui-radius-lg)" />
            <UISkeleton width={144} height={14} />
            <UISkeleton width={96} height={12} />
          </div>
        ))}
      </div>
    </div>
  )
}

export function ChatInterfaceSkeleton() {
  return (
    <div className="flex flex-col h-full bg-zinc-900/50 backdrop-blur-sm rounded-xl border border-zinc-800/50">
      <div className="flex items-center justify-between p-4 border-b border-zinc-800/50">
        <div className="flex items-center space-x-3">
          <UISkeleton width={40} height={40} borderRadius="var(--ui-radius-md)" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <UISkeleton width={128} height={14} />
            <UISkeleton width={192} height={12} />
          </div>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <div className="space-y-3">
          <UISkeleton width={96} height={14} style={{ margin: '0 auto' }} />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <UISkeleton key={i} height={48} borderRadius="var(--ui-radius-md)" />
            ))}
          </div>
        </div>
      </div>
      <div className="p-4 border-t border-zinc-800/50">
        <div className="flex space-x-3">
          <UISkeleton height={48} borderRadius="var(--ui-radius-lg)" style={{ flex: 1 }} />
          <UISkeleton width={48} height={48} borderRadius="var(--ui-radius-lg)" />
        </div>
        <UISkeleton width={256} height={12} style={{ margin: '8px auto 0' }} />
      </div>
    </div>
  )
}

export function PageHeaderSkeleton() {
  return (
    <div className="text-center mb-8">
      <div className="flex items-center justify-center space-x-3 mb-4">
        <UISkeleton width={48} height={48} borderRadius="var(--ui-radius-md)" />
        <UISkeleton width={256} height={32} />
      </div>
      <UISkeleton width={384} height={16} style={{ margin: '0 auto' }} />
    </div>
  )
}

export function ContentSkeleton({ lines = 3 }: { lines?: number }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {Array.from({ length: lines }).map((_, i) => (
        <UISkeleton key={i} width={i === lines - 1 ? '75%' : '100%'} height={14} />
      ))}
    </div>
  )
}
