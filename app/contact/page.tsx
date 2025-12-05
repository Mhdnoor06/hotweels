"use client"

import { useState, useEffect } from "react"
import { Navbar } from "@/components/navbar"
import { motion } from "framer-motion"
import { Mail, Phone, MapPin, Send, Loader2, Check, MessageCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import type { StoreSettings } from "@/lib/supabase/database.types"

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [settings, setSettings] = useState<StoreSettings | null>(null)
  const [loadingSettings, setLoadingSettings] = useState(true)

  // Fetch store settings
  useEffect(() => {
    async function fetchSettings() {
      try {
        const res = await fetch(`/api/settings?t=${Date.now()}`, {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
          },
        })
        if (res.ok) {
          const data = await res.json()
          const settingsData = data.settings || data
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

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // Basic validation
    if (!formData.name || !formData.email || !formData.message) {
      setError("Please fill in all required fields")
      return
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.email)) {
      setError("Please enter a valid email address")
      return
    }

    setIsSubmitting(true)

    try {
      // Here you would typically send the form data to your backend API
      // For now, we'll simulate a submission
      await new Promise((resolve) => setTimeout(resolve, 1500))

      setIsSubmitted(true)
      setFormData({
        name: "",
        email: "",
        phone: "",
        subject: "",
        message: "",
      })
    } catch (err) {
      setError("Failed to send message. Please try again later.")
      console.error("Contact form error:", err)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <h1 className="text-4xl sm:text-5xl font-black text-gray-900 mb-4">
              Get in Touch
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Have a question or need assistance? We're here to help! Reach out to
              us and we'll get back to you as soon as possible.
            </p>
          </motion.div>

          <div className="grid lg:grid-cols-1 gap-8 max-w-2xl mx-auto">
            {/* Contact Information */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="space-y-6"
            >
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-6">
                  Contact Information
                </h2>

                <div className="space-y-6">
                  {/* Email */}
                  {settings?.contact_email && (
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                        <Mail className="w-6 h-6 text-red-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-1">Email</h3>
                        <a
                          href={`mailto:${settings.contact_email}`}
                          className="text-gray-600 hover:text-red-600 transition-colors"
                        >
                          {settings.contact_email}
                        </a>
                      </div>
                    </div>
                  )}

                  {/* Phone */}
                  {settings?.contact_phone && (
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                        <Phone className="w-6 h-6 text-red-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-1">Phone</h3>
                        <a
                          href={`tel:${settings.contact_phone.replace(/\D/g, '')}`}
                          className="text-gray-600 hover:text-red-600 transition-colors"
                        >
                          {settings.contact_phone}
                        </a>
                      </div>
                    </div>
                  )}

                  {/* WhatsApp */}
                  {settings?.contact_whatsapp && (
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                        <MessageCircle className="w-6 h-6 text-red-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-1">WhatsApp</h3>
                        <a
                          href={`https://wa.me/${settings.contact_whatsapp.replace(/\D/g, '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-gray-600 hover:text-red-600 transition-colors"
                        >
                          {settings.contact_whatsapp}
                        </a>
                      </div>
                    </div>
                  )}

                  {/* Address */}
                  {settings?.store_address && (
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                        <MapPin className="w-6 h-6 text-red-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-1">Address</h3>
                        <p className="text-gray-600 whitespace-pre-line">
                          {settings.store_address}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Loading state */}
                  {loadingSettings && (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                    </div>
                  )}

                  {/* No contact info available */}
                  {!loadingSettings && !settings?.contact_email && !settings?.contact_phone && !settings?.contact_whatsapp && !settings?.store_address && (
                    <div className="text-center py-8 text-gray-500">
                      <p>Contact information will be available soon.</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Business Hours */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">
                  Business Hours
                </h2>
                <div className="space-y-2 text-gray-600">
                  <div className="flex justify-between">
                    <span>Monday - Friday</span>
                    <span className="font-medium">9:00 AM - 6:00 PM</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Saturday</span>
                    <span className="font-medium">10:00 AM - 4:00 PM</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Sunday</span>
                    <span className="font-medium">10:00 AM - 4:00 PM</span>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Contact Form - Commented out for now */}
          </div>
        </div>
      </main>
    </>
  )
}

