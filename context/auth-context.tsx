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

    const { error } = await supabase.auth.signUp({
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
