import { supabase } from './client'
import { supabaseAdmin } from './server'
import type { Order, OrderItem, Json } from './database.types'

export type OrderWithItems = Order & {
  order_items: (OrderItem & { product: { name: string; image: string; series: string } | null })[]
  user: { name: string | null; email: string } | null
}

export interface CreateOrderInput {
  user_id: string
  items: {
    product_id: string
    quantity: number
    price: number
  }[]
  shipping_address: {
    fullName: string
    email: string
    phone: string
    address: string
    city: string
    state: string
    pincode: string
  }
  total: number
  payment_method: 'cod' | 'online'
  transaction_id?: string
  payment_screenshot?: string
  discount_amount?: number
}

export async function getOrders(status?: string): Promise<OrderWithItems[]> {
  let query = supabase
    .from('orders')
    .select(`
      *,
      user:users(name, email),
      order_items(
        *,
        product:products(name, image)
      )
    `)
    .order('created_at', { ascending: false })

  if (status && status !== 'All') {
    query = query.eq('status', status.toLowerCase())
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching orders:', error)
    return []
  }

  return (data as OrderWithItems[]) || []
}

export async function getOrderById(id: string): Promise<OrderWithItems | null> {
  const { data, error } = await supabase
    .from('orders')
    .select(`
      *,
      user:users(name, email),
      order_items(
        *,
        product:products(name, image)
      )
    `)
    .eq('id', id)
    .single()

  if (error) {
    console.error('Error fetching order:', error)
    return null
  }

  return data as OrderWithItems
}

export async function updateOrderStatus(id: string, status: string): Promise<boolean> {
  const { error } = await supabase
    .from('orders')
    .update({ status: status.toLowerCase() } as never)
    .eq('id', id)

  if (error) {
    console.error('Error updating order status:', error)
    return false
  }

  return true
}

export async function updatePaymentStatus(id: string, paymentStatus: string): Promise<boolean> {
  const { error } = await supabase
    .from('orders')
    .update({ payment_status: paymentStatus.toLowerCase() } as never)
    .eq('id', id)

  if (error) {
    console.error('Error updating payment status:', error)
    return false
  }

  return true
}

// Dashboard stats
export async function getDashboardStats() {
  const [productsResult, ordersResult, revenueResult, usersResult] = await Promise.all([
    supabase.from('products').select('id', { count: 'exact', head: true }),
    supabase.from('orders').select('id', { count: 'exact', head: true }),
    supabase.from('orders').select('total'),
    supabase.from('users').select('id', { count: 'exact', head: true }),
  ])

  const totalProducts = productsResult.count || 0
  const totalOrders = ordersResult.count || 0
  const totalRevenue = (revenueResult.data as { total: number }[] | null)?.reduce((sum, order) => sum + (order.total || 0), 0) || 0
  const totalCustomers = usersResult.count || 0

  return {
    totalProducts,
    totalOrders,
    totalRevenue,
    totalCustomers,
  }
}

export async function getRecentOrders(limit: number = 5): Promise<OrderWithItems[]> {
  const { data, error } = await supabase
    .from('orders')
    .select(`
      *,
      user:users(name, email),
      order_items(
        *,
        product:products(name, image)
      )
    `)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('Error fetching recent orders:', error)
    return []
  }

  return (data as OrderWithItems[]) || []
}

export async function getTopProducts(limit: number = 5) {
  // Get order items grouped by product with sales count
  const { data, error } = await supabase
    .from('order_items')
    .select(`
      product_id,
      quantity,
      price,
      product:products(name)
    `)

  if (error) {
    console.error('Error fetching top products:', error)
    return []
  }

  // Aggregate sales by product
  const productSales: Record<string, { name: string; sales: number; revenue: number }> = {}

  type OrderItemWithProduct = {
    product_id: string
    quantity: number
    price: number
    product: { name: string } | null
  }

  ;(data as OrderItemWithProduct[] | null)?.forEach((item) => {
    const productId = item.product_id
    const productName = item.product?.name || 'Unknown'

    if (!productSales[productId]) {
      productSales[productId] = { name: productName, sales: 0, revenue: 0 }
    }
    productSales[productId].sales += item.quantity
    productSales[productId].revenue += item.quantity * item.price
  })

  // Sort by sales and return top products
  return Object.values(productSales)
    .sort((a, b) => b.sales - a.sales)
    .slice(0, limit)
}

// Get orders for a specific user (server-side with admin privileges)
// This should only be called from API routes after user authentication is verified
export async function getUserOrders(userId: string): Promise<OrderWithItems[]> {
  const { data, error } = await supabaseAdmin
    .from('orders')
    .select(`
      *,
      order_items(
        *,
        product:products(name, image, series)
      )
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching user orders:', error)
    return []
  }

  return (data as OrderWithItems[]) || []
}

// Create a new order (server-side with admin privileges)
// This should only be called from API routes after user authentication is verified
export async function createOrder(input: CreateOrderInput): Promise<{ order: Order | null; error: string | null }> {
  // Determine payment status based on payment method
  const paymentStatus = input.payment_method === 'cod' ? 'cod' : 'verification_pending'

  // Use supabaseAdmin to bypass RLS since we've already verified the user in the API route
  // Build the order data object - only include discount_amount if it's greater than 0
  // This allows the database default (0) to be used if the column exists, or omits it if it doesn't
  const orderData: Record<string, unknown> = {
    user_id: input.user_id,
    status: 'pending',
    payment_method: input.payment_method,
    payment_status: paymentStatus,
    transaction_id: input.transaction_id || null,
    payment_screenshot: input.payment_screenshot || null,
    total: input.total,
    shipping_address: input.shipping_address as unknown as Json,
  }

  // Include discount_amount (default to 0 if not provided)
  orderData.discount_amount = input.discount_amount || 0

  const { data: order, error: orderError } = await supabaseAdmin
    .from('orders')
    .insert(orderData as never)
    .select()
    .single()

  if (orderError || !order) {
    console.error('Error creating order:', orderError)
    return { order: null, error: orderError?.message || 'Failed to create order' }
  }

  // Create order items
  const createdOrder = order as Order
  const orderItems = input.items.map(item => ({
    order_id: createdOrder.id,
    product_id: item.product_id,
    quantity: item.quantity,
    price: item.price,
  }))

  const { error: itemsError } = await supabaseAdmin
    .from('order_items')
    .insert(orderItems as never)

  if (itemsError) {
    console.error('Error creating order items:', itemsError)
    // Delete the order if items failed
    await supabaseAdmin.from('orders').delete().eq('id', createdOrder.id)
    return { order: null, error: itemsError.message }
  }

  return { order: createdOrder, error: null }
}

// Generate order ID (for display purposes)
export function generateOrderDisplayId(): string {
  const timestamp = Date.now().toString(36).toUpperCase()
  const random = Math.random().toString(36).substring(2, 6).toUpperCase()
  return `HW-${timestamp}-${random}`
}
