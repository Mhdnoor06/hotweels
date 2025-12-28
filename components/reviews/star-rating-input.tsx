'use client'

import { useState } from 'react'
import { Star } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StarRatingInputProps {
  value: number
  onChange: (rating: number) => void
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean
}

export function StarRatingInput({
  value,
  onChange,
  size = 'md',
  disabled = false
}: StarRatingInputProps) {
  const [hoverValue, setHoverValue] = useState(0)

  const sizeClasses = {
    sm: 'w-5 h-5',
    md: 'w-7 h-7',
    lg: 'w-9 h-9'
  }

  const handleClick = (rating: number) => {
    if (!disabled) {
      onChange(rating)
    }
  }

  const handleMouseEnter = (rating: number) => {
    if (!disabled) {
      setHoverValue(rating)
    }
  }

  const handleMouseLeave = () => {
    setHoverValue(0)
  }

  return (
    <div className="flex gap-1" onMouseLeave={handleMouseLeave}>
      {[1, 2, 3, 4, 5].map((rating) => {
        const isFilled = rating <= (hoverValue || value)
        return (
          <button
            key={rating}
            type="button"
            onClick={() => handleClick(rating)}
            onMouseEnter={() => handleMouseEnter(rating)}
            disabled={disabled}
            className={cn(
              'transition-all duration-150',
              disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:scale-110'
            )}
            aria-label={`Rate ${rating} out of 5 stars`}
          >
            <Star
              className={cn(
                sizeClasses[size],
                'transition-colors duration-150',
                isFilled
                  ? 'fill-yellow-400 text-yellow-400'
                  : 'fill-transparent text-gray-300 dark:text-gray-600'
              )}
            />
          </button>
        )
      })}
    </div>
  )
}
