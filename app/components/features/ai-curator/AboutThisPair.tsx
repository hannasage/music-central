'use client'

import { Album } from '@/lib/types'
import { Lightbulb } from 'lucide-react'

interface AboutThisPairProps {
  albumPair: [Album, Album]
  reasoning?: string
  className?: string
}

export default function AboutThisPair({ albumPair, reasoning, className = '' }: AboutThisPairProps) {
  if (!albumPair || !reasoning) {
    return null
  }

  return (
    <div className={`bg-zinc-900/40 backdrop-blur-sm rounded-xl p-4 border border-zinc-800/40 ${className}`}>
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0 mt-0.5">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-lg flex items-center justify-center border border-blue-500/30">
            <Lightbulb className="w-4 h-4 text-blue-400" />
          </div>
        </div>
        
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-white mb-2 flex items-center space-x-2">
            <span>About This Pair</span>
          </h4>
          
          <p className="text-zinc-300 text-sm leading-relaxed">
            {reasoning}
          </p>
        </div>
      </div>
    </div>
  )
}