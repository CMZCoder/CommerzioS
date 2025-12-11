"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Home,
  Heart,
  GraduationCap,
  PartyPopper,
  Monitor,
  Car,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  Star,
  MapPin,
  Clock,
  Wrench,
  Paintbrush,
  Zap,
  Droplets,
  Wind,
  Dumbbell,
  Sparkles,
  Stethoscope,
  Brain,
  Apple,
  BookOpen,
  Languages,
  Music,
  Calculator,
  Camera,
  Cake,
  Mic,
  Users,
  Laptop,
  Smartphone,
  Wifi,
  HardDrive,
  Truck,
  Bike,
  Package,
  Shield,
  Search,
  type LucideIcon,
} from "lucide-react"

function Icon({ icon: IconComponent, className }: { icon: LucideIcon; className?: string }) {
  return <IconComponent className={className} />
}

interface Subcategory {
  id: string
  name: string
  icon: LucideIcon
  count: number
}

interface Category {
  id: string
  name: string
  icon: LucideIcon
  color: string
  subcategories: Subcategory[]
}

const categories: Category[] = [
  {
    id: "home-services",
    name: "Home Services",
    icon: Home,
    color: "from-primary to-accent",
    subcategories: [
      { id: "plumbing", name: "Plumbing", icon: Droplets, count: 234 },
      { id: "electrical", name: "Electrical", icon: Zap, count: 189 },
      { id: "painting", name: "Painting", icon: Paintbrush, count: 156 },
      { id: "hvac", name: "HVAC", icon: Wind, count: 98 },
      { id: "repairs", name: "General Repairs", icon: Wrench, count: 312 },
      { id: "cleaning", name: "Cleaning", icon: Sparkles, count: 445 },
    ],
  },
  {
    id: "health-wellness",
    name: "Health & Wellness",
    icon: Heart,
    color: "from-accent to-success",
    subcategories: [
      { id: "fitness", name: "Personal Training", icon: Dumbbell, count: 156 },
      { id: "massage", name: "Massage Therapy", icon: Heart, count: 203 },
      { id: "nutrition", name: "Nutrition", icon: Apple, count: 89 },
      { id: "mental-health", name: "Mental Health", icon: Brain, count: 124 },
      { id: "physiotherapy", name: "Physiotherapy", icon: Stethoscope, count: 67 },
    ],
  },
  {
    id: "education",
    name: "Education",
    icon: GraduationCap,
    color: "from-success to-primary",
    subcategories: [
      { id: "tutoring", name: "Academic Tutoring", icon: BookOpen, count: 287 },
      { id: "languages", name: "Language Lessons", icon: Languages, count: 198 },
      { id: "music", name: "Music Lessons", icon: Music, count: 145 },
      { id: "math", name: "Math & Science", icon: Calculator, count: 176 },
    ],
  },
  {
    id: "events",
    name: "Events",
    icon: PartyPopper,
    color: "from-primary to-accent",
    subcategories: [
      { id: "photography", name: "Photography", icon: Camera, count: 234 },
      { id: "catering", name: "Catering", icon: Cake, count: 156 },
      { id: "dj", name: "DJ & Music", icon: Mic, count: 89 },
      { id: "planning", name: "Event Planning", icon: Users, count: 67 },
    ],
  },
  {
    id: "tech-support",
    name: "Tech Support",
    icon: Monitor,
    color: "from-accent to-primary",
    subcategories: [
      { id: "computer", name: "Computer Repair", icon: Laptop, count: 178 },
      { id: "phone", name: "Phone Repair", icon: Smartphone, count: 145 },
      { id: "network", name: "Network Setup", icon: Wifi, count: 89 },
      { id: "data", name: "Data Recovery", icon: HardDrive, count: 56 },
    ],
  },
  {
    id: "automotive",
    name: "Automotive",
    icon: Car,
    color: "from-success to-accent",
    subcategories: [
      { id: "mechanics", name: "Mechanics", icon: Wrench, count: 234 },
      { id: "delivery", name: "Delivery Services", icon: Truck, count: 189 },
      { id: "courier", name: "Bike Courier", icon: Bike, count: 145 },
      { id: "moving", name: "Moving Services", icon: Package, count: 98 },
    ],
  },
  {
    id: "security",
    name: "Security",
    icon: Shield,
    color: "from-primary to-success",
    subcategories: [
      { id: "home-security", name: "Home Security", icon: Home, count: 89 },
      { id: "surveillance", name: "Surveillance", icon: Monitor, count: 67 },
      { id: "guards", name: "Security Guards", icon: Users, count: 45 },
    ],
  },
]

const mockProviders = [
  {
    id: 1,
    name: "ProFix Solutions",
    rating: 4.9,
    reviews: 234,
    price: "$$",
    location: "Downtown",
    image: "/professional-handyman.jpg",
    availability: "Available today",
    verified: true,
  },
  {
    id: 2,
    name: "QuickServe Pro",
    rating: 4.7,
    reviews: 189,
    price: "$$$",
    location: "Midtown",
    image: "/service-professional.jpg",
    availability: "Next available: Tomorrow",
    verified: true,
  },
  {
    id: 3,
    name: "Elite Services",
    rating: 4.8,
    reviews: 312,
    price: "$$",
    location: "Uptown",
    image: "/expert-technician.jpg",
    availability: "Available today",
    verified: false,
  },
  {
    id: 4,
    name: "Swift Solutions",
    rating: 4.6,
    reviews: 156,
    price: "$",
    location: "Suburbs",
    image: "/friendly-service-worker.jpg",
    availability: "Available now",
    verified: true,
  },
]

export function StickyCategoryNav() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>(null)
  const [isSticky, setIsSticky] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [dropdownPosition, setDropdownPosition] = useState({ left: 0 })
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)
  const [searchingCategoryOnly, setSearchingCategoryOnly] = useState(false)

  const navRef = useRef<HTMLDivElement>(null)
  const stickyRef = useRef<HTMLDivElement>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const categoryButtonRefs = useRef<{ [key: string]: HTMLButtonElement | null }>({})
  const dropdownRef = useRef<HTMLDivElement>(null)

  const activeCategory = categories.find((c) => c.id === selectedCategory)
  const activeSubcategory = activeCategory?.subcategories.find((s) => s.id === selectedSubcategory)

  const checkScroll = useCallback(() => {
    const container = scrollContainerRef.current
    if (container) {
      const { scrollLeft, scrollWidth, clientWidth } = container
      setCanScrollLeft(scrollLeft > 5)
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 5)
    }
  }, [])

  useEffect(() => {
    const container = scrollContainerRef.current
    if (container) {
      checkScroll()
      container.addEventListener("scroll", checkScroll)

      const resizeObserver = new ResizeObserver(() => {
        checkScroll()
      })
      resizeObserver.observe(container)

      return () => {
        container.removeEventListener("scroll", checkScroll)
        resizeObserver.disconnect()
      }
    }
  }, [checkScroll])

  useEffect(() => {
    const handleScroll = () => {
      if (navRef.current) {
        const rect = navRef.current.getBoundingClientRect()
        const shouldBeSticky = rect.top <= 0
        setIsSticky(shouldBeSticky)

        if (!shouldBeSticky && dropdownOpen) {
          setDropdownOpen(false)
        }
      }
    }

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [dropdownOpen])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        const clickedOnCategoryButton = Object.values(categoryButtonRefs.current).some(
          (btn) => btn && btn.contains(event.target as Node),
        )
        if (!clickedOnCategoryButton) {
          setDropdownOpen(false)
        }
      }
    }

    if (dropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside)
      return () => document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [dropdownOpen])

  const scroll = (direction: "left" | "right") => {
    const container = scrollContainerRef.current
    if (container) {
      const scrollAmount = 200
      container.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      })
    }
  }

  const handleCategoryClick = (categoryId: string, buttonElement: HTMLButtonElement) => {
    if (selectedCategory === categoryId) {
      if (isSticky) {
        setDropdownOpen(!dropdownOpen)
      } else {
        setSelectedCategory(null)
        setSelectedSubcategory(null)
        setShowResults(false)
        setSearchingCategoryOnly(false)
      }
    } else {
      setSelectedCategory(categoryId)
      setSelectedSubcategory(null)
      setShowResults(false)
      setSearchingCategoryOnly(false)

      if (isSticky) {
        const rect = buttonElement.getBoundingClientRect()
        const dropdownWidth = 280
        let leftPos = rect.left

        if (leftPos + dropdownWidth > window.innerWidth - 16) {
          leftPos = window.innerWidth - dropdownWidth - 16
        }
        if (leftPos < 16) {
          leftPos = 16
        }

        setDropdownPosition({ left: leftPos })
        setDropdownOpen(true)
      }
    }
  }

  const handleSubcategoryClick = (subcategoryId: string) => {
    setSelectedSubcategory(subcategoryId)
    setShowResults(true)
    setDropdownOpen(false)
    setSearchingCategoryOnly(false)
  }

  const handleSearchCategoryOnly = () => {
    setSelectedSubcategory(null)
    setShowResults(true)
    setDropdownOpen(false)
    setSearchingCategoryOnly(true)
  }

  const clearSelection = () => {
    setSelectedCategory(null)
    setSelectedSubcategory(null)
    setShowResults(false)
    setDropdownOpen(false)
    setSearchingCategoryOnly(false)
  }

  return (
    <div ref={navRef} className="relative">
      {/* Placeholder to prevent layout shift */}
      {isSticky && <div className="h-[52px]" />}

      {/* Main sticky navigation */}
      <div
        ref={stickyRef}
        className={`
          w-full bg-background/95 backdrop-blur-md border-b border-border/50 z-50
          transition-all duration-300
          ${isSticky ? "fixed top-0 left-0 right-0 shadow-lg" : "relative"}
        `}
      >
        <div className="container mx-auto px-4">
          <div className="relative flex items-center h-[52px] px-10">
            <div
              className={`absolute -left-8 z-30 transition-all duration-300 ${
                canScrollLeft ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-2 pointer-events-none"
              }`}
            >
              <button
                onClick={() => scroll("left")}
                className="relative w-8 h-8 rounded-full bg-card border border-border/80 flex items-center justify-center
                  hover:border-primary/50 hover:scale-105 transition-all duration-200 group"
                aria-label="Scroll left"
              >
                <div className="absolute inset-0 rounded-full bg-primary/10 animate-pulse" />
                <div className="absolute inset-0 rounded-full bg-card border border-border/80" />
                <ChevronLeft className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors relative z-10" />
              </button>
            </div>

            {/* Scrollable categories - reduced px from 2 to 1 */}
            <div
              ref={scrollContainerRef}
              className="flex items-center gap-1 overflow-x-auto px-1 flex-1"
              style={{
                scrollbarWidth: "none",
                msOverflowStyle: "none",
              }}
            >
              <style jsx>{`
                div::-webkit-scrollbar {
                  display: none;
                }
              `}</style>
              {categories.map((category) => (
                <button
                  key={category.id}
                  ref={(el) => {
                    categoryButtonRefs.current[category.id] = el
                  }}
                  onClick={(e) => handleCategoryClick(category.id, e.currentTarget)}
                  className={`
                    flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap
                    border transition-all duration-200
                    ${
                      selectedCategory === category.id
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-card/50 text-muted-foreground border-border/50 hover:bg-card hover:text-foreground hover:border-border"
                    }
                  `}
                >
                  <Icon icon={category.icon} className="h-3.5 w-3.5" />
                  <span>{category.name}</span>
                  <ChevronDown
                    className={`h-3 w-3 transition-transform duration-200 ${
                      selectedCategory === category.id && dropdownOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>
              ))}
            </div>

            <div
              className={`absolute -right-8 z-30 transition-all duration-300 ${
                canScrollRight ? "opacity-100 translate-x-0" : "opacity-0 translate-x-2 pointer-events-none"
              }`}
            >
              <button
                onClick={() => scroll("right")}
                className="relative w-8 h-8 rounded-full bg-card border border-border/80 flex items-center justify-center
                  hover:border-primary/50 hover:scale-105 transition-all duration-200 group"
                aria-label="Scroll right"
              >
                <div className="absolute inset-0 rounded-full bg-primary/10 animate-pulse" />
                <div className="absolute inset-0 rounded-full bg-card border border-border/80" />
                <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors relative z-10" />
              </button>
            </div>

            {/* Clear selection button */}
            {selectedCategory && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearSelection}
                className="ml-2 text-xs text-muted-foreground hover:text-foreground shrink-0"
              >
                Clear
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Sticky dropdown - rendered as fixed position portal */}
      {isSticky && dropdownOpen && activeCategory && (
        <div
          ref={dropdownRef}
          className="fixed z-[100] animate-in fade-in slide-in-from-top-2 duration-200"
          style={{
            top: "52px",
            left: dropdownPosition.left,
          }}
        >
          <div className="bg-popover border border-border rounded-xl shadow-xl w-[280px] overflow-hidden">
            <div className="p-2 border-b border-border/50 bg-muted/30">
              <div className="flex items-center justify-between px-2">
                <span className="text-xs font-medium text-muted-foreground">Select a service</span>
                <Badge variant="secondary" className="text-[10px]">
                  {activeCategory.subcategories.length} options
                </Badge>
              </div>
            </div>
            {/* Browse all category button */}
            <button
              onClick={handleSearchCategoryOnly}
              className="w-full flex items-center justify-between gap-2 px-3 py-2.5 text-sm bg-primary/5 hover:bg-primary/10 transition-colors text-left border-b border-border/30"
            >
              <div className="flex items-center gap-2.5">
                <Search className="h-4 w-4 text-primary" />
                <span className="text-primary font-medium">Browse all {activeCategory.name}</span>
              </div>
              <ChevronRight className="h-3.5 w-3.5 text-primary" />
            </button>
            <div className="p-1.5 max-h-[320px] overflow-y-auto">
              {activeCategory.subcategories.map((sub) => (
                <button
                  key={sub.id}
                  onClick={() => handleSubcategoryClick(sub.id)}
                  className="w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-lg text-sm hover:bg-muted transition-colors text-left group"
                >
                  <div className="flex items-center gap-2.5">
                    <Icon
                      icon={sub.icon}
                      className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors"
                    />
                    <span className="group-hover:text-primary transition-colors">{sub.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full">
                      {sub.count}
                    </span>
                    <ChevronRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Non-sticky subcategory panel */}
      {!isSticky && selectedCategory && activeCategory && (
        <div className="bg-muted/30 border-b border-border/30 animate-in slide-in-from-top-2 duration-300">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Choose a service in</span>
                <Badge variant="secondary" className="font-medium text-xs">
                  {activeCategory.name}
                </Badge>
              </div>
              {/* Browse all category button for non-sticky mode */}
              <Button
                variant="outline"
                size="sm"
                onClick={handleSearchCategoryOnly}
                className="text-xs h-7 gap-1.5 border-primary/30 text-primary hover:bg-primary/5 bg-transparent"
              >
                <Search className="h-3 w-3" />
                Browse all {activeCategory.name}
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {activeCategory.subcategories.map((sub) => (
                <button
                  key={sub.id}
                  onClick={() => handleSubcategoryClick(sub.id)}
                  className={`
                    flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium 
                    transition-all duration-200 border
                    ${
                      selectedSubcategory === sub.id
                        ? "bg-primary text-primary-foreground border-primary shadow-md"
                        : "bg-background hover:bg-muted border-border/50 hover:border-primary/30"
                    }
                  `}
                >
                  <Icon icon={sub.icon} className="h-3.5 w-3.5" />
                  <span>{sub.name}</span>
                  <span
                    className={`text-xs px-1.5 py-0.5 rounded-full ${
                      selectedSubcategory === sub.id ? "bg-primary-foreground/20" : "bg-muted"
                    }`}
                  >
                    {sub.count}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Results section */}
      {showResults && activeCategory && (
        <div className="bg-background border-b border-border animate-in fade-in duration-300">
          <div className="container mx-auto px-4 py-6">
            {/* Results header */}
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold">
                  {searchingCategoryOnly
                    ? `${activeCategory.name} Services`
                    : `${activeSubcategory?.name || ""} Services`}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {searchingCategoryOnly
                    ? `${activeCategory.subcategories.reduce((acc, s) => acc + s.count, 0)} providers across all subcategories`
                    : `${activeSubcategory?.count || 0} providers available in your area`}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" className="text-xs bg-transparent">
                  Filters
                </Button>
                <Button variant="outline" size="sm" className="text-xs bg-transparent">
                  Sort by: Recommended
                </Button>
              </div>
            </div>

            {/* Results grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {mockProviders.map((provider) => (
                <Card key={provider.id} className="group hover:shadow-lg transition-all duration-300 overflow-hidden">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3 mb-3">
                      <div className="w-14 h-14 rounded-xl bg-muted overflow-hidden shrink-0">
                        <img
                          src={provider.image || "/placeholder.svg"}
                          alt={provider.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <h4 className="font-semibold text-sm truncate">{provider.name}</h4>
                          {provider.verified && (
                            <Badge variant="secondary" className="text-[9px] px-1 py-0 shrink-0">
                              Verified
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                          <span className="font-medium text-foreground">{provider.rating}</span>
                          <span>({provider.reviews})</span>
                          <span className="mx-1">•</span>
                          <span>{provider.price}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        <span>{provider.location}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span className="text-green-500">{provider.availability}</span>
                      </div>
                    </div>
                    <Button size="sm" className="w-full text-xs h-8">
                      Book Now
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Load more */}
            <div className="flex justify-center mt-6">
              <Button variant="outline" className="gap-2 bg-transparent">
                Load more results
                <ChevronDown className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
