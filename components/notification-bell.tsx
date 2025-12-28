"use client"

import { useState, useEffect, useCallback } from "react"
import { Bell, Check, CheckCheck, Package, Truck, CreditCard, X } from "lucide-react"
import { useAuth } from "@/context/auth-context"
import { motion, AnimatePresence } from "framer-motion"
import Link from "next/link"
import type { Notification } from "@/lib/supabase/database.types"

interface NotificationBellProps {
  isScrolled?: boolean
}

export function NotificationBell({ isScrolled = true }: NotificationBellProps) {
  const { user, session } = useAuth()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const fetchNotifications = useCallback(async () => {
    if (!session?.access_token) return

    try {
      const res = await fetch('/api/notifications?limit=10', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      })

      if (res.ok) {
        const data = await res.json()
        setNotifications(data.notifications || [])
        setUnreadCount(data.unreadCount || 0)
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error)
    }
  }, [session?.access_token])

  // Fetch notifications on mount and when user changes
  useEffect(() => {
    if (user && session?.access_token) {
      fetchNotifications()

      // Poll for new notifications every 30 seconds
      const interval = setInterval(fetchNotifications, 30000)
      return () => clearInterval(interval)
    }
  }, [user, session?.access_token, fetchNotifications])

  const markAsRead = async (notificationId: string) => {
    if (!session?.access_token) return

    try {
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ notificationIds: [notificationId] }),
      })

      setNotifications(prev =>
        prev.map(n => (n.id === notificationId ? { ...n, is_read: true } : n))
      )
      setUnreadCount(prev => Math.max(0, prev - 1))
    } catch (error) {
      console.error('Failed to mark as read:', error)
    }
  }

  const markAllAsRead = async () => {
    if (!session?.access_token || unreadCount === 0) return

    setIsLoading(true)
    try {
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ markAllRead: true }),
      })

      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
      setUnreadCount(0)
    } catch (error) {
      console.error('Failed to mark all as read:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'order_status':
        return <Package className="w-4 h-4" />
      case 'shipping':
        return <Truck className="w-4 h-4" />
      case 'payment':
        return <CreditCard className="w-4 h-4" />
      default:
        return <Bell className="w-4 h-4" />
    }
  }

  const getTimeAgo = (date: string) => {
    const now = new Date()
    const notificationDate = new Date(date)
    const diffMs = now.getTime() - notificationDate.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return notificationDate.toLocaleDateString()
  }

  // Don't render if user is not logged in
  if (!user) return null

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`relative p-2 transition-colors ${
          isScrolled
            ? "text-gray-500 hover:text-gray-900"
            : "text-white/70 hover:text-white"
        }`}
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5" />
        <AnimatePresence>
          {unreadCount > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-[10px] font-bold text-white flex items-center justify-center"
            >
              {unreadCount > 99 ? "99+" : unreadCount}
            </motion.span>
          )}
        </AnimatePresence>
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />

            {/* Dropdown - Fixed position on mobile, absolute on desktop */}
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="fixed sm:absolute left-2 right-2 sm:left-auto sm:right-0 top-14 sm:top-full sm:mt-2 sm:w-96 bg-white rounded-xl shadow-xl border border-gray-200 z-50 overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50">
                <h3 className="font-semibold text-gray-900">Notifications</h3>
                <div className="flex items-center gap-2">
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllAsRead}
                      disabled={isLoading}
                      className="text-xs text-red-600 hover:text-red-700 font-medium flex items-center gap-1 disabled:opacity-50"
                    >
                      <CheckCheck className="w-3.5 h-3.5" />
                      Mark all read
                    </button>
                  )}
                  <button
                    onClick={() => setIsOpen(false)}
                    className="p-1 hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    <X className="w-4 h-4 text-gray-500" />
                  </button>
                </div>
              </div>

              {/* Notifications List */}
              <div className="max-h-[60vh] overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="px-4 py-8 text-center">
                    <Bell className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">No notifications yet</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {notifications.map((notification) => (
                      <div
                        key={notification.id}
                        className={`px-4 py-3 hover:bg-gray-50 transition-colors cursor-pointer ${
                          !notification.is_read ? "bg-red-50/50" : ""
                        }`}
                        onClick={() => {
                          if (!notification.is_read) {
                            markAsRead(notification.id)
                          }
                          if (notification.order_id) {
                            setIsOpen(false)
                          }
                        }}
                      >
                        {notification.order_id ? (
                          <Link
                            href={`/orders`}
                            className="block"
                            onClick={() => setIsOpen(false)}
                          >
                            <NotificationContent
                              notification={notification}
                              getNotificationIcon={getNotificationIcon}
                              getTimeAgo={getTimeAgo}
                            />
                          </Link>
                        ) : (
                          <NotificationContent
                            notification={notification}
                            getNotificationIcon={getNotificationIcon}
                            getTimeAgo={getTimeAgo}
                          />
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Footer */}
              {notifications.length > 0 && (
                <div className="border-t border-gray-100 bg-gray-50">
                  <Link
                    href="/orders"
                    onClick={() => setIsOpen(false)}
                    className="block w-full px-4 py-3 text-sm text-center text-red-600 hover:text-red-700 hover:bg-gray-100 font-medium transition-colors"
                  >
                    View all orders
                  </Link>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}

function NotificationContent({
  notification,
  getNotificationIcon,
  getTimeAgo,
}: {
  notification: Notification
  getNotificationIcon: (type: string) => React.ReactNode
  getTimeAgo: (date: string) => string
}) {
  return (
    <div className="flex gap-3">
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
          notification.type === "order_status"
            ? "bg-blue-100 text-blue-600"
            : notification.type === "shipping"
            ? "bg-green-100 text-green-600"
            : notification.type === "payment"
            ? "bg-purple-100 text-purple-600"
            : "bg-gray-100 text-gray-600"
        }`}
      >
        {getNotificationIcon(notification.type)}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-medium text-gray-900 line-clamp-1">
            {notification.title}
          </p>
          {!notification.is_read && (
            <span className="w-2 h-2 rounded-full bg-red-500 shrink-0 mt-1.5" />
          )}
        </div>
        <p className="text-xs text-gray-500 line-clamp-2 mt-0.5">
          {notification.message}
        </p>
        <p className="text-xs text-gray-400 mt-1">
          {getTimeAgo(notification.created_at)}
        </p>
      </div>
    </div>
  )
}
