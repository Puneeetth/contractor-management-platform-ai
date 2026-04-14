import React from 'react'

export const Input = ({
  label,
  type = 'text',
  placeholder = '',
  error = '',
  required = false,
  disabled = false,
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
      <input
        type={type}
        placeholder={placeholder}
        disabled={disabled}
        className={`
          w-full px-4 py-2.5 rounded-xl
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
