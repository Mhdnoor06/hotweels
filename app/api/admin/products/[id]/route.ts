import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'
import type { Database } from '@/lib/supabase/database.types'

type ProductUpdate = Database['public']['Tables']['products']['Update']

// GET - Get a single product
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const { data, error } = await supabaseAdmin
    .from('products')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

// PUT - Update a product
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  try {
    const body: ProductUpdate = await request.json()

    const { data, error } = await supabaseAdmin
      .from('products')
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

// DELETE - Delete a product and its image
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  // First, get the product to retrieve the image URL
  const { data: product, error: fetchError } = await supabaseAdmin
    .from('products')
    .select('image')
    .eq('id', id)
    .single()

  if (fetchError) {
    return NextResponse.json({ error: fetchError.message }, { status: 500 })
  }

  // Delete the product from database
  const { error: deleteError } = await supabaseAdmin
    .from('products')
    .delete()
    .eq('id', id)

  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 500 })
  }

  // Delete the image from storage if it's a Supabase storage URL
  const productImage = (product as { image: string | null } | null)?.image
  if (productImage && productImage.includes('supabase.co/storage')) {
    try {
      // Extract file path from URL (format: .../storage/v1/object/public/products/images/filename.ext)
      const urlParts = productImage.split('/products/')
      if (urlParts.length >= 2) {
        const filePath = urlParts[1] // e.g., "images/filename.ext"
        await supabaseAdmin.storage
          .from('products')
          .remove([filePath])
      }
    } catch (storageError) {
      // Log but don't fail the request if image deletion fails
      console.error('Failed to delete product image:', storageError)
    }
  }

  return NextResponse.json({ success: true })
}
