"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useAuth } from "@/context/auth-context"
import { Navbar } from "@/components/navbar"
import { motion } from "framer-motion"
import { Eye, EyeOff, Loader2, Mail, Lock, User } from "lucide-react"

export default function SignupPage() {
  const router = useRouter()
  const { signUp, isLoading: authLoading } = useAuth()

  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (password !== confirmPassword) {
      setError("Passwords do not match")
      return
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters long")
      return
    }

    setIsLoading(true)

    const { error } = await signUp(email, password, name)

    if (error) {
      setError(error)
      setIsLoading(false)
      return
    }

    setSuccess(true)
    setIsLoading(false)
  }

  if (success) {
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
                <svg className="w-7 h-7 sm:w-8 sm:h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Check Your Email</h2>
              <p className="text-sm sm:text-base text-gray-600 mb-5 sm:mb-6">
                We&apos;ve sent a confirmation link to <strong>{email}</strong>.
                Please check your inbox and click the link to activate your account.
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
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Create Account</h1>
              <p className="mt-1.5 sm:mt-2 text-sm sm:text-base text-gray-600">Join our community of collectors</p>
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
                <label htmlFor="name" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
                  <input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your name"
                    required
                    className="w-full pl-9 sm:pl-10 pr-4 py-2.5 sm:py-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="email" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    required
                    className="w-full pl-9 sm:pl-10 pr-4 py-2.5 sm:py-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Create a password"
                    required
                    minLength={6}
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
                <p className="mt-1 text-[10px] sm:text-xs text-gray-500">Must be at least 6 characters</p>
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
                  <input
                    id="confirmPassword"
                    type={showPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm your password"
                    required
                    className="w-full pl-9 sm:pl-10 pr-4 py-2.5 sm:py-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading || authLoading}
                className="w-full py-2.5 sm:py-3 px-4 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm sm:text-base"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 animate-spin" />
                    Creating account...
                  </>
                ) : (
                  "Create Account"
                )}
              </button>
            </form>

            <div className="mt-4 sm:mt-6 text-center">
              <p className="text-sm sm:text-base text-gray-600">
                Already have an account?{" "}
                <Link href="/login" className="text-red-500 hover:text-red-600 font-medium">
                  Sign in
                </Link>
              </p>
            </div>
          </div>
        </motion.div>
      </main>
    </>
  )
}
