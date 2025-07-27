import ChatInterface from '@/app/components/ChatInterface'
import Header from '@/app/components/Header'
import { Sparkles, Music, Brain } from 'lucide-react'

export default function RecommendationsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950">
      <Header />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Main Content */}
          <div className="flex-1">
            {/* Chat Interface */}
            <div className="h-[600px] lg:h-[700px]">
              <ChatInterface className="h-full" />
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:w-80 space-y-6">
            {/* Features */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white">How it works</h3>
              
              <div className="bg-zinc-900/50 backdrop-blur-sm rounded-xl p-4 border border-zinc-800/50">
                <div className="flex items-center space-x-3 mb-2">
                  <Sparkles className="w-5 h-5 text-yellow-400" />
                  <h4 className="font-medium text-white">Smart Recommendations</h4>
                </div>
                <p className="text-zinc-400 text-sm">
                  AI analyzes audio features, genres, and personal vibes from my collection
                </p>
              </div>

              <div className="bg-zinc-900/50 backdrop-blur-sm rounded-xl p-4 border border-zinc-800/50">
                <div className="flex items-center space-x-3 mb-2">
                  <Music className="w-5 h-5 text-green-400" />
                  <h4 className="font-medium text-white">My Collection Only</h4>
                </div>
                <p className="text-zinc-400 text-sm">
                  All suggestions come exclusively from albums I already own
                </p>
              </div>

              <div className="bg-zinc-900/50 backdrop-blur-sm rounded-xl p-4 border border-zinc-800/50">
                <div className="flex items-center space-x-3 mb-2">
                  <Brain className="w-5 h-5 text-purple-400" />
                  <h4 className="font-medium text-white">Natural Conversation</h4>
                </div>
                <p className="text-zinc-400 text-sm">
                  Ask in plain English - &quot;something upbeat&quot; or &quot;chill music for studying&quot;
                </p>
              </div>
            </div>

            {/* Tips */}
            <div className="bg-zinc-900/30 backdrop-blur-sm rounded-xl p-4 border border-zinc-800/30">
              <h4 className="font-medium text-white mb-3">Tips for better results:</h4>
              <div className="space-y-2 text-sm text-zinc-400">
                <p>• Describe my mood: &quot;I&apos;m feeling nostalgic&quot;</p>
                <p>• Mention activities: &quot;good for working out&quot;</p>
                <p>• Reference genres: &quot;something like jazz but more upbeat&quot;</p>
                <p>• Be specific about energy: &quot;low-key and mellow&quot;</p>
                <p>• Ask for discovery: &quot;something I might have overlooked&quot;</p>
                <p>• Reference other albums: &quot;similar to [album name]&quot;</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}