import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminAuthFromRequest } from '@/lib/admin-auth'
import { moderateReview } from '@/lib/supabase/reviews'
import { supabaseAdmin } from '@/lib/supabase/server'
import { createNotification } from '@/lib/notifications'

export const dynamic = 'force-dynamic'

// PATCH - Moderate a review (approve/reject)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const verification = await verifyAdminAuthFromRequest(request)

  if (!verification.isAdmin) {
    return NextResponse.json(
      { error: 'Unauthorized. Admin privileges required.' },
      { status: 401 }
    )
  }

  try {
    const { id: reviewId } = await params
    const body = await request.json()
    const { status, adminNote } = body as { status: 'approved' | 'rejected'; adminNote?: string }

    if (!status || (status !== 'approved' && status !== 'rejected')) {
      return NextResponse.json(
        { error: 'Status must be "approved" or "rejected"' },
        { status: 400 }
      )
    }

    // Get review info before moderating (for notification)
    const { data: existingReview } = await supabaseAdmin
      .from('reviews')
      .select(`
        *,
        product:products(name)
      `)
      .eq('id', reviewId)
      .single()

    const { review, error } = await moderateReview(reviewId, status, adminNote)

    if (error) {
      return NextResponse.json(
        { error },
        { status: 400 }
      )
    }

    // Send notification to user about review status
    if (existingReview && review) {
      const productName = (existingReview as { product?: { name: string } }).product?.name || 'product'

      if (status === 'approved') {
        await createNotification({
          userId: review.user_id,
          title: 'Review Approved',
          message: `Your review for "${productName}" has been approved and is now visible to other customers.`,
          type: 'system',
          metadata: {
            reviewId: review.id,
            productId: review.product_id,
            status: 'approved'
          }
        })
      } else if (status === 'rejected') {
        await createNotification({
          userId: review.user_id,
          title: 'Review Not Approved',
          message: `Your review for "${productName}" was not approved.${adminNote ? ` Reason: ${adminNote}` : ''}`,
          type: 'system',
          metadata: {
            reviewId: review.id,
            productId: review.product_id,
            status: 'rejected',
            adminNote
          }
        })
      }
    }

    return NextResponse.json({
      success: true,
      review,
      message: `Review ${status} successfully`
    })
  } catch (error) {
    console.error('Error moderating review:', error)
    return NextResponse.json(
      { error: 'Failed to moderate review' },
      { status: 500 }
    )
  }
}

// DELETE - Delete a review (admin)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const verification = await verifyAdminAuthFromRequest(request)

  if (!verification.isAdmin) {
    return NextResponse.json(
      { error: 'Unauthorized. Admin privileges required.' },
      { status: 401 }
    )
  }

  try {
    const { id: reviewId } = await params

    const { error } = await supabaseAdmin
      .from('reviews')
      .delete()
      .eq('id', reviewId)

    if (error) {
      console.error('Error deleting review:', error)
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Review deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting review:', error)
    return NextResponse.json(
      { error: 'Failed to delete review' },
      { status: 500 }
    )
  }
}
