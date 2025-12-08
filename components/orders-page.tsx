"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { motion } from "framer-motion"
import { Package, ChevronRight, ShoppingBag, ArrowRight, Loader2, RefreshCw, Truck } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Navbar } from "@/components/navbar"
import { useAuth } from "@/context/auth-context"
import { OrderTracking } from "@/components/order-tracking"
import type { OrderWithItems } from "@/lib/supabase/orders"

export function OrdersPage() {
  const { user, isLoading: authLoading, getAuthHeaders } = useAuth()
  const [orders, setOrders] = useState<OrderWithItems[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null)

  // Track if we've already fetched orders to prevent refetch on tab/window focus
  const hasFetchedRef = useRef(false)
  const currentUserIdRef = useRef<string | null>(null)

  // Fetch orders function
  const fetchOrders = useCallback(async (forceRefresh = false) => {
    if (!user) {
      setOrders([])
      setIsLoading(false)
      hasFetchedRef.current = false
      currentUserIdRef.current = null
      return
    }

    // Skip if already fetched for this user (unless forced)
    if (!forceRefresh && hasFetchedRef.current && currentUserIdRef.current === user.id) {
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/orders', {
        headers: getAuthHeaders(),
      })
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch orders')
      }

      setOrders(data.orders || [])
      hasFetchedRef.current = true
      currentUserIdRef.current = user.id
    } catch (err) {
      console.error('Error fetching orders:', err)
      setError(err instanceof Error ? err.message : 'Failed to load orders')
    } finally {
      setIsLoading(false)
    }
  }, [user, getAuthHeaders])

  // Fetch orders when user is authenticated
  useEffect(() => {
    if (!authLoading) {
      fetchOrders()
    }
  }, [authLoading, fetchOrders])

  const getStatusColor = (status: string) => {
    switch (status) {
      case "delivered":
        return "text-emerald-600 bg-emerald-50"
      case "shipped":
        return "text-blue-600 bg-blue-50"
      case "confirmed":
        return "text-purple-600 bg-purple-50"
      case "pending":
        return "text-amber-600 bg-amber-50"
      case "cancelled":
        return "text-red-600 bg-red-50"
      default:
        return "text-gray-600 bg-gray-50"
    }
  }

  const formatStatus = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  // Loading state
  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-red-500" />
        </div>
      </div>
    )
  }

  // Not authenticated
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="mx-auto max-w-7xl px-3 sm:px-4 py-8 sm:py-12">
          <Card className="border-gray-200 bg-white">
            <CardContent className="flex flex-col items-center justify-center py-12 sm:py-20 px-4">
              <Package className="w-16 h-16 sm:w-20 sm:h-20 text-gray-200 mb-4 sm:mb-6" />
              <h3 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-2 text-center">Sign in to view your orders</h3>
              <p className="text-sm sm:text-base text-gray-500 mb-6 sm:mb-8 text-center max-w-md">
                Track your order status, view order history, and manage returns all in one place.
              </p>
              <div className="flex gap-2 sm:gap-3">
                <Link href="/login?redirect=/orders">
                  <Button className="bg-red-500 hover:bg-red-600 text-sm sm:text-base">Sign In</Button>
                </Link>
                <Link href="/signup?redirect=/orders">
                  <Button variant="outline" className="text-sm sm:text-base">Create Account</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="mx-auto max-w-7xl px-3 sm:px-4 py-8 sm:py-12">
          <Card className="border-gray-200 bg-white">
            <CardContent className="flex flex-col items-center justify-center py-12 sm:py-20 px-4">
              <Package className="w-16 h-16 sm:w-20 sm:h-20 text-gray-200 mb-4 sm:mb-6" />
              <h3 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-2 text-center">Failed to load orders</h3>
              <p className="text-sm sm:text-base text-gray-500 mb-6 sm:mb-8 text-center max-w-md">{error}</p>
              <Button
                onClick={() => fetchOrders(true)}
                className="bg-red-500 hover:bg-red-600 flex items-center gap-2 text-sm sm:text-base"
              >
                <RefreshCw className="w-4 h-4" />
                Try Again
              </Button>
            </CardContent>
          </Card>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <Navbar />

      <main className="mx-auto max-w-7xl px-3 sm:px-4 py-4 sm:py-6 lg:py-10">
        {/* Page Title */}
        <div className="mb-4 sm:mb-8">
          <h1 className="text-xl sm:text-3xl font-bold text-gray-900 flex items-center gap-2 sm:gap-3">
            <Package className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400" />
            My Orders
          </h1>
          <p className="text-sm sm:text-base text-gray-500 mt-1">
            {orders.length} {orders.length === 1 ? 'order' : 'orders'}
          </p>
        </div>

        {orders.length === 0 ? (
          <Card className="border-gray-200 bg-white">
            <CardContent className="flex flex-col items-center justify-center py-12 sm:py-20 px-4">
              <ShoppingBag className="w-16 h-16 sm:w-20 sm:h-20 text-gray-200 mb-4 sm:mb-6" />
              <h3 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-2 text-center">No orders yet</h3>
              <p className="text-sm sm:text-base text-gray-500 mb-6 sm:mb-8 text-center max-w-md">
                Start shopping to see your orders here
              </p>
              <Link href="/collection">
                <Button className="bg-red-500 hover:bg-red-600 flex items-center gap-2 text-sm sm:text-base">
                  Browse Collection
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3 sm:space-y-4">
            {orders.map((order, index) => (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="border-gray-200 bg-white overflow-hidden">
                  <CardContent className="p-0">
                    {/* Order Header */}
                    <div
                      className="p-3 sm:p-6 cursor-pointer hover:bg-gray-50 transition-colors"
                      onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
                        <div className="flex items-start gap-3 sm:gap-4">
                          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0">
                            <Package className="w-5 h-5 sm:w-6 sm:h-6 text-gray-500" />
                          </div>
                          <div>
                            <h4 className="font-semibold text-gray-900 text-sm sm:text-base">
                              Order #{order.id.slice(0, 8).toUpperCase()}
                            </h4>
                            <p className="text-xs sm:text-sm text-gray-500">
                              {formatDate(order.created_at)} | {order.order_items?.length || 0}{' '}
                              {(order.order_items?.length || 0) === 1 ? 'item' : 'items'}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-6 ml-13 sm:ml-0">
                          <span
                            className={`px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-medium ${getStatusColor(order.status)}`}
                          >
                            {formatStatus(order.status)}
                          </span>
                          <span className="font-bold text-gray-900 text-sm sm:text-base">₹{order.total.toFixed(2)}</span>
                          <ChevronRight
                            className={`w-4 h-4 sm:w-5 sm:h-5 text-gray-400 transition-transform ${
                              expandedOrder === order.id ? 'rotate-90' : ''
                            }`}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Expanded Order Details */}
                    {expandedOrder === order.id && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="border-t border-gray-200"
                      >
                        <div className="p-3 sm:p-6 bg-gray-50">
                          <h5 className="font-medium text-gray-900 mb-3 sm:mb-4 text-sm sm:text-base">Order Items</h5>
                          <div className="space-y-2 sm:space-y-3">
                            {order.order_items?.map((item) => (
                              <div key={item.id} className="flex gap-3 sm:gap-4 bg-white p-2.5 sm:p-3 rounded-lg">
                                <div className="relative w-12 h-12 sm:w-16 sm:h-16 rounded-md sm:rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                                  <Image
                                    src={item.product?.image || "/placeholder.png"}
                                    alt={item.product?.name || 'Product'}
                                    fill
                                    className="object-cover"
                                  />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium text-gray-900 truncate text-sm sm:text-base">
                                    {item.product?.name || 'Product'}
                                  </p>
                                  <p className="text-xs sm:text-sm text-gray-500">
                                    {item.product?.series}
                                  </p>
                                  <div className="flex items-center justify-between mt-1">
                                    <span className="text-xs sm:text-sm text-gray-500">Qty: {item.quantity}</span>
                                    <span className="font-medium text-sm sm:text-base">₹{(item.price * item.quantity).toFixed(2)}</span>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>

                          {/* Shipping Address */}
                          {order.shipping_address && (
                            <div className="mt-4 sm:mt-6 pt-3 sm:pt-4 border-t border-gray-200">
                              <h5 className="font-medium text-gray-900 mb-2 text-sm sm:text-base">Shipping Address</h5>
                              <div className="text-xs sm:text-sm text-gray-600">
                                <p>{(order.shipping_address as { fullName?: string })?.fullName}</p>
                                <p>{(order.shipping_address as { address?: string })?.address}</p>
                                <p>
                                  {(order.shipping_address as { city?: string })?.city},{' '}
                                  {(order.shipping_address as { state?: string })?.state}{' '}
                                  {(order.shipping_address as { pincode?: string })?.pincode}
                                </p>
                                <p>{(order.shipping_address as { phone?: string })?.phone}</p>
                              </div>
                            </div>
                          )}

                          {/* Order Tracking */}
                          <OrderTracking orderId={order.id} orderStatus={order.status} />
                        </div>
                      </motion.div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}

        {/* Quick Actions */}
        <div className="mt-8 sm:mt-12 grid sm:grid-cols-2 gap-3 sm:gap-4">
          <Card className="border-gray-200 bg-white hover:shadow-md transition-all">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-start gap-3 sm:gap-4">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-red-50 flex items-center justify-center flex-shrink-0">
                  <ShoppingBag className="w-4 h-4 sm:w-5 sm:h-5 text-red-500" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 text-sm sm:text-base">Continue Shopping</h3>
                  <p className="text-xs sm:text-sm text-gray-500 mt-0.5 sm:mt-1">Explore our latest collection</p>
                  <Link href="/collection" className="text-xs sm:text-sm text-red-500 hover:text-red-600 mt-1.5 sm:mt-2 inline-block">
                    Browse Collection &rarr;
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-gray-200 bg-white hover:shadow-md transition-all">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-start gap-3 sm:gap-4">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                  <Package className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 text-sm sm:text-base">Need Help?</h3>
                  <p className="text-xs sm:text-sm text-gray-500 mt-0.5 sm:mt-1">Contact our support team</p>
                  <button className="text-xs sm:text-sm text-blue-500 hover:text-blue-600 mt-1.5 sm:mt-2">
                    Get Support &rarr;
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
