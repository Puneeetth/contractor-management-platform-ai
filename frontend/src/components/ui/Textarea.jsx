import React from 'react'

export const Textarea = ({
  label,
  placeholder = '',
  error = '',
  required = false,
  disabled = false,
  rows = 4,
  className = '',
  ...props
}) => {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <textarea
        placeholder={placeholder}
        disabled={disabled}
        rows={rows}
        className={`
          w-full px-4 py-2.5 rounded-xl resize-none
          bg-white border transition-all duration-200 focus:outline-none
          text-gray-900 placeholder-gray-400
          ${error 
            ? 'border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-100' 
            : 'border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100'
          }
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
          ${className}
        `}
        {...props}
      />
      {error && (
        <p className="text-red-500 text-xs mt-1.5">{error}</p>
      )}
    </div>
  )
}
