'use client'

import { useState } from 'react'
import { Sparkles, X } from 'lucide-react'
import AIChatWindow from './AIChatWindow'

export default function AIFloatingButton() {
  const [isOpen, setIsOpen] = useState(false)

  const toggleChat = () => {
    setIsOpen(!isOpen)
  }

  return (
    <>
      {/* Floating Action Button */}
      <button
        onClick={toggleChat}
        className={`fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full shadow-lg transition-all duration-300 transform hover:scale-110 ${
          isOpen 
            ? 'bg-red-600 hover:bg-red-700 rotate-90' 
            : 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700'
        }`}
        aria-label={isOpen ? 'Close AI Chat' : 'Open AI Chat'}
      >
        <div className="flex items-center justify-center w-full h-full">
          {isOpen ? (
            <X className="w-6 h-6 text-white" />
          ) : (
            <Sparkles className="w-6 h-6 text-white animate-pulse" />
          )}
        </div>
      </button>

      {/* Chat Window */}
      <AIChatWindow isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  )
}