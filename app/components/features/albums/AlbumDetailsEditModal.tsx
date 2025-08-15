'use client'

import { Album, AlbumCreateData } from '@/lib/types'
import AlbumFormModal from './AlbumFormModal'

interface AlbumDetailsEditModalProps {
  album: Album
  isOpen: boolean
  onClose: () => void
  onSave: (updatedAlbum: Album) => void
}

export default function AlbumDetailsEditModal({ album, isOpen, onClose, onSave }: AlbumDetailsEditModalProps) {
  const handleSave = async (albumData: AlbumCreateData) => {
    const response = await fetch(`/api/albums/${album.id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(albumData)
    })

    const result = await response.json()

    if (!response.ok) {
      throw new Error(result.error || 'Failed to update album')
    }

    onSave(result.album)
    onClose()
  }

  return (
    <AlbumFormModal
      isOpen={isOpen}
      onClose={onClose}
      onSave={handleSave}
      album={album}
      title="Edit Album Details"
      submitButtonText="Save Changes"
      showImageUpload={false}
      showAIAssistance={true}
    />
  )
}