import { v2 as cloudinary } from 'cloudinary'

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

export { cloudinary }

// Upload video to Cloudinary
export async function uploadVideoToCloudinary(
  file: File
): Promise<{ url: string; public_id: string }> {
  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        resource_type: 'video',
        folder: 'hotweels/car-videos',
        allowed_formats: ['mp4', 'webm', 'mov'],
      },
      (error, result) => {
        if (error) {
          reject(error)
        } else if (result) {
          resolve({
            url: result.secure_url,
            public_id: result.public_id,
          })
        }
      }
    )

    uploadStream.end(buffer)
  })
}

// Upload image to Cloudinary (for car transparent images and backgrounds)
export async function uploadImageToCloudinary(
  file: File,
  folder: 'car-images' | 'backgrounds'
): Promise<{ url: string; public_id: string }> {
  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        resource_type: 'image',
        folder: `hotweels/${folder}`,
        allowed_formats: ['png', 'jpg', 'jpeg', 'webp'],
      },
      (error, result) => {
        if (error) {
          reject(error)
        } else if (result) {
          resolve({
            url: result.secure_url,
            public_id: result.public_id,
          })
        }
      }
    )

    uploadStream.end(buffer)
  })
}

// Delete video from Cloudinary
export async function deleteVideoFromCloudinary(publicId: string): Promise<void> {
  await cloudinary.uploader.destroy(publicId, { resource_type: 'video' })
}

// Delete image from Cloudinary
export async function deleteImageFromCloudinary(publicId: string): Promise<void> {
  await cloudinary.uploader.destroy(publicId, { resource_type: 'image' })
}

// Extract public_id from Cloudinary URL
export function getPublicIdFromUrl(url: string): string | null {
  try {
    // URL format: https://res.cloudinary.com/{cloud_name}/{type}/upload/v{version}/{folder}/{public_id}.{ext}
    const regex = /\/v\d+\/(.+)\.\w+$/
    const match = url.match(regex)
    return match ? match[1] : null
  } catch {
    return null
  }
}
