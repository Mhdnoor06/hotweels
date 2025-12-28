import { supabase } from './client'
import type { StoreSettings } from './database.types'

// Get store settings (always returns the first/only row)
export async function getStoreSettings(): Promise<StoreSettings | null> {
  const { data, error } = await supabase
    .from('store_settings')
    .select('*')
    .limit(1)
    .maybeSingle()

  if (error) {
    console.error('Error fetching store settings:', error)
    console.error('Error details:', error.message, error.details, error.hint)
    return null
  }

  // If no settings exist, return default settings
  if (!data) {
    return {
      id: '',
      contact_phone: "",
      contact_email: "",
      contact_whatsapp: "",
      upi_qr_code: "",
      upi_id: "",
      cod_enabled: true,
      online_payment_enabled: true,
      cod_charges: 0,
      discount_enabled: false,
      discount_percentage: 0,
      discount_code: "",
      store_name: "Wheels Frams Store",
      store_address: "",
      shipping_charges_collection_enabled: false,
      shipping_charges_amount: 50, // Default shipping amount
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    } as StoreSettings
  }

  // Cast to any to handle missing columns that might not be in the database yet
  const settingsData = data as any
  
  // Only set defaults if the columns are truly missing (undefined), not if they're 0 or have values
  if (settingsData.shipping_charges_amount === null || settingsData.shipping_charges_amount === undefined) {
    console.warn('shipping_charges_amount column missing from database, using default 50')
    settingsData.shipping_charges_amount = 50
  }
  if (settingsData.shipping_charges_collection_enabled === null || settingsData.shipping_charges_collection_enabled === undefined) {
    settingsData.shipping_charges_collection_enabled = false
  }

  return settingsData as StoreSettings
}

// Update store settings
export async function updateStoreSettings(
  settings: Partial<Omit<StoreSettings, 'id' | 'created_at' | 'updated_at'>>
): Promise<StoreSettings | null> {
  // First get the settings ID
  const { data: existing } = await supabase
    .from('store_settings')
    .select('id')
    .limit(1)
    .single()

  if (!existing) {
    console.error('No settings row found')
    return null
  }

  const { data, error } = await supabase
    .from('store_settings')
    .update(settings as never)
    .eq('id', (existing as { id: string }).id)
    .select()
    .single()

  if (error) {
    console.error('Error updating store settings:', error)
    throw error
  }

  return data as StoreSettings | null
}

// Upload QR code image to Supabase storage
export async function uploadQRCode(file: File): Promise<string | null> {
  const fileExt = file.name.split('.').pop()
  const fileName = `qr-code-${Date.now()}.${fileExt}`
  const filePath = `payment/${fileName}`

  const { error: uploadError } = await supabase.storage
    .from('store-assets')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: true
    })

  if (uploadError) {
    console.error('Error uploading QR code:', uploadError)
    throw uploadError
  }

  const { data } = supabase.storage
    .from('store-assets')
    .getPublicUrl(filePath)

  return data.publicUrl
}
