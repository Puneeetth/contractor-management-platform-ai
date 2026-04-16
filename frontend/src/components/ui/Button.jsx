import React from 'react'

const baseStyles =
  'inline-flex items-center justify-center rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed'

const sizeStyles = {
  sm: 'h-8 px-3',
  md: 'h-10 px-4',
  lg: 'h-11 px-5',
}

const variantStyles = {
  default: 'bg-indigo-600 hover:bg-indigo-700 text-white',
  primary: 'bg-indigo-600 hover:bg-indigo-700 text-white',
  secondary: 'bg-white hover:bg-gray-100 text-gray-800 border border-gray-300',
  success: 'bg-emerald-600 hover:bg-emerald-700 text-white',
  danger: 'bg-red-600 hover:bg-red-700 text-white',
  ghost: 'bg-transparent hover:bg-gray-100 text-gray-700',
}

export const Button = ({
  children,
  className = '',
  variant = 'default',
  size = 'md',
  isLoading = false,
  type = 'button',
  ...props
}) => {
  const classes = `${baseStyles} ${sizeStyles[size] || sizeStyles.md} ${variantStyles[variant] || variantStyles.default} ${className}`

  return (
    <button type={type} className={classes} disabled={isLoading || props.disabled} {...props}>
      {isLoading ? 'Loading...' : children}
    </button>
  )
}
