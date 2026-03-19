"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { 
  ArrowLeft, Search, Plus, Edit, Trash2, Save, X,
  UtensilsCrossed, DollarSign, Tag, Image as ImageIcon,
  ChevronDown, ChevronRight, GripVertical
} from "lucide-react"
import { toast } from "sonner"

interface Category {
  id: string
  name: string
  description: string | null
  display_order: number
  is_active: boolean
}

interface MenuItem {
  id: string
  name: string
  description: string | null
  price: number
  category_id: string
  image_url: string | null
  is_available: boolean
  display_order: number
  menu_categories: { id: string; name: string } | null
}

interface Restaurant {
  id: string
  name: string
  slug: string
  logo_url: string | null
}

interface CSRMenuEditorClientProps {
  restaurant: Restaurant
  initialCategories: Category[]
  initialMenuItems: MenuItem[]
}

export function CSRMenuEditorClient({
  restaurant,
  initialCategories,
  initialMenuItems,
}: CSRMenuEditorClientProps) {
  const [categories, setCategories] = useState<Category[]>(initialCategories)
  const [menuItems, setMenuItems] = useState<MenuItem[]>(initialMenuItems)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(initialCategories.map(c => c.id))
  )
  
  // Edit states
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  
  const supabase = createClient()

  const filteredItems = menuItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (item.description?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false)
    const matchesCategory = selectedCategory === "all" || item.category_id === selectedCategory
    return matchesSearch && matchesCategory
  })

  const itemsByCategory = categories.reduce((acc, cat) => {
    acc[cat.id] = filteredItems.filter(item => item.category_id === cat.id)
    return acc
  }, {} as Record<string, MenuItem[]>)

  const toggleCategory = (catId: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev)
      if (next.has(catId)) {
        next.delete(catId)
      } else {
        next.add(catId)
      }
      return next
    })
  }

  const handleEditItem = (item: MenuItem) => {
    setEditingItem({ ...item })
    setIsEditDialogOpen(true)
  }

  const handleSaveItem = async () => {
    if (!editingItem) return
    
    setSaving(true)
    try {
      const { error } = await supabase
        .from("menu_items")
        .update({
          name: editingItem.name,
          description: editingItem.description,
          price: editingItem.price,
          category_id: editingItem.category_id,
          is_available: editingItem.is_available,
        })
        .eq("id", editingItem.id)
      
      if (error) throw error
      
      // Update local state
      setMenuItems(prev => prev.map(item => 
        item.id === editingItem.id 
          ? { ...editingItem, menu_categories: categories.find(c => c.id === editingItem.category_id) ? { id: editingItem.category_id, name: categories.find(c => c.id === editingItem.category_id)!.name } : null }
          : item
      ))
      
      toast.success("Item actualizado correctamente")
      setIsEditDialogOpen(false)
      setEditingItem(null)
    } catch (error) {
      toast.error("Error al actualizar el item")
    } finally {
      setSaving(false)
    }
  }

  const toggleItemAvailability = async (item: MenuItem) => {
    try {
      const newAvailability = !item.is_available
      const { error } = await supabase
        .from("menu_items")
        .update({ is_available: newAvailability })
        .eq("id", item.id)
      
      if (error) throw error
      
      setMenuItems(prev => prev.map(i => 
        i.id === item.id ? { ...i, is_available: newAvailability } : i
      ))
      
      toast.success(newAvailability ? "Item marcado como disponible" : "Item marcado como no disponible")
    } catch (error) {
      toast.error("Error al actualizar disponibilidad")
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="border-b bg-white shadow-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/csr/menus">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Volver
                </Button>
              </Link>
              <div className="flex items-center gap-3">
                {restaurant.logo_url ? (
                  <Image
                    src={restaurant.logo_url}
                    alt={restaurant.name}
                    width={40}
                    height={40}
                    className="rounded-lg"
                  />
                ) : (
                  <div className="w-10 h-10 bg-slate-200 rounded-lg flex items-center justify-center">
                    <UtensilsCrossed className="h-5 w-5 text-slate-400" />
                  </div>
                )}
                <div>
                  <h1 className="text-xl font-bold text-slate-900">{restaurant.name}</h1>
                  <p className="text-sm text-slate-500">Editor de Menú</p>
                </div>
              </div>
            </div>
            <Badge variant="outline" className="text-teal-600 border-teal-600">
              CSR - Solo Edición de Menú
            </Badge>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border-b px-4 py-3 sticky top-[73px] z-40">
        <div className="container mx-auto flex flex-wrap items-center gap-4">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Buscar items..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Categoría" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las categorías</SelectItem>
              {categories.map(cat => (
                <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Menu Items by Category */}
      <div className="container mx-auto px-4 py-6">
        <div className="space-y-4">
          {categories.map(category => {
            const items = itemsByCategory[category.id] || []
            const isExpanded = expandedCategories.has(category.id)
            
            if (selectedCategory !== "all" && selectedCategory !== category.id) return null
            
            return (
              <Card key={category.id}>
                <CardHeader 
                  className="cursor-pointer hover:bg-slate-50 transition-colors"
                  onClick={() => toggleCategory(category.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {isExpanded ? (
                        <ChevronDown className="h-5 w-5 text-slate-400" />
                      ) : (
                        <ChevronRight className="h-5 w-5 text-slate-400" />
                      )}
                      <CardTitle className="text-lg">{category.name}</CardTitle>
                      <Badge variant="secondary">{items.length} items</Badge>
                    </div>
                  </div>
                </CardHeader>
                
                {isExpanded && (
                  <CardContent>
                    {items.length === 0 ? (
                      <p className="text-sm text-slate-500 text-center py-4">
                        No hay items en esta categoría
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {items.map(item => (
                          <div
                            key={item.id}
                            className={`flex items-center gap-4 p-3 rounded-lg border ${
                              item.is_available ? 'bg-white' : 'bg-slate-50 opacity-60'
                            }`}
                          >
                            {/* Image */}
                            <div className="w-16 h-16 rounded-lg bg-slate-100 flex-shrink-0 overflow-hidden">
                              {item.image_url ? (
                                <Image
                                  src={item.image_url}
                                  alt={item.name}
                                  width={64}
                                  height={64}
                                  className="object-cover w-full h-full"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <ImageIcon className="h-6 w-6 text-slate-300" />
                                </div>
                              )}
                            </div>
                            
                            {/* Details */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <h4 className="font-medium text-slate-900">{item.name}</h4>
                                {!item.is_available && (
                                  <Badge variant="destructive" className="text-xs">
                                    No disponible
                                  </Badge>
                                )}
                              </div>
                              {item.description && (
                                <p className="text-sm text-slate-500 line-clamp-1">
                                  {item.description}
                                </p>
                              )}
                            </div>
                            
                            {/* Price */}
                            <div className="text-right">
                              <span className="text-lg font-bold text-teal-600">
                                ${item.price.toFixed(2)}
                              </span>
                            </div>
                            
                            {/* Actions */}
                            <div className="flex items-center gap-2">
                              <Switch
                                checked={item.is_available}
                                onCheckedChange={() => toggleItemAvailability(item)}
                              />
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEditItem(item)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                )}
              </Card>
            )
          })}
        </div>
      </div>

      {/* Edit Item Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Item</DialogTitle>
            <DialogDescription>
              Modifica los detalles del item del menú
            </DialogDescription>
          </DialogHeader>
          
          {editingItem && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Nombre</Label>
                <Input
                  value={editingItem.name}
                  onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                />
              </div>
              
              <div className="space-y-2">
                <Label>Descripción</Label>
                <Textarea
                  value={editingItem.description || ""}
                  onChange={(e) => setEditingItem({ ...editingItem, description: e.target.value })}
                  rows={3}
                />
              </div>
              
              <div className="space-y-2">
                <Label>Precio</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={editingItem.price}
                    onChange={(e) => setEditingItem({ ...editingItem, price: parseFloat(e.target.value) || 0 })}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Categoría</Label>
                <Select
                  value={editingItem.category_id}
                  onValueChange={(value) => setEditingItem({ ...editingItem, category_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(cat => (
                      <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-center justify-between">
                <Label>Disponible</Label>
                <Switch
                  checked={editingItem.is_available}
                  onCheckedChange={(checked) => setEditingItem({ ...editingItem, is_available: checked })}
                />
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveItem} disabled={saving}>
              {saving ? "Guardando..." : "Guardar Cambios"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
