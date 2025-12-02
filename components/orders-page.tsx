"use client"
import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ArrowLeft, ShoppingBag, CreditCard, Truck, Package, ChevronRight } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { OrderItemCard } from "@/components/order-item-card"
import { OrderConfirmationCard } from "@/components/order-confirmation-card"
import { useRouter } from "next/navigation"

// Sample cart items
const initialCartItems = [
  {
    id: 1,
    name: "Twin Mill III",
    series: "HW Dream Garage",
    price: 12.99,
    scale: "1:64",
    quantity: 2,
    image: "/hw/red-hot-wheels-twin-mill-car.jpg",
  },
  {
    id: 2,
    name: "Bone Shaker",
    series: "HW Legends",
    price: 14.99,
    scale: "1:64",
    quantity: 1,
    image: "/hw/black-hot-wheels-bone-shaker-car.jpg",
  },
  {
    id: 6,
    name: "Porsche 911 GT3",
    series: "HW Exotics",
    price: 16.99,
    scale: "1:64",
    quantity: 1,
    image: "/hw/white-hot-wheels-porsche-911-gt3.jpg",
  },
]

// Sample order history
const orderHistory = [
  {
    id: "HW-2024-001234",
    date: "Dec 15, 2024",
    status: "Delivered",
    total: 45.97,
    items: 3,
  },
  {
    id: "HW-2024-001198",
    date: "Dec 8, 2024",
    status: "In Transit",
    total: 29.98,
    items: 2,
  },
  {
    id: "HW-2024-001156",
    date: "Nov 28, 2024",
    status: "Delivered",
    total: 67.95,
    items: 5,
  },
]

type TabType = "cart" | "history"

export function OrdersPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<TabType>("cart")
  const [cartItems, setCartItems] = useState(initialCartItems)
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)

  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const shipping = subtotal > 50 ? 0 : 4.99
  const tax = subtotal * 0.08
  const total = subtotal + shipping + tax

  const handleQuantityChange = (id: number, newQuantity: number) => {
    setCartItems((items) => items.map((item) => (item.id === id ? { ...item, quantity: newQuantity } : item)))
  }

  const handleRemoveItem = (id: number) => {
    setCartItems((items) => items.filter((item) => item.id !== id))
  }

  const handleCheckout = () => {
    setIsProcessing(true)
    setTimeout(() => {
      setIsProcessing(false)
      setShowConfirmation(true)
    }, 1500)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Delivered":
        return "text-emerald-400 bg-emerald-400/10"
      case "In Transit":
        return "text-blue-400 bg-blue-400/10"
      case "Processing":
        return "text-amber-400 bg-amber-400/10"
      default:
        return "text-white/60 bg-white/10"
    }
  }

  if (showConfirmation) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <OrderConfirmationCard
          orderId={`HW-2024-${Math.floor(Math.random() * 9000 + 1000)}`}
          paymentMethod="Credit Card •••• 4242"
          dateTime={new Date().toLocaleString()}
          totalAmount={`$${total.toFixed(2)}`}
          onGoToAccount={() => {
            setShowConfirmation(false)
            setCartItems([])
            setActiveTab("history")
          }}
          buttonText="View My Orders"
        />
      </div>
    )
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
          <Link href="/wishlist" className="text-gray-500 hover:text-gray-900 transition-colors text-sm">
            Wishlist
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 lg:py-10">
        {/* Page Title */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Orders</h1>
          <p className="text-gray-500 mt-1">Manage your cart and view order history</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-8">
          <button
            onClick={() => setActiveTab("cart")}
            className={`px-6 py-3 rounded-xl font-medium transition-all ${
              activeTab === "cart"
                ? "bg-red-500 text-white"
                : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
            }`}
          >
            <ShoppingBag className="w-4 h-4 inline mr-2" />
            Cart ({cartItems.length})
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className={`px-6 py-3 rounded-xl font-medium transition-all ${
              activeTab === "history"
                ? "bg-red-500 text-white"
                : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
            }`}
          >
            <Package className="w-4 h-4 inline mr-2" />
            Order History
          </button>
        </div>

        <AnimatePresence mode="wait">
          {activeTab === "cart" ? (
            <motion.div
              key="cart"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="grid gap-8 lg:grid-cols-3"
            >
              {/* Cart Items */}
              <div className="lg:col-span-2 space-y-4">
                {cartItems.length === 0 ? (
                  <Card className="border-gray-200 bg-white">
                    <CardContent className="flex flex-col items-center justify-center py-16">
                      <ShoppingBag className="w-16 h-16 text-gray-300 mb-4" />
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">Your cart is empty</h3>
                      <p className="text-gray-500 mb-6">Start adding some cool cars!</p>
                      <Link href="/collection">
                        <Button className="bg-red-500 hover:bg-red-600">Browse Collection</Button>
                      </Link>
                    </CardContent>
                  </Card>
                ) : (
                  <AnimatePresence>
                    {cartItems.map((item) => (
                      <OrderItemCard
                        key={item.id}
                        imageUrl={item.image}
                        title={item.name}
                        details={[item.series, `Scale: ${item.scale}`]}
                        price={item.price}
                        initialQuantity={item.quantity}
                        onQuantityChange={(qty) => handleQuantityChange(item.id, qty)}
                        onRemove={() => handleRemoveItem(item.id)}
                      />
                    ))}
                  </AnimatePresence>
                )}
              </div>

              {/* Order Summary */}
              {cartItems.length > 0 && (
                <div className="lg:col-span-1">
                  <Card className="border-gray-200 bg-white sticky top-24">
                    <CardContent className="p-6 space-y-6">
                      <h3 className="text-lg font-semibold text-gray-900">Order Summary</h3>

                      <div className="space-y-3 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-500">Subtotal</span>
                          <span className="text-gray-900">${subtotal.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Shipping</span>
                          <span className="text-gray-900">
                            {shipping === 0 ? (
                              <span className="text-emerald-600">Free</span>
                            ) : (
                              `$${shipping.toFixed(2)}`
                            )}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Tax</span>
                          <span className="text-gray-900">${tax.toFixed(2)}</span>
                        </div>
                        <div className="border-t border-gray-200 pt-3 flex justify-between">
                          <span className="font-semibold text-gray-900">Total</span>
                          <span className="font-bold text-xl text-red-500">${total.toFixed(2)}</span>
                        </div>
                      </div>

                      {subtotal < 50 && (
                        <p className="text-xs text-gray-500 bg-gray-50 rounded-lg p-3">
                          Add ${(50 - subtotal).toFixed(2)} more for free shipping
                        </p>
                      )}

                      <Button
                        onClick={handleCheckout}
                        disabled={isProcessing}
                        className="w-full h-12 bg-red-500 hover:bg-red-600 font-semibold rounded-xl"
                      >
                        {isProcessing ? (
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                            className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                          />
                        ) : (
                          <>
                            <CreditCard className="w-4 h-4 mr-2" />
                            Proceed to Checkout
                          </>
                        )}
                      </Button>

                      <div className="flex items-center justify-center gap-2 text-xs text-gray-400">
                        <Truck className="w-4 h-4" />
                        <span>Free shipping on orders over $50</span>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="history"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-4"
            >
              {orderHistory.map((order, index) => (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="border-gray-200 bg-white hover:bg-gray-50 transition-colors cursor-pointer">
                    <CardContent className="p-4 sm:p-6">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-start gap-4">
                          <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0">
                            <Package className="w-6 h-6 text-gray-500" />
                          </div>
                          <div>
                            <h4 className="font-semibold text-gray-900">{order.id}</h4>
                            <p className="text-sm text-gray-500">
                              {order.date} • {order.items} items
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 sm:gap-6">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}
                          >
                            {order.status}
                          </span>
                          <span className="font-bold text-gray-900">${order.total.toFixed(2)}</span>
                          <ChevronRight className="w-5 h-5 text-gray-400" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  )
}
