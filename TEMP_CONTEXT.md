# Music Central: Album Details Management & Agentic Tools Initiative

## Context Overview

Building two complementary systems for managing album details in the Music Central vinyl collection platform:

1. **Manual Album Details Management Interface** - Direct UI controls for authenticated users
2. **Agentic Tools for Autonomous Album Management** - AI-powered tools for intelligent album management

## Current System State

### Database Schema (Albums Table)
- **Duplicate support**: Albums table now supports duplicate titles and Spotify IDs (migration `20250814000000_allow_duplicate_spotify_ids.sql`)
- **Storage infrastructure**: `alternate-artworks` bucket created for custom artwork uploads (migration `20250814000001_create_alternate_artworks_bucket.sql`)
- **Image domains**: Next.js config updated to allow images from any URL (both HTTP/HTTPS with wildcard hostnames)

### Existing Agent Tools (`/lib/agent-tools/`)
- `add-album.tool.ts` - Adds albums via Spotify search + AI enhancement
- `search-albums.tool.ts` - Searches existing collection
- `update-album.tool.ts` - Updates album fields (genres, vibes, thoughts, featured status, etc.)
- `error-logs.tool.ts` - System error analysis
- `log-analysis.tool.ts` - Advanced debugging tools
- `vercel-build.tool.ts` - Deployment management

### AI-Powered Research Infrastructure (ALREADY COMPLETE!)
- **AIBackfillService**: Full Tavily + OpenAI integration for album research (`/lib/ai-backfill-service.ts`)
- **Web search**: Tavily API searches for album reviews, cultural context, genre info
- **AI enhancement**: OpenAI generates genres, vibes, and thoughts from web research
- **Agent integration**: Already used in `add-album.tool.ts` for Spotify-found albums
- **Environment ready**: `TAVILY_API_KEY` support in place

### Current Album Display (`/app/albums/[id]/AlbumContent.tsx`)
- Clean album detail page layout
- Cover art display with fallback
- Album metadata (title, artist, year, genres, vibes)
- Personal thoughts section
- Audio features and track list

## Planned Implementation

### 1. Manual Album Details Management Interface

**Two Edit Icons Approach:**

#### A) Artwork Edit Icon
- **Location**: Next to the album cover art
- **Functionality**: Opens modal with drag-and-drop image upload
- **Features**:
  - Direct file upload to `alternate-artworks` bucket
  - Image preview before saving
  - Updates `cover_art_url` field via `/api/albums/[id]` PATCH endpoint

#### B) Details Edit Icon  
- **Location**: Next to album title/artist
- **Functionality**: Opens comprehensive album details editing modal
- **Editable Fields**:
  - Title, Artist, Year
  - Genres (comma-separated tags)
  - Personal Vibes (comma-separated tags)
  - Personal Thoughts (textarea)
  - Streaming Links
  - Featured status

### 2. Agentic Tools for Autonomous Album Management

**Enhanced Agent Capabilities:**

#### A) Enhanced Add Album Flow (Leveraging Existing AI Infrastructure)
**Current flow**: User provides album + artist → Spotify search → AI enhancement → Database insert

**Enhanced flow for streaming-unavailable albums**:
1. User: "I just bought Worlds Live @ Second Sky 2019 by Porter Robinson"
2. Agent tries Spotify search (fails)
3. Agent recognizes "not available on streaming" scenario
4. **Agent uses existing AIBackfillService** to web search for album details
5. Agent prompts user: "I couldn't find this on Spotify. I found it's a live concert recording from Second Sky Festival. Should I add it with these details?"
6. Agent requests custom artwork: "Please upload the album artwork"
7. Agent creates database entry with **AI-researched metadata** + user artwork

#### B) Custom Artwork Request Integration
- **Leverage existing**: Chat interface already supports user interactions
- **Simple enhancement**: Agent can prompt for artwork uploads mid-conversation  
- **File handling**: Existing upload infrastructure ready

### 3. Technical Architecture

#### API Endpoints (Existing)
- `POST /api/albums` - Create new album
- `PATCH /api/albums/[id]` - Update album details  
- `GET /api/albums/[id]` - Fetch album details
- `POST /api/chat` - Agent communication

#### Storage Infrastructure (Ready)
- Supabase storage bucket: `alternate-artworks`
- Public read access for images
- Authenticated upload permissions
- 50MB file size limit, supports JPEG/PNG/WebP/GIF

#### Authentication Context
- Single authenticated user (collection owner)
- All edit interfaces require authentication
- Agent tools use authenticated context

## Implementation Priority

### Phase 1: Manual Interface
1. **Artwork Edit Modal**: Drag-and-drop image upload next to cover art
2. **Details Edit Modal**: Comprehensive form next to album title
3. **UI Integration**: Edit icons with hover states and accessibility

### Phase 2: Agentic Enhancement (Much Simpler!)
1. **Enhanced Add Album Logic**: Modify existing `add-album.tool.ts` to use AIBackfillService when Spotify fails
2. **Artwork Request Flow**: Agent prompts for custom artwork uploads via chat
3. **Testing**: Streaming-unavailable album scenarios

**Key insight**: No new web search tools needed! Just modify existing add-album flow to fallback to AIBackfillService instead of failing.

## Key User Scenarios

### Manual Management
- **Vinyl variant artwork**: User uploads different pressing artwork
- **Metadata correction**: User fixes incorrect Spotify metadata
- **Personal curation**: User adds thoughts and custom vibes

### Agentic Management
- **Streaming-unavailable albums**: "Add Worlds Live @ Second Sky 2019"
- **Vinyl exclusives**: "I got the limited edition colored vinyl of X"
- **Bootlegs/rarities**: Albums not in any streaming catalog

## Success Criteria

1. **Seamless manual editing**: Two-click access to edit any album aspect
2. **Intelligent agent fallbacks**: Agent handles streaming-unavailable scenarios autonomously  
3. **Custom artwork integration**: Both manual and agent-prompted artwork uploads
4. **Maintained data integrity**: All changes preserve existing collection structure

## Technical Notes

- **Database**: Albums table supports duplicates (variants/editions)
- **Storage**: `alternate-artworks` bucket ready for custom images
- **Agent Framework**: OpenAI Agents SDK with existing tool ecosystem
- **Web Search**: Tavily API integration available
- **Authentication**: Single-user system with full permissions

---

*Last Updated: 2025-01-14*
*Current Branch: feat/variants*
*Status: Planning & Analysis Complete - Ready for Implementation*