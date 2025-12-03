"use client"

import { useState } from "react"
import { motion, AnimatePresence, type HTMLMotionProps } from "framer-motion"
import { Minus, Plus, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface OrderItemCardProps extends Omit<HTMLMotionProps<"div">, "children"> {
  imageUrl: string
  title: string
  details: string[]
  price: number
  initialQuantity?: number
  onQuantityChange?: (quantity: number) => void
  onRemove?: () => void
  imageAlt?: string
}

export function OrderItemCard({
  className,
  imageUrl,
  title,
  details,
  price,
  initialQuantity = 1,
  onQuantityChange,
  onRemove,
  imageAlt = "Product image",
  ...props
}: OrderItemCardProps) {
  const [quantity, setQuantity] = useState(initialQuantity)

  const handleQuantityChange = (newQuantity: number) => {
    if (newQuantity >= 1) {
      setQuantity(newQuantity)
      onQuantityChange?.(newQuantity)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -100 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className={cn(
        "relative flex items-center gap-4 p-4 w-full rounded-2xl",
        "bg-white",
        "border border-gray-200",
        "shadow-sm",
        className,
      )}
      {...props}
    >
      {/* Image */}
      <motion.div
        className="relative w-20 h-20 flex-shrink-0 rounded-xl overflow-hidden bg-gray-100"
        whileHover={{ scale: 1.02 }}
      >
        <img src={imageUrl || "/placeholder.png"} alt={imageAlt} className="w-full h-full object-cover" />
      </motion.div>

      {/* Details */}
      <div className="flex-grow min-w-0">
        <h3 className="font-semibold text-gray-900 truncate">{title}</h3>
        {details.map((detail, index) => (
          <p key={index} className="text-sm text-gray-500 truncate">
            {detail}
          </p>
        ))}
        <p className="text-red-500 font-bold mt-1">₹{(price * quantity).toFixed(2)}</p>
      </div>

      {/* Quantity Stepper */}
      <div className="flex items-center gap-1.5">
        <motion.button
          onClick={() => handleQuantityChange(quantity - 1)}
          disabled={quantity === 1}
          whileTap={{ scale: 0.9 }}
          className="p-2 bg-gray-100 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gray-200 transition-colors"
          aria-label="Decrease quantity"
        >
          <Minus className="w-4 h-4 text-gray-700" />
        </motion.button>

        <div className="relative w-8 h-8 flex items-center justify-center font-bold text-gray-900">
          <AnimatePresence mode="popLayout">
            <motion.span
              key={quantity}
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -10, opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="absolute"
            >
              {quantity}
            </motion.span>
          </AnimatePresence>
        </div>

        <motion.button
          onClick={() => handleQuantityChange(quantity + 1)}
          whileTap={{ scale: 0.9 }}
          className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          aria-label="Increase quantity"
        >
          <Plus className="w-4 h-4 text-gray-700" />
        </motion.button>
      </div>

      {/* Remove button */}
      {onRemove && (
        <motion.button
          onClick={onRemove}
          whileTap={{ scale: 0.9 }}
          className="p-2 text-gray-400 hover:text-red-500 transition-colors"
          aria-label="Remove item"
        >
          <Trash2 className="w-4 h-4" />
        </motion.button>
      )}
    </motion.div>
  )
}
