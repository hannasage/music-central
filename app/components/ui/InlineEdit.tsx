'use client'

import { useState, useEffect, useRef, KeyboardEvent } from 'react'
import { Check, X, Pencil } from 'lucide-react'

interface InlineEditProps {
  value: string
  onSave: (value: string) => Promise<void>
  onCancel?: () => void
  placeholder?: string
  className?: string
  editClassName?: string
  isEditing?: boolean
  onEditingChange?: (editing: boolean) => void
  showEditIcon?: boolean
  disabled?: boolean
  maxLength?: number
}

export default function InlineEdit({
  value,
  onSave,
  onCancel,
  placeholder = 'Enter value...',
  className = '',
  editClassName = '',
  isEditing: controlledEditing,
  onEditingChange,
  showEditIcon = true,
  disabled = false,
  maxLength
}: InlineEditProps) {
  const [internalEditing, setInternalEditing] = useState(false)
  const [editValue, setEditValue] = useState(value)
  const [isSaving, setIsSaving] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const isEditing = controlledEditing !== undefined ? controlledEditing : internalEditing
  const setIsEditing = onEditingChange || setInternalEditing

  useEffect(() => {
    setEditValue(value)
  }, [value])

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isEditing])

  const handleStartEdit = () => {
    if (disabled) return
    setEditValue(value)
    setIsEditing(true)
  }

  const handleSave = async () => {
    const trimmedValue = editValue.trim()
    
    if (trimmedValue === value) {
      handleCancel()
      return
    }

    setIsSaving(true)
    try {
      await onSave(trimmedValue)
      setIsEditing(false)
    } catch (error) {
      console.error('Failed to save:', error)
      // Keep editing mode open on error
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    setEditValue(value)
    setIsEditing(false)
    onCancel?.()
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleSave()
    } else if (e.key === 'Escape') {
      e.preventDefault()
      handleCancel()
    }
  }

  if (isEditing) {
    return (
      <div className={`flex items-center gap-2 ${editClassName}`}>
        <input
          ref={inputRef}
          type="text"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleSave}
          placeholder={placeholder}
          disabled={isSaving}
          maxLength={maxLength}
          className="bg-zinc-800 border border-zinc-600 rounded px-2 py-1 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent min-w-0 flex-1"
        />
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="p-1 text-green-400 hover:text-green-300 disabled:opacity-50"
          title="Save"
        >
          <Check className="w-4 h-4" />
        </button>
        <button
          onClick={handleCancel}
          disabled={isSaving}
          className="p-1 text-red-400 hover:text-red-300 disabled:opacity-50"
          title="Cancel"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    )
  }

  return (
    <div 
      className={`group inline-flex items-center gap-2 cursor-pointer ${disabled ? 'cursor-not-allowed opacity-50' : ''} ${className}`}
      onClick={handleStartEdit}
    >
      <span className="min-w-0">
        {value || <span className="text-zinc-500 italic">{placeholder}</span>}
      </span>
      {showEditIcon && !disabled && (
        <Pencil className="w-3 h-3 text-zinc-500 opacity-0 group-hover:opacity-100 transition-opacity" />
      )}
    </div>
  )
}