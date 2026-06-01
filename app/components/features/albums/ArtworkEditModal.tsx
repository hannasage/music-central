'use client'

import { useState } from 'react'
import ImageUpload from '@/app/components/shared/ImageUpload'
import { Album } from '@/lib/types'
import { Modal, Input } from '@hannasage/projection-ui'

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
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cover_art_url: newArtworkUrl || null }),
      })

      const result = await response.json()

      if (!response.ok) throw new Error(result.error || 'Failed to update artwork')

      onSave(result.album)
      onClose()
    } catch (err) {
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
    <Modal
      open={isOpen}
      title="Update Album Artwork"
      onDismiss={handleCancel}
      maxWidth={512}
      actions={[
        { label: 'Cancel', onClick: handleCancel },
        {
          label: isLoading ? 'Saving…' : 'Save Artwork',
          variant: 'primary',
          onClick: handleSave,
          disabled: isLoading || newArtworkUrl === (album.cover_art_url ?? ''),
        },
      ]}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontWeight: 600, color: 'var(--ui-text)' }}>{album.title}</p>
          <p style={{ color: 'var(--ui-muted)', fontSize: 13 }}>by {album.artist}</p>
        </div>

        <ImageUpload
          onImageUploaded={handleImageUploaded}
          currentImage={newArtworkUrl}
          disabled={isLoading}
          className="mb-1"
        />

        <Input
          label="Or paste image URL"
          type="url"
          placeholder="https://..."
          value={newArtworkUrl}
          onChange={(e) => setNewArtworkUrl(e.target.value)}
          disabled={isLoading}
        />

        {error && (
          <p style={{ fontSize: 12, color: 'var(--ui-danger)' }}>{error}</p>
        )}
      </div>
    </Modal>
  )
}
