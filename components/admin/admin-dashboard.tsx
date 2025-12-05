"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import Image from "next/image"
import Link from "next/link"
import { useRouter, usePathname } from "next/navigation"
import { useAdminAuth } from "@/context/admin-auth-context"
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Settings,
  Users,
  TrendingUp,
  DollarSign,
  Flame,
  LogOut,
  Menu,
  X,
  Plus,
  Loader2,
  Truck,
} from "lucide-react"
import type { Order, OrderItem } from "@/lib/supabase/database.types"

type OrderWithItems = Order & {
  order_items: (OrderItem & { product: { name: string; image: string } | null })[]
  user: { name: string | null; email: string } | null
}

const navItems = [
  { label: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
  { label: "Orders", href: "/admin/orders", icon: ShoppingCart },
  { label: "Products", href: "/admin/products", icon: Package },
  { label: "ShipRocket", href: "/admin/shiprocket", icon: Truck },
  { label: "Settings", href: "/admin/settings", icon: Settings },
]

type Stats = {
  totalRevenue: number
  totalOrders: number
  totalProducts: number
  totalCustomers: number
}

type TopProduct = {
  name: string
  sales: number
  revenue: number
}

export function AdminDashboard() {
  const router = useRouter()
  const pathname = usePathname()
  const { isAuthenticated, isLoading: authLoading, logout } = useAdminAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<Stats | null>(null)
  const [recentOrders, setRecentOrders] = useState<OrderWithItems[]>([])
  const [topProducts, setTopProducts] = useState<TopProduct[]>([])

  useEffect(() => {
    if (authLoading) return
    
    if (!isAuthenticated) {
      router.push("/admin")
      return
    }

    async function fetchDashboardData() {
      setLoading(true)
      try {
        const [statsRes, ordersRes, productsRes] = await Promise.all([
          fetch('/api/admin/dashboard?type=stats', { credentials: 'include' }),
          fetch('/api/admin/dashboard?type=recent-orders&limit=5', { credentials: 'include' }),
          fetch('/api/admin/dashboard?type=top-products&limit=5', { credentials: 'include' }),
        ])

        const [statsData, ordersData, productsData] = await Promise.all([
          statsRes.json(),
          ordersRes.json(),
          productsRes.json(),
        ])

        setStats(statsData)
        if (Array.isArray(ordersData)) setRecentOrders(ordersData)
        if (Array.isArray(productsData)) setTopProducts(productsData)
      } catch (err) {
        console.error('Error fetching dashboard data:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [router, isAuthenticated, authLoading])

  const handleLogout = async () => {
    await logout()
    router.push("/admin")
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "delivered":
        return "text-emerald-600 bg-emerald-50"
      case "shipped":
        return "text-blue-600 bg-blue-50"
      case "processing":
      case "pending":
        return "text-amber-600 bg-amber-50"
      case "cancelled":
        return "text-red-600 bg-red-50"
      default:
        return "text-neutral-500 bg-neutral-50"
    }
  }

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins} min ago`
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`
  }

  const statsDisplay = [
    {
      label: "Total Revenue",
      value: stats ? `₹${stats.totalRevenue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : '-',
      icon: DollarSign,
    },
    {
      label: "Total Orders",
      value: stats?.totalOrders.toString() || '-',
      icon: ShoppingCart,
    },
    {
      label: "Products",
      value: stats?.totalProducts.toString() || '-',
      icon: Package,
    },
    {
      label: "Customers",
      value: stats?.totalCustomers.toLocaleString() || '-',
      icon: Users,
    },
  ]

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/20 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-gradient-to-b from-white to-gray-50/50 border-r border-gray-200/80 shadow-lg lg:shadow-none transform transition-all duration-300 ease-out lg:transform-none ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}
      >
        <div className="flex flex-col h-full backdrop-blur-sm">
          {/* Logo */}
          <div className="flex items-center justify-between h-20 px-6 border-b border-gray-200/60 bg-white/50 backdrop-blur-md">
            <Link href="/admin/dashboard" className="flex items-center gap-3 group">
              <div className="relative">
                <Image 
                  src="/darklogo.jpg" 
                  alt="Wheels Frams" 
                  width={100} 
                  height={100}
                  className="h-10 w-10 object-cover rounded-full transition-transform duration-300 group-hover:scale-105"
                  priority
                />
              </div>
              <span className="text-lg font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                Admin
              </span>
            </Link>
            <button 
              onClick={() => setSidebarOpen(false)} 
              className="lg:hidden text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg p-1.5 transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
            {navItems.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`group relative flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                    isActive 
                      ? "bg-gradient-to-r from-red-500 to-red-600 text-white shadow-md shadow-red-500/20" 
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-100/80"
                  }`}
                >
                  {isActive && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-white rounded-r-full" />
                  )}
                  <item.icon 
                    size={20} 
                    className={`transition-transform duration-200 ${isActive ? "text-white scale-110" : "group-hover:scale-110 text-gray-500 group-hover:text-gray-700"}`} 
                  />
                  <span className="relative z-10">{item.label}</span>
                  {isActive && (
                    <div className="absolute inset-0 bg-gradient-to-r from-red-500/10 to-transparent rounded-xl" />
                  )}
                </Link>
              )
            })}
          </nav>

          {/* Logout */}
          <div className="p-4 border-t border-gray-200/60 bg-white/30 backdrop-blur-sm">
            <button
              onClick={handleLogout}
              className="group flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-medium text-gray-600 hover:text-red-600 hover:bg-red-50 transition-all duration-200 border border-transparent hover:border-red-100"
            >
              <LogOut 
                size={20} 
                className="transition-transform duration-200 group-hover:scale-110 group-hover:rotate-12" 
              />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Top Bar */}
        <header className="h-16 border-b border-gray-200 bg-white flex items-center justify-between px-4 lg:px-8 sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-gray-400 hover:text-gray-600">
              <Menu size={24} />
            </button>
            <h1 className="text-xl font-semibold text-gray-900">Dashboard</h1>
          </div>
          <Link
            href="/admin/products/new"
            className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            <Plus size={16} />
            <span className="hidden sm:inline">Add Product</span>
          </Link>
        </header>

        {/* Dashboard Content */}
        <main className="flex-1 p-4 lg:p-8">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-red-500" />
            </div>
          ) : (
          <>
          {/* Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
            {statsDisplay.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white border border-gray-200 rounded-xl p-4 sm:p-5"
              >
                <div className="flex items-center justify-between mb-2 sm:mb-3">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                    <stat.icon size={18} className="sm:w-5 sm:h-5 text-gray-500" />
                  </div>
                  <div className="flex items-center gap-1 text-xs font-medium text-emerald-600">
                    <TrendingUp size={12} className="sm:w-3.5 sm:h-3.5" />
                  </div>
                </div>
                <p className="text-xl sm:text-2xl font-bold text-gray-900 truncate">{stat.value}</p>
                <p className="text-xs sm:text-sm text-gray-500 mt-1 line-clamp-1">{stat.label}</p>
              </motion.div>
            ))}
          </div>

          <div className="grid lg:grid-cols-3 gap-4 sm:gap-6">
            {/* Recent Orders */}
            <div className="lg:col-span-2 bg-white border border-gray-200 rounded-xl overflow-hidden">
              <div className="flex items-center justify-between p-4 sm:p-5 border-b border-gray-200">
                <h2 className="text-sm sm:text-base font-semibold text-gray-900">Recent Orders</h2>
                <Link href="/admin/orders" className="text-xs sm:text-sm text-red-500 hover:text-red-600 transition-colors">
                  View All
                </Link>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[600px]">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-4 sm:px-5 py-2 sm:py-3">
                        Order ID
                      </th>
                      <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-4 sm:px-5 py-2 sm:py-3 hidden sm:table-cell">
                        Customer
                      </th>
                      <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-4 sm:px-5 py-2 sm:py-3 hidden md:table-cell">
                        Items
                      </th>
                      <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-4 sm:px-5 py-2 sm:py-3">
                        Total
                      </th>
                      <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-4 sm:px-5 py-2 sm:py-3">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentOrders.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-4 sm:px-5 py-8 text-center text-sm text-gray-500">
                          No orders yet
                        </td>
                      </tr>
                    ) : (
                      recentOrders.map((order) => (
                        <tr
                          key={order.id}
                          className="border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors"
                        >
                          <td className="px-4 sm:px-5 py-3 sm:py-4">
                            <span className="text-xs sm:text-sm font-medium text-gray-900">{order.id.slice(0, 8)}...</span>
                            <p className="text-xs text-gray-500 mt-0.5 hidden sm:block">{formatTimeAgo(order.created_at)}</p>
                            <p className="text-xs text-gray-500 sm:hidden">{order.user?.name || 'Guest'}</p>
                          </td>
                          <td className="px-4 sm:px-5 py-3 sm:py-4 text-xs sm:text-sm text-gray-600 hidden sm:table-cell">{order.user?.name || order.user?.email || 'Guest'}</td>
                          <td className="px-4 sm:px-5 py-3 sm:py-4 text-xs sm:text-sm text-gray-500 hidden md:table-cell">{order.order_items?.length || 0}</td>
                          <td className="px-4 sm:px-5 py-3 sm:py-4 text-xs sm:text-sm font-medium text-gray-900">₹{order.total.toFixed(2)}</td>
                          <td className="px-4 sm:px-5 py-3 sm:py-4">
                            <span
                              className={`inline-flex px-2 sm:px-2.5 py-1 rounded-full text-xs font-medium capitalize ${getStatusColor(order.status)}`}
                            >
                              {order.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Top Products */}
            <div className="bg-white border border-gray-200 rounded-xl">
              <div className="flex items-center justify-between p-4 sm:p-5 border-b border-gray-200">
                <h2 className="text-sm sm:text-base font-semibold text-gray-900">Top Products</h2>
                <Link href="/admin/products" className="text-xs sm:text-sm text-red-500 hover:text-red-600 transition-colors">
                  View All
                </Link>
              </div>
              <div className="p-2">
                {topProducts.length === 0 ? (
                  <div className="text-center py-8 text-gray-500 text-xs sm:text-sm">No sales data yet</div>
                ) : (
                  topProducts.map((product, index) => (
                    <div
                      key={product.name}
                      className="flex items-center justify-between p-2 sm:p-3 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                        <span className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-gray-100 flex items-center justify-center text-xs text-gray-500 shrink-0">
                          {index + 1}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs sm:text-sm font-medium text-gray-900 truncate">{product.name}</p>
                          <p className="text-xs text-gray-500">{product.sales} sales</p>
                        </div>
                      </div>
                      <span className="text-xs sm:text-sm font-medium text-gray-600 ml-2 shrink-0">₹{product.revenue.toFixed(2)}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
          </>
          )}
        </main>
      </div>
    </div>
  )
}
