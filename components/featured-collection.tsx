"use client"

import { useState, useEffect, useRef } from "react"
import { motion } from "framer-motion"
import { ProductRevealCard } from "./product-reveal-card"
import Link from "next/link"
import { Loader2, ChevronLeft, ChevronRight } from "lucide-react"
import { getFeaturedProducts } from "@/lib/supabase/products"
import type { Product } from "@/lib/supabase/database.types"
import { useCart } from "@/context/cart-context"
import { useWishlist } from "@/context/wishlist-context"

export default function FeaturedCollection() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [activeIndex, setActiveIndex] = useState(0)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const { toggleItem: toggleCart, isInCart } = useCart()
  const { toggleItem: toggleWishlist, isInWishlist } = useWishlist()

  useEffect(() => {
    async function fetchFeatured() {
      try {
        const data = await getFeaturedProducts(4)
        setProducts(data)
      } catch (err) {
        console.error('Error fetching featured products:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchFeatured()
  }, [])

  // Handle scroll to update active index
  const handleScroll = () => {
    if (scrollContainerRef.current) {
      const scrollLeft = scrollContainerRef.current.scrollLeft
      const cardWidth = scrollContainerRef.current.offsetWidth * 0.85 // 85% of container width
      const newIndex = Math.round(scrollLeft / cardWidth)
      setActiveIndex(Math.min(newIndex, products.length - 1))
    }
  }

  // Scroll to specific card
  const scrollToCard = (index: number) => {
    if (scrollContainerRef.current) {
      const cardWidth = scrollContainerRef.current.offsetWidth * 0.85
      scrollContainerRef.current.scrollTo({
        left: index * cardWidth,
        behavior: 'smooth'
      })
    }
  }
  return (
    <section className="bg-gradient-to-b from-white to-gray-50 py-20 sm:py-24 lg:py-28 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Subtle grid pattern */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(rgba(0,0,0,0.3) 1px, transparent 1px),
                           linear-gradient(90deg, rgba(0,0,0,0.3) 1px, transparent 1px)`,
          backgroundSize: "40px 40px",
        }}
      />

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="text-center mb-12 sm:mb-16"
        >
          <span className="text-orange-500 text-xs sm:text-sm font-bold tracking-[0.25em] sm:tracking-[0.3em] uppercase">
            Premium Selection
          </span>
          <h2 className="text-4xl sm:text-5xl md:text-6xl font-black text-gray-900 mt-3 sm:mt-4 tracking-tight">
            THE GARAGE
          </h2>
          <p className="text-gray-600 text-sm sm:text-base mt-3 sm:mt-4 max-w-md mx-auto px-4">
            Explore our handpicked collection of legendary Hot Wheels models
          </p>
        </motion.div>

        {/* Product Grid / Carousel */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-500">No featured products available</p>
          </div>
        ) : (
          <>
            {/* Mobile Swipable Carousel */}
            <div className="sm:hidden relative">
              {/* Navigation Arrows */}
              {activeIndex > 0 && (
                <button
                  onClick={() => scrollToCard(activeIndex - 1)}
                  className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 bg-white/90 backdrop-blur-sm rounded-full shadow-lg flex items-center justify-center text-gray-700 hover:bg-white"
                >
                  <ChevronLeft size={20} />
                </button>
              )}
              {activeIndex < products.length - 1 && (
                <button
                  onClick={() => scrollToCard(activeIndex + 1)}
                  className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 bg-white/90 backdrop-blur-sm rounded-full shadow-lg flex items-center justify-center text-gray-700 hover:bg-white"
                >
                  <ChevronRight size={20} />
                </button>
              )}

              {/* Scrollable Container */}
              <div
                ref={scrollContainerRef}
                onScroll={handleScroll}
                className="flex gap-4 overflow-x-auto snap-x snap-mandatory scrollbar-hide pb-4 -mx-4 px-4"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
              >
                {products.map((product, index) => (
                  <motion.div
                    key={product.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                    className="flex-shrink-0 w-[85%] snap-center"
                  >
                    <ProductRevealCard
                      name={product.name}
                      price={`₹${product.price.toFixed(2)}`}
                      originalPrice={`₹${(product.price * 1.3).toFixed(2)}`}
                      image={product.image || "/placeholder.png"}
                      description={product.description || `${product.name} from the ${product.series} series.`}
                      rating={product.rating}
                      reviewCount={product.review_count}
                      series={product.series}
                      year={product.year}
                      color={product.color}
                      rarity={product.rarity}
                      productId={product.id}
                      stock={product.stock}
                      isFavorite={isInWishlist(product.id)}
                      isInCart={isInCart(product.id)}
                      onAdd={() => toggleCart(product)}
                      onFavorite={() => toggleWishlist(product)}
                    />
                  </motion.div>
                ))}
              </div>

              {/* Pagination Dots */}
              <div className="flex justify-center gap-2 mt-4">
                {products.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => scrollToCard(index)}
                    className={`w-2 h-2 rounded-full transition-all duration-300 ${
                      index === activeIndex
                        ? 'w-6 bg-orange-500'
                        : 'bg-gray-300 hover:bg-gray-400'
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Desktop Grid */}
            <div className="hidden sm:grid sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-7 lg:gap-8 justify-items-center">
              {products.map((product, index) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{
                    duration: 0.5,
                    ease: "easeOut",
                    delay: index * 0.1,
                  }}
                >
                  <ProductRevealCard
                    name={product.name}
                    price={`₹${product.price.toFixed(2)}`}
                    originalPrice={`₹${(product.price * 1.3).toFixed(2)}`}
                    image={product.image || "/placeholder.png"}
                    description={product.description || `${product.name} from the ${product.series} series.`}
                    rating={product.rating}
                    reviewCount={product.review_count}
                    series={product.series}
                    year={product.year}
                    color={product.color}
                    rarity={product.rarity}
                    productId={product.id}
                    stock={product.stock}
                    isFavorite={isInWishlist(product.id)}
                    isInCart={isInCart(product.id)}
                    onAdd={() => toggleCart(product)}
                    onFavorite={() => toggleWishlist(product)}
                  />
                </motion.div>
              ))}
            </div>
          </>
        )}

        {/* View All Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="text-center mt-12 sm:mt-16"
        >
          <Link href="/collection">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.98 }}
              className="px-8 py-3 sm:py-3.5 bg-gray-900 text-white text-sm sm:text-base font-bold rounded-full hover:bg-gray-800 transition-colors duration-300 shadow-lg hover:shadow-xl"
            >
              View Full Collection
            </motion.button>
          </Link>
        </motion.div>
      </div>
    </section>
  )
}
