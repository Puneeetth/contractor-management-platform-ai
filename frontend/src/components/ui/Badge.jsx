import React from 'react'

export const Badge = ({ 
  children, 
  variant = 'default',
  className = '' 
}) => {
  const variants = {
    default: 'bg-slate-500/20 text-slate-300 border-slate-500/30',
    approved: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    success: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    pending: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    warning: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    rejected: 'bg-red-500/15 text-red-400 border-red-500/30',
    error: 'bg-red-500/15 text-red-400 border-red-500/30',
    info: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
    indigo: 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30',
    draft: 'bg-gray-500/15 text-gray-400 border-gray-500/30',
  }

  return (
    <span className={`
      inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium
      border backdrop-blur-sm
      ${variants[variant] || variants.default}
      ${className}
    `}>
      <span className={`w-1.5 h-1.5 rounded-full ${
        variant === 'approved' || variant === 'success' ? 'bg-emerald-400' :
        variant === 'pending' || variant === 'warning' ? 'bg-amber-400' :
        variant === 'rejected' || variant === 'error' ? 'bg-red-400' :
        variant === 'info' ? 'bg-blue-400' :
        variant === 'indigo' ? 'bg-indigo-400' :
        'bg-slate-400'
      }`} />
      {children}
    </span>
  )
}
