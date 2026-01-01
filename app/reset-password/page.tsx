"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { supabase } from "@/lib/supabase/client"
import { Navbar } from "@/components/navbar"
import { motion } from "framer-motion"
import { Loader2, Lock, Eye, EyeOff, CheckCircle, AlertCircle } from "lucide-react"

export default function ResetPasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [error, setError] = useState("")
  const [isValidSession, setIsValidSession] = useState<boolean | null>(null)

  useEffect(() => {
    // Check if we have a valid recovery session
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()

      // Check URL hash for recovery token (Supabase sends it as a hash fragment)
      const hashParams = new URLSearchParams(window.location.hash.substring(1))
      const accessToken = hashParams.get('access_token')
      const type = hashParams.get('type')

      if (type === 'recovery' && accessToken) {
        // Set the session with the recovery token
        const { error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: hashParams.get('refresh_token') || '',
        })

        if (error) {
          setIsValidSession(false)
          setError("Invalid or expired reset link. Please request a new one.")
        } else {
          setIsValidSession(true)
        }
      } else if (session) {
        // Already have a valid session (user clicked link and session was auto-set)
        setIsValidSession(true)
      } else {
        setIsValidSession(false)
        setError("Invalid or expired reset link. Please request a new one.")
      }
    }

    checkSession()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (password !== confirmPassword) {
      setError("Passwords do not match")
      return
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters long")
      return
    }

    setIsLoading(true)

    try {
      const { error } = await supabase.auth.updateUser({
        password: password,
      })

      if (error) {
        setError(error.message)
        setIsLoading(false)
        return
      }

      // Sign out after password reset so user can login with new password
      await supabase.auth.signOut()
      setIsSuccess(true)
    } catch {
      setError("An unexpected error occurred. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  // Show loading while checking session
  if (isValidSession === null) {
    return (
      <>
        <Navbar variant="minimal" showBack backHref="/" />
        <main className="min-h-[calc(100vh-200px)] flex items-center justify-center px-3 sm:px-4 py-8 sm:py-12 bg-gray-50">
          <div className="w-full max-w-md">
            <div className="bg-white rounded-xl sm:rounded-2xl shadow-xl p-5 sm:p-8">
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-red-500" />
              </div>
            </div>
          </div>
        </main>
      </>
    )
  }

  // Show error if invalid session
  if (!isValidSession) {
    return (
      <>
        <Navbar variant="minimal" showBack backHref="/" />
        <main className="min-h-[calc(100vh-200px)] flex items-center justify-center px-3 sm:px-4 py-8 sm:py-12 bg-gray-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="w-full max-w-md"
          >
            <div className="bg-white rounded-xl sm:rounded-2xl shadow-xl p-5 sm:p-8 text-center">
              <div className="w-14 h-14 sm:w-16 sm:h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <AlertCircle className="w-7 h-7 sm:w-8 sm:h-8 text-red-500" />
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Link Expired</h2>
              <p className="text-sm sm:text-base text-gray-600 mb-5 sm:mb-6">
                {error || "This password reset link is invalid or has expired. Please request a new one."}
              </p>
              <Link
                href="/forgot-password"
                className="inline-block py-2.5 sm:py-3 px-5 sm:px-6 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-lg transition-colors text-sm sm:text-base"
              >
                Request New Link
              </Link>
            </div>
          </motion.div>
        </main>
      </>
    )
  }

  // Show success message
  if (isSuccess) {
    return (
      <>
        <Navbar variant="minimal" showBack backHref="/" />
        <main className="min-h-[calc(100vh-200px)] flex items-center justify-center px-3 sm:px-4 py-8 sm:py-12 bg-gray-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="w-full max-w-md"
          >
            <div className="bg-white rounded-xl sm:rounded-2xl shadow-xl p-5 sm:p-8 text-center">
              <div className="w-14 h-14 sm:w-16 sm:h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <CheckCircle className="w-7 h-7 sm:w-8 sm:h-8 text-green-500" />
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Password Updated</h2>
              <p className="text-sm sm:text-base text-gray-600 mb-5 sm:mb-6">
                Your password has been successfully reset. You can now log in with your new password.
              </p>
              <Link
                href="/login"
                className="inline-block py-2.5 sm:py-3 px-5 sm:px-6 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-lg transition-colors text-sm sm:text-base"
              >
                Go to Login
              </Link>
            </div>
          </motion.div>
        </main>
      </>
    )
  }

  return (
    <>
      <Navbar variant="minimal" showBack backHref="/" />
      <main className="min-h-[calc(100vh-200px)] flex items-center justify-center px-3 sm:px-4 py-8 sm:py-12 bg-gray-50">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-xl p-5 sm:p-8">
            <div className="text-center mb-6 sm:mb-8">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Reset Password</h1>
              <p className="mt-1.5 sm:mt-2 text-sm sm:text-base text-gray-600">
                Enter your new password below
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
              {error && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="p-3 sm:p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-xs sm:text-sm"
                >
                  {error}
                </motion.div>
              )}

              <div>
                <label htmlFor="password" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                  New Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter new password"
                    required
                    minLength={8}
                    className="w-full pl-9 sm:pl-10 pr-10 sm:pr-12 py-2.5 sm:py-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4 sm:h-5 sm:w-5" /> : <Eye className="h-4 w-4 sm:h-5 sm:w-5" />}
                  </button>
                </div>
                <p className="mt-1 text-[10px] sm:text-xs text-gray-500">Must be at least 8 characters</p>
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                  Confirm New Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
                  <input
                    id="confirmPassword"
                    type={showPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                    required
                    className="w-full pl-9 sm:pl-10 pr-4 py-2.5 sm:py-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 sm:py-3 px-4 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm sm:text-base"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 animate-spin" />
                    Updating...
                  </>
                ) : (
                  "Reset Password"
                )}
              </button>
            </form>
          </div>
        </motion.div>
      </main>
    </>
  )
}
