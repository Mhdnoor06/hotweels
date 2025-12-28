"use client"

import { ReactNode } from 'react'
import { Toaster } from 'sonner'
import { AuthProvider } from './auth-context'
import { AdminAuthProvider } from './admin-auth-context'
import { CartProvider } from './cart-context'
import { WishlistProvider } from './wishlist-context'

export function Providers({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <AdminAuthProvider>
        <CartProvider>
          <WishlistProvider>
            {children}
            <Toaster
              position="top-right"
              richColors
              closeButton
              duration={4000}
            />
          </WishlistProvider>
        </CartProvider>
      </AdminAuthProvider>
    </AuthProvider>
  )
}
