'use client'

import { ReactNode } from 'react'

interface FloatingActionButtonsProps {
  children: ReactNode
  className?: string
}

export default function FloatingActionButtons({ children, className = '' }: FloatingActionButtonsProps) {
  return (
    <div className={`fixed bottom-6 right-6 z-40 flex flex-col-reverse items-end space-y-reverse space-y-3 ${className}`}>
      {children}
    </div>
  )
}

interface FABProps {
  children: ReactNode
  onClick?: () => void
  className?: string
  disabled?: boolean
  title?: string
}

export function FAB({ children, onClick, className = '', disabled = false, title }: FABProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`
        w-14 h-14 bg-blue-500 hover:bg-blue-400 disabled:bg-zinc-700 disabled:opacity-50
        text-white rounded-full shadow-lg hover:shadow-xl
        flex items-center justify-center
        transition-all duration-200 hover:scale-105 active:scale-95
        disabled:cursor-not-allowed disabled:hover:scale-100
        ${className}
      `}
    >
      {children}
    </button>
  )
}