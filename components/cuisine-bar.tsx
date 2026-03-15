"use client"

import { useRef, useState } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import Image from "next/image"

type CuisineType = {
  id: string
  name: string
  icon_url: string | null
  display_order: number
}

interface CuisineBarProps {
  selectedCuisine: string
  onCuisineChange: (cuisine: string) => void
  cuisineTypes: CuisineType[]
}

export function CuisineBar({ selectedCuisine, onCuisineChange, cuisineTypes }: CuisineBarProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [showLeftArrow, setShowLeftArrow] = useState(false)
  const [showRightArrow, setShowRightArrow] = useState(true)

  const handleScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current
      setShowLeftArrow(scrollLeft > 0)
      setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 10)
    }
  }

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const scrollAmount = 200
      scrollRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      })
    }
  }

  // If no cuisine selected, all restaurants show (no filtering needed)
  // Clicking a cuisine filters, clicking it again deselects (goes back to "all")
  const handleCuisineClick = (cuisineName: string) => {
    if (selectedCuisine === cuisineName) {
      // Clicking selected cuisine deselects it (show all)
      onCuisineChange("all")
    } else {
      onCuisineChange(cuisineName)
    }
  }

  return (
    <div className="relative bg-white border-b border-slate-100">
      <div className="mx-auto max-w-6xl px-3 sm:px-6">
        {/* Left Arrow - hidden on mobile, uses touch scroll */}
        {showLeftArrow && (
          <button
            onClick={() => scroll("left")}
            className="absolute left-1 sm:left-2 top-1/2 -translate-y-1/2 z-10 bg-white shadow-md rounded-full p-1 sm:p-1.5 hover:bg-slate-50 transition-colors hidden sm:block"
            aria-label="Scroll left"
          >
            <ChevronLeft className="w-4 h-4 text-slate-600" />
          </button>
        )}

        {/* Scrollable Cuisine Icons */}
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="flex items-center gap-1 sm:gap-4 overflow-x-auto scrollbar-hide py-3 sm:py-4 -mx-1 px-1"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {cuisineTypes.map((cuisine) => {
            const isSelected = selectedCuisine === cuisine.name
            return (
              <button
                key={cuisine.id}
                onClick={() => handleCuisineClick(cuisine.name)}
                className={`flex flex-col items-center gap-0.5 sm:gap-1 transition-all flex-shrink-0 group px-1.5 sm:px-2 py-1 rounded-lg ${
                  isSelected
                    ? "bg-slate-100 ring-2 ring-amber-500"
                    : "hover:bg-slate-50"
                }`}
              >
                {/* Image */}
                <div className="relative w-12 h-12 sm:w-16 sm:h-16 flex items-center justify-center rounded-lg overflow-hidden bg-slate-50">
                  {cuisine.icon_url ? (
                    <Image
                      src={cuisine.icon_url}
                      alt={cuisine.name}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  ) : (
                    <span className="text-lg font-bold text-slate-300">
                      {cuisine.name.charAt(0)}
                    </span>
                  )}
                </div>
                {/* Label */}
                <span 
                  className={`text-[10px] sm:text-xs font-medium whitespace-nowrap transition-colors ${
                    isSelected
                      ? "text-slate-900"
                      : "text-slate-500 group-hover:text-slate-900"
                  }`}
                >
                  {cuisine.name}
                </span>
              </button>
            )
          })}
        </div>

        {/* Right Arrow - hidden on mobile, uses touch scroll */}
        {showRightArrow && (
          <button
            onClick={() => scroll("right")}
            className="absolute right-1 sm:right-2 top-1/2 -translate-y-1/2 z-10 bg-white shadow-md rounded-full p-1 sm:p-1.5 hover:bg-slate-50 transition-colors hidden sm:block"
            aria-label="Scroll right"
          >
            <ChevronRight className="w-4 h-4 text-slate-600" />
          </button>
        )}
      </div>
    </div>
  )
}
