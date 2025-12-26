import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'
import type { Database } from '@/lib/supabase/database.types'
import { verifyAdminAuthFromRequest } from '@/lib/admin-auth'

type CustomCarUpdate = Database['public']['Tables']['custom_cars']['Update']

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

// GET - Get a single custom car with its backgrounds
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await verifyAdminAuth(request)
  if (authError) return authError

  const { id } = await params

  const { data, error } = await supabaseAdmin
    .from('custom_cars')
    .select(`
      *,
      backgrounds:custom_backgrounds(*)
    `)
    .eq('id', id)
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

// PUT - Update a custom car
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await verifyAdminAuth(request)
  if (authError) return authError

  const { id } = await params

  try {
    const body: CustomCarUpdate = await request.json()

    const { data, error } = await supabaseAdmin
      .from('custom_cars')
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

// DELETE - Delete a custom car and its associated images
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await verifyAdminAuth(request)
  if (authError) return authError

  const { id } = await params

  // First, get the car to retrieve image URLs
  const { data: car, error: fetchError } = await supabaseAdmin
    .from('custom_cars')
    .select('transparent_image')
    .eq('id', id)
    .single()

  if (fetchError) {
    return NextResponse.json({ error: fetchError.message }, { status: 500 })
  }

  // Get associated backgrounds to delete their images
  const { data: backgrounds } = await supabaseAdmin
    .from('custom_backgrounds')
    .select('image')
    .eq('car_id', id)

  // Delete the car from database (backgrounds will cascade delete)
  const { error: deleteError } = await supabaseAdmin
    .from('custom_cars')
    .delete()
    .eq('id', id)

  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 500 })
  }

  // Delete the car image from storage
  const carImage = (car as { transparent_image: string | null } | null)?.transparent_image
  if (carImage && carImage.includes('supabase.co/storage')) {
    try {
      const urlParts = carImage.split('/products/')
      if (urlParts.length >= 2) {
        const filePath = urlParts[1]
        await supabaseAdmin.storage.from('products').remove([filePath])
      }
    } catch (storageError) {
      console.error('Failed to delete car image:', storageError)
    }
  }

  // Delete background images from storage
  if (backgrounds && Array.isArray(backgrounds)) {
    for (const bg of backgrounds) {
      const bgImage = (bg as { image: string | null })?.image
      if (bgImage && bgImage.includes('supabase.co/storage')) {
        try {
          const urlParts = bgImage.split('/products/')
          if (urlParts.length >= 2) {
            const filePath = urlParts[1]
            await supabaseAdmin.storage.from('products').remove([filePath])
          }
        } catch (storageError) {
          console.error('Failed to delete background image:', storageError)
        }
      }
    }
  }

  return NextResponse.json({ success: true })
}
