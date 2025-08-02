'use client'

import { useState } from 'react'
import { Sparkles, X, AlertTriangle } from 'lucide-react'
import AIChatWindow from './AIChatWindow'
import { FAB } from '@/app/components/shared/FloatingActionButtons'
import { useAdminNotifications } from '@/app/hooks/useAdminNotifications'

export default function AIFloatingButton() {
  const [isOpen, setIsOpen] = useState(false)
  const { unreadCount, notifications } = useAdminNotifications()

  // Check for critical notifications
  const criticalNotifications = notifications.filter(
    n => n.severity === 'critical' && !n.acknowledged
  )
  const hasCriticalNotifications = criticalNotifications.length > 0

  const toggleChat = () => {
    setIsOpen(!isOpen)
  }

  // Note: Removed auto-open for critical notifications
  // Now only shows visual indicators (badge, pulse, color change)
  // User must manually click to see error details

  return (
    <>
      {/* Floating Action Button */}
      <FAB
        onClick={toggleChat}
        title={
          isOpen 
            ? 'Close AI Chat' 
            : unreadCount > 0 
              ? `Open AI Chat (${unreadCount} notification${unreadCount > 1 ? 's' : ''})`
              : 'Open AI Chat'
        }
        className={`
          relative z-50 transition-all duration-300 transform hover:scale-110
          ${isOpen 
            ? 'bg-red-600 hover:bg-red-700 rotate-90' 
            : hasCriticalNotifications
              ? 'bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700'
              : unreadCount > 0
                ? 'bg-gradient-to-r from-yellow-600 to-purple-600 hover:from-yellow-700 hover:to-purple-700'
                : 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700'
          }
        `}
      >
        {isOpen ? (
          <X className="w-6 h-6 text-white" />
        ) : hasCriticalNotifications ? (
          <AlertTriangle className="w-6 h-6 text-white animate-pulse" />
        ) : (
          <Sparkles className="w-6 h-6 text-white animate-pulse" />
        )}
        
        {/* Notification Badge */}
        {!isOpen && unreadCount > 0 && (
          <div className="absolute -top-2 -right-2 min-w-[20px] h-5 bg-red-500 rounded-full flex items-center justify-center text-white text-xs font-bold border-2 border-white">
            {unreadCount > 99 ? '99+' : unreadCount}
          </div>
        )}
        
        {/* Critical notification pulse ring */}
        {!isOpen && hasCriticalNotifications && (
          <>
            <div className="absolute inset-0 bg-red-500 rounded-full animate-ping opacity-75" />
            <div className="absolute inset-0 bg-red-500 rounded-full animate-pulse opacity-50" />
          </>
        )}
      </FAB>

      {/* Chat Window */}
      <AIChatWindow isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  )
}