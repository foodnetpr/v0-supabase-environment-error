"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import PhoneOrderForm from "@/components/phone-order-form"
import { Phone, Search, Building2, MapPin, ChevronRight, LogOut, X } from "lucide-react"
import Image from "next/image"
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
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.href = "/login"
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500 to-pink-600 flex items-center justify-center">
                <Phone className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-slate-900">CSR Portal</h1>
                <p className="text-xs text-slate-500">Ordenes por Telefono</p>
              </div>
            </div>

            {selectedRestaurant && (
              <div className="flex items-center gap-3 bg-slate-100 rounded-lg px-4 py-2">
                {selectedRestaurant.logo_url && (
                  <Image
                    src={selectedRestaurant.logo_url}
                    alt={selectedRestaurant.name}
                    width={32}
                    height={32}
                    className="rounded-md"
                  />
                )}
                <span className="font-medium text-slate-900">{selectedRestaurant.name}</span>
                <button
                  onClick={clearSelection}
                  className="ml-2 p-1 hover:bg-slate-200 rounded-full"
                >
                  <X className="w-4 h-4 text-slate-500" />
                </button>
              </div>
            )}

            <div className="flex items-center gap-3">
              <Link
                href="/super-admin"
                className="text-sm text-slate-600 hover:text-slate-900"
              >
                Admin Panel
              </Link>
              <Button variant="outline" size="sm" onClick={handleLogout}>
                <LogOut className="w-4 h-4 mr-2" />
                Salir
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!selectedRestaurant ? (
          // Restaurant Selector
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold text-slate-900">Seleccionar Restaurante</h2>
              <p className="text-slate-600">Escoge el restaurante para tomar la orden por telefono</p>
            </div>

            {/* Search */}
            <div className="max-w-md mx-auto">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <Input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar por nombre, cocina o area..."
                  className="pl-10 h-12 text-base"
                />
              </div>
            </div>

            {/* Restaurant Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredRestaurants.map((restaurant) => (
                <Card
                  key={restaurant.id}
                  className="cursor-pointer hover:shadow-lg hover:border-rose-200 transition-all group"
                  onClick={() => selectRestaurant(restaurant)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      {restaurant.logo_url ? (
                        <Image
                          src={restaurant.logo_url}
                          alt={restaurant.name}
                          width={48}
                          height={48}
                          className="rounded-lg object-cover flex-shrink-0"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
                          <Building2 className="w-6 h-6 text-slate-400" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-slate-900 truncate group-hover:text-rose-600 transition-colors">
                          {restaurant.name}
                        </h3>
                        {restaurant.cuisine_types?.length ? (
                          <p className="text-sm text-slate-500 truncate">
                            {restaurant.cuisine_types.slice(0, 2).join(", ")}
                          </p>
                        ) : restaurant.cuisine_type ? (
                          <p className="text-sm text-slate-500">{restaurant.cuisine_type}</p>
                        ) : null}
                        {restaurant.area && (
                          <p className="text-xs text-slate-400 flex items-center gap-1 mt-1">
                            <MapPin className="w-3 h-3" />
                            {restaurant.area}
                          </p>
                        )}
                      </div>
                      <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-rose-400 transition-colors flex-shrink-0" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {filteredRestaurants.length === 0 && (
              <div className="text-center py-12">
                <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500">No se encontraron restaurantes</p>
              </div>
            )}
          </div>
        ) : loading ? (
          // Loading state
          <div className="flex items-center justify-center py-20">
            <div className="text-center space-y-3">
              <div className="w-12 h-12 border-4 border-rose-200 border-t-rose-500 rounded-full animate-spin mx-auto" />
              <p className="text-slate-600">Cargando menu...</p>
            </div>
          </div>
        ) : (
          // Phone Order Form
          <div className="max-w-4xl mx-auto">
            <PhoneOrderForm
              restaurantId={selectedRestaurant.id}
              menuItems={menuItems}
              branches={branches}
              taxRate={selectedRestaurant.tax_rate || 11.5}
              onClose={clearSelection}
            />
          </div>
        )}
      </main>
    </div>
  )
}
