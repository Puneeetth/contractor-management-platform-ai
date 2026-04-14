import React from 'react'

export const Loader = ({ 
  size = 'md',
  fullScreen = false,
  message = 'Loading...',
}) => {
  const sizes = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
  }

  const loader = (
    <div className="flex flex-col items-center justify-center gap-3">
      <div className={`
        rounded-full border-4 border-gray-200 border-t-indigo-600 animate-spin
        ${sizes[size]}
      `} />
      {message && <p className="text-gray-600 text-sm">{message}</p>}
    </div>
  )

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-white/80 flex items-center justify-center z-50">
        {loader}
      </div>
    )
  }

  return loader
}
