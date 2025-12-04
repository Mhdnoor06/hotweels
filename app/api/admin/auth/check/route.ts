import { NextRequest, NextResponse } from 'next/server'
import { getTokenFromCookies, verifyAdminToken } from '@/lib/admin-auth'

export async function GET(request: NextRequest) {
  try {
    const token = getTokenFromCookies(request)

    if (!token) {
      return NextResponse.json(
        { authenticated: false },
        { status: 401 }
      )
    }

    const verification = await verifyAdminToken(token)

    if (!verification.isAdmin) {
      return NextResponse.json(
        { authenticated: false },
        { status: 401 }
      )
    }

    return NextResponse.json({
      authenticated: true,
      userId: verification.userId
    })
  } catch (error) {
    console.error('Error checking admin auth:', error)
    return NextResponse.json(
      { authenticated: false },
      { status: 500 }
    )
  }
}

// Also create a session endpoint that returns user info (no sensitive tokens)
export async function POST(request: NextRequest) {
  try {
    const token = getTokenFromCookies(request)

    if (!token) {
      return NextResponse.json(
        { authenticated: false },
        { status: 401 }
      )
    }

    const verification = await verifyAdminToken(token)

    if (!verification.isAdmin) {
      return NextResponse.json(
        { authenticated: false },
        { status: 401 }
      )
    }

    return NextResponse.json({
      authenticated: true,
      user: {
        id: verification.userId,
      }
    })
  } catch (error) {
    console.error('Error getting session:', error)
    return NextResponse.json(
      { authenticated: false },
      { status: 500 }
    )
  }
}

