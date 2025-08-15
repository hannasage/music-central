'use client'

import { useState, useRef, useEffect } from 'react'
import Image from 'next/image'
import { Upload, X, Check } from 'lucide-react'

interface ImageUploadProps {
  onImageUploaded: (url: string) => void
  currentImage?: string
  className?: string
  disabled?: boolean
}

export default function ImageUpload({ 
  onImageUploaded, 
  currentImage, 
  className = '',
  disabled = false 
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentImage || null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Update preview when currentImage prop changes (e.g., from AI assistance)
  useEffect(() => {
    setPreviewUrl(currentImage || null)
  }, [currentImage])

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    handleFileUpload(file)
  }

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    const file = event.dataTransfer.files[0]
    if (file && !disabled) {
      handleFileUpload(file)
    }
  }

  const handleFileUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file')
      return
    }

    if (file.size > 50 * 1024 * 1024) {
      setError('File size must be less than 50MB')
      return
    }

    setError(null)
    setSuccess(false)
    
    // Create preview
    const objectUrl = URL.createObjectURL(file)
    setPreviewUrl(objectUrl)

    // Upload file
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/upload-image', {
        method: 'POST',
        body: formData,
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Upload failed')
      }

      onImageUploaded(result.url)
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err) {
      console.error('Upload error:', err)
      setError(err instanceof Error ? err.message : 'Failed to upload image')
      setPreviewUrl(currentImage || null)
    } finally {
      setUploading(false)
      URL.revokeObjectURL(objectUrl)
    }
  }

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
  }

  const clearImage = () => {
    setPreviewUrl(null)
    setError(null)
    setSuccess(false)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className={`space-y-2 ${className}`}>
      <div
        className={`
          relative border-2 border-dashed rounded-lg p-6 transition-colors
          ${disabled ? 'bg-gray-50 border-gray-200 cursor-not-allowed' : 'border-gray-300 hover:border-gray-400 cursor-pointer'}
          ${error ? 'border-red-300 bg-red-50' : ''}
          ${success ? 'border-green-300 bg-green-50' : ''}
        `}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onClick={() => !disabled && fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
          disabled={disabled}
        />

        {previewUrl ? (
          <div className="relative flex justify-center">
            <div className="relative max-w-full max-h-48">
              <Image
                src={previewUrl}
                alt="Preview"
                width={400}
                height={400}
                className="max-w-full max-h-48 rounded object-contain"
                style={{ width: 'auto', height: 'auto' }}
              />
            </div>
            {!disabled && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  clearImage()
                }}
                className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
              >
                <X size={16} />
              </button>
            )}
          </div>
        ) : (
          <div className="text-center">
            {uploading ? (
              <div className="space-y-2">
                <div className="animate-spin h-8 w-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
                <p className="text-sm text-gray-600">Uploading...</p>
              </div>
            ) : success ? (
              <div className="space-y-2">
                <Check className="h-8 w-8 text-green-500 mx-auto" />
                <p className="text-sm text-green-600">Uploaded successfully!</p>
              </div>
            ) : (
              <div className="space-y-2">
                <Upload className="h-8 w-8 text-gray-400 mx-auto" />
                <p className="text-sm text-gray-600">
                  Drop an image here or click to select
                </p>
                <p className="text-xs text-gray-500">
                  Supports JPEG, PNG, WebP, GIF (max 50MB)
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
    </div>
  )
}