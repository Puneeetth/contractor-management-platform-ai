import React from 'react'

export const Badge = ({ 
  children, 
  variant = 'default',
  className = '' 
}) => {
  const variants = {
    default: 'bg-gray-100 text-gray-700 border-gray-200',
    approved: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    pending: 'bg-amber-50 text-amber-700 border-amber-200',
    warning: 'bg-amber-50 text-amber-700 border-amber-200',
    rejected: 'bg-red-50 text-red-700 border-red-200',
    error: 'bg-red-50 text-red-700 border-red-200',
    info: 'bg-blue-50 text-blue-700 border-blue-200',
    indigo: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    draft: 'bg-gray-100 text-gray-600 border-gray-200',
  }

  return (
    <span className={`
      inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium
      border
      ${variants[variant] || variants.default}
      ${className}
    `}>
      <span className={`w-1.5 h-1.5 rounded-full ${
        variant === 'approved' || variant === 'success' ? 'bg-emerald-500' :
        variant === 'pending' || variant === 'warning' ? 'bg-amber-500' :
        variant === 'rejected' || variant === 'error' ? 'bg-red-500' :
        variant === 'info' ? 'bg-blue-500' :
        variant === 'indigo' ? 'bg-indigo-500' :
        'bg-gray-500'
      }`} />
      {children}
    </span>
  )
}
