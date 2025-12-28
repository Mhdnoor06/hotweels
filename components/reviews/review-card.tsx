'use client'

import { useState } from 'react'
import Image from 'next/image'
import { ThumbsUp, ThumbsDown, User, ImageIcon } from 'lucide-react'
import { StarRatingDisplay } from './star-rating-display'
import { cn } from '@/lib/utils'
import type { VoteType } from '@/lib/supabase/database.types'

interface ReviewCardProps {
  review: {
    id: string
    rating: number
    title: string | null
    comment: string | null
    images: string[]
    helpful_count: number
    unhelpful_count: number
    created_at: string
    reviewer_name?: string | null
    user: {
      id: string
      name: string | null
      avatar_url: string | null
    } | null
  }
  userVote?: VoteType | null
  isLoggedIn: boolean
  onVote?: (reviewId: string, voteType: VoteType) => void
  onImageClick?: (imageUrl: string) => void
}

export function ReviewCard({
  review,
  userVote,
  isLoggedIn,
  onVote,
  onImageClick
}: ReviewCardProps) {
  const [isVoting, setIsVoting] = useState(false)

  const handleVote = async (voteType: VoteType) => {
    if (!isLoggedIn || isVoting || !onVote) return

    setIsVoting(true)
    try {
      await onVote(review.id, voteType)
    } finally {
      setIsVoting(false)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  // Use reviewer_name for admin-created reviews, otherwise use user name
  const userName = review.reviewer_name || review.user?.name || 'Anonymous'
  const userInitial = userName.charAt(0).toUpperCase()

  return (
    <div className="border-b border-gray-200 dark:border-gray-700 py-5 last:border-b-0">
      {/* Header: User info and rating */}
      <div className="flex items-start justify-between gap-4 mb-3">
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center overflow-hidden flex-shrink-0">
            {review.user?.avatar_url ? (
              <Image
                src={review.user.avatar_url}
                alt={userName}
                width={40}
                height={40}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                {userInitial}
              </span>
            )}
          </div>

          {/* Name and date */}
          <div>
            <p className="font-medium text-gray-900 dark:text-white text-sm">
              {userName}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {formatDate(review.created_at)}
            </p>
          </div>
        </div>

        {/* Rating */}
        <StarRatingDisplay rating={review.rating} size="sm" />
      </div>

      {/* Title */}
      {review.title && (
        <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
          {review.title}
        </h4>
      )}

      {/* Comment */}
      {review.comment && (
        <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed mb-3">
          {review.comment}
        </p>
      )}

      {/* Images */}
      {review.images && review.images.length > 0 && (
        <div className="flex gap-2 mb-4 flex-wrap">
          {review.images.map((imageUrl, index) => (
            <button
              key={index}
              onClick={() => onImageClick?.(imageUrl)}
              className="relative w-16 h-16 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 hover:opacity-90 transition-opacity"
            >
              <Image
                src={imageUrl}
                alt={`Review image ${index + 1}`}
                fill
                className="object-cover"
              />
            </button>
          ))}
        </div>
      )}

      {/* Helpful votes */}
      <div className="flex items-center gap-4 mt-3">
        <span className="text-xs text-gray-500 dark:text-gray-400">
          Was this review helpful?
        </span>

        <div className="flex items-center gap-3">
          <button
            onClick={() => handleVote('helpful')}
            disabled={!isLoggedIn || isVoting}
            className={cn(
              'flex items-center gap-1.5 text-xs transition-colors',
              userVote === 'helpful'
                ? 'text-green-600 dark:text-green-400 font-medium'
                : 'text-gray-500 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400',
              (!isLoggedIn || isVoting) && 'opacity-50 cursor-not-allowed'
            )}
            title={!isLoggedIn ? 'Sign in to vote' : 'Helpful'}
          >
            <ThumbsUp className="w-4 h-4" />
            <span>{review.helpful_count}</span>
          </button>

          <button
            onClick={() => handleVote('unhelpful')}
            disabled={!isLoggedIn || isVoting}
            className={cn(
              'flex items-center gap-1.5 text-xs transition-colors',
              userVote === 'unhelpful'
                ? 'text-red-600 dark:text-red-400 font-medium'
                : 'text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400',
              (!isLoggedIn || isVoting) && 'opacity-50 cursor-not-allowed'
            )}
            title={!isLoggedIn ? 'Sign in to vote' : 'Not helpful'}
          >
            <ThumbsDown className="w-4 h-4" />
            <span>{review.unhelpful_count}</span>
          </button>
        </div>
      </div>
    </div>
  )
}
