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
  const hasEmptyOption = options.some((option) => String(option.value) === '')

  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <div className="relative">
        <select
          value={value}
          onChange={onChange}
          disabled={disabled}
          className={`
            w-full px-4 py-2.5 rounded-xl appearance-none
            bg-white border transition-all duration-200 focus:outline-none
            text-gray-900
            ${error 
              ? 'border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-100' 
              : 'border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100'
            }
            ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
            ${className}
          `}
          {...props}
        >
          {!hasEmptyOption && (
            <option value="" className="bg-white">{placeholder}</option>
          )}
          {options.map((option) => (
            <option key={option.value} value={option.value} className="bg-white">
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDown className="absolute right-3 top-3 w-5 h-5 text-gray-500 pointer-events-none" />
      </div>
      {error && (
        <p className="text-red-500 text-xs mt-1.5">{error}</p>
      )}
    </div>
  )
}
