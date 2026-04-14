import React from 'react'
import { ChevronDown } from 'lucide-react'

export const Select = ({
  label,
  options = [],
  value = '',
  onChange,
  error = '',
  required = false,
  disabled = false,
  placeholder = 'Select an option',
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
      <div className="relative">
        <select
          value={value}
          onChange={onChange}
          disabled={disabled}
          className={`
            w-full px-4 py-2.5 rounded-xl appearance-none
            bg-[#0f1219] border transition-all duration-200 focus:outline-none
            text-slate-100
            ${error 
              ? 'border-red-500/50 focus:border-red-500 focus:ring-1 focus:ring-red-500/30' 
              : 'border-white/[0.08] focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20'
            }
            ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
            ${className}
          `}
          {...props}
        >
          <option value="" className="bg-[#0f1219]">{placeholder}</option>
          {options.map((option) => (
            <option key={option.value} value={option.value} className="bg-[#0f1219]">
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDown className="absolute right-3 top-3 w-5 h-5 text-slate-500 pointer-events-none" />
      </div>
      {error && (
        <p className="text-red-400 text-xs mt-1.5">{error}</p>
      )}
    </div>
  )
}
