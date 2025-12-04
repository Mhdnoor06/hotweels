"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Navbar } from "@/components/navbar"
import { useCart } from "@/context/cart-context"
import { useAuth } from "@/context/auth-context"
import { motion, AnimatePresence } from "framer-motion"
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight, AlertCircle } from "lucide-react"

export default function CartPage() {
  const router = useRouter()
  const { items, updateQuantity, removeItem, getSubtotal, clearCart } = useCart()
  const { user } = useAuth()
  const [showAuthPrompt, setShowAuthPrompt] = useState(false)

  const subtotal = getSubtotal()
  // Shipping will be calculated at checkout based on settings
  const shipping = 0 // Not shown in cart, will be shown at checkout
  const total = subtotal + shipping

  const handleCheckout = () => {
    if (!user) {
      setShowAuthPrompt(true)
      return
    }
    router.push("/checkout")
  }

  if (items.length === 0) {
    return (
      <>
        <Navbar />
        <main className="min-h-[calc(100vh-200px)] flex flex-col items-center justify-center px-4 py-8 sm:py-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
              <ShoppingBag className="w-10 h-10 sm:w-12 sm:h-12 text-gray-400" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Your cart is empty</h1>
            <p className="text-sm sm:text-base text-gray-600 mb-6 sm:mb-8">Looks like you haven&apos;t added any items yet.</p>
            <Link
              href="/collection"
              className="inline-flex items-center gap-2 px-5 sm:px-6 py-2.5 sm:py-3 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-lg transition-colors text-sm sm:text-base"
            >
              Browse Collection
              <ArrowRight className="w-4 h-4" />
            </Link>
          </motion.div>
        </main>
      </>
    )
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gray-50 py-4 sm:py-8 px-3 sm:px-4 overflow-x-hidden">
        <div className="max-w-6xl mx-auto w-full">
          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-xl sm:text-3xl font-bold text-gray-900 mb-4 sm:mb-8"
          >
            Shopping Cart ({items.length} {items.length === 1 ? "item" : "items"})
          </motion.h1>

          <div className="grid lg:grid-cols-3 gap-4 sm:gap-8 w-full">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-3 sm:space-y-4 min-w-0 w-full">
              <AnimatePresence mode="popLayout">
                {items.map((item) => (
                  <motion.div
                    key={item.id}
                    layout
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="bg-white rounded-lg sm:rounded-xl shadow-sm border border-gray-200 p-3 sm:p-6 w-full overflow-hidden"
                  >
                    <div className="flex gap-3 sm:gap-4 min-w-0 w-full">
                      {/* Product Image */}
                      <div className="relative w-20 h-20 sm:w-32 sm:h-32 rounded-md sm:rounded-lg overflow-hidden bg-gray-100 shrink-0">
                        <Image
                          src={item.image || "/placeholder.png"}
                          alt={item.name}
                          fill
                          className="object-cover"
                        />
                      </div>

                      {/* Product Details */}
                      <div className="flex-1 min-w-0 overflow-hidden">
                        <div className="flex justify-between items-start gap-2 min-w-0">
                          <div className="min-w-0 flex-1 overflow-hidden">
                            <h3 className="font-semibold text-gray-900 text-sm sm:text-base truncate">{item.name}</h3>
                            <p className="text-xs sm:text-sm text-gray-500 truncate">{item.series}</p>
                            <div className="flex flex-wrap items-center gap-1 sm:gap-2 mt-1">
                              <span className="text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 bg-gray-100 rounded-full whitespace-nowrap">{item.color}</span>
                              <span className="text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 bg-gray-100 rounded-full whitespace-nowrap">{item.rarity}</span>
                            </div>
                          </div>
                          <button
                            onClick={() => removeItem(item.id)}
                            className="p-1.5 sm:p-2 text-gray-400 hover:text-red-500 transition-colors shrink-0"
                          >
                            <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
                          </button>
                        </div>

                        <div className="flex items-center justify-between mt-3 sm:mt-4 gap-2 min-w-0">
                          {/* Quantity Controls */}
                          <div className="flex items-center bg-gray-100 rounded-md sm:rounded-lg shrink-0">
                            <button
                              onClick={() => updateQuantity(item.id, item.quantity - 1)}
                              className="p-1.5 sm:p-2 hover:bg-gray-200 rounded-l-md sm:rounded-l-lg transition-colors"
                            >
                              <Minus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                            </button>
                            <span className="w-7 sm:w-8 text-center font-medium text-sm sm:text-base">{item.quantity}</span>
                            <button
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                              className="p-1.5 sm:p-2 hover:bg-gray-200 rounded-r-md sm:rounded-r-lg transition-colors"
                            >
                              <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                            </button>
                          </div>

                          {/* Price */}
                          <div className="text-right shrink-0">
                            <p className="font-bold text-gray-900 text-sm sm:text-base whitespace-nowrap">₹{(item.price * item.quantity).toFixed(2)}</p>
                            {item.quantity > 1 && (
                              <p className="text-[10px] sm:text-xs text-gray-500 whitespace-nowrap">₹{item.price.toFixed(2)} each</p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {/* Clear Cart Button */}
              <button
                onClick={clearCart}
                className="text-xs sm:text-sm text-gray-500 hover:text-red-500 transition-colors"
              >
                Clear all items
              </button>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1 w-full min-w-0">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-lg sm:rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6 sticky top-24 w-full"
              >
                <h2 className="text-base sm:text-lg font-bold text-gray-900 mb-3 sm:mb-4">Order Summary</h2>

                <div className="space-y-2 sm:space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="font-medium">₹{subtotal.toFixed(2)}</span>
                  </div>
                  <div className="text-xs text-gray-500 pt-1">
                    Shipping charges calculated at checkout
                  </div>
                  <div className="border-t border-gray-200 pt-2 sm:pt-3 flex justify-between">
                    <span className="font-bold text-gray-900">Subtotal</span>
                    <span className="font-bold text-gray-900">₹{subtotal.toFixed(2)}</span>
                  </div>
                </div>

                <button
                  onClick={handleCheckout}
                  className="w-full mt-4 sm:mt-6 py-2.5 sm:py-3 px-4 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2 text-sm sm:text-base"
                >
                  Proceed to Checkout
                  <ArrowRight className="w-4 h-4" />
                </button>

                <Link
                  href="/collection"
                  className="block text-center text-xs sm:text-sm text-gray-500 hover:text-gray-900 mt-3 sm:mt-4 transition-colors"
                >
                  Continue Shopping
                </Link>

                {/* Auth Prompt */}
                <AnimatePresence>
                  {showAuthPrompt && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="mt-3 sm:mt-4 p-3 sm:p-4 bg-amber-50 border border-amber-200 rounded-lg"
                    >
                      <div className="flex gap-2 sm:gap-3">
                        <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-amber-500 shrink-0 mt-0.5" />
                        <div>
                          <p className="text-xs sm:text-sm font-medium text-amber-800">Sign in required</p>
                          <p className="text-xs sm:text-sm text-amber-700 mt-1">
                            Please sign in to complete your order.
                          </p>
                          <div className="flex gap-2 mt-2 sm:mt-3">
                            <Link
                              href="/login"
                              className="text-xs sm:text-sm font-medium text-amber-800 hover:text-amber-900"
                            >
                              Sign In
                            </Link>
                            <span className="text-amber-400">|</span>
                            <Link
                              href="/signup"
                              className="text-xs sm:text-sm font-medium text-amber-800 hover:text-amber-900"
                            >
                              Create Account
                            </Link>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            </div>
          </div>
        </div>
      </main>
    </>
  )
}
