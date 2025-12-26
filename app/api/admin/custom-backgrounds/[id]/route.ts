import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'
import type { Database } from '@/lib/supabase/database.types'
import { verifyAdminAuthFromRequest } from '@/lib/admin-auth'
import { deleteImageFromCloudinary, getPublicIdFromUrl } from '@/lib/cloudinary/config'

type CustomBackgroundUpdate = Database['public']['Tables']['custom_backgrounds']['Update']

// Helper to verify admin authentication
async function verifyAdminAuth(request: NextRequest): Promise<NextResponse | null> {
  const verification = await verifyAdminAuthFromRequest(request)

  if (!verification.isAdmin) {
    return NextResponse.json(
      { error: 'Unauthorized. Admin privileges required.' },
      { status: 401 }
    )
  }

  return null
}

// GET - Get a single background
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await verifyAdminAuth(request)
  if (authError) return authError

  const { id } = await params

  const { data, error } = await supabaseAdmin
    .from('custom_backgrounds')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

// PUT - Update a background (mainly for toggling is_common)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await verifyAdminAuth(request)
  if (authError) return authError

  const { id } = await params

  try {
    const body: CustomBackgroundUpdate = await request.json()

    const { data, error } = await supabaseAdmin
      .from('custom_backgrounds')
      .update(body as never)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }
}

// DELETE - Delete a background and its image from Cloudinary
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await verifyAdminAuth(request)
  if (authError) return authError

  const { id } = await params

  // First, get the background to retrieve the image URL
  const { data: background, error: fetchError } = await supabaseAdmin
    .from('custom_backgrounds')
    .select('image')
    .eq('id', id)
    .single()

  if (fetchError) {
    return NextResponse.json({ error: fetchError.message }, { status: 500 })
  }

  // Delete from database
  const { error: deleteError } = await supabaseAdmin
    .from('custom_backgrounds')
    .delete()
    .eq('id', id)

  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 500 })
  }

  // Delete image from Cloudinary
  const bgImage = (background as { image: string | null } | null)?.image
  if (bgImage && bgImage.includes('cloudinary.com')) {
    try {
      const publicId = getPublicIdFromUrl(bgImage)
      if (publicId) {
        await deleteImageFromCloudinary(publicId)
      }
    } catch (error) {
      console.error('Failed to delete background image from Cloudinary:', error)
    }
  }

  return NextResponse.json({ success: true })
}
