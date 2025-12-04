"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import Image from "next/image"
import Link from "next/link"
import {
  ChevronDown,
  ChevronRight,
  Grid3X3,
  LayoutGrid,
  ShoppingCart,
  Heart,
  ArrowLeft,
  ArrowRight,
  Loader2,
  Check,
} from "lucide-react"
import { getProducts, type ProductFilters } from "@/lib/supabase/products"
import type { Product } from "@/lib/supabase/database.types"
import { Navbar } from "@/components/navbar"
import { MobileCartBar } from "@/components/mobile-cart-bar"
import { useCart } from "@/context/cart-context"
import { useWishlist } from "@/context/wishlist-context"

const series = [
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
const rarities = ["All Rarities", "Common", "Uncommon", "Rare", "Super Rare"]
const sortOptions = ["Featured", "Price: Low to High", "Price: High to Low", "Newest", "Name: A-Z"]

// Map UI sort options to API sort options
const sortMap: Record<string, ProductFilters['sortBy']> = {
  "Featured": "featured",
  "Price: Low to High": "price_asc",
  "Price: High to Low": "price_desc",
  "Newest": "newest",
  "Name: A-Z": "name",
}

export default function CollectionPage() {
  const [filters, setFilters] = useState({
    series: "All Series",
    rarity: "All Rarities",
  })
  const [sortBy, setSortBy] = useState("Featured")
  const [viewMode, setViewMode] = useState<"grid" | "compact">("grid")
  const [currentPage, setCurrentPage] = useState(1)
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const productsPerPage = 8

  const { toggleItem: toggleCart, isInCart } = useCart()
  const { toggleItem: toggleWishlist, isInWishlist } = useWishlist()

  // Fetch products from Supabase
  useEffect(() => {
    async function fetchProducts() {
      setLoading(true)
      setError(null)
      try {
        const data = await getProducts({
          series: filters.series,
          rarity: filters.rarity,
          sortBy: sortMap[sortBy],
        })

        console.log(data)
        setProducts(data)
      } catch (err) {
        setError("Failed to load products. Please try again.")
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchProducts()
  }, [filters, sortBy])

  // Paginate products
  const filteredProducts = products

  const totalPages = Math.ceil(filteredProducts.length / productsPerPage)
  const paginatedProducts = filteredProducts.slice((currentPage - 1) * productsPerPage, currentPage * productsPerPage)

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case "Super Rare":
        return "text-amber-600"
      case "Rare":
        return "text-red-600"
      case "Uncommon":
        return "text-blue-600"
      default:
        return "text-neutral-500"
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm mb-8">
          <Link href="/" className="text-gray-500 hover:text-gray-900 transition-colors">
            Home
          </Link>
          <ChevronRight size={14} className="text-gray-400" />
          <span className="text-gray-900 font-medium">Collection</span>
        </nav>

        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Collection</h1>
            <p className="text-gray-500 mt-1">{filteredProducts.length} cars</p>
          </div>

          {/* Filters Row */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Series Filter */}
            <div className="relative">
              <select
                value={filters.series}
                onChange={(e) => {
                  setFilters((f) => ({ ...f, series: e.target.value }))
                  setCurrentPage(1)
                }}
                className="appearance-none bg-white border border-gray-200 rounded-lg px-4 py-2 pr-10 text-sm text-gray-700 hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 cursor-pointer"
              >
                {series.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={14}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
              />
            </div>

            {/* Rarity Filter */}
            <div className="relative">
              <select
                value={filters.rarity}
                onChange={(e) => {
                  setFilters((f) => ({ ...f, rarity: e.target.value }))
                  setCurrentPage(1)
                }}
                className="appearance-none bg-white border border-gray-200 rounded-lg px-4 py-2 pr-10 text-sm text-gray-700 hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 cursor-pointer"
              >
                {rarities.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={14}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
              />
            </div>

            {/* Sort */}
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="appearance-none bg-white border border-gray-200 rounded-lg px-4 py-2 pr-10 text-sm text-gray-700 hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 cursor-pointer"
              >
                {sortOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={14}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
              />
            </div>

            {/* View Toggle */}
            <div className="hidden sm:flex items-center border border-gray-200 rounded-lg p-1 bg-white">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-1.5 rounded transition-colors ${
                  viewMode === "grid" ? "bg-gray-100 text-gray-900" : "text-gray-400 hover:text-gray-600"
                }`}
              >
                <LayoutGrid size={16} />
              </button>
              <button
                onClick={() => setViewMode("compact")}
                className={`p-1.5 rounded transition-colors ${
                  viewMode === "compact" ? "bg-gray-100 text-gray-900" : "text-gray-400 hover:text-gray-600"
                }`}
              >
                <Grid3X3 size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* Product Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-red-500" />
          </div>
        ) : error ? (
          <div className="text-center py-20">
            <p className="text-red-500">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-3 text-sm text-red-600 hover:text-red-700"
            >
              Try again
            </button>
          </div>
        ) : paginatedProducts.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-500">No cars found</p>
            <button
              onClick={() => {
                setFilters({ series: "All Series", rarity: "All Rarities" })
                setCurrentPage(1)
              }}
              className="mt-3 text-sm text-red-600 hover:text-red-700"
            >
              Clear filters
            </button>
          </div>
        ) : (
          <>
            <div
              className={`grid gap-3 sm:gap-4 ${
                viewMode === "grid"
                  ? "grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
                  : "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5"
              }`}
            >
              {paginatedProducts.map((product, index) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: index * 0.03 }}
                  className="group"
                >
                  <div className="relative bg-white rounded-lg sm:rounded-xl overflow-hidden border border-gray-200 hover:border-gray-300 hover:shadow-lg transition-all">
                    {/* Image - Clickable to detail page */}
                    <Link href={`/product/${product.id}`}>
                      <div
                        className={`relative ${viewMode === "grid" ? "aspect-square" : "aspect-[4/3]"} bg-gray-100 cursor-pointer overflow-hidden`}
                      >
                        <Image
                          src={product.image || "/placeholder.png"}
                          alt={product.name}
                          fill
                          className="group-hover:scale-105 transition-transform duration-300 object-cover"
                        />
                      </div>
                    </Link>

                    {/* Info */}
                    <div className="p-2 sm:p-3 border-t border-gray-100">
                      <Link href={`/product/${product.id}`}>
                        <div className="cursor-pointer">
                          <div className="flex items-center justify-between gap-1 sm:gap-2 mb-1">
                            <span
                              className={`text-[9px] sm:text-[10px] font-medium uppercase tracking-wide ${getRarityColor(product.rarity)}`}
                            >
                              {product.rarity}
                            </span>
                            <span className="text-[9px] sm:text-[10px] text-gray-400">{product.year}</span>
                          </div>
                          <h3 className="font-semibold text-gray-900 text-xs sm:text-sm truncate">{product.name}</h3>
                          <p className="text-[10px] sm:text-[11px] text-gray-500 truncate">{product.series}</p>
                        </div>
                      </Link>

                      <div className="mt-2 sm:mt-3">
                        <span className="font-bold text-gray-900 text-sm sm:text-base block mb-2">₹{product.price.toFixed(2)}</span>

                        {/* Action Buttons */}
                        <div className="flex gap-1.5 sm:gap-2">
                          <button
                            onClick={(e) => {
                              e.preventDefault()
                              e.stopPropagation()
                              toggleCart(product)
                            }}
                            className={`flex-1 px-2 sm:px-3 py-1.5 sm:py-2 rounded-md sm:rounded-lg text-[10px] sm:text-xs font-medium transition-colors flex items-center justify-center gap-1 sm:gap-1.5 ${
                              isInCart(product.id)
                                ? "bg-green-500 text-white hover:bg-green-600"
                                : "bg-red-500 text-white hover:bg-red-600"
                            }`}
                          >
                            {isInCart(product.id) ? (
                              <>
                                <Check size={12} className="sm:w-3.5 sm:h-3.5" />
                                <span className="hidden xs:inline">Added</span>
                              </>
                            ) : (
                              <>
                                <ShoppingCart size={12} className="sm:w-3.5 sm:h-3.5" />
                                <span className="hidden xs:inline">Add</span>
                              </>
                            )}
                          </button>
                          <button
                            onClick={(e) => {
                              e.preventDefault()
                              e.stopPropagation()
                              toggleWishlist(product)
                            }}
                            className={`px-2 sm:px-3 py-1.5 sm:py-2 rounded-md sm:rounded-lg text-[10px] sm:text-xs font-medium transition-colors flex items-center justify-center ${
                              isInWishlist(product.id)
                                ? "bg-red-500 text-white hover:bg-red-600"
                                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                            }`}
                          >
                            <Heart size={14} fill={isInWishlist(product.id) ? "currentColor" : "none"} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-1 mt-10">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-2 text-gray-400 hover:text-gray-900 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <ArrowLeft size={18} />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`w-8 h-8 rounded-lg text-sm transition-colors ${
                      currentPage === page
                        ? "bg-red-500 text-white"
                        : "text-gray-500 hover:text-gray-900 hover:bg-gray-100"
                    }`}
                  >
                    {page}
                  </button>
                ))}
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-2 text-gray-400 hover:text-gray-900 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <ArrowRight size={18} />
                </button>
              </div>
            )}
          </>
        )}
      </main>

      {/* Mobile Cart Bar */}
      <MobileCartBar />

      {/* Bottom padding for mobile cart bar */}
      <div className="h-20 sm:hidden" />
    </div>
  )
}
