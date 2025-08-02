'use client'

interface ConfirmationModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  isDangerous?: boolean
}

export default function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  isDangerous = false
}: ConfirmationModalProps) {
  if (!isOpen) return null

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  return (
    <div 
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-zinc-900 rounded-xl border border-zinc-800/50 max-w-md w-full p-6 shadow-2xl">
        <h3 className="text-lg font-semibold text-white mb-3">
          {title}
        </h3>
        
        <p className="text-zinc-300 text-sm leading-relaxed mb-6">
          {message}
        </p>
        
        <div className="flex space-x-3 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-zinc-300 hover:text-white bg-zinc-800/50 hover:bg-zinc-700/50 rounded-lg transition-colors duration-200"
          >
            {cancelText}
          </button>
          
          <button
            onClick={onConfirm}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors duration-200 ${
              isDangerous
                ? 'text-white bg-red-600 hover:bg-red-700'
                : 'text-white bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}