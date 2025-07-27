import React from 'react'

export interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  icon: React.ReactNode
  label?: string
  showLabel?: boolean
}

const variantMap = {
  primary: 'bg-blue-500 hover:bg-blue-400 text-white',
  secondary: 'bg-zinc-700 hover:bg-zinc-600 text-zinc-200',
  ghost: 'text-zinc-400 hover:text-white hover:bg-zinc-800/50',
  danger: 'text-red-400 hover:text-red-300 hover:bg-red-500/10'
}

const sizeMap = {
  sm: 'p-1.5 text-sm',
  md: 'p-2 text-base', 
  lg: 'p-3 text-lg'
}

export function IconButton({
  variant = 'ghost',
  size = 'md',
  icon,
  label,
  showLabel = false,
  className = '',
  children,
  ...props
}: IconButtonProps) {
  const variantClass = variantMap[variant]
  const sizeClass = sizeMap[size]
  
  return (
    <button
      className={`
        inline-flex items-center justify-center space-x-2 
        rounded-lg font-medium transition-colors duration-200
        disabled:opacity-50 disabled:cursor-not-allowed
        ${variantClass} ${sizeClass} ${className}
      `}
      aria-label={label}
      {...props}
    >
      {icon}
      {showLabel && label && <span>{label}</span>}
      {children}
    </button>
  )
}