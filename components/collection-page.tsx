"use client"

import type React from "react"

import { useState, useMemo } from "react"
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
  Flame,
  Package,
} from "lucide-react"
import Footer from "./footer"

// Product data
const allProducts = [
  {
    id: 1,
    name: "Twin Mill III",
    series: "HW Dream Garage",
    price: 12.99,
    year: 2024,
    color: "Red",
    rarity: "Common",
    image: "/hw/red-hot-wheels-twin-mill-car.jpg",
  },
  {
    id: 2,
    name: "Bone Shaker",
    series: "HW Legends",
    price: 14.99,
    year: 2024,
    color: "Black",
    rarity: "Rare",
    image: "/hw/black-hot-wheels-bone-shaker-car.jpg",
  },
  {
    id: 3,
    name: "Deora II",
    series: "HW Originals",
    price: 11.99,
    year: 2023,
    color: "Orange",
    rarity: "Common",
    image: "/hw/orange-hot-wheels-deora-car.jpg",
  },
  {
    id: 4,
    name: "Rodger Dodger",
    series: "HW Muscle Mania",
    price: 13.99,
    year: 2024,
    color: "Blue",
    rarity: "Uncommon",
    image: "/hw/blue-hot-wheels-rodger-dodger-muscle-car.jpg",
  },
  {
    id: 5,
    name: "Volkswagen Beetle",
    series: "HW Classics",
    price: 9.99,
    year: 2023,
    color: "Yellow",
    rarity: "Common",
    image: "/hw/yellow-hot-wheels-volkswagen-beetle.jpg",
  },
  {
    id: 6,
    name: "Porsche 911 GT3",
    series: "HW Exotics",
    price: 16.99,
    year: 2024,
    color: "White",
    rarity: "Rare",
    image: "/hw/white-hot-wheels-porsche-911-gt3.jpg",
  },
  {
    id: 7,
    name: "Ford Mustang Boss",
    series: "HW Muscle Mania",
    price: 12.99,
    year: 2024,
    color: "Green",
    rarity: "Uncommon",
    image: "/hw/green-hot-wheels-ford-mustang-boss.jpg",
  },
  {
    id: 8,
    name: "Corvette C8",
    series: "HW Exotics",
    price: 15.99,
    year: 2024,
    color: "Red",
    rarity: "Rare",
    image: "/hw/red-hot-wheels-corvette-c8.jpg",
  },
  {
    id: 9,
    name: "Lamborghini Countach",
    series: "HW Exotics",
    price: 18.99,
    year: 2023,
    color: "White",
    rarity: "Super Rare",
    image: "/hw/white-hot-wheels-lamborghini-countach.jpg",
  },
  {
    id: 10,
    name: "Custom '67 Camaro",
    series: "HW Classics",
    price: 14.99,
    year: 2024,
    color: "Blue",
    rarity: "Uncommon",
    image: "/hw/blue-hot-wheels-67-camaro-classic.jpg",
  },
  {
    id: 11,
    name: "Tesla Cybertruck",
    series: "HW Green Speed",
    price: 11.99,
    year: 2024,
    color: "Silver",
    rarity: "Common",
    image: "/hw/silver-hot-wheels-tesla-cybertruck.jpg",
  },
  {
    id: 12,
    name: "Nissan Skyline GT-R",
    series: "HW J-Imports",
    price: 13.99,
    year: 2023,
    color: "Blue",
    rarity: "Rare",
    image: "/hw/blue-hot-wheels-nissan-skyline-gtr.jpg",
  },
]

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

export default function CollectionPage() {
  const [filters, setFilters] = useState({
    series: "All Series",
    rarity: "All Rarities",
  })
  const [sortBy, setSortBy] = useState("Featured")
  const [viewMode, setViewMode] = useState<"grid" | "compact">("grid")
  const [currentPage, setCurrentPage] = useState(1)
  const [wishlist, setWishlist] = useState<number[]>([])
  const productsPerPage = 8

  // Filter and sort products
  const filteredProducts = useMemo(() => {
    let result = [...allProducts]

    if (filters.series !== "All Series") {
      result = result.filter((p) => p.series === filters.series)
    }
    if (filters.rarity !== "All Rarities") {
      result = result.filter((p) => p.rarity === filters.rarity)
    }

    switch (sortBy) {
      case "Price: Low to High":
        result.sort((a, b) => a.price - b.price)
        break
      case "Price: High to Low":
        result.sort((a, b) => b.price - a.price)
        break
      case "Newest":
        result.sort((a, b) => b.year - a.year)
        break
      case "Name: A-Z":
        result.sort((a, b) => a.name.localeCompare(b.name))
        break
    }

    return result
  }, [filters, sortBy])

  const totalPages = Math.ceil(filteredProducts.length / productsPerPage)
  const paginatedProducts = filteredProducts.slice((currentPage - 1) * productsPerPage, currentPage * productsPerPage)

  const toggleWishlist = (id: number, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setWishlist((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]))
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
        return "text-neutral-500"
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2">
              <Flame className="w-6 h-6 text-red-500" />
              <span className="text-xl font-black tracking-tighter text-gray-900">
                HOT<span className="text-red-500">WHEELS</span>
              </span>
            </Link>
            <nav className="hidden md:flex items-center gap-8">
              <Link href="/" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">
                Home
              </Link>
              <Link href="/collection" className="text-sm text-gray-900 font-medium">
                Collection
              </Link>
            </nav>
            <div className="flex items-center gap-2">
              <Link href="/wishlist" className="relative p-2 text-gray-500 hover:text-gray-900 transition-colors">
                <Heart size={20} />
                {wishlist.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center">
                    {wishlist.length}
                  </span>
                )}
              </Link>
              <Link href="/orders" className="relative p-2 text-gray-500 hover:text-gray-900 transition-colors">
                <Package size={20} />
              </Link>
              <button className="relative p-2 text-gray-500 hover:text-gray-900 transition-colors">
                <ShoppingCart size={20} />
              </button>
            </div>
          </div>
        </div>
      </header>

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
        {paginatedProducts.length === 0 ? (
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
              className={`grid gap-4 ${
                viewMode === "grid"
                  ? "grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
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
                  <div className="relative bg-white rounded-xl overflow-hidden border border-gray-200 hover:border-gray-300 hover:shadow-lg transition-all">
                    {/* Image - Clickable to detail page */}
                    <Link href={`/product/${product.id}`}>
                      <div
                        className={`relative ${viewMode === "grid" ? "aspect-square" : "aspect-[4/3]"} p-4 bg-gray-50 cursor-pointer`}
                      >
                        <Image
                          src={product.image || "/placeholder.svg"}
                          alt={product.name}
                          fill
                          className="object-contain group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                    </Link>

                    {/* Info */}
                    <div className="p-3 border-t border-gray-100">
                      <Link href={`/product/${product.id}`}>
                        <div className="cursor-pointer">
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <span
                              className={`text-[10px] font-medium uppercase tracking-wide ${getRarityColor(product.rarity)}`}
                            >
                              {product.rarity}
                            </span>
                            <span className="text-[10px] text-gray-400">{product.year}</span>
                          </div>
                          <h3 className="font-semibold text-gray-900 text-sm truncate">{product.name}</h3>
                          <p className="text-[11px] text-gray-500 truncate">{product.series}</p>
                        </div>
                      </Link>

                      <div className="mt-3">
                        <span className="font-bold text-gray-900 block mb-2">${product.price.toFixed(2)}</span>

                        {/* Action Buttons */}
                        <div className="flex gap-2">
                          <button
                            onClick={(e) => {
                              e.preventDefault()
                              e.stopPropagation()
                              // Add to cart logic here
                            }}
                            className="flex-1 px-3 py-2 bg-red-500 rounded-lg text-white text-xs font-medium hover:bg-red-600 transition-colors flex items-center justify-center gap-1.5"
                          >
                            <ShoppingCart size={14} />
                            Buy Now
                          </button>
                          <button
                            onClick={(e) => toggleWishlist(product.id, e)}
                            className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-1.5 ${
                              wishlist.includes(product.id)
                                ? "bg-red-500 text-white hover:bg-red-600"
                                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                            }`}
                          >
                            <Heart size={14} fill={wishlist.includes(product.id) ? "currentColor" : "none"} />
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
    </div>
  )
}
