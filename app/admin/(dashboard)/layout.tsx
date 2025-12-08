"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter, usePathname } from "next/navigation"
import { useAdminAuth } from "@/context/admin-auth-context"
import {
  LayoutDashboard,
  Package,
  Settings,
  LogOut,
  Menu,
  X,
  Truck,
  ChevronDown,
  ChevronRight,
  Loader2,
  Home,
} from "lucide-react"

interface NavItem {
  label: string
  href: string
  icon: React.ElementType
  children?: { label: string; href: string }[]
}

const navItems: NavItem[] = [
  { label: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
  { label: "Products", href: "/admin/products", icon: Package },
  {
    label: "ShipRocket",
    href: "/admin/shiprocket",
    icon: Truck,
    children: [
      { label: "Overview", href: "/admin/shiprocket" },
      { label: "Orders", href: "/admin/shiprocket/orders" },
      { label: "Settings", href: "/admin/shiprocket/settings" },
    ],
  },
  { label: "Settings", href: "/admin/settings", icon: Settings },
]

export default function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const { isAuthenticated, isLoading: authLoading, logout } = useAdminAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [expandedMenus, setExpandedMenus] = useState<string[]>([])

  useEffect(() => {
    if (authLoading) return

    if (!isAuthenticated) {
      router.push("/admin")
      return
    }

    // Auto-expand menu if we're on a child route
    navItems.forEach((item) => {
      if (item.children) {
        const isChildActive = item.children.some((child) => pathname === child.href)
        const isParentActive = pathname === item.href
        if (isChildActive || isParentActive) {
          setExpandedMenus((prev) => (prev.includes(item.label) ? prev : [...prev, item.label]))
        }
      }
    })
  }, [router, isAuthenticated, authLoading, pathname])

  const handleLogout = async () => {
    await logout()
    router.push("/admin")
  }

  const toggleMenu = (label: string) => {
    setExpandedMenus((prev) =>
      prev.includes(label) ? prev.filter((l) => l !== label) : [...prev, label]
    )
  }

  const isActiveRoute = (href: string, children?: { href: string }[]) => {
    if (pathname === href) return true
    if (pathname?.startsWith(href + "/") && href !== "/admin") return true
    if (children) {
      return children.some((child) => pathname === child.href)
    }
    return false
  }

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-red-500" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar - Fixed on all screen sizes */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transform transition-transform lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex flex-col h-screen">
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
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden text-gray-400 hover:text-gray-600"
            >
              <X size={20} />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {navItems.map((item) => {
              const isActive = isActiveRoute(item.href, item.children)
              const isExpanded = expandedMenus.includes(item.label)
              const hasChildren = item.children && item.children.length > 0

              return (
                <div key={item.href}>
                  {hasChildren ? (
                    <>
                      <button
                        onClick={() => toggleMenu(item.label)}
                        className={`flex items-center justify-between w-full px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                          isActive
                            ? "bg-red-50 text-red-600"
                            : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <item.icon size={20} />
                          {item.label}
                        </div>
                        {isExpanded ? (
                          <ChevronDown size={16} />
                        ) : (
                          <ChevronRight size={16} />
                        )}
                      </button>
                      {isExpanded && (
                        <div className="ml-4 mt-1 space-y-1">
                          {item.children!.map((child) => (
                            <Link
                              key={child.href}
                              href={child.href}
                              onClick={() => setSidebarOpen(false)}
                              className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm transition-colors ${
                                pathname === child.href
                                  ? "bg-red-50 text-red-600 font-medium"
                                  : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
                              }`}
                            >
                              <span className="w-1.5 h-1.5 rounded-full bg-current" />
                              {child.label}
                            </Link>
                          ))}
                        </div>
                      )}
                    </>
                  ) : (
                    <Link
                      href={item.href}
                      onClick={() => setSidebarOpen(false)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                        isActive
                          ? "bg-red-50 text-red-600"
                          : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                      }`}
                    >
                      <item.icon size={20} />
                      {item.label}
                    </Link>
                  )}
                </div>
              )
            })}
          </nav>

          {/* Bottom Actions */}
          <div className="p-4 border-t border-gray-200 space-y-1">
            <Link
              href="/"
              className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
            >
              <Home size={20} />
              Back to Store
            </Link>
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-medium text-gray-600 hover:text-red-600 hover:bg-red-50 transition-colors"
            >
              <LogOut size={20} />
              Logout
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content - offset by sidebar width on large screens */}
      <div className="lg:ml-64 flex flex-col min-h-screen">
        {/* Mobile menu button - fixed at top */}
        <div className="lg:hidden fixed top-0 left-0 right-0 h-14 bg-white border-b border-gray-200 flex items-center px-4 z-30">
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-gray-400 hover:text-gray-600"
          >
            <Menu size={24} />
          </button>
          <span className="ml-4 font-semibold text-gray-900">Admin</span>
        </div>

        {/* Main Content with padding for mobile header */}
        <main className="flex-1 pt-14 lg:pt-0">{children}</main>
      </div>
    </div>
  )
}
