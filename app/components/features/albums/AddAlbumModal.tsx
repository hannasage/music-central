'use client'

import { useRouter } from 'next/navigation'
import { useAddAlbumModal } from '@/app/contexts/AddAlbumModalContext'
import { AlbumCreateData } from '@/lib/types'
import AlbumFormModal from './AlbumFormModal'

export default function AddAlbumModal() {
  const { isOpen, closeModal } = useAddAlbumModal()
  const router = useRouter()

  const handleSave = async (albumData: AlbumCreateData) => {
    const response = await fetch('/api/albums', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(albumData)
    })

    const result = await response.json()

    if (!response.ok) {
      throw new Error(result.error || 'Failed to create album')
    }

    // Success - navigate to the new album page
    closeModal()
    router.push(`/albums/${result.album.id}`)
  }

  return (
    <AlbumFormModal
      isOpen={isOpen}
      onClose={closeModal}
      onSave={handleSave}
      title="Add New Album"
      submitButtonText="Create Album"
      showImageUpload={true}
      showAIAssistance={true}
    />
  )
}