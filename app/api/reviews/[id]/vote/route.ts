import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { voteOnReview, removeVote } from '@/lib/supabase/reviews'
import type { VoteType } from '@/lib/supabase/database.types'

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

// POST - Add or change vote on a review
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUserFromRequest(request)

    if (!user) {
      return NextResponse.json(
        { error: 'Please sign in to vote on reviews' },
        { status: 401 }
      )
    }

    const { id: reviewId } = await params
    const body = await request.json()
    const { voteType } = body as { voteType: VoteType }

    if (!voteType || (voteType !== 'helpful' && voteType !== 'unhelpful')) {
      return NextResponse.json(
        { error: 'Vote type must be "helpful" or "unhelpful"' },
        { status: 400 }
      )
    }

    const { vote, error } = await voteOnReview(reviewId, user.id, voteType)

    if (error) {
      return NextResponse.json(
        { error },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      vote
    })
  } catch (error) {
    console.error('Error voting on review:', error)
    return NextResponse.json(
      { error: 'Failed to vote on review' },
      { status: 500 }
    )
  }
}

// DELETE - Remove vote from a review
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUserFromRequest(request)

    if (!user) {
      return NextResponse.json(
        { error: 'Please sign in to manage your votes' },
        { status: 401 }
      )
    }

    const { id: reviewId } = await params

    const { success, error } = await removeVote(reviewId, user.id)

    if (error) {
      return NextResponse.json(
        { error },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Vote removed successfully'
    })
  } catch (error) {
    console.error('Error removing vote:', error)
    return NextResponse.json(
      { error: 'Failed to remove vote' },
      { status: 500 }
    )
  }
}
