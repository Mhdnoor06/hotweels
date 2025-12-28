import { supabaseAdmin } from './server'
import type {
  Review,
  ReviewInsert,
  ReviewUpdate,
  ReviewVote,
  ReviewStatus,
  VoteType,
  ReviewWithUser
} from './database.types'

// Extended types for reviews with related data
export interface ReviewWithDetails extends Review {
  user: {
    id: string
    name: string | null
    avatar_url: string | null
  } | null
  product?: {
    id: string
    name: string
    image: string
  } | null
}

export interface GetProductReviewsOptions {
  page?: number
  limit?: number
  sortBy?: 'newest' | 'oldest' | 'highest' | 'lowest' | 'helpful'
}

export interface GetAllReviewsOptions {
  page?: number
  limit?: number
  status?: ReviewStatus | 'all'
  productId?: string
  userId?: string
  sortBy?: 'newest' | 'oldest'
}

export interface CreateReviewInput {
  user_id: string
  product_id: string
  order_item_id: string
  rating: number
  title?: string
  comment?: string
  images?: string[]
}

// Get approved reviews for a product (public)
export async function getProductReviews(
  productId: string,
  options: GetProductReviewsOptions = {}
): Promise<{ reviews: ReviewWithDetails[]; total: number }> {
  const { page = 1, limit = 10, sortBy = 'newest' } = options
  const offset = (page - 1) * limit

  // Determine sort order
  let orderColumn = 'created_at'
  let ascending = false

  switch (sortBy) {
    case 'oldest':
      orderColumn = 'created_at'
      ascending = true
      break
    case 'highest':
      orderColumn = 'rating'
      ascending = false
      break
    case 'lowest':
      orderColumn = 'rating'
      ascending = true
      break
    case 'helpful':
      orderColumn = 'helpful_count'
      ascending = false
      break
    default:
      orderColumn = 'created_at'
      ascending = false
  }

  // Get total count of approved reviews
  const { count } = await supabaseAdmin
    .from('reviews')
    .select('*', { count: 'exact', head: true })
    .eq('product_id', productId)
    .eq('status', 'approved')

  // Get reviews with user info (reviewer_name is included in *)
  const { data, error } = await supabaseAdmin
    .from('reviews')
    .select(`
      id,
      user_id,
      product_id,
      order_item_id,
      rating,
      title,
      comment,
      images,
      status,
      helpful_count,
      unhelpful_count,
      reviewer_name,
      created_at,
      updated_at,
      user:users(id, name, avatar_url)
    `)
    .eq('product_id', productId)
    .eq('status', 'approved')
    .order(orderColumn, { ascending })
    .range(offset, offset + limit - 1)

  if (error) {
    console.error('Error fetching product reviews:', error)
    return { reviews: [], total: 0 }
  }

  return {
    reviews: (data as ReviewWithDetails[]) || [],
    total: count || 0
  }
}

// Check if user can review a product (must have a delivered order containing this product)
export async function canUserReviewProduct(
  userId: string,
  productId: string
): Promise<{ canReview: boolean; orderItemId: string | null; existingReview: Review | null }> {
  // First check if user already has a review for this product
  const { data: existingReview } = await supabaseAdmin
    .from('reviews')
    .select('*')
    .eq('user_id', userId)
    .eq('product_id', productId)
    .maybeSingle()

  if (existingReview) {
    return {
      canReview: false,
      orderItemId: null,
      existingReview: existingReview as Review
    }
  }

  // Check if user has a delivered order with this product
  const { data: orderItems, error } = await supabaseAdmin
    .from('order_items')
    .select(`
      id,
      order:orders!inner(
        id,
        user_id,
        status
      )
    `)
    .eq('product_id', productId)
    .eq('order.user_id', userId)
    .eq('order.status', 'delivered')
    .limit(1)

  if (error) {
    console.error('Error checking user purchase:', error)
    return { canReview: false, orderItemId: null, existingReview: null }
  }

  // Cast to the expected type
  const items = orderItems as { id: string; order: unknown }[] | null

  if (!items || items.length === 0) {
    return { canReview: false, orderItemId: null, existingReview: null }
  }

  return {
    canReview: true,
    orderItemId: items[0].id,
    existingReview: null
  }
}

// Create a new review
export async function createReview(
  input: CreateReviewInput
): Promise<{ review: Review | null; error: string | null }> {
  // Verify user can review this product
  const { canReview, orderItemId, existingReview } = await canUserReviewProduct(
    input.user_id,
    input.product_id
  )

  if (existingReview) {
    return { review: null, error: 'You have already reviewed this product' }
  }

  if (!canReview) {
    return {
      review: null,
      error: 'You can only review products from orders that have been delivered'
    }
  }

  // Validate rating
  if (input.rating < 1 || input.rating > 5) {
    return { review: null, error: 'Rating must be between 1 and 5' }
  }

  const reviewData: ReviewInsert = {
    user_id: input.user_id,
    product_id: input.product_id,
    order_item_id: input.order_item_id || orderItemId!,
    rating: input.rating,
    title: input.title || null,
    comment: input.comment || null,
    images: input.images || [],
    status: 'pending', // Reviews start as pending for admin approval
  }

  const { data, error } = await supabaseAdmin
    .from('reviews')
    .insert(reviewData as never)
    .select()
    .single()

  if (error) {
    console.error('Error creating review:', error)
    if (error.code === '23505') {
      return { review: null, error: 'You have already reviewed this product' }
    }
    return { review: null, error: error.message }
  }

  return { review: data as Review, error: null }
}

// Update own pending review
export async function updateReview(
  reviewId: string,
  userId: string,
  updates: { rating?: number; title?: string; comment?: string; images?: string[] }
): Promise<{ review: Review | null; error: string | null }> {
  // Check if review exists and belongs to user
  const { data: existingReview } = await supabaseAdmin
    .from('reviews')
    .select('*')
    .eq('id', reviewId)
    .eq('user_id', userId)
    .single()

  if (!existingReview) {
    return { review: null, error: 'Review not found' }
  }

  if ((existingReview as Review).status !== 'pending') {
    return { review: null, error: 'Only pending reviews can be edited' }
  }

  // Validate rating if provided
  if (updates.rating !== undefined && (updates.rating < 1 || updates.rating > 5)) {
    return { review: null, error: 'Rating must be between 1 and 5' }
  }

  const updateData: ReviewUpdate = {}
  if (updates.rating !== undefined) updateData.rating = updates.rating
  if (updates.title !== undefined) updateData.title = updates.title
  if (updates.comment !== undefined) updateData.comment = updates.comment
  if (updates.images !== undefined) updateData.images = updates.images

  const { data, error } = await supabaseAdmin
    .from('reviews')
    .update(updateData as never)
    .eq('id', reviewId)
    .eq('user_id', userId)
    .select()
    .single()

  if (error) {
    console.error('Error updating review:', error)
    return { review: null, error: error.message }
  }

  return { review: data as Review, error: null }
}

// Delete own review
export async function deleteReview(
  reviewId: string,
  userId: string
): Promise<{ success: boolean; error: string | null }> {
  const { error } = await supabaseAdmin
    .from('reviews')
    .delete()
    .eq('id', reviewId)
    .eq('user_id', userId)

  if (error) {
    console.error('Error deleting review:', error)
    return { success: false, error: error.message }
  }

  return { success: true, error: null }
}

// Vote on a review (helpful/unhelpful)
export async function voteOnReview(
  reviewId: string,
  userId: string,
  voteType: VoteType
): Promise<{ vote: ReviewVote | null; error: string | null }> {
  // Check if user already voted
  const { data: existingVote } = await supabaseAdmin
    .from('review_votes')
    .select('*')
    .eq('review_id', reviewId)
    .eq('user_id', userId)
    .maybeSingle()

  if (existingVote) {
    // Update existing vote
    const { data, error } = await supabaseAdmin
      .from('review_votes')
      .update({ vote_type: voteType } as never)
      .eq('id', (existingVote as ReviewVote).id)
      .select()
      .single()

    if (error) {
      console.error('Error updating vote:', error)
      return { vote: null, error: error.message }
    }

    return { vote: data as ReviewVote, error: null }
  }

  // Create new vote
  const { data, error } = await supabaseAdmin
    .from('review_votes')
    .insert({
      review_id: reviewId,
      user_id: userId,
      vote_type: voteType,
    } as never)
    .select()
    .single()

  if (error) {
    console.error('Error creating vote:', error)
    return { vote: null, error: error.message }
  }

  return { vote: data as ReviewVote, error: null }
}

// Remove vote from a review
export async function removeVote(
  reviewId: string,
  userId: string
): Promise<{ success: boolean; error: string | null }> {
  const { error } = await supabaseAdmin
    .from('review_votes')
    .delete()
    .eq('review_id', reviewId)
    .eq('user_id', userId)

  if (error) {
    console.error('Error removing vote:', error)
    return { success: false, error: error.message }
  }

  return { success: true, error: null }
}

// Get user's votes for a list of reviews
export async function getUserVotesForReviews(
  userId: string,
  reviewIds: string[]
): Promise<Record<string, VoteType>> {
  if (reviewIds.length === 0) return {}

  const { data, error } = await supabaseAdmin
    .from('review_votes')
    .select('review_id, vote_type')
    .eq('user_id', userId)
    .in('review_id', reviewIds)

  if (error) {
    console.error('Error fetching user votes:', error)
    return {}
  }

  const votesMap: Record<string, VoteType> = {}
  ;(data as { review_id: string; vote_type: VoteType }[] | null)?.forEach(vote => {
    votesMap[vote.review_id] = vote.vote_type
  })

  return votesMap
}

// Get user's reviews
export async function getUserReviews(userId: string): Promise<ReviewWithDetails[]> {
  const { data, error } = await supabaseAdmin
    .from('reviews')
    .select(`
      *,
      product:products(id, name, image)
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching user reviews:', error)
    return []
  }

  return (data as ReviewWithDetails[]) || []
}

// Admin: Get all reviews with filters
export async function getAllReviews(
  options: GetAllReviewsOptions = {}
): Promise<{ reviews: ReviewWithDetails[]; total: number }> {
  const { page = 1, limit = 20, status = 'all', productId, userId, sortBy = 'newest' } = options
  const offset = (page - 1) * limit

  // Build query for count
  let countQuery = supabaseAdmin
    .from('reviews')
    .select('*', { count: 'exact', head: true })

  if (status !== 'all') {
    countQuery = countQuery.eq('status', status)
  }
  if (productId) {
    countQuery = countQuery.eq('product_id', productId)
  }
  if (userId) {
    countQuery = countQuery.eq('user_id', userId)
  }

  const { count } = await countQuery

  // Build query for data (explicitly include reviewer_name)
  let dataQuery = supabaseAdmin
    .from('reviews')
    .select(`
      id,
      user_id,
      product_id,
      order_item_id,
      rating,
      title,
      comment,
      images,
      status,
      helpful_count,
      unhelpful_count,
      admin_note,
      reviewer_name,
      created_at,
      updated_at,
      user:users(id, name, avatar_url),
      product:products(id, name, image)
    `)

  if (status !== 'all') {
    dataQuery = dataQuery.eq('status', status)
  }
  if (productId) {
    dataQuery = dataQuery.eq('product_id', productId)
  }
  if (userId) {
    dataQuery = dataQuery.eq('user_id', userId)
  }

  dataQuery = dataQuery.order('created_at', { ascending: sortBy === 'oldest' })
  dataQuery = dataQuery.range(offset, offset + limit - 1)

  const { data, error } = await dataQuery

  if (error) {
    console.error('Error fetching all reviews:', error)
    return { reviews: [], total: 0 }
  }

  return {
    reviews: (data as ReviewWithDetails[]) || [],
    total: count || 0
  }
}

// Admin: Moderate a review (approve/reject)
export async function moderateReview(
  reviewId: string,
  status: 'approved' | 'rejected',
  adminNote?: string
): Promise<{ review: Review | null; error: string | null }> {
  // First check if the review exists
  const { data: existingReview, error: fetchError } = await supabaseAdmin
    .from('reviews')
    .select('*')
    .eq('id', reviewId)
    .single()

  if (fetchError || !existingReview) {
    console.error('Error fetching review for moderation:', fetchError)
    return { review: null, error: 'Review not found' }
  }

  const updateData: ReviewUpdate = { status }
  if (adminNote !== undefined) {
    updateData.admin_note = adminNote
  }

  const { data, error } = await supabaseAdmin
    .from('reviews')
    .update(updateData as never)
    .eq('id', reviewId)
    .select()
    .maybeSingle()

  if (error) {
    console.error('Error moderating review:', error)
    return { review: null, error: error.message }
  }

  // If update didn't return data, fetch the updated record
  if (!data) {
    const { data: updatedReview } = await supabaseAdmin
      .from('reviews')
      .select('*')
      .eq('id', reviewId)
      .single()

    if (!updatedReview) {
      return { review: null, error: 'Failed to fetch updated review' }
    }

    return { review: updatedReview as unknown as Review, error: null }
  }

  return { review: data as Review, error: null }
}

// Get review statistics for a product
export async function getProductReviewStats(productId: string): Promise<{
  averageRating: number
  totalReviews: number
  ratingDistribution: Record<number, number>
}> {
  const { data, error } = await supabaseAdmin
    .from('reviews')
    .select('rating')
    .eq('product_id', productId)
    .eq('status', 'approved')

  if (error || !data) {
    return {
      averageRating: 0,
      totalReviews: 0,
      ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
    }
  }

  const ratings = data as { rating: number }[]
  const totalReviews = ratings.length

  if (totalReviews === 0) {
    return {
      averageRating: 0,
      totalReviews: 0,
      ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
    }
  }

  const sum = ratings.reduce((acc, r) => acc + r.rating, 0)
  const averageRating = Math.round((sum / totalReviews) * 10) / 10

  const ratingDistribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
  ratings.forEach(r => {
    ratingDistribution[r.rating]++
  })

  return { averageRating, totalReviews, ratingDistribution }
}

// Get pending reviews count for admin dashboard
export async function getPendingReviewsCount(): Promise<number> {
  const { count, error } = await supabaseAdmin
    .from('reviews')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'pending')

  if (error) {
    console.error('Error fetching pending reviews count:', error)
    return 0
  }

  return count || 0
}

// Admin: Create a review manually (bypasses purchase verification)
export interface AdminCreateReviewInput {
  product_id: string
  rating: number
  title?: string
  comment?: string
  images?: string[]
  reviewer_name: string
  status?: ReviewStatus
}

export async function createAdminReview(
  input: AdminCreateReviewInput
): Promise<{ review: Review | null; error: string | null }> {
  // Validate rating
  if (input.rating < 1 || input.rating > 5) {
    return { review: null, error: 'Rating must be between 1 and 5' }
  }

  // Validate reviewer name
  if (!input.reviewer_name || input.reviewer_name.trim().length === 0) {
    return { review: null, error: 'Reviewer name is required' }
  }

  // Verify product exists
  const { data: product, error: productError } = await supabaseAdmin
    .from('products')
    .select('id')
    .eq('id', input.product_id)
    .single()

  if (productError || !product) {
    return { review: null, error: 'Product not found' }
  }

  // Admin-created reviews don't need a user_id or order_item_id
  const reviewData: ReviewInsert = {
    user_id: null as unknown as string, // Nullable for admin reviews
    product_id: input.product_id,
    order_item_id: null as unknown as string, // Nullable for admin reviews
    rating: input.rating,
    title: input.title || null,
    comment: input.comment || null,
    images: input.images || [],
    status: input.status || 'approved',
    reviewer_name: input.reviewer_name.trim(),
  }

  const { data, error } = await supabaseAdmin
    .from('reviews')
    .insert(reviewData as never)
    .select()
    .single()

  if (error) {
    console.error('Error creating admin review:', error)
    return { review: null, error: error.message }
  }

  return { review: data as Review, error: null }
}

// Get all products for admin dropdown (simple list)
export async function getProductsForReviewDropdown(): Promise<{ id: string; name: string; image: string }[]> {
  const { data, error } = await supabaseAdmin
    .from('products')
    .select('id, name, image')
    .order('name', { ascending: true })

  if (error) {
    console.error('Error fetching products for dropdown:', error)
    return []
  }

  return (data as { id: string; name: string; image: string }[]) || []
}
