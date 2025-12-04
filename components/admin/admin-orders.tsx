"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Link from "next/link"
import Image from "next/image"
import { useRouter, usePathname } from "next/navigation"
import { useAdminAuth } from "@/context/admin-auth-context"
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Settings,
  Flame,
  LogOut,
  Menu,
  X,
  Search,
  ChevronDown,
  Eye,
  Truck,
  CheckCircle,
  Clock,
  XCircle,
  Loader2,
  CreditCard,
  ImageIcon,
  BadgeCheck,
  AlertCircle,
} from "lucide-react"
import type { Order, OrderItem } from "@/lib/supabase/database.types"

type OrderWithItems = Order & {
  order_items: (OrderItem & { product: { name: string; image: string; series: string } | null })[]
  user: { name: string | null; email: string } | null
}

const navItems = [
  { label: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
  { label: "Orders", href: "/admin/orders", icon: ShoppingCart },
  { label: "Products", href: "/admin/products", icon: Package },
  { label: "Settings", href: "/admin/settings", icon: Settings },
]

const statusOptions = ["All", "pending", "confirmed", "shipped", "delivered", "cancelled"]

export function AdminOrders() {
  const router = useRouter()
  const pathname = usePathname()
  const { isAuthenticated, isLoading: authLoading, logout } = useAdminAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("All")
  const [selectedOrder, setSelectedOrder] = useState<OrderWithItems | null>(null)
  const [orders, setOrders] = useState<OrderWithItems[]>([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [showPaymentScreenshot, setShowPaymentScreenshot] = useState(false)

  useEffect(() => {
    if (authLoading) return
    
    if (!isAuthenticated) {
      router.push("/admin")
      return
    }

    fetchOrders()
  }, [router, isAuthenticated, authLoading])

  const fetchOrders = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/admin/orders', { credentials: 'include' })
      const data = await response.json()
      if (Array.isArray(data)) {
        setOrders(data)
      }
    } catch (err) {
      console.error('Error fetching orders:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    await logout()
    router.push("/admin")
  }

  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (order.user?.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (order.user?.email || '').toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === "All" || order.status === statusFilter.toLowerCase()
    return matchesSearch && matchesStatus
  })

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    setUpdating(true)
    try {
      const response = await fetch('/api/admin/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ orderId, status: newStatus }),
      })
      if (response.ok) {
        setOrders((prev) => prev.map((order) => (order.id === orderId ? { ...order, status: newStatus.toLowerCase() as OrderWithItems['status'] } : order)))
        if (selectedOrder?.id === orderId) {
          setSelectedOrder({ ...selectedOrder, status: newStatus.toLowerCase() as OrderWithItems['status'] })
        }
      }
    } catch (err) {
      console.error('Error updating order status:', err)
    } finally {
      setUpdating(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "delivered":
        return "text-emerald-600 bg-emerald-50 border-emerald-200"
      case "shipped":
        return "text-blue-600 bg-blue-50 border-blue-200"
      case "pending":
      case "confirmed":
        return "text-amber-600 bg-amber-50 border-amber-200"
      case "cancelled":
        return "text-red-600 bg-red-50 border-red-200"
      default:
        return "text-gray-600 bg-gray-50 border-gray-200"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case "delivered":
        return CheckCircle
      case "shipped":
        return Truck
      case "pending":
      case "confirmed":
        return Clock
      case "cancelled":
        return XCircle
      default:
        return Clock
    }
  }

  const getPaymentStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "verified":
        return "text-emerald-600 bg-emerald-50 border-emerald-200"
      case "verification_pending":
        return "text-amber-600 bg-amber-50 border-amber-200"
      case "cod":
        return "text-blue-600 bg-blue-50 border-blue-200"
      case "failed":
        return "text-red-600 bg-red-50 border-red-200"
      default:
        return "text-gray-600 bg-gray-50 border-gray-200"
    }
  }

  const updatePaymentStatus = async (orderId: string, newStatus: string) => {
    setUpdating(true)
    try {
      const response = await fetch('/api/admin/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ orderId, payment_status: newStatus }),
      })
      if (response.ok) {
        setOrders((prev) => prev.map((order) => (order.id === orderId ? { ...order, payment_status: newStatus.toLowerCase() as OrderWithItems['payment_status'] } : order)))
        if (selectedOrder?.id === orderId) {
          setSelectedOrder({ ...selectedOrder, payment_status: newStatus.toLowerCase() as OrderWithItems['payment_status'] })
        }
      }
    } catch (err) {
      console.error('Error updating payment status:', err)
    } finally {
      setUpdating(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/20 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transform transition-transform lg:transform-none ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}
      >
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200">
            <Link href="/admin/dashboard" className="flex items-center gap-2">
              <Flame className="w-6 h-6 text-red-500" />
              <span className="text-lg font-bold text-gray-900">
                HOT<span className="text-red-500">WHEELS</span>
              </span>
            </Link>
            <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-gray-400 hover:text-gray-600">
              <X size={20} />
            </button>
          </div>

          <nav className="flex-1 p-4 space-y-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                    isActive ? "bg-red-50 text-red-600" : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                  }`}
                >
                  <item.icon size={20} />
                  {item.label}
                </Link>
              )
            })}
          </nav>

          <div className="p-4 border-t border-gray-200">
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
            >
              <LogOut size={20} />
              Logout
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen overflow-hidden">
        <header className="h-16 border-b border-gray-200 bg-white flex items-center justify-between px-4 lg:px-8 sticky top-0 z-30 shrink-0">
          <div className="flex items-center gap-4">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-gray-400 hover:text-gray-600">
              <Menu size={24} />
            </button>
            <h1 className="text-xl font-semibold text-gray-900">Orders</h1>
          </div>
        </header>

        <main className="flex-1 p-4 lg:p-8 overflow-x-hidden">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1 min-w-0">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search orders..."
                className="w-full bg-white border border-gray-200 rounded-xl pl-12 pr-4 py-3 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-colors"
              />
            </div>
            <div className="relative shrink-0">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="appearance-none bg-white border border-gray-200 rounded-xl px-4 py-3 pr-10 text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 cursor-pointer w-full sm:w-auto"
              >
                {statusOptions.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
          </div>

          {/* Orders Table */}
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-red-500" />
            </div>
          ) : (
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden w-full">
            <div className="overflow-x-auto -mx-4 sm:mx-0">
              <div className="inline-block min-w-full align-middle px-4 sm:px-0">
                <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-3 sm:px-4 py-3 whitespace-nowrap">
                      Order
                    </th>
                    <th scope="col" className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-3 sm:px-4 py-3 whitespace-nowrap hidden sm:table-cell">
                      Customer
                    </th>
                    <th scope="col" className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-3 sm:px-4 py-3 whitespace-nowrap hidden md:table-cell">
                      Date
                    </th>
                    <th scope="col" className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-3 sm:px-4 py-3 whitespace-nowrap">
                      Total
                    </th>
                    <th scope="col" className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-3 sm:px-4 py-3 whitespace-nowrap hidden lg:table-cell">
                      Payment
                    </th>
                    <th scope="col" className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-3 sm:px-4 py-3">
                      Status
                    </th>
                    <th scope="col" className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider px-3 sm:px-4 py-3 whitespace-nowrap">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredOrders.map((order) => (
                  <tr
                    key={order.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-3 sm:px-4 py-3 sm:py-4 whitespace-nowrap">
                      <div className="text-xs sm:text-sm">
                        <div className="font-medium text-gray-900">{order.id.slice(0, 8)}...</div>
                        <div className="text-gray-500 mt-0.5">{order.order_items?.length || 0} items</div>
                        <div className="text-gray-500 sm:hidden mt-0.5">{formatDate(order.created_at)}</div>
                        <div className="text-gray-500 sm:hidden mt-0.5">{order.user?.name || 'Guest'}</div>
                      </div>
                    </td>
                    <td className="px-3 sm:px-4 py-3 sm:py-4 whitespace-nowrap hidden sm:table-cell">
                      <div className="text-xs sm:text-sm">
                        <div className="text-gray-900">{order.user?.name || 'Guest'}</div>
                        <div className="text-gray-500">{order.user?.email || '-'}</div>
                      </div>
                    </td>
                    <td className="px-3 sm:px-4 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500 hidden md:table-cell">
                      {formatDate(order.created_at)}
                    </td>
                    <td className="px-3 sm:px-4 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm font-medium text-gray-900">
                      ₹{order.total.toFixed(2)}
                    </td>
                    <td className="px-3 sm:px-4 py-3 sm:py-4 whitespace-nowrap hidden lg:table-cell">
                      <div className="flex flex-col gap-1">
                        <span className="text-xs text-gray-500 uppercase">{order.payment_method || 'cod'}</span>
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border w-fit ${getPaymentStatusColor(order.payment_status || 'pending')}`}
                        >
                          {order.payment_status === 'verification_pending' ? (
                            <AlertCircle size={10} />
                          ) : order.payment_status === 'verified' ? (
                            <BadgeCheck size={10} />
                          ) : null}
                          {order.payment_status === 'verification_pending' ? 'Pending' : order.payment_status || 'pending'}
                        </span>
                      </div>
                    </td>
                    <td className="px-3 sm:px-4 py-3 sm:py-4">
                      <span
                        className={`inline-flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1 rounded-full text-xs font-medium border capitalize whitespace-nowrap ${getStatusColor(order.status)}`}
                      >
                        {(() => {
                          const Icon = getStatusIcon(order.status)
                          return <Icon size={10} className="sm:w-3 sm:h-3 shrink-0" />
                        })()}
                        <span>{order.status}</span>
                      </span>
                    </td>
                    <td className="px-3 sm:px-4 py-3 sm:py-4 whitespace-nowrap text-right">
                      <button
                        onClick={() => setSelectedOrder(order)}
                        className="p-1.5 sm:p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors inline-flex items-center justify-center"
                      >
                        <Eye size={16} className="sm:w-[18px] sm:h-[18px]" />
                      </button>
                    </td>
                  </tr>
                  ))}
                </tbody>
              </table>
              </div>
            </div>

            {filteredOrders.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-500">No orders found</p>
              </div>
            )}
          </div>
          )}
        </main>
      </div>

      {/* Order Detail Modal */}
      <AnimatePresence>
        {selectedOrder && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/20 z-50"
              onClick={() => setSelectedOrder(null)}
            />
            <motion.div
              initial={{ opacity: 0, x: 300 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 300 }}
              className="fixed right-0 top-0 bottom-0 w-full sm:max-w-lg bg-white border-l border-gray-200 z-50 overflow-y-auto"
            >
              <div className="p-4 sm:p-6">
                <div className="flex items-center justify-between mb-4 sm:mb-6">
                  <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Order Details</h2>
                  <button
                    onClick={() => setSelectedOrder(null)}
                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>

                {/* Order ID & Status */}
                <div className="bg-gray-50 rounded-xl p-3 sm:p-4 mb-4 sm:mb-6">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3 sm:mb-4">
                    <div>
                      <p className="text-xs sm:text-sm text-gray-500">Order ID</p>
                      <p className="text-base sm:text-lg font-semibold text-gray-900 break-all">{selectedOrder.id.slice(0, 8)}...</p>
                    </div>
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs sm:text-sm font-medium border capitalize w-fit ${getStatusColor(selectedOrder.status)}`}
                    >
                      {(() => {
                        const Icon = getStatusIcon(selectedOrder.status)
                        return <Icon size={12} className="sm:w-3.5 sm:h-3.5" />
                      })()}
                      {selectedOrder.status}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-3 sm:gap-4 text-xs sm:text-sm">
                    <div>
                      <p className="text-gray-500">Date</p>
                      <p className="text-gray-900">{formatDate(selectedOrder.created_at)}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Total</p>
                      <p className="text-gray-900 font-semibold">₹{selectedOrder.total.toFixed(2)}</p>
                    </div>
                  </div>
                </div>

                {/* Payment Info */}
                {selectedOrder.payment_method === 'online' && (
                  <div className="mb-6">
                    <h3 className="text-sm font-medium text-gray-500 mb-3">Payment Information</h3>
                    <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500">Method</span>
                        <span className="text-sm font-medium text-gray-900 uppercase flex items-center gap-1.5">
                          <CreditCard size={14} />
                          {selectedOrder.payment_method}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500">Status</span>
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border ${getPaymentStatusColor(selectedOrder.payment_status || 'pending')}`}>
                          {selectedOrder.payment_status === 'verification_pending' ? (
                            <AlertCircle size={12} />
                          ) : selectedOrder.payment_status === 'verified' ? (
                            <BadgeCheck size={12} />
                          ) : null}
                          {selectedOrder.payment_status === 'verification_pending' ? 'Verification Pending' : selectedOrder.payment_status}
                        </span>
                      </div>
                      {selectedOrder.transaction_id && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-500">Transaction ID</span>
                          <span className="text-sm font-mono font-medium text-gray-900">{selectedOrder.transaction_id}</span>
                        </div>
                      )}
                      {selectedOrder.payment_screenshot && (
                        <button
                          onClick={() => setShowPaymentScreenshot(true)}
                          className="w-full flex items-center justify-center gap-2 py-2.5 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                          <ImageIcon size={16} />
                          View Payment Screenshot
                        </button>
                      )}

                      {/* Verify/Reject Payment Buttons */}
                      {selectedOrder.payment_status === 'verification_pending' && (
                        <div className="flex gap-2 pt-2 border-t border-gray-200">
                          <button
                            onClick={() => updatePaymentStatus(selectedOrder.id, 'verified')}
                            disabled={updating}
                            className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
                          >
                            {updating ? <Loader2 size={14} className="animate-spin" /> : <BadgeCheck size={14} />}
                            Verify Payment
                          </button>
                          <button
                            onClick={() => updatePaymentStatus(selectedOrder.id, 'failed')}
                            disabled={updating}
                            className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
                          >
                            {updating ? <Loader2 size={14} className="animate-spin" /> : <XCircle size={14} />}
                            Reject
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* COD Payment Info */}
                {selectedOrder.payment_method === 'cod' && (
                  <div className="mb-6 space-y-4">
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 mb-3">Payment Information</h3>
                      <div className="bg-blue-50 rounded-xl p-4 flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <Truck size={20} className="text-blue-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-blue-900">Cash on Delivery</p>
                          <p className="text-xs text-blue-600">Payment to be collected on delivery</p>
                        </div>
                      </div>
                    </div>

                    {/* Shipping Payment Verification */}
                    {(selectedOrder as any).shipping_charges && (selectedOrder as any).shipping_charges > 0 && (
                      <div>
                        <h3 className="text-sm font-medium text-gray-500 mb-3">Shipping Payment</h3>
                        <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">Shipping Charges</span>
                            <span className="text-sm font-semibold text-gray-900">₹{((selectedOrder as any).shipping_charges || 0).toFixed(2)}</span>
                          </div>
                          
                          {(selectedOrder as any).shipping_payment_screenshot && (
                            <>
                              <button
                                onClick={() => {
                                  setShowPaymentScreenshot(true)
                                }}
                                className="w-full flex items-center justify-center gap-2 py-2.5 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                              >
                                <ImageIcon size={16} />
                                View Shipping Payment Screenshot
                              </button>

                              <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                                <span className="text-xs text-gray-600">Payment Status</span>
                                <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border ${
                                  (selectedOrder as any).shipping_payment_status === 'verified' 
                                    ? 'text-emerald-600 bg-emerald-50 border-emerald-200'
                                    : 'text-amber-600 bg-amber-50 border-amber-200'
                                }`}>
                                  {(selectedOrder as any).shipping_payment_status === 'verified' ? (
                                    <>
                                      <BadgeCheck size={12} />
                                      Verified
                                    </>
                                  ) : (
                                    <>
                                      <Clock size={12} />
                                      Pending Verification
                                    </>
                                  )}
                                </span>
                              </div>

                              {(selectedOrder as any).shipping_payment_status === 'pending' && (
                                <div className="flex gap-2 pt-2 border-t border-gray-200">
                                  <button
                                    onClick={async () => {
                                      setUpdating(true)
                                      try {
                                        const response = await fetch('/api/admin/orders', {
                                          method: 'PATCH',
                                          headers: { 'Content-Type': 'application/json' },
                                          credentials: 'include',
                                          body: JSON.stringify({ 
                                            orderId: selectedOrder.id, 
                                            shipping_payment_status: 'verified' 
                                          }),
                                        })
                                        if (response.ok) {
                                          const updatedOrder = { ...selectedOrder, shipping_payment_status: 'verified' as const }
                                          setSelectedOrder(updatedOrder)
                                          setOrders((prev) => prev.map((order) => 
                                            order.id === selectedOrder.id ? updatedOrder : order
                                          ))
                                          // Auto-confirm order when shipping payment is verified
                                          if (selectedOrder.status === 'pending') {
                                            await updateOrderStatus(selectedOrder.id, 'confirmed')
                                          }
                                        }
                                      } catch (err) {
                                        console.error('Error verifying shipping payment:', err)
                                      } finally {
                                        setUpdating(false)
                                      }
                                    }}
                                    disabled={updating}
                                    className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
                                  >
                                    {updating ? <Loader2 size={14} className="animate-spin" /> : <BadgeCheck size={14} />}
                                    Verify Shipping Payment
                                  </button>
                                </div>
                              )}
                            </>
                          )}

                          {!(selectedOrder as any).shipping_payment_screenshot && (
                            <div className="text-center py-3 text-xs text-gray-500">
                              No shipping payment screenshot uploaded
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Customer Info */}
                <div className="mb-6">
                  <h3 className="text-sm font-medium text-gray-500 mb-3">Customer</h3>
                  <div className="bg-gray-50 rounded-xl p-4">
                    <p className="text-gray-900 font-medium">{selectedOrder.user?.name || 'Guest'}</p>
                    <p className="text-gray-500 text-sm">{selectedOrder.user?.email || '-'}</p>
                    <p className="text-gray-500 text-sm mt-2">{(selectedOrder.shipping_address as { address?: string })?.address || 'No address'}</p>
                  </div>
                </div>

                {/* Order Items */}
                <div className="mb-4 sm:mb-6">
                  <h3 className="text-xs sm:text-sm font-medium text-gray-500 mb-2 sm:mb-3">Items</h3>
                  <div className="space-y-2 sm:space-y-3">
                    {selectedOrder.order_items?.map((item, index) => (
                      <div key={index} className="flex items-center gap-3 sm:gap-4 bg-gray-50 rounded-xl p-2.5 sm:p-3">
                        <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-lg bg-white overflow-hidden shrink-0 border border-gray-200">
                          <Image
                            src={item.product?.image || "/placeholder.png"}
                            alt={item.product?.name || 'Product'}
                            width={64}
                            height={64}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs sm:text-sm text-gray-900 font-medium truncate">{item.product?.name || 'Unknown Product'}</p>
                          <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                        </div>
                        <p className="text-xs sm:text-sm text-gray-900 font-medium shrink-0">₹{(item.price * item.quantity).toFixed(2)}</p>
                      </div>
                    )) || <p className="text-xs sm:text-sm text-gray-500 text-center py-4">No items</p>}
                  </div>
                </div>

                {/* Update Status */}
                <div>
                  <h3 className="text-xs sm:text-sm font-medium text-gray-500 mb-2 sm:mb-3">Update Status</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {["pending", "confirmed", "shipped", "delivered", "cancelled"].map((status) => (
                      <button
                        key={status}
                        onClick={() => updateOrderStatus(selectedOrder.id, status)}
                        disabled={selectedOrder.status === status || updating}
                        className={`px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-colors capitalize ${
                          selectedOrder.status === status
                            ? "bg-red-500 text-white"
                            : "bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-900 disabled:opacity-50"
                        }`}
                      >
                        {updating && selectedOrder.status !== status ? <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 animate-spin mx-auto" /> : status}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Payment Screenshot Modal */}
      <AnimatePresence>
        {showPaymentScreenshot && (selectedOrder?.payment_screenshot || (selectedOrder as any)?.shipping_payment_screenshot) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 z-60 flex items-center justify-center p-4"
            onClick={() => setShowPaymentScreenshot(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="relative max-w-2xl w-full max-h-[90vh] bg-white rounded-2xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              {selectedOrder && (
                <>
                  <div className="flex items-center justify-between p-4 border-b border-gray-200">
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {selectedOrder.payment_screenshot ? 'Payment Screenshot' : 'Shipping Payment Screenshot'}
                      </h3>
                      <p className="text-sm text-gray-500">Order: {selectedOrder.id.slice(0, 8)}...</p>
                    </div>
                    <button
                      onClick={() => setShowPaymentScreenshot(false)}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <X size={20} className="text-gray-500" />
                    </button>
                  </div>

                  {/* Screenshot */}
                  <div className="relative w-full h-[60vh] bg-gray-100">
                    <Image
                      src={(selectedOrder.payment_screenshot || (selectedOrder as any).shipping_payment_screenshot || '') as string}
                      alt={selectedOrder.payment_screenshot ? "Payment Screenshot" : "Shipping Payment Screenshot"}
                      fill
                      className="object-contain"
                    />
                  </div>
                </>
              )}

              {/* Footer with actions */}
              {selectedOrder && selectedOrder.payment_status === 'verification_pending' && (
                <div className="p-4 border-t border-gray-200 flex gap-3">
                  <button
                    onClick={() => {
                      if (selectedOrder) {
                        updatePaymentStatus(selectedOrder.id, 'verified')
                        setShowPaymentScreenshot(false)
                      }
                    }}
                    disabled={updating}
                    className="flex-1 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {updating ? <Loader2 size={18} className="animate-spin" /> : <BadgeCheck size={18} />}
                    Verify Payment
                  </button>
                  <button
                    onClick={() => {
                      if (selectedOrder) {
                        updatePaymentStatus(selectedOrder.id, 'failed')
                        setShowPaymentScreenshot(false)
                      }
                    }}
                    disabled={updating}
                    className="flex-1 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {updating ? <Loader2 size={18} className="animate-spin" /> : <XCircle size={18} />}
                    Reject Payment
                  </button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
