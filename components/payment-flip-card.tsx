"use client"

import { useState, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Image from "next/image"
import { Phone, Mail, MessageCircle, QrCode, Copy, Check, ExternalLink, Upload, X, Camera, Loader2 } from "lucide-react"
import type { StoreSettings } from "@/lib/supabase/database.types"

interface PaymentFlipCardProps {
  settings: StoreSettings
  onPaymentComplete?: (data: { transactionId: string; screenshot: string }) => void
  isProcessing?: boolean
  amount?: number // Optional amount to display (for shipping charges)
}

export function PaymentFlipCard({ settings, onPaymentComplete, isProcessing, amount }: PaymentFlipCardProps) {
  const [isFlipped, setIsFlipped] = useState(true) // Start with QR code side shown (flipped)
  const [copiedUPI, setCopiedUPI] = useState(false)
  const [transactionId, setTransactionId] = useState("")
  const [screenshot, setScreenshot] = useState<string | null>(null)
  const [showUploadModal, setShowUploadModal] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleCopyUPI = async () => {
    if (settings.upi_id) {
      await navigator.clipboard.writeText(settings.upi_id)
      setCopiedUPI(true)
      setTimeout(() => setCopiedUPI(false), 2000)
    }
  }

  const handleWhatsAppClick = () => {
    if (settings.contact_whatsapp) {
      const phone = settings.contact_whatsapp.replace(/\D/g, "")
      window.open(`https://wa.me/${phone}?text=Hi, I want to place an order`, "_blank")
    }
  }

  const handlePhoneClick = () => {
    if (settings.contact_phone) {
      window.open(`tel:${settings.contact_phone}`, "_blank")
    }
  }

  const handleEmailClick = () => {
    if (settings.contact_email) {
      window.open(`mailto:${settings.contact_email}?subject=Order Inquiry`, "_blank")
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert("File size should be less than 5MB")
        return
      }

      const reader = new FileReader()
      reader.onload = (event) => {
        setScreenshot(event.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleCompletePayment = () => {
    if (!screenshot) {
      alert("Please upload payment screenshot")
      return
    }
    if (!transactionId.trim()) {
      alert("Please enter transaction ID / UTR number")
      return
    }
    onPaymentComplete?.({ transactionId, screenshot })
  }

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Flip Card Container */}
      <div
        className="relative w-full h-[440px] sm:h-[470px] cursor-pointer"
        style={{ perspective: "1000px" }}
        onClick={() => !showUploadModal && setIsFlipped(!isFlipped)}
      >
        <motion.div
          className="relative w-full h-full"
          style={{ transformStyle: "preserve-3d" }}
          animate={{ rotateY: isFlipped ? 180 : 0 }}
          transition={{ duration: 0.6, ease: "easeInOut" }}
        >
          {/* Front Side - Contact Information */}
          <div
            className="absolute inset-0 w-full h-full rounded-2xl overflow-hidden"
            style={{ backfaceVisibility: "hidden" }}
          >
            <div className="h-full bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-6 flex flex-col">
              {/* Header */}
              <div className="text-center mb-5">
                <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Phone className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-bold text-white">Contact Us First</h3>
                <p className="text-gray-400 text-sm mt-1">Reach out to confirm your order</p>
              </div>

              {/* Contact Options */}
              <div className="flex-1 space-y-2.5">
                {settings.contact_phone && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handlePhoneClick()
                    }}
                    className="w-full flex items-center gap-3 p-3.5 bg-white/10 hover:bg-white/20 rounded-xl transition-colors"
                  >
                    <div className="w-9 h-9 bg-blue-500 rounded-lg flex items-center justify-center">
                      <Phone className="w-4 h-4 text-white" />
                    </div>
                    <div className="text-left flex-1">
                      <p className="text-white font-medium text-sm">Call Us</p>
                      <p className="text-gray-400 text-xs">{settings.contact_phone}</p>
                    </div>
                    <ExternalLink className="w-4 h-4 text-gray-500" />
                  </button>
                )}

                {settings.contact_whatsapp && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleWhatsAppClick()
                    }}
                    className="w-full flex items-center gap-3 p-3.5 bg-white/10 hover:bg-white/20 rounded-xl transition-colors"
                  >
                    <div className="w-9 h-9 bg-green-500 rounded-lg flex items-center justify-center">
                      <MessageCircle className="w-4 h-4 text-white" />
                    </div>
                    <div className="text-left flex-1">
                      <p className="text-white font-medium text-sm">WhatsApp</p>
                      <p className="text-gray-400 text-xs">{settings.contact_whatsapp}</p>
                    </div>
                    <ExternalLink className="w-4 h-4 text-gray-500" />
                  </button>
                )}

                {settings.contact_email && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleEmailClick()
                    }}
                    className="w-full flex items-center gap-3 p-3.5 bg-white/10 hover:bg-white/20 rounded-xl transition-colors"
                  >
                    <div className="w-9 h-9 bg-purple-500 rounded-lg flex items-center justify-center">
                      <Mail className="w-4 h-4 text-white" />
                    </div>
                    <div className="text-left flex-1">
                      <p className="text-white font-medium text-sm">Email</p>
                      <p className="text-gray-400 text-xs truncate">{settings.contact_email}</p>
                    </div>
                    <ExternalLink className="w-4 h-4 text-gray-500" />
                  </button>
                )}
              </div>

              {/* Flip Hint */}
              <div className="text-center mt-4">
                <p className="text-gray-500 text-xs">Tap to see payment QR code</p>
                <div className="flex justify-center gap-1 mt-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-gray-600"></div>
                  <div className="w-1.5 h-1.5 rounded-full bg-red-500"></div>
                </div>
              </div>
            </div>
          </div>

          {/* Back Side - QR Code */}
          <div
            className="absolute inset-0 w-full h-full rounded-2xl overflow-hidden"
            style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
          >
            <div className="h-full bg-gradient-to-br from-red-600 via-red-500 to-orange-500 p-4 sm:p-6 flex flex-col">
              {/* Header - Compact on mobile */}
              <div className="text-center mb-2 sm:mb-3">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white rounded-full flex items-center justify-center mx-auto mb-1.5 sm:mb-2">
                  <QrCode className="w-5 h-5 sm:w-6 sm:h-6 text-red-500" />
                </div>
                <h3 className="text-base sm:text-lg font-bold text-white">Scan & Pay</h3>
                {amount && (
                  <div className="mt-1.5 sm:mt-2 px-3 py-1 sm:py-1.5 bg-white/20 rounded-lg inline-block">
                    <p className="text-white text-base sm:text-lg font-bold">₹{amount.toFixed(2)}</p>
                  </div>
                )}
                <p className="text-white/80 text-[10px] sm:text-xs mt-1">Use any UPI app to pay</p>
              </div>

              {/* QR Code */}
              <div className="flex-1 flex flex-col items-center justify-center min-h-0">
                {settings.upi_qr_code ? (
                  <div className="bg-white p-2 sm:p-3 rounded-xl shadow-lg">
                    <Image
                      src={settings.upi_qr_code}
                      alt="UPI QR Code"
                      width={180}
                      height={180}
                      className="w-40 h-40 sm:w-44 sm:h-44 object-contain"
                      unoptimized={settings.upi_qr_code.startsWith('data:') || settings.upi_qr_code.includes('supabase')}
                      onError={(e) => {
                        console.error('Failed to load QR code image:', settings.upi_qr_code)
                        e.currentTarget.style.display = 'none'
                      }}
                    />
                  </div>
                ) : (
                  <div className="w-40 h-40 sm:w-44 sm:h-44 bg-white/20 rounded-xl flex items-center justify-center">
                    <p className="text-white/60 text-sm">QR not available</p>
                  </div>
                )}

                {/* UPI ID */}
                {settings.upi_id && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleCopyUPI()
                    }}
                    className="mt-2 sm:mt-3 flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1 sm:py-1.5 bg-white/20 hover:bg-white/30 rounded-lg transition-colors max-w-full"
                  >
                    <span className="text-white font-medium text-xs sm:text-sm truncate">{settings.upi_id}</span>
                    {copiedUPI ? (
                      <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white shrink-0" />
                    ) : (
                      <Copy className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white/80 shrink-0" />
                    )}
                  </button>
                )}
              </div>

              {/* Flip Hint */}
              <div className="text-center mt-2 sm:mt-3">
                <p className="text-white/60 text-[10px] sm:text-xs">Tap to see contact details</p>
                <div className="flex justify-center gap-1 mt-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-300"></div>
                  <div className="w-1.5 h-1.5 rounded-full bg-white"></div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Complete Payment Section */}
      <div className="mt-6 space-y-4">
        <div className="text-center">
          <p className="text-sm text-gray-600 mb-2">After making payment, complete your order:</p>
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation()
            setShowUploadModal(true)
          }}
          className="w-full py-3.5 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2 shadow-lg"
        >
          <Camera className="w-5 h-5" />
          Complete Payment
        </button>
      </div>

      {/* Upload Modal */}
      <AnimatePresence>
        {showUploadModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowUploadModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl"
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900">Complete Payment</h3>
                <button
                  onClick={() => setShowUploadModal(false)}
                  className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              {/* Screenshot Upload */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Payment Screenshot *
                  </label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />

                  {screenshot ? (
                    <div className="relative">
                      <div className="relative w-full h-48 rounded-xl overflow-hidden bg-gray-100 border-2 border-green-500">
                        <Image
                          src={screenshot}
                          alt="Payment Screenshot"
                          fill
                          className="object-contain"
                        />
                      </div>
                      <button
                        onClick={() => setScreenshot(null)}
                        className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                      <div className="absolute bottom-2 left-2 px-2 py-1 bg-green-500 text-white text-xs font-medium rounded-lg flex items-center gap-1">
                        <Check className="w-3 h-3" />
                        Uploaded
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full h-48 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center gap-3 hover:border-red-500 hover:bg-red-50 transition-all"
                    >
                      <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center">
                        <Upload className="w-7 h-7 text-gray-400" />
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-medium text-gray-700">Upload Screenshot</p>
                        <p className="text-xs text-gray-500 mt-1">PNG, JPG up to 5MB</p>
                      </div>
                    </button>
                  )}
                </div>

                {/* Transaction ID */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Transaction ID / UTR Number *
                  </label>
                  <input
                    type="text"
                    value={transactionId}
                    onChange={(e) => setTransactionId(e.target.value)}
                    placeholder="e.g., 123456789012"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm"
                  />
                  <p className="text-xs text-gray-500 mt-1.5">
                    Find this in your UPI app payment history
                  </p>
                </div>

                {/* Submit Button */}
                <button
                  onClick={handleCompletePayment}
                  disabled={!screenshot || !transactionId.trim() || isProcessing}
                  className="w-full py-3.5 bg-red-500 hover:bg-red-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Check className="w-5 h-5" />
                      Confirm & Place Order
                    </>
                  )}
                </button>

                <p className="text-xs text-gray-500 text-center">
                  Our team will verify your payment and confirm the order
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
