"use client"

import { useState } from "react"
import { toast } from "sonner"
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
  Star,
  Zap,
  IndianRupee,
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

interface CourierOption {
  id: number
  name: string
  freightCharge: number
  codCharges: number
  totalCharge: number
  estimatedDays: string
  etd: string
  rating: number
  isSurface: boolean
  isCheapest: boolean
  isFastest: boolean
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
  const [showCourierSelection, setShowCourierSelection] = useState(false)
  const [couriers, setCouriers] = useState<CourierOption[]>([])
  const [selectedCourier, setSelectedCourier] = useState<number | null>(null)
  const [loadingCouriers, setLoadingCouriers] = useState(false)
  // Local state to track AWB generation (for immediate UI feedback)
  const [localAwbGenerated, setLocalAwbGenerated] = useState(false)

  // Check if order or shipment is cancelled
  const isCancelled = orderStatus === 'cancelled' ||
    ['CANCELLED', 'CANCELED'].includes(shiprocketStatus?.toUpperCase() || '')
  const isDelivered = orderStatus === 'delivered' || shiprocketStatus === 'DELIVERED'

  // Disable all actions if cancelled, delivered, or payment not verified
  const canCreateShipRocket = isPaymentVerified && !isCancelled && !isDelivered && !shiprocketOrderId && ['pending', 'confirmed', 'processing'].includes(orderStatus)
  const needsSync = !isCancelled && shiprocketOrderId && !shiprocketShipmentId
  const canGenerateAWB = isPaymentVerified && !isCancelled && !isDelivered && shiprocketShipmentId && !shiprocketAwbCode && !localAwbGenerated
  const canSchedulePickup = isPaymentVerified && !isCancelled && !isDelivered && (shiprocketAwbCode || localAwbGenerated) && !pickupToken
  const canGenerateLabel = !isCancelled && (shiprocketAwbCode || localAwbGenerated)
  const canTrack = shiprocketAwbCode || localAwbGenerated
  const canCancel = shiprocketOrderId && !isCancelled && !isDelivered && !['RTO_DELIVERED'].includes(shiprocketStatus || '')
  // Can cancel only shipment (AWB) if AWB is assigned - allows re-assignment
  const canCancelShipmentOnly = canCancel && (shiprocketAwbCode || localAwbGenerated)

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

      const successMessage = data.message || 'Action completed successfully'
      setSuccess(successMessage)
      toast.success(successMessage)
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
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setLoading(null)
    }
  }

  // Fetch available couriers for the order
  const fetchCouriers = async () => {
    setLoadingCouriers(true)
    setError(null)
    setCouriers([])
    setSelectedCourier(null)

    try {
      const res = await fetch(`/api/admin/shiprocket/orders/${orderId}/couriers`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to fetch couriers')
      }

      if (!data.available || data.couriers.length === 0) {
        throw new Error('No couriers available for this route')
      }

      setCouriers(data.couriers)
      // Auto-select the cheapest courier
      const cheapest = data.couriers.find((c: CourierOption) => c.isCheapest)
      if (cheapest) {
        setSelectedCourier(cheapest.id)
      }
      setShowCourierSelection(true)
      toast.success(`Found ${data.couriers.length} courier(s) available`)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setLoadingCouriers(false)
    }
  }

  // Generate AWB with selected courier
  const generateAWBWithCourier = async () => {
    if (!selectedCourier) {
      toast.error('Please select a courier')
      return
    }

    setLoading('awb')
    setError(null)
    setSuccess(null)

    try {
      const res = await fetch(`/api/admin/shiprocket/orders/${orderId}/awb`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ courierId: selectedCourier, selectCheapest: false }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to generate AWB')
      }

      const selectedCourierInfo = couriers.find(c => c.id === selectedCourier)
      const successMessage = `AWB generated with ${selectedCourierInfo?.name || data.awb?.courierName} @ ₹${selectedCourierInfo?.totalCharge || ''}`
      setSuccess(successMessage)
      toast.success(successMessage)
      setShowCourierSelection(false)
      setCouriers([])
      setSelectedCourier(null)
      setLocalAwbGenerated(true) // Immediately hide AWB button
      onUpdate() // Refresh order data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      setError(errorMessage)
      toast.error(errorMessage)
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
    if (!shiprocketAwbCode && !localAwbGenerated) return 1
    if (!pickupToken) return 2
    if (!['PICKED_UP', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED'].includes(shiprocketStatus || '')) return 3
    if (shiprocketStatus === 'DELIVERED') return 5
    return 4
  }

  const currentStep = getStepStatus()

  const steps = [
    { label: 'Create Order', icon: Package, done: !!shiprocketOrderId },
    { label: 'Generate AWB', icon: FileText, done: !!shiprocketAwbCode || localAwbGenerated },
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

        {/* Generate AWB - Opens courier selection */}
        {canGenerateAWB && (
          <button
            onClick={fetchCouriers}
            disabled={loadingCouriers || loading === 'awb'}
            className="w-full flex items-center justify-center gap-2 py-2 sm:py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg text-xs sm:text-sm font-medium transition-colors"
          >
            {loadingCouriers ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
            <span>{loadingCouriers ? 'Fetching Couriers...' : 'Generate AWB'}</span>
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

        {/* Cancel Options */}
        {canCancel && (
          <button
            onClick={() => setShowCancelConfirm(true)}
            className="w-full flex items-center justify-center gap-2 py-2 sm:py-2.5 text-red-600 hover:bg-red-50 rounded-lg text-xs sm:text-sm font-medium transition-colors"
          >
            <XCircle className="w-4 h-4" />
            <span>Cancel Options</span>
          </button>
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

      {/* Courier Selection Modal */}
      {showCourierSelection && couriers.length > 0 && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center sm:p-4" onClick={() => setShowCourierSelection(false)}>
          <div className="bg-white rounded-t-2xl sm:rounded-xl w-full sm:max-w-lg max-h-[85vh] sm:max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            {/* Drag handle for mobile */}
            <div className="sm:hidden w-12 h-1 bg-gray-300 rounded-full mx-auto mt-3" />

            <div className="p-4 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white z-10">
              <div className="min-w-0 flex-1">
                <h3 className="font-semibold text-gray-900 text-sm sm:text-base">Select Courier</h3>
                <p className="text-xs sm:text-sm text-gray-500">{couriers.length} courier(s) available</p>
              </div>
              <button onClick={() => setShowCourierSelection(false)} className="p-2 hover:bg-gray-100 rounded-lg shrink-0 ml-2">
                <XCircle className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <div className="p-4 space-y-3">
              {couriers.map((courier) => (
                <div
                  key={courier.id}
                  onClick={() => setSelectedCourier(courier.id)}
                  className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                    selectedCourier === courier.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-gray-900 text-sm">{courier.name}</span>
                        {courier.isCheapest && (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-green-100 text-green-700 rounded text-xs font-medium">
                            <IndianRupee className="w-3 h-3" />
                            Cheapest
                          </span>
                        )}
                        {courier.isFastest && !courier.isCheapest && (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-orange-100 text-orange-700 rounded text-xs font-medium">
                            <Zap className="w-3 h-3" />
                            Fastest
                          </span>
                        )}
                        {courier.isSurface && (
                          <span className="px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">
                            Surface
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {courier.estimatedDays} days
                        </span>
                        {courier.rating > 0 && (
                          <span className="flex items-center gap-1">
                            <Star className="w-3 h-3 text-yellow-500" />
                            {courier.rating.toFixed(1)}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-semibold text-gray-900">₹{courier.totalCharge}</p>
                      {courier.codCharges > 0 && (
                        <p className="text-xs text-gray-500">
                          (₹{courier.freightCharge} + ₹{courier.codCharges} COD)
                        </p>
                      )}
                    </div>
                  </div>
                  {selectedCourier === courier.id && (
                    <div className="mt-2 pt-2 border-t border-blue-200">
                      <div className="flex items-center gap-1 text-blue-600 text-xs">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Selected
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="p-4 border-t border-gray-200 sticky bottom-0 bg-white">
              <button
                onClick={generateAWBWithCourier}
                disabled={!selectedCourier || loading === 'awb'}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-colors"
              >
                {loading === 'awb' ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Generating AWB...
                  </>
                ) : (
                  <>
                    <FileText className="w-4 h-4" />
                    Generate AWB with Selected Courier
                  </>
                )}
              </button>
            </div>
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

      {/* Cancel Options Modal */}
      {showCancelConfirm && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center sm:p-4"
          onClick={() => !loading && setShowCancelConfirm(false)}
        >
          <div className="bg-white rounded-t-2xl sm:rounded-xl w-full sm:max-w-md" onClick={e => e.stopPropagation()}>
            {/* Drag handle for mobile */}
            <div className="sm:hidden w-12 h-1 bg-gray-300 rounded-full mx-auto mt-3" />

            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center">
                  <AlertTriangle className="w-4 h-4 text-red-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 text-sm sm:text-base">Cancel Options</h3>
                  <p className="text-xs text-gray-500">Choose cancellation type</p>
                </div>
              </div>
              <button
                onClick={() => setShowCancelConfirm(false)}
                disabled={!!loading}
                className="p-2 hover:bg-gray-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <XCircle className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <div className="p-4 space-y-3">
              <div className="flex items-start gap-2 p-3 bg-amber-50 rounded-lg">
                <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                <p className="text-xs text-amber-700">
                  Cancellation may incur charges depending on shipment status.
                </p>
              </div>

              {/* Cancel Shipment Only - Only show if AWB is assigned */}
              {canCancelShipmentOnly && (
                <button
                  onClick={async () => {
                    await handleAction('cancel-shipment', 'cancel', 'POST', { mode: 'shipment', force: true })
                    setLocalAwbGenerated(false)
                    setShowCancelConfirm(false)
                  }}
                  disabled={loading === 'cancel-shipment' || loading === 'cancel-order'}
                  className="w-full p-4 bg-white border-2 border-orange-200 hover:border-orange-400 hover:bg-orange-50 rounded-xl text-left transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center shrink-0">
                      {loading === 'cancel-shipment' ? (
                        <Loader2 className="w-5 h-5 text-orange-600 animate-spin" />
                      ) : (
                        <RefreshCw className="w-5 h-5 text-orange-600" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 text-sm sm:text-base">
                        {loading === 'cancel-shipment' ? 'Cancelling Shipment...' : 'Cancel Shipment Only'}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Cancels AWB and courier. You can assign a new courier after this.
                      </p>
                      <div className="flex items-center gap-1.5 mt-2">
                        <span className="px-2 py-0.5 bg-orange-100 text-orange-700 rounded text-xs font-medium">
                          Keeps Order Active
                        </span>
                      </div>
                    </div>
                    {loading === 'cancel-shipment' ? (
                      <Loader2 className="w-5 h-5 text-orange-500 animate-spin shrink-0" />
                    ) : (
                      <ChevronRight className="w-5 h-5 text-gray-400 shrink-0" />
                    )}
                  </div>
                </button>
              )}

              {/* Cancel Entire Order */}
              <button
                onClick={async () => {
                  await handleAction('cancel-order', 'cancel', 'POST', { mode: 'order', force: true })
                  setShowCancelConfirm(false)
                }}
                disabled={loading === 'cancel-order' || loading === 'cancel-shipment'}
                className="w-full p-4 bg-white border-2 border-red-200 hover:border-red-400 hover:bg-red-50 rounded-xl text-left transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                    {loading === 'cancel-order' ? (
                      <Loader2 className="w-5 h-5 text-red-600 animate-spin" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-600" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 text-sm sm:text-base">
                      {loading === 'cancel-order' ? 'Cancelling Order...' : 'Cancel Entire Order'}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Cancels both order and shipment in ShipRocket completely.
                    </p>
                    <div className="flex items-center gap-1.5 mt-2">
                      <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded text-xs font-medium">
                        Cannot be undone
                      </span>
                    </div>
                  </div>
                  {loading === 'cancel-order' ? (
                    <Loader2 className="w-5 h-5 text-red-500 animate-spin shrink-0" />
                  ) : (
                    <ChevronRight className="w-5 h-5 text-gray-400 shrink-0" />
                  )}
                </div>
              </button>
            </div>

            <div className="p-4 border-t border-gray-200">
              <button
                onClick={() => setShowCancelConfirm(false)}
                disabled={!!loading}
                className="w-full py-2.5 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium text-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Please wait...' : 'Go Back'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
