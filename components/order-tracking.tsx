"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Package,
  Truck,
  MapPin,
  CheckCircle2,
  Clock,
  ExternalLink,
  Loader2,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Navigation,
} from "lucide-react"
import { useAuth } from "@/context/auth-context"

interface TrackingEvent {
  date: string
  status: string
  activity: string
  location: string
}

interface TrackingData {
  orderId: string
  status: string
  hasShipment: boolean
  awbCode?: string
  courierName?: string
  shiprocketStatus?: string
  statusLabel?: string
  estimatedDelivery?: string
  deliveredDate?: string
  trackingUrl?: string
  pickupDate?: string
  events?: TrackingEvent[]
  message?: string
}

interface OrderTrackingProps {
  orderId: string
  orderStatus: string
  compact?: boolean
}

export function OrderTracking({ orderId, orderStatus, compact = false }: OrderTrackingProps) {
  const { getAuthHeaders } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [tracking, setTracking] = useState<TrackingData | null>(null)
  const [error, setError] = useState<string | null>(null)

  const fetchTracking = async () => {
    if (tracking) {
      setIsOpen(!isOpen)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/orders/${orderId}/track`, {
        headers: getAuthHeaders(),
      })
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch tracking')
      }

      setTracking(data.tracking)
      setIsOpen(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch tracking')
    } finally {
      setLoading(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'delivered':
        return <CheckCircle2 className="w-4 h-4" />
      case 'shipped':
      case 'in_transit':
        return <Truck className="w-4 h-4" />
      case 'out_for_delivery':
        return <Navigation className="w-4 h-4" />
      default:
        return <Package className="w-4 h-4" />
    }
  }

  const getProgressSteps = () => {
    const steps = [
      { key: 'ordered', label: 'Ordered', done: true },
      { key: 'shipped', label: 'Shipped', done: ['shipped', 'delivered'].includes(orderStatus) },
      { key: 'transit', label: 'In Transit', done: tracking?.shiprocketStatus?.toLowerCase().includes('transit') || orderStatus === 'delivered' },
      { key: 'delivered', label: 'Delivered', done: orderStatus === 'delivered' },
    ]
    return steps
  }

  // Don't show tracking for cancelled orders
  if (orderStatus === 'cancelled') {
    return null
  }

  return (
    <div className="mt-4 pt-4 border-t border-gray-200">
      <button
        onClick={fetchTracking}
        disabled={loading}
        className="w-full flex items-center justify-between p-3 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors text-left"
      >
        <div className="flex items-center gap-2">
          {loading ? (
            <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
          ) : (
            <Truck className="w-4 h-4 text-blue-600" />
          )}
          <span className="text-sm font-medium text-blue-700">
            {loading ? 'Loading tracking...' : 'Track Order'}
          </span>
        </div>
        {!loading && (
          isOpen ? <ChevronUp className="w-4 h-4 text-blue-600" /> : <ChevronDown className="w-4 h-4 text-blue-600" />
        )}
      </button>

      <AnimatePresence>
        {isOpen && tracking && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="pt-4 space-y-4">
              {/* Show full tracking UI only when shipment exists */}
              {tracking.hasShipment ? (
                <>
                  {/* Progress Bar */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      {getProgressSteps().map((step, index, arr) => (
                        <div key={step.key} className="flex items-center">
                          <div className="flex flex-col items-center">
                            <div
                              className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                                step.done
                                  ? 'bg-green-500 text-white'
                                  : 'bg-gray-200 text-gray-400'
                              }`}
                            >
                              {step.done ? <CheckCircle2 className="w-3.5 h-3.5" /> : index + 1}
                            </div>
                            <span className={`text-xs mt-1 ${step.done ? 'text-gray-900' : 'text-gray-400'}`}>
                              {step.label}
                            </span>
                          </div>
                          {index < arr.length - 1 && (
                            <div className={`w-8 sm:w-12 h-0.5 mx-1 ${step.done ? 'bg-green-500' : 'bg-gray-200'}`} />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Status Card */}
                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-xs text-gray-500">Current Status</p>
                        <p className="font-semibold text-gray-900 flex items-center gap-2">
                          {getStatusIcon(tracking.shiprocketStatus || orderStatus)}
                          {tracking.statusLabel || 'Processing'}
                        </p>
                      </div>
                      {tracking.estimatedDelivery && (
                        <div className="text-right">
                          <p className="text-xs text-gray-500">Expected Delivery</p>
                          <p className="font-medium text-gray-900">
                            {new Date(tracking.estimatedDelivery).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                            })}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* AWB & Courier Info */}
                    {tracking.awbCode && (
                      <div className="mt-3 pt-3 border-t border-gray-100 grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <p className="text-xs text-gray-500">Tracking Number</p>
                          <p className="font-mono text-gray-900">{tracking.awbCode}</p>
                        </div>
                        {tracking.courierName && (
                          <div>
                            <p className="text-xs text-gray-500">Courier</p>
                            <p className="text-gray-900">{tracking.courierName}</p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* External Tracking Link */}
                    {tracking.trackingUrl && (
                      <a
                        href={tracking.trackingUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-3 flex items-center justify-center gap-2 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm text-gray-700 transition-colors"
                      >
                        <ExternalLink className="w-4 h-4" />
                        Track on Courier Website
                      </a>
                    )}
                  </div>

                  {/* Tracking Timeline */}
                  {tracking.events && tracking.events.length > 0 && (
                    <div className="bg-white border border-gray-200 rounded-lg p-4">
                      <h4 className="text-sm font-medium text-gray-700 mb-3">Tracking History</h4>
                      <div className="space-y-3 max-h-48 overflow-y-auto">
                        {tracking.events.slice(0, 10).map((event, index) => (
                          <div key={index} className="flex gap-3">
                            <div className="flex flex-col items-center">
                              <div className={`w-2 h-2 rounded-full ${index === 0 ? 'bg-blue-500' : 'bg-gray-300'}`} />
                              {index < Math.min(tracking.events!.length - 1, 9) && (
                                <div className="w-0.5 flex-1 bg-gray-200 my-1" />
                              )}
                            </div>
                            <div className="flex-1 pb-2">
                              <p className="text-sm font-medium text-gray-900">{event.activity}</p>
                              <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
                                {event.location && (
                                  <>
                                    <MapPin className="w-3 h-3" />
                                    <span>{event.location}</span>
                                  </>
                                )}
                                {event.date && (
                                  <>
                                    <Clock className="w-3 h-3 ml-2" />
                                    <span>
                                      {new Date(event.date).toLocaleString('en-IN', {
                                        day: 'numeric',
                                        month: 'short',
                                        hour: '2-digit',
                                        minute: '2-digit',
                                      })}
                                    </span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                /* No Shipment Message - shown only when no shipment exists */
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-yellow-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-yellow-800">
                      {tracking.message || 'Your order is being prepared'}
                    </p>
                    <p className="text-xs text-yellow-700 mt-1">
                      Tracking information will be available once your order is shipped.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error State */}
      {error && (
        <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}
    </div>
  )
}
