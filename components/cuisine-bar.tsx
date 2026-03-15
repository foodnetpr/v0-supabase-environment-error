"use client"

import { useRef, useState } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import Image from "next/image"

// Cuisine types with image icons
const CUISINE_TYPES = [
  { id: "all", name: "Todos", icon: "/cuisine-icons/internacional.png" },
  { id: "puertorriquena", name: "Puertorriqueña", icon: "/cuisine-icons/puertorriquena.png" },
  { id: "italiana", name: "Italiana", icon: "/cuisine-icons/italiana.png" },
  { id: "mexicana", name: "Mexicana", icon: "/cuisine-icons/mexicana.png" },
  { id: "argentina", name: "Argentina", icon: "/cuisine-icons/argentina.png" },
  { id: "espanola", name: "Española", icon: "/cuisine-icons/espanola.png" },
  { id: "colombiana", name: "Colombiana", icon: "/cuisine-icons/colombiana.png" },
  { id: "india", name: "India", icon: "/cuisine-icons/india.png" },
  { id: "americana", name: "Americana", icon: "/cuisine-icons/hamburgers.png" },
  { id: "hamburgers", name: "Hamburgers", icon: "/cuisine-icons/hamburgers.png" },
  { id: "sandwiches", name: "Sandwiches", icon: "/cuisine-icons/sandwiches.png" },
  { id: "pollo", name: "Pollo", icon: "/cuisine-icons/pollo.png" },
  { id: "alitas", name: "Alitas", icon: "/cuisine-icons/alitas.png" },
  { id: "bbq", name: "BBQ", icon: "/cuisine-icons/bbq.png" },
  { id: "steakhouse", name: "Steakhouse", icon: "/cuisine-icons/steakhouse.png" },
  { id: "internacional", name: "Internacional", icon: "/cuisine-icons/internacional.png" },
  { id: "bubble_tea", name: "Bubble Tea", icon: "/cuisine-icons/bubble_tea.png" },
]

interface CuisineBarProps {
  selectedCuisine: string
  onCuisineChange: (cuisine: string) => void
  availableCuisines?: string[]
}

export function CuisineBar({ selectedCuisine, onCuisineChange, availableCuisines }: CuisineBarProps) {
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

  // Filter to only show cuisines that have restaurants, plus "all"
  const displayCuisines = CUISINE_TYPES.filter(
    (c) => c.id === "all" || !availableCuisines || availableCuisines.some(
      (ac) => ac?.toLowerCase().includes(c.id) || c.name.toLowerCase().includes(ac?.toLowerCase() || "")
    )
  )

  return (
    <div className="relative bg-white border-b border-slate-100">
      <div className="mx-auto max-w-6xl px-6">
        {/* Left Arrow */}
        {showLeftArrow && (
          <button
            onClick={() => scroll("left")}
            className="absolute left-2 top-1/2 -translate-y-1/2 z-10 bg-white shadow-md rounded-full p-1.5 hover:bg-slate-50 transition-colors"
            aria-label="Scroll left"
          >
            <ChevronLeft className="w-4 h-4 text-slate-600" />
          </button>
        )}

        {/* Scrollable Cuisine Icons */}
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="flex items-center gap-4 overflow-x-auto scrollbar-hide py-4"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {displayCuisines.map((cuisine) => (
            <button
              key={cuisine.id}
              onClick={() => onCuisineChange(cuisine.id)}
              className={`flex flex-col items-center gap-2 transition-all flex-shrink-0 group`}
            >
              {/* Image container */}
              <div 
                className={`relative w-16 h-16 rounded-full overflow-hidden transition-all ${
                  selectedCuisine === cuisine.id
                    ? "ring-2 ring-slate-900 ring-offset-2"
                    : "group-hover:ring-2 group-hover:ring-slate-300 group-hover:ring-offset-1"
                }`}
              >
                <Image
                  src={cuisine.icon}
                  alt={cuisine.name}
                  fill
                  className="object-cover"
                  sizes="64px"
                />
              </div>
              {/* Label */}
              <span 
                className={`text-xs font-medium whitespace-nowrap transition-colors ${
                  selectedCuisine === cuisine.id
                    ? "text-slate-900"
                    : "text-slate-600 group-hover:text-slate-900"
                }`}
              >
                {cuisine.name}
              </span>
            </button>
          ))}
        </div>

        {/* Right Arrow */}
        {showRightArrow && (
          <button
            onClick={() => scroll("right")}
            className="absolute right-2 top-1/2 -translate-y-1/2 z-10 bg-white shadow-md rounded-full p-1.5 hover:bg-slate-50 transition-colors"
            aria-label="Scroll right"
          >
            <ChevronRight className="w-4 h-4 text-slate-600" />
          </button>
        )}
      </div>
    </div>
  )
}
