"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import Link from "next/link"
import { useRouter, usePathname } from "next/navigation"
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Flame,
  LogOut,
  Menu,
  X,
  Plus,
} from "lucide-react"

// Stats data
const stats = [
  {
    label: "Total Revenue",
    value: "$12,459",
    change: "+12.5%",
    trend: "up",
    icon: DollarSign,
  },
  {
    label: "Total Orders",
    value: "284",
    change: "+8.2%",
    trend: "up",
    icon: ShoppingCart,
  },
  {
    label: "Products",
    value: "156",
    change: "+3",
    trend: "up",
    icon: Package,
  },
  {
    label: "Customers",
    value: "1,429",
    change: "+24",
    trend: "up",
    icon: Users,
  },
]

// Recent orders
const recentOrders = [
  {
    id: "HW-2024-001245",
    customer: "John Smith",
    items: 3,
    total: 45.97,
    status: "Processing",
    date: "2 min ago",
  },
  {
    id: "HW-2024-001244",
    customer: "Sarah Johnson",
    items: 1,
    total: 16.99,
    status: "Shipped",
    date: "15 min ago",
  },
  {
    id: "HW-2024-001243",
    customer: "Mike Wilson",
    items: 5,
    total: 72.95,
    status: "Delivered",
    date: "1 hour ago",
  },
  {
    id: "HW-2024-001242",
    customer: "Emily Davis",
    items: 2,
    total: 29.98,
    status: "Processing",
    date: "2 hours ago",
  },
  {
    id: "HW-2024-001241",
    customer: "Chris Brown",
    items: 4,
    total: 58.96,
    status: "Shipped",
    date: "3 hours ago",
  },
]

// Top selling products
const topProducts = [
  { name: "Twin Mill III", sales: 124, revenue: "$1,609" },
  { name: "Bone Shaker", sales: 98, revenue: "$1,469" },
  { name: "Porsche 911 GT3", sales: 87, revenue: "$1,478" },
  { name: "Corvette C8", sales: 76, revenue: "$1,215" },
  { name: "Lamborghini Countach", sales: 64, revenue: "$1,215" },
]

const navItems = [
  { label: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
  { label: "Orders", href: "/admin/orders", icon: ShoppingCart },
  { label: "Products", href: "/admin/products", icon: Package },
]

export function AdminDashboard() {
  const router = useRouter()
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    // Check authentication
    const isAuth = localStorage.getItem("hw_admin_auth")
    if (!isAuth) {
      router.push("/admin")
    }
  }, [router])

  const handleLogout = () => {
    localStorage.removeItem("hw_admin_auth")
    router.push("/admin")
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Delivered":
        return "text-emerald-600 bg-emerald-50"
      case "Shipped":
        return "text-blue-600 bg-blue-50"
      case "Processing":
        return "text-amber-600 bg-amber-50"
      default:
        return "text-neutral-500 bg-neutral-50"
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
          {/* Logo */}
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

          {/* Navigation */}
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

          {/* Logout */}
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
          {/* Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white border border-gray-200 rounded-xl p-5"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                    <stat.icon size={20} className="text-gray-500" />
                  </div>
                  <div
                    className={`flex items-center gap-1 text-xs font-medium ${
                      stat.trend === "up" ? "text-emerald-600" : "text-red-600"
                    }`}
                  >
                    {stat.trend === "up" ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                    {stat.change}
                  </div>
                </div>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                <p className="text-sm text-gray-500 mt-1">{stat.label}</p>
              </motion.div>
            ))}
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Recent Orders */}
            <div className="lg:col-span-2 bg-white border border-gray-200 rounded-xl">
              <div className="flex items-center justify-between p-5 border-b border-gray-200">
                <h2 className="font-semibold text-gray-900">Recent Orders</h2>
                <Link href="/admin/orders" className="text-sm text-red-500 hover:text-red-600 transition-colors">
                  View All
                </Link>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-5 py-3">
                        Order ID
                      </th>
                      <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-5 py-3">
                        Customer
                      </th>
                      <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-5 py-3 hidden sm:table-cell">
                        Items
                      </th>
                      <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-5 py-3">
                        Total
                      </th>
                      <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-5 py-3">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentOrders.map((order) => (
                      <tr
                        key={order.id}
                        className="border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-5 py-4">
                          <span className="text-sm font-medium text-gray-900">{order.id}</span>
                          <p className="text-xs text-gray-500 mt-0.5">{order.date}</p>
                        </td>
                        <td className="px-5 py-4 text-sm text-gray-600">{order.customer}</td>
                        <td className="px-5 py-4 text-sm text-gray-500 hidden sm:table-cell">{order.items}</td>
                        <td className="px-5 py-4 text-sm font-medium text-gray-900">${order.total.toFixed(2)}</td>
                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}
                          >
                            {order.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Top Products */}
            <div className="bg-white border border-gray-200 rounded-xl">
              <div className="flex items-center justify-between p-5 border-b border-gray-200">
                <h2 className="font-semibold text-gray-900">Top Products</h2>
                <Link href="/admin/products" className="text-sm text-red-500 hover:text-red-600 transition-colors">
                  View All
                </Link>
              </div>
              <div className="p-2">
                {topProducts.map((product, index) => (
                  <div
                    key={product.name}
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-xs text-gray-500">
                        {index + 1}
                      </span>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{product.name}</p>
                        <p className="text-xs text-gray-500">{product.sales} sales</p>
                      </div>
                    </div>
                    <span className="text-sm font-medium text-gray-600">{product.revenue}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
