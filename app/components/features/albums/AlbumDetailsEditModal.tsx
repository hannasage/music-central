'use client'

import { useState } from 'react'
import { X, Save } from 'lucide-react'
import { Album } from '@/lib/types'

interface AlbumDetailsEditModalProps {
  album: Album
  isOpen: boolean
  onClose: () => void
  onSave: (updatedAlbum: Album) => void
}

export default function AlbumDetailsEditModal({ album, isOpen, onClose, onSave }: AlbumDetailsEditModalProps) {
  const [formData, setFormData] = useState({
    title: album.title,
    artist: album.artist,
    year: album.year,
    genres: album.genres.join(', '),
    personal_vibes: album.personal_vibes.join(', '),
    thoughts: album.thoughts || '',
    featured: album.featured,
    spotify_link: album.streaming_links?.spotify || '',
    apple_music_link: album.streaming_links?.apple_music || '',
    youtube_music_link: album.streaming_links?.youtube_music || ''
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!isOpen) return null

  const handleInputChange = (field: string, value: string | number | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setError(null)
  }

  const handleSave = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const updateData = {
        title: formData.title.trim(),
        artist: formData.artist.trim(),
        year: Number(formData.year),
        genres: formData.genres ? formData.genres.split(',').map(g => g.trim()).filter(Boolean) : [],
        personal_vibes: formData.personal_vibes ? formData.personal_vibes.split(',').map(v => v.trim()).filter(Boolean) : [],
        thoughts: formData.thoughts.trim() || null,
        featured: formData.featured,
        streaming_links: {
          ...(formData.spotify_link && { spotify: formData.spotify_link }),
          ...(formData.apple_music_link && { apple_music: formData.apple_music_link }),
          ...(formData.youtube_music_link && { youtube_music: formData.youtube_music_link })
        }
      }

      const response = await fetch(`/api/albums/${album.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData)
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update album')
      }

      onSave(result.album)
      onClose()
    } catch (err) {
      console.error('Save error:', err)
      setError(err instanceof Error ? err.message : 'Failed to save changes')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancel = () => {
    setFormData({
      title: album.title,
      artist: album.artist,
      year: album.year,
      genres: album.genres.join(', '),
      personal_vibes: album.personal_vibes.join(', '),
      thoughts: album.thoughts || '',
      featured: album.featured,
      spotify_link: album.streaming_links?.spotify || '',
      apple_music_link: album.streaming_links?.apple_music || '',
      youtube_music_link: album.streaming_links?.youtube_music || ''
    })
    setError(null)
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-zinc-900 rounded-2xl border border-zinc-800 w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-zinc-800">
          <h2 className="text-xl font-semibold text-white">Edit Album Details</h2>
          <button
            onClick={handleCancel}
            className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
            disabled={isLoading}
          >
            <X className="w-5 h-5 text-zinc-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {/* Basic Info */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-white">Basic Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  Title
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={isLoading}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  Artist
                </label>
                <input
                  type="text"
                  value={formData.artist}
                  onChange={(e) => handleInputChange('artist', e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={isLoading}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">
                Year
              </label>
              <input
                type="number"
                value={formData.year}
                onChange={(e) => handleInputChange('year', Number(e.target.value))}
                className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isLoading}
              />
            </div>
          </div>

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
        <div className="flex items-center justify-end gap-3 p-6 border-t border-zinc-800">
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
            {isLoading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  )
}