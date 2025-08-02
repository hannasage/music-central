'use client'

import { AlertTriangle } from 'lucide-react'

interface BetaBannerProps {
  className?: string
}

export default function BetaBanner({ className = '' }: BetaBannerProps) {
  return (
    <div className={`relative overflow-hidden ${className}`}>
      {/* Animated glow effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/20 via-orange-500/20 to-yellow-500/20 animate-pulse rounded-xl blur-sm" />
      <div className="absolute inset-0 bg-gradient-to-r from-yellow-400/10 via-orange-400/10 to-yellow-400/10 rounded-xl animate-pulse" style={{ animationDelay: '0.5s' }} />
      
      {/* Banner content */}
      <div className="relative bg-zinc-900/90 backdrop-blur-sm border border-yellow-500/30 rounded-xl p-4 shadow-2xl">
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0">
            <div className="relative">
              <AlertTriangle className="w-6 h-6 text-yellow-400" />
              <div className="absolute inset-0 w-6 h-6 text-yellow-400 animate-ping opacity-75">
                <AlertTriangle className="w-6 h-6" />
              </div>
            </div>
          </div>
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-1">
              <h3 className="font-semibold text-yellow-300">AI Curator - Beta v0.3.0</h3>
              <span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-300 text-xs font-medium rounded-full border border-yellow-500/30">
                BETA
              </span>
            </div>
            <p className="text-zinc-300 text-sm leading-relaxed mb-2">
              This feature is currently in beta testing. You may experience slower performance and a less polished interface while we optimize the experience.
            </p>
            <div className="text-zinc-400 text-xs">
              <strong className="text-zinc-300">New in v0.3.0:</strong> Personalized streaming preferences with AI-generated album pairing insights. Choose your preferred music platform for streamlined listening links throughout the experience.
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}