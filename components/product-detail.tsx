"use client"

import type React from "react"

import { useState } from "react"
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
  ArrowLeft,
  Truck,
  Shield,
  RotateCcw,
} from "lucide-react"
import Link from "next/link"

// Product data - same as collection
const allProducts = [
  {
    id: 1,
    name: "Twin Mill III",
    series: "HW Dream Garage",
    price: 12.99,
    originalPrice: 15.99,
    year: 2024,
    color: "Red",
    rarity: "Common",
    image: "/hw/red-hot-wheels-twin-mill-car.jpg",
    rating: 4.8,
    reviewCount: 142,
    isNew: true,
    isBestSeller: true,
    description:
      "The Twin Mill III is an iconic Hot Wheels original design featuring dual engines and aggressive styling. A must-have for any serious collector.",
  },
  {
    id: 2,
    name: "Bone Shaker",
    series: "HW Legends",
    price: 14.99,
    originalPrice: 18.99,
    year: 2024,
    color: "Black",
    rarity: "Rare",
    image: "/hw/black-hot-wheels-bone-shaker-car.jpg",
    rating: 4.9,
    reviewCount: 256,
    isNew: false,
    isBestSeller: true,
    description:
      "The legendary Bone Shaker with its skull-inspired design has become one of the most recognizable Hot Wheels cars ever made.",
  },
  {
    id: 3,
    name: "Deora II",
    series: "HW Originals",
    price: 11.99,
    originalPrice: 14.99,
    year: 2023,
    color: "Orange",
    rarity: "Common",
    image: "/hw/orange-hot-wheels-deora-car.jpg",
    rating: 4.5,
    reviewCount: 89,
    isNew: false,
    isBestSeller: false,
    description:
      "A futuristic surf wagon design that pushes the boundaries of automotive imagination. The Deora II is a true Hot Wheels classic.",
  },
  {
    id: 4,
    name: "Rodger Dodger",
    series: "HW Muscle Mania",
    price: 13.99,
    originalPrice: 16.99,
    year: 2024,
    color: "Blue",
    rarity: "Uncommon",
    image: "/hw/blue-hot-wheels-rodger-dodger-muscle-car.jpg",
    rating: 4.7,
    reviewCount: 178,
    isNew: true,
    isBestSeller: false,
    description:
      "Pure American muscle with aggressive stance and powerful lines. The Rodger Dodger embodies the spirit of classic muscle cars.",
  },
  {
    id: 5,
    name: "Volkswagen Beetle",
    series: "HW Classics",
    price: 9.99,
    originalPrice: 12.99,
    year: 2023,
    color: "Yellow",
    rarity: "Common",
    image: "/hw/yellow-hot-wheels-volkswagen-beetle.jpg",
    rating: 4.6,
    reviewCount: 203,
    isNew: false,
    isBestSeller: true,
    description:
      "The timeless Volkswagen Beetle in bright yellow. A classic that never goes out of style and a favorite among collectors worldwide.",
  },
  {
    id: 6,
    name: "Porsche 911 GT3",
    series: "HW Exotics",
    price: 16.99,
    originalPrice: 21.99,
    year: 2024,
    color: "White",
    rarity: "Rare",
    image: "/hw/white-hot-wheels-porsche-911-gt3.jpg",
    rating: 4.9,
    reviewCount: 312,
    isNew: true,
    isBestSeller: true,
    description:
      "German engineering perfection. The Porsche 911 GT3 represents the pinnacle of sports car design and performance.",
  },
  {
    id: 7,
    name: "Ford Mustang Boss",
    series: "HW Muscle Mania",
    price: 12.99,
    originalPrice: 15.99,
    year: 2024,
    color: "Green",
    rarity: "Uncommon",
    image: "/hw/green-hot-wheels-ford-mustang-boss.jpg",
    rating: 4.7,
    reviewCount: 145,
    isNew: false,
    isBestSeller: false,
    description:
      "The Ford Mustang Boss in stunning green. An American legend that defined an era of high-performance automobiles.",
  },
  {
    id: 8,
    name: "Corvette C8",
    series: "HW Exotics",
    price: 15.99,
    originalPrice: 19.99,
    year: 2024,
    color: "Red",
    rarity: "Rare",
    image: "/hw/red-hot-wheels-corvette-c8.jpg",
    rating: 4.8,
    reviewCount: 267,
    isNew: true,
    isBestSeller: true,
    description:
      "The revolutionary mid-engine Corvette C8. A new chapter in American sports car history captured in die-cast form.",
  },
  {
    id: 9,
    name: "Lamborghini Countach",
    series: "HW Exotics",
    price: 18.99,
    originalPrice: 24.99,
    year: 2023,
    color: "White",
    rarity: "Super Rare",
    image: "/hw/white-hot-wheels-lamborghini-countach.jpg",
    rating: 5.0,
    reviewCount: 423,
    isNew: false,
    isBestSeller: true,
    description:
      "The poster car of the 80s. The Lamborghini Countach defined supercar design and remains an icon decades later.",
  },
  {
    id: 10,
    name: "Custom '67 Camaro",
    series: "HW Classics",
    price: 14.99,
    originalPrice: 17.99,
    year: 2024,
    color: "Blue",
    rarity: "Uncommon",
    image: "/hw/blue-hot-wheels-67-camaro-classic.jpg",
    rating: 4.6,
    reviewCount: 134,
    isNew: true,
    isBestSeller: false,
    description: "A customized classic. The '67 Camaro represents the golden age of American automotive design.",
  },
  {
    id: 11,
    name: "Tesla Cybertruck",
    series: "HW Green Speed",
    price: 11.99,
    originalPrice: 14.99,
    year: 2024,
    color: "Silver",
    rarity: "Common",
    image: "/hw/silver-hot-wheels-tesla-cybertruck.jpg",
    rating: 4.4,
    reviewCount: 567,
    isNew: true,
    isBestSeller: true,
    description: "The future of trucks. Tesla's bold Cybertruck design pushes boundaries and sparks imagination.",
  },
  {
    id: 12,
    name: "Nissan Skyline GT-R",
    series: "HW J-Imports",
    price: 13.99,
    originalPrice: 16.99,
    year: 2023,
    color: "Blue",
    rarity: "Rare",
    image: "/hw/blue-hot-wheels-nissan-skyline-gtr.jpg",
    rating: 4.9,
    reviewCount: 389,
    isNew: false,
    isBestSeller: true,
    description:
      "Godzilla in die-cast form. The Nissan Skyline GT-R is a JDM legend beloved by car enthusiasts worldwide.",
  },
]

const scaleOptions = ["1:64", "1:43", "1:32", "1:24"]
const conditionOptions = ["Mint", "Near Mint", "Excellent", "Good"]

export function ProductDetail({ productId }: { productId: string }) {
  const product = allProducts.find((p) => p.id === Number.parseInt(productId)) || allProducts[0]

  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [selectedScale, setSelectedScale] = useState(scaleOptions[0])
  const [selectedCondition, setSelectedCondition] = useState<string | null>(null)
  const [isWishlisted, setIsWishlisted] = useState(false)
  const [isAddingToCart, setIsAddingToCart] = useState(false)
  const [isAddedToCart, setIsAddedToCart] = useState(false)
  const [quantity, setQuantity] = useState(1)

  // Generate multiple images for carousel
  const images = [product.image, product.image, product.image]

  const discount = Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)

  const nextImage = (e: React.MouseEvent) => {
    e.stopPropagation()
    setCurrentImageIndex((prev) => (prev + 1) % images.length)
  }

  const prevImage = (e: React.MouseEvent) => {
    e.stopPropagation()
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length)
  }

  const handleAddToCart = () => {
    if (isAddedToCart) return
    setIsAddingToCart(true)
    setTimeout(() => {
      setIsAddingToCart(false)
      setIsAddedToCart(true)
      setTimeout(() => setIsAddedToCart(false), 2000)
    }, 800)
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

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-gray-200 bg-white/95 backdrop-blur-sm">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
          <Link
            href="/collection"
            className="flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
            <span className="hidden sm:inline">Back to Collection</span>
          </Link>
          <Link href="/" className="text-xl font-bold tracking-tight text-gray-900">
            HOT<span className="text-red-500">WHEELS</span>
          </Link>
          <div className="w-20" />
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 lg:py-12">
        <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
          {/* Image Section - Left on desktop, Top on mobile */}
          <div className="space-y-4">
            <Card className="overflow-hidden border-gray-200 bg-white p-0">
              <div className="relative aspect-square overflow-hidden bg-gray-50">
                <AnimatePresence mode="wait">
                  <motion.img
                    key={currentImageIndex}
                    src={images[currentImageIndex]}
                    alt={`${product.name} - View ${currentImageIndex + 1}`}
                    className="h-full w-full object-cover"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                  />
                </AnimatePresence>

                {/* Navigation arrows */}
                <div className="absolute inset-0 flex items-center justify-between p-4">
                  <Button
                    variant="secondary"
                    size="icon"
                    className="h-10 w-10 rounded-full bg-white/90 backdrop-blur-sm border border-gray-200 hover:bg-white shadow-sm"
                    onClick={prevImage}
                  >
                    <ChevronLeft className="h-5 w-5 text-gray-700" />
                  </Button>
                  <Button
                    variant="secondary"
                    size="icon"
                    className="h-10 w-10 rounded-full bg-white/90 backdrop-blur-sm border border-gray-200 hover:bg-white shadow-sm"
                    onClick={nextImage}
                  >
                    <ChevronRight className="h-5 w-5 text-gray-700" />
                  </Button>
                </div>

                {/* Image indicators */}
                <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2">
                  {images.map((_, index) => (
                    <button
                      key={index}
                      className={`h-2 rounded-full transition-all ${
                        index === currentImageIndex ? "w-6 bg-red-500" : "w-2 bg-gray-300"
                      }`}
                      onClick={(e) => {
                        e.stopPropagation()
                        setCurrentImageIndex(index)
                      }}
                    />
                  ))}
                </div>

                {/* Badges */}
                <div className="absolute left-4 top-4 flex flex-col gap-2">
                  {product.isNew && <Badge className="bg-blue-500 hover:bg-blue-500/90 text-white">New</Badge>}
                  {product.isBestSeller && (
                    <Badge className="bg-amber-500 hover:bg-amber-500/90 text-white">Best Seller</Badge>
                  )}
                  {discount > 0 && <Badge className="bg-red-500 hover:bg-red-500/90 text-white">-{discount}%</Badge>}
                  <Badge className={`${getRarityColor(product.rarity)} text-white`}>{product.rarity}</Badge>
                </div>

                {/* Wishlist button */}
                <Button
                  variant="secondary"
                  size="icon"
                  className={`absolute right-4 top-4 h-10 w-10 rounded-full bg-white/90 backdrop-blur-sm border border-gray-200 hover:bg-white shadow-sm ${
                    isWishlisted ? "text-red-500" : "text-gray-600"
                  }`}
                  onClick={(e) => {
                    e.stopPropagation()
                    setIsWishlisted(!isWishlisted)
                  }}
                >
                  <Heart className={`h-5 w-5 ${isWishlisted ? "fill-red-500" : ""}`} />
                </Button>
              </div>
            </Card>

            {/* Thumbnail strip */}
            <div className="flex gap-2">
              {images.map((img, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentImageIndex(index)}
                  className={`relative h-20 w-20 overflow-hidden rounded-lg border-2 transition-all ${
                    index === currentImageIndex ? "border-red-500" : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <img
                    src={img || "/placeholder.svg"}
                    alt={`Thumbnail ${index + 1}`}
                    className="h-full w-full object-cover"
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Product Info - Right on desktop, Bottom on mobile */}
          <div className="space-y-6">
            {/* Title & Rating */}
            <div className="space-y-2">
              <p className="text-sm text-gray-500">{product.series}</p>
              <h1 className="text-3xl font-bold lg:text-4xl text-gray-900">{product.name}</h1>
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 fill-amber-500 text-amber-500" />
                  <span className="font-medium text-gray-900">{product.rating}</span>
                </div>
                <span className="text-sm text-gray-500">({product.reviewCount} reviews)</span>
                <span className="text-sm text-emerald-600">Free shipping</span>
              </div>
            </div>

            {/* Price */}
            <div className="flex items-baseline gap-3">
              <span className="text-3xl font-bold text-gray-900">${product.price.toFixed(2)}</span>
              {product.originalPrice > product.price && (
                <span className="text-lg text-gray-400 line-through">${product.originalPrice.toFixed(2)}</span>
              )}
            </div>

            {/* Description */}
            <p className="text-gray-600 leading-relaxed">{product.description}</p>

            {/* Scale Selection */}
            <div className="space-y-3">
              <div className="text-sm text-gray-500">Scale</div>
              <div className="flex flex-wrap gap-2">
                {scaleOptions.map((scale) => (
                  <button
                    key={scale}
                    className={`min-w-[4rem] rounded-lg border px-4 py-2.5 text-sm font-medium transition-all ${
                      selectedScale === scale
                        ? "border-red-500 bg-red-50 text-red-600"
                        : "border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50"
                    }`}
                    onClick={() => setSelectedScale(scale)}
                  >
                    {scale}
                  </button>
                ))}
              </div>
            </div>

            {/* Condition Selection */}
            <div className="space-y-3">
              <div className="text-sm text-gray-500">Condition</div>
              <div className="flex flex-wrap gap-2">
                {conditionOptions.map((condition) => (
                  <button
                    key={condition}
                    className={`min-w-[5rem] rounded-lg border px-4 py-2.5 text-sm font-medium transition-all ${
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
            <div className="space-y-3">
              <div className="text-sm text-gray-500">Quantity</div>
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-10 w-10 rounded-lg border-gray-200 bg-white hover:bg-gray-50"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                >
                  -
                </Button>
                <span className="w-12 text-center text-lg font-medium text-gray-900">{quantity}</span>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-10 w-10 rounded-lg border-gray-200 bg-white hover:bg-gray-50"
                  onClick={() => setQuantity(quantity + 1)}
                >
                  +
                </Button>
              </div>
            </div>

            {/* Add to Cart */}
            <Button
              className="h-14 w-full rounded-xl bg-red-500 text-lg font-semibold hover:bg-red-600"
              onClick={handleAddToCart}
              disabled={isAddingToCart || isAddedToCart}
            >
              {isAddingToCart ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Adding...
                </>
              ) : isAddedToCart ? (
                <>
                  <Check className="mr-2 h-5 w-5" />
                  Added to Cart
                </>
              ) : (
                <>
                  <ShoppingCart className="mr-2 h-5 w-5" />
                  Add to Cart
                </>
              )}
            </Button>

            {/* Features */}
            <div className="grid grid-cols-3 gap-4 rounded-xl border border-gray-200 bg-white p-4">
              <div className="flex flex-col items-center gap-2 text-center">
                <Truck className="h-5 w-5 text-gray-400" />
                <span className="text-xs text-gray-500">Free Shipping</span>
              </div>
              <div className="flex flex-col items-center gap-2 text-center">
                <Shield className="h-5 w-5 text-gray-400" />
                <span className="text-xs text-gray-500">Authentic</span>
              </div>
              <div className="flex flex-col items-center gap-2 text-center">
                <RotateCcw className="h-5 w-5 text-gray-400" />
                <span className="text-xs text-gray-500">30-Day Returns</span>
              </div>
            </div>

            {/* Product Details */}
            <Card className="border-gray-200 bg-white">
              <CardContent className="p-4 space-y-3">
                <h3 className="font-semibold text-gray-900">Product Details</h3>
                <div className="grid grid-cols-2 gap-y-2 text-sm">
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
