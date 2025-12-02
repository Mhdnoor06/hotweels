"use client"

import type * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { CheckCircle2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

interface OrderConfirmationCardProps {
  orderId: string
  paymentMethod: string
  dateTime: string
  totalAmount: string
  onGoToAccount: () => void
  title?: string
  buttonText?: string
  icon?: React.ReactNode
  className?: string
}

export const OrderConfirmationCard: React.FC<OrderConfirmationCardProps> = ({
  orderId,
  paymentMethod,
  dateTime,
  totalAmount,
  onGoToAccount,
  title = "Your order has been successfully submitted",
  buttonText = "Go to my account",
  icon = <CheckCircle2 className="h-14 w-14 text-emerald-500" />,
  className,
}) => {
  const details = [
    { label: "Order ID", value: orderId },
    { label: "Payment Method", value: paymentMethod },
    { label: "Date & Time", value: dateTime },
    { label: "Total", value: totalAmount, isBold: true },
  ]

  const containerVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.4,
        ease: "easeInOut",
        staggerChildren: 0.1,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100 } },
  }

  return (
    <AnimatePresence>
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        aria-live="polite"
        className={cn("w-full max-w-md rounded-2xl border border-gray-200 bg-white shadow-xl p-8", className)}
      >
        <div className="flex flex-col items-center space-y-6 text-center">
          <motion.div variants={itemVariants}>{icon}</motion.div>

          <motion.h2 variants={itemVariants} className="text-2xl font-semibold text-gray-900">
            {title}
          </motion.h2>

          <motion.div variants={itemVariants} className="w-full space-y-4 pt-4">
            {details.map((item, index) => (
              <div
                key={item.label}
                className={cn("flex items-center justify-between border-b border-gray-200 pb-4 text-sm", {
                  "border-none pb-0": index === details.length - 1,
                })}
              >
                <span className="text-gray-500">{item.label}</span>
                <span className={cn("text-gray-900", item.isBold && "text-lg font-bold text-red-500")}>
                  {item.value}
                </span>
              </div>
            ))}
          </motion.div>

          <motion.div variants={itemVariants} className="w-full pt-4">
            <Button
              onClick={onGoToAccount}
              className="w-full h-12 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-xl"
              size="lg"
            >
              {buttonText}
            </Button>
          </motion.div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
