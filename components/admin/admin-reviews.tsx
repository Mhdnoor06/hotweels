"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Image from "next/image"
import {
  MessageSquare,
  Search,
  ChevronDown,
  Eye,
  CheckCircle,
  Clock,
  X,
  XCircle,
  Loader2,
  Star,
  ThumbsUp,
  ThumbsDown,
  Trash2,
  Plus,
} from "lucide-react"
import type { ReviewStatus } from "@/lib/supabase/database.types"
import { AdminPageHeader } from "./admin-page-header"
import { StarRatingDisplay } from "@/components/reviews/star-rating-display"

interface ReviewWithDetails {
  id: string
  user_id: string
  product_id: string
  order_item_id: string
  rating: number
  title: string | null
  comment: string | null
  images: string[]
  status: ReviewStatus
  helpful_count: number
  unhelpful_count: number
  admin_note: string | null
  reviewer_name: string | null
  created_at: string
  updated_at: string
  user: {
    id: string
    name: string | null
    avatar_url: string | null
  } | null
  product: {
    id: string
    name: string
    image: string
  } | null
}

interface ProductForDropdown {
  id: string
  name: string
  image: string
}

const statusOptions = ["all", "pending", "approved", "rejected"] as const

export function AdminReviews() {
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<typeof statusOptions[number]>("all")
  const [selectedReview, setSelectedReview] = useState<ReviewWithDetails | null>(null)
  const [reviews, setReviews] = useState<ReviewWithDetails[]>([])
  const [products, setProducts] = useState<ProductForDropdown[]>([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [pendingCount, setPendingCount] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [adminNote, setAdminNote] = useState("")
  const [toast, setToast] = useState<{ message: string; type: 'error' | 'success' } | null>(null)
  const [showImageModal, setShowImageModal] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  // Add review modal state
  const [showAddModal, setShowAddModal] = useState(false)
  const [newReview, setNewReview] = useState({
    product_id: '',
    rating: 5,
    title: '',
    comment: '',
    reviewer_name: ''
  })

  const showToast = (message: string, type: 'error' | 'success' = 'error') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 4000)
  }

  useEffect(() => {
    fetchReviews()
  }, [statusFilter, currentPage])

  const fetchReviews = async () => {
    setLoading(true)
    try {
      const response = await fetch(
        `/api/admin/reviews?page=${currentPage}&limit=20&status=${statusFilter}&_t=${Date.now()}`,
        {
          credentials: 'include',
          cache: 'no-store',
        }
      )
      const data = await response.json()
      if (data.reviews) {
        setReviews(data.reviews)
        setTotalPages(data.totalPages || 1)
        setPendingCount(data.pendingCount || 0)
      }
      if (data.products) {
        setProducts(data.products)
      }
    } catch (err) {
      console.error('Error fetching reviews:', err)
      showToast('Failed to fetch reviews', 'error')
    } finally {
      setLoading(false)
    }
  }

  const createReview = async () => {
    if (!newReview.product_id) {
      showToast('Please select a product', 'error')
      return
    }
    if (!newReview.reviewer_name.trim()) {
      showToast('Please enter a reviewer name', 'error')
      return
    }

    setUpdating(true)
    try {
      const response = await fetch('/api/admin/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(newReview),
      })

      const data = await response.json()

      if (response.ok) {
        showToast('Review created successfully', 'success')
        setShowAddModal(false)
        setNewReview({ product_id: '', rating: 5, title: '', comment: '', reviewer_name: '' })
        fetchReviews()
      } else {
        showToast(data.error || 'Failed to create review', 'error')
      }
    } catch (err) {
      console.error('Error creating review:', err)
      showToast('Failed to create review', 'error')
    } finally {
      setUpdating(false)
    }
  }

  const filteredReviews = reviews.filter((review) => {
    const searchLower = searchQuery.toLowerCase()
    return (
      (review.user?.name || '').toLowerCase().includes(searchLower) ||
      (review.product?.name || '').toLowerCase().includes(searchLower) ||
      (review.title || '').toLowerCase().includes(searchLower) ||
      (review.comment || '').toLowerCase().includes(searchLower)
    )
  })

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  const getStatusColor = (status: ReviewStatus) => {
    switch (status) {
      case "approved":
        return "text-emerald-600 bg-emerald-50 border-emerald-200"
      case "pending":
        return "text-amber-600 bg-amber-50 border-amber-200"
      case "rejected":
        return "text-red-600 bg-red-50 border-red-200"
      default:
        return "text-gray-600 bg-gray-50 border-gray-200"
    }
  }

  const getStatusIcon = (status: ReviewStatus) => {
    switch (status) {
      case "approved":
        return CheckCircle
      case "pending":
        return Clock
      case "rejected":
        return XCircle
      default:
        return Clock
    }
  }

  const moderateReview = async (reviewId: string, status: 'approved' | 'rejected') => {
    setUpdating(true)
    try {
      const response = await fetch(`/api/admin/reviews/${reviewId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status, adminNote: adminNote || undefined }),
      })

      if (response.ok) {
        const data = await response.json()
        showToast(`Review ${status} successfully`, 'success')

        // Update local state
        setReviews((prev) =>
          prev.map((review) =>
            review.id === reviewId
              ? { ...review, status, admin_note: adminNote || null }
              : review
          )
        )

        // Update pending count (the review was pending, now it's approved/rejected)
        setPendingCount((prev) => Math.max(0, prev - 1))

        setSelectedReview(null)
        setAdminNote("")
      } else {
        const error = await response.json()
        showToast(error.error || 'Failed to update review', 'error')
      }
    } catch (err) {
      console.error('Error moderating review:', err)
      showToast('Failed to update review', 'error')
    } finally {
      setUpdating(false)
    }
  }

  const deleteReview = async (reviewId: string) => {
    setUpdating(true)
    try {
      const response = await fetch(`/api/admin/reviews/${reviewId}`, {
        method: 'DELETE',
        credentials: 'include',
      })

      if (response.ok) {
        showToast('Review deleted successfully', 'success')
        setReviews((prev) => prev.filter((r) => r.id !== reviewId))
        setConfirmDelete(null)
        if (selectedReview?.id === reviewId) {
          setSelectedReview(null)
        }
      } else {
        const error = await response.json()
        showToast(error.error || 'Failed to delete review', 'error')
      }
    } catch (err) {
      console.error('Error deleting review:', err)
      showToast('Failed to delete review', 'error')
    } finally {
      setUpdating(false)
    }
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <AdminPageHeader
        title="Reviews"
        icon={MessageSquare}
        badge={pendingCount > 0 ? `${pendingCount} pending` : undefined}
      />

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search reviews..."
            className="w-full bg-white border border-gray-200 rounded-xl pl-12 pr-4 py-3 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-colors"
          />
        </div>
        <div className="relative shrink-0">
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value as typeof statusOptions[number])
              setCurrentPage(1)
            }}
            className="appearance-none bg-white border border-gray-200 rounded-xl px-4 py-3 pr-10 text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 cursor-pointer w-full sm:w-auto capitalize"
          >
            {statusOptions.map((status) => (
              <option key={status} value={status} className="capitalize">
                {status === 'all' ? 'All Status' : status}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center justify-center gap-2 px-4 py-3 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors font-medium shrink-0"
        >
          <Plus className="w-5 h-5" />
          Add Review
        </button>
      </div>

      {/* Reviews Table */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-red-500" />
          </div>
        ) : filteredReviews.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-500">
            <MessageSquare className="w-12 h-12 mb-3 text-gray-300" />
            <p>No reviews found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Product</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">User</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Rating</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Review</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Status</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Date</th>
                  <th className="text-right px-6 py-4 text-sm font-semibold text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredReviews.map((review) => {
                  const StatusIcon = getStatusIcon(review.status)
                  return (
                    <tr key={review.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                            {review.product?.image ? (
                              <Image
                                src={review.product.image}
                                alt={review.product.name}
                                width={48}
                                height={48}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-gray-400">
                                <MessageSquare className="w-5 h-5" />
                              </div>
                            )}
                          </div>
                          <span className="text-sm font-medium text-gray-900 line-clamp-2 max-w-[150px]">
                            {review.product?.name || 'Unknown Product'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-700">
                          {review.reviewer_name || review.user?.name || 'Anonymous'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <StarRatingDisplay rating={review.rating} size="sm" />
                      </td>
                      <td className="px-6 py-4">
                        <div className="max-w-[200px]">
                          {review.title && (
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {review.title}
                            </p>
                          )}
                          {review.comment && (
                            <p className="text-sm text-gray-500 truncate">
                              {review.comment}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border capitalize ${getStatusColor(
                            review.status
                          )}`}
                        >
                          <StatusIcon className="w-3.5 h-3.5" />
                          {review.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-500">
                          {formatDate(review.created_at)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => {
                              setSelectedReview(review)
                              setAdminNote(review.admin_note || '')
                            }}
                            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                            title="View Review"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {review.status === 'pending' && (
                            <>
                              <button
                                onClick={() => moderateReview(review.id, 'approved')}
                                disabled={updating}
                                className="p-2 text-emerald-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors disabled:opacity-50"
                                title="Approve"
                              >
                                <CheckCircle className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedReview(review)
                                  setAdminNote('')
                                }}
                                disabled={updating}
                                className="p-2 text-red-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                                title="Reject"
                              >
                                <XCircle className="w-4 h-4" />
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => setConfirmDelete(review.id)}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 p-4 border-t border-gray-200">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Previous
            </button>
            <span className="text-sm text-gray-600">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* Review Detail Modal */}
      <AnimatePresence>
        {selectedReview && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedReview(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h2 className="text-xl font-bold text-gray-900">Review Details</h2>
                <button
                  onClick={() => setSelectedReview(null)}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Content */}
              <div className="p-6 space-y-6">
                {/* Product Info */}
                <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                  <div className="w-16 h-16 bg-white rounded-lg overflow-hidden flex-shrink-0 border border-gray-200">
                    {selectedReview.product?.image ? (
                      <Image
                        src={selectedReview.product.image}
                        alt={selectedReview.product.name}
                        width={64}
                        height={64}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <MessageSquare className="w-6 h-6" />
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">
                      {selectedReview.product?.name || 'Unknown Product'}
                    </p>
                    <p className="text-sm text-gray-500">
                      by {selectedReview.user?.name || 'Anonymous'}
                    </p>
                  </div>
                </div>

                {/* Rating */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Rating</label>
                  <StarRatingDisplay rating={selectedReview.rating} size="md" showValue />
                </div>

                {/* Title & Comment */}
                {selectedReview.title && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
                    <p className="text-gray-900">{selectedReview.title}</p>
                  </div>
                )}

                {selectedReview.comment && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Comment</label>
                    <p className="text-gray-700 whitespace-pre-wrap">{selectedReview.comment}</p>
                  </div>
                )}

                {/* Images */}
                {selectedReview.images && selectedReview.images.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Images</label>
                    <div className="flex gap-2 flex-wrap">
                      {selectedReview.images.map((img, i) => (
                        <button
                          key={i}
                          onClick={() => setShowImageModal(img)}
                          className="w-20 h-20 rounded-lg overflow-hidden border border-gray-200 hover:opacity-90 transition-opacity"
                        >
                          <Image
                            src={img}
                            alt={`Review image ${i + 1}`}
                            width={80}
                            height={80}
                            className="w-full h-full object-cover"
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Vote counts */}
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2 text-gray-600">
                    <ThumbsUp className="w-4 h-4" />
                    <span className="text-sm">{selectedReview.helpful_count} helpful</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <ThumbsDown className="w-4 h-4" />
                    <span className="text-sm">{selectedReview.unhelpful_count} not helpful</span>
                  </div>
                </div>

                {/* Status */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                  <span
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border capitalize ${getStatusColor(
                      selectedReview.status
                    )}`}
                  >
                    {(() => {
                      const StatusIcon = getStatusIcon(selectedReview.status)
                      return <StatusIcon className="w-4 h-4" />
                    })()}
                    {selectedReview.status}
                  </span>
                </div>

                {/* Admin Note */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Admin Note {selectedReview.status === 'pending' && '(optional)'}
                  </label>
                  <textarea
                    value={adminNote}
                    onChange={(e) => setAdminNote(e.target.value)}
                    placeholder="Add a note (will be shown to user if rejecting)"
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 resize-none"
                  />
                </div>

                {/* Date */}
                <div className="text-sm text-gray-500">
                  Submitted on {formatDate(selectedReview.created_at)}
                </div>
              </div>

              {/* Footer Actions */}
              <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
                {selectedReview.status === 'pending' && (
                  <>
                    <button
                      onClick={() => moderateReview(selectedReview.id, 'rejected')}
                      disabled={updating}
                      className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
                    >
                      {updating && <Loader2 className="w-4 h-4 animate-spin" />}
                      Reject
                    </button>
                    <button
                      onClick={() => moderateReview(selectedReview.id, 'approved')}
                      disabled={updating}
                      className="px-4 py-2 bg-emerald-500 text-white hover:bg-emerald-600 rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
                    >
                      {updating && <Loader2 className="w-4 h-4 animate-spin" />}
                      Approve
                    </button>
                  </>
                )}
                {selectedReview.status !== 'pending' && (
                  <button
                    onClick={() => setSelectedReview(null)}
                    className="px-4 py-2 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-lg font-medium transition-colors"
                  >
                    Close
                  </button>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Image Modal */}
      <AnimatePresence>
        {showImageModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 z-[60] flex items-center justify-center p-4"
            onClick={() => setShowImageModal(null)}
          >
            <button
              onClick={() => setShowImageModal(null)}
              className="absolute top-4 right-4 p-2 text-white hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
            <Image
              src={showImageModal}
              alt="Review image"
              width={800}
              height={800}
              className="max-w-full max-h-[80vh] object-contain rounded-lg"
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {confirmDelete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => setConfirmDelete(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl w-full max-w-md p-6"
            >
              <h3 className="text-lg font-bold text-gray-900 mb-2">Delete Review</h3>
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete this review? This action cannot be undone.
              </p>
              <div className="flex items-center justify-end gap-3">
                <button
                  onClick={() => setConfirmDelete(null)}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => deleteReview(confirmDelete)}
                  disabled={updating}
                  className="px-4 py-2 bg-red-500 text-white hover:bg-red-600 rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {updating && <Loader2 className="w-4 h-4 animate-spin" />}
                  Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Review Modal */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => setShowAddModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h2 className="text-xl font-bold text-gray-900">Add Review</h2>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Content */}
              <div className="p-6 space-y-5">
                {/* Product Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Product <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={newReview.product_id}
                    onChange={(e) => setNewReview({ ...newReview, product_id: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                  >
                    <option value="">Select a product...</option>
                    {products.map((product) => (
                      <option key={product.id} value={product.id}>
                        {product.name.length > 50 ? product.name.substring(0, 50) + '...' : product.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Reviewer Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Reviewer Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={newReview.reviewer_name}
                    onChange={(e) => setNewReview({ ...newReview, reviewer_name: e.target.value })}
                    placeholder="e.g., John D."
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                  />
                </div>

                {/* Rating */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Rating <span className="text-red-500">*</span>
                  </label>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setNewReview({ ...newReview, rating: star })}
                        className="p-1 transition-colors"
                      >
                        <Star
                          className={`w-8 h-8 ${
                            star <= newReview.rating
                              ? 'fill-yellow-400 text-yellow-400'
                              : 'text-gray-300'
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Title */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Title (optional)
                  </label>
                  <input
                    type="text"
                    value={newReview.title}
                    onChange={(e) => setNewReview({ ...newReview, title: e.target.value })}
                    placeholder="e.g., Great product!"
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                  />
                </div>

                {/* Comment */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Comment (optional)
                  </label>
                  <textarea
                    value={newReview.comment}
                    onChange={(e) => setNewReview({ ...newReview, comment: e.target.value })}
                    placeholder="Write the review comment..."
                    rows={4}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 resize-none"
                  />
                </div>
              </div>

              {/* Footer Actions */}
              <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={createReview}
                  disabled={updating || !newReview.product_id || !newReview.reviewer_name.trim()}
                  className="px-4 py-2 bg-red-500 text-white hover:bg-red-600 rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {updating && <Loader2 className="w-4 h-4 animate-spin" />}
                  Add Review
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className={`fixed bottom-6 right-6 px-4 py-3 rounded-xl shadow-lg flex items-center gap-3 z-50 ${
              toast.type === 'success'
                ? 'bg-emerald-500 text-white'
                : 'bg-red-500 text-white'
            }`}
          >
            {toast.type === 'success' ? (
              <CheckCircle className="w-5 h-5" />
            ) : (
              <XCircle className="w-5 h-5" />
            )}
            <span className="font-medium">{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
