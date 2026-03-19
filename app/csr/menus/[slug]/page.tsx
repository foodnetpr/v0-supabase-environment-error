import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { CSRMenuEditorClient } from "./csr-menu-editor-client"

export default async function CSRMenuEditorPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const supabase = await createClient()

  // Get restaurant
  const { data: restaurant, error: restaurantError } = await supabase
    .from("restaurants")
    .select("id, name, slug, logo_url")
    .eq("slug", slug)
    .single()

  if (restaurantError || !restaurant) {
    redirect("/csr/menus")
  }

  // Get menu categories
  const { data: categories } = await supabase
    .from("menu_categories")
    .select("*")
    .eq("restaurant_id", restaurant.id)
    .order("display_order", { ascending: true })

  // Get menu items
  const { data: menuItems } = await supabase
    .from("menu_items")
    .select(`
      *,
      menu_categories(id, name)
    `)
    .eq("restaurant_id", restaurant.id)
    .order("display_order", { ascending: true })

  return (
    <CSRMenuEditorClient
      restaurant={restaurant}
      initialCategories={categories || []}
      initialMenuItems={menuItems || []}
    />
  )
}
