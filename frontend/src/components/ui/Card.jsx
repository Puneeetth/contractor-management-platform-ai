import React from 'react'

export const Card = ({ 
  children, 
  className = '',
  header = null,
  footer = null,
  isPadded = true,
}) => {
  return (
    <div className={`
      bg-white rounded-2xl shadow-sm border border-gray-100
      ${className}
    `}>
      {header && (
        <div className="border-b border-gray-100 px-6 py-4">
          {header}
        </div>
      )}
      <div className={isPadded ? 'p-6' : ''}>
        {children}
      </div>
      {footer && (
        <div className="border-t border-gray-100 px-6 py-4">
          {footer}
        </div>
      )}
    </div>
  )
}
