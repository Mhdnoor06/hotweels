"use client"

import Link from "next/link"
import { ShoppingCart, ArrowRight } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { useCart } from "@/context/cart-context"

export function MobileCartBar() {
  const { getItemCount, getSubtotal } = useCart()

  const itemCount = getItemCount()
  const subtotal = getSubtotal()

  if (itemCount === 0) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        className="fixed bottom-0 left-0 right-0 z-50 sm:hidden"
      >
        <div className="bg-white border-t border-gray-200 shadow-[0_-4px_20px_rgba(0,0,0,0.1)] px-4 py-3">
          <Link href="/cart">
            <div className="flex items-center justify-between bg-red-500 hover:bg-red-600 transition-colors rounded-xl px-4 py-3">
              {/* Left side - Cart info */}
              <div className="flex items-center gap-3">
                <div className="relative">
                  <ShoppingCart className="h-5 w-5 text-white" />
                  <span className="absolute -top-2 -right-2 h-4 w-4 rounded-full bg-white text-[10px] font-bold text-red-500 flex items-center justify-center">
                    {itemCount > 9 ? "9+" : itemCount}
                  </span>
                </div>
                <div className="text-white">
                  <p className="text-xs opacity-90">{itemCount} {itemCount === 1 ? "item" : "items"}</p>
                  <p className="text-sm font-bold">₹{subtotal.toFixed(2)}</p>
                </div>
              </div>

              {/* Right side - View Cart button */}
              <div className="flex items-center gap-2 text-white font-semibold text-sm">
                <span>View Cart</span>
                <ArrowRight className="h-4 w-4" />
              </div>
            </div>
          </Link>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
