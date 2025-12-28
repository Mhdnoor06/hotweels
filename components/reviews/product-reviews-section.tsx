'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useAuth } from '@/context/auth-context'
import { PenLine, X, Loader2 } from 'lucide-react'
import { ReviewSummary } from './review-summary'
import { ReviewList } from './review-list'
import { ReviewForm } from './review-form'
import type { VoteType } from '@/lib/supabase/database.types'
import { cn } from '@/lib/utils'

interface Review {
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

interface ReviewStats {
  averageRating: number
  totalReviews: number
  ratingDistribution: Record<number, number>
}

interface ProductReviewsSectionProps {
  productId: string
}

export function ProductReviewsSection({ productId }: ProductReviewsSectionProps) {
  const { user, session } = useAuth()
  const sectionRef = useRef<HTMLDivElement>(null)
  const [reviews, setReviews] = useState<Review[]>([])
  const [stats, setStats] = useState<ReviewStats>({
    averageRating: 0,
    totalReviews: 0,
    ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
  })
  const [userVotes, setUserVotes] = useState<Record<string, VoteType>>({})
  const [canReview, setCanReview] = useState(false)
  const [existingReviewId, setExistingReviewId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showReviewForm, setShowReviewForm] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalReviews, setTotalReviews] = useState(0)
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'highest' | 'lowest' | 'helpful'>('newest')
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [hasScrolled, setHasScrolled] = useState(false)

  const fetchReviews = useCallback(async () => {
    try {
      const headers: HeadersInit = {}
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`
      }

      const response = await fetch(
        `/api/products/${productId}/reviews?page=${currentPage}&limit=10&sortBy=${sortBy}&_t=${Date.now()}`,
        {
          headers,
          cache: 'no-store'
        }
      )

      if (!response.ok) {
        throw new Error('Failed to fetch reviews')
      }

      const data = await response.json()

      setReviews(data.reviews || [])
      setStats(data.stats || { averageRating: 0, totalReviews: 0, ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } })
      setUserVotes(data.userVotes || {})
      setCanReview(data.canReview || false)
      setExistingReviewId(data.existingReviewId || null)
      setTotalPages(data.totalPages || 1)
      setTotalReviews(data.total || 0)
    } catch (err) {
      console.error('Error fetching reviews:', err)
      setError('Failed to load reviews')
    } finally {
      setIsLoading(false)
    }
  }, [productId, currentPage, sortBy, session?.access_token])

  useEffect(() => {
    fetchReviews()
  }, [fetchReviews])

  // Auto-scroll to reviews section and open form if navigating from orders page
  useEffect(() => {
    if (!isLoading && !hasScrolled && typeof window !== 'undefined') {
      const hash = window.location.hash
      if (hash === '#reviews') {
        // Scroll to the reviews section
        setTimeout(() => {
          sectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })

          // Auto-open the review form if user can review
          if (canReview && user) {
            setShowReviewForm(true)
          }
        }, 100)
        setHasScrolled(true)
      }
    }
  }, [isLoading, hasScrolled, canReview, user])

  const handleSubmitReview = async (data: {
    rating: number
    title: string
    comment: string
    images: string[]
  }) => {
    if (!session?.access_token) {
      setError('Please sign in to write a review')
      return
    }

    setIsSubmitting(true)
    setError('')

    try {
      const response = await fetch(`/api/products/${productId}/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify(data)
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to submit review')
      }

      setSuccessMessage('Your review has been submitted and is pending approval!')
      setShowReviewForm(false)
      setCanReview(false)

      // Refresh reviews
      setTimeout(() => {
        setSuccessMessage('')
      }, 5000)
    } catch (err) {
      throw err
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleVote = async (reviewId: string, voteType: VoteType) => {
    if (!session?.access_token) return

    try {
      const currentVote = userVotes[reviewId]

      // If clicking the same vote, remove it
      if (currentVote === voteType) {
        await fetch(`/api/reviews/${reviewId}/vote`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${session.access_token}`
          }
        })

        // Optimistic update
        setUserVotes((prev) => {
          const newVotes = { ...prev }
          delete newVotes[reviewId]
          return newVotes
        })

        // Update review counts
        setReviews((prev) =>
          prev.map((r) =>
            r.id === reviewId
              ? {
                  ...r,
                  helpful_count: voteType === 'helpful' ? r.helpful_count - 1 : r.helpful_count,
                  unhelpful_count: voteType === 'unhelpful' ? r.unhelpful_count - 1 : r.unhelpful_count
                }
              : r
          )
        )
      } else {
        // Add or change vote
        await fetch(`/api/reviews/${reviewId}/vote`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`
          },
          body: JSON.stringify({ voteType })
        })

        // Optimistic update
        setUserVotes((prev) => ({ ...prev, [reviewId]: voteType }))

        // Update review counts
        setReviews((prev) =>
          prev.map((r) => {
            if (r.id !== reviewId) return r

            let newHelpful = r.helpful_count
            let newUnhelpful = r.unhelpful_count

            // If changing vote
            if (currentVote) {
              if (currentVote === 'helpful') newHelpful--
              else newUnhelpful--
            }

            // Add new vote
            if (voteType === 'helpful') newHelpful++
            else newUnhelpful++

            return {
              ...r,
              helpful_count: newHelpful,
              unhelpful_count: newUnhelpful
            }
          })
        )
      }
    } catch (err) {
      console.error('Error voting:', err)
    }
  }

  const handleSortChange = (newSort: typeof sortBy) => {
    setSortBy(newSort)
    setCurrentPage(1)
  }

  if (isLoading) {
    return (
      <div className="py-10 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
      </div>
    )
  }

  return (
    <div id="reviews" ref={sectionRef} className="py-8 scroll-mt-20">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Customer Reviews
        </h2>

        {/* Write review button */}
        {user && canReview && !showReviewForm && (
          <button
            onClick={() => setShowReviewForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
          >
            <PenLine className="w-4 h-4" />
            Write a Review
          </button>
        )}
      </div>

      {/* Success message */}
      {successMessage && (
        <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg text-green-700 dark:text-green-400 flex items-center justify-between">
          <span>{successMessage}</span>
          <button onClick={() => setSuccessMessage('')}>
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400 flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError('')}>
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Already reviewed notice */}
      {user && existingReviewId && (
        <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg text-blue-700 dark:text-blue-400">
          You have already reviewed this product
        </div>
      )}

      {/* Prompt to sign in or purchase */}
      {!user && stats.totalReviews === 0 && (
        <p className="text-gray-500 dark:text-gray-400 mb-6">
          Sign in and purchase this product to be the first to leave a review!
        </p>
      )}

      {user && !canReview && !existingReviewId && (
        <p className="text-gray-500 dark:text-gray-400 mb-6">
          Purchase and receive this product to leave a review
        </p>
      )}

      {/* Review form */}
      {showReviewForm && (
        <div className="mb-8 p-6 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Write Your Review
            </h3>
            <button
              onClick={() => setShowReviewForm(false)}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <ReviewForm
            onSubmit={handleSubmitReview}
            onCancel={() => setShowReviewForm(false)}
            isSubmitting={isSubmitting}
          />
        </div>
      )}

      {/* Review summary */}
      {stats.totalReviews > 0 && (
        <div className="mb-8 p-6 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700">
          <ReviewSummary
            averageRating={stats.averageRating}
            totalReviews={stats.totalReviews}
            ratingDistribution={stats.ratingDistribution}
          />
        </div>
      )}

      {/* Review list */}
      <ReviewList
        reviews={reviews}
        userVotes={userVotes}
        isLoggedIn={!!user}
        totalReviews={totalReviews}
        currentPage={currentPage}
        totalPages={totalPages}
        sortBy={sortBy}
        onSortChange={handleSortChange}
        onPageChange={setCurrentPage}
        onVote={handleVote}
      />
    </div>
  )
}
