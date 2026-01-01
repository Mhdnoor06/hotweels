import { NextResponse } from 'next/server'
import { notifyNewSignup } from '@/lib/discord'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email, name, provider } = body

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    // Send Discord notification (non-blocking)
    notifyNewSignup({
      email,
      name: name || undefined,
      provider: provider || 'Email/Password',
    }).catch(err => console.error('Discord signup notification failed:', err))

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in signup notification:', error)
    return NextResponse.json(
      { error: 'Failed to send notification' },
      { status: 500 }
    )
  }
}
