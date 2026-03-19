import { createClient } from "@/lib/supabase/server"
import { InternalShopClient } from "./internal-shop-client"
import { redirect } from "next/navigation"

export const dynamic = "force-dynamic"

export default async function InternalShopPage() {
  const supabase = await createClient()

  // Check authentication
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect("/auth/login")
  }

  // Verify user is a super_admin
  const { data: adminData } = await supabase
    .from("admin_users")
    .select("role")
    .eq("auth_user_id", session.user.id)
    .single()

  if (!adminData || adminData.role !== "super_admin") {
    redirect("/")
  }

  const { data: items, error } = await supabase
    .from("internal_shop_items")
    .select("*")
    .order("display_order", { ascending: true })
    .order("name", { ascending: true })

  if (error) {
    console.error("Error fetching internal shop items:", error)
  }

  return <InternalShopClient initialItems={items || []} />
}
