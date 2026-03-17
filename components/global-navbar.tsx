"use client"

import Link from "next/link"
import Image from "next/image"
import { LocationBar, type UserLocation, type OrderMode } from "./location-bar"
import { CartPopover } from "./cart-popover"
import { useState, useEffect } from "react"
import { Menu, X, User } from "lucide-react"

interface GlobalNavbarProps {
  showLocationBar?: boolean
  showModeToggle?: boolean
  onLocationChange?: (location: UserLocation | null) => void
  onModeChange?: (mode: OrderMode) => void
}

export function GlobalNavbar({
  showLocationBar = true,
  showModeToggle = true,
  onLocationChange,
  onModeChange,
}: GlobalNavbarProps) {
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null)
  const [orderMode, setOrderMode] = useState<OrderMode>("delivery")
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // Load from localStorage
  useEffect(() => {
    const storedLocation = localStorage.getItem("foodnetpr_user_location")
    const storedMode = localStorage.getItem("foodnetpr_order_mode")
    
    if (storedLocation) {
      try {
        setUserLocation(JSON.parse(storedLocation))
      } catch (e) {
        console.error("Error loading location:", e)
      }
    }
    
    if (storedMode === "pickup" || storedMode === "delivery") {
      setOrderMode(storedMode)
    }
  }, [])

  const handleLocationChange = (location: UserLocation | null) => {
    setUserLocation(location)
    if (location) {
      localStorage.setItem("foodnetpr_user_location", JSON.stringify(location))
    } else {
      localStorage.removeItem("foodnetpr_user_location")
    }
    onLocationChange?.(location)
  }

  const handleModeChange = (mode: OrderMode) => {
    setOrderMode(mode)
    localStorage.setItem("foodnetpr_order_mode", mode)
    onModeChange?.(mode)
  }

  return (
    <div id="global-navbar">
      {/* Thin spacer bar for breathing room - hidden on mobile */}
      <div className="h-2 bg-slate-100 hidden sm:block" />
      
      {/* Main navigation bar */}
      <nav className="sticky top-0 z-50 border-b border-slate-200 bg-white">
        {/* Desktop Layout */}
        <div className="hidden md:flex mx-auto max-w-7xl items-center px-4 py-2 gap-3">
          {/* Logo */}
          <Link href="/" className="flex items-center flex-shrink-0">
            <Image
              src="/foodnetpr-logo.png"
              alt="FoodNetPR Delivery"
              width={160}
              height={56}
              className="h-10 w-auto"
            />
          </Link>

          {/* Location Bar - only show if enabled */}
          {showLocationBar && (
            <LocationBar 
              onLocationChange={handleLocationChange}
              onModeChange={handleModeChange}
              initialLocation={userLocation}
              initialMode={orderMode}
              showModeToggle={showModeToggle}
            />
          )}

          {/* Right side: Cart, Login, Sign up */}
          <div className="flex items-center gap-2 ml-auto">
            {/* Cart with Popover */}
            <CartPopover />

            {/* Login */}
            <Link
              href="/auth/login"
              className="px-4 py-1.5 text-sm font-medium text-slate-700 hover:text-slate-900 transition-colors"
            >
              Log in
            </Link>

            {/* Sign up */}
            <Link
              href="/auth/register"
              className="px-4 py-1.5 text-sm font-medium bg-black text-white rounded-full hover:bg-slate-800 transition-colors"
            >
              Sign up
            </Link>
          </div>
        </div>

        {/* Mobile Layout */}
        <div className="md:hidden">
          {/* Top row: Logo, Cart, Menu */}
          <div className="flex items-center justify-between px-3 py-2">
            <Link href="/" className="flex items-center">
              <Image
                src="/foodnetpr-logo.png"
                alt="FoodNetPR"
                width={120}
                height={40}
                className="h-8 w-auto"
              />
            </Link>
            
            <div className="flex items-center gap-2">
              <CartPopover />
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
                aria-label="Menu"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Mobile Location Bar - Simplified */}
          {showLocationBar && (
            <div className="px-3 pb-2">
              <LocationBar 
                onLocationChange={handleLocationChange}
                onModeChange={handleModeChange}
                initialLocation={userLocation}
                initialMode={orderMode}
                showModeToggle={showModeToggle}
                isMobile={true}
              />
            </div>
          )}

          {/* Mobile Menu Dropdown */}
          {mobileMenuOpen && (
            <div className="border-t border-slate-200 bg-white px-3 py-3 space-y-2">
              <Link
                href="/auth/login"
                className="flex items-center gap-2 px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                <User className="w-4 h-4" />
                Iniciar sesión
              </Link>
              <Link
                href="/auth/register"
                className="block px-3 py-2.5 text-sm font-medium text-center bg-black text-white rounded-lg hover:bg-slate-800 transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                Crear cuenta
              </Link>
            </div>
          )}
        </div>
      </nav>
    </div>
  )
}
