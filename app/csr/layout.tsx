import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

export const metadata = {
  title: "CSR Portal - FoodNetPR",
  description: "Customer Service Representative Phone Order Portal",
}

export default async function CSRLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  
  // Check if user is authenticated
  const { data: { user } } = await supabase.auth.getUser()
  
  console.log("[v0] CSR Layout - user:", user?.id, user?.email)
  
  if (!user) {
    console.log("[v0] CSR Layout - No user, redirecting to login")
    redirect("/auth/customer/login?redirect=/csr")
  }
  
  // Check if user is an admin - check both admin_users table AND super_admins table
  const { data: adminUser, error: adminError } = await supabase
    .from("admin_users")
    .select("id, role")
    .eq("auth_user_id", user.id)
    .single()
  
  console.log("[v0] CSR Layout - adminUser:", adminUser, "error:", adminError)
  
  // Also check if user is a super_admin by email (for super admin login)
  const { data: superAdmin } = await supabase
    .from("super_admins")
    .select("id, email")
    .eq("email", user.email)
    .single()
  
  console.log("[v0] CSR Layout - superAdmin:", superAdmin)
  
  const hasAccess = adminUser?.role === "super_admin" || 
                    adminUser?.role === "restaurant_admin" || 
                    superAdmin !== null
  
  if (!hasAccess) {
    console.log("[v0] CSR Layout - No access, redirecting to home")
    redirect("/")
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {children}
    </div>
  )
}
