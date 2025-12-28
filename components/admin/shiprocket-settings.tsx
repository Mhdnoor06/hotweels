"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import {
  Truck,
  Save,
  Loader2,
  Check,
  XCircle,
  Eye,
  EyeOff,
  MapPin,
  Phone,
  Mail,
  Package,
  Zap,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  ChevronDown,
} from "lucide-react"
import type { ShipRocketSettingsResponse } from "@/lib/shiprocket/types"
import { INDIAN_STATES } from "@/lib/shiprocket/utils"

interface PickupLocation {
  id: number
  name: string
  address: string
  address2: string
  city: string
  state: string
  pincode: string
  phone: string
  email: string
}

interface ShipRocketSettingsFormData {
  api_email: string
  api_password: string
  pickup_location_name: string
  pickup_address: string
  pickup_address_2: string
  pickup_city: string
  pickup_state: string
  pickup_pincode: string
  pickup_phone: string
  pickup_email: string
  enabled: boolean
  auto_assign_courier: boolean
  default_length: number
  default_breadth: number
  default_height: number
  default_weight: number
}

const defaultFormData: ShipRocketSettingsFormData = {
  api_email: "",
  api_password: "",
  pickup_location_name: "Primary Warehouse",
  pickup_address: "",
  pickup_address_2: "",
  pickup_city: "",
  pickup_state: "",
  pickup_pincode: "",
  pickup_phone: "",
  pickup_email: "",
  enabled: false,
  auto_assign_courier: true,
  default_length: 15,
  default_breadth: 10,
  default_height: 5,
  default_weight: 0.1,
}

export function ShipRocketSettingsPanel() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [saved, setSaved] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null)

  const [formData, setFormData] = useState<ShipRocketSettingsFormData>(defaultFormData)
  const [serverSettings, setServerSettings] = useState<ShipRocketSettingsResponse | null>(null)

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    setLoading(true)
    setError(null)
    try {
      // Add timestamp to bust any caching
      const res = await fetch(`/api/admin/shiprocket/settings?_t=${Date.now()}`, {
        credentials: "include",
        cache: "no-store",
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
        },
      })

      if (res.ok) {
        const data: ShipRocketSettingsResponse = await res.json()
        setServerSettings(data)

        // Populate form with existing data
        setFormData({
          api_email: "", // Don't populate sensitive data
          api_password: "",
          pickup_location_name: data.pickupLocation?.name || "Primary Warehouse",
          pickup_address: data.pickupLocation?.address || "",
          pickup_address_2: data.pickupLocation?.address_2 || "",
          pickup_city: data.pickupLocation?.city || "",
          pickup_state: data.pickupLocation?.state || "",
          pickup_pincode: data.pickupLocation?.pincode || "",
          pickup_phone: data.pickupLocation?.phone || "",
          pickup_email: data.pickupLocation?.email || "",
          enabled: data.enabled,
          auto_assign_courier: data.autoAssignCourier,
          default_length: data.defaultDimensions.length,
          default_breadth: data.defaultDimensions.breadth,
          default_height: data.defaultDimensions.height,
          default_weight: data.defaultDimensions.weight,
        })
      } else {
        const errorData = await res.json()
        setError(errorData.error || "Failed to load settings")
      }
    } catch (err) {
      console.error("Error fetching ShipRocket settings:", err)
      setError("Failed to load ShipRocket settings")
    } finally {
      setLoading(false)
    }
  }

  const handleTestConnection = async () => {
    setTesting(true)
    setTestResult(null)
    setError(null)

    try {
      const res = await fetch("/api/admin/shiprocket/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          email: formData.api_email || undefined,
          password: formData.api_password || undefined,
        }),
      })

      const data = await res.json()

      if (res.ok && data.success) {
        setTestResult({ success: true, message: data.message })
        // Refresh settings to get updated token status
        await fetchSettings()
      } else {
        setTestResult({ success: false, message: data.error || "Connection failed" })
      }
    } catch (err) {
      console.error("Test connection error:", err)
      setTestResult({ success: false, message: "Failed to test connection" })
    } finally {
      setTesting(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    setSaved(false)
    setError(null)

    try {
      // Build update payload (only include non-empty values)
      const payload: Record<string, unknown> = {}

      if (formData.api_email) payload.api_email = formData.api_email
      if (formData.api_password) payload.api_password = formData.api_password
      if (formData.pickup_location_name) payload.pickup_location_name = formData.pickup_location_name
      if (formData.pickup_address) payload.pickup_address = formData.pickup_address
      payload.pickup_address_2 = formData.pickup_address_2 || ""
      if (formData.pickup_city) payload.pickup_city = formData.pickup_city
      if (formData.pickup_state) payload.pickup_state = formData.pickup_state
      if (formData.pickup_pincode) payload.pickup_pincode = formData.pickup_pincode
      if (formData.pickup_phone) payload.pickup_phone = formData.pickup_phone
      payload.pickup_email = formData.pickup_email || ""
      payload.enabled = formData.enabled
      payload.auto_assign_courier = formData.auto_assign_courier
      payload.default_length = formData.default_length
      payload.default_breadth = formData.default_breadth
      payload.default_height = formData.default_height
      payload.default_weight = formData.default_weight

      const res = await fetch("/api/admin/shiprocket/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      })

      const data = await res.json()

      if (res.ok) {
        setServerSettings(data)
        setSaved(true)
        // Clear password field after save
        setFormData((prev) => ({ ...prev, api_password: "" }))
        setTimeout(() => setSaved(false), 3000)
      } else {
        setError(data.error || "Failed to save settings")
      }
    } catch (err) {
      console.error("Error saving ShipRocket settings:", err)
      setError("Failed to save settings")
    } finally {
      setSaving(false)
    }
  }

  const updateFormData = (field: keyof ShipRocketSettingsFormData, value: unknown) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  if (loading) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-red-500" />
          <span className="ml-2 text-gray-600">Loading ShipRocket settings...</span>
        </div>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4 sm:space-y-6"
    >
      {/* Header Section */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Truck className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900">ShipRocket Integration</h2>
              <p className="text-xs sm:text-sm text-gray-500">Configure shipping with 17+ courier partners</p>
            </div>
          </div>

          {/* Status Badge */}
          <div className="flex items-center gap-2">
            {serverSettings?.hasCredentials ? (
              serverSettings.tokenValid ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-100 text-green-700 rounded-full text-xs sm:text-sm font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Connected
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-yellow-100 text-yellow-700 rounded-full text-xs sm:text-sm font-medium">
                  <AlertCircle className="w-3.5 h-3.5" />
                  Token Expired
                </span>
              )
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 text-gray-600 rounded-full text-xs sm:text-sm font-medium">
                <XCircle className="w-3.5 h-3.5" />
                Not Configured
              </span>
            )}
          </div>
        </div>

        {/* Enable Toggle */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-900">Enable ShipRocket</p>
              <p className="text-xs text-gray-500">Turn on to start using ShipRocket for shipping</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={formData.enabled}
                onChange={(e) => updateFormData("enabled", e.target.checked)}
                disabled={!serverSettings?.hasCredentials}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600 peer-disabled:opacity-50 peer-disabled:cursor-not-allowed"></div>
            </label>
          </div>
        </div>
      </div>

      {/* API Credentials */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-6">
        <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
          API Credentials
        </h3>
        <p className="text-xs sm:text-sm text-gray-500 mb-4">
          Get your API credentials from ShipRocket Panel → Settings → API → Configure
        </p>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5">
              API Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="email"
                value={formData.api_email}
                onChange={(e) => updateFormData("api_email", e.target.value)}
                placeholder={serverSettings?.hasCredentials ? "••••••••@••••••" : "api_user@example.com"}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5">
              API Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={formData.api_password}
                onChange={(e) => updateFormData("api_password", e.target.value)}
                placeholder={serverSettings?.hasCredentials ? "••••••••••••" : "Enter password"}
                className="w-full pl-4 pr-10 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
        </div>

        {/* Test Connection */}
        <div className="mt-4 flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <button
            onClick={handleTestConnection}
            disabled={testing || (!formData.api_email && !serverSettings?.hasCredentials)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed text-gray-700 rounded-lg text-sm font-medium transition-colors"
          >
            {testing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
            Test Connection
          </button>

          {testResult && (
            <span
              className={`text-sm ${
                testResult.success ? "text-green-600" : "text-red-600"
              }`}
            >
              {testResult.message}
            </span>
          )}
        </div>
      </div>

      {/* Pickup Location */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-6">
        <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
          Pickup Location
        </h3>
        <p className="text-xs sm:text-sm text-gray-500 mb-4">
          This address will be used as the pickup location for all shipments
        </p>

        <div className="grid gap-4">
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5">
              Location Name
            </label>
            <input
              type="text"
              value={formData.pickup_location_name}
              onChange={(e) => updateFormData("pickup_location_name", e.target.value)}
              placeholder="Primary Warehouse"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            />
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5">
              Address Line 1 *
            </label>
            <input
              type="text"
              value={formData.pickup_address}
              onChange={(e) => updateFormData("pickup_address", e.target.value)}
              placeholder="Street address, building name"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            />
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5">
              Address Line 2
            </label>
            <input
              type="text"
              value={formData.pickup_address_2}
              onChange={(e) => updateFormData("pickup_address_2", e.target.value)}
              placeholder="Landmark, area (optional)"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            />
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5">
                City *
              </label>
              <input
                type="text"
                value={formData.pickup_city}
                onChange={(e) => updateFormData("pickup_city", e.target.value)}
                placeholder="Mumbai"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5">
                State *
              </label>
              <select
                value={formData.pickup_state}
                onChange={(e) => updateFormData("pickup_state", e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-white"
              >
                <option value="">Select State</option>
                {INDIAN_STATES.map((state) => (
                  <option key={state} value={state}>
                    {state}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5">
                Pincode *
              </label>
              <input
                type="text"
                value={formData.pickup_pincode}
                onChange={(e) => updateFormData("pickup_pincode", e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="400001"
                maxLength={6}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5">
                Phone *
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="tel"
                  value={formData.pickup_phone}
                  onChange={(e) => updateFormData("pickup_phone", e.target.value.replace(/\D/g, "").slice(0, 10))}
                  placeholder="9876543210"
                  maxLength={10}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5">
              Email (Optional)
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="email"
                value={formData.pickup_email}
                onChange={(e) => updateFormData("pickup_email", e.target.value)}
                placeholder="warehouse@example.com"
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Default Package Dimensions */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-6">
        <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Package className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
          Default Package Dimensions
        </h3>
        <p className="text-xs sm:text-sm text-gray-500 mb-4">
          Default dimensions for Hot Wheels packages (can be adjusted per order)
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5">
              Length (cm)
            </label>
            <input
              type="number"
              min="1"
              step="0.1"
              value={formData.default_length}
              onChange={(e) => updateFormData("default_length", parseFloat(e.target.value) || 0)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            />
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5">
              Breadth (cm)
            </label>
            <input
              type="number"
              min="1"
              step="0.1"
              value={formData.default_breadth}
              onChange={(e) => updateFormData("default_breadth", parseFloat(e.target.value) || 0)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            />
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5">
              Height (cm)
            </label>
            <input
              type="number"
              min="1"
              step="0.1"
              value={formData.default_height}
              onChange={(e) => updateFormData("default_height", parseFloat(e.target.value) || 0)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            />
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5">
              Weight (kg)
            </label>
            <input
              type="number"
              min="0.01"
              step="0.01"
              value={formData.default_weight}
              onChange={(e) => updateFormData("default_weight", parseFloat(e.target.value) || 0)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            />
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Save Button */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-end">
          <button
            onClick={fetchSettings}
            disabled={saving}
            className="flex items-center justify-center gap-2 px-6 py-3 border border-gray-300 hover:bg-gray-50 disabled:opacity-50 text-gray-700 rounded-lg text-sm font-medium transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Reset
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg text-sm font-medium transition-colors"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : saved ? (
              <>
                <Check className="w-4 h-4" />
                Saved!
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save ShipRocket Settings
              </>
            )}
          </button>
        </div>
      </div>
    </motion.div>
  )
}
