# Music Central 🎵

**My personal vinyl collection, reimagined as an intelligent digital experience.**

This is my digital vinyl collection - a showcase of both my musical taste and technical skills. I've transformed my physical record collection into an AI-powered platform that not only catalogs my albums but learns my preferences, provides intelligent recommendations, and offers deep insights into my musical journey.

## ✨ Features

### 🎯 What I Built
- **My Digital Collection** - Every album from my physical vinyl collection, digitized with rich metadata
- **AI That Knows My Taste** - A battle-style curator that learns from my choices and musical preferences
- **Intelligent Search** - Find albums by genre, year, audio features, or even my personal thoughts about them
- **Daily Featured Selection** - Algorithm that highlights different records from my collection each day
- **Streaming Bridge** - Connect my vinyl collection to Spotify, Apple Music, and YouTube Music

### 🤖 AI-Powered Personal Assistant
- **Learns My Preferences** - AI analyzes my musical choices to understand what I really love
- **Conversational Discovery** - Chat naturally about music and get personalized recommendations
- **Audio DNA Analysis** - Deep dive into the sonic characteristics of my collection using Spotify's audio features
- **Memory of My Thoughts** - Each album includes my personal vibes, memories, and detailed thoughts
- **Smart Data Enhancement** - AI helps fill in missing information about obscure records in my collection

### 📊 My Musical Identity in Data
- **Taste Visualization** - See my musical preferences mapped out in charts and graphs  
- **Collection Insights** - Statistical overview of genres, decades, and sonic patterns in my library
- **Evolution Over Time** - Track how my musical taste has developed and changed
- **Sonic Fingerprint** - Visual representation of the audio characteristics that define my collection

## 🛠 How I Built It

### Frontend Stack
- **Framework**: [Next.js 15.4.4](https://nextjs.org) with App Router
- **Runtime**: React 19.1.0 with Server Components
- **Styling**: [Tailwindcss 4](https://tailwindcss.com) for responsive design
- **Icons**: [Lucide React](https://lucide.dev) for consistent iconography
- **Performance**: Turbopack for fast development builds

### Backend & Database
- **Database**: [Supabase](https://supabase.com) (PostgreSQL with real-time subscriptions)
- **Authentication**: Supabase Auth with row-level security
- **API Routes**: Next.js API routes for server-side logic
- **Data Validation**: [Zod](https://zod.dev) for type-safe schema validation

### AI & External Services
- **AI Provider**: [OpenAI GPT](https://openai.com) for recommendations and chat
- **AI Agents**: [@openai/agents](https://github.com/openai/openai-agents) for structured interactions
- **Music Data**: [Spotify Web API](https://developer.spotify.com/documentation/web-api) for metadata and audio features
- **Web Search**: [Tavily](https://tavily.com) for contextual album information
- **Deployment**: [Vercel](https://vercel.com) with integrated SDK

### Development Tools
- **Language**: TypeScript 5 for type safety
- **Linting**: ESLint 9 with Next.js configuration
- **Build System**: Next.js native build system with optimizations
- **Database Migrations**: Supabase CLI for schema management
- **Environment Management**: dotenv for local development

## 🎧 Explore My Collection

Visit the live application to explore my vinyl collection and see the AI curator in action. The platform showcases:

- **My Complete Vinyl Library** - Hundreds of albums from my personal collection
- **Interactive AI Curator** - Battle through album pairs to see how well the AI learns your taste
- **Personal Insights** - Read my thoughts and feelings about each record
- **Musical Analysis** - Discover the sonic patterns that define my collection
- **Smart Recommendations** - Get personalized suggestions based on my collection

The application demonstrates modern web development practices with real-world data from my personal music collection.

## 📁 Project Structure

```
music-central/
├── app/                          # Next.js App Router
│   ├── albums/                   # Album browsing and detail pages
│   ├── api/                      # API routes and endpoints
│   ├── components/               # Reusable React components
│   ├── recommendations/          # AI curator interface
│   └── search/                   # Search functionality
├── lib/                          # Core business logic
│   ├── agent-tools/              # AI agent tools and utilities
│   ├── services/                 # External service integrations
│   ├── albums.ts                 # Album data management
│   ├── ai-recommendations.ts     # AI recommendation engine
│   ├── recommendation-engine.ts  # Core recommendation logic
│   └── types.ts                  # TypeScript type definitions
├── supabase/                     # Database schema and migrations
│   ├── migrations/               # SQL migration files
│   └── seed.sql                  # Initial data seeding
└── hooks/                        # Custom React hooks
```

## 🎨 Key Components

### My AI Music Curator
I built a unique battle-style preference learning system that gets to know my musical taste:
- Present pairs of albums from my collection and let users choose their preference
- Analyzes the audio features and metadata patterns behind my choices
- Learns from multiple rounds of decisions to understand my musical DNA
- Provides contextual recommendations based on mood, genre, or specific requests
- Maintains conversation history for increasingly personalized interactions

### My Digital Album Collection
Each record in my collection includes rich, personal metadata:
- Essential details (title, artist, year, genres) sourced from Spotify
- Deep audio analysis (danceability, energy, valence, acousticness, etc.)
- My personal thoughts, memories, and emotional connections to each album
- Streaming links to find the music on your preferred platform
- High-quality cover art and visual presentation
- Personal "vibes" tags that capture how each album makes me feel

### Intelligent Discovery Engine
Multiple ways to explore and understand my musical taste:
- Search through titles, artists, genres, and even my personal thoughts
- Filter by decade, genre, or specific audio characteristics
- Discover albums based on sonic similarity (high energy, melancholic, danceable, etc.)
- Browse my personal vibe tags and emotional connections
- Daily featured selections that highlight different aspects of my collection

## ⚡ Technical Highlights

This project showcases several advanced development practices:

```bash
# Modern Development Workflow
npm run dev              # Turbopack for lightning-fast development
npm run build           # Optimized production builds
npm run lint            # ESLint 9 with strict TypeScript rules

# Database Management
npx supabase start      # Local development with real-time subscriptions
npx supabase db reset   # Schema migrations and data seeding
npx supabase gen types  # Auto-generated TypeScript types
```

## 🌐 Production Deployment

Deployed on [Vercel](https://vercel.com) with modern web optimization:
- Edge functions for global performance
- Automatic builds from Git commits
- Environment variable management
- Built-in analytics and monitoring
- Vercel SDK integration for programmatic deployment control

## 📊 Data Architecture

### My Collection Schema
The heart of the application is a carefully designed PostgreSQL schema that captures both objective and subjective aspects of my music collection:

```sql
CREATE TABLE albums (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,                    -- Album title
  artist TEXT NOT NULL,                   -- Primary artist
  year INTEGER NOT NULL,                  -- Release year
  spotify_id TEXT UNIQUE,                 -- Spotify integration
  genres TEXT[] DEFAULT '{}',             -- Musical genres
  audio_features JSONB,                   -- Spotify's audio analysis
  personal_vibes TEXT[] DEFAULT '{}',     -- My emotional tags
  thoughts TEXT,                          -- My personal review/memories
  cover_art_url TEXT,                     -- High-quality artwork
  streaming_links JSONB DEFAULT '{}',     -- Multi-platform links
  tracks JSONB DEFAULT '[]',              -- Complete track listings
  featured BOOLEAN DEFAULT false,         -- Daily feature rotation
  removed BOOLEAN DEFAULT false,          -- Soft delete capability
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

## 🎯 Project Philosophy

This project represents the intersection of personal passion and technical expertise. It demonstrates:

- **Personal Data as Art** - Transforming my vinyl collection into interactive digital experience
- **AI That Understands Context** - Machine learning applied to deeply personal, subjective data
- **Modern Web Architecture** - Server Components, edge functions, and real-time data
- **Type Safety Throughout** - TypeScript and Zod validation ensuring reliability
- **Performance at Scale** - Optimized for hundreds of albums with rich metadata
- **Design System Consistency** - Cohesive UI/UX across all components and interactions

This isn't just a portfolio piece—it's a living application I use daily to explore and understand my own musical taste.

---

**Built with ❤️ by [Hanna Sage](https://github.com/hannasage)**

*Powered by Spotify, OpenAI, and modern web technologies*