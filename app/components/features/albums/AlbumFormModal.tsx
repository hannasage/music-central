'use client'

import { useState, useRef, useEffect } from 'react'
import { X, Sparkles } from 'lucide-react'
import { Album, AlbumCreateData } from '@/lib/types'
import ImageUpload from '@/app/components/shared/ImageUpload'
import { Button, Input, Textarea, Toggle } from '@hannasage/projection-ui'

interface AlbumFormModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (albumData: AlbumCreateData) => Promise<void>
  album?: Album // If provided, this is edit mode
  title: string
  submitButtonText: string
  showImageUpload?: boolean
  showAIAssistance?: boolean
}

export default function AlbumFormModal({ 
  isOpen, 
  onClose, 
  onSave, 
  album, 
  title, 
  submitButtonText,
  showImageUpload = false,
  showAIAssistance = false
}: AlbumFormModalProps) {
  const [formData, setFormData] = useState({
    title: album?.title || '',
    artist: album?.artist || '',
    year: album?.year || new Date().getFullYear(),
    genres: album?.genres?.join(', ') || '',
    personal_vibes: album?.personal_vibes?.join(', ') || '',
    thoughts: album?.thoughts || '',
    featured: album?.featured || false,
    descriptors: album?.descriptors || [],
    spotify_link: album?.streaming_links?.spotify || '',
    apple_music_link: album?.streaming_links?.apple_music || '',
    youtube_music_link: album?.streaming_links?.youtube_music || '',
    cover_art_url: album?.cover_art_url || null
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isAIMenuOpen, setIsAIMenuOpen] = useState(false)
  const [isAILoading, setIsAILoading] = useState(false)
  const [aiError, setAIError] = useState<string | null>(null)
  const [aiHelpOptions, setAIHelpOptions] = useState({
    vibes: false,
    genres: false,
    thoughts: false,
    artwork: false
  })
  const aiMenuRef = useRef<HTMLDivElement>(null)

  // Close AI menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (aiMenuRef.current && !aiMenuRef.current.contains(event.target as Node)) {
        setIsAIMenuOpen(false)
      }
    }

    if (isAIMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isAIMenuOpen])

  if (!isOpen) return null

  const handleInputChange = (field: string, value: string | number | boolean | string[]) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setError(null)
    // Clear AI error when user types in title/artist fields
    if ((field === 'title' || field === 'artist') && aiError) {
      setAIError(null)
    }
  }

  const handleImageUploaded = (url: string) => {
    setFormData(prev => ({ ...prev, cover_art_url: url }))
  }

  const handleAIAssistance = () => {
    setIsAIMenuOpen(!isAIMenuOpen)
  }

  const handleAIHelpOptionChange = (option: keyof typeof aiHelpOptions, checked: boolean) => {
    setAIHelpOptions(prev => ({ ...prev, [option]: checked }))
    // Clear AI error when user changes selections
    if (aiError) {
      setAIError(null)
    }
  }

  const handleAIHelp = async () => {
    // Validation
    if (!formData.title.trim()) {
      setAIError('Album title is required for AI assistance')
      return
    }
    if (!formData.artist.trim()) {
      setAIError('Artist name is required for AI assistance')
      return
    }

    const selectedOptions = Object.entries(aiHelpOptions)
      .filter(([, checked]) => checked)
      .map(([option]) => option)
    
    if (selectedOptions.length === 0) {
      setAIError('Please select at least one field for AI assistance')
      return
    }

    setIsAILoading(true)
    setAIError(null)

    try {
      console.log(`🤖 Requesting AI help for: ${selectedOptions.join(', ')}`)
      
      const response = await fetch('/api/ai-assistance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: formData.title.trim(),
          artist: formData.artist.trim(),
          year: formData.year,
          selectedFields: selectedOptions
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'AI assistance failed')
      }

      const { suggestions } = result
      console.log(`✨ AI suggestions received:`, suggestions)

      // Merge AI suggestions into form data
      const updates: Partial<typeof formData> = {}

      if (suggestions.genres && selectedOptions.includes('genres')) {
        // Merge with existing genres, removing duplicates
        const existingGenres = formData.genres ? formData.genres.split(',').map(g => g.trim()).filter(Boolean) : []
        const combinedGenres = [...existingGenres, ...suggestions.genres]
        const uniqueGenres = Array.from(new Set(combinedGenres))
        updates.genres = uniqueGenres.join(', ')
      }

      if (suggestions.vibes && selectedOptions.includes('vibes')) {
        // Replace existing vibes entirely
        updates.personal_vibes = suggestions.vibes.join(', ')
      }

      if (suggestions.thoughts && selectedOptions.includes('thoughts')) {
        // Replace existing thoughts entirely
        updates.thoughts = suggestions.thoughts
      }

      if (suggestions.artwork && selectedOptions.includes('artwork')) {
        // Set artwork URL
        updates.cover_art_url = suggestions.artwork
      }

      // Apply updates to form
      setFormData(prev => ({ ...prev, ...updates }))

      // Show success feedback
      console.log(`🎉 Applied AI suggestions for: ${selectedOptions.join(', ')}`)

      // Close menu and reset selections
      setIsAIMenuOpen(false)
      setAIHelpOptions({ vibes: false, genres: false, thoughts: false, artwork: false })

    } catch (err) {
      console.error('AI assistance error:', err)
      setAIError(err instanceof Error ? err.message : 'Failed to get AI assistance')
    } finally {
      setIsAILoading(false)
    }
  }

  const handleSave = async () => {
    // Validation for required fields
    if (!formData.title.trim()) {
      setError('Album title is required')
      return
    }
    if (!formData.artist.trim()) {
      setError('Artist name is required')
      return
    }
    if (!formData.year || formData.year < 1900 || formData.year > new Date().getFullYear() + 1) {
      setError('Please enter a valid year')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const albumData = {
        title: formData.title.trim(),
        artist: formData.artist.trim(),
        year: Number(formData.year),
        genres: formData.genres ? formData.genres.split(',').map(g => g.trim()).filter(Boolean) : [],
        personal_vibes: formData.personal_vibes ? formData.personal_vibes.split(',').map(v => v.trim()).filter(Boolean) : [],
        thoughts: formData.thoughts.trim() || null,
        featured: formData.featured,
        descriptors: formData.descriptors,
        streaming_links: {
          ...(formData.spotify_link && { spotify: formData.spotify_link }),
          ...(formData.apple_music_link && { apple_music: formData.apple_music_link }),
          ...(formData.youtube_music_link && { youtube_music: formData.youtube_music_link })
        },
        ...(showImageUpload && { cover_art_url: formData.cover_art_url }),
        ...(showImageUpload && { tracks: [], removed: false })
      }

      await onSave(albumData)
    } catch (err) {
      console.error('Save error:', err)
      setError(err instanceof Error ? err.message : 'Failed to save changes')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancel = () => {
    // Reset form to initial values
    setFormData({
      title: album?.title || '',
      artist: album?.artist || '',
      year: album?.year || new Date().getFullYear(),
      genres: album?.genres?.join(', ') || '',
      personal_vibes: album?.personal_vibes?.join(', ') || '',
      thoughts: album?.thoughts || '',
      featured: album?.featured || false,
      descriptors: album?.descriptors || [],
      spotify_link: album?.streaming_links?.spotify || '',
      apple_music_link: album?.streaming_links?.apple_music || '',
      youtube_music_link: album?.streaming_links?.youtube_music || '',
      cover_art_url: album?.cover_art_url || null
    })
    setError(null)
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-zinc-900 rounded-2xl border border-zinc-800 w-full max-w-2xl max-h-[85vh] overflow-hidden my-auto flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-zinc-800">
          <h2 className="text-xl font-semibold text-white">{title}</h2>
          <div className="flex items-center gap-2">
            {showAIAssistance && (
              <div className="relative" ref={aiMenuRef}>
                <Button
                  variant="icon"
                  onClick={handleAIAssistance}
                  disabled={isLoading}
                  title="AI Assistance"
                  style={{ background: 'rgba(147,51,234,0.2)', color: '#c084fc', border: '1px solid rgba(147,51,234,0.4)' }}
                >
                  <Sparkles size={16} />
                </Button>
                
                {isAIMenuOpen && (
                  <div className="absolute top-full right-0 mt-2 bg-zinc-800 border border-zinc-700 rounded-lg shadow-lg p-4 w-48 z-10">
                    <div className="space-y-3">
                      <div className="text-sm font-medium text-zinc-200 mb-2">Get AI help with:</div>
                      
                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={aiHelpOptions.genres}
                          onChange={(e) => handleAIHelpOptionChange('genres', e.target.checked)}
                          disabled={isAILoading}
                          className="w-4 h-4 text-purple-600 bg-zinc-700 border-zinc-600 rounded focus:ring-purple-500 focus:ring-2 disabled:opacity-50"
                        />
                        <span className="text-sm text-zinc-300">Genres</span>
                      </label>
                      
                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={aiHelpOptions.vibes}
                          onChange={(e) => handleAIHelpOptionChange('vibes', e.target.checked)}
                          disabled={isAILoading}
                          className="w-4 h-4 text-purple-600 bg-zinc-700 border-zinc-600 rounded focus:ring-purple-500 focus:ring-2 disabled:opacity-50"
                        />
                        <span className="text-sm text-zinc-300">Vibes</span>
                      </label>
                      
                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={aiHelpOptions.thoughts}
                          onChange={(e) => handleAIHelpOptionChange('thoughts', e.target.checked)}
                          disabled={isAILoading}
                          className="w-4 h-4 text-purple-600 bg-zinc-700 border-zinc-600 rounded focus:ring-purple-500 focus:ring-2 disabled:opacity-50"
                        />
                        <span className="text-sm text-zinc-300">Thoughts</span>
                      </label>
                      
                      {showImageUpload && (
                        <label className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={aiHelpOptions.artwork}
                            onChange={(e) => handleAIHelpOptionChange('artwork', e.target.checked)}
                            disabled={isAILoading}
                            className="w-4 h-4 text-purple-600 bg-zinc-700 border-zinc-600 rounded focus:ring-purple-500 focus:ring-2 disabled:opacity-50"
                          />
                          <span className="text-sm text-zinc-300">Artwork</span>
                        </label>
                      )}
                      
                      {aiError && (
                        <div className="text-xs text-red-400 mt-2 p-2 bg-red-500/10 border border-red-500/20 rounded">
                          {aiError}
                        </div>
                      )}
                      
                      <Button
                        variant="primary"
                        block
                        size="sm"
                        onClick={handleAIHelp}
                        disabled={!Object.values(aiHelpOptions).some(Boolean) || isAILoading}
                        style={{ marginTop: 12, background: 'rgba(147,51,234,0.8)', borderColor: 'rgba(147,51,234,0.8)' }}
                      >
                        {isAILoading ? 'Getting AI help…' : 'Help'}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
            <Button variant="icon" onClick={handleCancel} disabled={isLoading}>
              <X size={18} />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          {/* Basic Info */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-white">Basic Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Title *"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                disabled={isLoading}
                placeholder="Album title"
              />
              <Input
                label="Artist *"
                value={formData.artist}
                onChange={(e) => handleInputChange('artist', e.target.value)}
                disabled={isLoading}
                placeholder="Artist name"
              />
            </div>

            <Input
              label="Year *"
              type="number"
              value={formData.year}
              onChange={(e) => handleInputChange('year', Number(e.target.value))}
              disabled={isLoading}
              min="1900"
              max={new Date().getFullYear() + 1}
            />
          </div>

          {/* Album Artwork - Only show if enabled */}
          {showImageUpload && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-white">Album Artwork</h3>
              <ImageUpload
                onImageUploaded={handleImageUploaded}
                currentImage={formData.cover_art_url || undefined}
                disabled={isLoading}
              />
            </div>
          )}

          {/* Tags */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-white">Tags</h3>
            
            <Input
              label="Genres"
              hint="comma-separated"
              value={formData.genres}
              onChange={(e) => handleInputChange('genres', e.target.value)}
              placeholder="rock, alternative, indie"
              disabled={isLoading}
            />
            <Input
              label="Personal Vibes"
              hint="comma-separated"
              value={formData.personal_vibes}
              onChange={(e) => handleInputChange('personal_vibes', e.target.value)}
              placeholder="energetic, nostalgic, uplifting"
              disabled={isLoading}
            />
          </div>

          {/* Descriptors */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-white">Descriptors</h3>
            <p className="text-sm text-zinc-400">Special edition flags and characteristics</p>
            
            <div className="space-y-3">
              {[
                { value: 'vinyl-exclusive', label: 'Vinyl Exclusive', description: 'Not available on streaming platforms' },
                { value: 'alternate-cover', label: 'Alternate Cover', description: 'Different artwork from standard release' },
                { value: 'bonus-tracks', label: 'Bonus Tracks', description: 'Includes additional unreleased content' }
              ].map((descriptor) => (
                <div key={descriptor.value} className="p-3 bg-zinc-800/30 rounded-lg">
                  <Toggle
                    checked={formData.descriptors.includes(descriptor.value)}
                    onChange={(checked) => {
                      const newDescriptors = checked
                        ? [...formData.descriptors, descriptor.value]
                        : formData.descriptors.filter(d => d !== descriptor.value)
                      handleInputChange('descriptors', newDescriptors)
                    }}
                    label={descriptor.label}
                    hint={descriptor.description}
                    disabled={isLoading}
                    size="sm"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Personal Thoughts */}
          <Textarea
            label="Personal Thoughts"
            value={formData.thoughts}
            onChange={(e) => handleInputChange('thoughts', e.target.value)}
            placeholder="Your thoughts about this album..."
            rows={4}
            disabled={isLoading}
          />

          {/* Streaming Links */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-white">Streaming Links</h3>
            
            <Input
              label="Spotify URL"
              type="url"
              value={formData.spotify_link}
              onChange={(e) => handleInputChange('spotify_link', e.target.value)}
              placeholder="https://open.spotify.com/album/..."
              disabled={isLoading}
            />
            <Input
              label="Apple Music URL"
              type="url"
              value={formData.apple_music_link}
              onChange={(e) => handleInputChange('apple_music_link', e.target.value)}
              placeholder="https://music.apple.com/album/..."
              disabled={isLoading}
            />
            <Input
              label="YouTube Music URL"
              type="url"
              value={formData.youtube_music_link}
              onChange={(e) => handleInputChange('youtube_music_link', e.target.value)}
              placeholder="https://music.youtube.com/playlist?list=..."
              disabled={isLoading}
            />
          </div>

          {/* Featured Toggle */}
          <Toggle
            checked={formData.featured}
            onChange={(checked) => handleInputChange('featured', checked)}
            label="Feature this album in collection showcase"
            disabled={isLoading}
          />

          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-zinc-800 flex-shrink-0">
          <Button variant="ghost" onClick={handleCancel} disabled={isLoading}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSave} disabled={isLoading}>
            {isLoading ? 'Saving…' : submitButtonText}
          </Button>
        </div>
      </div>
    </div>
  )
}