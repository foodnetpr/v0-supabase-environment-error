"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import PhoneOrderForm from "@/components/phone-order-form"
import { Phone, Search, Building2, MapPin, ChevronRight, LogOut, X, ShoppingCart, Minus, Plus, Trash2 } from "lucide-react"
import Link from "next/link"

interface Restaurant {
  id: string
  name: string
  slug: string
  logo_url: string | null
  cuisine_type: string | null
  cuisine_types: string[] | null
  area: string | null
  tax_rate: number | null
}

interface CartItem {
  id: string
  name: string
  price: number
  quantity: number
  description?: string
}

interface CSRPortalClientProps {
  restaurants: Restaurant[]
}

export function CSRPortalClient({ restaurants }: CSRPortalClientProps) {
  const supabase = createClient()
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null)
  const [menuItems, setMenuItems] = useState<any[]>([])
  const [branches, setBranches] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  
  // Cart state - lifted to allow adding items before customer info
  const [cart, setCart] = useState<CartItem[]>([])
  const [isCartOpen, setIsCartOpen] = useState(false)
  const [menuSearchTerm, setMenuSearchTerm] = useState("")

  // Filter restaurants by search
  const filteredRestaurants = restaurants.filter((r) =>
    r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.cuisine_type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.area?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Load menu items and branches when restaurant is selected
  const selectRestaurant = async (restaurant: Restaurant) => {
    setLoading(true)
    setSelectedRestaurant(restaurant)
    setCart([]) // Clear cart when switching restaurants

    try {
      // Fetch menu items
      const { data: items } = await supabase
        .from("menu_items")
        .select("*")
        .eq("restaurant_id", restaurant.id)
        .eq("is_active", true)
        .order("display_order", { ascending: true })

      // Fetch branches
      const { data: branchData } = await supabase
        .from("branches")
        .select("*")
        .eq("restaurant_id", restaurant.id)
        .eq("is_active", true)
        .order("display_order", { ascending: true })

      setMenuItems(items || [])
      setBranches(branchData || [])
    } catch (error) {
      console.error("Error loading restaurant data:", error)
    } finally {
      setLoading(false)
    }
  }

  const clearSelection = () => {
    setSelectedRestaurant(null)
    setMenuItems([])
    setBranches([])
    setCart([])
    setIsCartOpen(false)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.href = "/login"
  }

  // Cart operations
  const addToCart = (item: any) => {
    const existing = cart.find((c) => c.id === item.id)
    if (existing) {
      setCart(cart.map((c) => (c.id === item.id ? { ...c, quantity: c.quantity + 1 } : c)))
    } else {
      setCart([...cart, { id: item.id, name: item.name, price: Number(item.price) || 0, quantity: 1, description: item.description }])
    }
  }

  const updateQuantity = (id: string, delta: number) => {
    setCart(
      cart
        .map((c) => (c.id === id ? { ...c, quantity: c.quantity + delta } : c))
        .filter((c) => c.quantity > 0)
    )
  }

  const removeFromCart = (id: string) => {
    setCart(cart.filter((c) => c.id !== id))
  }

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0)

  // Filter menu items
  const filteredMenuItems = menuItems.filter((item) =>
    item.name.toLowerCase().includes(menuSearchTerm.toLowerCase()) ||
    item.description?.toLowerCase().includes(menuSearchTerm.toLowerCase()) ||
    item.category?.toLowerCase().includes(menuSearchTerm.toLowerCase())
  )

  // Group menu items by category
  const groupedItems = filteredMenuItems.reduce((acc, item) => {
    const cat = item.category || "Otros"
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(item)
    return acc
  }, {} as Record<string, any[]>)

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-rose-500 to-pink-600 flex items-center justify-center">
              <Phone className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-slate-900">CSR Portal</h1>
            </div>
          </div>

          {selectedRestaurant && (
            <div className="flex items-center gap-2 bg-slate-100 rounded-lg px-3 py-1.5">
              <span className="font-medium text-slate-900 text-sm">{selectedRestaurant.name}</span>
              <button
                onClick={clearSelection}
                className="p-0.5 hover:bg-slate-200 rounded-full"
              >
                <X className="w-3.5 h-3.5 text-slate-500" />
              </button>
            </div>
          )}

          <div className="flex items-center gap-2">
            {selectedRestaurant && (
              <button
                onClick={() => setIsCartOpen(true)}
                className="relative p-2 hover:bg-slate-100 rounded-lg"
              >
                <ShoppingCart className="w-5 h-5 text-slate-700" />
                {totalItems > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                    {totalItems}
                  </span>
                )}
              </button>
            )}
            <Link
              href="/super-admin"
              className="text-xs text-slate-600 hover:text-slate-900 hidden sm:block"
            >
              Admin
            </Link>
            <Button variant="outline" size="sm" onClick={handleLogout} className="h-8 text-xs">
              <LogOut className="w-3.5 h-3.5 mr-1" />
              Salir
            </Button>
          </div>
        </div>
      </header>

      <main className="flex h-[calc(100vh-56px)]">
        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto p-4">
          {!selectedRestaurant ? (
            // Restaurant Selector - Compact Grid
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-slate-900">Seleccionar Restaurante</h2>
                <span className="text-sm text-slate-500">{restaurants.length} restaurantes</span>
              </div>

              {/* Search */}
              <div className="relative max-w-sm">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar..."
                  className="pl-8 h-9 text-sm"
                />
              </div>

              {/* Compact Restaurant Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2">
                {filteredRestaurants.map((restaurant) => (
                  <button
                    key={restaurant.id}
                    className="text-left p-2.5 rounded-lg border border-slate-200 bg-white hover:border-rose-300 hover:bg-rose-50 transition-all group"
                    onClick={() => selectRestaurant(restaurant)}
                  >
                    <h3 className="font-medium text-slate-900 text-sm truncate group-hover:text-rose-600">
                      {restaurant.name}
                    </h3>
                    {(restaurant.cuisine_types?.length || restaurant.cuisine_type) && (
                      <p className="text-xs text-slate-500 truncate mt-0.5">
                        {restaurant.cuisine_types?.slice(0, 2).join(", ") || restaurant.cuisine_type}
                      </p>
                    )}
                    {restaurant.area && (
                      <p className="text-xs text-slate-400 truncate mt-0.5">
                        {restaurant.area}
                      </p>
                    )}
                  </button>
                ))}
              </div>

              {filteredRestaurants.length === 0 && (
                <div className="text-center py-8">
                  <Building2 className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-slate-500 text-sm">No se encontraron restaurantes</p>
                </div>
              )}
            </div>
          ) : loading ? (
            // Loading state
            <div className="flex items-center justify-center py-20">
              <div className="text-center space-y-2">
                <div className="w-8 h-8 border-3 border-rose-200 border-t-rose-500 rounded-full animate-spin mx-auto" />
                <p className="text-slate-600 text-sm">Cargando menu...</p>
              </div>
            </div>
          ) : (
            // Menu + Phone Order Form side by side
            <div className="flex gap-4 h-full">
              {/* Menu Items - Left Side */}
              <div className="w-1/2 flex flex-col min-h-0">
                <div className="flex items-center gap-2 mb-3">
                  <h3 className="font-semibold text-slate-900">Menu</h3>
                  <div className="relative flex-1 max-w-xs">
                    <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                    <Input
                      value={menuSearchTerm}
                      onChange={(e) => setMenuSearchTerm(e.target.value)}
                      placeholder="Buscar item..."
                      className="pl-7 h-8 text-sm"
                    />
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto space-y-4 pr-2">
                  {Object.entries(groupedItems).map(([category, items]) => (
                    <div key={category}>
                      <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2 sticky top-0 bg-slate-50 py-1">
                        {category}
                      </h4>
                      <div className="space-y-1">
                        {items.map((item) => {
                          const inCart = cart.find((c) => c.id === item.id)
                          return (
                            <div
                              key={item.id}
                              className="flex items-center justify-between p-2 rounded-lg bg-white border border-slate-100 hover:border-slate-200"
                            >
                              <div className="flex-1 min-w-0 mr-2">
                                <p className="font-medium text-slate-900 text-sm truncate">{item.name}</p>
                                <p className="text-xs text-slate-500">${Number(item.price).toFixed(2)}</p>
                              </div>
                              {inCart ? (
                                <div className="flex items-center gap-1">
                                  <button
                                    onClick={() => updateQuantity(item.id, -1)}
                                    className="w-6 h-6 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center"
                                  >
                                    <Minus className="w-3 h-3" />
                                  </button>
                                  <span className="w-6 text-center text-sm font-medium">{inCart.quantity}</span>
                                  <button
                                    onClick={() => addToCart(item)}
                                    className="w-6 h-6 rounded-full bg-rose-500 hover:bg-rose-600 text-white flex items-center justify-center"
                                  >
                                    <Plus className="w-3 h-3" />
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => addToCart(item)}
                                  className="w-6 h-6 rounded-full bg-rose-500 hover:bg-rose-600 text-white flex items-center justify-center"
                                >
                                  <Plus className="w-3 h-3" />
                                </button>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Phone Order Form - Right Side */}
              <div className="w-1/2 overflow-y-auto">
                <PhoneOrderForm
                  restaurantId={selectedRestaurant.id}
                  menuItems={menuItems}
                  branches={branches}
                  taxRate={selectedRestaurant.tax_rate || 11.5}
                  onClose={clearSelection}
                  externalCart={cart}
                  setExternalCart={setCart}
                />
              </div>
            </div>
          )}
        </div>

        {/* Sliding Cart Panel */}
        {selectedRestaurant && (
          <>
            {/* Backdrop */}
            {isCartOpen && (
              <div
                className="fixed inset-0 bg-black/30 z-40"
                onClick={() => setIsCartOpen(false)}
              />
            )}
            
            {/* Cart Panel */}
            <div
              className={`fixed top-14 right-0 h-[calc(100vh-56px)] w-80 bg-white border-l border-slate-200 shadow-xl z-50 transform transition-transform duration-300 ${
                isCartOpen ? "translate-x-0" : "translate-x-full"
              }`}
            >
              <div className="flex flex-col h-full">
                {/* Cart Header */}
                <div className="flex items-center justify-between p-4 border-b border-slate-200">
                  <div className="flex items-center gap-2">
                    <ShoppingCart className="w-5 h-5 text-rose-500" />
                    <h3 className="font-semibold text-slate-900">Carrito</h3>
                    <span className="text-sm text-slate-500">({totalItems})</span>
                  </div>
                  <button
                    onClick={() => setIsCartOpen(false)}
                    className="p-1.5 hover:bg-slate-100 rounded-full"
                  >
                    <X className="w-4 h-4 text-slate-500" />
                  </button>
                </div>

                {/* Cart Items */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {cart.length === 0 ? (
                    <div className="text-center py-8">
                      <ShoppingCart className="w-10 h-10 text-slate-200 mx-auto mb-2" />
                      <p className="text-slate-500 text-sm">Carrito vacio</p>
                    </div>
                  ) : (
                    cart.map((item) => (
                      <div key={item.id} className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-slate-900 text-sm">{item.name}</p>
                          <p className="text-xs text-slate-500">${item.price.toFixed(2)} c/u</p>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => updateQuantity(item.id, -1)}
                            className="w-6 h-6 rounded-full bg-white border border-slate-200 hover:bg-slate-100 flex items-center justify-center"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="w-6 text-center text-sm font-medium">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.id, 1)}
                            className="w-6 h-6 rounded-full bg-white border border-slate-200 hover:bg-slate-100 flex items-center justify-center"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => removeFromCart(item.id)}
                            className="w-6 h-6 rounded-full hover:bg-red-100 flex items-center justify-center ml-1"
                          >
                            <Trash2 className="w-3 h-3 text-red-500" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Cart Footer */}
                {cart.length > 0 && (
                  <div className="p-4 border-t border-slate-200 bg-slate-50">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-slate-600">Subtotal</span>
                      <span className="font-semibold text-slate-900">${subtotal.toFixed(2)}</span>
                    </div>
                    <Button
                      className="w-full bg-rose-500 hover:bg-rose-600"
                      onClick={() => setIsCartOpen(false)}
                    >
                      Continuar con Orden
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  )
}
