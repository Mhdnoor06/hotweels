"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

interface AdminUser {
  id: string
  email?: string
}

interface AdminAuthContextType {
  user: AdminUser | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<{ error: string | null }>
  logout: () => Promise<void>
  checkAuth: () => Promise<boolean>
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined)

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AdminUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Check auth status from server (reads from httpOnly cookies)
  const checkAuth = async (): Promise<boolean> => {
    try {
      const response = await fetch('/api/admin/auth/check', {
        method: 'POST',
        credentials: 'include', // Important: include cookies
      })

      const data = await response.json()

      if (response.ok && data.authenticated && data.user) {
        setUser(data.user)
        return true
      } else {
        setUser(null)
        return false
      }
    } catch (error) {
      console.error('Auth check error:', error)
      setUser(null)
      return false
    }
  }

  // Check auth status on mount
  useEffect(() => {
    checkAuth().finally(() => {
      setIsLoading(false)
    })
  }, [])

  const login = async (email: string, password: string): Promise<{ error: string | null }> => {
    try {
      const response = await fetch('/api/admin/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Important: include cookies
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        return { error: data.error || 'Login failed' }
      }

      if (data.success && data.user) {
        // Tokens are now in httpOnly cookies, we only store user info
        setUser(data.user)
        return { error: null }
      }

      return { error: 'Invalid response from server' }
    } catch (error) {
      return { error: error instanceof Error ? error.message : 'Network error' }
    }
  }

  const logout = async (): Promise<void> => {
    try {
      await fetch('/api/admin/auth/logout', {
        method: 'POST',
        credentials: 'include', // Important: include cookies
      })
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      setUser(null)
    }
  }

  return (
    <AdminAuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        logout,
        checkAuth,
      }}
    >
      {children}
    </AdminAuthContext.Provider>
  )
}

export function useAdminAuth() {
  const context = useContext(AdminAuthContext)
  if (context === undefined) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider')
  }
  return context
}

