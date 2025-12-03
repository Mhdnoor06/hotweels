"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import type { Product } from '@/lib/supabase/database.types'

export interface CartItem {
  id: string
  name: string
  series: string
  price: number
  image: string
  quantity: number
  color: string
  rarity: string
  year: number
}

interface CartContextType {
  items: CartItem[]
  addItem: (product: Product, quantity?: number) => void
  removeItem: (id: string) => void
  toggleItem: (product: Product) => void
  updateQuantity: (id: string, quantity: number) => void
  clearCart: () => void
  getItemCount: () => number
  getSubtotal: () => number
  isInCart: (id: string) => boolean
}

const CartContext = createContext<CartContextType | undefined>(undefined)

const CART_STORAGE_KEY = 'hw_cart'

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])
  const [isHydrated, setIsHydrated] = useState(false)

  // Load cart from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(CART_STORAGE_KEY)
    if (stored) {
      try {
        setItems(JSON.parse(stored))
      } catch (e) {
        console.error('Failed to parse cart from localStorage:', e)
      }
    }
    setIsHydrated(true)
  }, [])

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    if (isHydrated) {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items))
    }
  }, [items, isHydrated])

  const addItem = (product: Product, quantity: number = 1) => {
    setItems(prev => {
      const existingItem = prev.find(item => item.id === product.id)

      if (existingItem) {
        return prev.map(item =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        )
      }

      return [...prev, {
        id: product.id,
        name: product.name,
        series: product.series,
        price: product.price,
        image: product.image,
        quantity,
        color: product.color,
        rarity: product.rarity,
        year: product.year,
      }]
    })
  }

  const removeItem = (id: string) => {
    setItems(prev => prev.filter(item => item.id !== id))
  }

  const toggleItem = (product: Product) => {
    if (isInCart(product.id)) {
      removeItem(product.id)
    } else {
      addItem(product)
    }
  }

  const updateQuantity = (id: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(id)
      return
    }
    setItems(prev =>
      prev.map(item =>
        item.id === id ? { ...item, quantity } : item
      )
    )
  }

  const clearCart = () => {
    setItems([])
  }

  const getItemCount = () => {
    return items.reduce((total, item) => total + item.quantity, 0)
  }

  const getSubtotal = () => {
    return items.reduce((total, item) => total + item.price * item.quantity, 0)
  }

  const isInCart = (id: string) => {
    return items.some(item => item.id === id)
  }

  return (
    <CartContext.Provider value={{
      items,
      addItem,
      removeItem,
      toggleItem,
      updateQuantity,
      clearCart,
      getItemCount,
      getSubtotal,
      isInCart,
    }}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider')
  }
  return context
}
