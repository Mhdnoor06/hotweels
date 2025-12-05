"use client"

import { motion, AnimatePresence } from "framer-motion"
import { Heart, ShoppingCart, Trash2, Star, ArrowRight } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Navbar } from "@/components/navbar"
import { useWishlist } from "@/context/wishlist-context"
import { useCart } from "@/context/cart-context"
import type { Product } from "@/lib/supabase/database.types"

export function WishlistPage() {
  const { items: wishlistItems, removeItem } = useWishlist()
  const { addItem: addToCart, isInCart } = useCart()

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

  const handleAddToCart = (item: typeof wishlistItems[0]) => {
    const product: Product = {
      id: item.id,
      name: item.name,
      series: item.series,
      price: item.price,
      image: item.image,
      images: item.image ? [item.image] : null,
      color: item.color,
      rarity: item.rarity as Product['rarity'],
      year: item.year,
      rating: item.rating,
      stock: item.stock,
      review_count: 0,
      description: null,
      featured: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    addToCart(product)
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <Navbar />

      <main className="mx-auto max-w-7xl px-3 sm:px-4 py-4 sm:py-6 lg:py-10">
        {/* Page Title */}
        <div className="flex items-center justify-between mb-4 sm:mb-8">
          <div>
            <h1 className="text-xl sm:text-3xl font-bold flex items-center gap-2 sm:gap-3 text-gray-900">
              <Heart className="w-6 h-6 sm:w-8 sm:h-8 text-red-500 fill-red-500" />
              My Wishlist
            </h1>
            <p className="text-sm sm:text-base text-gray-500 mt-1">{wishlistItems.length} items saved</p>
          </div>
        </div>

        {wishlistItems.length === 0 ? (
          <Card className="border-gray-200 bg-white">
            <CardContent className="flex flex-col items-center justify-center py-12 sm:py-20 px-4">
              <Heart className="w-16 h-16 sm:w-20 sm:h-20 text-gray-200 mb-4 sm:mb-6" />
              <h3 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-2 text-center">Your wishlist is empty</h3>
              <p className="text-sm sm:text-base text-gray-500 mb-6 sm:mb-8 text-center max-w-md">
                Save your favorite Wheels Frams cars here to keep track of what you want
              </p>
              <Link href="/collection">
                <Button className="bg-red-500 hover:bg-red-600 flex items-center gap-2 text-sm sm:text-base">
                  Explore Collection
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3 sm:gap-6 grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            <AnimatePresence mode="popLayout">
              {wishlistItems.map((item, index) => (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card className="group border-gray-200 bg-white hover:shadow-lg transition-all overflow-hidden">
                    {/* Image */}
                    <div className="relative aspect-square overflow-hidden bg-gray-50">
                      <Image
                        src={item.image || "/placeholder.png"}
                        alt={item.name}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                      />

                      {/* Badges */}
                      <div className="absolute top-2 sm:top-3 left-2 sm:left-3 flex flex-col gap-1 sm:gap-2">
                        <Badge className={`${getRarityColor(item.rarity)} text-white text-[10px] sm:text-xs`}>{item.rarity}</Badge>
                        {item.stock === 0 && <Badge className="bg-red-500 text-white text-[10px] sm:text-xs">Out of Stock</Badge>}
                      </div>

                      {/* Remove button */}
                      <motion.button
                        onClick={() => removeItem(item.id)}
                        whileTap={{ scale: 0.9 }}
                        className="absolute top-2 sm:top-3 right-2 sm:right-3 p-1.5 sm:p-2 rounded-full bg-white/90 text-gray-400 hover:text-red-500 hover:bg-white transition-colors shadow-sm"
                      >
                        <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      </motion.button>
                    </div>

                    {/* Content */}
                    <CardContent className="p-2.5 sm:p-4 space-y-2 sm:space-y-3">
                      <div>
                        <p className="text-[10px] sm:text-xs text-gray-400 uppercase tracking-wider">{item.series}</p>
                        <h3 className="font-semibold text-gray-900 mt-0.5 sm:mt-1 text-xs sm:text-base truncate">{item.name}</h3>
                      </div>

                      <div className="flex items-center gap-1 sm:gap-2">
                        <Star className="w-3 h-3 sm:w-4 sm:h-4 fill-amber-500 text-amber-500" />
                        <span className="text-xs sm:text-sm text-gray-900">{item.rating}</span>
                        <span className="text-[10px] sm:text-xs text-gray-400 ml-auto">{item.year}</span>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-baseline gap-2">
                          <span className="text-sm sm:text-lg font-bold text-gray-900">₹{item.price.toFixed(2)}</span>
                        </div>
                      </div>

                      <div className="flex gap-1.5 sm:gap-2 pt-1 sm:pt-2">
                        <Link href={`/product/${item.id}`} className="flex-1">
                          <Button
                            variant="outline"
                            className="w-full border-gray-200 bg-white hover:bg-gray-50 text-[10px] sm:text-sm h-8 sm:h-10"
                          >
                            View
                          </Button>
                        </Link>
                        <Button
                          onClick={() => handleAddToCart(item)}
                          className={`flex-1 text-[10px] sm:text-sm h-8 sm:h-10 ${
                            isInCart(item.id)
                              ? "bg-green-500 hover:bg-green-600"
                              : "bg-red-500 hover:bg-red-600"
                          }`}
                          disabled={item.stock === 0}
                        >
                          <ShoppingCart className="w-3 h-3 sm:w-4 sm:h-4 mr-0.5 sm:mr-1" />
                          {isInCart(item.id) ? "Added" : "Add"}
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
