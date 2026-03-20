"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  MonitorPlay, 
  ExternalLink, 
  Search, 
  Copy, 
  Check, 
  RefreshCw,
  Key,
  Building2,
  Eye,
  Settings
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import Link from "next/link"

interface Restaurant {
  id: string
  name: string
  slug: string
  logo_url: string | null
  kds_access_token: string | null
  is_active: boolean
}

interface Branch {
  id: string
  name: string
  restaurant_id: string
  kds_access_token: string | null
}

export function KDSTab() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([])
  const [branches, setBranches] = useState<Branch[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [copiedToken, setCopiedToken] = useState<string | null>(null)
  const [generatingToken, setGeneratingToken] = useState<string | null>(null)

  useEffect(() => {
    fetchRestaurants()
  }, [])

  const fetchRestaurants = async () => {
    setLoading(true)
    const supabase = createClient()
    
    const { data: restaurantsData } = await supabase
      .from("restaurants")
      .select("id, name, slug, logo_url, kds_access_token, is_active")
      .order("name")
    
    const { data: branchesData } = await supabase
      .from("branches")
      .select("id, name, restaurant_id, kds_access_token")
      .order("name")
    
    setRestaurants(restaurantsData || [])
    setBranches(branchesData || [])
    setLoading(false)
  }

  const generateToken = async (restaurantId: string, branchId?: string) => {
    const tokenKey = branchId || restaurantId
    setGeneratingToken(tokenKey)
    
    const supabase = createClient()
    const newToken = crypto.randomUUID().replace(/-/g, "").substring(0, 24)
    
    if (branchId) {
      await supabase
        .from("branches")
        .update({ kds_access_token: newToken })
        .eq("id", branchId)
    } else {
      await supabase
        .from("restaurants")
        .update({ kds_access_token: newToken })
        .eq("id", restaurantId)
    }
    
    await fetchRestaurants()
    setGeneratingToken(null)
  }

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopiedToken(id)
    setTimeout(() => setCopiedToken(null), 2000)
  }

  const getKDSUrl = (slug: string, token?: string | null, branchId?: string) => {
    let url = `/${slug}/kds`
    const params = new URLSearchParams()
    if (branchId) params.append("branch", branchId)
    if (token) params.append("token", token)
    if (params.toString()) url += `?${params.toString()}`
    return url
  }

  const filteredRestaurants = restaurants.filter(r => 
    r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.slug.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="h-6 w-6 animate-spin text-slate-400" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <MonitorPlay className="h-6 w-6" />
            Kitchen Display System (KDS)
          </h2>
          <p className="text-slate-500 mt-1">
            Accede y configura el KDS de cada restaurante. Genera tokens de acceso para tablets.
          </p>
        </div>
        <Button variant="outline" onClick={fetchRestaurants}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refrescar
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <Input
          placeholder="Buscar restaurante..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Restaurant Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredRestaurants.map((restaurant) => {
          const restaurantBranches = branches.filter(b => b.restaurant_id === restaurant.id)
          const kdsUrl = getKDSUrl(restaurant.slug, restaurant.kds_access_token)
          
          return (
            <Card key={restaurant.id} className={!restaurant.is_active ? "opacity-60" : ""}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    {restaurant.logo_url ? (
                      <img 
                        src={restaurant.logo_url} 
                        alt={restaurant.name}
                        className="w-10 h-10 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">
                        <Building2 className="h-5 w-5 text-slate-400" />
                      </div>
                    )}
                    <div>
                      <CardTitle className="text-base">{restaurant.name}</CardTitle>
                      <CardDescription className="text-xs">/{restaurant.slug}</CardDescription>
                    </div>
                  </div>
                  {!restaurant.is_active && (
                    <Badge variant="secondary" className="text-xs">Inactivo</Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Main KDS Access */}
                <div className="space-y-2">
                  <Label className="text-xs text-slate-500 flex items-center gap-1">
                    <Key className="h-3 w-3" />
                    Token de Acceso Principal
                  </Label>
                  <div className="flex items-center gap-2">
                    <Input
                      value={restaurant.kds_access_token || "Sin token"}
                      readOnly
                      className="text-xs font-mono bg-slate-50"
                    />
                    {restaurant.kds_access_token && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="shrink-0"
                        onClick={() => copyToClipboard(restaurant.kds_access_token!, restaurant.id)}
                      >
                        {copiedToken === restaurant.id ? (
                          <Check className="h-4 w-4 text-green-500" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 text-xs"
                      onClick={() => generateToken(restaurant.id)}
                      disabled={generatingToken === restaurant.id}
                    >
                      {generatingToken === restaurant.id ? (
                        <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                      ) : (
                        <Key className="h-3 w-3 mr-1" />
                      )}
                      {restaurant.kds_access_token ? "Regenerar" : "Generar"} Token
                    </Button>
                    <Button
                      variant="default"
                      size="sm"
                      className="flex-1 text-xs"
                      asChild
                    >
                      <Link href={kdsUrl} target="_blank">
                        <Eye className="h-3 w-3 mr-1" />
                        Abrir KDS
                        <ExternalLink className="h-3 w-3 ml-1" />
                      </Link>
                    </Button>
                  </div>
                </div>

                {/* Copy Full URL */}
                {restaurant.kds_access_token && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full text-xs text-slate-500"
                    onClick={() => copyToClipboard(
                      `${window.location.origin}${kdsUrl}`,
                      `url-${restaurant.id}`
                    )}
                  >
                    {copiedToken === `url-${restaurant.id}` ? (
                      <>
                        <Check className="h-3 w-3 mr-1 text-green-500" />
                        URL Copiada
                      </>
                    ) : (
                      <>
                        <Copy className="h-3 w-3 mr-1" />
                        Copiar URL Completa (para tablets)
                      </>
                    )}
                  </Button>
                )}

                {/* Branches */}
                {restaurantBranches.length > 0 && (
                  <div className="pt-3 border-t space-y-2">
                    <Label className="text-xs text-slate-500">Sucursales</Label>
                    {restaurantBranches.map((branch) => {
                      const branchKdsUrl = getKDSUrl(restaurant.slug, branch.kds_access_token, branch.id)
                      return (
                        <div key={branch.id} className="p-2 bg-slate-50 rounded-lg space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">{branch.name}</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 text-xs"
                              asChild
                            >
                              <Link href={branchKdsUrl} target="_blank">
                                <Eye className="h-3 w-3 mr-1" />
                                KDS
                              </Link>
                            </Button>
                          </div>
                          <div className="flex items-center gap-1">
                            <Input
                              value={branch.kds_access_token || "Sin token"}
                              readOnly
                              className="text-xs font-mono bg-white h-7"
                            />
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 shrink-0"
                              onClick={() => generateToken(restaurant.id, branch.id)}
                              disabled={generatingToken === branch.id}
                            >
                              {generatingToken === branch.id ? (
                                <RefreshCw className="h-3 w-3 animate-spin" />
                              ) : (
                                <Key className="h-3 w-3" />
                              )}
                            </Button>
                            {branch.kds_access_token && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 shrink-0"
                                onClick={() => copyToClipboard(
                                  `${window.location.origin}${branchKdsUrl}`,
                                  `url-${branch.id}`
                                )}
                              >
                                {copiedToken === `url-${branch.id}` ? (
                                  <Check className="h-3 w-3 text-green-500" />
                                ) : (
                                  <Copy className="h-3 w-3" />
                                )}
                              </Button>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      {filteredRestaurants.length === 0 && (
        <div className="text-center py-12 text-slate-500">
          No se encontraron restaurantes
        </div>
      )}
    </div>
  )
}
