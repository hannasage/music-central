'use client'

import { useState, useCallback } from 'react'
import { Plus, X, Pencil } from 'lucide-react'
import InlineEdit from './ui/InlineEdit'

interface EditableTagListProps {
  tags: string[]
  onUpdate: (newTags: string[]) => Promise<void>
  placeholder?: string
  addPlaceholder?: string
  className?: string
  tagClassName?: string
  type?: 'genres' | 'vibes'
  disabled?: boolean
  maxTags?: number
  maxTagLength?: number
}

export default function EditableTagList({
  tags,
  onUpdate,
  placeholder = 'No tags',
  addPlaceholder = 'Add tag...',
  className = '',
  tagClassName = '',
  type = 'genres',
  disabled = false,
  maxTags = 20,
  maxTagLength = 50
}: EditableTagListProps) {
  const [isAddingNew, setIsAddingNew] = useState(false)
  const [editingIndex, setEditingIndex] = useState<number | null>(null)

  const handleAddTag = useCallback(async (newTag: string) => {
    const trimmedTag = newTag.trim()
    if (!trimmedTag || tags.includes(trimmedTag)) {
      return
    }

    const newTags = [...tags, trimmedTag]
    await onUpdate(newTags)
    setIsAddingNew(false)
  }, [tags, onUpdate])

  const handleUpdateTag = useCallback(async (index: number, updatedTag: string) => {
    const trimmedTag = updatedTag.trim()
    
    if (!trimmedTag) {
      // Remove tag if empty
      const newTags = tags.filter((_, i) => i !== index)
      await onUpdate(newTags)
    } else if (tags.includes(trimmedTag) && tags[index] !== trimmedTag) {
      // Don't allow duplicates
      throw new Error('Tag already exists')
    } else if (tags[index] !== trimmedTag) {
      // Update tag
      const newTags = [...tags]
      newTags[index] = trimmedTag
      await onUpdate(newTags)
    }
    
    setEditingIndex(null)
  }, [tags, onUpdate])

  const handleRemoveTag = useCallback(async (index: number) => {
    const newTags = tags.filter((_, i) => i !== index)
    await onUpdate(newTags)
  }, [tags, onUpdate])

  const getTagStyle = () => {
    const baseStyle = type === 'vibes' 
      ? 'bg-blue-500/20 text-blue-400 border-blue-500/30'
      : 'bg-zinc-800/50 text-zinc-300 border-zinc-700/50'
    
    const editableStyle = !disabled 
      ? 'hover:brightness-110 transition-all duration-200 group'
      : ''
    
    return `${baseStyle} ${editableStyle} ${tagClassName} px-3 py-1 rounded-full text-sm border inline-flex items-center gap-2`
  }

  if (disabled) {
    // Show read-only tags for non-authenticated users
    return (
      <div className={`flex flex-wrap gap-2 ${className}`}>
        {tags.length === 0 ? (
          <span className="text-zinc-500 italic">{placeholder}</span>
        ) : (
          tags.map((tag, index) => (
            <span key={index} className={getTagStyle()}>
              {tag}
            </span>
          ))
        )}
      </div>
    )
  }

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Existing Tags */}
      <div className="flex flex-wrap gap-2">
        {tags.length === 0 && !isAddingNew ? (
          <span className="text-zinc-500 italic">{placeholder}</span>
        ) : (
          tags.map((tag, index) => (
            <div key={index} className={getTagStyle()}>
              {editingIndex === index ? (
                <InlineEdit
                  value={tag}
                  onSave={(newValue) => handleUpdateTag(index, newValue)}
                  onCancel={() => setEditingIndex(null)}
                  placeholder="Enter tag..."
                  isEditing={true}
                  onEditingChange={(editing) => {
                    if (!editing) setEditingIndex(null)
                  }}
                  showEditIcon={false}
                  maxLength={maxTagLength}
                  className="min-w-0"
                  editClassName="min-w-0"
                />
              ) : (
                <>
                  <span 
                    className="cursor-pointer min-w-0 transition-all duration-200"
                    onClick={() => setEditingIndex(index)}
                  >
                    {tag}
                  </span>
                  <div className="flex items-center gap-1 overflow-hidden transition-all duration-200 max-w-0 group-hover:max-w-16 opacity-0 group-hover:opacity-100">
                    <Pencil className="w-3 h-3 flex-shrink-0" />
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleRemoveTag(index)
                      }}
                      className="text-red-400 hover:text-red-300 flex-shrink-0"
                      title="Remove tag"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                </>
              )}
            </div>
          ))
        )}

        {/* Add New Tag Input */}
        {isAddingNew && (
          <div className={`${getTagStyle()} bg-zinc-800/70`}>
            <InlineEdit
              value=""
              onSave={handleAddTag}
              onCancel={() => setIsAddingNew(false)}
              placeholder={addPlaceholder}
              isEditing={true}
              onEditingChange={(editing) => {
                if (!editing) setIsAddingNew(false)
              }}
              showEditIcon={false}
              maxLength={maxTagLength}
              className="min-w-0"
              editClassName="min-w-0"
            />
          </div>
        )}
      </div>

      {/* Add Button */}
      {!isAddingNew && editingIndex === null && tags.length < maxTags && (
        <button
          onClick={() => setIsAddingNew(true)}
          className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm border border-dashed border-zinc-600 text-zinc-400 hover:text-zinc-300 hover:border-zinc-500 transition-colors duration-200"
        >
          <Plus className="w-3 h-3" />
          Add {type === 'vibes' ? 'vibe' : 'genre'}
        </button>
      )}

      {/* Help Text */}
      {(isAddingNew || editingIndex !== null) && (
        <p className="text-xs text-zinc-500">
          Press Enter to save, Escape to cancel. Click × to remove tags.
        </p>
      )}
    </div>
  )
}