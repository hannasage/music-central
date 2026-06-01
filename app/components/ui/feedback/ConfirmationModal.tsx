'use client'

import { Modal } from '@hannasage/projection-ui'

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
  isDangerous = false,
}: ConfirmationModalProps) {
  return (
    <Modal
      open={isOpen}
      title={title}
      onDismiss={onClose}
      maxWidth={400}
      actions={[
        { label: cancelText, onClick: onClose },
        { label: confirmText, variant: isDangerous ? 'danger' : 'primary', onClick: onConfirm },
      ]}
    >
      {message}
    </Modal>
  )
}
