"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import {
  Truck,
  Loader2,
  CheckCircle2,
  AlertCircle,
  XCircle,
  MapPin,
  Package,
  ShoppingCart,
  ArrowRight,
  RefreshCw,
  Settings,
  TrendingUp,
  Clock,
  Box,
} from "lucide-react"
import { AdminPageHeader } from "@/components/admin/admin-page-header"
import type { ShipRocketSettingsResponse } from "@/lib/shiprocket/types"

interface OrderStats {
  pending: number
  processing: number
  shipped: number
  delivered: number
}

export default function ShipRocketOverviewPage() {
  const [loading, setLoading] = useState(true)
  const [settings, setSettings] = useState<ShipRocketSettingsResponse | null>(null)
  const [orderStats, setOrderStats] = useState<OrderStats>({
    pending: 0,
    processing: 0,
    shipped: 0,
    delivered: 0,
  })
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      // Fetch settings
      const settingsRes = await fetch(`/api/admin/shiprocket/settings?t=${Date.now()}`, {
        credentials: "include",
        cache: "no-store",
      })

      if (settingsRes.ok) {
        const data = await settingsRes.json()
        setSettings(data)
      }

      // Fetch order stats
      const ordersRes = await fetch("/api/admin/orders", {
        credentials: "include",
      })

      if (ordersRes.ok) {
        const ordersData = await ordersRes.json()
        const orders = ordersData.orders || []

        setOrderStats({
          pending: orders.filter((o: { status: string }) => o.status === "pending").length,
          processing: orders.filter((o: { status: string }) => o.status === "processing").length,
          shipped: orders.filter((o: { status: string }) => o.status === "shipped").length,
          delivered: orders.filter((o: { status: string }) => o.status === "delivered").length,
        })
      }
    } catch (err) {
      console.error("Error fetching data:", err)
    } finally {
      setLoading(false)
    }
  }

  const handleTestConnection = async () => {
    setTesting(true)
    setTestResult(null)

    try {
      const res = await fetch("/api/admin/shiprocket/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({}),
      })

      const data = await res.json()
      setTestResult({
        success: res.ok && data.success,
        message: data.message || data.error || "Connection test completed",
      })
    } catch {
      setTestResult({ success: false, message: "Failed to test connection" })
    } finally {
      setTesting(false)
    }
  }

  const isConfigured = settings?.hasCredentials && settings?.pickupLocation?.address
  const isActive = isConfigured && settings?.enabled

  // Status badge for header
  const StatusBadge = () => {
    if (!settings) return null

    if (isActive) {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-100 text-green-700 rounded-full text-xs sm:text-sm font-medium">
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Active</span>
        </span>
      )
    }

    if (isConfigured) {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-yellow-100 text-yellow-700 rounded-full text-xs sm:text-sm font-medium">
          <AlertCircle className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Disabled</span>
        </span>
      )
    }

    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 text-gray-600 rounded-full text-xs sm:text-sm font-medium">
        <XCircle className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Not Configured</span>
      </span>
    )
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <AdminPageHeader title="ShipRocket" icon={Truck} actions={<StatusBadge />} />
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        </div>
      ) : !isConfigured ? (
        // Not configured - show setup prompt
        <div className="max-w-2xl mx-auto text-center py-12">
          <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Truck className="w-10 h-10 text-blue-600" />
          </div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-3">
            Set Up ShipRocket Integration
          </h2>
          <p className="text-gray-500 mb-8 max-w-md mx-auto">
            Connect your ShipRocket account to enable automated shipping, tracking, and label generation for your orders.
          </p>
          <Link
            href="/admin/shiprocket/settings"
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors"
          >
            <Settings className="w-5 h-5" />
            Configure ShipRocket
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      ) : (
        // Configured - show overview
        <div className="space-y-6">
          {/* Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <Clock className="w-5 h-5 text-yellow-600" />
                </div>
                <span className="text-sm text-gray-500">Pending</span>
              </div>
              <p className="text-2xl sm:text-3xl font-semibold text-gray-900">{orderStats.pending}</p>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Package className="w-5 h-5 text-blue-600" />
                </div>
                <span className="text-sm text-gray-500">Processing</span>
              </div>
              <p className="text-2xl sm:text-3xl font-semibold text-gray-900">{orderStats.processing}</p>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Truck className="w-5 h-5 text-purple-600" />
                </div>
                <span className="text-sm text-gray-500">Shipped</span>
              </div>
              <p className="text-2xl sm:text-3xl font-semibold text-gray-900">{orderStats.shipped}</p>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                </div>
                <span className="text-sm text-gray-500">Delivered</span>
              </div>
              <p className="text-2xl sm:text-3xl font-semibold text-gray-900">{orderStats.delivered}</p>
            </div>
          </div>

          {/* Main Content Grid */}
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Configuration Summary */}
            <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                <h2 className="font-semibold text-gray-900">Configuration</h2>
                <Link
                  href="/admin/shiprocket/settings"
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  Edit
                </Link>
              </div>
              <div className="p-5">
                <div className="grid sm:grid-cols-2 gap-6">
                  {/* API Status */}
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                      <span className="text-sm font-medium text-gray-700">API Connected</span>
                    </div>
                    <div className="pl-6 space-y-1 text-sm text-gray-500">
                      <p>Credentials configured</p>
                      <p>Token: {settings?.tokenExpiresAt ? "Valid" : "Not set"}</p>
                    </div>
                  </div>

                  {/* Pickup Location */}
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <MapPin className="w-4 h-4 text-blue-500" />
                      <span className="text-sm font-medium text-gray-700">Pickup Location</span>
                    </div>
                    <div className="pl-6 text-sm text-gray-500">
                      <p>{settings?.pickupLocation?.name || "Primary Warehouse"}</p>
                      <p>{settings?.pickupLocation?.city}, {settings?.pickupLocation?.state}</p>
                      <p>{settings?.pickupLocation?.pincode}</p>
                    </div>
                  </div>

                  {/* Package Defaults */}
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <Box className="w-4 h-4 text-purple-500" />
                      <span className="text-sm font-medium text-gray-700">Package Defaults</span>
                    </div>
                    <div className="pl-6 text-sm text-gray-500">
                      <p>
                        {settings?.defaultDimensions.length} x {settings?.defaultDimensions.breadth} x {settings?.defaultDimensions.height} cm
                      </p>
                      <p>Weight: {settings?.defaultDimensions.weight} kg</p>
                    </div>
                  </div>

                  {/* Integration Status */}
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      {settings?.enabled ? (
                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-yellow-500" />
                      )}
                      <span className="text-sm font-medium text-gray-700">Integration Status</span>
                    </div>
                    <div className="pl-6 text-sm">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${
                          settings?.enabled
                            ? "bg-green-100 text-green-700"
                            : "bg-yellow-100 text-yellow-700"
                        }`}
                      >
                        {settings?.enabled ? "Enabled" : "Disabled"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100">
                <h2 className="font-semibold text-gray-900">Quick Actions</h2>
              </div>
              <div className="p-4 space-y-2">
                <Link
                  href="/admin/shiprocket/orders"
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors group"
                >
                  <div className="p-2 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors">
                    <ShoppingCart className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 text-sm">Manage Orders</p>
                    <p className="text-xs text-gray-500">View and ship orders</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-gray-600" />
                </Link>

                <button
                  onClick={handleTestConnection}
                  disabled={testing}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors group w-full text-left"
                >
                  <div className="p-2 bg-gray-100 rounded-lg group-hover:bg-gray-200 transition-colors">
                    {testing ? (
                      <Loader2 className="w-4 h-4 text-gray-600 animate-spin" />
                    ) : (
                      <RefreshCw className="w-4 h-4 text-gray-600" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 text-sm">Test Connection</p>
                    <p className="text-xs text-gray-500">Verify API status</p>
                  </div>
                </button>

                <Link
                  href="/admin/shiprocket/settings"
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors group"
                >
                  <div className="p-2 bg-gray-100 rounded-lg group-hover:bg-gray-200 transition-colors">
                    <Settings className="w-4 h-4 text-gray-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 text-sm">Settings</p>
                    <p className="text-xs text-gray-500">Configure integration</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-gray-600" />
                </Link>
              </div>

              {/* Test Result */}
              {testResult && (
                <div className="px-4 pb-4">
                  <div
                    className={`p-3 rounded-lg text-sm ${
                      testResult.success
                        ? "bg-green-50 text-green-700"
                        : "bg-red-50 text-red-700"
                    }`}
                  >
                    {testResult.message}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Disabled Warning */}
          {isConfigured && !settings?.enabled && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-yellow-800">Integration Disabled</p>
                <p className="text-sm text-yellow-700 mt-1">
                  ShipRocket is configured but not enabled. Go to{" "}
                  <Link href="/admin/shiprocket/settings" className="underline font-medium">
                    Settings
                  </Link>{" "}
                  to enable the integration and start shipping orders.
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
