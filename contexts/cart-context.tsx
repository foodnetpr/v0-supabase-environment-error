"use client"

import React, { createContext, useContext, useState, useEffect, useCallback } from "react"

export interface CartItem {
  id: string
  name: string
  price: number
  quantity: number
  modifiers?: Array<{
    id: string
    name: string
    price: number
  }>
  specialInstructions?: string
  restaurantId: string
  restaurantName: string
  restaurantSlug: string
}

interface CartContextType {
  items: CartItem[]
  restaurantId: string | null
  restaurantName: string | null
  restaurantSlug: string | null
  addItem: (item: CartItem) => void
  removeItem: (itemId: string) => void
  updateQuantity: (itemId: string, quantity: number) => void
  clearCart: () => void
  getItemCount: () => number
  getSubtotal: () => number
}

const CartContext = createContext<CartContextType | undefined>(undefined)

const CART_STORAGE_KEY = "foodnetpr_cart"

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])
  const [restaurantId, setRestaurantId] = useState<string | null>(null)
  const [restaurantName, setRestaurantName] = useState<string | null>(null)
  const [restaurantSlug, setRestaurantSlug] = useState<string | null>(null)
  const [isHydrated, setIsHydrated] = useState(false)

  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem(CART_STORAGE_KEY)
        if (saved) {
          const parsed = JSON.parse(saved)
          setItems(parsed.items || [])
          setRestaurantId(parsed.restaurantId || null)
          setRestaurantName(parsed.restaurantName || null)
          setRestaurantSlug(parsed.restaurantSlug || null)
        }
      } catch (e) {
        console.error("Failed to load cart from localStorage:", e)
      }
      setIsHydrated(true)
    }
  }, [])

  useEffect(() => {
    if (isHydrated && typeof window !== "undefined") {
      try {
        localStorage.setItem(
          CART_STORAGE_KEY,
          JSON.stringify({ items, restaurantId, restaurantName, restaurantSlug })
        )
      } catch (e) {
        console.error("Failed to save cart to localStorage:", e)
      }
    }
  }, [items, restaurantId, restaurantName, restaurantSlug, isHydrated])

  const addItem = useCallback((item: CartItem) => {
    setItems((prev) => {
      if (restaurantId && restaurantId !== item.restaurantId) {
        return [item]
      }
      const existingIndex = prev.findIndex(
        (i) =>
          i.id === item.id &&
          JSON.stringify(i.modifiers) === JSON.stringify(item.modifiers)
      )
      if (existingIndex >= 0) {
        const updated = [...prev]
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: updated[existingIndex].quantity + item.quantity,
        }
        return updated
      }
      return [...prev, item]
    })
    setRestaurantId(item.restaurantId)
    setRestaurantName(item.restaurantName)
    setRestaurantSlug(item.restaurantSlug)
  }, [restaurantId])

  const removeItem = useCallback((itemId: string) => {
    setItems((prev) => {
      const updated = prev.filter((i) => i.id !== itemId)
      if (updated.length === 0) {
        setRestaurantId(null)
        setRestaurantName(null)
        setRestaurantSlug(null)
      }
      return updated
    })
  }, [])

  const updateQuantity = useCallback((itemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(itemId)
      return
    }
    setItems((prev) =>
      prev.map((i) => (i.id === itemId ? { ...i, quantity } : i))
    )
  }, [removeItem])

  const clearCart = useCallback(() => {
    setItems([])
    setRestaurantId(null)
    setRestaurantName(null)
    setRestaurantSlug(null)
  }, [])

  const getItemCount = useCallback(() => {
    return items.reduce((sum, item) => sum + item.quantity, 0)
  }, [items])

  const getSubtotal = useCallback(() => {
    return items.reduce((sum, item) => {
      const modifiersTotal = (item.modifiers || []).reduce(
        (m, mod) => m + mod.price,
        0
      )
      return sum + (item.price + modifiersTotal) * item.quantity
    }, 0)
  }, [items])

  return (
    <CartContext.Provider
      value={{
        items,
        restaurantId,
        restaurantName,
        restaurantSlug,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        getItemCount,
        getSubtotal,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider")
  }
  return context
}
