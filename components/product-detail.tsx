"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Heart,
  ShoppingCart,
  Star,
  ChevronLeft,
  ChevronRight,
  Check,
  Loader2,
  Truck,
  Shield,
} from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { getProductById } from "@/lib/supabase/products"
import type { Product } from "@/lib/supabase/database.types"
import { Navbar } from "@/components/navbar"
import { useCart } from "@/context/cart-context"
import { useWishlist } from "@/context/wishlist-context"

const conditionOptions = ["Mint", "Near Mint", "Excellent", "Good"]

export function ProductDetail({ productId }: { productId: string }) {
  const router = useRouter()
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [settings, setSettings] = useState<{ cod_enabled?: boolean } | null>(null)

  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [selectedCondition, setSelectedCondition] = useState<string | null>(null)
  const [quantity, setQuantity] = useState(1)
  const [touchStart, setTouchStart] = useState<number | null>(null)
  const [touchEnd, setTouchEnd] = useState<number | null>(null)

  const { addItem: addToCart, isInCart } = useCart()
  const { toggleItem: toggleWishlist, isInWishlist } = useWishlist()

  useEffect(() => {
    async function fetchProduct() {
      setLoading(true)
      setError(null)
      try {
        const data = await getProductById(productId)
        if (!data) {
          setError('Product not found')
        } else {
          setProduct(data)
        }
      } catch (err) {
        setError('Failed to load product')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchProduct()
  }, [productId])

  // Fetch store settings
  useEffect(() => {
    async function fetchSettings() {
      try {
        const res = await fetch("/api/settings", { cache: 'no-store' })
        if (res.ok) {
          const data = await res.json()
          setSettings(data.settings)
        }
      } catch (err) {
        console.error("Error fetching settings:", err)
      }
    }
    fetchSettings()
  }, [])

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-red-500" />
      </div>
    )
  }

  // Error state
  if (error || !product) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-4">
        <p className="text-gray-500">{error || 'Product not found'}</p>
        <Link href="/collection" className="text-red-500 hover:text-red-600">
          Back to Collection
        </Link>
      </div>
    )
  }

  // Get images from product - use images array if available, otherwise fall back to single image
  const productImage = product.image || "/placeholder.png"
  const hasImage = !!product.image
  const productImages = product.images && product.images.length > 0 ? product.images : (product.image ? [product.image] : [])
  const images = productImages.length > 0 ? productImages : [productImage]
  const hasMultipleImages = images.length > 1

  const originalPrice = product.price * 1.2
  const discount = Math.round(((originalPrice - product.price) / originalPrice) * 100)

  const nextImage = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation()
    if (!hasMultipleImages) return
    setCurrentImageIndex((prev) => (prev + 1) % images.length)
  }

  const prevImage = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation()
    if (!hasMultipleImages) return
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length)
  }

  // Handle touch swipe events
  const minSwipeDistance = 50

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null)
    setTouchStart(e.targetTouches[0].clientX)
  }

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX)
  }

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd || !hasMultipleImages) return
    
    const distance = touchStart - touchEnd
    const isLeftSwipe = distance > minSwipeDistance
    const isRightSwipe = distance < -minSwipeDistance
    
    if (isLeftSwipe) {
      nextImage()
    }
    if (isRightSwipe) {
      prevImage()
    }
  }

  const handleAddToCart = () => {
    if (!product || isInCart(product.id)) return
    addToCart(product, quantity)
  }

  const handleBuyNow = () => {
    if (!product) return
    if (!isInCart(product.id)) {
      addToCart(product, quantity)
    }
    router.push('/checkout')
  }

  const handleToggleWishlist = () => {
    if (!product) return
    toggleWishlist(product)
  }

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case "Common":
        return "bg-zinc-500/80"
      case "Uncommon":
        return "bg-emerald-500/80"
      case "Rare":
        return "bg-blue-500/80"
      case "Super Rare":
        return "bg-amber-500/80"
      default:
        return "bg-zinc-500/80"
    }
  }

  const isProductInCart = product ? isInCart(product.id) : false
  const isProductInWishlist = product ? isInWishlist(product.id) : false

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <Navbar variant="minimal" showBack backHref="/collection" />

      <main className="mx-auto max-w-7xl px-3 sm:px-4 py-4 sm:py-6 lg:py-12">
        <div className="grid gap-4 sm:gap-8 lg:grid-cols-2 lg:gap-12">
          {/* Image Section - Left on desktop, Top on mobile */}
          <div className="space-y-3 sm:space-y-4">
            <Card className="overflow-hidden border-gray-200 bg-white p-0">
              <div 
                className="relative aspect-square overflow-hidden bg-gray-50"
                onTouchStart={onTouchStart}
                onTouchMove={onTouchMove}
                onTouchEnd={onTouchEnd}
              >
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentImageIndex}
                    className="relative h-full w-full"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Image
                      src={images[currentImageIndex]}
                      alt={`${product.name} - View ${currentImageIndex + 1}`}
                      fill
                      className={hasImage ? "object-contain" : "object-cover"}
                      priority
                    />
                  </motion.div>
                </AnimatePresence>

                {/* Navigation arrows - only show if multiple images */}
                {hasMultipleImages && (
                  <div className="absolute inset-0 flex items-center justify-between p-2 sm:p-4">
                    <Button
                      variant="secondary"
                      size="icon"
                      className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-white/90 backdrop-blur-sm border border-gray-200 hover:bg-white shadow-sm"
                      onClick={prevImage}
                    >
                      <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5 text-gray-700" />
                    </Button>
                    <Button
                      variant="secondary"
                      size="icon"
                      className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-white/90 backdrop-blur-sm border border-gray-200 hover:bg-white shadow-sm"
                      onClick={nextImage}
                    >
                      <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5 text-gray-700" />
                    </Button>
                  </div>
                )}

                {/* Image indicators - only show if multiple images */}
                {hasMultipleImages && (
                  <div className="absolute bottom-3 sm:bottom-4 left-0 right-0 flex justify-center gap-1.5 sm:gap-2">
                    {images.map((_, index) => (
                      <button
                        key={index}
                        className={`h-1.5 sm:h-2 rounded-full transition-all ${
                          index === currentImageIndex ? "w-5 sm:w-6 bg-red-500" : "w-1.5 sm:w-2 bg-gray-300"
                        }`}
                        onClick={(e) => {
                          e.stopPropagation()
                          setCurrentImageIndex(index)
                        }}
                      />
                    ))}
                  </div>
                )}

                {/* Badges */}
                <div className="absolute left-2 sm:left-4 top-2 sm:top-4 flex flex-col gap-1.5 sm:gap-2">
                  {discount > 0 && <Badge className="bg-red-500 hover:bg-red-500/90 text-white text-[10px] sm:text-xs">-{discount}%</Badge>}
                  <Badge className={`${getRarityColor(product.rarity)} text-white text-[10px] sm:text-xs`}>{product.rarity}</Badge>
                </div>

                {/* Wishlist button */}
                <Button
                  variant="secondary"
                  size="icon"
                  className={`absolute right-2 sm:right-4 top-2 sm:top-4 h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-white/90 backdrop-blur-sm border border-gray-200 hover:bg-white shadow-sm ${
                    isProductInWishlist ? "text-red-500" : "text-gray-600"
                  }`}
                  onClick={(e) => {
                    e.stopPropagation()
                    handleToggleWishlist()
                  }}
                >
                  <Heart className={`h-4 w-4 sm:h-5 sm:w-5 ${isProductInWishlist ? "fill-red-500" : ""}`} />
                </Button>
              </div>
            </Card>

            {/* Thumbnail strip - only show if multiple images exist */}
            {hasMultipleImages && (
              <div className="flex gap-1.5 sm:gap-2">
                {images.map((img, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentImageIndex(index)}
                    className={`relative h-14 w-14 sm:h-20 sm:w-20 overflow-hidden rounded-md sm:rounded-lg border-2 transition-all ${
                      index === currentImageIndex ? "border-red-500" : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <Image
                      src={img}
                      alt={`Thumbnail ${index + 1}`}
                      fill
                      className={hasImage ? "object-contain" : "object-cover"}
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info - Right on desktop, Bottom on mobile */}
          <div className="space-y-4 sm:space-y-6">
            {/* Title & Rating */}
            <div className="space-y-1.5 sm:space-y-2">
              <p className="text-xs sm:text-sm text-gray-500">{product.series}</p>
              <h1 className="text-xl sm:text-3xl lg:text-4xl font-bold text-gray-900">{product.name}</h1>
              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                <div className="flex items-center gap-1">
                  <Star className="h-3.5 w-3.5 sm:h-4 sm:w-4 fill-amber-500 text-amber-500" />
                  <span className="font-medium text-gray-900 text-sm sm:text-base">{product.rating}</span>
                </div>
                <span className="text-xs sm:text-sm text-gray-500">({product.review_count} reviews)</span>
                {settings?.cod_enabled && (
                  <span className="text-xs sm:text-sm text-emerald-600">COD Available</span>
                )}
              </div>
            </div>

            {/* Price */}
            <div className="flex items-baseline gap-2 sm:gap-3">
              <span className="text-2xl sm:text-3xl font-bold text-gray-900">₹{product.price.toFixed(2)}</span>
              {originalPrice > product.price && (
                <span className="text-base sm:text-lg text-gray-400 line-through">₹{originalPrice.toFixed(2)}</span>
              )}
            </div>

            {/* Description */}
            <p className="text-sm sm:text-base text-gray-600 leading-relaxed">{product.description}</p>

            {/* Condition Selection */}
            <div className="space-y-2 sm:space-y-3">
              <div className="text-xs sm:text-sm text-gray-500">Condition</div>
              <div className="flex flex-wrap gap-1.5 sm:gap-2">
                {conditionOptions.map((condition) => (
                  <button
                    key={condition}
                    className={`min-w-[4rem] sm:min-w-[5rem] rounded-md sm:rounded-lg border px-2.5 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-medium transition-all ${
                      selectedCondition === condition
                        ? "border-red-500 bg-red-50 text-red-600"
                        : "border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50"
                    }`}
                    onClick={() => setSelectedCondition(condition)}
                  >
                    {condition}
                  </button>
                ))}
              </div>
            </div>

            {/* Quantity */}
            <div className="space-y-2 sm:space-y-3">
              <div className="text-xs sm:text-sm text-gray-500">Quantity</div>
              <div className="flex items-center gap-2 sm:gap-3">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-9 w-9 sm:h-10 sm:w-10 rounded-md sm:rounded-lg border-gray-200 bg-white hover:bg-gray-50"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                >
                  -
                </Button>
                <span className="w-10 sm:w-12 text-center text-base sm:text-lg font-medium text-gray-900">{quantity}</span>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-9 w-9 sm:h-10 sm:w-10 rounded-md sm:rounded-lg border-gray-200 bg-white hover:bg-gray-50"
                  onClick={() => setQuantity(quantity + 1)}
                >
                  +
                </Button>
              </div>
            </div>

            {/* Add to Cart & Buy Now */}
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              <Button
                variant="outline"
                className={`h-12 sm:h-14 flex-1 rounded-lg sm:rounded-xl text-sm sm:text-lg font-semibold border-2 ${
                  isProductInCart
                    ? "border-green-500 text-green-600 hover:bg-green-50"
                    : "border-red-500 text-red-500 hover:bg-red-50"
                }`}
                onClick={handleAddToCart}
                disabled={isProductInCart}
              >
                {isProductInCart ? (
                  <>
                    <Check className="mr-1.5 sm:mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                    In Cart
                  </>
                ) : (
                  <>
                    <ShoppingCart className="mr-1.5 sm:mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                    Add to Cart
                  </>
                )}
              </Button>
              <Button
                className="h-12 sm:h-14 flex-1 rounded-lg sm:rounded-xl text-sm sm:text-lg font-semibold bg-red-500 hover:bg-red-600"
                onClick={handleBuyNow}
              >
                Buy Now - ₹{(product.price * quantity).toFixed(2)}
              </Button>
            </div>

            {/* Features */}
            <div className={`grid ${settings?.cod_enabled ? 'grid-cols-2' : 'grid-cols-1'} gap-2 sm:gap-4 rounded-lg sm:rounded-xl border border-gray-200 bg-white p-3 sm:p-4`}>
              {settings?.cod_enabled && (
                <div className="flex flex-col items-center gap-1 sm:gap-2 text-center">
                  <Truck className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
                  <span className="text-[10px] sm:text-xs text-gray-500">COD Available</span>
                </div>
              )}
              <div className="flex flex-col items-center gap-1 sm:gap-2 text-center">
                <Shield className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
                <span className="text-[10px] sm:text-xs text-gray-500">Authentic</span>
              </div>
            </div>

            {/* Product Details */}
            <Card className="border-gray-200 bg-white">
              <CardContent className="p-3 sm:p-4 space-y-2 sm:space-y-3">
                <h3 className="font-semibold text-gray-900 text-sm sm:text-base">Product Details</h3>
                <div className="grid grid-cols-2 gap-y-1.5 sm:gap-y-2 text-xs sm:text-sm">
                  <span className="text-gray-500">Year</span>
                  <span className="text-gray-900">{product.year}</span>
                  <span className="text-gray-500">Color</span>
                  <span className="text-gray-900">{product.color}</span>
                  <span className="text-gray-500">Series</span>
                  <span className="text-gray-900">{product.series}</span>
                  <span className="text-gray-500">Rarity</span>
                  <span className="text-gray-900">{product.rarity}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
