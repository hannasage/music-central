'use client'

import { useState, useEffect, useRef } from 'react'
import { Album } from '@/lib/types'
import AlbumCard from './AlbumCard'
import { Send, Bot, User, RefreshCw } from 'lucide-react'

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  recommendations?: Album[]
  reasoning?: string[]
}

interface ChatInterfaceProps {
  className?: string
}

export default function ChatInterface({ className = '' }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [conversationStarters, setConversationStarters] = useState<string[]>([])
  const [showStarters, setShowStarters] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Load conversation starters
  useEffect(() => {
    const loadStarters = async () => {
      try {
        const response = await fetch('/api/chat')
        if (response.ok) {
          const data = await response.json()
          setConversationStarters(data.starters || [])
        }
      } catch (error) {
        console.error('Error loading conversation starters:', error)
      }
    }

    loadStarters()
  }, [])

  // Send message
  const sendMessage = async (messageText: string) => {
    if (!messageText.trim() || isLoading) return

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: messageText.trim(),
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)
    setShowStarters(false)

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: messageText.trim(),
          conversationHistory: messages.slice(-4) // Send last 4 messages for context
        })
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      const data = await response.json()

      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.message,
        timestamp: new Date(),
        recommendations: data.recommendations || [],
        reasoning: data.reasoning || []
      }

      setMessages(prev => [...prev, assistantMessage])

    } catch (error) {
      console.error('Error sending message:', error)
      
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "I'm having trouble processing your request right now. Please try again in a moment!",
        timestamp: new Date()
      }

      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    sendMessage(input)
  }

  // Handle starter click
  const handleStarterClick = (starter: string) => {
    sendMessage(starter)
  }

  // Clear conversation
  const clearConversation = () => {
    setMessages([])
    setShowStarters(true)
  }

  return (
    <div className={`flex flex-col h-full bg-zinc-900/50 backdrop-blur-sm rounded-xl border border-zinc-800/50 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-zinc-800/50">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-500/20 rounded-lg">
            <Bot className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <h3 className="font-semibold text-white">AI Music Curator</h3>
            <p className="text-sm text-zinc-400">Recommendations from my collection</p>
          </div>
        </div>
        
        {messages.length > 0 && (
          <button
            onClick={clearConversation}
            className="p-2 text-zinc-400 hover:text-white transition-colors duration-200"
            title="Clear conversation"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
        {messages.length === 0 && showStarters ? (
          /* Conversation Starters */
          <div className="space-y-6">
            {conversationStarters.length > 0 && (
              <div className="space-y-3">
                <h5 className="text-sm font-medium text-zinc-300 text-center">
                  Try asking me:
                </h5>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {conversationStarters.map((starter, index) => (
                    <button
                      key={index}
                      onClick={() => handleStarterClick(starter)}
                      className="p-3 text-left text-sm text-zinc-300 bg-zinc-800/50 hover:bg-zinc-700/50 rounded-lg transition-colors duration-200 border border-zinc-700/30 hover:border-zinc-600/50"
                    >
                      {starter}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Conversation Messages */
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex space-x-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {message.role === 'assistant' && (
                <div className="flex-shrink-0 w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center">
                  <Bot className="w-4 h-4 text-blue-400" />
                </div>
              )}

              <div className={`max-w-[80%] space-y-3 ${message.role === 'user' ? 'order-1' : ''}`}>
                <div
                  className={`px-4 py-3 rounded-2xl ${
                    message.role === 'user'
                      ? 'bg-blue-500 text-white ml-auto'
                      : 'bg-zinc-800/50 text-zinc-200'
                  }`}
                >
                  <p className="text-sm leading-relaxed">{message.content}</p>
                </div>

                {/* Recommendations */}
                {message.recommendations && message.recommendations.length > 0 && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {message.recommendations.map((album) => (
                        <AlbumCard
                          key={album.id}
                          album={album}
                          size="small"
                          className="bg-zinc-800/30 hover:bg-zinc-700/50 transition-colors duration-200"
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Timestamp */}
                <p className="text-xs text-zinc-500">
                  {message.timestamp.toLocaleTimeString([], { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </p>
              </div>

              {message.role === 'user' && (
                <div className="flex-shrink-0 w-8 h-8 bg-zinc-700 rounded-full flex items-center justify-center order-2">
                  <User className="w-4 h-4 text-zinc-300" />
                </div>
              )}
            </div>
          ))
        )}

        {/* Loading Message */}
        {isLoading && (
          <div className="flex space-x-3 justify-start">
            <div className="flex-shrink-0 w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center">
              <Bot className="w-4 h-4 text-blue-400" />
            </div>
            <div className="bg-zinc-800/50 text-zinc-200 px-4 py-3 rounded-2xl">
              <div className="flex items-center space-x-2">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce" />
                  <div className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                  <div className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                </div>
                <span className="text-sm">Finding recommendations...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-zinc-800/50">
        <form onSubmit={handleSubmit} className="flex space-x-3">
          <div className="flex-1 relative">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask for music recommendations..."
              disabled={isLoading}
              className="w-full px-4 py-3 bg-zinc-800/50 border border-zinc-700/50 rounded-xl text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-200 disabled:opacity-50"
            />
          </div>
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="px-4 py-3 bg-blue-500 hover:bg-blue-400 disabled:bg-zinc-700 disabled:text-zinc-500 text-white rounded-xl transition-colors duration-200 flex items-center justify-center"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
        
        <p className="text-xs text-zinc-500 mt-2 text-center">
          AI recommendations are based on my personal music collection
        </p>
      </div>
    </div>
  )
}