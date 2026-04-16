import React from 'react'

export const Card = ({
  children,
  className = '',
  header = null,
  isPadded = true,
}) => {
  return (
    <div className={`bg-white border border-gray-200 rounded-2xl shadow-sm ${className}`}>
      {header && <div className="px-5 py-4 border-b border-gray-200">{header}</div>}
      <div className={isPadded ? 'p-5' : ''}>{children}</div>
    </div>
  )
}
