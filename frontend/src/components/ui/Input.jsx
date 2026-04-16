import React from 'react'

export const Input = ({
  label,
  error = '',
  required = false,
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
      <input
        className={`w-full px-3 py-2.5 rounded-lg border bg-white text-gray-900 text-sm placeholder:text-gray-400 focus:outline-none ${
          error
            ? 'border-red-400 focus:ring-2 focus:ring-red-100 focus:border-red-500'
            : 'border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100'
        } ${className}`}
        {...props}
      />
      {error && <p className="text-red-500 text-xs mt-1.5">{error}</p>}
    </div>
  )
}
