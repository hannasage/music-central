'use client'

import { useState } from 'react'
import { X, Save } from 'lucide-react'
import ImageUpload from '@/app/components/shared/ImageUpload'
import { Album } from '@/lib/types'

interface ArtworkEditModalProps {
  album: Album
  isOpen: boolean
  onClose: () => void
  onSave: (updatedAlbum: Album) => void
}

export default function ArtworkEditModal({ album, isOpen, onClose, onSave }: ArtworkEditModalProps) {
  const [newArtworkUrl, setNewArtworkUrl] = useState(album.cover_art_url || '')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!isOpen) return null

  const handleImageUploaded = (url: string) => {
    setNewArtworkUrl(url)
    setError(null)
  }

  const handleSave = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/albums/${album.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cover_art_url: newArtworkUrl || null
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update artwork')
      }

      onSave(result.album)
      onClose()
    } catch (err) {
      console.error('Save error:', err)
      setError(err instanceof Error ? err.message : 'Failed to save artwork')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancel = () => {
    setNewArtworkUrl(album.cover_art_url || '')
    setError(null)
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-zinc-900 rounded-2xl border border-zinc-800 w-full max-w-lg">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-zinc-800">
          <h2 className="text-xl font-semibold text-white">Update Album Artwork</h2>
          <button
            onClick={handleCancel}
            className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
            disabled={isLoading}
          >
            <X className="w-5 h-5 text-zinc-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          <div className="text-center">
            <h3 className="text-lg font-medium text-white mb-2">{album.title}</h3>
            <p className="text-zinc-400">by {album.artist}</p>
          </div>

          {/* Image Upload */}
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-3">
              Album Artwork
            </label>
            <ImageUpload
              onImageUploaded={handleImageUploaded}
              currentImage={newArtworkUrl}
              disabled={isLoading}
              className="mb-3"
            />
            <input
              type="url"
              placeholder="Or paste image URL"
              value={newArtworkUrl}
              onChange={(e) => setNewArtworkUrl(e.target.value)}
              className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              disabled={isLoading}
            />
          </div>

          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-zinc-800">
          <button
            onClick={handleCancel}
            className="px-4 py-2 text-zinc-400 hover:text-white transition-colors"
            disabled={isLoading}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isLoading || newArtworkUrl === album.cover_art_url}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 text-white rounded-lg transition-colors"
          >
            {isLoading ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            {isLoading ? 'Saving...' : 'Save Artwork'}
          </button>
        </div>
      </div>
    </div>
  )
}