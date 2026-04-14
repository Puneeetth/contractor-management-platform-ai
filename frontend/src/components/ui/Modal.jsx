import React from 'react'
import { motion } from 'framer-motion'
import { X } from 'lucide-react'

export const Modal = ({
  isOpen,
  onClose,
  title,
  children,
  footer = null,
  size = 'md',
}) => {
  if (!isOpen) return null

  const sizes = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className={`
          bg-white rounded-2xl shadow-lg w-full mx-4
          ${sizes[size]}
        `}
      >
        <div className="flex justify-between items-center p-6 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6">
          {children}
        </div>

        {footer && (
          <div className="border-t border-gray-100 p-6 flex justify-end gap-3">
            {footer}
          </div>
        )}
      </motion.div>
    </motion.div>
  )
}
