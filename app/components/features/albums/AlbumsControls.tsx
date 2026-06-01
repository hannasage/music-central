'use client'

import { Grid3X3, List } from 'lucide-react'
import { ButtonGroup } from '@hannasage/projection-ui'

interface AlbumsControlsProps {
  viewMode: 'grid' | 'list'
  onViewModeChange: (mode: 'grid' | 'list') => void
}

const VIEW_OPTIONS = [
  { value: 'grid' as const, label: <Grid3X3 size={14} />, title: 'Grid view' },
  { value: 'list' as const, label: <List size={14} />, title: 'List view' },
]

export default function AlbumsControls({ viewMode, onViewModeChange }: AlbumsControlsProps) {
  return (
    <div className="flex items-center md:hidden">
      <ButtonGroup
        variant="segmented"
        options={VIEW_OPTIONS}
        value={viewMode}
        onChange={onViewModeChange}
        size="sm"
      />
    </div>
  )
}
