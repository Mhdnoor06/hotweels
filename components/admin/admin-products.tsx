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
  Plus,
  Edit2,
  Trash2,
  ChevronDown,
} from "lucide-react"

// Products data
const initialProducts = [
  {
    id: 1,
    name: "Twin Mill III",
    series: "HW Dream Garage",
    price: 12.99,
    year: 2024,
    rarity: "Common",
    stock: 45,
    image: "/hw/red-hot-wheels-twin-mill-car.jpg",
  },
  {
    id: 2,
    name: "Bone Shaker",
    series: "HW Legends",
    price: 14.99,
    year: 2024,
    rarity: "Rare",
    stock: 23,
    image: "/hw/black-hot-wheels-bone-shaker-car.jpg",
  },
  {
    id: 3,
    name: "Deora II",
    series: "HW Originals",
    price: 11.99,
    year: 2023,
    rarity: "Common",
    stock: 67,
    image: "/hw/orange-hot-wheels-deora-car.jpg",
  },
  {
    id: 4,
    name: "Rodger Dodger",
    series: "HW Muscle Mania",
    price: 13.99,
    year: 2024,
    rarity: "Uncommon",
    stock: 34,
    image: "/hw/blue-hot-wheels-rodger-dodger-muscle-car.jpg",
  },
  {
    id: 5,
    name: "Volkswagen Beetle",
    series: "HW Classics",
    price: 9.99,
    year: 2023,
    rarity: "Common",
    stock: 89,
    image: "/hw/yellow-hot-wheels-volkswagen-beetle.jpg",
  },
  {
    id: 6,
    name: "Porsche 911 GT3",
    series: "HW Exotics",
    price: 16.99,
    year: 2024,
    rarity: "Rare",
    stock: 12,
    image: "/hw/white-hot-wheels-porsche-911-gt3.jpg",
  },
  {
    id: 7,
    name: "Ford Mustang Boss",
    series: "HW Muscle Mania",
    price: 12.99,
    year: 2024,
    rarity: "Uncommon",
    stock: 56,
    image: "/hw/green-hot-wheels-ford-mustang-boss.jpg",
  },
  {
    id: 8,
    name: "Corvette C8",
    series: "HW Exotics",
    price: 15.99,
    year: 2024,
    rarity: "Rare",
    stock: 8,
    image: "/hw/red-hot-wheels-corvette-c8.jpg",
  },
]

const navItems = [
  { label: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
  { label: "Orders", href: "/admin/orders", icon: ShoppingCart },
  { label: "Products", href: "/admin/products", icon: Package },
]

const seriesOptions = [
  "All Series",
  "HW Dream Garage",
  "HW Legends",
  "HW Originals",
  "HW Muscle Mania",
  "HW Classics",
  "HW Exotics",
  "HW Green Speed",
  "HW J-Imports",
]
const rarityOptions = ["All Rarities", "Common", "Uncommon", "Rare", "Super Rare"]

export function AdminProducts() {
  const router = useRouter()
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [seriesFilter, setSeriesFilter] = useState("All Series")
  const [rarityFilter, setRarityFilter] = useState("All Rarities")
  const [products, setProducts] = useState(initialProducts)
  const [deleteModal, setDeleteModal] = useState<number | null>(null)

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

  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.series.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesSeries = seriesFilter === "All Series" || product.series === seriesFilter
    const matchesRarity = rarityFilter === "All Rarities" || product.rarity === rarityFilter
    return matchesSearch && matchesSeries && matchesRarity
  })

  const handleDelete = (id: number) => {
    setProducts((prev) => prev.filter((p) => p.id !== id))
    setDeleteModal(null)
  }

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case "Super Rare":
        return "text-amber-600"
      case "Rare":
        return "text-red-600"
      case "Uncommon":
        return "text-blue-600"
      default:
        return "text-gray-500"
    }
  }

  const getStockStatus = (stock: number) => {
    if (stock <= 10) return { label: "Low Stock", color: "text-red-600 bg-red-50" }
    if (stock <= 30) return { label: "Medium", color: "text-amber-600 bg-amber-50" }
    return { label: "In Stock", color: "text-emerald-600 bg-emerald-50" }
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
            <h1 className="text-xl font-semibold text-gray-900">Products</h1>
          </div>
          <Link
            href="/admin/products/new"
            className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            <Plus size={16} />
            <span className="hidden sm:inline">Add Product</span>
          </Link>
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
                placeholder="Search products..."
                className="w-full bg-white border border-gray-200 rounded-xl pl-12 pr-4 py-3 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-colors"
              />
            </div>
            <div className="flex gap-3">
              <div className="relative">
                <select
                  value={seriesFilter}
                  onChange={(e) => setSeriesFilter(e.target.value)}
                  className="appearance-none bg-white border border-gray-200 rounded-xl px-4 py-3 pr-10 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 cursor-pointer"
                >
                  {seriesOptions.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
              <div className="relative">
                <select
                  value={rarityFilter}
                  onChange={(e) => setRarityFilter(e.target.value)}
                  className="appearance-none bg-white border border-gray-200 rounded-xl px-4 py-3 pr-10 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 cursor-pointer"
                >
                  {rarityOptions.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Products Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredProducts.map((product, index) => {
              const stockStatus = getStockStatus(product.stock)
              return (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-white border border-gray-200 rounded-xl overflow-hidden group hover:shadow-lg transition-shadow"
                >
                  {/* Image */}
                  <div className="relative aspect-square bg-gray-50">
                    <Image
                      src={product.image || "/placeholder.svg"}
                      alt={product.name}
                      fill
                      className="object-contain p-4"
                    />
                    {/* Actions overlay */}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <Link
                        href={`/admin/products/${product.id}`}
                        className="p-3 bg-white hover:bg-gray-100 rounded-xl text-gray-700 transition-colors"
                      >
                        <Edit2 size={18} />
                      </Link>
                      <button
                        onClick={() => setDeleteModal(product.id)}
                        className="p-3 bg-white hover:bg-red-50 rounded-xl text-red-500 transition-colors"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>

                  {/* Info */}
                  <div className="p-4 border-t border-gray-100">
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-xs font-medium ${getRarityColor(product.rarity)}`}>{product.rarity}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${stockStatus.color}`}>
                        {product.stock} units
                      </span>
                    </div>
                    <h3 className="font-semibold text-gray-900 truncate">{product.name}</h3>
                    <p className="text-sm text-gray-500 truncate">{product.series}</p>
                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                      <span className="text-lg font-bold text-gray-900">${product.price.toFixed(2)}</span>
                      <span className="text-xs text-gray-400">{product.year}</span>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>

          {filteredProducts.length === 0 && (
            <div className="text-center py-16">
              <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No products found</p>
            </div>
          )}
        </main>
      </div>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/20 z-50"
              onClick={() => setDeleteModal(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white border border-gray-200 rounded-2xl p-6 z-50 shadow-xl"
            >
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Delete Product</h3>
              <p className="text-gray-500 mb-6">
                Are you sure you want to delete this product? This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteModal(null)}
                  className="flex-1 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDelete(deleteModal)}
                  className="flex-1 px-4 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl font-medium transition-colors"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
