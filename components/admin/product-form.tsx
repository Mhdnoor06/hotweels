"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { motion } from "framer-motion"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import {
  Package,
  ArrowLeft,
  Upload,
  Save,
  Check,
  Loader2,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react"
import { uploadProductImages } from "@/lib/supabase/storage"
import type { Product } from "@/lib/supabase/database.types"
import { useAdminAuth } from "@/context/admin-auth-context"
import { AdminPageHeader } from "./admin-page-header"

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
const colorOptions = ["Red", "Blue", "Black", "White", "Yellow", "Green", "Orange", "Silver", "Gold"]

interface ProductFormProps {
  productId?: string
}

export function ProductForm({ productId }: ProductFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [previewUrls, setPreviewUrls] = useState<string[]>([])
  const [existingImages, setExistingImages] = useState<string[]>([])
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
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
    color: "",
    stock: "",
    description: "",
    image: "",
    images: [] as string[],
    featured: false,
  })

  const { isAuthenticated, isLoading: authLoading } = useAdminAuth()

  useEffect(() => {
    if (authLoading) return
    
    if (!isAuthenticated) {
      router.push("/admin")
      return
    }

    // If editing, load product data via API
    if (isEditing && productId) {
      setLoading(true)
      fetch(`/api/admin/products/${productId}`, { credentials: 'include' })
        .then(res => res.json())
        .then((product) => {
          if (product && !product.error) {
            const productImages = product.images || []
            setFormData({
              name: product.name,
              series: product.series,
              price: product.price.toString(),
              year: product.year.toString(),
              color: product.color,
              stock: product.stock.toString(),
              description: product.description || "",
              image: product.image,
              images: productImages,
              featured: product.featured || false,
            })
            setExistingImages(productImages)
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
  }, [router, isEditing, productId, isAuthenticated, authLoading])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)
    setSubmitStatus('')

    try {
      // Upload images first if new files are selected
      let imageUrl = formData.image
      let imagesArray = existingImages.length > 0 ? existingImages : formData.images
      
      if (selectedFiles.length > 0) {
        setSubmitStatus(`Uploading ${selectedFiles.length} image${selectedFiles.length > 1 ? 's' : ''}...`)
        const uploadedUrls = await uploadProductImages(selectedFiles)
        if (uploadedUrls.length > 0) {
          // Use first uploaded image as main image if no main image exists
          if (!imageUrl) {
            imageUrl = uploadedUrls[0]
          }
          // Combine existing images with newly uploaded ones (max 4 total)
          imagesArray = [...existingImages, ...uploadedUrls].slice(0, 4)
        } else {
          throw new Error('Failed to upload images')
        }
      }

      setSubmitStatus(isEditing ? 'Updating product...' : 'Creating product...')

      const productData = {
        name: formData.name,
        series: formData.series,
        price: parseFloat(formData.price),
        year: parseInt(formData.year),
        color: formData.color,
        stock: parseInt(formData.stock),
        description: formData.description || null,
        image: imageUrl || "",
        images: imagesArray.length > 0 ? imagesArray : null,
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
        credentials: 'include',
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
    const input = e.target
    const files = Array.from(input.files || [])
    
    // Clear any previous errors first
    setError(null)
    
    if (files.length === 0) {
      // Reset input if no files selected
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
      return
    }

    // Check total images count (existing + new selected files)
    const totalImages = existingImages.length + selectedFiles.length + files.length
    if (totalImages > 4) {
      setError(`Maximum 4 images allowed. You can upload ${4 - existingImages.length - selectedFiles.length} more.`)
      // Reset input on error
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
      return
    }

    // Validate each file
    const validFiles: File[] = []
    for (const file of files) {
      // Check if file is actually a file object
      if (!(file instanceof File)) {
        console.warn('Invalid file object:', file)
        continue
      }

      if (!file.type || !file.type.startsWith('image/')) {
        setError(`"${file.name}" is not a valid image file. Please select only image files.`)
        // Reset input on error
        if (fileInputRef.current) {
          fileInputRef.current.value = ''
        }
        return
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError(`"${file.name}" is too large. Each image size must be less than 5MB.`)
        // Reset input on error
        if (fileInputRef.current) {
          fileInputRef.current.value = ''
        }
        return
      }

      // Check if file is empty
      if (file.size === 0) {
        setError(`"${file.name}" appears to be empty. Please select a valid image file.`)
        // Reset input on error
        if (fileInputRef.current) {
          fileInputRef.current.value = ''
        }
        return
      }

      validFiles.push(file)
    }

    if (validFiles.length === 0) {
      setError('No valid image files were selected.')
      // Reset input on error
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
      return
    }

    // Calculate how many new files we can add
    const availableSlots = 4 - existingImages.length - selectedFiles.length
    const filesToAdd = validFiles.slice(0, availableSlots)
    
    if (filesToAdd.length === 0) {
      setError('No more image slots available.')
      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
      return
    }

    try {
      // Create preview URLs for new files only (keep existing ones)
      const newPreviewUrls: string[] = []
      
      // Create object URLs for new files
      for (const file of filesToAdd) {
        try {
          const objectUrl = URL.createObjectURL(file)
          newPreviewUrls.push(objectUrl)
        } catch (urlError) {
          console.error('Error creating preview URL for file:', file.name, urlError)
          setError(`Failed to create preview for "${file.name}". Please try selecting the file again.`)
          // Clean up any URLs we created
          newPreviewUrls.forEach(url => URL.revokeObjectURL(url))
          // Reset input
          if (fileInputRef.current) {
            fileInputRef.current.value = ''
          }
          return
        }
      }
      
      // Add new files to selected files
      const newFiles = [...selectedFiles, ...filesToAdd]
      setSelectedFiles(newFiles)
      // Keep existing preview URLs and add new ones
      setPreviewUrls([...previewUrls, ...newPreviewUrls])
      
      // If this is the first image, set it as current
      if (existingImages.length === 0 && newFiles.length > 0) {
        setCurrentImageIndex(0)
      }
      
      // Clear error on success
      setError(null)
    } catch (err) {
      console.error('Error processing image files:', err)
      setError('Failed to process image files. Please try again.')
      // Reset input on error
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
      return
    }
    
    // Reset file input after successful processing (use setTimeout to ensure browser has processed)
    setTimeout(() => {
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }, 0)
  }

  const removeSelectedImage = (index: number) => {
    // Revoke the URL for the removed file
    if (previewUrls[index]) {
      URL.revokeObjectURL(previewUrls[index])
    }
    
    const newFiles = selectedFiles.filter((_, i) => i !== index)
    const newPreviewUrls = previewUrls.filter((_, i) => i !== index)
    setSelectedFiles(newFiles)
    setPreviewUrls(newPreviewUrls)
    
    // Adjust current index if needed (accounting for existing images offset)
    const previewIndex = existingImages.length + index
    if (currentImageIndex >= existingImages.length + newPreviewUrls.length) {
      setCurrentImageIndex(Math.max(0, existingImages.length + newPreviewUrls.length - 1))
    } else if (currentImageIndex > previewIndex && currentImageIndex > 0) {
      setCurrentImageIndex(currentImageIndex - 1)
    }
  }

  const removeExistingImage = (index: number) => {
    const newExisting = existingImages.filter((_, i) => i !== index)
    setExistingImages(newExisting)
    setFormData(prev => ({ ...prev, images: newExisting }))
    // Adjust current index if needed
    if (currentImageIndex >= newExisting.length + previewUrls.length) {
      setCurrentImageIndex(Math.max(0, newExisting.length + previewUrls.length - 1))
    } else if (currentImageIndex > index && currentImageIndex > 0) {
      setCurrentImageIndex(currentImageIndex - 1)
    }
  }

  // Handle touch swipe events
  const [touchStart, setTouchStart] = useState<number | null>(null)
  const [touchEnd, setTouchEnd] = useState<number | null>(null)

  const minSwipeDistance = 50

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null)
    setTouchStart(e.targetTouches[0].clientX)
  }

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX)
  }

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return
    
    const distance = touchStart - touchEnd
    const isLeftSwipe = distance > minSwipeDistance
    const isRightSwipe = distance < -minSwipeDistance
    const allImages = [...existingImages, ...previewUrls]
    
    if (isLeftSwipe && allImages.length > 1) {
      setCurrentImageIndex((prev) => (prev < allImages.length - 1 ? prev + 1 : 0))
    }
    if (isRightSwipe && allImages.length > 1) {
      setCurrentImageIndex((prev) => (prev > 0 ? prev - 1 : allImages.length - 1))
    }
  }

  // Cleanup preview URLs on unmount
  useEffect(() => {
    return () => {
      previewUrls.forEach(url => URL.revokeObjectURL(url))
    }
  }, [previewUrls])

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <AdminPageHeader
        title={isEditing ? "Edit Product" : "New Product"}
        icon={Package}
        actions={
          <Link
            href="/admin/products"
            className="flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft size={20} />
            <span className="hidden sm:inline">Back</span>
          </Link>
        }
      />
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
                {/* Images Upload */}
                <div className="lg:col-span-1">
                  <div className="bg-white border border-gray-200 rounded-xl p-3 sm:p-4 lg:sticky lg:top-24">
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2 sm:mb-3">
                      Product Images ({existingImages.length + selectedFiles.length}/4)
                    </label>
                    
                    {/* Swipeable Image Carousel */}
                    <div 
                      className="relative aspect-square rounded-xl bg-gray-50 overflow-hidden mb-3 sm:mb-4 border border-gray-200 group"
                      onTouchStart={onTouchStart}
                      onTouchMove={onTouchMove}
                      onTouchEnd={onTouchEnd}
                    >
                      {(() => {
                        const allImages = [...existingImages, ...previewUrls]
                        const mainImage = allImages[0] || formData.image || "/placeholder.png"
                        const hasMultipleImages = allImages.length > 1
                        
                        return (
                          <>
                            {/* Main Image Display */}
                            <div className="relative w-full h-full">
                              {allImages.length > 0 ? (
                                <Image
                                  src={allImages[currentImageIndex] || mainImage}
                                  alt={`Product image ${currentImageIndex + 1}`}
                                  fill
                                  className="object-contain p-3 sm:p-4"
                                />
                              ) : (
                                <Image
                                  src={mainImage}
                                  alt="Product preview"
                                  fill
                                  className="object-contain p-3 sm:p-4"
                                />
                              )}
                              
                              {/* Remove button overlay */}
                              {allImages.length > 0 && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (currentImageIndex < existingImages.length) {
                                      removeExistingImage(currentImageIndex)
                                    } else {
                                      const previewIndex = currentImageIndex - existingImages.length
                                      removeSelectedImage(previewIndex)
                                    }
                                  }}
                                  className="absolute top-2 right-2 p-2 bg-black/60 hover:bg-black/80 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10"
                                >
                                  <X size={16} />
                                </button>
                              )}
                            </div>

                            {/* Navigation Arrows */}
                            {hasMultipleImages && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => setCurrentImageIndex((prev) => (prev > 0 ? prev - 1 : allImages.length - 1))}
                                  className="absolute left-2 top-1/2 -translate-y-1/2 p-2 bg-black/60 hover:bg-black/80 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                  <ChevronLeft size={20} />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setCurrentImageIndex((prev) => (prev < allImages.length - 1 ? prev + 1 : 0))}
                                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-black/60 hover:bg-black/80 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                  <ChevronRight size={20} />
                                </button>
                              </>
                            )}

                            {/* Dot Indicators */}
                            {hasMultipleImages && (
                              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
                                {allImages.map((_, index) => (
                                  <button
                                    key={index}
                                    type="button"
                                    onClick={() => setCurrentImageIndex(index)}
                                    className={`w-2 h-2 rounded-full transition-all ${
                                      index === currentImageIndex 
                                        ? 'bg-white w-6' 
                                        : 'bg-white/50 hover:bg-white/75'
                                    }`}
                                  />
                                ))}
                              </div>
                            )}

                            {/* Touch swipe hint for mobile */}
                            {hasMultipleImages && (
                              <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-black/60 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                Swipe or use arrows to navigate
                              </div>
                            )}
                          </>
                        )
                      })()}
                    </div>

                    {/* Thumbnail Strip */}
                    {(() => {
                      const allImages = [...existingImages, ...previewUrls]
                      return allImages.length > 0 ? (
                        <div className="flex gap-2 mb-3 sm:mb-4 overflow-x-auto overflow-y-visible pb-3 pt-3">
                          {allImages.map((url, index) => (
                            <div
                              key={index}
                              className="relative shrink-0 group/thumbnail"
                            >
                              <button
                                type="button"
                                onClick={() => setCurrentImageIndex(index)}
                                className={`relative w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                                  index === currentImageIndex 
                                    ? 'border-red-500 ring-2 ring-red-500/20' 
                                    : 'border-gray-200 hover:border-gray-300'
                                }`}
                              >
                                <Image
                                  src={url}
                                  alt={`Thumbnail ${index + 1}`}
                                  fill
                                  className="object-cover"
                                />
                              </button>
                              {/* Remove icon button - always visible */}
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  if (index < existingImages.length) {
                                    removeExistingImage(index)
                                  } else {
                                    const previewIndex = index - existingImages.length
                                    removeSelectedImage(previewIndex)
                                  }
                                }}
                                className="absolute top-0 right-0 w-5 h-5 bg-red-500 hover:bg-red-600 active:bg-red-700 text-white rounded-full flex items-center justify-center shadow-lg z-20 transition-all hover:scale-110 transform -translate-y-1/2 translate-x-1/2"
                                title="Remove image"
                                aria-label="Remove image"
                              >
                                <X size={12} strokeWidth={2.5} />
                              </button>
                            </div>
                          ))}
                        </div>
                      ) : null
                    })()}

                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleImageSelect}
                      accept="image/*"
                      multiple
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        // Reset input value to ensure onChange fires even if same file is selected
                        if (fileInputRef.current) {
                          fileInputRef.current.value = ''
                        }
                        // Small delay to ensure browser processes the reset
                        setTimeout(() => {
                          fileInputRef.current?.click()
                        }, 10)
                      }}
                      disabled={isSubmitting || (existingImages.length + selectedFiles.length) >= 4}
                      className="w-full flex items-center justify-center gap-2 px-3 sm:px-4 py-2.5 sm:py-3 bg-gray-100 hover:bg-gray-200 disabled:bg-gray-50 text-gray-700 disabled:text-gray-400 rounded-xl transition-colors text-sm"
                    >
                      <Upload size={16} className="sm:w-[18px] sm:h-[18px]" />
                      {selectedFiles.length > 0 || existingImages.length > 0 
                        ? `Add More (${4 - existingImages.length - selectedFiles.length} left)` 
                        : 'Select Images'}
                    </button>
                    <p className="text-xs text-gray-500 mt-2 text-center">Max 4 images, 5MB each (uploads on save)</p>
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

                      {/* Series & Color */}
                      <div className="grid sm:grid-cols-2 gap-3 sm:gap-4">
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
    </div>
  )
}
