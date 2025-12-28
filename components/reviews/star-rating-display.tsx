'use client'

import { Star, StarHalf } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StarRatingDisplayProps {
  rating: number
  size?: 'xs' | 'sm' | 'md' | 'lg'
  showValue?: boolean
  className?: string
}

export function StarRatingDisplay({
  rating,
  size = 'sm',
  showValue = false,
  className
}: StarRatingDisplayProps) {
  const sizeClasses = {
    xs: 'w-3 h-3',
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  }

  const textSizes = {
    xs: 'text-xs',
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg'
  }

  // Clamp rating between 0 and 5
  const clampedRating = Math.max(0, Math.min(5, rating))
  const fullStars = Math.floor(clampedRating)
  const hasHalfStar = clampedRating - fullStars >= 0.5
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0)

  return (
    <div className={cn('flex items-center gap-0.5', className)}>
      {/* Full stars */}
      {Array.from({ length: fullStars }).map((_, i) => (
        <Star
          key={`full-${i}`}
          className={cn(sizeClasses[size], 'fill-yellow-400 text-yellow-400')}
        />
      ))}

      {/* Half star */}
      {hasHalfStar && (
        <div className="relative">
          <Star
            className={cn(
              sizeClasses[size],
              'fill-transparent text-gray-300 dark:text-gray-600'
            )}
          />
          <div className="absolute inset-0 overflow-hidden" style={{ width: '50%' }}>
            <Star
              className={cn(sizeClasses[size], 'fill-yellow-400 text-yellow-400')}
            />
          </div>
        </div>
      )}

      {/* Empty stars */}
      {Array.from({ length: emptyStars }).map((_, i) => (
        <Star
          key={`empty-${i}`}
          className={cn(
            sizeClasses[size],
            'fill-transparent text-gray-300 dark:text-gray-600'
          )}
        />
      ))}

      {/* Rating value */}
      {showValue && (
        <span className={cn('ml-1.5 font-medium text-gray-700 dark:text-gray-300', textSizes[size])}>
          {clampedRating.toFixed(1)}
        </span>
      )}
    </div>
  )
}
