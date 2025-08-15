'use client'

import { AddAlbumModalProvider } from '@/app/contexts/AddAlbumModalContext'
import AddAlbumModal from './AddAlbumModal'

export default function AddAlbumModalWrapper({ children }: { children: React.ReactNode }) {
  return (
    <AddAlbumModalProvider>
      {children}
      <AddAlbumModal />
    </AddAlbumModalProvider>
  )
}