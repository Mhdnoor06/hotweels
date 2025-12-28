'use client'

import { useState } from 'react'
import { ChevronDown, MessageSquare } from 'lucide-react'
import { ReviewCard } from './review-card'
import { cn } from '@/lib/utils'
import type { VoteType } from '@/lib/supabase/database.types'

interface Review {
  id: string
  rating: number
  title: string | null
  comment: string | null
  images: string[]
  helpful_count: number
  unhelpful_count: number
  created_at: string
  user: {
    id: string
    name: string | null
    avatar_url: string | null
  } | null
}

interface ReviewListProps {
  reviews: Review[]
  userVotes: Record<string, VoteType>
  isLoggedIn: boolean
  totalReviews: number
  currentPage: number
  totalPages: number
  sortBy: 'newest' | 'oldest' | 'highest' | 'lowest' | 'helpful'
  onSortChange: (sort: 'newest' | 'oldest' | 'highest' | 'lowest' | 'helpful') => void
  onPageChange: (page: number) => void
  onVote: (reviewId: string, voteType: VoteType) => void
  onImageClick?: (imageUrl: string) => void
}

const sortOptions = [
  { value: 'newest', label: 'Newest First' },
  { value: 'oldest', label: 'Oldest First' },
  { value: 'highest', label: 'Highest Rated' },
  { value: 'lowest', label: 'Lowest Rated' },
  { value: 'helpful', label: 'Most Helpful' }
] as const

export function ReviewList({
  reviews,
  userVotes,
  isLoggedIn,
  totalReviews,
  currentPage,
  totalPages,
  sortBy,
  onSortChange,
  onPageChange,
  onVote,
  onImageClick
}: ReviewListProps) {
  const [isSortOpen, setIsSortOpen] = useState(false)

  if (reviews.length === 0) {
    return (
      <div className="text-center py-10">
        <MessageSquare className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
        <p className="text-gray-500 dark:text-gray-400">
          No reviews yet. Be the first to review this product!
        </p>
      </div>
    )
  }

  const currentSort = sortOptions.find((opt) => opt.value === sortBy) || sortOptions[0]

  return (
    <div>
      {/* Sort dropdown */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Showing {reviews.length} of {totalReviews} reviews
        </p>

        <div className="relative">
          <button
            onClick={() => setIsSortOpen(!isSortOpen)}
            className="flex items-center gap-2 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            <span className="text-gray-600 dark:text-gray-400">Sort:</span>
            <span className="font-medium text-gray-900 dark:text-white">
              {currentSort.label}
            </span>
            <ChevronDown
              className={cn(
                'w-4 h-4 text-gray-500 transition-transform',
                isSortOpen && 'rotate-180'
              )}
            />
          </button>

          {isSortOpen && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setIsSortOpen(false)}
              />
              <div className="absolute right-0 top-full mt-1 w-40 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-20 py-1">
                {sortOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => {
                      onSortChange(option.value)
                      setIsSortOpen(false)
                    }}
                    className={cn(
                      'w-full text-left px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors',
                      sortBy === option.value
                        ? 'text-orange-500 font-medium'
                        : 'text-gray-700 dark:text-gray-300'
                    )}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Reviews */}
      <div className="divide-y divide-gray-200 dark:divide-gray-700">
        {reviews.map((review) => (
          <ReviewCard
            key={review.id}
            review={review}
            userVote={userVotes[review.id]}
            isLoggedIn={isLoggedIn}
            onVote={onVote}
            onImageClick={onImageClick}
          />
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Previous
          </button>

          <div className="flex items-center gap-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter((page) => {
                // Show first, last, current, and adjacent pages
                return (
                  page === 1 ||
                  page === totalPages ||
                  Math.abs(page - currentPage) <= 1
                )
              })
              .map((page, index, arr) => {
                // Add ellipsis if there's a gap
                const prevPage = arr[index - 1]
                const showEllipsis = prevPage && page - prevPage > 1

                return (
                  <div key={page} className="flex items-center">
                    {showEllipsis && (
                      <span className="px-2 text-gray-400">...</span>
                    )}
                    <button
                      onClick={() => onPageChange(page)}
                      className={cn(
                        'w-8 h-8 text-sm rounded-lg transition-colors',
                        page === currentPage
                          ? 'bg-orange-500 text-white'
                          : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'
                      )}
                    >
                      {page}
                    </button>
                  </div>
                )
              })}
          </div>

          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Next
          </button>
        </div>
      )}
    </div>
  )
}
