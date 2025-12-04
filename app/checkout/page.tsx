"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { Navbar } from "@/components/navbar"
import { PaymentFlipCard } from "@/components/payment-flip-card"
import { useCart } from "@/context/cart-context"
import { useAuth } from "@/context/auth-context"
import { motion, AnimatePresence } from "framer-motion"
import type { StoreSettings } from "@/lib/supabase/database.types"
import {
  CreditCard,
  Truck,
  MapPin,
  Phone,
  Mail,
  User,
  Check,
  Loader2,
  ShoppingBag,
  Lock,
  QrCode,
  Tag,
  ChevronLeft,
} from "lucide-react"

type PaymentMethod = "cod" | "online"

export default function CheckoutPage() {
  const router = useRouter()
  const { items, getSubtotal, clearCart } = useCart()
  const { user, isLoading: authLoading, getAuthHeaders } = useAuth()

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
  })
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cod")
  const [transactionId, setTransactionId] = useState("")
  const [discountCode, setDiscountCode] = useState("")
  const [discountApplied, setDiscountApplied] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [orderPlaced, setOrderPlaced] = useState(false)
  const [orderId, setOrderId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [settings, setSettings] = useState<StoreSettings | null>(null)
  const [loadingSettings, setLoadingSettings] = useState(true)
  const [step, setStep] = useState<"details" | "payment">("details")
  const [shippingPaymentScreenshot, setShippingPaymentScreenshot] = useState<string | null>(null)
  const [shippingPaymentCompleted, setShippingPaymentCompleted] = useState(false)

  // Fetch store settings
  useEffect(() => {
    async function fetchSettings() {
      try {
        const res = await fetch("/api/settings", { cache: 'no-store' })
        if (res.ok) {
          const data = await res.json()
          // Handle both formats: {settings: {...}} or direct settings object
          const settingsData = data.settings || data
          console.log('Fetched settings at checkout:', settingsData)
          console.log('Shipping charges amount:', settingsData?.shipping_charges_amount)
          setSettings(settingsData)
        } else {
          console.error("Failed to fetch settings:", await res.text())
        }
      } catch (err) {
        console.error("Error fetching settings:", err)
      } finally {
        setLoadingSettings(false)
      }
    }
    fetchSettings()
  }, [])

  const subtotal = getSubtotal()
  // Use shipping charges amount from settings (defaults to 50 if not set)
  // shipping_charges_amount is used for both regular shipping and COD upfront collection
  const shipping = settings?.shipping_charges_amount && 
                   typeof settings.shipping_charges_amount === 'number' && 
                   settings.shipping_charges_amount > 0
    ? settings.shipping_charges_amount 
    : 50
  const codCharges = paymentMethod === "cod" && settings?.cod_charges ? settings.cod_charges : 0
  
  // Shipping charges for upfront payment (COD only)
  const shippingChargesUpfront = paymentMethod === "cod" && 
    settings?.shipping_charges_collection_enabled && 
    settings?.shipping_charges_amount 
    ? settings.shipping_charges_amount 
    : 0

  // Calculate discount
  const discountAmount = discountApplied && settings?.discount_enabled && settings?.discount_percentage
    ? (subtotal * settings.discount_percentage) / 100
    : 0

  // Calculate totals (removed tax)
  const orderSubtotal = subtotal - discountAmount
  const orderTotal = orderSubtotal + shipping + codCharges
  
  // For COD: total includes shipping charges upfront
  // Remaining amount to be paid on delivery = orderTotal - shippingChargesUpfront
  const total = paymentMethod === "cod" && shippingChargesUpfront > 0
    ? orderTotal // Total includes upfront shipping
    : orderTotal
  const codRemainingAmount = paymentMethod === "cod" && shippingChargesUpfront > 0
    ? orderTotal - shippingChargesUpfront
    : orderTotal

  // Pre-fill email from user
  useEffect(() => {
    if (user?.email) {
      setFormData((prev) => ({
        ...prev,
        email: user.email || "",
        fullName: user.user_metadata?.full_name || "",
      }))
    }
  }, [user])

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login?redirect=/checkout")
    }
  }, [user, authLoading, router])

  // Redirect to cart if empty
  useEffect(() => {
    if (!authLoading && items.length === 0 && !orderPlaced) {
      router.push("/cart")
    }
  }, [items, authLoading, router, orderPlaced])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }))
  }

  const handleApplyDiscount = () => {
    if (settings?.discount_enabled && settings?.discount_code) {
      if (discountCode.toUpperCase() === settings.discount_code.toUpperCase()) {
        setDiscountApplied(true)
        setError(null)
      } else {
        setError("Invalid discount code")
        setDiscountApplied(false)
      }
    }
  }

  const validateDetails = () => {
    if (!formData.fullName || !formData.email || !formData.phone ||
        !formData.address || !formData.city || !formData.state || !formData.pincode) {
      setError("Please fill in all required fields")
      return false
    }
    if (!/^[0-9]{6}$/.test(formData.pincode)) {
      setError("Please enter a valid 6-digit PIN code")
      return false
    }
    setError(null)
    return true
  }

  const handleContinueToPayment = () => {
    if (validateDetails()) {
      setStep("payment")
    }
  }

  const handleSubmit = async (txnId?: string, screenshot?: string, shippingScreenshot?: string) => {
    if (paymentMethod === "online" && !txnId && !transactionId) {
      setError("Please enter the transaction ID after payment")
      return
    }

    // Check if shipping payment is required for COD
    if (paymentMethod === "cod" && settings?.shipping_charges_collection_enabled && shippingChargesUpfront > 0) {
      if (!shippingPaymentScreenshot && !shippingScreenshot) {
        setError("Please complete shipping payment first")
        return
      }
    }

    setIsProcessing(true)
    setError(null)

    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify({
          items: items.map(item => ({
            id: item.id,
            quantity: item.quantity,
            price: item.price,
          })),
          shipping_address: formData,
          total,
          payment_method: paymentMethod,
          transaction_id: txnId || transactionId || null,
          payment_screenshot: screenshot || null,
          discount_amount: discountAmount,
          shipping_charges: shippingChargesUpfront > 0 ? shippingChargesUpfront : null,
          shipping_payment_screenshot: shippingScreenshot || shippingPaymentScreenshot || null,
          shipping_payment_status: shippingChargesUpfront > 0 && (shippingScreenshot || shippingPaymentScreenshot) ? 'pending' : null,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create order')
      }

      // Clear cart and show success
      setOrderId(data.order.id)
      clearCart()
      setOrderPlaced(true)
    } catch (err) {
      console.error('Checkout error:', err)
      setError(err instanceof Error ? err.message : 'Failed to place order. Please try again.')
    } finally {
      setIsProcessing(false)
    }
  }

  // Loading state
  if (authLoading || loadingSettings) {
    return (
      <>
        <Navbar />
        <main className="min-h-[calc(100vh-200px)] flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-red-500" />
        </main>
      </>
    )
  }

  // Not authenticated
  if (!user) {
    return null
  }

  // Order success state
  if (orderPlaced) {
    return (
      <>
        <Navbar />
        <main className="min-h-[calc(100vh-200px)] flex items-center justify-center px-4 py-12">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center max-w-md"
          >
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Check className="w-10 h-10 text-green-500" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Order Placed!</h1>
            {orderId && (
              <p className="text-sm text-gray-500 mb-2">
                Order ID: <span className="font-mono font-medium">{orderId.slice(0, 8).toUpperCase()}</span>
              </p>
            )}
            <p className="text-gray-600 mb-4">
              {paymentMethod === "online"
                ? "Your payment is being verified. We'll confirm your order shortly."
                : "Thank you for your order. Pay when you receive your package."
              }
            </p>
            {paymentMethod === "online" && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-6">
                <p className="text-amber-700 text-sm">
                  Payment verification usually takes 15-30 minutes. You'll receive a confirmation once verified.
                </p>
              </div>
            )}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/orders"
                className="px-6 py-3 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-lg transition-colors"
              >
                View Orders
              </Link>
              <Link
                href="/collection"
                className="px-6 py-3 border border-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors"
              >
                Continue Shopping
              </Link>
            </div>
          </motion.div>
        </main>
      </>
    )
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gray-50 py-4 sm:py-8 px-3 sm:px-4">
        <div className="max-w-6xl mx-auto">
          {/* Header with step indicator */}
          <div className="flex items-center justify-between mb-4 sm:mb-8">
            <motion.h1
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-xl sm:text-3xl font-bold text-gray-900"
            >
              Checkout
            </motion.h1>
            <div className="flex items-center gap-2 text-sm">
              <span className={`px-3 py-1 rounded-full ${step === "details" ? "bg-red-500 text-white" : "bg-gray-200 text-gray-600"}`}>
                1. Details
              </span>
              <span className={`px-3 py-1 rounded-full ${step === "payment" ? "bg-red-500 text-white" : "bg-gray-200 text-gray-600"}`}>
                2. Payment
              </span>
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-4 sm:gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-4 sm:space-y-6">
              <AnimatePresence mode="wait">
                {step === "details" ? (
                  <motion.div
                    key="details"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-4 sm:space-y-6"
                  >
                    {/* Contact Information */}
                    <div className="bg-white rounded-lg sm:rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
                      <h2 className="text-base sm:text-lg font-bold text-gray-900 mb-3 sm:mb-4 flex items-center gap-2">
                        <Mail className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                        Contact Information
                      </h2>
                      <div className="grid sm:grid-cols-2 gap-3 sm:gap-4">
                        <div>
                          <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">Full Name *</label>
                          <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
                            <input
                              type="text"
                              name="fullName"
                              value={formData.fullName}
                              onChange={handleInputChange}
                              required
                              className="w-full pl-9 sm:pl-10 pr-3 sm:pr-4 py-2.5 sm:py-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">Email *</label>
                          <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
                            <input
                              type="email"
                              name="email"
                              value={formData.email}
                              onChange={handleInputChange}
                              required
                              className="w-full pl-9 sm:pl-10 pr-3 sm:pr-4 py-2.5 sm:py-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                            />
                          </div>
                        </div>
                        <div className="sm:col-span-2">
                          <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">Phone Number *</label>
                          <div className="relative">
                            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
                            <input
                              type="tel"
                              name="phone"
                              value={formData.phone}
                              onChange={handleInputChange}
                              required
                              placeholder="+91 XXXXX XXXXX"
                              className="w-full pl-9 sm:pl-10 pr-3 sm:pr-4 py-2.5 sm:py-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Shipping Address */}
                    <div className="bg-white rounded-lg sm:rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
                      <h2 className="text-base sm:text-lg font-bold text-gray-900 mb-3 sm:mb-4 flex items-center gap-2">
                        <Truck className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                        Shipping Address
                      </h2>
                      <div className="space-y-3 sm:space-y-4">
                        <div>
                          <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">Street Address *</label>
                          <div className="relative">
                            <MapPin className="absolute left-3 top-3 h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
                            <input
                              type="text"
                              name="address"
                              value={formData.address}
                              onChange={handleInputChange}
                              required
                              placeholder="House/Flat No., Street, Area"
                              className="w-full pl-9 sm:pl-10 pr-3 sm:pr-4 py-2.5 sm:py-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
                          <div className="col-span-2 sm:col-span-1">
                            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">City *</label>
                            <input
                              type="text"
                              name="city"
                              value={formData.city}
                              onChange={handleInputChange}
                              required
                              className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                            />
                          </div>
                          <div>
                            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">State *</label>
                            <input
                              type="text"
                              name="state"
                              value={formData.state}
                              onChange={handleInputChange}
                              required
                              className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                            />
                          </div>
                          <div>
                            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">PIN Code *</label>
                            <input
                              type="text"
                              name="pincode"
                              value={formData.pincode}
                              onChange={handleInputChange}
                              required
                              pattern="[0-9]{6}"
                              maxLength={6}
                              className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Continue Button */}
                    <button
                      onClick={handleContinueToPayment}
                      className="w-full py-3 px-4 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
                    >
                      Continue to Payment
                      <ChevronLeft className="w-4 h-4 rotate-180" />
                    </button>
                  </motion.div>
                ) : (
                  <motion.div
                    key="payment"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="space-y-4 sm:space-y-6"
                  >
                    {/* Back Button */}
                    <button
                      onClick={() => setStep("details")}
                      className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      Back to details
                    </button>

                    {/* Payment Method Selection */}
                    <div className="bg-white rounded-lg sm:rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
                      <h2 className="text-base sm:text-lg font-bold text-gray-900 mb-3 sm:mb-4 flex items-center gap-2">
                        <CreditCard className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                        Select Payment Method
                      </h2>
                      <div className="space-y-3">
                        {/* COD Option */}
                        {settings?.cod_enabled && (
                          <label
                            className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                              paymentMethod === "cod"
                                ? "border-red-500 bg-red-50"
                                : "border-gray-200 hover:border-gray-300"
                            }`}
                          >
                            <input
                              type="radio"
                              name="paymentMethod"
                              value="cod"
                              checked={paymentMethod === "cod"}
                              onChange={() => setPaymentMethod("cod")}
                              className="mt-1 text-red-500 focus:ring-red-500"
                            />
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <Truck className="w-5 h-5 text-gray-600" />
                                <span className="font-medium text-gray-900">Cash on Delivery</span>
                                {settings.cod_charges > 0 && (
                                  <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded">
                                    +₹{settings.cod_charges} COD Fee
                                  </span>
                                )}
                              </div>
                              <p className="text-sm text-gray-500 mt-1">Pay when you receive your order</p>
                            </div>
                          </label>
                        )}

                        {/* Online Payment Option */}
                        {settings?.online_payment_enabled && (
                          <label
                            className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                              paymentMethod === "online"
                                ? "border-red-500 bg-red-50"
                                : "border-gray-200 hover:border-gray-300"
                            }`}
                          >
                            <input
                              type="radio"
                              name="paymentMethod"
                              value="online"
                              checked={paymentMethod === "online"}
                              onChange={() => setPaymentMethod("online")}
                              className="mt-1 text-red-500 focus:ring-red-500"
                            />
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <QrCode className="w-5 h-5 text-gray-600" />
                                <span className="font-medium text-gray-900">Pay Online (UPI)</span>
                                <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">
                                  Recommended
                                </span>
                              </div>
                              <p className="text-sm text-gray-500 mt-1">Scan QR code and pay using any UPI app</p>
                            </div>
                          </label>
                        )}
                      </div>
                    </div>

                    {/* Online Payment - Flip Card */}
                    {paymentMethod === "online" && settings && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white rounded-lg sm:rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6"
                      >
                        <h3 className="text-base font-bold text-gray-900 mb-4 text-center">
                          Contact Us & Make Payment
                        </h3>
                        <PaymentFlipCard
                          settings={settings}
                          isProcessing={isProcessing}
                          onPaymentComplete={(data) => {
                            setTransactionId(data.transactionId)
                            handleSubmit(data.transactionId, data.screenshot)
                          }}
                        />
                      </motion.div>
                    )}

                    {/* COD Payment Section */}
                    {paymentMethod === "cod" && (
                      <div className="space-y-4">
                        {/* Shipping Payment for COD */}
                        {settings?.shipping_charges_collection_enabled && shippingChargesUpfront > 0 && !shippingPaymentCompleted && (
                          <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-white rounded-lg sm:rounded-xl shadow-sm border-2 border-amber-200 p-4 sm:p-6"
                          >
                            <div className="mb-4">
                              <h3 className="text-lg font-bold text-gray-900 mb-3 text-center flex items-center justify-center gap-2">
                                <Truck className="w-5 h-5 text-amber-600" />
                                Pay Shipping Charges
                              </h3>
                              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-sm text-amber-900 font-medium">Amount to Pay Now:</span>
                                  <span className="text-lg font-bold text-amber-900">₹{shippingChargesUpfront.toFixed(2)}</span>
                                </div>
                                <div className="flex items-center justify-between text-xs text-amber-700 pt-2 border-t border-amber-200">
                                  <span>Remaining Amount (Pay on Delivery):</span>
                                  <span className="font-medium">₹{codRemainingAmount.toFixed(2)}</span>
                                </div>
                                <p className="text-xs text-amber-700 mt-3">
                                  Please complete the shipping payment before placing your order.
                                </p>
                              </div>
                            </div>
                            <PaymentFlipCard
                              settings={settings}
                              isProcessing={isProcessing}
                              amount={shippingChargesUpfront}
                              onPaymentComplete={(data) => {
                                setShippingPaymentScreenshot(data.screenshot)
                                setShippingPaymentCompleted(true)
                              }}
                            />
                          </motion.div>
                        )}

                        {/* COD Place Order Button */}
                        {(!settings?.shipping_charges_collection_enabled || !shippingChargesUpfront || shippingPaymentCompleted) && (
                          <button
                            onClick={() => handleSubmit(undefined, undefined, shippingPaymentScreenshot || undefined)}
                            disabled={isProcessing}
                            className="w-full py-3 px-4 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                          >
                            {isProcessing ? (
                              <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                Processing...
                              </>
                            ) : (
                              <>
                                <Lock className="w-4 h-4" />
                                Place Order (COD)
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-white rounded-lg sm:rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6 sticky top-24"
              >
                <h2 className="text-base sm:text-lg font-bold text-gray-900 mb-3 sm:mb-4 flex items-center gap-2">
                  <ShoppingBag className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                  Order Summary
                </h2>

                {/* Items */}
                <div className="space-y-2 sm:space-y-3 mb-3 sm:mb-4 max-h-48 sm:max-h-60 overflow-y-auto">
                  {items.map((item) => (
                    <div key={item.id} className="flex gap-2 sm:gap-3">
                      <div className="relative w-12 h-12 sm:w-16 sm:h-16 rounded-md sm:rounded-lg overflow-hidden bg-gray-100 shrink-0">
                        <Image src={item.image || "/placeholder.png"} alt={item.name} fill className="object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs sm:text-sm font-medium text-gray-900 truncate">{item.name}</p>
                        <p className="text-[10px] sm:text-xs text-gray-500">Qty: {item.quantity}</p>
                        <p className="text-xs sm:text-sm font-medium">₹{(item.price * item.quantity).toFixed(2)}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Discount Code */}
                {settings?.discount_enabled && settings?.discount_code && !discountApplied && (
                  <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                    <label className="block text-xs font-medium text-gray-700 mb-1.5">Have a discount code?</label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                          type="text"
                          value={discountCode}
                          onChange={(e) => setDiscountCode(e.target.value.toUpperCase())}
                          placeholder="Enter code"
                          className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent uppercase"
                        />
                      </div>
                      <button
                        onClick={handleApplyDiscount}
                        className="px-3 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors"
                      >
                        Apply
                      </button>
                    </div>
                  </div>
                )}

                {discountApplied && (
                  <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-600" />
                    <span className="text-sm text-green-700">Discount applied: {settings?.discount_percentage}% off</span>
                  </div>
                )}

                <div className="border-t border-gray-200 pt-3 sm:pt-4 space-y-1.5 sm:space-y-2 text-xs sm:text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Subtotal</span>
                    <span>₹{subtotal.toFixed(2)}</span>
                  </div>
                  {discountAmount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Discount ({settings?.discount_percentage}%)</span>
                      <span>-₹{discountAmount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-600">Shipping</span>
                    <span>
                      {loadingSettings ? (
                        <span className="text-gray-400 text-xs">Loading...</span>
                      ) : (
                        `₹${shipping.toFixed(2)}`
                      )}
                    </span>
                  </div>
                  {codCharges > 0 && (
                    <div className="flex justify-between text-amber-600">
                      <span>COD Charges</span>
                      <span>₹{codCharges.toFixed(2)}</span>
                    </div>
                  )}
                  
                  {/* Separator for COD with upfront shipping */}
                  {paymentMethod === "cod" && shippingChargesUpfront > 0 && (
                    <>
                      <div className="border-t border-gray-200 pt-2 mt-2"></div>
                      <div className="flex justify-between font-medium text-amber-700 bg-amber-50 -mx-3 px-3 py-1.5 rounded">
                        <span>Shipping Charges (Pay Now)</span>
                        <span>₹{shippingChargesUpfront.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-gray-500 text-xs">
                        <span>Remaining (Pay on Delivery)</span>
                        <span>₹{codRemainingAmount.toFixed(2)}</span>
                      </div>
                    </>
                  )}
                  
                  <div className="border-t border-gray-200 pt-2 flex justify-between font-bold text-sm sm:text-base">
                    <span>{paymentMethod === "cod" && shippingChargesUpfront > 0 ? "Total Order Value" : "Total"}</span>
                    <span>₹{orderTotal.toFixed(2)}</span>
                  </div>
                </div>

                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-3 p-2.5 sm:p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-xs sm:text-sm"
                  >
                    {error}
                  </motion.div>
                )}

                <p className="text-[10px] sm:text-xs text-gray-500 text-center mt-4">
                  By placing this order, you agree to our Terms of Service
                </p>
              </motion.div>
            </div>
          </div>
        </div>
      </main>
    </>
  )
}
