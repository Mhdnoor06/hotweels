import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminAuthFromRequest } from '@/lib/admin-auth'
import { uploadImageToCloudinary } from '@/lib/cloudinary/config'

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

// POST - Upload image to Cloudinary
export async function POST(request: NextRequest) {
  const authError = await verifyAdminAuth(request)
  if (authError) return authError

  try {
    const formData = await request.formData()
    const file = formData.get('image') as File | null
    const type = formData.get('type') as 'car-images' | 'backgrounds' | null

    if (!file) {
      return NextResponse.json({ error: 'No image file provided' }, { status: 400 })
    }

    if (!type || !['car-images', 'backgrounds'].includes(type)) {
      return NextResponse.json(
        { error: 'Invalid type. Must be "car-images" or "backgrounds"' },
        { status: 400 }
      )
    }

    // Validate file type
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Allowed: PNG, JPG, JPEG, WebP' },
        { status: 400 }
      )
    }

    // Validate file size (10MB max for images)
    const maxSize = 10 * 1024 * 1024
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 10MB' },
        { status: 400 }
      )
    }

    const result = await uploadImageToCloudinary(file, type)

    return NextResponse.json({
      url: result.url,
      public_id: result.public_id,
    })
  } catch (error) {
    console.error('Image upload error:', error)
    return NextResponse.json(
      { error: 'Failed to upload image' },
      { status: 500 }
    )
  }
}
