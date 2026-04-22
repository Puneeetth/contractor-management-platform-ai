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
  titleClassName = 'text-lg font-semibold text-gray-900',
}) => {
  if (!isOpen) return null

  const sizes = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
     xxl: 'w-[95vw] max-w-none'
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      className="fixed inset-0 bg-gray-900/35 backdrop-blur-sm flex items-center justify-center z-50"
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 10 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 10 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        onClick={(e) => e.stopPropagation()}
        className={`
          bg-white rounded-2xl shadow-xl w-full mx-4
          border border-gray-200
          ${size === 'xxl' ? 'h-[95vh]' : 'max-h-[85vh]'} flex flex-col
          ${sizes[size]}
        `}
      >
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h2 className={titleClassName}>{title}</h2>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          {children}
        </div>

        {footer && (
          <div className="border-t border-gray-200 p-6 flex justify-end gap-3">
            {footer}
          </div>
        )}
      </motion.div>
    </motion.div>
  )
}
