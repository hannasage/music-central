'use client'

import { useState } from 'react'
import { Sparkles, X } from 'lucide-react'
import AIChatWindow from './AIChatWindow'
import { FAB } from '@/app/components/shared/FloatingActionButtons'

export default function AIFloatingButton() {
  const [isOpen, setIsOpen] = useState(false)

  const toggleChat = () => {
    setIsOpen(!isOpen)
  }

  return (
    <>
      {/* Floating Action Button */}
      <FAB
        onClick={toggleChat}
        title={isOpen ? 'Close AI Chat' : 'Open AI Chat'}
        className={`
          z-50 transition-all duration-300 transform hover:scale-110
          ${isOpen 
            ? 'bg-red-600 hover:bg-red-700 rotate-90' 
            : 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700'
          }
        `}
      >
        {isOpen ? (
          <X className="w-6 h-6 text-white" />
        ) : (
          <Sparkles className="w-6 h-6 text-white animate-pulse" />
        )}
      </FAB>

      {/* Chat Window */}
      <AIChatWindow isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  )
}