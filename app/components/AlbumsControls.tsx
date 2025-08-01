'use client'

import { Grid3X3, List } from 'lucide-react'

interface AlbumsControlsProps {
  viewMode: 'grid' | 'list'
  onViewModeChange: (mode: 'grid' | 'list') => void
}

export default function AlbumsControls({ 
  viewMode, 
  onViewModeChange 
}: AlbumsControlsProps) {
  return (
    <div className="flex items-center mt-4 sm:mt-0 md:hidden">
      {/* View Mode Toggle */}
      <div className="flex items-center bg-zinc-800/50 border border-zinc-700/50 rounded-lg p-1">
        <button
          onClick={() => onViewModeChange('grid')}
          className={`p-2 rounded transition-colors duration-200 ${
            viewMode === 'grid'
              ? 'bg-blue-500 text-white'
              : 'text-zinc-400 hover:text-white'
          }`}
          title="Grid view"
        >
          <Grid3X3 className="w-4 h-4" />
        </button>
        <button
          onClick={() => onViewModeChange('list')}
          className={`p-2 rounded transition-colors duration-200 ${
            viewMode === 'list'
              ? 'bg-blue-500 text-white'
              : 'text-zinc-400 hover:text-white'
          }`}
          title="List view"
        >
          <List className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}