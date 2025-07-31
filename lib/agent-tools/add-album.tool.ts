import { tool } from '@openai/agents'
import { z } from 'zod'
import { ToolContext } from './types'

/**
 * Add Album Tool - Create new album in collection using Spotify and AI services
 * Takes album name and artist name, enriches with metadata, and adds to database
 */
export const createAddAlbumTool = (context: ToolContext) => {
  return tool({
    name: 'add_album',
    description: 'Add a new album to the collection by searching Spotify and enriching with AI-generated metadata',
    parameters: z.object({
      albumName: z.string().describe('The name/title of the album to add'),
      artistName: z.string().describe('The name of the artist/band who created the album')
    }),
    execute: async (input) => {
      try {
        // Input validation
        if (!input.albumName.trim()) {
          return 'Error: Album name cannot be empty'
        }

        if (!input.artistName.trim()) {
          return 'Error: Artist name cannot be empty'
        }

        const albumName = input.albumName.trim()
        const artistName = input.artistName.trim()

        console.log(`🎵 Adding album: "${albumName}" by ${artistName}`)

        // Step 1: Search for multiple album matches on Spotify
        const { spotify } = await import('@/lib/spotify')
        
        let albumMatches = []
        try {
          albumMatches = await spotify.findAlbumMatches(artistName, albumName, 5)
          
          if (albumMatches.length === 0) {
            return `❌ Could not find "${albumName}" by ${artistName} on Spotify. Please verify the album name and artist name are correct.`
          }

          console.log(`🔍 Found ${albumMatches.length} potential matches for "${albumName}" by ${artistName}`)
        } catch (error) {
          console.error('Spotify search error:', error)
          return `❌ Error searching Spotify for "${albumName}" by ${artistName}. Please try again or check your input.`
        }

        // Step 2: Check which albums already exist in the collection
        const existingAlbums = new Set()
        for (const match of albumMatches) {
          try {
            const { data: existing } = await context.supabase
              .from('albums')
              .select('spotify_id, title, artist')
              .eq('spotify_id', match.album.id)
              .single()
            
            if (existing) {
              existingAlbums.add(match.album.id)
              console.log(`⚠️ Album "${match.album.name}" already exists in collection`)
            }
          } catch {
            // Album doesn't exist, which is good
          }
        }

        // Filter out albums that already exist
        const availableMatches = albumMatches.filter(match => !existingAlbums.has(match.album.id))
        
        if (availableMatches.length === 0) {
          const existingNames = albumMatches.map(m => `"${m.album.name}" (${new Date(m.album.release_date).getFullYear()})`).join(', ')
          return `❌ All matching albums already exist in your collection: ${existingNames}. Please try a different album or be more specific with the title.`
        }

        // Use the best available match (highest score that doesn't already exist)
        const selectedMatch = availableMatches[0]
        const spotifyAlbum = selectedMatch.album
        
        console.log(`✅ Selected: "${spotifyAlbum.name}" by ${spotifyAlbum.artists[0]?.name} (${selectedMatch.reason})`)
        
        // If there are other good alternatives, mention them
        if (availableMatches.length > 1) {
          const alternatives = availableMatches.slice(1, 3).map(m => 
            `"${m.album.name}" (${new Date(m.album.release_date).getFullYear()})`
          ).join(', ')
          console.log(`📝 Other alternatives found: ${alternatives}`)
        }

        // Step 3: Get detailed album information from Spotify
        let detailedAlbum = null
        try {
          detailedAlbum = await spotify.getAlbumWithDetails(spotifyAlbum.id)
          console.log(`📝 Retrieved detailed album information with ${detailedAlbum.tracks?.items?.length || 0} tracks`)
        } catch (error) {
          console.error('Error getting album details:', error)
          // Continue with basic album info if details fail
          detailedAlbum = spotifyAlbum
        }

        // Step 4: Prepare basic album data
        const releaseYear = new Date(detailedAlbum.release_date).getFullYear()
        const coverArtUrl = detailedAlbum.images?.[0]?.url || undefined
        const spotifyGenres = detailedAlbum.genres || []
        
        // Convert Spotify tracks to our format
        const tracks = detailedAlbum.tracks?.items?.map((track: {
          id: string
          name: string
          track_number: number
          duration_ms: number
          preview_url?: string
        }) => ({
          id: track.id,
          name: track.name,
          track_number: track.track_number,
          duration_ms: track.duration_ms,
          preview_url: track.preview_url,
          spotify_id: track.id
        })) || []

        const streamingLinks = {
          spotify: detailedAlbum.external_urls?.spotify || ''
        }

        // Create preliminary album object for AI enhancement
        const preliminaryAlbum = {
          id: '', // Will be generated by database
          title: detailedAlbum.name,
          artist: detailedAlbum.artists[0]?.name || artistName,
          year: releaseYear,
          genres: spotifyGenres,
          personal_vibes: [],
          thoughts: '',
          cover_art_url: coverArtUrl,
          streaming_links: streamingLinks,
          tracks,
          featured: false,
          created_at: '',
          updated_at: ''
        }

        // Step 5: Generate AI-enhanced metadata
        let aiSuggestions = null
        try {
          const { AIBackfillService } = await import('@/lib/ai-backfill-service')
          const aiService = new AIBackfillService()
          
          console.log(`🤖 Generating AI-enhanced metadata...`)
          aiSuggestions = await aiService.generateSuggestions(preliminaryAlbum)
          console.log(`✨ Generated ${aiSuggestions.genres.length} genres, ${aiSuggestions.personalVibes.length} vibes, and thoughts`)
        } catch (error) {
          console.error('AI enhancement error:', error)
          // Continue without AI enhancement if it fails
          aiSuggestions = {
            genres: spotifyGenres.length ? spotifyGenres : ['Alternative Rock'],
            personalVibes: ['energetic', 'melodic'],
            thoughts: `A great album by ${artistName} from ${releaseYear}.`,
            confidence: 0.3,
            sources: ['Fallback']
          }
        }

        // Step 6: Create the final album data
        const finalAlbumData = {
          title: detailedAlbum.name,
          artist: detailedAlbum.artists[0]?.name || artistName,
          year: releaseYear,
          spotify_id: detailedAlbum.id,
          genres: aiSuggestions.genres,
          personal_vibes: aiSuggestions.personalVibes,
          thoughts: aiSuggestions.thoughts,
          cover_art_url: coverArtUrl || null,
          streaming_links: streamingLinks,
          tracks: tracks
        }

        // Step 7: Create album via API
        const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
        const response = await fetch(`${siteUrl}/api/albums`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Cookie': context.cookieStore.getAll().map(cookie => `${cookie.name}=${cookie.value}`).join('; ')
          },
          body: JSON.stringify(finalAlbumData)
        })

        if (!response.ok) {
          const error = await response.json()
          
          if (response.status === 409) {
            return `❌ Album "${albumName}" by ${artistName} already exists in your collection.`
          }
          
          return `❌ Failed to add album: ${error.error || 'Unknown error occurred'}`
        }

        const result = await response.json()
        const createdAlbum = result.album

        // Step 8: Return success message with details
        const genreList = aiSuggestions.genres.join(', ')
        const vibeList = aiSuggestions.personalVibes.join(', ')
        
        let successMessage = `🎉 Successfully added "${createdAlbum.title}" by ${createdAlbum.artist} (${createdAlbum.year}) to your collection!

📋 Details:
• Genres: ${genreList}
• Vibes: ${vibeList}
• Tracks: ${tracks.length} tracks
• Cover Art: ${coverArtUrl ? '✅ Available' : '❌ Not available'}
• Spotify Link: ${streamingLinks.spotify ? '✅ Available' : '❌ Not available'}

💭 AI Thoughts: ${aiSuggestions.thoughts}

Database ID: ${createdAlbum.id}`

        // Add information about alternatives if there were multiple matches
        if (availableMatches.length > 1) {
          const alternatives = availableMatches.slice(1, 3).map(m => 
            `• "${m.album.name}" (${new Date(m.album.release_date).getFullYear()}) - ${m.reason}`
          ).join('\n')
          
          successMessage += `\n\n🔄 Other matches were found but not selected:\n${alternatives}\n\nIf you wanted a different album, please be more specific with the title.`
        }

        // Add information about any albums that were skipped due to already existing
        if (existingAlbums.size > 0) {
          const skippedNames = albumMatches
            .filter(m => existingAlbums.has(m.album.id))
            .map(m => `"${m.album.name}" (${new Date(m.album.release_date).getFullYear()})`)
            .join(', ')
          
          successMessage += `\n\n⚠️ Note: ${skippedNames} ${existingAlbums.size === 1 ? 'was' : 'were'} already in your collection.`
        }

        return successMessage

      } catch (error) {
        console.error('Add album tool error:', error)
        return `❌ Error adding album "${input.albumName}" by ${input.artistName}: ${error instanceof Error ? error.message : 'Unknown error occurred'}`
      }
    }
  })
}

// Factory function to create tool with context
export const addAlbumTool = (context: ToolContext) => createAddAlbumTool(context)