import React from 'react'

export const Card = ({
  children,
  className = '',
  header = null,
  isPadded = true,
}) => {
  return (
    <div className={`bg-white border border-gray-200 rounded-2xl shadow-sm ${className}`}>
      {header && <div className="border-b border-gray-200 px-4 py-3">{header}</div>}
      <div className={isPadded ? 'p-4' : ''}>{children}</div>
    </div>
  )
}
