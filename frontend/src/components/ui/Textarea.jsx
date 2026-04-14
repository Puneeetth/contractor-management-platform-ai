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
        <label className="block text-sm font-medium text-slate-300 mb-1.5">
          {label}
          {required && <span className="text-red-400 ml-1">*</span>}
        </label>
      )}
      <textarea
        placeholder={placeholder}
        disabled={disabled}
        rows={rows}
        className={`
          w-full px-4 py-2.5 rounded-xl resize-none
          bg-[#0f1219] border transition-all duration-200 focus:outline-none
          text-slate-100 placeholder-slate-500
          ${error 
            ? 'border-red-500/50 focus:border-red-500 focus:ring-1 focus:ring-red-500/30' 
            : 'border-white/[0.08] focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20'
          }
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
          ${className}
        `}
        {...props}
      />
      {error && (
        <p className="text-red-400 text-xs mt-1.5">{error}</p>
      )}
    </div>
  )
}
