import React from 'react'
import { StreamingIcon, type StreamingService } from './icons'

export interface StreamingButtonProps {
  service: StreamingService
  url: string
  showLabel?: boolean
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const serviceLabels: Record<StreamingService, string> = {
  spotify: 'Spotify',
  apple_music: 'Apple Music', 
  youtube_music: 'YouTube'
}

const serviceColors: Record<StreamingService, string> = {
  spotify: 'bg-green-500 hover:bg-green-400',
  apple_music: 'bg-gradient-to-r from-[#fa5a72] to-[#fa253e] hover:from-[#fb6b7f] hover:to-[#fb3651]',
  youtube_music: 'bg-red-500 hover:bg-red-400'
}

export function StreamingButton({ 
  service, 
  url, 
  showLabel = true, 
  size = 'md',
  className = '' 
}: StreamingButtonProps) {
  const label = serviceLabels[service]
  const colorClass = serviceColors[service]
  
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={`
        inline-flex items-center justify-center space-x-3 
        ${colorClass}
        text-white px-4 py-3 rounded-lg font-medium 
        transition-all duration-200 shadow-lg
        ${className}
      `}
      aria-label={`Listen on ${label}`}
    >
      <StreamingIcon service={service} size={size} />
      {showLabel && <span>{label}</span>}
    </a>
  )
}