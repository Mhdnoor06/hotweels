"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { motion } from "framer-motion"
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
  ArrowLeft,
  Upload,
  Save,
  Check,
  Loader2,
} from "lucide-react"
import { uploadProductImage } from "@/lib/supabase/storage"
import type { Product } from "@/lib/supabase/database.types"

const navItems = [
  { label: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
  { label: "Orders", href: "/admin/orders", icon: ShoppingCart },
  { label: "Products", href: "/admin/products", icon: Package },
]

const seriesOptions = [
  "HW Dream Garage",
  "HW Legends",
  "HW Originals",
  "HW Muscle Mania",
  "HW Classics",
  "HW Exotics",
  "HW Green Speed",
  "HW J-Imports",
]
const rarityOptions = ["Common", "Uncommon", "Rare", "Super Rare", "Treasure Hunt"]
const colorOptions = ["Red", "Blue", "Black", "White", "Yellow", "Green", "Orange", "Silver", "Gold"]

interface ProductFormProps {
  productId?: string
}

export function ProductForm({ productId }: ProductFormProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [submitStatus, setSubmitStatus] = useState<string>('')

  // Custom input states (Rarity has database constraint, so no custom option)
  const [useCustomSeries, setUseCustomSeries] = useState(false)
  const [useCustomColor, setUseCustomColor] = useState(false)

  const isEditing = !!productId

  const [formData, setFormData] = useState({
    name: "",
    series: "",
    price: "",
    year: new Date().getFullYear().toString(),
    rarity: "" as string,
    color: "",
    stock: "",
    description: "",
    image: "",
    featured: false,
  })

  useEffect(() => {
    const isAuth = localStorage.getItem("hw_admin_auth")
    if (!isAuth) {
      router.push("/admin")
      return
    }

    // If editing, load product data via API
    if (isEditing && productId) {
      setLoading(true)
      fetch(`/api/admin/products/${productId}`)
        .then(res => res.json())
        .then((product) => {
          if (product && !product.error) {
            setFormData({
              name: product.name,
              series: product.series,
              price: product.price.toString(),
              year: product.year.toString(),
              rarity: product.rarity,
              color: product.color,
              stock: product.stock.toString(),
              description: product.description || "",
              image: product.image,
              featured: product.featured || false,
            })
            // Check if values are custom (not in predefined options)
            if (!seriesOptions.includes(product.series)) {
              setUseCustomSeries(true)
            }
            if (!colorOptions.includes(product.color)) {
              setUseCustomColor(true)
            }
          }
          setLoading(false)
        })
        .catch(() => setLoading(false))
    }
  }, [router, isEditing, productId])

  const handleLogout = () => {
    localStorage.removeItem("hw_admin_auth")
    router.push("/admin")
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)
    setSubmitStatus('')

    try {
      // Upload image first if a new file is selected
      let imageUrl = formData.image
      if (selectedFile) {
        setSubmitStatus('Uploading image...')
        const uploadedUrl = await uploadProductImage(selectedFile)
        if (uploadedUrl) {
          imageUrl = uploadedUrl
        } else {
          throw new Error('Failed to upload image')
        }
      }

      setSubmitStatus(isEditing ? 'Updating product...' : 'Creating product...')

      const productData = {
        name: formData.name,
        series: formData.series,
        price: parseFloat(formData.price),
        year: parseInt(formData.year),
        rarity: formData.rarity as Product['rarity'],
        color: formData.color,
        stock: parseInt(formData.stock),
        description: formData.description || null,
        image: imageUrl || "",
        featured: formData.featured,
        rating: 0,
        review_count: 0,
      }

      const url = isEditing && productId
        ? `/api/admin/products/${productId}`
        : '/api/admin/products'

      const response = await fetch(url, {
        method: isEditing ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productData),
      })

      const result = await response.json()

      if (!response.ok || result.error) {
        throw new Error(result.error || 'Failed to save product')
      }

      setIsSubmitting(false)
      setSubmitStatus('')
      setShowSuccess(true)

      setTimeout(() => {
        router.push("/admin/products")
      }, 1500)
    } catch (err) {
      console.error('Error saving product:', err)
      setError(err instanceof Error ? err.message : 'Failed to save product. Please try again.')
      setIsSubmitting(false)
      setSubmitStatus('')
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }))
  }

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file')
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image size must be less than 5MB')
      return
    }

    setError(null)
    setSelectedFile(file)

    // Create preview URL
    const url = URL.createObjectURL(file)
    setPreviewUrl(url)
  }

  // Cleanup preview URL on unmount
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl)
      }
    }
  }, [previewUrl])

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
              const isActive = pathname?.startsWith(item.href)
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
            <Link
              href="/admin/products"
              className="flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft size={20} />
              <span className="hidden sm:inline">Back</span>
            </Link>
          </div>
          <h1 className="text-xl font-semibold text-gray-900">{isEditing ? "Edit Product" : "New Product"}</h1>
          <div className="w-20" />
        </header>

        <main className="flex-1 p-4 lg:p-8">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-red-500" />
            </div>
          ) : showSuccess ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="max-w-md mx-auto text-center py-16"
            >
              <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-6">
                <Check className="w-10 h-10 text-emerald-600" />
              </div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">Product {isEditing ? "Updated" : "Created"}</h2>
              <p className="text-gray-500">Redirecting to products...</p>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit} className="max-w-3xl mx-auto">
              <div className="grid lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
                {/* Image Upload */}
                <div className="lg:col-span-1">
                  <div className="bg-white border border-gray-200 rounded-xl p-3 sm:p-4 lg:sticky lg:top-24">
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2 sm:mb-3">Product Image</label>
                    <div className="relative aspect-square rounded-xl bg-gray-50 overflow-hidden mb-3 sm:mb-4 border border-gray-200">
                      <Image
                        src={previewUrl || formData.image || "/placeholder.png"}
                        alt="Product preview"
                        fill
                        className="object-contain p-3 sm:p-4"
                      />
                      {selectedFile && (
                        <div className="absolute bottom-2 left-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded truncate">
                          {selectedFile.name}
                        </div>
                      )}
                    </div>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleImageSelect}
                      accept="image/*"
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isSubmitting}
                      className="w-full flex items-center justify-center gap-2 px-3 sm:px-4 py-2.5 sm:py-3 bg-gray-100 hover:bg-gray-200 disabled:bg-gray-50 text-gray-700 disabled:text-gray-400 rounded-xl transition-colors text-sm"
                    >
                      <Upload size={16} className="sm:w-[18px] sm:h-[18px]" />
                      {selectedFile ? 'Change Image' : 'Select Image'}
                    </button>
                    <p className="text-xs text-gray-500 mt-2 text-center">Max size: 5MB (uploads on save)</p>
                  </div>
                </div>

                {/* Form Fields */}
                <div className="lg:col-span-2 space-y-4 sm:space-y-6">
                  <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-6">
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Basic Information</h3>

                    <div className="space-y-3 sm:space-y-4">
                      {/* Name */}
                      <div>
                        <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">Product Name *</label>
                        <input
                          type="text"
                          name="name"
                          value={formData.name}
                          onChange={handleChange}
                          placeholder="Enter product name"
                          className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-colors"
                          required
                        />
                      </div>

                      {/* Series & Rarity & Color */}
                      <div className="grid sm:grid-cols-3 gap-3 sm:gap-4">
                        <div>
                          <div className="flex items-center justify-between mb-1.5 sm:mb-2">
                            <label className="block text-xs sm:text-sm font-medium text-gray-700">Series *</label>
                            <button
                              type="button"
                              onClick={() => {
                                setUseCustomSeries(!useCustomSeries)
                                if (!useCustomSeries) {
                                  setFormData(prev => ({ ...prev, series: '' }))
                                }
                              }}
                              className="text-xs text-red-500 hover:text-red-600"
                            >
                              {useCustomSeries ? 'Select' : '+ Custom'}
                            </button>
                          </div>
                          {useCustomSeries ? (
                            <input
                              type="text"
                              name="series"
                              value={formData.series}
                              onChange={handleChange}
                              placeholder="Enter custom series"
                              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-colors"
                              required
                            />
                          ) : (
                            <select
                              name="series"
                              value={formData.series}
                              onChange={handleChange}
                              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 cursor-pointer"
                              required
                            >
                              <option value="">Select series</option>
                              {seriesOptions.map((s) => (
                                <option key={s} value={s}>
                                  {s}
                                </option>
                              ))}
                            </select>
                          )}
                        </div>
                        <div>
                          <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">Rarity *</label>
                          <select
                            name="rarity"
                            value={formData.rarity}
                            onChange={handleChange}
                            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 cursor-pointer"
                            required
                          >
                            <option value="">Select rarity</option>
                            {rarityOptions.map((r) => (
                              <option key={r} value={r}>
                                {r}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <div className="flex items-center justify-between mb-1.5 sm:mb-2">
                            <label className="block text-xs sm:text-sm font-medium text-gray-700">Color *</label>
                            <button
                              type="button"
                              onClick={() => {
                                setUseCustomColor(!useCustomColor)
                                if (!useCustomColor) {
                                  setFormData(prev => ({ ...prev, color: '' }))
                                }
                              }}
                              className="text-xs text-red-500 hover:text-red-600"
                            >
                              {useCustomColor ? 'Select' : '+ Custom'}
                            </button>
                          </div>
                          {useCustomColor ? (
                            <input
                              type="text"
                              name="color"
                              value={formData.color}
                              onChange={handleChange}
                              placeholder="Enter custom color"
                              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-colors"
                              required
                            />
                          ) : (
                            <select
                              name="color"
                              value={formData.color}
                              onChange={handleChange}
                              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 cursor-pointer"
                              required
                            >
                              <option value="">Select color</option>
                              {colorOptions.map((c) => (
                                <option key={c} value={c}>
                                  {c}
                                </option>
                              ))}
                            </select>
                          )}
                        </div>
                      </div>

                      {/* Description */}
                      <div>
                        <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">Description</label>
                        <textarea
                          name="description"
                          value={formData.description}
                          onChange={handleChange}
                          placeholder="Enter product description"
                          rows={3}
                          className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-colors resize-none"
                        />
                      </div>

                      {/* Featured Toggle */}
                      <div className="flex items-center gap-2 sm:gap-3 pt-2">
                        <button
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, featured: !prev.featured }))}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors shrink-0 ${
                            formData.featured ? 'bg-red-500' : 'bg-gray-200'
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              formData.featured ? 'translate-x-6' : 'translate-x-1'
                            }`}
                          />
                        </button>
                        <label className="text-xs sm:text-sm font-medium text-gray-700">
                          Featured Product
                          <span className="block text-xs text-gray-500 font-normal">
                            Show this product in the featured section on homepage
                          </span>
                        </label>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-6">
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Pricing & Inventory</h3>

                    <div className="grid sm:grid-cols-3 gap-3 sm:gap-4">
                      {/* Price */}
                      <div>
                        <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">Price (₹) *</label>
                        <input
                          type="number"
                          name="price"
                          value={formData.price}
                          onChange={handleChange}
                          placeholder="0.00"
                          step="0.01"
                          min="0"
                          className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-colors"
                          required
                        />
                      </div>

                      {/* Stock */}
                      <div>
                        <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">Stock *</label>
                        <input
                          type="number"
                          name="stock"
                          value={formData.stock}
                          onChange={handleChange}
                          placeholder="0"
                          min="0"
                          className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-colors"
                          required
                        />
                      </div>

                      {/* Year */}
                      <div>
                        <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">Year *</label>
                        <input
                          type="number"
                          name="year"
                          value={formData.year}
                          onChange={handleChange}
                          placeholder="2024"
                          min="1968"
                          max={new Date().getFullYear() + 1}
                          className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-colors"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  {/* Error Message */}
                  {error && (
                    <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm">
                      {error}
                    </div>
                  )}

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full flex items-center justify-center gap-2 bg-red-500 hover:bg-red-600 disabled:bg-red-300 text-white font-semibold py-4 rounded-xl transition-colors"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 size={20} className="animate-spin" />
                        {submitStatus || 'Saving...'}
                      </>
                    ) : (
                      <>
                        <Save size={20} />
                        {isEditing ? "Update Product" : "Create Product"}
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          )}
        </main>
      </div>
    </div>
  )
}
