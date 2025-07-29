'use client'

interface AIChatWindowProps {
  isOpen: boolean
  onClose: () => void
}

export default function AIChatWindow({ isOpen, onClose }: AIChatWindowProps) {
  const hardcodedMessages = [
    {
      id: 1,
      type: 'user' as const,
      content: 'What can you help me with regarding my music collection?',
      timestamp: new Date(Date.now() - 300000) // 5 minutes ago
    },
    {
      id: 2,
      type: 'system' as const,
      content: 'I can help you discover new music, analyze your collection, find similar albums, and provide personalized recommendations based on your listening preferences. I can also help you organize your collection, find rare albums, and explore different genres and artists.',
      timestamp: new Date(Date.now() - 240000) // 4 minutes ago
    }
  ]

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 md:hidden"
        onClick={onClose}
      />
      
      {/* Chat Window */}
      <div className={`
        fixed bottom-24 right-6 w-80 h-96 bg-zinc-900 border border-zinc-700 rounded-lg shadow-2xl z-50
        transform transition-all duration-300 origin-bottom-right
        ${isOpen ? 'scale-100 opacity-100' : 'scale-95 opacity-0 pointer-events-none'}
        max-md:fixed max-md:inset-4 max-md:w-auto max-md:h-auto max-md:bottom-6 max-md:top-20
      `}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-zinc-700">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-600 to-blue-600 flex items-center justify-center">
              <span className="text-white text-sm font-bold">AI</span>
            </div>
            <div>
              <h3 className="text-white font-semibold">Music Assistant</h3>
              <p className="text-zinc-400 text-xs">Online</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-white transition-colors p-1"
            aria-label="Close chat"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 p-4 space-y-4 overflow-y-auto max-h-64">
          {hardcodedMessages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xs px-3 py-2 rounded-lg text-sm ${
                  message.type === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-zinc-800 text-zinc-100 border border-zinc-700'
                }`}
              >
                <p>{message.content}</p>
                <p className={`text-xs mt-1 ${
                  message.type === 'user' ? 'text-blue-100' : 'text-zinc-500'
                }`}>
                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Input Area */}
        <div className="p-4 border-t border-zinc-700">
          <div className="flex items-center space-x-2">
            <input
              type="text"
              placeholder="Ask me about your music..."
              className="flex-1 px-3 py-2 bg-zinc-800 border border-zinc-600 rounded-lg text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              disabled
            />
            <button
              className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              disabled
            >
              Send
            </button>
          </div>
          <p className="text-xs text-zinc-500 mt-2">Chat functionality coming soon...</p>
        </div>
      </div>
    </>
  )
}