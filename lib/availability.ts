import { createClient } from "@/lib/supabase/server"

interface PlatformSettings {
  is_platform_open: boolean
  is_pop_blocked: boolean
  operating_hours_start: string
  operating_hours_end: string
  operating_days: Record<string, boolean>
  emergency_block_active: boolean
}

interface Restaurant {
  id: string
  payment_type: string | null
  is_manually_blocked: boolean
  block_override: boolean
  blocked_until: string | null
}

const DAY_NAMES = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']

export async function getPlatformSettings(): Promise<PlatformSettings | null> {
  const supabase = await createClient()
  const { data } = await supabase
    .from("platform_settings")
    .select("*")
    .single()
  return data
}

export function isWithinOperatingHours(now: Date, platform: PlatformSettings): boolean {
  // Check if current day is an operating day
  const dayName = DAY_NAMES[now.getDay()]
  if (!platform.operating_days[dayName]) {
    return false
  }

  // Check if current time is within operating hours
  const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`
  const startTime = platform.operating_hours_start
  const endTime = platform.operating_hours_end

  return currentTime >= startTime && currentTime <= endTime
}

export async function getActiveBlocks(restaurantId: string, now: Date): Promise<any[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from("scheduled_blocks")
    .select("*")
    .or(`restaurant_id.eq.${restaurantId},restaurant_id.is.null`)
    .eq("is_active", true)
    .lte("starts_at", now.toISOString())
    .gte("ends_at", now.toISOString())

  return data || []
}

export async function getRestaurantHours(restaurantId: string, dayOfWeek: number) {
  const supabase = await createClient()
  const { data } = await supabase
    .from("restaurant_hours")
    .select("*")
    .eq("restaurant_id", restaurantId)
    .eq("day_of_week", dayOfWeek)
    .single()

  return data
}

export async function getHoursOverride(restaurantId: string, date: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from("restaurant_hours_override")
    .select("*")
    .eq("restaurant_id", restaurantId)
    .eq("override_date", date)
    .single()

  return data
}

function formatTimeForComparison(date: Date): string {
  return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}:00`
}

export async function isRestaurantOpenNow(restaurantId: string, now: Date): Promise<boolean> {
  const dayOfWeek = now.getDay()
  const currentTime = formatTimeForComparison(now)
  const dateStr = now.toISOString().split('T')[0]

  // Check for override first
  const override = await getHoursOverride(restaurantId, dateStr)
  const hours = override || await getRestaurantHours(restaurantId, dayOfWeek)

  if (!hours) return true // No hours set = always open (default)

  // Check each shift
  const shifts = [
    { open: hours.breakfast_open, close: hours.breakfast_close },
    { open: hours.lunch_open, close: hours.lunch_close },
    { open: hours.dinner_open, close: hours.dinner_close },
  ]

  for (const shift of shifts) {
    if (shift.open && shift.close) {
      if (currentTime >= shift.open && currentTime <= shift.close) {
        return true
      }
    }
  }

  // If all shifts are null/closed, assume open (no hours configured)
  const hasAnyShift = shifts.some(s => s.open && s.close)
  return !hasAnyShift
}

export async function isRestaurantAvailable(restaurant: Restaurant): Promise<{
  available: boolean
  reason?: string
}> {
  const now = new Date()

  // 1. Check platform status
  const platform = await getPlatformSettings()
  if (!platform) {
    return { available: false, reason: "Platform settings not configured" }
  }

  if (!platform.is_platform_open) {
    return { available: false, reason: "Platform is closed" }
  }

  if (platform.emergency_block_active) {
    return { available: false, reason: "Emergency block active" }
  }

  // 2. Check platform operating hours
  if (!isWithinOperatingHours(now, platform)) {
    return { available: false, reason: "Outside operating hours" }
  }

  // 3. Check if blocked_until has passed (auto-unblock)
  if (restaurant.blocked_until && new Date(restaurant.blocked_until) < now) {
    // Time has passed, should be unblocked - but we still check the flag
  }

  // 4. Check individual restaurant block
  if (restaurant.is_manually_blocked) {
    // Check if blocked_until has passed
    if (restaurant.blocked_until && new Date(restaurant.blocked_until) < now) {
      // Block has expired, should be unblocked automatically
      // This will be handled by a cron job or the next update
    } else {
      return { available: false, reason: "Restaurant is temporarily blocked" }
    }
  }

  // 5. Check POP bulk block (with override)
  if (restaurant.payment_type === 'pop' && platform.is_pop_blocked) {
    if (!restaurant.block_override) {
      return { available: false, reason: "All POP restaurants are currently blocked" }
    }
  }

  // 6. Check scheduled blocks
  const activeBlocks = await getActiveBlocks(restaurant.id, now)
  if (activeBlocks.length > 0) {
    return { available: false, reason: activeBlocks[0].reason || "Scheduled block active" }
  }

  // 7. Check restaurant's own operating hours
  const restaurantOpen = await isRestaurantOpenNow(restaurant.id, now)
  if (!restaurantOpen) {
    return { available: false, reason: "Restaurant is outside its operating hours" }
  }

  return { available: true }
}

export type { PlatformSettings, Restaurant }
