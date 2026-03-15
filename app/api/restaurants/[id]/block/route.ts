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
    const { blocked, duration, reason } = body

    const updateData: any = {
      is_manually_blocked: blocked
    }

    // If blocking with duration, set blocked_until
    if (blocked && duration) {
      const blockedUntil = new Date()
      blockedUntil.setMinutes(blockedUntil.getMinutes() + duration)
      updateData.blocked_until = blockedUntil.toISOString()
    } else if (!blocked) {
      updateData.blocked_until = null
    }

    const { data, error } = await supabase
      .from("restaurants")
      .update(updateData)
      .eq("id", id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Log the block action
    await supabase.from("block_log").insert({
      restaurant_id: id,
      action: blocked ? "block" : "unblock",
      reason: reason || (blocked ? `Temp block for ${duration} minutes` : "Manual unblock"),
      duration_minutes: duration || null
    })

    return NextResponse.json({ success: true, restaurant: data })

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
