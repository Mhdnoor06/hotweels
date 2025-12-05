"use client"

import { motion, useReducedMotion } from "framer-motion"
import { buttonVariants } from "@/components/ui/button"
import { ShoppingCart, Star, Heart } from "lucide-react"
import { useState } from "react"
import { cn } from "@/lib/utils"
import Link from "next/link"

interface ProductRevealCardProps {
  name?: string
  price?: string
  originalPrice?: string
  image?: string
  description?: string
  rating?: number
  reviewCount?: number
  series?: string
  year?: number
  color?: string
  rarity?: string
  productId?: string
  stock?: number
  isFavorite?: boolean
  isInCart?: boolean
  onAdd?: () => void
  onFavorite?: () => void
  enableAnimations?: boolean
  className?: string
}

export function ProductRevealCard({
  name = "Wheels Frams Car",
  price = "₹199",
  originalPrice = "₹299",
  image = "/placeholder.png",
  description = "A premium die-cast collectible from the Wheels Frams collection.",
  rating = 4.8,
  reviewCount = 124,
  series = "HW Classics",
  year = 2024,
  color = "Red",
  rarity = "Common",
  productId,
  stock = 10,
  isFavorite = false,
  isInCart = false,
  onAdd,
  onFavorite,
  enableAnimations = true,
  className,
}: ProductRevealCardProps) {
  const [isRevealed, setIsRevealed] = useState(false)
  const shouldReduceMotion = useReducedMotion()
  const shouldAnimate = enableAnimations && !shouldReduceMotion

  const handleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation()
    onFavorite?.()
  }

  const handleCardClick = () => {
    // Only toggle on mobile (screens smaller than 640px)
    if (window.innerWidth < 640) {
      setIsRevealed(!isRevealed)
    }
  }

  const containerVariants = {
    rest: {
      scale: 1,
      y: 0,
      filter: "blur(0px)" as const,
    },
    hover: shouldAnimate ? {
      scale: 1.03,
      y: -8,
      filter: "blur(0px)" as const,
      transition: {
        type: "spring" as const,
        stiffness: 300,
        damping: 30,
        mass: 0.8,
      }
    } : {},
  }

  const imageVariants = {
    rest: { scale: 1 },
    hover: { scale: 1.1 },
  }

  const overlayVariants = {
    rest: {
      y: "100%",
      opacity: 0,
      filter: "blur(4px)" as const,
    },
    hover: {
      y: "0%",
      opacity: 1,
      filter: "blur(0px)" as const,
      transition: {
        type: "spring" as const,
        stiffness: 400,
        damping: 28,
        mass: 0.6,
        staggerChildren: 0.1,
        delayChildren: 0.1,
      },
    },
  }

  const contentVariants = {
    rest: {
      opacity: 0,
      y: 20,
      scale: 0.95,
    },
    hover: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        type: "spring" as const,
        stiffness: 400,
        damping: 25,
        mass: 0.5,
      },
    },
  }

  const buttonVariants_motion = {
    rest: { scale: 1, y: 0 },
    hover: shouldAnimate ? {
      scale: 1.05,
      y: -2,
      transition: {
        type: "spring" as const,
        stiffness: 400,
        damping: 25
      }
    } : {},
    tap: shouldAnimate ? { scale: 0.95 } : {},
  }

  const favoriteVariants = {
    rest: { scale: 1, rotate: 0 },
    favorite: {
      scale: [1, 1.3, 1],
      rotate: [0, 10, -10, 0],
      transition: {
        duration: 0.5,
        ease: "easeInOut" as const
      }
    },
  }

  return (
    <motion.div
      data-slot="product-reveal-card"
      initial="rest"
      whileHover="hover"
      animate={isRevealed ? "hover" : "rest"}
      variants={containerVariants}
      onClick={handleCardClick}
      className={cn(
        "relative w-full max-w-[320px] sm:w-80 h-full rounded-2xl border border-gray-200 bg-white text-gray-900 overflow-hidden",
        "shadow-lg shadow-black/5 cursor-pointer group flex flex-col",
        className
      )}
    >
      {/* Image Container */}
      <div className="relative overflow-hidden aspect-square">
        <motion.img
          src={image}
          alt={name}
          className="h-full w-full object-cover"
          variants={imageVariants}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        />
        <div className="absolute inset-0 bg-linear-to-t from-black/30 via-transparent to-transparent" />

        {/* Favorite Button */}
        <motion.button
          onClick={handleFavorite}
          variants={favoriteVariants}
          animate={isFavorite ? "favorite" : "rest"}
          className={cn(
            "absolute top-2 right-2 sm:top-4 sm:right-4 p-1.5 sm:p-2 rounded-full backdrop-blur-sm border border-white/20",
            isFavorite
              ? "bg-red-500 text-white"
              : "bg-white/20 text-white hover:bg-white/30"
          )}
        >
          <Heart className={cn("w-3.5 h-3.5 sm:w-4 sm:h-4", isFavorite && "fill-current")} />
        </motion.button>

        {/* Discount Badge */}
        {originalPrice && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, x: 20 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="absolute top-2 left-2 sm:top-4 sm:left-4 bg-red-500 text-white px-2 py-0.5 sm:px-3 sm:py-1 rounded-full text-[10px] sm:text-xs font-bold"
          >
            {Math.round(((parseFloat(originalPrice.replace('₹', '')) - parseFloat(price.replace('₹', ''))) / parseFloat(originalPrice.replace('₹', ''))) * 100)}% OFF
          </motion.div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 sm:p-6 space-y-2 sm:space-y-3 flex-1 flex flex-col min-h-0">
        {/* Rating */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <div className="flex gap-0.5">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={cn(
                  "w-3 h-3 sm:w-4 sm:h-4",
                  i < Math.floor(rating)
                    ? "text-yellow-400 fill-current"
                    : "text-gray-400"
                )}
              />
            ))}
          </div>
          <span className="text-xs sm:text-sm text-gray-500">
            {rating} ({reviewCount})
          </span>
        </div>

        {/* Product Info */}
        <div className="space-y-0.5 sm:space-y-1 flex-1 flex flex-col min-h-0">
          <motion.h3
            className="text-lg sm:text-xl font-bold leading-tight tracking-tight line-clamp-2 shrink-0"
            initial={{ opacity: 0.9 }}
            whileHover={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            {name}
          </motion.h3>

          <div className="flex items-center gap-1.5 sm:gap-2 mt-auto shrink-0">
            <span className="text-xl sm:text-2xl font-bold text-gray-900">{price}</span>
            {originalPrice && (
              <span className="text-base sm:text-lg text-gray-500 line-through">
                {originalPrice}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Reveal Overlay */}
      <motion.div
        variants={overlayVariants}
        className="absolute inset-0 bg-white/96 backdrop-blur-xl flex flex-col justify-end"
      >
        <div className="p-4 sm:p-6 space-y-3 sm:space-y-4">
          {/* Product Description */}
          <motion.div variants={contentVariants} className="group/desc">
            <h4 className="text-sm sm:text-base font-semibold mb-1.5 sm:mb-2">Product Details</h4>
            <p 
              className="text-xs sm:text-sm text-gray-600 leading-relaxed line-clamp-3 group-hover/desc:line-clamp-none transition-all duration-200"
              title={description}
            >
              {description}
            </p>
          </motion.div>

          {/* Product Specs */}
          <motion.div variants={contentVariants}>
            <div className="grid grid-cols-2 gap-2 sm:gap-3 text-[10px] sm:text-xs">
              <div className="bg-gray-100 rounded-lg p-1.5 sm:p-2 text-center">
                <div className="font-semibold">{series}</div>
                <div className="text-gray-500">Series</div>
              </div>
              <div className="bg-gray-100 rounded-lg p-1.5 sm:p-2 text-center">
                <div className="font-semibold">{year}</div>
                <div className="text-gray-500">Year</div>
              </div>
              <div className="bg-gray-100 rounded-lg p-1.5 sm:p-2 text-center">
                <div className="font-semibold">{color}</div>
                <div className="text-gray-500">Color</div>
              </div>
              <div className="bg-gray-100 rounded-lg p-1.5 sm:p-2 text-center">
                <div className="font-semibold">{rarity}</div>
                <div className="text-gray-500">Rarity</div>
              </div>
            </div>
          </motion.div>

          {/* Action Buttons */}
          <motion.div variants={contentVariants} className="space-y-2 sm:space-y-3">
            <motion.button
              onClick={(e) => {
                e.stopPropagation()
                onAdd?.()
              }}
              variants={buttonVariants_motion}
              initial="rest"
              whileHover="hover"
              whileTap="tap"
              className={cn(
                buttonVariants({ variant: "default" }),
                "w-full h-10 sm:h-12 text-xs sm:text-sm font-medium",
                isInCart
                  ? "bg-green-600 hover:bg-green-700"
                  : "bg-linear-to-r from-gray-900 to-gray-800 hover:from-gray-800 hover:to-gray-900",
                "shadow-lg shadow-gray-900/25"
              )}
            >
              <ShoppingCart className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
              {isInCart ? "Added to Cart" : "Add to Cart"}
            </motion.button>

            {productId ? (
              <Link href={`/product/${productId}`} onClick={(e) => e.stopPropagation()}>
                <motion.button
                  variants={buttonVariants_motion}
                  initial="rest"
                  whileHover="hover"
                  whileTap="tap"
                  className={cn(
                    buttonVariants({ variant: "outline" }),
                    "w-full h-8 sm:h-10 text-xs sm:text-sm font-medium"
                  )}
                >
                  View Details
                </motion.button>
              </Link>
            ) : (
              <motion.button
                onClick={(e) => e.stopPropagation()}
                variants={buttonVariants_motion}
                initial="rest"
                whileHover="hover"
                whileTap="tap"
                className={cn(
                  buttonVariants({ variant: "outline" }),
                  "w-full h-8 sm:h-10 text-xs sm:text-sm font-medium"
                )}
              >
                View Details
              </motion.button>
            )}
          </motion.div>
        </div>
      </motion.div>
    </motion.div>
  )
}
