# Claude Code Implementation Prompts - Vinyl Catalog 2.0

## How to Use These Prompts

Each prompt is designed to be copy-pasted directly into Claude Code as a standalone task. They build sequentially (Day 1 → Day 2 → Day 3) but each prompt contains all necessary context. Run them in order for best results.

---

## Day 1, Task 1: Project Foundation & Data Model

```
ROLE: You are a senior full-stack engineer building a modern vinyl catalog web application.

OBJECTIVE: Set up a new NextJS project with TypeScript, Supabase integration, and design the enhanced data model for a vinyl record collection.

TECHNICAL REQUIREMENTS:
- NextJS 14+ with App Router
- TypeScript with strict mode
- Tailwind CSS for styling
- Supabase client setup
- Environment variable configuration

PROJECT CONTEXT:
Building "Vinyl Catalog 2.0" - transforming a basic grid catalog into an AI-powered music discovery platform. Current data is minimal (title, artist, year). Target is rich metadata for 250+ albums.

TASKS:
1. Initialize new NextJS project with proper structure:
   ```
   /app
     /albums/[id]
     /api
     /components/ui
     /lib
   ```

2. Install and configure dependencies:
   - @supabase/ssr for Supabase integration
   - @types/node for TypeScript
   - Additional packages as needed

3. Create enhanced data model in `/lib/types.ts`:
   ```typescript
   interface Album {
     id: string
     title: string
     artist: string
     year: number
     spotify_id?: string
     genres: string[]
     audio_features?: SpotifyAudioFeatures
     personal_vibes: string[]
     thoughts?: string
     cover_art_url?: string
     streaming_links: {
       spotify?: string
       apple_music?: string
       youtube_music?: string
     }
     tracks?: Track[]
     created_at: string
     updated_at: string
   }
   ```

4. Set up Supabase client in `/lib/supabase.ts` with proper TypeScript types

5. Create database migration SQL for the albums table with proper indexes

SUCCESS CRITERIA:
- Project runs on localhost:3000 without errors
- TypeScript compiles with no warnings
- Supabase connection established
- Database schema ready for data migration

OUTPUT: Confirm project structure, show sample of types.ts, and provide SQL migration script.
```

---

## Day 1, Task 2: Spotify API Integration & Data Migration

```
ROLE: You are building a sophisticated data enrichment pipeline using Spotify Web API.

OBJECTIVE: Create a robust service for fetching album metadata from Spotify and migrating existing vinyl collection data.

TECHNICAL REQUIREMENTS:
- Spotify Web API client with proper authentication
- Rate limiting and error handling
- Batch processing for 250+ albums
- Data validation and quality checks
- TypeScript interfaces for all API responses

CONTEXT: 
Current collection has basic data (title, artist, year). Need to enrich with Spotify metadata: genres, audio features, track lists, cover art, and streaming links.

TASKS:
1. Create Spotify API service in `/lib/spotify.ts`:
   - Client credentials authentication
   - Search albums by artist + title
   - Fetch audio features
   - Get album details and tracks
   - Rate limiting (avoid 429 errors)

2. Build data migration utility in `/lib/migration.ts`:
   - Read existing album data
   - Match albums with Spotify search
   - Enrich with metadata
   - Handle edge cases (not found, multiple matches)
   - Progress tracking and logging

3. Create migration script in `/scripts/migrate-data.ts`:
   - Process albums in batches of 10
   - Write results to Supabase
   - Generate summary report
   - Handle failures gracefully

4. Add data validation functions:
   - Verify required fields
   - Clean and normalize data
   - Flag potential issues

EDGE CASES TO HANDLE:
- Albums not found on Spotify
- Multiple search results
- API rate limits
- Network timeouts
- Malformed data

SUCCESS CRITERIA:
- Successfully processes test batch of 10 albums
- Proper error logging and recovery
- Data quality validation passes
- Migration can resume from interruption

OUTPUT: Show core Spotify service code, migration logic, and run a test migration on 5 sample albums.
```

---

## Day 2, Task 1: Homepage & Core UI Components

```
ROLE: You are a frontend engineer creating an engaging music discovery interface.

OBJECTIVE: Build the new homepage with daily featured albums, recently added section, and core navigation.

DESIGN REQUIREMENTS:
- Modern, music-focused aesthetic
- Mobile-responsive design
- Fast loading with optimized images
- Accessible navigation
- Visual hierarchy that guides discovery

COMPONENT SPECIFICATIONS:

1. Homepage Layout (`/app/page.tsx`):
   - Hero section with daily featured albums (4 albums in rotating banner)
   - "Recently Added" section (2-row by X-column grid)
   - Clean navigation header
   - Footer with minimal links

2. Album Card Component (`/components/AlbumCard.tsx`):
   - Album artwork (optimized images)
   - Title and artist
   - Year and primary genre
   - Hover states with smooth transitions
   - Click navigation to detail page

3. Navigation Header (`/components/Header.tsx`):
   - Site logo/title
   - Search bar (prominent placement)
   - Random shuffle button (dice icon)
   - Responsive mobile menu

4. Featured Banner (`/components/FeaturedBanner.tsx`):
   - Horizontal scroll of 4 featured albums
   - Auto-advance every 24 hours
   - Manual navigation dots
   - Larger format than grid cards

TECHNICAL IMPLEMENTATION:
- Use Next.js Image component for optimization
- Implement proper loading states
- Add skeleton loaders for better UX
- Ensure keyboard navigation works
- Use semantic HTML for accessibility

STYLING APPROACH:
- Dark mode friendly color scheme
- Typography that feels premium
- Subtle animations and transitions
- Grid layouts that adapt to screen size

SUCCESS CRITERIA:
- Homepage loads in under 2 seconds
- Responsive across mobile/tablet/desktop
- Featured albums update daily
- Navigation is intuitive and accessible
- Album cards have engaging hover states

OUTPUT: Show complete homepage implementation with featured banner and responsive grid layout.
```

---

## Day 2, Task 2: Album Detail Pages & Universal Links

```
ROLE: You are implementing rich album detail pages with streaming service integration.

OBJECTIVE: Create comprehensive album detail pages that showcase metadata and provide seamless access to streaming platforms.

PAGE REQUIREMENTS:
- Rich album metadata display
- Universal streaming links
- Personal thoughts/context section
- Track listing with sample previews
- Responsive layout with great typography

TASKS:

1. Album Detail Page (`/app/albums/[id]/page.tsx`):
   - Large album artwork (hero section)
   - Album title, artist, year, genres
   - Audio feature visualizations (energy, danceability, etc.)
   - Personal vibe tags as styled badges
   - Thoughts section (if available)
   - Full track listing

2. Streaming Links Component (`/components/StreamingLinks.tsx`):
   - Prominent buttons for Spotify, Apple Music, YouTube Music
   - Generate universal links based on album metadata
   - Handle cases where links aren't available
   - Copy-to-clipboard functionality
   - Social sharing integration

3. Audio Features Visualization (`/components/AudioFeatures.tsx`):
   - Visual representation of Spotify audio features
   - Radar chart or progress bars
   - Tooltips explaining each metric
   - Responsive design

4. Track List Component (`/components/TrackList.tsx`):
   - Numbered track listing
   - Track duration display
   - Preview button integration (if available)
   - Keyboard navigation support

STREAMING LINK GENERATION:
```typescript
// Example implementation approach
const generateStreamingLinks = (album: Album) => ({
  spotify: `https://open.spotify.com/album/${album.spotify_id}`,
  apple_music: `https://music.apple.com/search?term=${encodeURIComponent(album.artist + ' ' + album.title)}`,
  youtube_music: `https://music.youtube.com/search?q=${encodeURIComponent(album.artist + ' ' + album.title)}`
})
```

DESIGN CONSIDERATIONS:
- Typography hierarchy that's scannable
- Color scheme that complements album artwork
- Generous whitespace for readability
- Mobile-first responsive design

SUCCESS CRITERIA:
- Page loads with all metadata displayed correctly
- Streaming links work across platforms
- Audio features render as interactive visualizations
- Personal thoughts section is prominently featured
- Track listing is easy to scan

OUTPUT: Complete album detail page with streaming integration and visual audio features display.
```

---

## Day 2, Task 3: Enhanced Search Functionality

```
ROLE: You are building sophisticated search functionality for a music catalog.

OBJECTIVE: Implement multi-dimensional search that handles text queries, filtering, and natural language-style searches.

SEARCH REQUIREMENTS:
- Real-time text search across title/artist/genre
- Filter by decade, genre, audio features
- Fast response times (<200ms)
- Mobile-friendly interface
- Search result highlighting

TASKS:

1. Search API Route (`/app/api/search/route.ts`):
   - Full-text search across multiple fields
   - Filter combinations (genre + decade + vibes)
   - Audio feature range queries
   - Fuzzy matching for typos
   - Results ranking by relevance

2. Search Interface (`/components/SearchInterface.tsx`):
   - Prominent search input with autocomplete
   - Filter panel with checkboxes/sliders
   - Real-time results as you type
   - Clear all filters button
   - Search history/suggestions

3. Search Results Component (`/components/SearchResults.tsx`):
   - Grid layout matching homepage style
   - Highlighted search terms
   - Empty state with suggestions
   - Pagination for large result sets
   - Sort options (relevance, year, artist)

4. Advanced Filters (`/components/SearchFilters.tsx`):
   - Genre multi-select
   - Decade slider/checkboxes
   - Audio feature sliders (energy, danceability)
   - Personal vibe tag selection
   - Reset filters functionality

SEARCH ALGORITHM:
```sql
-- Example Supabase search query
SELECT *, 
  ts_rank(
    to_tsvector('english', title || ' ' || artist || ' ' || array_to_string(genres, ' ')),
    plainto_tsquery('english', $1)
  ) as rank
FROM albums 
WHERE 
  to_tsvector('english', title || ' ' || artist || ' ' || array_to_string(genres, ' ')) 
  @@ plainto_tsquery('english', $1)
  AND ($2::text[] IS NULL OR genres && $2::text[])
  AND ($3::int IS NULL OR year >= $3)
  AND ($4::int IS NULL OR year <= $4)
ORDER BY rank DESC;
```

PERFORMANCE OPTIMIZATIONS:
- Database indexes on searchable fields
- Client-side debouncing for API calls
- Caching of popular search results
- Lazy loading of search results

SUCCESS CRITERIA:
- Search responds in under 200ms
- Filters work in combination
- Mobile interface is touch-friendly
- Search highlights relevant terms
- Empty states provide helpful guidance

OUTPUT: Working search interface with real-time results and comprehensive filtering options.
```

---

## Day 3, Task 1: AI Recommendation Engine

```
ROLE: You are implementing an AI-powered recommendation system for a vinyl collection.

OBJECTIVE: Build a chat interface that provides intelligent album recommendations based on user preferences, limited to albums in the personal collection.

AI REQUIREMENTS:
- OpenAI GPT integration for natural language processing
- Recommendation logic using album metadata
- Conversation context management
- Strict validation that recommendations exist in collection
- Graceful handling of edge cases

TASKS:

1. AI Service Layer (`/lib/ai-recommendations.ts`):
   - OpenAI client configuration
   - Prompt engineering for music recommendations
   - Album similarity calculations using Spotify features
   - Context-aware conversation handling
   - Response validation and filtering

2. Chat API Endpoint (`/app/api/chat/route.ts`):
   - Process natural language queries
   - Generate recommendations using AI + metadata
   - Validate all suggestions against collection
   - Stream responses for better UX
   - Error handling for API failures

3. Chat Interface (`/components/ChatInterface.tsx`):
   - Clean conversation UI
   - Streaming message display
   - Suggested conversation starters
   - Album recommendation cards within chat
   - Input validation and loading states

4. Recommendation Logic (`/lib/recommendation-engine.ts`):
   - Audio feature similarity scoring
   - Genre and vibe matching
   - Preference learning from conversation
   - Diversity injection to avoid repetition

PROMPT ENGINEERING STRATEGY:
```typescript
const RECOMMENDATION_PROMPT = `
You are a knowledgeable music curator with access to a personal vinyl collection of ${collectionSize} albums. 

Your job is to recommend albums from this specific collection based on user preferences. You have access to detailed metadata including:
- Audio features (energy, danceability, valence, etc.)
- Genres and personal vibe tags
- User's thoughts and context

RULES:
1. ONLY recommend albums that exist in the provided collection
2. Explain WHY you're recommending each album
3. Consider both musical similarity and emotional context
4. If no good matches exist, suggest the closest alternatives and explain the trade-offs

Collection data: ${JSON.stringify(albums)}
User query: ${userMessage}

Provide 1-3 specific recommendations with reasoning.
`;
```

VALIDATION LAYER:
- Cross-reference all AI suggestions against collection
- Fallback recommendations if AI fails
- Logging for recommendation accuracy tracking

SUCCESS CRITERIA:
- AI responds with relevant recommendations from collection
- Chat interface feels conversational and natural
- All recommendations link properly to album pages
- System handles edge cases gracefully
- Response time under 3 seconds

OUTPUT: Complete chat interface with working AI recommendations that are validated against the collection.
```

---

## Day 3, Task 2: Random Discovery & Daily Features

```
ROLE: You are implementing discovery features that encourage serendipitous music exploration.

OBJECTIVE: Build random album selection and daily featured album rotation systems.

FEATURE REQUIREMENTS:
- True random album selector accessible from navigation
- Daily featured album rotation with persistence
- Weighted randomness to surface lesser-known albums
- Smooth animations and engaging interactions

TASKS:

1. Random Album Service (`/lib/random-selection.ts`):
   - Pure random selection algorithm
   - Weighted randomness (favor less popular albums)
   - Session-based tracking to avoid immediate repeats
   - Integration with user preferences over time

2. Random Button Component (`/components/RandomButton.tsx`):
   - Animated dice/shuffle icon in navigation
   - Loading animation during selection
   - Smooth page transition to selected album
   - Keyboard shortcut support (spacebar)

3. Daily Features System (`/lib/daily-features.ts`):
   - Algorithm for selecting 4 daily featured albums
   - Persistence using date-based keys
   - Rotation at midnight local time
   - Fallback for insufficient data

4. Featured Album Logic (`/lib/featured-algorithm.ts`):
   - Curated selection criteria:
     * Seasonal relevance
     * Genre diversity
     * Personal favorites
     * Recently added content
     * Historical significance

RANDOMNESS STRATEGIES:
```typescript
// Weighted random selection
const selectRandomAlbum = (albums: Album[], previousSelections: string[] = []) => {
  // Filter out recent selections
  const available = albums.filter(album => 
    !previousSelections.includes(album.id)
  );
  
  // Weight by inverse popularity or recency
  const weighted = available.map(album => ({
    ...album,
    weight: calculateWeight(album)
  }));
  
  return weightedRandomSelection(weighted);
};
```

DAILY ROTATION ALGORITHM:
```typescript
// Deterministic daily selection
const getDailyFeatured = (date: string, albums: Album[]) => {
  const seed = hashString(date); // Consistent daily seed
  const rng = seededRandom(seed);
  
  return selectDiverseSet(albums, rng, {
    genreDiversity: true,
    eraSpread: true,
    energyVariation: true,
    count: 4
  });
};
```

ANIMATIONS & INTERACTIONS:
- Smooth transitions between random selections
- Loading states with progress indication
- Success animations when album is selected
- Accessible keyboard navigation

SUCCESS CRITERIA:
- Random button provides genuinely surprising selections
- Daily features update automatically at midnight
- Animations feel smooth and purposeful
- System remembers recent selections to avoid repetition
- Features work consistently across devices

OUTPUT: Working random selection with smooth animations and automated daily featured album rotation.
```

---

## Day 3, Task 3: Performance Optimization & Polish

```
ROLE: You are optimizing a music discovery web application for production deployment.

OBJECTIVE: Implement performance optimizations, caching strategies, and final polish for a professional demo.

OPTIMIZATION TARGETS:
- Page load times under 2 seconds
- Search response times under 200ms
- Smooth 60fps animations
- Optimal image loading and caching
- Accessible and responsive across all devices

TASKS:

1. Image Optimization (`/lib/image-optimization.ts`):
   - Next.js Image component configuration
   - Responsive image sizes for different breakpoints
   - Lazy loading with proper placeholders
   - CDN integration for album artwork
   - WebP format conversion with fallbacks

2. Caching Strategy (`/lib/cache.ts`):
   - API response caching with appropriate TTL
   - Static asset caching headers
   - Browser caching for album metadata
   - Redis integration for server-side caching (if needed)

3. Performance Monitoring (`/lib/performance.ts`):
   - Core Web Vitals tracking
   - Search performance metrics
   - API response time monitoring
   - User interaction timing

4. Final Polish Tasks:
   - Error boundary components for graceful failures
   - Loading skeleton components
   - 404 and error page designs
   - Accessibility audit and improvements
   - Mobile navigation refinements

CACHING IMPLEMENTATION:
```typescript
// API response caching
export const getCachedAlbums = async () => {
  const cacheKey = 'albums:all';
  const cached = await redis.get(cacheKey);
  
  if (cached) {
    return JSON.parse(cached);
  }
  
  const albums = await fetchAlbumsFromDB();
  await redis.setex(cacheKey, 3600, JSON.stringify(albums)); // 1 hour TTL
  
  return albums;
};
```

PERFORMANCE OPTIMIZATIONS:
- Bundle size analysis and code splitting
- Database query optimization with proper indexes
- Preloading critical resources
- Service worker for offline functionality
- Compression and minification

ACCESSIBILITY CHECKLIST:
- [ ] Keyboard navigation works everywhere
- [ ] Screen reader compatibility
- [ ] Proper ARIA labels and roles
- [ ] Color contrast meets WCAG standards
- [ ] Focus indicators are visible
- [ ] Alt text for all images

RESPONSIVE DESIGN VALIDATION:
- [ ] Mobile (320px-768px)
- [ ] Tablet (768px-1024px)
- [ ] Desktop (1024px+)
- [ ] Large screens (1440px+)

SUCCESS CRITERIA:
- Lighthouse score >90 across all metrics
- No accessibility violations
- Smooth performance on mobile devices
- Professional visual polish
- Error states handle gracefully

OUTPUT: Production-ready application with optimized performance, full accessibility compliance, and professional polish.
```

---

## Final Deployment Prompt

```
ROLE: You are preparing a showcase application for production deployment.

OBJECTIVE: Deploy the Vinyl Catalog 2.0 application with proper environment configuration and monitoring.

DEPLOYMENT REQUIREMENTS:
- Vercel deployment with proper environment variables
- Supabase production database configuration
- Custom domain setup (if desired)
- Error monitoring and analytics
- Performance monitoring dashboard

TASKS:

1. Environment Configuration:
   - Production environment variables setup
   - API key security verification
   - Database connection string validation
   - CORS configuration for production

2. Deployment Pipeline:
   - Vercel project configuration
   - Build optimization settings
   - Preview deployments for testing
   - Production deployment verification

3. Monitoring Setup:
   - Error tracking integration
   - Performance monitoring
   - User analytics (privacy-compliant)
   - Uptime monitoring

4. Final Testing:
   - Cross-browser compatibility testing
   - Mobile device testing
   - Load testing with sample data
   - User acceptance testing checklist

SUCCESS CRITERIA:
- Application accessible at production URL
- All features work in production environment
- Performance metrics meet targets
- Error monitoring is active
- Ready for technical demonstration

OUTPUT: Live production URL with confirmation that all systems are operational.
```

---

## Usage Notes

1. **Sequential Execution**: Run these prompts in order, as each builds on previous work
2. **Context Preservation**: Each prompt contains sufficient context to work standalone
3. **Flexibility**: Modify technical requirements based on your specific setup
4. **Validation**: Test each phase before moving to the next
5. **Documentation**: Save outputs from each prompt for debugging and reference

These prompts are optimized for Claude Code's capabilities and follow 2025 best practices for prompt engineering with AI coding assistants.