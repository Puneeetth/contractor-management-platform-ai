import React from 'react'

export const Loader = ({ 
  size = 'md',
  fullScreen = false,
  message = 'Loading...',
}) => {
  const sizes = {
    sm: 'h-4 w-4 border-2',
    md: 'h-8 w-8 border-2',
    lg: 'h-12 w-12 border-3',
  }

  const loader = (
    <div className="flex flex-col items-center justify-center gap-3">
      <div className={`
        rounded-full border-indigo-500/20 border-t-indigo-500 animate-spin
        ${sizes[size]}
      `} />
      {message && <p className="text-gray-500 text-sm">{message}</p>}
    </div>
  )

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-gray-100/90 backdrop-blur-sm flex items-center justify-center z-50">
        {loader}
      </div>
    )
  }

  return loader
}
