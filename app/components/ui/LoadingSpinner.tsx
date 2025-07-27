import React from 'react'

export interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
  color?: 'blue' | 'white' | 'zinc'
}

const sizeMap = {
  sm: 'w-4 h-4',
  md: 'w-6 h-6',
  lg: 'w-8 h-8'
}

const colorMap = {
  blue: 'border-blue-500',
  white: 'border-white',
  zinc: 'border-zinc-400'
}

export function LoadingSpinner({ 
  size = 'md', 
  className = '', 
  color = 'blue' 
}: LoadingSpinnerProps) {
  const sizeClass = sizeMap[size]
  const colorClass = colorMap[color]
  
  return (
    <div 
      className={`${sizeClass} border-2 ${colorClass} border-t-transparent rounded-full animate-spin ${className}`}
      role="status"
      aria-label="Loading"
    />
  )
}

export interface LoadingWithTextProps extends LoadingSpinnerProps {
  text?: string
  textClassName?: string
}

export function LoadingWithText({ 
  text = 'Loading...', 
  textClassName = 'text-zinc-400',
  ...spinnerProps 
}: LoadingWithTextProps) {
  return (
    <div className="flex items-center space-x-3">
      <LoadingSpinner {...spinnerProps} />
      <span className={textClassName}>{text}</span>
    </div>
  )
}