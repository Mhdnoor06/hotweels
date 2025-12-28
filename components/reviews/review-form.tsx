'use client'

import { useState } from 'react'
import { X, ImagePlus, Loader2 } from 'lucide-react'
import Image from 'next/image'
import { StarRatingInput } from './star-rating-input'
import { cn } from '@/lib/utils'

interface ReviewFormProps {
  onSubmit: (data: {
    rating: number
    title: string
    comment: string
    images: string[]
  }) => Promise<void>
  onCancel?: () => void
  isSubmitting?: boolean
  initialData?: {
    rating: number
    title: string
    comment: string
    images: string[]
  }
}

export function ReviewForm({
  onSubmit,
  onCancel,
  isSubmitting = false,
  initialData
}: ReviewFormProps) {
  const [rating, setRating] = useState(initialData?.rating || 0)
  const [title, setTitle] = useState(initialData?.title || '')
  const [comment, setComment] = useState(initialData?.comment || '')
  const [images, setImages] = useState<string[]>(initialData?.images || [])
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (rating === 0) {
      setError('Please select a rating')
      return
    }

    try {
      await onSubmit({ rating, title, comment, images })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit review')
    }
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    // For now, we'll use placeholder URLs
    // In production, you would upload to Supabase Storage
    // and get back real URLs
    const newImages = Array.from(files).map((file) => URL.createObjectURL(file))
    setImages((prev) => [...prev, ...newImages].slice(0, 5)) // Max 5 images
  }

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index))
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Rating */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Rating <span className="text-red-500">*</span>
        </label>
        <StarRatingInput value={rating} onChange={setRating} size="lg" />
        {rating > 0 && (
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'][rating]}
          </p>
        )}
      </div>

      {/* Title */}
      <div>
        <label
          htmlFor="review-title"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
        >
          Review Title
        </label>
        <input
          id="review-title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Summarize your experience"
          maxLength={100}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-colors"
        />
      </div>

      {/* Comment */}
      <div>
        <label
          htmlFor="review-comment"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
        >
          Your Review
        </label>
        <textarea
          id="review-comment"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Share your experience with this product..."
          rows={4}
          maxLength={2000}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-colors resize-none"
        />
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 text-right">
          {comment.length}/2000
        </p>
      </div>

      {/* Image Upload */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Photos (Optional)
        </label>

        <div className="flex flex-wrap gap-3">
          {/* Existing images */}
          {images.map((imageUrl, index) => (
            <div
              key={index}
              className="relative w-20 h-20 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 group"
            >
              <Image
                src={imageUrl}
                alt={`Upload ${index + 1}`}
                fill
                className="object-cover"
              />
              <button
                type="button"
                onClick={() => removeImage(index)}
                className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}

          {/* Upload button */}
          {images.length < 5 && (
            <label className="w-20 h-20 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 flex flex-col items-center justify-center cursor-pointer hover:border-orange-500 transition-colors">
              <ImagePlus className="w-6 h-6 text-gray-400" />
              <span className="text-xs text-gray-400 mt-1">Add</span>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageUpload}
                className="hidden"
              />
            </label>
          )}
        </div>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
          Up to 5 images
        </p>
      </div>

      {/* Error message */}
      {error && (
        <p className="text-sm text-red-500">{error}</p>
      )}

      {/* Buttons */}
      <div className="flex gap-3 justify-end pt-2">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={isSubmitting || rating === 0}
          className={cn(
            'px-6 py-2 text-sm font-medium rounded-lg transition-colors flex items-center gap-2',
            rating > 0
              ? 'bg-orange-500 text-white hover:bg-orange-600'
              : 'bg-gray-200 dark:bg-gray-700 text-gray-500 cursor-not-allowed',
            isSubmitting && 'opacity-70 cursor-wait'
          )}
        >
          {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
          {isSubmitting ? 'Submitting...' : 'Submit Review'}
        </button>
      </div>

      <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
        Your review will be visible after admin approval
      </p>
    </form>
  )
}
