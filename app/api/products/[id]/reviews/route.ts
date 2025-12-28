import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import {
  getProductReviews,
  getProductReviewStats,
  canUserReviewProduct,
  createReview,
  getUserVotesForReviews
} from '@/lib/supabase/reviews'

// Force dynamic to prevent caching
export const dynamic = 'force-dynamic'
export const revalidate = 0

// Helper to get user from Authorization header
async function getUserFromRequest(request: Request) {
  const authHeader = request.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return null
  }

  const token = authHeader.split(' ')[1]

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const { data: { user }, error } = await supabase.auth.getUser(token)

  if (error || !user) {
    return null
  }

  return user
}

// GET - Get approved reviews for a product
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: productId } = await params
    const { searchParams } = new URL(request.url)

    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const sortBy = (searchParams.get('sortBy') || 'newest') as 'newest' | 'oldest' | 'highest' | 'lowest' | 'helpful'

    // Get reviews
    const { reviews, total } = await getProductReviews(productId, {
      page,
      limit,
      sortBy
    })

    // Get review stats
    const stats = await getProductReviewStats(productId)

    // Check if user is logged in and get their votes
    const user = await getUserFromRequest(request)
    let userVotes: Record<string, 'helpful' | 'unhelpful'> = {}
    let canReview = false
    let existingReviewId: string | null = null

    if (user) {
      const reviewIds = reviews.map(r => r.id)
      if (reviewIds.length > 0) {
        userVotes = await getUserVotesForReviews(user.id, reviewIds)
      }

      // Check if user can review this product
      const reviewCheck = await canUserReviewProduct(user.id, productId)
      canReview = reviewCheck.canReview
      existingReviewId = reviewCheck.existingReview?.id || null
    }

    return NextResponse.json({
      reviews,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      stats,
      userVotes,
      canReview,
      existingReviewId
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      }
    })
  } catch (error) {
    console.error('Error fetching reviews:', error)
    return NextResponse.json(
      { error: 'Failed to fetch reviews' },
      { status: 500 }
    )
  }
}

// POST - Create a new review
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUserFromRequest(request)

    if (!user) {
      return NextResponse.json(
        { error: 'Please sign in to write a review' },
        { status: 401 }
      )
    }

    const { id: productId } = await params
    const body = await request.json()
    const { rating, title, comment, images } = body

    // Validate rating
    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: 'Rating must be between 1 and 5' },
        { status: 400 }
      )
    }

    // Check if user can review this product
    const { canReview, orderItemId, existingReview } = await canUserReviewProduct(
      user.id,
      productId
    )

    if (existingReview) {
      return NextResponse.json(
        { error: 'You have already reviewed this product', existingReviewId: existingReview.id },
        { status: 400 }
      )
    }

    if (!canReview || !orderItemId) {
      return NextResponse.json(
        { error: 'You can only review products from orders that have been delivered' },
        { status: 403 }
      )
    }

    const { review, error } = await createReview({
      user_id: user.id,
      product_id: productId,
      order_item_id: orderItemId,
      rating,
      title: title || undefined,
      comment: comment || undefined,
      images: images || []
    })

    if (error) {
      return NextResponse.json(
        { error },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      review,
      message: 'Your review has been submitted and is pending approval'
    })
  } catch (error) {
    console.error('Error creating review:', error)
    return NextResponse.json(
      { error: 'Failed to create review' },
      { status: 500 }
    )
  }
}
