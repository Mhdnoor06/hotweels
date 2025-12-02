"use client"
import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ArrowLeft, Heart, ShoppingCart, Trash2, Star, Share2 } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

// Sample wishlist items
const initialWishlistItems = [
  {
    id: 9,
    name: "Lamborghini Countach",
    series: "HW Exotics",
    price: 18.99,
    originalPrice: 24.99,
    year: 2023,
    rarity: "Super Rare",
    image: "/hw/white-hot-wheels-lamborghini-countach.jpg",
    rating: 5.0,
    inStock: true,
  },
  {
    id: 6,
    name: "Porsche 911 GT3",
    series: "HW Exotics",
    price: 16.99,
    originalPrice: 21.99,
    year: 2024,
    rarity: "Rare",
    image: "/hw/white-hot-wheels-porsche-911-gt3.jpg",
    rating: 4.9,
    inStock: true,
  },
  {
    id: 12,
    name: "Nissan Skyline GT-R",
    series: "HW J-Imports",
    price: 13.99,
    originalPrice: 16.99,
    year: 2023,
    rarity: "Rare",
    image: "/hw/blue-hot-wheels-nissan-skyline-gtr.jpg",
    rating: 4.9,
    inStock: false,
  },
  {
    id: 2,
    name: "Bone Shaker",
    series: "HW Legends",
    price: 14.99,
    originalPrice: 18.99,
    year: 2024,
    rarity: "Rare",
    image: "/hw/black-hot-wheels-bone-shaker-car.jpg",
    rating: 4.9,
    inStock: true,
  },
]

export function WishlistPage() {
  const [wishlistItems, setWishlistItems] = useState(initialWishlistItems)

  const handleRemoveItem = (id: number) => {
    setWishlistItems((items) => items.filter((item) => item.id !== id))
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
            <span className="hidden sm:inline">Back</span>
          </Link>
          <Link href="/" className="text-xl font-bold tracking-tight text-gray-900">
            HOT<span className="text-red-500">WHEELS</span>
          </Link>
          <Link href="/orders" className="text-gray-500 hover:text-gray-900 transition-colors text-sm">
            Orders
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 lg:py-10">
        {/* Page Title */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3 text-gray-900">
              <Heart className="w-8 h-8 text-red-500 fill-red-500" />
              My Wishlist
            </h1>
            <p className="text-gray-500 mt-1">{wishlistItems.length} items saved</p>
          </div>
          {wishlistItems.length > 0 && (
            <Button variant="outline" className="border-gray-200 bg-white hover:bg-gray-50">
              <Share2 className="w-4 h-4 mr-2" />
              Share List
            </Button>
          )}
        </div>

        {wishlistItems.length === 0 ? (
          <Card className="border-gray-200 bg-white">
            <CardContent className="flex flex-col items-center justify-center py-20">
              <Heart className="w-20 h-20 text-gray-200 mb-6" />
              <h3 className="text-2xl font-semibold text-gray-900 mb-2">Your wishlist is empty</h3>
              <p className="text-gray-500 mb-8 text-center max-w-md">
                Save your favorite Hot Wheels cars here to keep track of what you want
              </p>
              <Link href="/collection">
                <Button className="bg-red-500 hover:bg-red-600">Explore Collection</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            <AnimatePresence>
              {wishlistItems.map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card className="group border-gray-200 bg-white hover:shadow-lg transition-all overflow-hidden">
                    {/* Image */}
                    <div className="relative aspect-square overflow-hidden bg-gray-50">
                      <img
                        src={item.image || "/placeholder.svg"}
                        alt={item.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />

                      {/* Badges */}
                      <div className="absolute top-3 left-3 flex flex-col gap-2">
                        <Badge className={`${getRarityColor(item.rarity)} text-white text-xs`}>{item.rarity}</Badge>
                        {!item.inStock && <Badge className="bg-red-500 text-white text-xs">Out of Stock</Badge>}
                      </div>

                      {/* Remove button */}
                      <motion.button
                        onClick={() => handleRemoveItem(item.id)}
                        whileTap={{ scale: 0.9 }}
                        className="absolute top-3 right-3 p-2 rounded-full bg-white/90 text-gray-400 hover:text-red-500 hover:bg-white transition-colors shadow-sm"
                      >
                        <Trash2 className="w-4 h-4" />
                      </motion.button>

                      {/* Discount badge */}
                      {item.originalPrice > item.price && (
                        <div className="absolute bottom-3 left-3">
                          <Badge className="bg-red-500 text-white">
                            -{Math.round(((item.originalPrice - item.price) / item.originalPrice) * 100)}%
                          </Badge>
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <CardContent className="p-4 space-y-3">
                      <div>
                        <p className="text-xs text-gray-400 uppercase tracking-wider">{item.series}</p>
                        <h3 className="font-semibold text-gray-900 mt-1">{item.name}</h3>
                      </div>

                      <div className="flex items-center gap-2">
                        <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
                        <span className="text-sm text-gray-900">{item.rating}</span>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-baseline gap-2">
                          <span className="text-lg font-bold text-gray-900">${item.price.toFixed(2)}</span>
                          {item.originalPrice > item.price && (
                            <span className="text-sm text-gray-400 line-through">${item.originalPrice.toFixed(2)}</span>
                          )}
                        </div>
                      </div>

                      <div className="flex gap-2 pt-2">
                        <Link href={`/product/${item.id}`} className="flex-1">
                          <Button
                            variant="outline"
                            className="w-full border-gray-200 bg-white hover:bg-gray-50 text-sm"
                          >
                            View
                          </Button>
                        </Link>
                        <Button className="flex-1 bg-red-500 hover:bg-red-600 text-sm" disabled={!item.inStock}>
                          <ShoppingCart className="w-4 h-4 mr-1" />
                          Add
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </main>
    </div>
  )
}
