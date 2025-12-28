import { supabase } from './client'
import type { Product } from './database.types'

export type ProductFilters = {
  series?: string
  sortBy?: 'featured' | 'price_asc' | 'price_desc' | 'newest' | 'name'
}

export async function getProducts(filters?: ProductFilters): Promise<Product[]> {
  let query = supabase
    .from('products')
    .select('*')

  // Apply filters
  if (filters?.series && filters.series !== 'All Series') {
    query = query.eq('series', filters.series)
  }

  // Apply sorting
  switch (filters?.sortBy) {
    case 'price_asc':
      query = query.order('price', { ascending: true })
      break
    case 'price_desc':
      query = query.order('price', { ascending: false })
      break
    case 'newest':
      query = query.order('year', { ascending: false })
      break
    case 'name':
      query = query.order('name', { ascending: true })
      break
    default:
      query = query.order('created_at', { ascending: false })
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching products:', error)
    throw error
  }

  return data || []
}

export async function getProductById(id: string): Promise<Product | null> {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    console.error('Error fetching product:', error)
    return null
  }

  return data
}

export async function getProductSeries(): Promise<string[]> {
  const { data, error } = await supabase
    .from('products')
    .select('series')

  if (error) {
    console.error('Error fetching series:', error)
    return []
  }

  // Get unique series
  const uniqueSeries = [...new Set((data as { series: string }[] | null)?.map(p => p.series) || [])]
  return ['All Series', ...uniqueSeries]
}

export async function getFeaturedProducts(limit: number = 4): Promise<Product[]> {
  // First try to get featured products
  const { data: featuredData, error: featuredError } = await supabase
    .from('products')
    .select('*')
    .eq('featured', true)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (featuredError) {
    console.error('Error fetching featured products:', featuredError)
    return []
  }

  // If we have featured products, return them
  if (featuredData && featuredData.length > 0) {
    return featuredData
  }

  // Fallback: get the first products by creation date if no featured products
  const { data: fallbackData, error: fallbackError } = await supabase
    .from('products')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (fallbackError) {
    console.error('Error fetching fallback products:', fallbackError)
    return []
  }

  return fallbackData || []
}

// Admin CRUD operations
export async function createProduct(product: Omit<Product, 'id' | 'created_at' | 'updated_at'>): Promise<Product | null> {
  const { data, error } = await supabase
    .from('products')
    .insert(product as never)
    .select()
    .single()

  if (error) {
    console.error('Error creating product:', error)
    throw error
  }

  return data as Product | null
}

export async function updateProduct(id: string, updates: Partial<Product>): Promise<Product | null> {
  const { data, error } = await supabase
    .from('products')
    .update(updates as never)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Error updating product:', error)
    throw error
  }

  return data as Product | null
}

export async function deleteProduct(id: string): Promise<boolean> {
  const { error } = await supabase
    .from('products')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting product:', error)
    throw error
  }

  return true
}
