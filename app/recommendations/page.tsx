import type { Metadata } from 'next'
import AICuratorInterface from '@/app/components/AICuratorInterface'
import Header from '@/app/components/Header'
import BetaBanner from '@/app/components/BetaBanner'

export const metadata: Metadata = {
  title: "AI Curator - Discover Your Next Favorite Album | Hanna's Record Collection",
  description: "Let AI help you discover your next favorite album from Hanna's curated collection. Battle albums head-to-head and get personalized recommendations based on your preferences.",
  openGraph: {
    title: "AI Curator - Discover Your Next Favorite Album",
    description: "Let AI help you discover your next favorite album from Hanna's curated collection. Battle albums head-to-head and get personalized recommendations based on your preferences.",
    type: "website",
  },
  twitter: {
    card: 'summary',
    title: "AI Curator - Discover Your Next Favorite Album",
    description: "Let AI help you discover your next favorite album from Hanna's curated collection. Battle albums head-to-head and get personalized recommendations based on your preferences.",
  },
}

export default function RecommendationsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950">
      <Header />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <BetaBanner />
        <AICuratorInterface />
      </div>
    </div>
  )
}