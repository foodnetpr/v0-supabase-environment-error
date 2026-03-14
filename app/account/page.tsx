import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { AccountDashboard } from "@/components/account-dashboard"

export default async function AccountPage() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect("/auth/customer/login?redirect=/account")
  }

  // Get customer record
  const { data: customer } = await supabase
    .from("customers")
    .select("*")
    .eq("auth_user_id", user.id)
    .single()

  // Get customer addresses
  const { data: addresses } = await supabase
    .from("customer_addresses")
    .select("*")
    .eq("customer_id", customer?.id)
    .order("is_default", { ascending: false })
    .order("created_at", { ascending: false })

  // Get customer payment methods
  const { data: paymentMethods } = await supabase
    .from("customer_payment_methods")
    .select("*")
    .eq("customer_id", customer?.id)
    .order("is_default", { ascending: false })
    .order("created_at", { ascending: false })

  // Get customer orders (across all restaurants)
  const { data: orders } = await supabase
    .from("orders")
    .select(`
      *,
      restaurants (
        id,
        name,
        slug,
        logo_url
      )
    `)
    .eq("customer_id", customer?.id)
    .order("created_at", { ascending: false })
    .limit(50)

  // Get favorite restaurants
  const { data: favorites } = await supabase
    .from("customer_favorites")
    .select(`
      *,
      restaurants (
        id,
        name,
        slug,
        logo_url,
        cuisine_type,
        marketplace_image_url
      )
    `)
    .eq("customer_id", customer?.id)
    .order("created_at", { ascending: false })

  return (
    <AccountDashboard
      user={user}
      customer={customer}
      addresses={addresses || []}
      paymentMethods={paymentMethods || []}
      orders={orders || []}
      favorites={favorites || []}
    />
  )
}
