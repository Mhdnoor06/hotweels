"use client"

import { useState, useEffect, useRef } from "react"
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
  Flame,
  LogOut,
  Menu,
  X,
  Save,
  Loader2,
  Phone,
  Mail,
  MessageCircle,
  QrCode,
  Percent,
  Truck,
  CreditCard,
  Upload,
  Check,
  XCircle,
} from "lucide-react"
import type { StoreSettings } from "@/lib/supabase/database.types"
import { uploadSettingsImage } from "@/lib/supabase/storage"

const navItems = [
  { label: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
  { label: "Orders", href: "/admin/orders", icon: ShoppingCart },
  { label: "Products", href: "/admin/products", icon: Package },
  { label: "Settings", href: "/admin/settings", icon: Settings },
]

export function AdminSettings() {
  const router = useRouter()
  const pathname = usePathname()
  const { isAuthenticated, isLoading: authLoading, logout } = useAdminAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [uploadingQR, setUploadingQR] = useState(false)
  const [originalSettings, setOriginalSettings] = useState<Partial<StoreSettings> | null>(null)
  const [pendingQRFile, setPendingQRFile] = useState<File | null>(null)
  const [validationError, setValidationError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [settings, setSettings] = useState<Partial<StoreSettings>>({
    contact_phone: "",
    contact_email: "",
    contact_whatsapp: "",
    upi_qr_code: "",
    upi_id: "",
    cod_enabled: true,
    online_payment_enabled: true,
    cod_charges: 0,
    discount_enabled: false,
    discount_percentage: 0,
    discount_code: "",
    store_name: "Hot Wheels Store",
    store_address: "",
    shipping_charges_collection_enabled: false,
    shipping_charges_amount: 0,
  })

  useEffect(() => {
    if (authLoading) return
    
    if (!isAuthenticated) {
      router.push("/admin")
      return
    }

    fetchSettings()
  }, [router, isAuthenticated, authLoading])

  const fetchSettings = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/admin/settings", { 
        cache: 'no-store',
        credentials: 'include',
        headers: {
          'Cache-Control': 'no-cache'
        }
      })
      if (res.ok) {
        const data = await res.json()
        // Ensure all boolean values are properly set
        const settingsData = {
          ...data,
          cod_enabled: data.cod_enabled ?? true,
          online_payment_enabled: data.online_payment_enabled ?? true,
          discount_enabled: data.discount_enabled ?? false,
          shipping_charges_collection_enabled: data.shipping_charges_collection_enabled ?? false,
          shipping_charges_amount: data.shipping_charges_amount ?? 0,
        }
        setSettings(settingsData)
        setOriginalSettings(settingsData)
      }
      } catch (err) {
        console.error("Error fetching settings:", err)
        setValidationError("Failed to load settings. Please refresh the page.")
      } finally {
        setLoading(false)
      }
  }

  const handleSave = async () => {
    setSaving(true)
    setSaved(false)
    setValidationError(null)
    
    // Validate: At least one payment method must be enabled
    if (!settings.cod_enabled && !settings.online_payment_enabled) {
      setValidationError("At least one payment method (COD or Online Payment) must be enabled.")
      setSaving(false)
      return
    }

    try {
      let settingsToSave = { ...settings }

      // Upload QR code image if a new file was selected
      if (pendingQRFile) {
        try {
          const uploadedUrl = await uploadSettingsImage(pendingQRFile)
          if (uploadedUrl) {
            settingsToSave.upi_qr_code = uploadedUrl
            setPendingQRFile(null)
          }
        } catch (err) {
          console.error("Error uploading QR code:", err)
          alert("Failed to upload QR code image. Please try again.")
          setSaving(false)
          return
        }
      }

      // Ensure all boolean values are explicitly set
      const payload = {
        contact_phone: settingsToSave.contact_phone || "",
        contact_email: settingsToSave.contact_email || "",
        contact_whatsapp: settingsToSave.contact_whatsapp || "",
        upi_qr_code: settingsToSave.upi_qr_code || "",
        upi_id: settingsToSave.upi_id || "",
        cod_enabled: settingsToSave.cod_enabled ?? true,
        online_payment_enabled: settingsToSave.online_payment_enabled ?? true,
        cod_charges: settingsToSave.cod_charges || 0,
        discount_enabled: settingsToSave.discount_enabled ?? false,
        discount_percentage: settingsToSave.discount_percentage || 0,
        discount_code: settingsToSave.discount_code || "",
        store_name: settingsToSave.store_name || "Hot Wheels Store",
        store_address: settingsToSave.store_address || "",
        shipping_charges_collection_enabled: settingsToSave.shipping_charges_collection_enabled ?? false,
        shipping_charges_amount: settingsToSave.shipping_charges_amount || 0,
      }

      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: 'include',
        body: JSON.stringify(payload),
      })

      const responseData = await res.json()

      if (res.ok) {
        const savedData = responseData
        // Ensure all boolean values are properly set
        const settingsData = {
          ...savedData,
          cod_enabled: savedData.cod_enabled ?? true,
          online_payment_enabled: savedData.online_payment_enabled ?? true,
          discount_enabled: savedData.discount_enabled ?? false,
          shipping_charges_collection_enabled: savedData.shipping_charges_collection_enabled ?? false,
          shipping_charges_amount: savedData.shipping_charges_amount ?? 0,
        }
        setSettings(settingsData)
        setOriginalSettings(settingsData)
        setValidationError(null)
        setSaved(true)
        setTimeout(() => setSaved(false), 3000)
        // Refresh settings from server to ensure consistency
        setTimeout(() => {
          fetchSettings()
        }, 1000)
      } else {
        // Show actual error from server
        const errorMessage = responseData.error || 'Failed to save settings'
        const errorDetails = responseData.details ? ` Details: ${responseData.details}` : ''
        const errorHint = responseData.hint ? ` Hint: ${responseData.hint}` : ''
        setValidationError(errorMessage + errorDetails + errorHint)
        console.error('Failed to save settings:', responseData)
      }
    } catch (err) {
      console.error("Error saving settings:", err)
      const errorMessage = err instanceof Error ? err.message : "Failed to save settings. Please try again."
      setValidationError(errorMessage)
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    if (originalSettings) {
      setSettings(originalSettings)
      setPendingQRFile(null)
      setValidationError(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }

  const handleCODToggle = (checked: boolean) => {
    // If disabling COD and online payment is already disabled, prevent the toggle
    if (!checked && !settings.online_payment_enabled) {
      setValidationError("At least one payment method must be enabled. Please enable Online Payment first if you want to disable COD.")
      return
    }
    // Clear validation error if at least one payment method will be enabled
    if (checked || settings.online_payment_enabled) {
      setValidationError(null)
    }
    setSettings((s) => ({ ...s, cod_enabled: checked }))
  }

  const handleOnlinePaymentToggle = (checked: boolean) => {
    // If disabling online payment and COD is already disabled, prevent the toggle
    if (!checked && !settings.cod_enabled) {
      setValidationError("At least one payment method must be enabled. Please enable COD first if you want to disable Online Payment.")
      return
    }
    // Clear validation error if at least one payment method will be enabled
    if (checked || settings.cod_enabled) {
      setValidationError(null)
    }
    setSettings((s) => ({ ...s, online_payment_enabled: checked }))
  }

  const handleQRUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file')
      return
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      alert('Image size must be less than 2MB')
      return
    }

    setUploadingQR(true)
    try {
      // Create preview using data URL for immediate display
      const reader = new FileReader()
      reader.onload = (event) => {
        setSettings((prev) => ({
          ...prev,
          upi_qr_code: event.target?.result as string,
        }))
        setPendingQRFile(file) // Store file for upload on save
        setUploadingQR(false)
      }
      reader.onerror = () => {
        setUploadingQR(false)
        alert('Failed to read image file')
      }
      reader.readAsDataURL(file)
    } catch (err) {
      console.error("Error processing QR:", err)
      setUploadingQR(false)
      alert('Failed to process image. Please try again.')
    }
  }

  const handleLogout = async () => {
    await logout()
    router.push("/admin")
  }

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
              <Flame className="w-6 h-6 text-red-500" />
              <span className="text-lg font-bold text-gray-900">
                HOT<span className="text-red-500">WHEELS</span>
              </span>
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
            <h1 className="text-xl font-semibold text-gray-900">Store Settings</h1>
          </div>
        </header>

        {/* Settings Content */}
        <main className="flex-1 p-4 lg:p-8">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-red-500" />
            </div>
          ) : (
            <div className="max-w-4xl space-y-4 sm:space-y-6">
              {/* Contact Information */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white border border-gray-200 rounded-xl p-4 sm:p-6"
              >
                <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center gap-2">
                  <Phone size={18} className="sm:w-5 sm:h-5 text-gray-400" />
                  Contact Information
                </h2>
                <p className="text-xs sm:text-sm text-gray-500 mb-3 sm:mb-4">
                  These details will be shown to customers during checkout for order confirmation.
                </p>
                <div className="grid sm:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5">Phone Number</label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-400" />
                      <input
                        type="tel"
                        value={settings.contact_phone || ""}
                        onChange={(e) => setSettings((s) => ({ ...s, contact_phone: e.target.value }))}
                        placeholder="+91 XXXXX XXXXX"
                        className="w-full pl-9 sm:pl-10 pr-4 py-2 sm:py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5">Email</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-400" />
                      <input
                        type="email"
                        value={settings.contact_email || ""}
                        onChange={(e) => setSettings((s) => ({ ...s, contact_email: e.target.value }))}
                        placeholder="store@example.com"
                        className="w-full pl-9 sm:pl-10 pr-4 py-2 sm:py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm"
                      />
                    </div>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5">WhatsApp Number</label>
                    <div className="relative">
                      <MessageCircle className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-400" />
                      <input
                        type="tel"
                        value={settings.contact_whatsapp || ""}
                        onChange={(e) => setSettings((s) => ({ ...s, contact_whatsapp: e.target.value }))}
                        placeholder="+91 XXXXX XXXXX (with country code)"
                        className="w-full pl-9 sm:pl-10 pr-4 py-2 sm:py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm"
                      />
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Payment Methods */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white border border-gray-200 rounded-xl p-4 sm:p-6"
              >
                <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center gap-2">
                  <CreditCard size={18} className="sm:w-5 sm:h-5 text-gray-400" />
                  Payment Methods
                </h2>
                
                {/* Validation Error Message */}
                {validationError && (
                  <div className="mb-3 sm:mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-600">{validationError}</p>
                  </div>
                )}

                <div className="space-y-3 sm:space-y-4">
                  {/* COD Option */}
                  <div className={`flex items-start justify-between p-3 sm:p-4 rounded-lg ${validationError && !settings.cod_enabled && !settings.online_payment_enabled ? 'bg-red-50 border border-red-200' : 'bg-gray-50'}`}>
                    <div className="flex items-start gap-2 sm:gap-3 flex-1 min-w-0">
                      <Truck className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500 mt-0.5 shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm sm:text-base font-medium text-gray-900">Cash on Delivery (COD)</p>
                        <p className="text-xs sm:text-sm text-gray-500">Allow customers to pay when they receive their order</p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.cod_enabled ?? true}
                        onChange={(e) => handleCODToggle(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-500"></div>
                    </label>
                  </div>

                  {/* COD Charges */}
                  {settings.cod_enabled && (
                    <div className="pl-6 sm:pl-8 space-y-3 sm:space-y-4">
                      <div>
                        <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5">COD Charges (₹)</label>
                        <input
                          type="number"
                          min="0"
                          value={settings.cod_charges || 0}
                          onChange={(e) => setSettings((s) => ({ ...s, cod_charges: parseFloat(e.target.value) || 0 }))}
                          className="w-full sm:w-40 px-3 sm:px-4 py-2 sm:py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm"
                        />
                      </div>

                      {/* Shipping Charges Collection */}
                      <div className="flex items-start justify-between p-3 sm:p-4 rounded-lg bg-gray-50 border border-gray-200">
                        <div className="flex items-start gap-2 sm:gap-3 flex-1 min-w-0">
                          <Truck className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500 mt-0.5 shrink-0" />
                          <div className="min-w-0 flex-1">
                            <p className="text-sm sm:text-base font-medium text-gray-900">Collect Shipping Charges Upfront</p>
                            <p className="text-xs sm:text-sm text-gray-500">Require customers to pay shipping charges before order placement for COD orders</p>
                          </div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={settings.shipping_charges_collection_enabled ?? false}
                            onChange={(e) => setSettings((s) => ({ ...s, shipping_charges_collection_enabled: e.target.checked }))}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-500"></div>
                        </label>
                      </div>

                      {/* Shipping Charges Amount */}
                      {settings.shipping_charges_collection_enabled && (
                        <div className="pl-6 sm:pl-8">
                          <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5">Shipping Charges Amount (₹)</label>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={settings.shipping_charges_amount || 0}
                            onChange={(e) => setSettings((s) => ({ ...s, shipping_charges_amount: parseFloat(e.target.value) || 0 }))}
                            className="w-full sm:w-40 px-3 sm:px-4 py-2 sm:py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm"
                            placeholder="0.00"
                          />
                          <p className="text-xs text-gray-500 mt-1">Amount customers need to pay upfront for shipping</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Online Payment Option */}
                  <div className={`flex items-start justify-between p-3 sm:p-4 rounded-lg ${validationError && !settings.cod_enabled && !settings.online_payment_enabled ? 'bg-red-50 border border-red-200' : 'bg-gray-50'}`}>
                    <div className="flex items-start gap-2 sm:gap-3 flex-1 min-w-0">
                      <QrCode className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500 mt-0.5 shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm sm:text-base font-medium text-gray-900">Online Payment (UPI)</p>
                        <p className="text-xs sm:text-sm text-gray-500">Customer pays via UPI using QR code before order confirmation</p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.online_payment_enabled ?? true}
                        onChange={(e) => handleOnlinePaymentToggle(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-500"></div>
                    </label>
                  </div>

                  {/* UPI Settings */}
                  {settings.online_payment_enabled && (
                    <div className="pl-6 sm:pl-8 space-y-3 sm:space-y-4">
                      <div>
                        <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5">UPI ID</label>
                        <input
                          type="text"
                          value={settings.upi_id || ""}
                          onChange={(e) => setSettings((s) => ({ ...s, upi_id: e.target.value }))}
                          placeholder="yourname@upi"
                          className="w-full max-w-md px-3 sm:px-4 py-2 sm:py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm"
                        />
                      </div>

                      <div>
                        <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5">UPI QR Code</label>
                        <div className="flex flex-col sm:flex-row items-start gap-3 sm:gap-4">
                          {settings.upi_qr_code ? (
                            <div className="relative w-24 h-24 sm:w-32 sm:h-32 border border-gray-200 rounded-lg overflow-hidden bg-white shrink-0">
                              <Image
                                src={settings.upi_qr_code}
                                alt="UPI QR Code"
                                fill
                                className="object-contain p-2"
                              />
                            </div>
                          ) : (
                            <div className="w-24 h-24 sm:w-32 sm:h-32 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50 shrink-0">
                              <QrCode className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <input
                              ref={fileInputRef}
                              type="file"
                              accept="image/*"
                              onChange={handleQRUpload}
                              className="hidden"
                            />
                            <button
                              onClick={() => fileInputRef.current?.click()}
                              disabled={uploadingQR}
                              className="flex items-center gap-2 px-3 sm:px-4 py-2 border border-gray-300 rounded-lg text-xs sm:text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                            >
                              {uploadingQR ? (
                                <Loader2 size={14} className="sm:w-4 sm:h-4 animate-spin" />
                              ) : (
                                <Upload size={14} className="sm:w-4 sm:h-4" />
                              )}
                              Upload QR Code
                            </button>
                            <p className="text-xs text-gray-500 mt-2">PNG, JPG up to 2MB</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>

              {/* Discount Settings */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white border border-gray-200 rounded-xl p-4 sm:p-6"
              >
                <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center gap-2">
                  <Percent size={18} className="sm:w-5 sm:h-5 text-gray-400" />
                  Discount Settings
                </h2>
                <div className="space-y-3 sm:space-y-4">
                  <div className="flex items-start justify-between p-3 sm:p-4 bg-gray-50 rounded-lg">
                    <div className="flex-1 min-w-0 pr-3">
                      <p className="text-sm sm:text-base font-medium text-gray-900">Enable Discount</p>
                      <p className="text-xs sm:text-sm text-gray-500">Apply a store-wide discount on checkout</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.discount_enabled}
                        onChange={(e) => setSettings((s) => ({ ...s, discount_enabled: e.target.checked }))}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-500"></div>
                    </label>
                  </div>

                  {settings.discount_enabled && (
                    <div className="grid sm:grid-cols-2 gap-3 sm:gap-4 pl-3 sm:pl-4">
                      <div>
                        <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5">Discount Percentage (%)</label>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={settings.discount_percentage || 0}
                          onChange={(e) =>
                            setSettings((s) => ({ ...s, discount_percentage: parseFloat(e.target.value) || 0 }))
                          }
                          className="w-full px-3 sm:px-4 py-2 sm:py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5">Discount Code (Optional)</label>
                        <input
                          type="text"
                          value={settings.discount_code || ""}
                          onChange={(e) => setSettings((s) => ({ ...s, discount_code: e.target.value }))}
                          placeholder="e.g., SAVE10"
                          className="w-full px-3 sm:px-4 py-2 sm:py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm uppercase"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>

              {/* Store Info */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-white border border-gray-200 rounded-xl p-4 sm:p-6"
              >
                <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center gap-2">
                  <Flame size={18} className="sm:w-5 sm:h-5 text-gray-400" />
                  Store Information
                </h2>
                <div className="space-y-3 sm:space-y-4">
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5">Store Name</label>
                    <input
                      type="text"
                      value={settings.store_name || ""}
                      onChange={(e) => setSettings((s) => ({ ...s, store_name: e.target.value }))}
                      className="w-full max-w-md px-3 sm:px-4 py-2 sm:py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5">Store Address</label>
                    <textarea
                      value={settings.store_address || ""}
                      onChange={(e) => setSettings((s) => ({ ...s, store_address: e.target.value }))}
                      rows={3}
                      placeholder="Full store address..."
                      className="w-full px-3 sm:px-4 py-2 sm:py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm resize-none"
                    />
                  </div>
                </div>
              </motion.div>

              {/* Save/Cancel Buttons */}
              <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-6">
                {/* Validation Error Display (if not shown in Payment Methods section) */}
                {validationError && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-600">{validationError}</p>
                  </div>
                )}
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-end">
                  <button
                    onClick={handleCancel}
                    disabled={saving}
                    className="flex items-center justify-center gap-2 px-6 py-3 border border-gray-300 hover:bg-gray-50 disabled:opacity-50 text-gray-700 rounded-lg text-sm font-medium transition-colors"
                  >
                    <XCircle size={18} />
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saving || (!settings.cod_enabled && !settings.online_payment_enabled)}
                    className="flex items-center justify-center gap-2 bg-red-500 hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg text-sm font-medium transition-colors"
                  >
                    {saving ? (
                      <>
                        <Loader2 size={18} className="animate-spin" />
                        Saving...
                      </>
                    ) : saved ? (
                      <>
                        <Check size={18} />
                        Saved!
                      </>
                    ) : (
                      <>
                        <Save size={18} />
                        Save Changes
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
