"use client"

import { useState, useEffect } from "react"
import { MapPin, Navigation, Loader2, ChevronDown } from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { AddressAutocomplete } from "./address-autocomplete"

const LOCATION_STORAGE_KEY = "foodnet_user_location"
const MODE_STORAGE_KEY = "foodnet_order_mode"

// Puerto Rico zip codes
const PUERTO_RICO_ZIP_CODES = [
  { zip: "00901", area: "Viejo San Juan" },
  { zip: "00907", area: "Condado" },
  { zip: "00909", area: "Santurce" },
  { zip: "00917", area: "Hato Rey" },
  { zip: "00918", area: "Hato Rey" },
  { zip: "00920", area: "Río Piedras" },
  { zip: "00923", area: "Cupey" },
  { zip: "00926", area: "Cupey Gardens" },
  { zip: "00949", area: "Toa Baja" },
  { zip: "00956", area: "Bayamón" },
  { zip: "00959", area: "Bayamón" },
  { zip: "00965", area: "Guaynabo" },
  { zip: "00968", area: "Guaynabo" },
  { zip: "00969", area: "Garden Hills" },
  { zip: "00976", area: "Trujillo Alto" },
  { zip: "00979", area: "Carolina" },
  { zip: "00983", area: "Isla Verde" },
]

export type OrderMode = "delivery" | "pickup"

export interface UserLocation {
  address: string
  lat: number
  lng: number
  zip?: string
}

interface LocationBarProps {
  onLocationChange: (location: UserLocation | null) => void
  onModeChange?: (mode: OrderMode) => void
  initialLocation?: UserLocation | null
  initialMode?: OrderMode
}

export function LocationBar({ 
  onLocationChange, 
  onModeChange,
  initialLocation, 
  initialMode = "delivery" 
}: LocationBarProps) {
  const [location, setLocation] = useState<UserLocation | null>(initialLocation || null)
  const [mode, setMode] = useState<OrderMode>(initialMode)
  const [isLoadingGeo, setIsLoadingGeo] = useState(false)
  const [addressValue, setAddressValue] = useState("")
  const [isLocationPopoverOpen, setIsLocationPopoverOpen] = useState(false)

  // Load from localStorage on mount
  useEffect(() => {
    const savedLocation = localStorage.getItem(LOCATION_STORAGE_KEY)
    const savedMode = localStorage.getItem(MODE_STORAGE_KEY) as OrderMode | null
    
    if (savedLocation) {
      try {
        const parsed = JSON.parse(savedLocation)
        setLocation(parsed)
        onLocationChange(parsed)
      } catch (e) {
        console.error("Failed to parse saved location", e)
      }
    }
    
    if (savedMode) {
      setMode(savedMode)
      onModeChange?.(savedMode)
    }
  }, [])

  const handleModeChange = (newMode: OrderMode) => {
    setMode(newMode)
    localStorage.setItem(MODE_STORAGE_KEY, newMode)
    onModeChange?.(newMode)
  }

  const handleLocationSet = (newLocation: UserLocation) => {
    setLocation(newLocation)
    localStorage.setItem(LOCATION_STORAGE_KEY, JSON.stringify(newLocation))
    onLocationChange(newLocation)
    setIsLocationPopoverOpen(false)
    setAddressValue("")
  }

  const handleUseMyLocation = async () => {
    if (!navigator.geolocation) {
      alert("Tu navegador no soporta geolocalización")
      return
    }

    setIsLoadingGeo(true)
    
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords
        
        try {
          const response = await fetch(`/api/places/reverse-geocode?lat=${latitude}&lng=${longitude}`)
          const data = await response.json()
          
          if (data.address) {
            handleLocationSet({
              address: data.address,
              lat: latitude,
              lng: longitude,
            })
          } else {
            handleLocationSet({
              address: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
              lat: latitude,
              lng: longitude,
            })
          }
        } catch (error) {
          handleLocationSet({
            address: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
            lat: latitude,
            lng: longitude,
          })
        }
        setIsLoadingGeo(false)
      },
      (error) => {
        console.error("Geolocation error:", error)
        alert("No pudimos obtener tu ubicación. Por favor ingresa tu dirección manualmente.")
        setIsLoadingGeo(false)
      },
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }

  const handleZipSelect = async (zip: string) => {
    const zipData = PUERTO_RICO_ZIP_CODES.find((z) => z.zip === zip)
    if (!zipData) return
    
    try {
      const response = await fetch(`/api/places/geocode?address=${zip}, Puerto Rico`)
      const data = await response.json()
      
      if (data.lat && data.lng) {
        handleLocationSet({
          address: `${zipData.area}, PR ${zip}`,
          lat: data.lat,
          lng: data.lng,
          zip: zip,
        })
      }
    } catch (error) {
      console.error("Error geocoding zip:", error)
    }
  }

  return (
    <>
      {/* Delivery / Pickup Toggle - Uber Eats style pill */}
      <div className="flex items-center bg-slate-100 rounded-full p-0.5">
        <button
          onClick={() => handleModeChange("delivery")}
          className={`px-4 py-1.5 text-sm font-medium rounded-full transition-all ${
            mode === "delivery"
              ? "bg-black text-white"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          Delivery
        </button>
        <button
          onClick={() => handleModeChange("pickup")}
          className={`px-4 py-1.5 text-sm font-medium rounded-full transition-all ${
            mode === "pickup"
              ? "bg-black text-white"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          Pickup
        </button>
      </div>

      {/* Location Button/Dropdown - Uber Eats style */}
      <Popover open={isLocationPopoverOpen} onOpenChange={setIsLocationPopoverOpen}>
        <PopoverTrigger asChild>
          <button className="flex items-center gap-1 px-2 py-1.5 hover:bg-slate-100 rounded-full transition-colors min-w-0">
            <MapPin className="w-4 h-4 text-slate-900 flex-shrink-0" />
            <span className="text-sm text-slate-900 truncate max-w-[160px]">
              {location?.address || "Ingresa dirección"}
            </span>
            <ChevronDown className="w-4 h-4 text-slate-500 flex-shrink-0" />
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-4" align="start">
          <div className="space-y-4">
            {/* Use My Location Button */}
            <button
              onClick={handleUseMyLocation}
              disabled={isLoadingGeo}
              className="w-full flex items-center gap-3 px-4 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-lg transition-colors disabled:opacity-50"
            >
              {isLoadingGeo ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Navigation className="w-5 h-5" />
              )}
              <span className="font-medium">
                {isLoadingGeo ? "Buscando..." : "Usar mi ubicación"}
              </span>
            </button>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-slate-500">o ingresa</span>
              </div>
            </div>

            {/* Address Input */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Dirección</label>
              <AddressAutocomplete
                placeholder="Calle, número, ciudad..."
                value={addressValue}
                onChange={setAddressValue}
                onAddressSelected={async (components) => {
                  const fullAddress = `${components.streetAddress}, ${components.city}, ${components.state} ${components.zip}`
                  try {
                    const response = await fetch(`/api/places/geocode?address=${encodeURIComponent(fullAddress)}`)
                    const data = await response.json()
                    if (data.lat && data.lng) {
                      handleLocationSet({
                        address: fullAddress,
                        lat: data.lat,
                        lng: data.lng,
                        zip: components.zip,
                      })
                    }
                  } catch (error) {
                    console.error("Error geocoding address:", error)
                  }
                }}
                className="w-full"
              />
            </div>

            {/* Zip Code Select */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Código Postal</label>
              <Select onValueChange={handleZipSelect}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecciona código postal" />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  {PUERTO_RICO_ZIP_CODES.map((z) => (
                    <SelectItem key={z.zip} value={z.zip}>
                      {z.zip} - {z.area}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </>
  )
}
