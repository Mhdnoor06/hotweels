import { supabase } from './client'

const BUCKET_NAME = 'products'

export async function uploadProductImage(file: File): Promise<string | null> {
  // Generate unique filename
  const fileExt = file.name.split('.').pop()
  const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
  const filePath = `images/${fileName}`

  const { error } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false
    })

  if (error) {
    console.error('Error uploading image:', error)
    throw error
  }

  // Get public URL
  const { data } = supabase.storage
    .from(BUCKET_NAME)
    .getPublicUrl(filePath)

  return data.publicUrl
}

export async function deleteProductImage(imageUrl: string): Promise<boolean> {
  // Extract file path from URL
  const urlParts = imageUrl.split(`${BUCKET_NAME}/`)
  if (urlParts.length < 2) return false

  const filePath = urlParts[1]

  const { error } = await supabase.storage
    .from(BUCKET_NAME)
    .remove([filePath])

  if (error) {
    console.error('Error deleting image:', error)
    return false
  }

  return true
}

export async function uploadSettingsImage(file: File): Promise<string | null> {
  // Generate unique filename
  const fileExt = file.name.split('.').pop()
  const fileName = `settings-${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
  const filePath = `settings/${fileName}`

  const { error } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false
    })

  if (error) {
    console.error('Error uploading settings image:', error)
    throw error
  }

  // Get public URL
  const { data } = supabase.storage
    .from(BUCKET_NAME)
    .getPublicUrl(filePath)

  return data.publicUrl
}
