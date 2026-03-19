"use client"

import { useState, useEffect } from "react"
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
  ArrowLeft, Search, Edit, Star, 
  UtensilsCrossed, DollarSign, Image as ImageIcon,
  ChevronDown, ChevronRight, Plus, Trash2, Settings2
} from "lucide-react"
import { toast } from "sonner"
import { ImageUpload } from "@/components/image-upload"

interface Category {
  id: string
  name: string
  description: string | null
  display_order: number
  is_active: boolean
}

interface ItemOption {
  id: string
  menu_item_id: string
  category: string
  prompt: string | null
  is_required: boolean
  min_selection: number
  max_selection: number
  display_order: number
  choices: ItemOptionChoice[]
}

interface ItemOptionChoice {
  id: string
  item_option_id: string
  name: string
  price_modifier: number
  display_order: number
}

interface MenuItem {
  id: string
  name: string
  description: string | null
  price: number
  category_id: string
  image_url: string | null
  is_active: boolean
  is_upsell_item: boolean
  display_order: number
  categories: { id: string; name: string } | null
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
  
  // Options states
  const [showOptionsModal, setShowOptionsModal] = useState(false)
  const [currentOptionsItem, setCurrentOptionsItem] = useState<MenuItem | null>(null)
  const [itemOptions, setItemOptions] = useState<ItemOption[]>([])
  const [loadingOptions, setLoadingOptions] = useState(false)
  const [editingOption, setEditingOption] = useState<ItemOption | null>(null)
  const [isOptionDialogOpen, setIsOptionDialogOpen] = useState(false)
  const [newChoiceName, setNewChoiceName] = useState("")
  const [newChoicePrice, setNewChoicePrice] = useState(0)
  
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
          is_active: editingItem.is_active,
          is_upsell_item: editingItem.is_upsell_item,
          image_url: editingItem.image_url,
        })
        .eq("id", editingItem.id)
      
      if (error) throw error
      
      // Update local state
      setMenuItems(prev => prev.map(item => 
        item.id === editingItem.id 
          ? { ...editingItem, categories: categories.find(c => c.id === editingItem.category_id) ? { id: editingItem.category_id, name: categories.find(c => c.id === editingItem.category_id)!.name } : null }
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
      const newAvailability = !item.is_active
      const { error } = await supabase
        .from("menu_items")
        .update({ is_active: newAvailability })
        .eq("id", item.id)
      
      if (error) throw error
      
      setMenuItems(prev => prev.map(i => 
        i.id === item.id ? { ...i, is_active: newAvailability } : i
      ))
      
      toast.success(newAvailability ? "Item disponible" : "Item no disponible")
    } catch (error) {
      toast.error("Error al actualizar disponibilidad")
    }
  }

  const toggleDailySpecial = async (item: MenuItem) => {
    try {
      const newValue = !item.is_upsell_item
      const { error } = await supabase
        .from("menu_items")
        .update({ is_upsell_item: newValue })
        .eq("id", item.id)
      
      if (error) throw error
      
      setMenuItems(prev => prev.map(i => 
        i.id === item.id ? { ...i, is_upsell_item: newValue } : i
      ))
      
      toast.success(newValue ? "Marcado como especial del día" : "Removido de especiales")
    } catch (error) {
      toast.error("Error al actualizar")
    }
  }

  // Options management
  const loadItemOptions = async (menuItemId: string) => {
    setLoadingOptions(true)
    try {
      const { data, error } = await supabase
        .from("item_options")
        .select(`
          *,
          item_option_choices(*)
        `)
        .eq("menu_item_id", menuItemId)
        .order("display_order")
      
      if (error) throw error
      
      const normalizedOptions = (data || []).map((option: any) => ({
        ...option,
        choices: (option.item_option_choices || []).sort((a: any, b: any) => a.display_order - b.display_order),
      }))
      
      setItemOptions(normalizedOptions)
    } catch (error) {
      console.error("Error loading options:", error)
      toast.error("Error al cargar opciones")
    } finally {
      setLoadingOptions(false)
    }
  }

  const handleManageOptions = async (item: MenuItem) => {
    setCurrentOptionsItem(item)
    await loadItemOptions(item.id)
    setShowOptionsModal(true)
  }

  const handleEditOption = (option: ItemOption) => {
    setEditingOption({ ...option })
    setIsOptionDialogOpen(true)
  }

  const handleSaveOption = async () => {
    if (!editingOption) return
    
    setSaving(true)
    try {
      const { error } = await supabase
        .from("item_options")
        .update({
          category: editingOption.category,
          prompt: editingOption.prompt,
          is_required: editingOption.is_required,
          min_selection: editingOption.min_selection,
          max_selection: editingOption.max_selection,
        })
        .eq("id", editingOption.id)
      
      if (error) throw error
      
      setItemOptions(prev => prev.map(opt => 
        opt.id === editingOption.id ? { ...editingOption } : opt
      ))
      
      toast.success("Opción actualizada")
      setIsOptionDialogOpen(false)
      setEditingOption(null)
    } catch (error) {
      toast.error("Error al actualizar opción")
    } finally {
      setSaving(false)
    }
  }

  const handleAddChoice = async () => {
    if (!editingOption || !newChoiceName.trim()) return
    
    try {
      const newDisplayOrder = (editingOption.choices?.length || 0) + 1
      
      const { data, error } = await supabase
        .from("item_option_choices")
        .insert({
          item_option_id: editingOption.id,
          name: newChoiceName.trim(),
          price_modifier: newChoicePrice,
          display_order: newDisplayOrder,
        })
        .select()
        .single()
      
      if (error) throw error
      
      setEditingOption({
        ...editingOption,
        choices: [...(editingOption.choices || []), data]
      })
      
      setItemOptions(prev => prev.map(opt => 
        opt.id === editingOption.id 
          ? { ...opt, choices: [...(opt.choices || []), data] }
          : opt
      ))
      
      setNewChoiceName("")
      setNewChoicePrice(0)
      toast.success("Opción agregada")
    } catch (error) {
      toast.error("Error al agregar opción")
    }
  }

  const handleDeleteChoice = async (choiceId: string) => {
    if (!editingOption) return
    
    try {
      const { error } = await supabase
        .from("item_option_choices")
        .delete()
        .eq("id", choiceId)
      
      if (error) throw error
      
      const newChoices = editingOption.choices.filter(c => c.id !== choiceId)
      setEditingOption({ ...editingOption, choices: newChoices })
      
      setItemOptions(prev => prev.map(opt => 
        opt.id === editingOption.id 
          ? { ...opt, choices: newChoices }
          : opt
      ))
      
      toast.success("Opción eliminada")
    } catch (error) {
      toast.error("Error al eliminar opción")
    }
  }

  const handleAddNewOption = async () => {
    if (!currentOptionsItem) return
    
    try {
      const newDisplayOrder = itemOptions.length + 1
      
      const { data, error } = await supabase
        .from("item_options")
        .insert({
          menu_item_id: currentOptionsItem.id,
          category: "Nueva Opción",
          prompt: "Selecciona una opción",
          is_required: false,
          min_selection: 0,
          max_selection: 1,
          display_order: newDisplayOrder,
        })
        .select()
        .single()
      
      if (error) throw error
      
      const newOption = { ...data, choices: [] }
      setItemOptions(prev => [...prev, newOption])
      setEditingOption(newOption)
      setIsOptionDialogOpen(true)
      
      toast.success("Opción creada")
    } catch (error) {
      toast.error("Error al crear opción")
    }
  }

  const handleDeleteOption = async (optionId: string) => {
    try {
      // Delete choices first
      await supabase
        .from("item_option_choices")
        .delete()
        .eq("item_option_id", optionId)
      
      // Then delete option
      const { error } = await supabase
        .from("item_options")
        .delete()
        .eq("id", optionId)
      
      if (error) throw error
      
      setItemOptions(prev => prev.filter(opt => opt.id !== optionId))
      toast.success("Opción eliminada")
    } catch (error) {
      toast.error("Error al eliminar opción")
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
              CSR - Edición de Menú
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
                              item.is_active ? 'bg-white' : 'bg-slate-50 opacity-60'
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
                                {item.is_upsell_item && (
                                  <Badge className="bg-amber-100 text-amber-800 text-xs">
                                    <Star className="h-3 w-3 mr-1" />
                                    Especial
                                  </Badge>
                                )}
                                {!item.is_active && (
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
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => toggleDailySpecial(item)}
                                title={item.is_upsell_item ? "Quitar de especiales" : "Marcar como especial"}
                              >
                                <Star className={`h-4 w-4 ${item.is_upsell_item ? 'fill-amber-400 text-amber-400' : 'text-slate-400'}`} />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleManageOptions(item)}
                                title="Gestionar opciones"
                              >
                                <Settings2 className="h-4 w-4 text-slate-500" />
                              </Button>
                              <Switch
                                checked={item.is_active}
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
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Item</DialogTitle>
            <DialogDescription>
              Modifica los detalles del item del menú
            </DialogDescription>
          </DialogHeader>
          
          {editingItem && (
            <div className="space-y-4">
              {/* Image Upload */}
              <ImageUpload
                value={editingItem.image_url || ""}
                onChange={(url) => setEditingItem({ ...editingItem, image_url: url })}
                label="Imagen del Item"
                folder={`menu-items/${restaurant.slug}`}
              />
              
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
                  checked={editingItem.is_active}
                  onCheckedChange={(checked) => setEditingItem({ ...editingItem, is_active: checked })}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <Label>Especial del Día</Label>
                  <p className="text-xs text-slate-500">Destacar en la sección de especiales</p>
                </div>
                <Switch
                  checked={editingItem.is_upsell_item}
                  onCheckedChange={(checked) => setEditingItem({ ...editingItem, is_upsell_item: checked })}
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

      {/* Options Management Modal */}
      <Dialog open={showOptionsModal} onOpenChange={setShowOptionsModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Gestionar Opciones</DialogTitle>
            <DialogDescription>
              {currentOptionsItem?.name} - Configura las opciones y modificadores
            </DialogDescription>
          </DialogHeader>
          
          {loadingOptions ? (
            <div className="py-8 text-center text-slate-500">Cargando opciones...</div>
          ) : (
            <div className="space-y-4">
              {itemOptions.length === 0 ? (
                <div className="py-8 text-center text-slate-500">
                  No hay opciones configuradas para este item
                </div>
              ) : (
                itemOptions.map(option => (
                  <Card key={option.id}>
                    <CardHeader className="py-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-base">{option.category}</CardTitle>
                          <p className="text-xs text-slate-500">
                            {option.is_required ? "Requerido" : "Opcional"} · 
                            {option.min_selection > 0 ? ` Mín: ${option.min_selection}` : ""} 
                            {option.max_selection > 0 ? ` Máx: ${option.max_selection}` : ""}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="ghost" size="sm" onClick={() => handleEditOption(option)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDeleteOption(option.id)}>
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="py-2">
                      {option.choices.length === 0 ? (
                        <p className="text-sm text-slate-400">Sin opciones configuradas</p>
                      ) : (
                        <div className="space-y-1">
                          {option.choices.map(choice => (
                            <div key={choice.id} className="flex items-center justify-between text-sm py-1 px-2 bg-slate-50 rounded">
                              <span>{choice.name}</span>
                              <span className={choice.price_modifier > 0 ? "text-teal-600" : "text-slate-400"}>
                                {choice.price_modifier > 0 ? `+$${choice.price_modifier.toFixed(2)}` : "Incluido"}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))
              )}
              
              <Button variant="outline" className="w-full" onClick={handleAddNewOption}>
                <Plus className="h-4 w-4 mr-2" />
                Agregar Nueva Opción
              </Button>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowOptionsModal(false)}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Option Dialog */}
      <Dialog open={isOptionDialogOpen} onOpenChange={setIsOptionDialogOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Opción</DialogTitle>
          </DialogHeader>
          
          {editingOption && (
            <Tabs defaultValue="settings">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="settings">Configuración</TabsTrigger>
                <TabsTrigger value="choices">Opciones ({editingOption.choices?.length || 0})</TabsTrigger>
              </TabsList>
              
              <TabsContent value="settings" className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label>Nombre de la Opción</Label>
                  <Input
                    value={editingOption.category}
                    onChange={(e) => setEditingOption({ ...editingOption, category: e.target.value })}
                    placeholder="Ej: Tamaño, Proteína, Extras"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Instrucción</Label>
                  <Input
                    value={editingOption.prompt || ""}
                    onChange={(e) => setEditingOption({ ...editingOption, prompt: e.target.value })}
                    placeholder="Ej: Selecciona tu tamaño preferido"
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <Label>Requerido</Label>
                  <Switch
                    checked={editingOption.is_required}
                    onCheckedChange={(checked) => setEditingOption({ ...editingOption, is_required: checked })}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Mínimo</Label>
                    <Input
                      type="number"
                      min="0"
                      value={editingOption.min_selection}
                      onChange={(e) => setEditingOption({ ...editingOption, min_selection: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Máximo</Label>
                    <Input
                      type="number"
                      min="0"
                      value={editingOption.max_selection}
                      onChange={(e) => setEditingOption({ ...editingOption, max_selection: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="choices" className="space-y-4 mt-4">
                {/* Existing Choices */}
                {editingOption.choices?.length > 0 && (
                  <div className="space-y-2">
                    {editingOption.choices.map(choice => (
                      <div key={choice.id} className="flex items-center gap-2 p-2 bg-slate-50 rounded">
                        <span className="flex-1">{choice.name}</span>
                        <span className="text-sm text-slate-500">
                          {choice.price_modifier > 0 ? `+$${choice.price_modifier.toFixed(2)}` : "Incluido"}
                        </span>
                        <Button variant="ghost" size="sm" onClick={() => handleDeleteChoice(choice.id)}>
                          <Trash2 className="h-3 w-3 text-red-500" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
                
                {/* Add New Choice */}
                <div className="border-t pt-4">
                  <Label className="text-sm font-medium mb-2 block">Agregar Nueva Opción</Label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Nombre"
                      value={newChoiceName}
                      onChange={(e) => setNewChoiceName(e.target.value)}
                      className="flex-1"
                    />
                    <div className="relative w-24">
                      <DollarSign className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-400" />
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        value={newChoicePrice || ""}
                        onChange={(e) => setNewChoicePrice(parseFloat(e.target.value) || 0)}
                        className="pl-6"
                      />
                    </div>
                    <Button size="sm" onClick={handleAddChoice}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOptionDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveOption} disabled={saving}>
              {saving ? "Guardando..." : "Guardar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
