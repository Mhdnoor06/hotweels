"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useAuth } from "@/context/auth-context"
import { Navbar } from "@/components/navbar"
import { motion } from "framer-motion"
import { Loader2, User, Mail, Lock, LogOut, ChevronRight } from "lucide-react"

export default function AccountPage() {
  const router = useRouter()
  const { user, isLoading, signOut } = useAuth()

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login?redirect=/account')
    }
  }, [user, isLoading, router])

  const handleSignOut = async () => {
    await signOut()
    router.push('/')
  }

  // Show loading while checking auth
  if (isLoading || !user) {
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

  const userName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'User'

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
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <User className="w-8 h-8 sm:w-10 sm:h-10 text-red-500" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{userName}</h1>
              <p className="mt-1 text-sm sm:text-base text-gray-600">{user.email}</p>
            </div>

            <div className="space-y-3">
              {/* Email Info */}
              <div className="flex items-center gap-3 p-3 sm:p-4 bg-gray-50 rounded-lg">
                <Mail className="h-5 w-5 text-gray-400 flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-gray-500">Email Address</p>
                  <p className="text-sm font-medium text-gray-900 truncate">{user.email}</p>
                </div>
              </div>

              {/* Change Password Link */}
              <Link
                href="/account/change-password"
                className="flex items-center gap-3 p-3 sm:p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors group"
              >
                <Lock className="h-5 w-5 text-gray-400 flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-900">Change Password</p>
                  <p className="text-xs text-gray-500">Update your account password</p>
                </div>
                <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-gray-600 transition-colors flex-shrink-0" />
              </Link>

              {/* Sign Out Button */}
              <button
                onClick={handleSignOut}
                className="w-full flex items-center gap-3 p-3 sm:p-4 bg-red-50 hover:bg-red-100 rounded-lg transition-colors text-left"
              >
                <LogOut className="h-5 w-5 text-red-500 flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-red-600">Sign Out</p>
                  <p className="text-xs text-red-400">Log out of your account</p>
                </div>
              </button>
            </div>
          </div>
        </motion.div>
      </main>
    </>
  )
}
