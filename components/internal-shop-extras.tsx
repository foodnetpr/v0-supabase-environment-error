"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { Plus, Minus, Package } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface InternalShopItem {
  id: string
  name: string
  description: string | null
  price: number
  image_url: string | null
  category: string | null
  is_active: boolean
}

interface InternalShopExtrasProps {
  onAddToCart: (item: InternalShopItem, quantity: number) => void
  existingItems?: { id: string; quantity: number }[]
}

export function InternalShopExtras({ onAddToCart, existingItems = [] }: InternalShopExtrasProps) {
  const [items, setItems] = useState<InternalShopItem[]>([])
  const [loading, setLoading] = useState(true)
  const [quantities, setQuantities] = useState<Record<string, number>>({})

  useEffect(() => {
    fetchItems()
  }, [])

  useEffect(() => {
    // Initialize quantities from existing cart items
    const initialQuantities: Record<string, number> = {}
    existingItems.forEach((item) => {
      initialQuantities[item.id] = item.quantity
    })
    setQuantities(initialQuantities)
  }, [existingItems])

  const fetchItems = async () => {
    try {
      const response = await fetch("/api/internal-shop/items?active=true")
      if (response.ok) {
        const data = await response.json()
        setItems(data.items || [])
      }
    } catch (error) {
      console.error("Failed to fetch internal shop items:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleQuantityChange = (item: InternalShopItem, delta: number) => {
    const currentQty = quantities[item.id] || 0
    const newQty = Math.max(0, currentQty + delta)
    
    setQuantities((prev) => ({
      ...prev,
      [item.id]: newQty,
    }))

    onAddToCart(item, newQty)
  }

  // Group items by category
  const groupedItems = items.reduce((acc, item) => {
    const category = item.category || "Extras"
    if (!acc[category]) {
      acc[category] = []
    }
    acc[category].push(item)
    return acc
  }, {} as Record<string, InternalShopItem[]>)

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  if (items.length === 0) {
    return null
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Package className="h-5 w-5 text-primary" />
        <h3 className="font-semibold">Agrega Extras a tu Pedido</h3>
      </div>
      
      {Object.entries(groupedItems).map(([category, categoryItems]) => (
        <div key={category} className="space-y-2">
          <Badge variant="secondary" className="text-xs">
            {category}
          </Badge>
          <div className="grid gap-2">
            {categoryItems.map((item) => {
              const quantity = quantities[item.id] || 0
              return (
                <Card key={item.id} className="overflow-hidden">
                  <CardContent className="p-3">
                    <div className="flex items-center gap-3">
                      {item.image_url ? (
                        <Image
                          src={item.image_url}
                          alt={item.name}
                          width={48}
                          height={48}
                          className="rounded-md object-cover"
                        />
                      ) : (
                        <div className="flex h-12 w-12 items-center justify-center rounded-md bg-muted">
                          <Package className="h-5 w-5 text-muted-foreground" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{item.name}</p>
                        {item.description && (
                          <p className="text-xs text-muted-foreground truncate">
                            {item.description}
                          </p>
                        )}
                        <p className="text-sm font-semibold text-primary">
                          ${Number(item.price).toFixed(2)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {quantity > 0 ? (
                          <>
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => handleQuantityChange(item, -1)}
                            >
                              <Minus className="h-4 w-4" />
                            </Button>
                            <span className="w-6 text-center font-medium">
                              {quantity}
                            </span>
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => handleQuantityChange(item, 1)}
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          </>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleQuantityChange(item, 1)}
                          >
                            <Plus className="mr-1 h-4 w-4" />
                            Agregar
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
