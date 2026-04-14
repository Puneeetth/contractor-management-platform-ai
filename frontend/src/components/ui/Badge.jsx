import React from 'react'

export const Badge = ({ 
  children, 
  variant = 'default',
  className = '' 
}) => {
  const variants = {
    default: 'bg-gray-100 text-gray-800',
    approved: 'bg-green-100 text-green-800',
    success: 'bg-green-100 text-green-800',
    pending: 'bg-yellow-100 text-yellow-800',
    warning: 'bg-yellow-100 text-yellow-800',
    rejected: 'bg-red-100 text-red-800',
    error: 'bg-red-100 text-red-800',
    info: 'bg-blue-100 text-blue-800',
    indigo: 'bg-indigo-100 text-indigo-800',
  }

  return (
    <span className={`
      inline-block px-3 py-1 rounded-full text-xs font-medium
      ${variants[variant] || variants.default}
      ${className}
    `}>
      {children}
    </span>
  )
}
