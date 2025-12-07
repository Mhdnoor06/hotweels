"use client"

import { useState, useEffect } from "react"
import {
  Settings,
  Loader2,
  CheckCircle2,
  XCircle,
  Eye,
  EyeOff,
  MapPin,
  Phone,
  Mail,
  Box,
  Save,
  RefreshCw,
  Zap,
  AlertCircle,
} from "lucide-react"
import { AdminPageHeader } from "@/components/admin/admin-page-header"
import type { ShipRocketSettingsResponse } from "@/lib/shiprocket/types"
import { INDIAN_STATES } from "@/lib/shiprocket/utils"

interface SettingsFormData {
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

const defaultFormData: SettingsFormData = {
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

export default function ShipRocketSettingsPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null)

  const [formData, setFormData] = useState<SettingsFormData>(defaultFormData)
  const [serverSettings, setServerSettings] = useState<ShipRocketSettingsResponse | null>(null)

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/admin/shiprocket/settings?t=${Date.now()}`, {
        credentials: "include",
        cache: "no-store",
      })

      if (res.ok) {
        const data: ShipRocketSettingsResponse = await res.json()
        setServerSettings(data)
        setFormData({
          api_email: "",
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
      }
    } catch (err) {
      console.error("Error fetching settings:", err)
      setError("Failed to load settings")
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
      setTestResult({
        success: res.ok && data.success,
        message: data.message || data.error || "Connection test completed",
      })

      if (res.ok && data.success) {
        await fetchSettings()
      }
    } catch (err) {
      setTestResult({ success: false, message: "Failed to test connection" })
    } finally {
      setTesting(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    setError(null)
    setSuccess(null)

    try {
      const payload: Record<string, unknown> = {}

      if (formData.api_email) payload.api_email = formData.api_email
      if (formData.api_password) payload.api_password = formData.api_password
      payload.pickup_location_name = formData.pickup_location_name || "Primary Warehouse"
      payload.pickup_address = formData.pickup_address
      payload.pickup_address_2 = formData.pickup_address_2
      payload.pickup_city = formData.pickup_city
      payload.pickup_state = formData.pickup_state
      payload.pickup_pincode = formData.pickup_pincode
      payload.pickup_phone = formData.pickup_phone
      payload.pickup_email = formData.pickup_email
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
        setSuccess("Settings saved successfully!")
        setFormData((prev) => ({ ...prev, api_password: "" }))
        setTimeout(() => setSuccess(null), 3000)
      } else {
        setError(data.error || "Failed to save settings")
      }
    } catch (err) {
      setError("Failed to save settings")
    } finally {
      setSaving(false)
    }
  }

  const updateField = (field: keyof SettingsFormData, value: unknown) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <AdminPageHeader title="ShipRocket Settings" icon={Settings} />
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        </div>
      ) : (
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Status Banner */}
          {serverSettings && (
            <div
              className={`rounded-xl p-4 flex items-center justify-between ${
                serverSettings.enabled && serverSettings.hasCredentials
                  ? "bg-green-50 border border-green-200"
                  : !serverSettings.hasCredentials
                  ? "bg-gray-50 border border-gray-200"
                  : "bg-yellow-50 border border-yellow-200"
              }`}
            >
              <div className="flex items-center gap-3">
                {serverSettings.enabled && serverSettings.hasCredentials ? (
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                ) : !serverSettings.hasCredentials ? (
                  <AlertCircle className="w-5 h-5 text-gray-500" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-yellow-600" />
                )}
                <div>
                  <p className="font-medium text-gray-900">
                    {serverSettings.enabled && serverSettings.hasCredentials
                      ? "ShipRocket is Active"
                      : !serverSettings.hasCredentials
                      ? "Not Configured"
                      : "Integration Disabled"}
                  </p>
                  <p className="text-sm text-gray-500">
                    {serverSettings.enabled && serverSettings.hasCredentials
                      ? "Your shipping integration is working"
                      : !serverSettings.hasCredentials
                      ? "Add your API credentials to get started"
                      : "Toggle the switch below to enable"}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Error/Success Messages */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
              <XCircle className="w-5 h-5 text-red-500 shrink-0" />
              <p className="text-red-700">{error}</p>
            </div>
          )}
          {success && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
              <p className="text-green-700">{success}</p>
            </div>
          )}

          {/* API Credentials */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
              <div className="flex items-center gap-3">
                <Zap className="w-5 h-5 text-gray-600" />
                <div>
                  <h2 className="font-semibold text-gray-900">API Credentials</h2>
                  <p className="text-sm text-gray-500">Connect your ShipRocket account</p>
                </div>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    API Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="email"
                      value={formData.api_email}
                      onChange={(e) => updateField("api_email", e.target.value)}
                      placeholder={serverSettings?.hasCredentials ? "Leave empty to keep current" : "api_user@example.com"}
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    API Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={formData.api_password}
                      onChange={(e) => updateField("api_password", e.target.value)}
                      placeholder={serverSettings?.hasCredentials ? "Leave empty to keep current" : "Enter password"}
                      className="w-full pl-4 pr-10 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>

              {testResult && (
                <div
                  className={`p-3 rounded-lg ${
                    testResult.success ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
                  }`}
                >
                  <p className="text-sm">{testResult.message}</p>
                </div>
              )}

              <button
                onClick={handleTestConnection}
                disabled={testing}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 disabled:opacity-50 text-gray-700 rounded-lg text-sm font-medium transition-colors"
              >
                {testing ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4" />
                )}
                Test Connection
              </button>
            </div>
          </div>

          {/* Pickup Location */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
              <div className="flex items-center gap-3">
                <MapPin className="w-5 h-5 text-gray-600" />
                <div>
                  <h2 className="font-semibold text-gray-900">Pickup Location</h2>
                  <p className="text-sm text-gray-500">Your warehouse address for shipment pickups</p>
                </div>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Location Name
                </label>
                <input
                  type="text"
                  value={formData.pickup_location_name}
                  onChange={(e) => updateField("pickup_location_name", e.target.value)}
                  placeholder="Primary Warehouse"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Address Line 1 *
                  </label>
                  <input
                    type="text"
                    value={formData.pickup_address}
                    onChange={(e) => updateField("pickup_address", e.target.value)}
                    placeholder="Street address, building name"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Address Line 2
                  </label>
                  <input
                    type="text"
                    value={formData.pickup_address_2}
                    onChange={(e) => updateField("pickup_address_2", e.target.value)}
                    placeholder="Landmark, area (optional)"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">City *</label>
                  <input
                    type="text"
                    value={formData.pickup_city}
                    onChange={(e) => updateField("pickup_city", e.target.value)}
                    placeholder="Mumbai"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">State *</label>
                  <select
                    value={formData.pickup_state}
                    onChange={(e) => updateField("pickup_state", e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-white"
                  >
                    <option value="">Select</option>
                    {INDIAN_STATES.map((state) => (
                      <option key={state} value={state}>
                        {state}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Pincode *</label>
                  <input
                    type="text"
                    value={formData.pickup_pincode}
                    onChange={(e) =>
                      updateField("pickup_pincode", e.target.value.replace(/\D/g, "").slice(0, 6))
                    }
                    placeholder="400001"
                    maxLength={6}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone *</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="tel"
                      value={formData.pickup_phone}
                      onChange={(e) =>
                        updateField("pickup_phone", e.target.value.replace(/\D/g, "").slice(0, 10))
                      }
                      placeholder="9876543210"
                      maxLength={10}
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Package Dimensions */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
              <div className="flex items-center gap-3">
                <Box className="w-5 h-5 text-gray-600" />
                <div>
                  <h2 className="font-semibold text-gray-900">Default Package Dimensions</h2>
                  <p className="text-sm text-gray-500">Used when shipping Hot Wheels products</p>
                </div>
              </div>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Length (cm)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.default_length}
                    onChange={(e) => updateField("default_length", parseFloat(e.target.value) || 0)}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Breadth (cm)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.default_breadth}
                    onChange={(e) => updateField("default_breadth", parseFloat(e.target.value) || 0)}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Height (cm)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.default_height}
                    onChange={(e) => updateField("default_height", parseFloat(e.target.value) || 0)}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Weight (kg)
                  </label>
                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={formData.default_weight}
                    onChange={(e) => updateField("default_weight", parseFloat(e.target.value) || 0)}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Automation Settings */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
              <div className="flex items-center gap-3">
                <Zap className="w-5 h-5 text-gray-600" />
                <div>
                  <h2 className="font-semibold text-gray-900">Automation</h2>
                  <p className="text-sm text-gray-500">Automate shipping workflow steps</p>
                </div>
              </div>
            </div>
            <div className="p-6 space-y-4">
              {/* Auto Assign Courier / Generate AWB */}
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-gray-900">Auto-Generate AWB</h3>
                  <p className="text-sm text-gray-500">
                    Automatically assign courier and generate tracking number when creating ShipRocket order
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.auto_assign_courier}
                    onChange={(e) => updateField("auto_assign_courier", e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              <div className="border-t border-gray-100 pt-4">
                <p className="text-xs text-gray-400">
                  When enabled: Create Order → AWB is auto-generated (one click)<br/>
                  When disabled: Create Order → Generate AWB → Schedule Pickup (manual steps)
                </p>
              </div>
            </div>
          </div>

          {/* Enable/Disable Toggle */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className={`p-2 rounded-lg ${
                    formData.enabled ? "bg-green-100" : "bg-gray-100"
                  }`}
                >
                  {formData.enabled ? (
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                  ) : (
                    <XCircle className="w-5 h-5 text-gray-400" />
                  )}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Enable Integration</h3>
                  <p className="text-sm text-gray-500">
                    {formData.enabled
                      ? "ShipRocket is active for order fulfillment"
                      : "Enable to start using ShipRocket"}
                  </p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.enabled}
                  onChange={(e) => updateField("enabled", e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end gap-3 pt-4">
            <button
              onClick={fetchSettings}
              disabled={saving}
              className="px-6 py-2.5 border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-lg text-sm font-medium transition-colors"
            >
              Reset
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save Settings
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
