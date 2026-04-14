import React from 'react'

export const Card = ({ 
  children, 
  className = '',
  header = null,
  footer = null,
  isPadded = true,
  noBorder = false,
}) => {
  return (
    <div className={`
      bg-[#1a1f2e] rounded-2xl transition-all duration-300
      ${noBorder ? '' : 'border border-white/[0.06]'}
      hover:border-white/[0.1]
      ${className}
    `}>
      {header && (
        <div className="border-b border-white/[0.06] px-6 py-4">
          {header}
        </div>
      )}
      <div className={isPadded ? 'p-6' : ''}>
        {children}
      </div>
      {footer && (
        <div className="border-t border-white/[0.06] px-6 py-4">
          {footer}
        </div>
      )}
    </div>
  )
}
