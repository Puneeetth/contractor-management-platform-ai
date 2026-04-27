import React from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react'
import { cn } from '../../lib/utils'

const STATUS_COLORS = {
  green: {
    dot: 'bg-emerald-500',
    text: 'text-emerald-600',
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
  },
  amber: {
    dot: 'bg-amber-500',
    text: 'text-amber-600',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
  },
  red: {
    dot: 'bg-red-500',
    text: 'text-red-600',
    bg: 'bg-red-50',
    border: 'border-red-200',
  },
  blue: {
    dot: 'bg-blue-500',
    text: 'text-blue-600',
    bg: 'bg-blue-50',
    border: 'border-blue-200',
  },
  neutral: {
    dot: 'bg-gray-400',
    text: 'text-gray-500',
    bg: 'bg-gray-100',
    border: 'border-gray-200',
  },
}

const SkeletonPulse = 'animate-pulse bg-gray-200 rounded'

export const SummaryCardSkeleton = () => (
  <div className="flex min-h-[160px] flex-col justify-between rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
    <div className="flex items-start justify-between">
      <div className={cn(SkeletonPulse, 'h-10 w-10 rounded-lg')} />
      <div className={cn(SkeletonPulse, 'h-5 w-16 rounded-full')} />
    </div>
    <div className="mt-4 space-y-2">
      <div className={cn(SkeletonPulse, 'h-3 w-24')} />
      <div className={cn(SkeletonPulse, 'h-7 w-32')} />
      <div className={cn(SkeletonPulse, 'h-3 w-40')} />
      <div className={cn(SkeletonPulse, 'h-3 w-28')} />
    </div>
  </div>
)

export const SummaryCard = ({
  icon: Icon,
  title,
  value,
  secondaryDescription,
  status = 'neutral',
  statusLabel,
  href,
  isEmpty = false,
  emptyMessage = 'No data available',
  isLoading = false,
  tooltipContent,
  className,
  trend,
  trendDirection,
  dateLabel,
  dateValue,
}) => {
  const navigate = useNavigate()
  const isClickable = !!href
  const statusConfig = STATUS_COLORS[status] || STATUS_COLORS.neutral

  const handleClick = () => {
    if (isClickable && !isLoading) {
      navigate(href)
    }
  }

  const handleKeyDown = (e) => {
    if ((e.key === 'Enter' || e.key === ' ') && isClickable && !isLoading) {
      e.preventDefault()
      navigate(href)
    }
  }

  if (isLoading) {
    return <SummaryCardSkeleton />
  }

  const isEmptyValue = isEmpty || value === 0 || value === '0'

  const TrendIcon = trendDirection === 'up' ? ArrowUpRight : trendDirection === 'down' ? ArrowDownRight : Minus

  return (
    <div
      role={isClickable ? 'button' : undefined}
      tabIndex={isClickable ? 0 : undefined}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      className={cn(
        'group flex min-h-[160px] flex-col justify-between rounded-xl border bg-white p-5 shadow-sm transition-all duration-200',
        statusConfig.border,
        isClickable && 'cursor-pointer hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div className={cn('flex h-10 w-10 items-center justify-center rounded-lg', statusConfig.bg, statusConfig.text)}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="flex items-center gap-1.5" title={tooltipContent}>
          <span className={cn('h-2 w-2 rounded-full', statusConfig.dot)} />
          <span className={cn('text-xs font-medium', statusConfig.text)}>
            {statusLabel || status}
          </span>
        </div>
      </div>

      <div className="mt-4">
        <p className="text-xs font-medium uppercase tracking-wider text-gray-400">{title}</p>
        <p className="mt-1 text-2xl font-bold tracking-tight text-gray-900">
          {isEmptyValue ? (
            <span className="text-lg font-medium text-gray-400">{emptyMessage}</span>
          ) : (
            value
          )}
        </p>

        {trend && (
          <div className={cn(
            'mt-1 flex items-center gap-1 text-xs font-semibold',
            trendDirection === 'up' ? 'text-emerald-600' : trendDirection === 'down' ? 'text-red-600' : 'text-gray-500',
          )}>
            <TrendIcon className="h-3.5 w-3.5" />
            <span>{trend}</span>
          </div>
        )}

        {dateLabel && dateValue && (
          <p className="mt-1 text-xs text-gray-500">
            <span className="font-medium text-gray-600">{dateLabel}:</span> {dateValue}
          </p>
        )}

        {secondaryDescription && !dateLabel && (
          <p className="mt-1 text-xs text-gray-500" title={secondaryDescription}>
            {secondaryDescription}
          </p>
        )}
      </div>
    </div>
  )
}
