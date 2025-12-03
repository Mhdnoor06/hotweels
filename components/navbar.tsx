"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { ShoppingCart, Heart, ArrowLeft, Package, User, LogOut, ChevronDown } from "lucide-react"
import { useCart } from "@/context/cart-context"
import { useWishlist } from "@/context/wishlist-context"
import { useAuth } from "@/context/auth-context"
import { motion, AnimatePresence } from "framer-motion"

interface NavbarProps {
  variant?: "default" | "minimal"
  showBack?: boolean
  backHref?: string
}

export function Navbar({ variant = "default", showBack = false, backHref = "/" }: NavbarProps) {
  const pathname = usePathname()
  const { getItemCount: getCartCount } = useCart()
  const { getItemCount: getWishlistCount } = useWishlist()
  const { user, signOut, isLoading } = useAuth()
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)

  const cartCount = getCartCount()
  const wishlistCount = getWishlistCount()

  // Check if we're on the homepage
  const isHomePage = pathname === "/"

  // Handle scroll for transparent navbar on homepage
  useEffect(() => {
    if (!isHomePage) {
      setIsScrolled(true)
      return
    }

    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50)
    }

    // Check initial scroll position
    handleScroll()

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [isHomePage])

  // Don't show on admin pages
  if (pathname?.startsWith('/admin')) {
    return null
  }

  const isActive = (path: string) => pathname === path

  return (
    <header className={`sticky top-0 z-50 transition-all duration-300 ${
      isScrolled
        ? "bg-white/95 backdrop-blur-sm border-b border-gray-200"
        : "bg-transparent border-b border-transparent"
    }`}>
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
        {/* Left side */}
        <div className="flex items-center gap-4">
          {showBack && (
            <Link
              href={backHref}
              className={`flex items-center gap-2 transition-colors ${isScrolled ? "text-gray-500 hover:text-gray-900" : "text-white/70 hover:text-white"}`}
            >
              <ArrowLeft className="h-5 w-5" />
              <span className="hidden sm:inline">Back</span>
            </Link>
          )}

          {variant === "default" && !showBack && (
            <nav className="hidden sm:flex items-center gap-6">
              <Link
                href="/"
                className={`text-sm font-medium transition-colors ${
                  isActive("/")
                    ? (isScrolled ? "text-gray-900" : "text-white")
                    : (isScrolled ? "text-gray-500 hover:text-gray-900" : "text-white/70 hover:text-white")
                }`}
              >
                Home
              </Link>
              <Link
                href="/collection"
                className={`text-sm font-medium transition-colors ${
                  isActive("/collection")
                    ? (isScrolled ? "text-gray-900" : "text-white")
                    : (isScrolled ? "text-gray-500 hover:text-gray-900" : "text-white/70 hover:text-white")
                }`}
              >
                Collection
              </Link>
            </nav>
          )}
        </div>

        {/* Center - Logo */}
        <Link href="/" className={`text-xl font-bold tracking-tight transition-colors ${isScrolled ? "text-gray-900" : "text-white"}`}>
          HOT<span className="text-red-500">WHEELS</span>
        </Link>

        {/* Right side - Action icons with badges */}
        <div className="flex items-center gap-2 sm:gap-4">
          {/* Wishlist */}
          <Link
            href="/wishlist"
            className={`relative p-2 transition-colors ${isScrolled ? "text-gray-500 hover:text-gray-900" : "text-white/70 hover:text-white"}`}
          >
            <Heart className={`h-5 w-5 ${isActive("/wishlist") ? "fill-red-500 text-red-500" : ""}`} />
            <AnimatePresence>
              {wishlistCount > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-[10px] font-bold text-white flex items-center justify-center"
                >
                  {wishlistCount > 99 ? "99+" : wishlistCount}
                </motion.span>
              )}
            </AnimatePresence>
          </Link>

          {/* Orders */}
          <Link
            href="/orders"
            className={`relative p-2 transition-colors ${isScrolled ? "text-gray-500 hover:text-gray-900" : "text-white/70 hover:text-white"}`}
          >
            <Package className={`h-5 w-5 ${isActive("/orders") ? "text-gray-900" : ""}`} />
          </Link>

          {/* Cart */}
          <Link
            href="/cart"
            className={`relative p-2 transition-colors ${isScrolled ? "text-gray-500 hover:text-gray-900" : "text-white/70 hover:text-white"}`}
          >
            <ShoppingCart className={`h-5 w-5 ${isActive("/cart") ? "text-gray-900" : ""}`} />
            <AnimatePresence>
              {cartCount > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-[10px] font-bold text-white flex items-center justify-center"
                >
                  {cartCount > 99 ? "99+" : cartCount}
                </motion.span>
              )}
            </AnimatePresence>
          </Link>

          {/* User Auth */}
          {!isLoading && (
            <>
              {user ? (
                <div className="relative">
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className={`flex items-center gap-1 p-2 transition-colors ${isScrolled ? "text-gray-500 hover:text-gray-900" : "text-white/70 hover:text-white"}`}
                  >
                    <div className="h-8 w-8 rounded-full bg-red-100 flex items-center justify-center">
                      <span className="text-sm font-medium text-red-600">
                        {user.user_metadata?.full_name?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || "U"}
                      </span>
                    </div>
                    <ChevronDown className="h-4 w-4 hidden sm:block" />
                  </button>

                  <AnimatePresence>
                    {showUserMenu && (
                      <>
                        <div
                          className="fixed inset-0 z-40"
                          onClick={() => setShowUserMenu(false)}
                        />
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50"
                        >
                          <div className="px-4 py-2 border-b border-gray-100">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {user.user_metadata?.full_name || "User"}
                            </p>
                            <p className="text-xs text-gray-500 truncate">{user.email}</p>
                          </div>
                          <Link
                            href="/orders"
                            className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                            onClick={() => setShowUserMenu(false)}
                          >
                            <Package className="h-4 w-4" />
                            My Orders
                          </Link>
                          <button
                            onClick={() => {
                              signOut()
                              setShowUserMenu(false)
                            }}
                            className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                          >
                            <LogOut className="h-4 w-4" />
                            Sign Out
                          </button>
                        </motion.div>
                      </>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <Link
                  href="/login"
                  className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-white bg-red-500 hover:bg-red-600 rounded-lg transition-colors"
                >
                  <User className="h-4 w-4" />
                  <span className="hidden sm:inline">Sign In</span>
                </Link>
              )}
            </>
          )}
        </div>
      </div>
    </header>
  )
}
