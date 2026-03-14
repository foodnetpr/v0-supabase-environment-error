"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { createBrowserClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  User,
  MapPin,
  CreditCard,
  ShoppingBag,
  Heart,
  LogOut,
  Plus,
  Pencil,
  Trash2,
  ChevronRight,
  Clock,
  CheckCircle2,
  XCircle,
  Truck,
  Store,
} from "lucide-react"
import type { User as SupabaseUser } from "@supabase/supabase-js"

interface Customer {
  id: string
  email: string
  first_name: string | null
  last_name: string | null
  phone: string | null
  default_address_id: string | null
  default_payment_method_id: string | null
}

interface Address {
  id: string
  label: string | null
  address_line_1: string
  address_line_2: string | null
  city: string
  state: string | null
  postal_code: string | null
  delivery_instructions: string | null
  is_default: boolean
}

interface PaymentMethod {
  id: string
  provider: string
  card_brand: string | null
  card_last_four: string | null
  card_exp_month: number | null
  card_exp_year: number | null
  is_default: boolean
}

interface Order {
  id: string
  order_number: string
  status: string
  order_type: string
  total: number
  created_at: string
  items: any[]
  restaurants: {
    id: string
    name: string
    slug: string
    logo_url: string | null
  } | null
}

interface Favorite {
  id: string
  restaurants: {
    id: string
    name: string
    slug: string
    logo_url: string | null
    cuisine_type: string | null
    marketplace_image_url: string | null
  } | null
}

interface AccountDashboardProps {
  user: SupabaseUser
  customer: Customer | null
  addresses: Address[]
  paymentMethods: PaymentMethod[]
  orders: Order[]
  favorites: Favorite[]
}

export function AccountDashboard({
  user,
  customer,
  addresses,
  paymentMethods,
  orders,
  favorites,
}: AccountDashboardProps) {
  const router = useRouter()
  const supabase = createBrowserClient()
  const [activeTab, setActiveTab] = useState("orders")
  const [isAddAddressOpen, setIsAddAddressOpen] = useState(false)
  const [editingAddress, setEditingAddress] = useState<Address | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push("/")
    router.refresh()
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-PR", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: React.ReactNode }> = {
      pending: { label: "Pendiente", variant: "secondary", icon: <Clock className="h-3 w-3" /> },
      confirmed: { label: "Confirmado", variant: "default", icon: <CheckCircle2 className="h-3 w-3" /> },
      preparing: { label: "Preparando", variant: "default", icon: <Clock className="h-3 w-3" /> },
      ready: { label: "Listo", variant: "default", icon: <CheckCircle2 className="h-3 w-3" /> },
      delivered: { label: "Entregado", variant: "outline", icon: <CheckCircle2 className="h-3 w-3" /> },
      completed: { label: "Completado", variant: "outline", icon: <CheckCircle2 className="h-3 w-3" /> },
      cancelled: { label: "Cancelado", variant: "destructive", icon: <XCircle className="h-3 w-3" /> },
    }
    const config = statusConfig[status] || statusConfig.pending
    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        {config.icon}
        {config.label}
      </Badge>
    )
  }

  const handleDeleteAddress = async (addressId: string) => {
    setLoading(true)
    await supabase.from("customer_addresses").delete().eq("id", addressId)
    router.refresh()
    setLoading(false)
  }

  const handleSetDefaultAddress = async (addressId: string) => {
    if (!customer) return
    setLoading(true)
    // First, unset all defaults
    await supabase
      .from("customer_addresses")
      .update({ is_default: false })
      .eq("customer_id", customer.id)
    // Then set the new default
    await supabase
      .from("customer_addresses")
      .update({ is_default: true })
      .eq("id", addressId)
    router.refresh()
    setLoading(false)
  }

  const handleRemoveFavorite = async (favoriteId: string) => {
    setLoading(true)
    await supabase.from("customer_favorites").delete().eq("id", favoriteId)
    router.refresh()
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/foodnet-delivery-logo.jpg"
              alt="FoodNetDelivery"
              width={150}
              height={50}
              className="h-10 w-auto"
            />
          </Link>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground hidden sm:block">
              {customer?.first_name} {customer?.last_name}
            </span>
            <Button variant="outline" size="sm" onClick={handleSignOut}>
              <LogOut className="h-4 w-4 mr-2" />
              Cerrar Sesion
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-2">Mi Cuenta</h1>
        <p className="text-muted-foreground mb-8">
          Administra tus pedidos, direcciones y metodos de pago
        </p>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-grid mb-6">
            <TabsTrigger value="orders" className="flex items-center gap-2">
              <ShoppingBag className="h-4 w-4" />
              <span className="hidden sm:inline">Pedidos</span>
            </TabsTrigger>
            <TabsTrigger value="addresses" className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              <span className="hidden sm:inline">Direcciones</span>
            </TabsTrigger>
            <TabsTrigger value="payments" className="flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              <span className="hidden sm:inline">Pagos</span>
            </TabsTrigger>
            <TabsTrigger value="favorites" className="flex items-center gap-2">
              <Heart className="h-4 w-4" />
              <span className="hidden sm:inline">Favoritos</span>
            </TabsTrigger>
          </TabsList>

          {/* Orders Tab */}
          <TabsContent value="orders" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Historial de Pedidos</CardTitle>
                <CardDescription>
                  Tus pedidos de todos los restaurantes
                </CardDescription>
              </CardHeader>
              <CardContent>
                {orders.length === 0 ? (
                  <div className="text-center py-12">
                    <ShoppingBag className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No tienes pedidos aun</p>
                    <Button asChild className="mt-4 bg-teal-600 hover:bg-teal-700">
                      <Link href="/">Explorar Restaurantes</Link>
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {orders.map((order) => (
                      <div
                        key={order.id}
                        className="flex items-center gap-4 p-4 border rounded-lg hover:bg-slate-50 transition-colors"
                      >
                        {order.restaurants?.logo_url ? (
                          <Image
                            src={order.restaurants.logo_url}
                            alt={order.restaurants.name}
                            width={60}
                            height={60}
                            className="h-14 w-14 rounded-lg object-cover"
                          />
                        ) : (
                          <div className="h-14 w-14 rounded-lg bg-slate-100 flex items-center justify-center">
                            <Store className="h-6 w-6 text-slate-400" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium truncate">
                              {order.restaurants?.name || "Restaurante"}
                            </span>
                            {getStatusBadge(order.status)}
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <span>#{order.order_number}</span>
                            <span>•</span>
                            <span>{formatDate(order.created_at)}</span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              {order.order_type === "delivery" ? (
                                <Truck className="h-3 w-3" />
                              ) : (
                                <Store className="h-3 w-3" />
                              )}
                              {order.order_type === "delivery" ? "Delivery" : "Pick-up"}
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">${order.total.toFixed(2)}</p>
                          <Link
                            href={`/${order.restaurants?.slug}/orders?order=${order.id}`}
                            className="text-sm text-teal-600 hover:underline flex items-center gap-1"
                          >
                            Ver detalles
                            <ChevronRight className="h-3 w-3" />
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Addresses Tab */}
          <TabsContent value="addresses" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Direcciones Guardadas</CardTitle>
                  <CardDescription>
                    Direcciones para entregas rapidas
                  </CardDescription>
                </div>
                <AddAddressDialog
                  customerId={customer?.id || ""}
                  onSuccess={() => router.refresh()}
                />
              </CardHeader>
              <CardContent>
                {addresses.length === 0 ? (
                  <div className="text-center py-12">
                    <MapPin className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No tienes direcciones guardadas</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {addresses.map((address) => (
                      <div
                        key={address.id}
                        className="flex items-start gap-4 p-4 border rounded-lg"
                      >
                        <div className="h-10 w-10 rounded-full bg-teal-100 flex items-center justify-center flex-shrink-0">
                          <MapPin className="h-5 w-5 text-teal-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium">
                              {address.label || "Direccion"}
                            </span>
                            {address.is_default && (
                              <Badge variant="secondary" className="text-xs">
                                Principal
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {address.address_line_1}
                            {address.address_line_2 && `, ${address.address_line_2}`}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {address.city}
                            {address.state && `, ${address.state}`}
                            {address.postal_code && ` ${address.postal_code}`}
                          </p>
                          {address.delivery_instructions && (
                            <p className="text-sm text-muted-foreground mt-1">
                              Instrucciones: {address.delivery_instructions}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {!address.is_default && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleSetDefaultAddress(address.id)}
                              disabled={loading}
                            >
                              Hacer principal
                            </Button>
                          )}
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Eliminar direccion?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Esta accion no se puede deshacer.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDeleteAddress(address.id)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Eliminar
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Payment Methods Tab */}
          <TabsContent value="payments" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Metodos de Pago</CardTitle>
                <CardDescription>
                  Tarjetas guardadas para pagos rapidos
                </CardDescription>
              </CardHeader>
              <CardContent>
                {paymentMethods.length === 0 ? (
                  <div className="text-center py-12">
                    <CreditCard className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No tienes metodos de pago guardados</p>
                    <p className="text-sm text-muted-foreground mt-2">
                      Se guardaran automaticamente cuando hagas un pedido
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {paymentMethods.map((method) => (
                      <div
                        key={method.id}
                        className="flex items-center gap-4 p-4 border rounded-lg"
                      >
                        <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0">
                          <CreditCard className="h-5 w-5 text-slate-600" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium capitalize">
                              {method.card_brand || method.provider}
                            </span>
                            {method.is_default && (
                              <Badge variant="secondary" className="text-xs">
                                Principal
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            **** **** **** {method.card_last_four}
                            {method.card_exp_month && method.card_exp_year && (
                              <span className="ml-2">
                                Exp: {method.card_exp_month}/{method.card_exp_year}
                              </span>
                            )}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Favorites Tab */}
          <TabsContent value="favorites" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Restaurantes Favoritos</CardTitle>
                <CardDescription>
                  Tus restaurantes guardados para acceso rapido
                </CardDescription>
              </CardHeader>
              <CardContent>
                {favorites.length === 0 ? (
                  <div className="text-center py-12">
                    <Heart className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No tienes restaurantes favoritos</p>
                    <Button asChild className="mt-4 bg-teal-600 hover:bg-teal-700">
                      <Link href="/">Explorar Restaurantes</Link>
                    </Button>
                  </div>
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {favorites.map((favorite) => (
                      <div
                        key={favorite.id}
                        className="relative group border rounded-lg overflow-hidden hover:shadow-md transition-shadow"
                      >
                        <Link href={`/${favorite.restaurants?.slug}`}>
                          <div className="aspect-video relative bg-slate-100">
                            {favorite.restaurants?.marketplace_image_url ? (
                              <Image
                                src={favorite.restaurants.marketplace_image_url}
                                alt={favorite.restaurants.name}
                                fill
                                className="object-cover"
                              />
                            ) : favorite.restaurants?.logo_url ? (
                              <div className="absolute inset-0 flex items-center justify-center">
                                <Image
                                  src={favorite.restaurants.logo_url}
                                  alt={favorite.restaurants.name}
                                  width={120}
                                  height={60}
                                  className="object-contain"
                                />
                              </div>
                            ) : (
                              <div className="absolute inset-0 flex items-center justify-center">
                                <Store className="h-12 w-12 text-slate-300" />
                              </div>
                            )}
                          </div>
                          <div className="p-4">
                            <h3 className="font-medium">{favorite.restaurants?.name}</h3>
                            {favorite.restaurants?.cuisine_type && (
                              <p className="text-sm text-muted-foreground">
                                {favorite.restaurants.cuisine_type}
                              </p>
                            )}
                          </div>
                        </Link>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="absolute top-2 right-2 bg-white/80 hover:bg-white"
                          onClick={() => handleRemoveFavorite(favorite.id)}
                        >
                          <Heart className="h-4 w-4 fill-red-500 text-red-500" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Profile Section */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Perfil
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label className="text-muted-foreground">Nombre</Label>
                <p className="font-medium">
                  {customer?.first_name} {customer?.last_name}
                </p>
              </div>
              <div>
                <Label className="text-muted-foreground">Email</Label>
                <p className="font-medium">{customer?.email || user.email}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Telefono</Label>
                <p className="font-medium">{customer?.phone || "No especificado"}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}

// Add Address Dialog Component
function AddAddressDialog({
  customerId,
  onSuccess,
}: {
  customerId: string
  onSuccess: () => void
}) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [label, setLabel] = useState("")
  const [addressLine1, setAddressLine1] = useState("")
  const [addressLine2, setAddressLine2] = useState("")
  const [city, setCity] = useState("")
  const [state, setState] = useState("")
  const [postalCode, setPostalCode] = useState("")
  const [instructions, setInstructions] = useState("")
  const supabase = createBrowserClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!customerId) return

    setLoading(true)
    const { error } = await supabase.from("customer_addresses").insert({
      customer_id: customerId,
      label: label || null,
      address_line_1: addressLine1,
      address_line_2: addressLine2 || null,
      city,
      state: state || null,
      postal_code: postalCode || null,
      delivery_instructions: instructions || null,
    })

    if (!error) {
      setOpen(false)
      setLabel("")
      setAddressLine1("")
      setAddressLine2("")
      setCity("")
      setState("")
      setPostalCode("")
      setInstructions("")
      onSuccess()
    }
    setLoading(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-teal-600 hover:bg-teal-700">
          <Plus className="h-4 w-4 mr-2" />
          Agregar Direccion
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Agregar Nueva Direccion</DialogTitle>
          <DialogDescription>
            Agrega una direccion para entregas rapidas
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="label">Etiqueta (opcional)</Label>
            <Input
              id="label"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Ej: Casa, Trabajo, etc."
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="address1">Direccion</Label>
            <Input
              id="address1"
              value={addressLine1}
              onChange={(e) => setAddressLine1(e.target.value)}
              required
              placeholder="Calle, numero"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="address2">Apt, Suite, etc. (opcional)</Label>
            <Input
              id="address2"
              value={addressLine2}
              onChange={(e) => setAddressLine2(e.target.value)}
              placeholder="Apartamento, suite, unidad"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="city">Ciudad</Label>
              <Input
                id="city"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                required
                placeholder="San Juan"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="state">Estado/Provincia</Label>
              <Input
                id="state"
                value={state}
                onChange={(e) => setState(e.target.value)}
                placeholder="PR"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="postal">Codigo Postal</Label>
            <Input
              id="postal"
              value={postalCode}
              onChange={(e) => setPostalCode(e.target.value)}
              placeholder="00901"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="instructions">Instrucciones de entrega (opcional)</Label>
            <Input
              id="instructions"
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder="Ej: Portón verde, tocar timbre"
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading} className="bg-teal-600 hover:bg-teal-700">
              {loading ? "Guardando..." : "Guardar Direccion"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
