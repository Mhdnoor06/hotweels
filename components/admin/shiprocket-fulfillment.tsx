"use client"

import { useState } from "react"
import {
  Truck,
  Package,
  MapPin,
  FileText,
  CheckCircle2,
  XCircle,
  Loader2,
  ExternalLink,
  AlertTriangle,
  RefreshCw,
  ChevronRight,
  Clock,
  Navigation,
  Printer,
  Info,
} from "lucide-react"

interface ShipRocketFulfillmentProps {
  orderId: string
  orderStatus: string
  shiprocketOrderId: string | null
  shiprocketShipmentId: string | null
  shiprocketAwbCode: string | null
  shiprocketCourierName: string | null
  shiprocketStatus: string | null
  shippingLabelUrl: string | null
  trackingUrl: string | null
  pickupScheduledDate: string | null
  pickupToken: string | null
  estimatedDeliveryDate: string | null
  isPaymentVerified?: boolean
  onUpdate: () => void
}

interface TrackingEvent {
  date: string
  status: string
  activity: string
  location: string
  statusLabel?: string
}

interface TrackingData {
  awb: string
  courier: string
  currentStatus: string
  statusLabel: string
  estimatedDelivery: string
  deliveredDate: string | null
  trackingUrl: string
  events: TrackingEvent[]
}

export function ShipRocketFulfillment({
  orderId,
  orderStatus,
  shiprocketOrderId,
  shiprocketShipmentId,
  shiprocketAwbCode,
  shiprocketCourierName,
  shiprocketStatus,
  shippingLabelUrl,
  trackingUrl,
  pickupScheduledDate,
  pickupToken,
  estimatedDeliveryDate,
  isPaymentVerified = true,
  onUpdate,
}: ShipRocketFulfillmentProps) {
  const [loading, setLoading] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [showTracking, setShowTracking] = useState(false)
  const [trackingData, setTrackingData] = useState<TrackingData | null>(null)
  const [showCancelConfirm, setShowCancelConfirm] = useState(false)

  // Check if order or shipment is cancelled
  const isCancelled = orderStatus === 'cancelled' ||
    ['CANCELLED', 'CANCELED'].includes(shiprocketStatus?.toUpperCase() || '')
  const isDelivered = orderStatus === 'delivered' || shiprocketStatus === 'DELIVERED'

  // Disable all actions if cancelled, delivered, or payment not verified
  const canCreateShipRocket = isPaymentVerified && !isCancelled && !isDelivered && !shiprocketOrderId && ['pending', 'confirmed', 'processing'].includes(orderStatus)
  const needsSync = !isCancelled && shiprocketOrderId && !shiprocketShipmentId
  const canGenerateAWB = isPaymentVerified && !isCancelled && !isDelivered && shiprocketShipmentId && !shiprocketAwbCode
  const canSchedulePickup = isPaymentVerified && !isCancelled && !isDelivered && shiprocketAwbCode && !pickupToken
  const canGenerateLabel = !isCancelled && shiprocketAwbCode
  const canTrack = shiprocketAwbCode
  const canCancel = shiprocketOrderId && !isCancelled && !isDelivered && !['RTO_DELIVERED'].includes(shiprocketStatus || '')

  const handleAction = async (action: string, endpoint: string, method: string = 'POST', body?: object) => {
    setLoading(action)
    setError(null)
    setSuccess(null)

    try {
      const res = await fetch(`/api/admin/shiprocket/orders/${orderId}/${endpoint}`, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: body ? JSON.stringify(body) : undefined,
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Action failed')
      }

      setSuccess(data.message || 'Action completed successfully')
      onUpdate() // Refresh order data

      // Handle special cases
      if (action === 'track' && data.tracking) {
        setTrackingData(data.tracking)
        setShowTracking(true)
      }

      if (action === 'label' && data.label?.url) {
        window.open(data.label.url, '_blank')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(null)
    }
  }

  const getStatusColor = (status: string | null) => {
    if (!status) return 'bg-gray-100 text-gray-600'

    const statusLower = status.toLowerCase()
    if (statusLower.includes('delivered')) return 'bg-green-100 text-green-700'
    if (statusLower.includes('transit') || statusLower.includes('picked')) return 'bg-blue-100 text-blue-700'
    if (statusLower.includes('cancel') || statusLower.includes('rto')) return 'bg-red-100 text-red-700'
    if (statusLower.includes('pending') || statusLower.includes('scheduled')) return 'bg-yellow-100 text-yellow-700'
    return 'bg-gray-100 text-gray-600'
  }

  const formatStatus = (status: string | null) => {
    if (!status) return 'Not Created'
    return status.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase())
  }

  // Determine current step
  const getStepStatus = () => {
    if (!shiprocketOrderId) return 0
    if (!shiprocketAwbCode) return 1
    if (!pickupToken) return 2
    if (!['PICKED_UP', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED'].includes(shiprocketStatus || '')) return 3
    if (shiprocketStatus === 'DELIVERED') return 5
    return 4
  }

  const currentStep = getStepStatus()

  const steps = [
    { label: 'Create Order', icon: Package, done: !!shiprocketOrderId },
    { label: 'Generate AWB', icon: FileText, done: !!shiprocketAwbCode },
    { label: 'Schedule Pickup', icon: MapPin, done: !!pickupToken },
    { label: 'In Transit', icon: Truck, done: ['PICKED_UP', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'REACHED_DESTINATION_HUB', 'DELIVERED'].includes(shiprocketStatus || '') },
    { label: 'Delivered', icon: CheckCircle2, done: shiprocketStatus === 'DELIVERED' },
  ]

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-500 flex items-center gap-2">
          <Truck className="w-4 h-4" />
          ShipRocket Fulfillment
        </h3>
        {shiprocketStatus && (
          <span className={`text-xs px-2 py-1 rounded-full font-medium ${getStatusColor(shiprocketStatus)}`}>
            {formatStatus(shiprocketStatus)}
          </span>
        )}
      </div>

      {/* Progress Steps - Mobile Scrollable / Desktop Grid */}
      <div className="bg-gray-50 rounded-lg p-3 sm:p-4">
        {/* Mobile: Vertical compact layout */}
        <div className="sm:hidden space-y-2">
          {steps.map((step, index) => (
            <div key={step.label} className="flex items-center gap-3">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
                  step.done
                    ? 'bg-green-500 text-white'
                    : index === currentStep
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 text-gray-400'
                }`}
              >
                {step.done ? (
                  <CheckCircle2 className="w-3.5 h-3.5" />
                ) : (
                  <step.icon className="w-3.5 h-3.5" />
                )}
              </div>
              <span className={`text-xs ${step.done || index === currentStep ? 'text-gray-900 font-medium' : 'text-gray-400'}`}>
                {step.label}
              </span>
              {step.done && <CheckCircle2 className="w-3.5 h-3.5 text-green-500 ml-auto" />}
            </div>
          ))}
        </div>

        {/* Desktop: Horizontal layout */}
        <div className="hidden sm:flex items-center justify-between">
          {steps.map((step, index) => (
            <div key={step.label} className="flex items-center">
              <div className="flex flex-col items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    step.done
                      ? 'bg-green-500 text-white'
                      : index === currentStep
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-200 text-gray-400'
                  }`}
                >
                  {step.done ? (
                    <CheckCircle2 className="w-4 h-4" />
                  ) : (
                    <step.icon className="w-4 h-4" />
                  )}
                </div>
                <span className={`text-xs mt-1 text-center ${step.done || index === currentStep ? 'text-gray-900' : 'text-gray-400'}`}>
                  {step.label}
                </span>
              </div>
              {index < steps.length - 1 && (
                <div className={`w-6 lg:w-8 h-0.5 mx-1 ${step.done ? 'bg-green-500' : 'bg-gray-200'}`} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Info Cards */}
      {shiprocketOrderId && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 text-sm">
          <div className="bg-gray-50 rounded-lg p-2.5 sm:p-3">
            <p className="text-gray-500 text-xs">SR Order ID</p>
            <p className="font-mono text-gray-900 text-xs sm:text-sm truncate">{shiprocketOrderId}</p>
          </div>
          {shiprocketAwbCode && (
            <div className="bg-gray-50 rounded-lg p-2.5 sm:p-3">
              <p className="text-gray-500 text-xs">AWB Code</p>
              <p className="font-mono text-gray-900 text-xs sm:text-sm truncate">{shiprocketAwbCode}</p>
            </div>
          )}
          {shiprocketCourierName && (
            <div className="bg-gray-50 rounded-lg p-2.5 sm:p-3">
              <p className="text-gray-500 text-xs">Courier</p>
              <p className="text-gray-900 text-xs sm:text-sm truncate">{shiprocketCourierName}</p>
            </div>
          )}
          {estimatedDeliveryDate && (
            <div className="bg-gray-50 rounded-lg p-2.5 sm:p-3">
              <p className="text-gray-500 text-xs">Est. Delivery</p>
              <p className="text-gray-900 text-xs sm:text-sm">{new Date(estimatedDeliveryDate).toLocaleDateString()}</p>
            </div>
          )}
          {pickupScheduledDate && (
            <div className="bg-gray-50 rounded-lg p-2.5 sm:p-3">
              <p className="text-gray-500 text-xs">Pickup Date</p>
              <p className="text-gray-900 text-xs sm:text-sm">{new Date(pickupScheduledDate).toLocaleDateString()}</p>
            </div>
          )}
          {pickupToken && (
            <div className="bg-gray-50 rounded-lg p-2.5 sm:p-3">
              <p className="text-gray-500 text-xs">Pickup Token</p>
              <p className="font-mono text-gray-900 text-xs sm:text-sm truncate">{pickupToken}</p>
            </div>
          )}
        </div>
      )}

      {/* Error/Success Messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
          <XCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}
      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-start gap-2">
          <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
          <p className="text-sm text-green-700">{success}</p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="space-y-2">
        {/* Create ShipRocket Order */}
        {canCreateShipRocket && (
          <button
            onClick={() => handleAction('create', 'create')}
            disabled={loading === 'create'}
            className="w-full flex items-center justify-center gap-2 py-2 sm:py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg text-xs sm:text-sm font-medium transition-colors"
          >
            {loading === 'create' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Package className="w-4 h-4" />}
            <span>Create ShipRocket Order</span>
          </button>
        )}

        {/* Sync from ShipRocket - when we have order but no shipment */}
        {needsSync && (
          <button
            onClick={() => handleAction('sync', 'sync')}
            disabled={loading === 'sync'}
            className="w-full flex items-center justify-center gap-2 py-2 sm:py-2.5 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white rounded-lg text-xs sm:text-sm font-medium transition-colors"
          >
            {loading === 'sync' ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            <span>Sync from ShipRocket</span>
          </button>
        )}

        {/* Generate AWB */}
        {canGenerateAWB && (
          <button
            onClick={() => handleAction('awb', 'awb')}
            disabled={loading === 'awb'}
            className="w-full flex items-center justify-center gap-2 py-2 sm:py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg text-xs sm:text-sm font-medium transition-colors"
          >
            {loading === 'awb' ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
            <span>Generate AWB</span>
          </button>
        )}

        {/* Schedule Pickup */}
        {canSchedulePickup && (
          <div className="space-y-2">
            <button
              onClick={() => handleAction('pickup', 'pickup')}
              disabled={loading === 'pickup'}
              className="w-full flex items-center justify-center gap-2 py-2 sm:py-2.5 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white rounded-lg text-xs sm:text-sm font-medium transition-colors"
            >
              {loading === 'pickup' ? <Loader2 className="w-4 h-4 animate-spin" /> : <MapPin className="w-4 h-4" />}
              <span>Schedule Pickup</span>
            </button>
            <div className="flex items-start gap-2 px-2 py-1.5 bg-blue-50 rounded-lg">
              <Info className="w-3.5 h-3.5 text-blue-500 mt-0.5 shrink-0" />
              <p className="text-xs text-blue-700">
                ShipRocket will automatically assign the pickup date.
              </p>
            </div>
          </div>
        )}

        {/* Print Label - More Prominent */}
        {canGenerateLabel && (
          <div className="space-y-2">
            <button
              onClick={() => handleAction('label', 'label', 'GET')}
              disabled={loading === 'label'}
              className="w-full flex items-center justify-center gap-2 py-2 sm:py-2.5 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded-lg text-xs sm:text-sm font-medium transition-colors"
            >
              {loading === 'label' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Printer className="w-4 h-4" />}
              <span>Print Shipping Label</span>
            </button>
            {shippingLabelUrl && (
              <div className="flex gap-2">
                <a
                  href={shippingLabelUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-medium transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">Open Label</span>
                </a>
                <button
                  onClick={() => handleAction('label', 'label', 'POST')}
                  disabled={loading === 'label'}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-gray-100 hover:bg-gray-200 disabled:opacity-50 text-gray-700 rounded-lg text-xs font-medium transition-colors"
                >
                  {loading === 'label' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5 shrink-0" />}
                  <span>Regenerate</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* Track Shipment */}
        {canTrack && (
          <button
            onClick={() => handleAction('track', 'track', 'GET')}
            disabled={loading === 'track'}
            className="w-full flex items-center justify-center gap-2 py-2 sm:py-2.5 bg-gray-100 hover:bg-gray-200 disabled:opacity-50 text-gray-700 rounded-lg text-xs sm:text-sm font-medium transition-colors"
          >
            {loading === 'track' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Navigation className="w-4 h-4" />}
            <span>Track Shipment</span>
          </button>
        )}

        {/* External Tracking Link */}
        {trackingUrl && (
          <a
            href={trackingUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-center gap-2 py-2 sm:py-2.5 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-lg text-xs sm:text-sm font-medium transition-colors border border-gray-200"
          >
            <ExternalLink className="w-4 h-4 shrink-0" />
            <span>View on ShipRocket</span>
          </a>
        )}

        {/* Cancel Shipment */}
        {canCancel && (
          <>
            {!showCancelConfirm ? (
              <button
                onClick={() => setShowCancelConfirm(true)}
                className="w-full flex items-center justify-center gap-2 py-2 sm:py-2.5 text-red-600 hover:bg-red-50 rounded-lg text-xs sm:text-sm font-medium transition-colors"
              >
                <XCircle className="w-4 h-4" />
                <span>Cancel Shipment</span>
              </button>
            ) : (
              <div className="bg-red-50 border border-red-200 rounded-lg p-2.5 sm:p-3 space-y-2">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
                  <p className="text-xs sm:text-sm text-red-700">
                    Are you sure? This may incur cancellation charges.
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowCancelConfirm(false)}
                    className="flex-1 py-2 bg-white border border-gray-200 rounded-lg text-xs sm:text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    No, Keep
                  </button>
                  <button
                    onClick={() => {
                      handleAction('cancel', 'cancel', 'POST', { force: true })
                      setShowCancelConfirm(false)
                    }}
                    disabled={loading === 'cancel'}
                    className="flex-1 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-lg text-xs sm:text-sm font-medium"
                  >
                    {loading === 'cancel' ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Yes, Cancel'}
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Payment Not Verified Message */}
      {!isPaymentVerified && !isCancelled && !isDelivered && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-2.5 sm:p-3 flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
          <div className="text-xs sm:text-sm text-amber-700">
            <p className="font-medium">Payment Verification Required</p>
            <p className="text-xs mt-0.5">
              Verify payment before creating ShipRocket order.
            </p>
          </div>
        </div>
      )}

      {/* Cancelled Order Message */}
      {isCancelled && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-2.5 sm:p-3 flex items-start gap-2">
          <XCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
          <div className="text-xs sm:text-sm text-red-700">
            <p className="font-medium">Order Cancelled</p>
            <p className="text-xs mt-0.5">
              No further shipping actions available.
            </p>
          </div>
        </div>
      )}

      {/* Delivered Order Message */}
      {isDelivered && !isCancelled && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-2.5 sm:p-3 flex items-start gap-2">
          <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
          <div className="text-xs sm:text-sm text-green-700">
            <p className="font-medium">Order Delivered</p>
            <p className="text-xs mt-0.5">
              Successfully delivered.
            </p>
          </div>
        </div>
      )}

      {/* Order not ready message */}
      {!shiprocketOrderId && !canCreateShipRocket && !isCancelled && !isDelivered && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-2.5 sm:p-3 flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5 shrink-0" />
          <div className="text-xs sm:text-sm text-yellow-700">
            <p className="font-medium">Not ready for shipping</p>
            <p className="text-xs mt-0.5">
              Status: {orderStatus}
            </p>
          </div>
        </div>
      )}

      {/* Tracking Modal */}
      {showTracking && trackingData && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center sm:p-4" onClick={() => setShowTracking(false)}>
          <div className="bg-white rounded-t-2xl sm:rounded-xl w-full sm:max-w-md max-h-[85vh] sm:max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            {/* Drag handle for mobile */}
            <div className="sm:hidden w-12 h-1 bg-gray-300 rounded-full mx-auto mt-3" />

            <div className="p-4 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white">
              <div className="min-w-0 flex-1">
                <h3 className="font-semibold text-gray-900 text-sm sm:text-base">Tracking Details</h3>
                <p className="text-xs sm:text-sm text-gray-500 truncate">AWB: {trackingData.awb}</p>
              </div>
              <button onClick={() => setShowTracking(false)} className="p-2 hover:bg-gray-100 rounded-lg shrink-0 ml-2">
                <XCircle className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              {/* Current Status */}
              <div className="bg-blue-50 rounded-lg p-3">
                <p className="text-xs text-blue-600 font-medium">Current Status</p>
                <p className="text-base sm:text-lg font-semibold text-blue-900">{trackingData.statusLabel}</p>
                {trackingData.estimatedDelivery && (
                  <p className="text-xs sm:text-sm text-blue-700 mt-1">
                    Est. Delivery: {new Date(trackingData.estimatedDelivery).toLocaleDateString()}
                  </p>
                )}
              </div>

              {/* Events Timeline */}
              <div>
                <h4 className="text-xs sm:text-sm font-medium text-gray-700 mb-3">Tracking History</h4>
                <div className="space-y-3">
                  {trackingData.events.map((event, index) => (
                    <div key={index} className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <div className={`w-2 h-2 rounded-full shrink-0 ${index === 0 ? 'bg-blue-500' : 'bg-gray-300'}`} />
                        {index < trackingData.events.length - 1 && (
                          <div className="w-0.5 h-full bg-gray-200 my-1" />
                        )}
                      </div>
                      <div className="flex-1 pb-3 min-w-0">
                        <p className="text-xs sm:text-sm font-medium text-gray-900">{event.activity}</p>
                        <p className="text-xs text-gray-500 truncate">{event.location}</p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {new Date(event.date).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* External Link */}
              {trackingData.trackingUrl && (
                <a
                  href={trackingData.trackingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-center gap-2 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs sm:text-sm font-medium transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                  View Full Tracking
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
