import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'
import { verifyAdminAuthFromRequest } from '@/lib/admin-auth'

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

// GET - Get dashboard statistics
export async function GET(request: NextRequest) {
  // Verify admin authentication
  const authError = await verifyAdminAuth(request)
  if (authError) return authError

  const { searchParams } = new URL(request.url)
  const type = searchParams.get('type') || 'stats'

  try {
    if (type === 'stats') {
      // Get all stats in parallel
      const [productsResult, ordersResult, revenueResult, usersResult] = await Promise.all([
        supabaseAdmin.from('products').select('id', { count: 'exact', head: true }),
        supabaseAdmin.from('orders').select('id', { count: 'exact', head: true }),
        supabaseAdmin.from('orders').select('total'),
        supabaseAdmin.from('users').select('id', { count: 'exact', head: true }),
      ])

      const totalProducts = productsResult.count || 0
      const totalOrders = ordersResult.count || 0
      const totalRevenue = (revenueResult.data as { total: number }[] | null)?.reduce((sum, order) => sum + (order.total || 0), 0) || 0
      const totalCustomers = usersResult.count || 0

      return NextResponse.json({
        totalProducts,
        totalOrders,
        totalRevenue,
        totalCustomers,
      })
    }

    if (type === 'recent-orders') {
      const limit = parseInt(searchParams.get('limit') || '5')

      const { data, error } = await supabaseAdmin
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
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      return NextResponse.json(data)
    }

    if (type === 'top-products') {
      const limit = parseInt(searchParams.get('limit') || '5')

      const { data, error } = await supabaseAdmin
        .from('order_items')
        .select(`
          product_id,
          quantity,
          price,
          product:products(name)
        `)

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
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
      const topProducts = Object.values(productSales)
        .sort((a, b) => b.sales - a.sales)
        .slice(0, limit)

      return NextResponse.json(topProducts)
    }

    return NextResponse.json({ error: 'Invalid type parameter' }, { status: 400 })
  } catch {
    return NextResponse.json({ error: 'Failed to fetch dashboard data' }, { status: 500 })
  }
}
