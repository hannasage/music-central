'use client'

import { createContext, useContext, useState } from 'react'

interface AddAlbumModalContextType {
  isOpen: boolean
  openModal: () => void
  closeModal: () => void
}

const AddAlbumModalContext = createContext<AddAlbumModalContextType | undefined>(undefined)

export function AddAlbumModalProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)

  const openModal = () => setIsOpen(true)
  const closeModal = () => setIsOpen(false)

  return (
    <AddAlbumModalContext.Provider value={{ isOpen, openModal, closeModal }}>
      {children}
    </AddAlbumModalContext.Provider>
  )
}

export function useAddAlbumModal() {
  const context = useContext(AddAlbumModalContext)
  if (context === undefined) {
    throw new Error('useAddAlbumModal must be used within an AddAlbumModalProvider')
  }
  return context
}