"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { 
  ArrowLeft, Search, Package, Tag, DollarSign, 
  ShoppingCart, Plus, Minus, Check
} from "lucide-react"
import Link from "next/link"
import Image from "next/image"

type InternalShopItem = {
  id: string
  name: string
  description: string | null
  price: number
  category: string
  image_url: string | null
  in_stock: boolean
  sku: string | null
}

export default function CSRTiendaPage() {
  const [items, setItems] = useState<InternalShopItem[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [cart, setCart] = useState<Record<string, number>>({})
  const [addedItems, setAddedItems] = useState<Set<string>>(new Set())
  
  const supabase = createClient()

  useEffect(() => {
    fetchItems()
  }, [])

  const fetchItems = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from("internal_shop_items")
      .select("*")
      .eq("in_stock", true)
      .order("category", { ascending: true })
      .order("name", { ascending: true })
    
    if (!error && data) {
      setItems(data)
    }
    setLoading(false)
  }

  const categories = ["all", ...Array.from(new Set(items.map(item => item.category)))]

  const filteredItems = items.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (item.description?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false)
    const matchesCategory = selectedCategory === "all" || item.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const updateQuantity = (itemId: string, delta: number) => {
    setCart(prev => {
      const current = prev[itemId] || 0
      const newQty = Math.max(0, current + delta)
      if (newQty === 0) {
        const { [itemId]: _, ...rest } = prev
        return rest
      }
      return { ...prev, [itemId]: newQty }
    })
  }

  const addToOrder = (itemId: string) => {
    // This would integrate with the order system
    setAddedItems(prev => new Set([...prev, itemId]))
    setTimeout(() => {
      setAddedItems(prev => {
        const next = new Set(prev)
        next.delete(itemId)
        return next
      })
    }, 2000)
  }

  const totalItems = Object.values(cart).reduce((sum, qty) => sum + qty, 0)
  const totalPrice = Object.entries(cart).reduce((sum, [id, qty]) => {
    const item = items.find(i => i.id === id)
    return sum + (item?.price || 0) * qty
  }, 0)

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-slate-800 text-white px-4 py-3 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/csr">
              <Button variant="ghost" size="sm" className="text-white hover:bg-slate-700">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Volver al Dispatch
              </Button>
            </Link>
            <div className="flex items-center gap-2">
              <Package className="h-5 w-5 text-teal-400" />
              <h1 className="text-lg font-semibold">Tienda Interna</h1>
              <Badge variant="secondary" className="bg-slate-700">
                Solo Vista
              </Badge>
            </div>
          </div>
          
          {totalItems > 0 && (
            <div className="flex items-center gap-3 bg-teal-600 px-4 py-2 rounded-lg">
              <ShoppingCart className="h-4 w-4" />
              <span className="text-sm font-medium">{totalItems} items</span>
              <span className="text-sm">${totalPrice.toFixed(2)}</span>
            </div>
          )}
        </div>
      </header>

      {/* Filters */}
      <div className="bg-white border-b px-4 py-3 sticky top-[52px] z-40">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center gap-4">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Buscar productos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          
          {/* Category Filter */}
          <div className="flex gap-2 flex-wrap">
            {categories.map(cat => (
              <Button
                key={cat}
                variant={selectedCategory === cat ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(cat)}
                className={selectedCategory === cat ? "bg-teal-600 hover:bg-teal-700" : ""}
              >
                {cat === "all" ? "Todos" : cat}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Items Grid */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600" />
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="text-center py-12">
            <Package className="h-12 w-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500">No se encontraron productos</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredItems.map(item => (
              <Card key={item.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                {/* Image */}
                <div className="aspect-square bg-slate-100 relative">
                  {item.image_url ? (
                    <Image
                      src={item.image_url}
                      alt={item.name}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package className="h-16 w-16 text-slate-300" />
                    </div>
                  )}
                  <Badge className="absolute top-2 left-2 bg-slate-800">
                    {item.category}
                  </Badge>
                </div>
                
                {/* Details */}
                <div className="p-4">
                  <h3 className="font-semibold text-slate-900 mb-1">{item.name}</h3>
                  {item.description && (
                    <p className="text-sm text-slate-500 line-clamp-2 mb-2">{item.description}</p>
                  )}
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-lg font-bold text-teal-600">
                      ${item.price.toFixed(2)}
                    </span>
                    {item.sku && (
                      <span className="text-xs text-slate-400">SKU: {item.sku}</span>
                    )}
                  </div>
                  
                  {/* Quantity Controls */}
                  <div className="flex items-center gap-2">
                    <div className="flex items-center border rounded-lg overflow-hidden">
                      <button
                        onClick={() => updateQuantity(item.id, -1)}
                        className="p-2 hover:bg-slate-100 transition-colors"
                        disabled={!cart[item.id]}
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                      <span className="px-4 py-2 min-w-[3rem] text-center font-medium">
                        {cart[item.id] || 0}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.id, 1)}
                        className="p-2 hover:bg-slate-100 transition-colors"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                    
                    <Button
                      size="sm"
                      className={`flex-1 ${addedItems.has(item.id) ? 'bg-green-600' : 'bg-teal-600 hover:bg-teal-700'}`}
                      onClick={() => addToOrder(item.id)}
                      disabled={!cart[item.id] || addedItems.has(item.id)}
                    >
                      {addedItems.has(item.id) ? (
                        <><Check className="h-4 w-4 mr-1" /> Agregado</>
                      ) : (
                        <><ShoppingCart className="h-4 w-4 mr-1" /> Agregar</>
                      )}
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
