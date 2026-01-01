"use client"

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'
import { supabase } from '@/lib/supabase/client'
import type { User, Session } from '@supabase/supabase-js'

interface AuthContextType {
  user: User | null
  session: Session | null
  isLoading: boolean
  signUp: (email: string, password: string, name: string) => Promise<{ error: string | null }>
  signIn: (email: string, password: string) => Promise<{ error: string | null }>
  signInWithGoogle: (redirectTo?: string) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
  getAuthHeaders: () => Record<string, string>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      setIsLoading(false)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session)
        setUser(session?.user ?? null)
        setIsLoading(false)

        // Detect new Google OAuth signups
        // SIGNED_IN event fires when user authenticates via OAuth
        if (event === 'SIGNED_IN' && session?.user) {
          const user = session.user
          const provider = user.app_metadata?.provider

          // Only handle Google OAuth (email signups are handled separately)
          if (provider === 'google') {
            // Check if this is a new user (created within last 2 minutes)
            const createdAt = new Date(user.created_at)
            const now = new Date()
            const timeDiff = now.getTime() - createdAt.getTime()
            const isNewUser = timeDiff < 120000 // 2 minutes

            // Prevent duplicate notifications on page refresh
            const notificationKey = `google_signup_notified_${user.id}`
            const alreadyNotified = sessionStorage.getItem(notificationKey)

            if (isNewUser && !alreadyNotified) {
              // Mark as notified immediately to prevent duplicates
              sessionStorage.setItem(notificationKey, 'true')

              // Send Discord notification for new Google signup
              fetch('/api/auth/signup-notification', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  email: user.email || '',
                  name: user.user_metadata?.full_name || user.user_metadata?.name,
                  provider: 'Google',
                }),
              }).catch(() => {}) // Silently fail
            }
          }
        }
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const signUp = async (email: string, password: string, name: string) => {
    // Use current origin for email redirect to work in both dev and production
    const emailRedirectTo = typeof window !== 'undefined'
      ? `${window.location.origin}/login`
      : undefined

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: name,
        },
        emailRedirectTo,
      },
    })

    if (error) {
      return { error: error.message }
    }

    // Check if user already exists (Supabase returns empty identities array for existing users)
    if (data?.user?.identities?.length === 0) {
      return { error: "An account with this email already exists. Please login or reset your password." }
    }

    // Send signup notification to Discord (non-blocking)
    fetch('/api/auth/signup-notification', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, name, provider: 'Email/Password' }),
    }).catch(() => {}) // Silently fail

    return { error: null }
  }

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      return { error: error.message }
    }

    return { error: null }
  }

  const signInWithGoogle = async (redirectTo?: string) => {
    const redirectPath = redirectTo || '/collection'
    const callbackUrl = typeof window !== 'undefined'
      ? `${window.location.origin}/auth/callback?redirect=${encodeURIComponent(redirectPath)}`
      : undefined

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: callbackUrl,
      },
    })

    if (error) {
      return { error: error.message }
    }

    return { error: null }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  const getAuthHeaders = useCallback((): Record<string, string> => {
    if (session?.access_token) {
      return {
        'Authorization': `Bearer ${session.access_token}`,
      }
    }
    return {}
  }, [session?.access_token])

  return (
    <AuthContext.Provider value={{
      user,
      session,
      isLoading,
      signUp,
      signIn,
      signInWithGoogle,
      signOut,
      getAuthHeaders,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
