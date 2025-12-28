'use client'

import { Star } from 'lucide-react'
import { StarRatingDisplay } from './star-rating-display'
import { cn } from '@/lib/utils'

interface ReviewSummaryProps {
  averageRating: number
  totalReviews: number
  ratingDistribution: Record<number, number>
  className?: string
}

export function ReviewSummary({
  averageRating,
  totalReviews,
  ratingDistribution,
  className
}: ReviewSummaryProps) {
  // Calculate percentages for each rating
  const getPercentage = (count: number) => {
    if (totalReviews === 0) return 0
    return Math.round((count / totalReviews) * 100)
  }

  return (
    <div className={cn('', className)}>
      <div className="flex flex-col sm:flex-row gap-6 sm:gap-10">
        {/* Average rating display */}
        <div className="text-center sm:text-left">
          <div className="text-5xl font-bold text-gray-900 dark:text-white mb-2">
            {averageRating.toFixed(1)}
          </div>
          <StarRatingDisplay rating={averageRating} size="md" />
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            Based on {totalReviews} review{totalReviews !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Rating bars */}
        <div className="flex-1 space-y-2">
          {[5, 4, 3, 2, 1].map((rating) => {
            const count = ratingDistribution[rating] || 0
            const percentage = getPercentage(count)

            return (
              <div key={rating} className="flex items-center gap-2">
                <span className="text-sm text-gray-600 dark:text-gray-400 w-3">
                  {rating}
                </span>
                <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                <div className="flex-1 h-2.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-yellow-400 rounded-full transition-all duration-300"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <span className="text-xs text-gray-500 dark:text-gray-400 w-8 text-right">
                  {count}
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
