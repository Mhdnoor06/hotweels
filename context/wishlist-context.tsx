"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import type { Product } from '@/lib/supabase/database.types'

export interface WishlistItem {
  id: string
  name: string
  series: string
  price: number
  image: string
  color: string
  year: number
  rating: number
  stock: number
}

interface WishlistContextType {
  items: WishlistItem[]
  addItem: (product: Product) => void
  removeItem: (id: string) => void
  toggleItem: (product: Product) => void
  clearWishlist: () => void
  getItemCount: () => number
  isInWishlist: (id: string) => boolean
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined)

const WISHLIST_STORAGE_KEY = 'hw_wishlist'

export function WishlistProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<WishlistItem[]>([])
  const [isHydrated, setIsHydrated] = useState(false)

  // Load wishlist from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(WISHLIST_STORAGE_KEY)
    if (stored) {
      try {
        setItems(JSON.parse(stored))
      } catch (e) {
        console.error('Failed to parse wishlist from localStorage:', e)
      }
    }
    setIsHydrated(true)
  }, [])

  // Save wishlist to localStorage whenever it changes
  useEffect(() => {
    if (isHydrated) {
      localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(items))
    }
  }, [items, isHydrated])

  const addItem = (product: Product) => {
    setItems(prev => {
      if (prev.some(item => item.id === product.id)) {
        return prev
      }

      return [...prev, {
        id: product.id,
        name: product.name,
        series: product.series,
        price: product.price,
        image: product.image,
        color: product.color,
        year: product.year,
        rating: product.rating,
        stock: product.stock,
      }]
    })
  }

  const removeItem = (id: string) => {
    setItems(prev => prev.filter(item => item.id !== id))
  }

  const toggleItem = (product: Product) => {
    if (isInWishlist(product.id)) {
      removeItem(product.id)
    } else {
      addItem(product)
    }
  }

  const clearWishlist = () => {
    setItems([])
  }

  const getItemCount = () => {
    return items.length
  }

  const isInWishlist = (id: string) => {
    return items.some(item => item.id === id)
  }

  return (
    <WishlistContext.Provider value={{
      items,
      addItem,
      removeItem,
      toggleItem,
      clearWishlist,
      getItemCount,
      isInWishlist,
    }}>
      {children}
    </WishlistContext.Provider>
  )
}

export function useWishlist() {
  const context = useContext(WishlistContext)
  if (context === undefined) {
    throw new Error('useWishlist must be used within a WishlistProvider')
  }
  return context
}
