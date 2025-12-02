"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Link from "next/link"
import Image from "next/image"
import { useRouter, usePathname } from "next/navigation"
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
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
} from "lucide-react"

// Sample orders data
const ordersData = [
  {
    id: "HW-2024-001245",
    customer: { name: "John Smith", email: "john@email.com" },
    items: [
      { name: "Twin Mill III", quantity: 2, price: 12.99, image: "/hw/red-hot-wheels-twin-mill-car.jpg" },
      { name: "Bone Shaker", quantity: 1, price: 14.99, image: "/hw/black-hot-wheels-bone-shaker-car.jpg" },
    ],
    total: 40.97,
    status: "Processing",
    date: "Dec 20, 2024",
    address: "123 Main St, New York, NY 10001",
  },
  {
    id: "HW-2024-001244",
    customer: { name: "Sarah Johnson", email: "sarah@email.com" },
    items: [{ name: "Porsche 911 GT3", quantity: 1, price: 16.99, image: "/hw/white-hot-wheels-porsche-911-gt3.jpg" }],
    total: 16.99,
    status: "Shipped",
    date: "Dec 19, 2024",
    address: "456 Oak Ave, Los Angeles, CA 90001",
  },
  {
    id: "HW-2024-001243",
    customer: { name: "Mike Wilson", email: "mike@email.com" },
    items: [
      { name: "Corvette C8", quantity: 2, price: 15.99, image: "/hw/red-hot-wheels-corvette-c8.jpg" },
      { name: "Lamborghini Countach", quantity: 1, price: 18.99, image: "/hw/white-hot-wheels-lamborghini-countach.jpg" },
      { name: "Deora II", quantity: 2, price: 11.99, image: "/hw/orange-hot-wheels-deora-car.jpg" },
    ],
    total: 74.95,
    status: "Delivered",
    date: "Dec 18, 2024",
    address: "789 Pine Rd, Chicago, IL 60601",
  },
  {
    id: "HW-2024-001242",
    customer: { name: "Emily Davis", email: "emily@email.com" },
    items: [
      { name: "Volkswagen Beetle", quantity: 1, price: 9.99, image: "/hw/yellow-hot-wheels-volkswagen-beetle.jpg" },
      { name: "Ford Mustang Boss", quantity: 1, price: 12.99, image: "/hw/green-hot-wheels-ford-mustang-boss.jpg" },
    ],
    total: 22.98,
    status: "Processing",
    date: "Dec 18, 2024",
    address: "321 Elm St, Houston, TX 77001",
  },
  {
    id: "HW-2024-001241",
    customer: { name: "Chris Brown", email: "chris@email.com" },
    items: [
      { name: "Nissan Skyline GT-R", quantity: 2, price: 13.99, image: "/hw/blue-hot-wheels-nissan-skyline-gtr.jpg" },
      { name: "Tesla Cybertruck", quantity: 2, price: 11.99, image: "/hw/silver-hot-wheels-tesla-cybertruck.jpg" },
    ],
    total: 51.96,
    status: "Cancelled",
    date: "Dec 17, 2024",
    address: "654 Maple Dr, Phoenix, AZ 85001",
  },
]

const navItems = [
  { label: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
  { label: "Orders", href: "/admin/orders", icon: ShoppingCart },
  { label: "Products", href: "/admin/products", icon: Package },
]

const statusOptions = ["All", "Processing", "Shipped", "Delivered", "Cancelled"]

export function AdminOrders() {
  const router = useRouter()
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("All")
  const [selectedOrder, setSelectedOrder] = useState<(typeof ordersData)[0] | null>(null)
  const [orders, setOrders] = useState(ordersData)

  useEffect(() => {
    const isAuth = localStorage.getItem("hw_admin_auth")
    if (!isAuth) {
      router.push("/admin")
    }
  }, [router])

  const handleLogout = () => {
    localStorage.removeItem("hw_admin_auth")
    router.push("/admin")
  }

  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customer.email.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === "All" || order.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const updateOrderStatus = (orderId: string, newStatus: string) => {
    setOrders((prev) => prev.map((order) => (order.id === orderId ? { ...order, status: newStatus } : order)))
    if (selectedOrder?.id === orderId) {
      setSelectedOrder({ ...selectedOrder, status: newStatus })
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Delivered":
        return "text-emerald-600 bg-emerald-50 border-emerald-200"
      case "Shipped":
        return "text-blue-600 bg-blue-50 border-blue-200"
      case "Processing":
        return "text-amber-600 bg-amber-50 border-amber-200"
      case "Cancelled":
        return "text-red-600 bg-red-50 border-red-200"
      default:
        return "text-gray-600 bg-gray-50 border-gray-200"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Delivered":
        return CheckCircle
      case "Shipped":
        return Truck
      case "Processing":
        return Clock
      case "Cancelled":
        return XCircle
      default:
        return Clock
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
      <div className="flex-1 flex flex-col min-h-screen">
        <header className="h-16 border-b border-gray-200 bg-white flex items-center justify-between px-4 lg:px-8 sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-gray-400 hover:text-gray-600">
              <Menu size={24} />
            </button>
            <h1 className="text-xl font-semibold text-gray-900">Orders</h1>
          </div>
        </header>

        <main className="flex-1 p-4 lg:p-8">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search orders..."
                className="w-full bg-white border border-gray-200 rounded-xl pl-12 pr-4 py-3 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-colors"
              />
            </div>
            <div className="relative">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="appearance-none bg-white border border-gray-200 rounded-xl px-4 py-3 pr-10 text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 cursor-pointer"
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
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-5 py-4">
                      Order
                    </th>
                    <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-5 py-4">
                      Customer
                    </th>
                    <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-5 py-4 hidden md:table-cell">
                      Date
                    </th>
                    <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-5 py-4">
                      Total
                    </th>
                    <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-5 py-4">
                      Status
                    </th>
                    <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider px-5 py-4">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.map((order) => (
                    <tr
                      key={order.id}
                      className="border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-5 py-4">
                        <span className="text-sm font-medium text-gray-900">{order.id}</span>
                        <p className="text-xs text-gray-500 mt-0.5">{order.items.length} items</p>
                      </td>
                      <td className="px-5 py-4">
                        <p className="text-sm text-gray-900">{order.customer.name}</p>
                        <p className="text-xs text-gray-500">{order.customer.email}</p>
                      </td>
                      <td className="px-5 py-4 text-sm text-gray-500 hidden md:table-cell">{order.date}</td>
                      <td className="px-5 py-4 text-sm font-medium text-gray-900">${order.total.toFixed(2)}</td>
                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusColor(order.status)}`}
                        >
                          {(() => {
                            const Icon = getStatusIcon(order.status)
                            return <Icon size={12} />
                          })()}
                          {order.status}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <button
                          onClick={() => setSelectedOrder(order)}
                          className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                          <Eye size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filteredOrders.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-500">No orders found</p>
              </div>
            )}
          </div>
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
              className="fixed right-0 top-0 bottom-0 w-full max-w-lg bg-white border-l border-gray-200 z-50 overflow-y-auto"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-gray-900">Order Details</h2>
                  <button
                    onClick={() => setSelectedOrder(null)}
                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>

                {/* Order ID & Status */}
                <div className="bg-gray-50 rounded-xl p-4 mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-sm text-gray-500">Order ID</p>
                      <p className="text-lg font-semibold text-gray-900">{selectedOrder.id}</p>
                    </div>
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border ${getStatusColor(selectedOrder.status)}`}
                    >
                      {(() => {
                        const Icon = getStatusIcon(selectedOrder.status)
                        return <Icon size={14} />
                      })()}
                      {selectedOrder.status}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500">Date</p>
                      <p className="text-gray-900">{selectedOrder.date}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Total</p>
                      <p className="text-gray-900 font-semibold">${selectedOrder.total.toFixed(2)}</p>
                    </div>
                  </div>
                </div>

                {/* Customer Info */}
                <div className="mb-6">
                  <h3 className="text-sm font-medium text-gray-500 mb-3">Customer</h3>
                  <div className="bg-gray-50 rounded-xl p-4">
                    <p className="text-gray-900 font-medium">{selectedOrder.customer.name}</p>
                    <p className="text-gray-500 text-sm">{selectedOrder.customer.email}</p>
                    <p className="text-gray-500 text-sm mt-2">{selectedOrder.address}</p>
                  </div>
                </div>

                {/* Order Items */}
                <div className="mb-6">
                  <h3 className="text-sm font-medium text-gray-500 mb-3">Items</h3>
                  <div className="space-y-3">
                    {selectedOrder.items.map((item, index) => (
                      <div key={index} className="flex items-center gap-4 bg-gray-50 rounded-xl p-3">
                        <div className="w-16 h-16 rounded-lg bg-white overflow-hidden flex-shrink-0 border border-gray-200">
                          <Image
                            src={item.image || "/placeholder.svg"}
                            alt={item.name}
                            width={64}
                            height={64}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-gray-900 font-medium truncate">{item.name}</p>
                          <p className="text-gray-500 text-sm">Qty: {item.quantity}</p>
                        </div>
                        <p className="text-gray-900 font-medium">${(item.price * item.quantity).toFixed(2)}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Update Status */}
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-3">Update Status</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {["Processing", "Shipped", "Delivered", "Cancelled"].map((status) => (
                      <button
                        key={status}
                        onClick={() => updateOrderStatus(selectedOrder.id, status)}
                        disabled={selectedOrder.status === status}
                        className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                          selectedOrder.status === status
                            ? "bg-red-500 text-white"
                            : "bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-900"
                        }`}
                      >
                        {status}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
