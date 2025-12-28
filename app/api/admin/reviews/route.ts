import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminAuthFromRequest } from '@/lib/admin-auth'
import { getAllReviews, getPendingReviewsCount, createAdminReview, getProductsForReviewDropdown } from '@/lib/supabase/reviews'
import type { ReviewStatus } from '@/lib/supabase/database.types'

export const dynamic = 'force-dynamic'
export const revalidate = 0

// GET - Get all reviews with filters (admin only)
export async function GET(request: NextRequest) {
  const verification = await verifyAdminAuthFromRequest(request)

  if (!verification.isAdmin) {
    return NextResponse.json(
      { error: 'Unauthorized. Admin privileges required.' },
      { status: 401 }
    )
  }

  try {
    const { searchParams } = new URL(request.url)

    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const status = (searchParams.get('status') || 'all') as ReviewStatus | 'all'
    const productId = searchParams.get('productId') || undefined
    const userId = searchParams.get('userId') || undefined
    const sortBy = (searchParams.get('sortBy') || 'newest') as 'newest' | 'oldest'

    const { reviews, total } = await getAllReviews({
      page,
      limit,
      status,
      productId,
      userId,
      sortBy
    })

    // Get pending count for badge
    const pendingCount = await getPendingReviewsCount()

    // Get products for dropdown
    const products = await getProductsForReviewDropdown()

    return NextResponse.json({
      reviews,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      pendingCount,
      products
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

// POST - Create a review manually (admin only)
export async function POST(request: NextRequest) {
  const verification = await verifyAdminAuthFromRequest(request)

  if (!verification.isAdmin) {
    return NextResponse.json(
      { error: 'Unauthorized. Admin privileges required.' },
      { status: 401 }
    )
  }

  try {
    const body = await request.json()
    const { product_id, rating, title, comment, reviewer_name, status } = body

    if (!product_id) {
      return NextResponse.json(
        { error: 'Product is required' },
        { status: 400 }
      )
    }

    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: 'Rating must be between 1 and 5' },
        { status: 400 }
      )
    }

    if (!reviewer_name || reviewer_name.trim().length === 0) {
      return NextResponse.json(
        { error: 'Reviewer name is required' },
        { status: 400 }
      )
    }

    const { review, error } = await createAdminReview({
      product_id,
      rating,
      title: title || undefined,
      comment: comment || undefined,
      reviewer_name,
      status: status || 'approved'
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
      message: 'Review created successfully'
    })
  } catch (error) {
    console.error('Error creating admin review:', error)
    return NextResponse.json(
      { error: 'Failed to create review' },
      { status: 500 }
    )
  }
}
