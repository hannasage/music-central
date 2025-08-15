'use client'

import { useState, useRef, useEffect } from 'react'
import { X, Save, Sparkles } from 'lucide-react'
import { Album } from '@/lib/types'
import ImageUpload from '@/app/components/shared/ImageUpload'

interface AlbumFormModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (albumData: any) => Promise<void>
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
  const [aiHelpOptions, setAIHelpOptions] = useState({
    vibes: false,
    genres: false,
    thoughts: false
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
  }

  const handleImageUploaded = (url: string) => {
    setFormData(prev => ({ ...prev, cover_art_url: url }))
  }

  const handleAIAssistance = () => {
    setIsAIMenuOpen(!isAIMenuOpen)
  }

  const handleAIHelpOptionChange = (option: keyof typeof aiHelpOptions, checked: boolean) => {
    setAIHelpOptions(prev => ({ ...prev, [option]: checked }))
  }

  const handleAIHelp = () => {
    // TODO: Implement AI assistance functionality
    const selectedOptions = Object.entries(aiHelpOptions)
      .filter(([_, checked]) => checked)
      .map(([option, _]) => option)
    
    console.log('AI help requested for:', selectedOptions)
    console.log('Current form data:', { title: formData.title, artist: formData.artist })
    
    // Close menu after submitting
    setIsAIMenuOpen(false)
    // Reset selections
    setAIHelpOptions({ vibes: false, genres: false, thoughts: false })
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
                <button
                  onClick={handleAIAssistance}
                  className="p-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
                  disabled={isLoading}
                  title="AI Assistance"
                >
                  <Sparkles className="w-4 h-4" />
                </button>
                
                {isAIMenuOpen && (
                  <div className="absolute top-full right-0 mt-2 bg-zinc-800 border border-zinc-700 rounded-lg shadow-lg p-4 w-48 z-10">
                    <div className="space-y-3">
                      <div className="text-sm font-medium text-zinc-200 mb-2">Get AI help with:</div>
                      
                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={aiHelpOptions.genres}
                          onChange={(e) => handleAIHelpOptionChange('genres', e.target.checked)}
                          className="w-4 h-4 text-purple-600 bg-zinc-700 border-zinc-600 rounded focus:ring-purple-500 focus:ring-2"
                        />
                        <span className="text-sm text-zinc-300">Genres</span>
                      </label>
                      
                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={aiHelpOptions.vibes}
                          onChange={(e) => handleAIHelpOptionChange('vibes', e.target.checked)}
                          className="w-4 h-4 text-purple-600 bg-zinc-700 border-zinc-600 rounded focus:ring-purple-500 focus:ring-2"
                        />
                        <span className="text-sm text-zinc-300">Vibes</span>
                      </label>
                      
                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={aiHelpOptions.thoughts}
                          onChange={(e) => handleAIHelpOptionChange('thoughts', e.target.checked)}
                          className="w-4 h-4 text-purple-600 bg-zinc-700 border-zinc-600 rounded focus:ring-purple-500 focus:ring-2"
                        />
                        <span className="text-sm text-zinc-300">Thoughts</span>
                      </label>
                      
                      <button
                        onClick={handleAIHelp}
                        disabled={!Object.values(aiHelpOptions).some(Boolean)}
                        className="w-full text-left text-sm text-purple-400 hover:text-purple-300 disabled:text-zinc-500 disabled:cursor-not-allowed mt-3 pt-2 border-t border-zinc-700"
                      >
                        Help
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
            <button
              onClick={handleCancel}
              className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
              disabled={isLoading}
            >
              <X className="w-5 h-5 text-zinc-400" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          {/* Basic Info */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-white">Basic Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={isLoading}
                  placeholder="Album title"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  Artist *
                </label>
                <input
                  type="text"
                  value={formData.artist}
                  onChange={(e) => handleInputChange('artist', e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={isLoading}
                  placeholder="Artist name"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">
                Year *
              </label>
              <input
                type="number"
                value={formData.year}
                onChange={(e) => handleInputChange('year', Number(e.target.value))}
                className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isLoading}
                min="1900"
                max={new Date().getFullYear() + 1}
              />
            </div>
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
            
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">
                Genres (comma-separated)
              </label>
              <input
                type="text"
                value={formData.genres}
                onChange={(e) => handleInputChange('genres', e.target.value)}
                placeholder="rock, alternative, indie"
                className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isLoading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">
                Personal Vibes (comma-separated)
              </label>
              <input
                type="text"
                value={formData.personal_vibes}
                onChange={(e) => handleInputChange('personal_vibes', e.target.value)}
                placeholder="energetic, nostalgic, uplifting"
                className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isLoading}
              />
            </div>
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
                <label key={descriptor.value} className="flex items-start space-x-3 p-3 bg-zinc-800/50 rounded-lg hover:bg-zinc-800/70 transition-colors">
                  <input
                    type="checkbox"
                    checked={formData.descriptors.includes(descriptor.value)}
                    onChange={(e) => {
                      const newDescriptors = e.target.checked
                        ? [...formData.descriptors, descriptor.value]
                        : formData.descriptors.filter(d => d !== descriptor.value)
                      handleInputChange('descriptors', newDescriptors)
                    }}
                    className="w-4 h-4 text-blue-600 bg-zinc-700 border-zinc-600 rounded focus:ring-blue-500 focus:ring-2 mt-0.5"
                    disabled={isLoading}
                  />
                  <div className="flex-1">
                    <span className="text-sm font-medium text-zinc-200">{descriptor.label}</span>
                    <p className="text-xs text-zinc-400 mt-1">{descriptor.description}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Personal Thoughts */}
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              Personal Thoughts
            </label>
            <textarea
              value={formData.thoughts}
              onChange={(e) => handleInputChange('thoughts', e.target.value)}
              placeholder="Your thoughts about this album..."
              rows={4}
              className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              disabled={isLoading}
            />
          </div>

          {/* Streaming Links */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-white">Streaming Links</h3>
            
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">
                Spotify URL
              </label>
              <input
                type="url"
                value={formData.spotify_link}
                onChange={(e) => handleInputChange('spotify_link', e.target.value)}
                placeholder="https://open.spotify.com/album/..."
                className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isLoading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">
                Apple Music URL
              </label>
              <input
                type="url"
                value={formData.apple_music_link}
                onChange={(e) => handleInputChange('apple_music_link', e.target.value)}
                placeholder="https://music.apple.com/album/..."
                className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isLoading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">
                YouTube Music URL
              </label>
              <input
                type="url"
                value={formData.youtube_music_link}
                onChange={(e) => handleInputChange('youtube_music_link', e.target.value)}
                placeholder="https://music.youtube.com/playlist?list=..."
                className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isLoading}
              />
            </div>
          </div>

          {/* Featured Toggle */}
          <div>
            <label className="flex items-center space-x-3">
              <input
                type="checkbox"
                checked={formData.featured}
                onChange={(e) => handleInputChange('featured', e.target.checked)}
                className="w-4 h-4 text-blue-600 bg-zinc-800 border-zinc-600 rounded focus:ring-blue-500 focus:ring-2"
                disabled={isLoading}
              />
              <span className="text-sm font-medium text-zinc-300">Feature this album in collection showcase</span>
            </label>
          </div>

          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-zinc-800 flex-shrink-0">
          <button
            onClick={handleCancel}
            className="px-4 py-2 text-zinc-400 hover:text-white transition-colors"
            disabled={isLoading}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 text-white rounded-lg transition-colors"
          >
            {isLoading ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            {isLoading ? 'Saving...' : submitButtonText}
          </button>
        </div>
      </div>
    </div>
  )
}