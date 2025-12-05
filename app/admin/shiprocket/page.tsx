"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import Link from "next/link"
import Image from "next/image"
import { useRouter, usePathname } from "next/navigation"
import { useAdminAuth } from "@/context/admin-auth-context"
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Settings,
  LogOut,
  Menu,
  X,
  Truck,
  Loader2,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Save,
  Eye,
  EyeOff,
  MapPin,
  Phone,
  Mail,
  Zap,
  RefreshCw,
  Check,
  Box,
  ArrowRight,
} from "lucide-react"
import type { ShipRocketSettingsResponse } from "@/lib/shiprocket/types"
import { INDIAN_STATES } from "@/lib/shiprocket/utils"

const navItems = [
  { label: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
  { label: "Orders", href: "/admin/orders", icon: ShoppingCart },
  { label: "Products", href: "/admin/products", icon: Package },
  { label: "ShipRocket", href: "/admin/shiprocket", icon: Truck },
  { label: "Settings", href: "/admin/settings", icon: Settings },
]

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

export default function ShipRocketPage() {
  const router = useRouter()
  const pathname = usePathname()
  const { isAuthenticated, isLoading: authLoading, logout } = useAdminAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Settings state
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [saved, setSaved] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null)

  const [formData, setFormData] = useState<ShipRocketSettingsFormData>(defaultFormData)
  const [serverSettings, setServerSettings] = useState<ShipRocketSettingsResponse | null>(null)

  // Current step for setup wizard
  const [currentStep, setCurrentStep] = useState(1)

  useEffect(() => {
    if (authLoading) return

    if (!isAuthenticated) {
      router.push("/admin")
      return
    }

    fetchSettings()
  }, [router, isAuthenticated, authLoading])

  const fetchSettings = async (showLoading = true) => {
    if (showLoading) setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/admin/shiprocket/settings?t=${Date.now()}`, {
        credentials: "include",
        cache: "no-store",
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
          "Pragma": "no-cache",
        },
      })

      if (res.ok) {
        const data: ShipRocketSettingsResponse = await res.json()
        console.log("Fetched settings:", data)
        setServerSettings(data)

        // Populate form with existing data
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

        // Determine current step based on setup progress
        if (!data.hasCredentials) {
          setCurrentStep(1)
        } else if (!data.pickupLocation) {
          setCurrentStep(2)
        } else if (!data.enabled) {
          setCurrentStep(3)
        } else {
          setCurrentStep(4) // Fully configured
        }
      }
    } catch (err) {
      console.error("Error fetching ShipRocket settings:", err)
      setError("Failed to load ShipRocket settings")
    } finally {
      setLoading(false)
    }
  }

  const handleTestConnection = async (saveAfterSuccess: boolean = false) => {
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
        // If we're in step 1 with new credentials, save them to database
        if (formData.api_email && formData.api_password && !serverSettings?.hasCredentials) {
          setTestResult({ success: true, message: "Connection successful! Saving credentials..." })

          // Save credentials to database
          const saveRes = await fetch("/api/admin/shiprocket/settings", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({
              api_email: formData.api_email,
              api_password: formData.api_password,
            }),
          })

          const saveData = await saveRes.json()

          if (saveRes.ok) {
            setTestResult({ success: true, message: "Connection successful! Credentials saved. Redirecting..." })
            // Don't show loading spinner, just refresh settings
            await fetchSettings(false)
          } else {
            console.error("Failed to save credentials:", saveData)
            setTestResult({ success: false, message: saveData.error || "Connection worked but failed to save credentials." })
            setError(saveData.error || "Failed to save credentials to database")
          }
        } else {
          setTestResult({ success: true, message: data.message })
          await fetchSettings(false)
        }
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
      const payload: Record<string, unknown> = {}

      if (formData.api_email) payload.api_email = formData.api_email
      if (formData.api_password) payload.api_password = formData.api_password
      // Always include pickup fields
      payload.pickup_location_name = formData.pickup_location_name || "Primary Warehouse"
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

      console.log("Saving payload:", payload)

      const res = await fetch("/api/admin/shiprocket/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      })

      const data = await res.json()

      if (res.ok) {
        // Use the response data directly - don't fetch again to avoid stale data
        setServerSettings(data)
        setSaved(true)
        setFormData((prev) => ({
          ...prev,
          api_password: "",
          // Update form with new pickup data
          pickup_location_name: data.pickupLocation?.name || prev.pickup_location_name,
          pickup_address: data.pickupLocation?.address || prev.pickup_address,
          pickup_address_2: data.pickupLocation?.address_2 || prev.pickup_address_2,
          pickup_city: data.pickupLocation?.city || prev.pickup_city,
          pickup_state: data.pickupLocation?.state || prev.pickup_state,
          pickup_pincode: data.pickupLocation?.pincode || prev.pickup_pincode,
          pickup_phone: data.pickupLocation?.phone || prev.pickup_phone,
          pickup_email: data.pickupLocation?.email || prev.pickup_email,
          enabled: data.enabled,
        }))
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

  const handleLogout = async () => {
    await logout()
    router.push("/admin")
  }

  const isFullyConfigured = serverSettings?.hasCredentials && serverSettings?.pickupLocation && serverSettings?.enabled

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/20 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transform transition-transform lg:transform-none ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200">
            <Link href="/admin/dashboard" className="flex items-center gap-2">
              <Image
                src="/darklogo.jpg"
                alt="Wheels Frams"
                width={100}
                height={100}
                className="h-10 w-auto object-contain"
                priority
              />
            </Link>
            <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-gray-400 hover:text-gray-600">
              <X size={20} />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                    isActive ? "bg-red-50 text-red-600" : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                  }`}
                >
                  <item.icon size={20} />
                  {item.label}
                </Link>
              )
            })}
          </nav>

          {/* Logout */}
          <div className="p-4 border-t border-gray-200">
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
            >
              <LogOut size={20} />
              Logout
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Top Bar */}
        <header className="h-16 border-b border-gray-200 bg-white flex items-center justify-between px-4 lg:px-8 sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-gray-400 hover:text-gray-600">
              <Menu size={24} />
            </button>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Truck className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h1 className="text-lg sm:text-xl font-semibold text-gray-900">ShipRocket</h1>
                <p className="text-xs text-gray-500 hidden sm:block">Shipping Integration</p>
              </div>
            </div>
          </div>

          {/* Status Badge */}
          {!loading && (
            <div className="flex items-center gap-2">
              {isFullyConfigured ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-100 text-green-700 rounded-full text-xs sm:text-sm font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Active
                </span>
              ) : serverSettings?.hasCredentials ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-yellow-100 text-yellow-700 rounded-full text-xs sm:text-sm font-medium">
                  <AlertCircle className="w-3.5 h-3.5" />
                  Setup Incomplete
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 text-gray-600 rounded-full text-xs sm:text-sm font-medium">
                  <XCircle className="w-3.5 h-3.5" />
                  Not Configured
                </span>
              )}
            </div>
          )}
        </header>

        {/* Main Content */}
        <main className="flex-1 p-4 lg:p-8">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            </div>
          ) : !serverSettings?.hasCredentials ? (
            // Setup Wizard - Step 1: API Credentials
            <SetupWizard
              step={1}
              formData={formData}
              updateFormData={updateFormData}
              showPassword={showPassword}
              setShowPassword={setShowPassword}
              testing={testing}
              testResult={testResult}
              handleTestConnection={handleTestConnection}
              saving={saving}
              saved={saved}
              handleSave={handleSave}
              error={error}
              serverSettings={serverSettings}
            />
          ) : !serverSettings?.pickupLocation?.address ? (
            // Setup Wizard - Step 2: Pickup Location
            <SetupWizard
              step={2}
              formData={formData}
              updateFormData={updateFormData}
              showPassword={showPassword}
              setShowPassword={setShowPassword}
              testing={testing}
              testResult={testResult}
              handleTestConnection={handleTestConnection}
              saving={saving}
              saved={saved}
              handleSave={handleSave}
              error={error}
              serverSettings={serverSettings}
            />
          ) : !serverSettings?.enabled ? (
            // Setup Wizard - Step 3: Enable
            <SetupWizard
              step={3}
              formData={formData}
              updateFormData={updateFormData}
              showPassword={showPassword}
              setShowPassword={setShowPassword}
              testing={testing}
              testResult={testResult}
              handleTestConnection={handleTestConnection}
              saving={saving}
              saved={saved}
              handleSave={handleSave}
              error={error}
              serverSettings={serverSettings}
            />
          ) : (
            // Fully Configured - Show Dashboard
            <ConfiguredDashboard
              serverSettings={serverSettings}
              formData={formData}
              updateFormData={updateFormData}
              showPassword={showPassword}
              setShowPassword={setShowPassword}
              testing={testing}
              testResult={testResult}
              handleTestConnection={handleTestConnection}
              saving={saving}
              saved={saved}
              handleSave={handleSave}
              error={error}
              fetchSettings={fetchSettings}
            />
          )}
        </main>
      </div>
    </div>
  )
}

// Setup Wizard Component
function SetupWizard({
  step,
  formData,
  updateFormData,
  showPassword,
  setShowPassword,
  testing,
  testResult,
  handleTestConnection,
  saving,
  saved,
  handleSave,
  error,
  serverSettings,
}: {
  step: number
  formData: ShipRocketSettingsFormData
  updateFormData: (field: keyof ShipRocketSettingsFormData, value: unknown) => void
  showPassword: boolean
  setShowPassword: (show: boolean) => void
  testing: boolean
  testResult: { success: boolean; message: string } | null
  handleTestConnection: () => void
  saving: boolean
  saved: boolean
  handleSave: () => void
  error: string | null
  serverSettings: ShipRocketSettingsResponse | null
}) {
  const steps = [
    { number: 1, title: "API Credentials", description: "Connect your ShipRocket account" },
    { number: 2, title: "Pickup Location", description: "Set your warehouse address" },
    { number: 3, title: "Activate", description: "Enable the integration" },
  ]

  return (
    <div className="max-w-3xl mx-auto">
      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {steps.map((s, index) => (
            <div key={s.number} className="flex items-center">
              <div className="flex flex-col items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm ${
                    step > s.number
                      ? "bg-green-500 text-white"
                      : step === s.number
                      ? "bg-blue-600 text-white"
                      : "bg-gray-200 text-gray-500"
                  }`}
                >
                  {step > s.number ? <Check className="w-5 h-5" /> : s.number}
                </div>
                <div className="mt-2 text-center">
                  <p className={`text-sm font-medium ${step >= s.number ? "text-gray-900" : "text-gray-400"}`}>
                    {s.title}
                  </p>
                  <p className="text-xs text-gray-500 hidden sm:block">{s.description}</p>
                </div>
              </div>
              {index < steps.length - 1 && (
                <div
                  className={`w-16 sm:w-24 h-1 mx-2 ${step > s.number ? "bg-green-500" : "bg-gray-200"}`}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Step Content */}
      <motion.div
        key={step}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="bg-white border border-gray-200 rounded-xl p-6"
      >
        {step === 1 && (
          <>
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Zap className="w-8 h-8 text-blue-600" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900">Connect ShipRocket</h2>
              <p className="text-gray-500 mt-1">Enter your ShipRocket API credentials to get started</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">API Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="email"
                    value={formData.api_email}
                    onChange={(e) => updateFormData("api_email", e.target.value)}
                    placeholder="api_user@example.com"
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Get this from ShipRocket → Settings → API → Configure
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">API Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={formData.api_password}
                    onChange={(e) => updateFormData("api_password", e.target.value)}
                    placeholder="Enter API password"
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

              {testResult && (
                <div
                  className={`p-3 rounded-lg ${
                    testResult.success ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
                  }`}
                >
                  <p className="text-sm">{testResult.message}</p>
                </div>
              )}

              {error && (
                <div className="p-3 bg-red-50 rounded-lg">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleTestConnection}
                  disabled={testing || !formData.api_email || !formData.api_password}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed text-gray-700 rounded-lg text-sm font-medium transition-colors"
                >
                  {testing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                  Test Connection
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving || !formData.api_email || !formData.api_password}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-colors"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                  Save & Continue
                </button>
              </div>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <MapPin className="w-8 h-8 text-blue-600" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900">Pickup Location</h2>
              <p className="text-gray-500 mt-1">Set your warehouse address for shipment pickups</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Location Name</label>
                <input
                  type="text"
                  value={formData.pickup_location_name}
                  onChange={(e) => updateFormData("pickup_location_name", e.target.value)}
                  placeholder="Primary Warehouse"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Address Line 1 *</label>
                <input
                  type="text"
                  value={formData.pickup_address}
                  onChange={(e) => updateFormData("pickup_address", e.target.value)}
                  placeholder="Street address, building name"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Address Line 2</label>
                <input
                  type="text"
                  value={formData.pickup_address_2}
                  onChange={(e) => updateFormData("pickup_address_2", e.target.value)}
                  placeholder="Landmark, area (optional)"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">City *</label>
                  <input
                    type="text"
                    value={formData.pickup_city}
                    onChange={(e) => updateFormData("pickup_city", e.target.value)}
                    placeholder="Mumbai"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">State *</label>
                  <select
                    value={formData.pickup_state}
                    onChange={(e) => updateFormData("pickup_state", e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-white"
                  >
                    <option value="">Select State</option>
                    {INDIAN_STATES.map((state) => (
                      <option key={state} value={state}>{state}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Pincode *</label>
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
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone *</label>
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

              {error && (
                <div className="p-3 bg-red-50 rounded-lg">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleSave}
                  disabled={saving || !formData.pickup_address || !formData.pickup_city || !formData.pickup_state || !formData.pickup_pincode || !formData.pickup_phone}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-colors"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                  Save & Continue
                </button>
              </div>
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900">Ready to Go!</h2>
              <p className="text-gray-500 mt-1">Your ShipRocket integration is configured. Enable it to start shipping.</p>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <h3 className="font-medium text-gray-900 mb-3">Configuration Summary</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">API Status:</span>
                  <span className="text-green-600 font-medium flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" /> Connected
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Pickup Location:</span>
                  <span className="text-gray-900">{serverSettings?.pickupLocation?.city}, {serverSettings?.pickupLocation?.state}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Pincode:</span>
                  <span className="text-gray-900">{serverSettings?.pickupLocation?.pincode}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg mb-6">
              <div>
                <p className="font-medium text-gray-900">Enable ShipRocket Integration</p>
                <p className="text-sm text-gray-500">Turn on to start using ShipRocket for your orders</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.enabled}
                  onChange={(e) => updateFormData("enabled", e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            {error && (
              <div className="p-3 bg-red-50 rounded-lg mb-4">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            <button
              onClick={handleSave}
              disabled={saving || !formData.enabled}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-colors"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Activating...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  Activate ShipRocket
                </>
              )}
            </button>
          </>
        )}
      </motion.div>
    </div>
  )
}

// Configured Dashboard Component
function ConfiguredDashboard({
  serverSettings,
  formData,
  updateFormData,
  showPassword,
  setShowPassword,
  testing,
  testResult,
  handleTestConnection,
  saving,
  saved,
  handleSave,
  error,
  fetchSettings,
}: {
  serverSettings: ShipRocketSettingsResponse
  formData: ShipRocketSettingsFormData
  updateFormData: (field: keyof ShipRocketSettingsFormData, value: unknown) => void
  showPassword: boolean
  setShowPassword: (show: boolean) => void
  testing: boolean
  testResult: { success: boolean; message: string } | null
  handleTestConnection: () => void
  saving: boolean
  saved: boolean
  handleSave: () => void
  error: string | null
  fetchSettings: () => void
}) {
  const [activeTab, setActiveTab] = useState<"overview" | "settings">("overview")

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Tab Navigation */}
      <div className="flex gap-2 border-b border-gray-200">
        <button
          onClick={() => setActiveTab("overview")}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "overview"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          Overview
        </button>
        <button
          onClick={() => setActiveTab("settings")}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "settings"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          Settings
        </button>
      </div>

      {activeTab === "overview" && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-6"
        >
          {/* Status Cards */}
          <div className="grid sm:grid-cols-3 gap-4">
            <div className="bg-white border border-gray-200 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Status</p>
                  <p className="font-semibold text-gray-900">Active</p>
                </div>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <MapPin className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Pickup Location</p>
                  <p className="font-semibold text-gray-900">{serverSettings.pickupLocation?.city}</p>
                </div>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Box className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Default Weight</p>
                  <p className="font-semibold text-gray-900">{serverSettings.defaultDimensions.weight} kg</p>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <Link
                href="/admin/orders"
                className="flex items-center gap-3 p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ShoppingCart className="w-5 h-5 text-gray-600" />
                <div>
                  <p className="font-medium text-gray-900">View Orders</p>
                  <p className="text-sm text-gray-500">Manage and ship orders</p>
                </div>
              </Link>

              <button
                onClick={handleTestConnection}
                disabled={testing}
                className="flex items-center gap-3 p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors text-left"
              >
                {testing ? (
                  <Loader2 className="w-5 h-5 text-gray-600 animate-spin" />
                ) : (
                  <RefreshCw className="w-5 h-5 text-gray-600" />
                )}
                <div>
                  <p className="font-medium text-gray-900">Test Connection</p>
                  <p className="text-sm text-gray-500">Verify API connectivity</p>
                </div>
              </button>

              <button
                onClick={() => setActiveTab("settings")}
                className="flex items-center gap-3 p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors text-left"
              >
                <Settings className="w-5 h-5 text-gray-600" />
                <div>
                  <p className="font-medium text-gray-900">Edit Settings</p>
                  <p className="text-sm text-gray-500">Update configuration</p>
                </div>
              </button>
            </div>

            {testResult && (
              <div
                className={`mt-4 p-3 rounded-lg ${
                  testResult.success ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
                }`}
              >
                <p className="text-sm">{testResult.message}</p>
              </div>
            )}
          </div>

          {/* Configuration Summary */}
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Configuration</h3>
            <div className="grid sm:grid-cols-2 gap-6">
              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-2">Pickup Address</h4>
                <p className="text-gray-900">{serverSettings.pickupLocation?.name}</p>
                <p className="text-gray-600 text-sm">
                  {serverSettings.pickupLocation?.address}
                  {serverSettings.pickupLocation?.address_2 && `, ${serverSettings.pickupLocation.address_2}`}
                </p>
                <p className="text-gray-600 text-sm">
                  {serverSettings.pickupLocation?.city}, {serverSettings.pickupLocation?.state} - {serverSettings.pickupLocation?.pincode}
                </p>
                <p className="text-gray-600 text-sm">Phone: {serverSettings.pickupLocation?.phone}</p>
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-2">Package Defaults</h4>
                <div className="space-y-1 text-sm">
                  <p className="text-gray-600">
                    Dimensions: {serverSettings.defaultDimensions.length} x {serverSettings.defaultDimensions.breadth} x {serverSettings.defaultDimensions.height} cm
                  </p>
                  <p className="text-gray-600">Weight: {serverSettings.defaultDimensions.weight} kg</p>
                  <p className="text-gray-600">Auto-assign Courier: {serverSettings.autoAssignCourier ? "Yes" : "No"}</p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {activeTab === "settings" && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-6"
        >
          {/* API Credentials */}
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Zap className="w-5 h-5 text-gray-400" />
              API Credentials
            </h3>
            <p className="text-sm text-gray-500 mb-4">Update your ShipRocket API credentials if needed</p>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">API Email</label>
                <input
                  type="email"
                  value={formData.api_email}
                  onChange={(e) => updateFormData("api_email", e.target.value)}
                  placeholder="Leave empty to keep current"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">API Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={formData.api_password}
                    onChange={(e) => updateFormData("api_password", e.target.value)}
                    placeholder="Leave empty to keep current"
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
          </div>

          {/* Pickup Location */}
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-gray-400" />
              Pickup Location
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Location Name</label>
                <input
                  type="text"
                  value={formData.pickup_location_name}
                  onChange={(e) => updateFormData("pickup_location_name", e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Address Line 1</label>
                  <input
                    type="text"
                    value={formData.pickup_address}
                    onChange={(e) => updateFormData("pickup_address", e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Address Line 2</label>
                  <input
                    type="text"
                    value={formData.pickup_address_2}
                    onChange={(e) => updateFormData("pickup_address_2", e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">City</label>
                  <input
                    type="text"
                    value={formData.pickup_city}
                    onChange={(e) => updateFormData("pickup_city", e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">State</label>
                  <select
                    value={formData.pickup_state}
                    onChange={(e) => updateFormData("pickup_state", e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-white"
                  >
                    <option value="">Select</option>
                    {INDIAN_STATES.map((state) => (
                      <option key={state} value={state}>{state}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Pincode</label>
                  <input
                    type="text"
                    value={formData.pickup_pincode}
                    onChange={(e) => updateFormData("pickup_pincode", e.target.value.replace(/\D/g, "").slice(0, 6))}
                    maxLength={6}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone</label>
                  <input
                    type="tel"
                    value={formData.pickup_phone}
                    onChange={(e) => updateFormData("pickup_phone", e.target.value.replace(/\D/g, "").slice(0, 10))}
                    maxLength={10}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Package Defaults */}
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Box className="w-5 h-5 text-gray-400" />
              Default Package Dimensions
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Length (cm)</label>
                <input
                  type="number"
                  min="1"
                  value={formData.default_length}
                  onChange={(e) => updateFormData("default_length", parseFloat(e.target.value) || 0)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Breadth (cm)</label>
                <input
                  type="number"
                  min="1"
                  value={formData.default_breadth}
                  onChange={(e) => updateFormData("default_breadth", parseFloat(e.target.value) || 0)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Height (cm)</label>
                <input
                  type="number"
                  min="1"
                  value={formData.default_height}
                  onChange={(e) => updateFormData("default_height", parseFloat(e.target.value) || 0)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Weight (kg)</label>
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

          {/* Enable/Disable */}
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Integration Status</h3>
                <p className="text-sm text-gray-500">Enable or disable ShipRocket integration</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.enabled}
                  onChange={(e) => updateFormData("enabled", e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Save Button */}
          <div className="flex justify-end gap-3">
            <button
              onClick={fetchSettings}
              disabled={saving}
              className="px-6 py-2.5 border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-lg text-sm font-medium transition-colors"
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
              ) : saved ? (
                <>
                  <Check className="w-4 h-4" />
                  Saved!
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </motion.div>
      )}
    </div>
  )
}
