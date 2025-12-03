"use client"

import { ReactNode } from 'react'
import { AuthProvider } from './auth-context'
import { CartProvider } from './cart-context'
import { WishlistProvider } from './wishlist-context'

export function Providers({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <CartProvider>
        <WishlistProvider>
          {children}
        </WishlistProvider>
      </CartProvider>
    </AuthProvider>
  )
}
