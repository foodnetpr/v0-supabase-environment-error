import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { id } = await params
    const body = await request.json()
    const { override } = body

    const { data, error } = await supabase
      .from("restaurants")
      .update({ block_override: override })
      .eq("id", id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Log the override action
    await supabase.from("block_log").insert({
      restaurant_id: id,
      action: override ? "override_enabled" : "override_disabled",
      reason: override ? "Override enabled - stays open during POP block" : "Override disabled"
    })

    return NextResponse.json({ success: true, restaurant: data })

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
