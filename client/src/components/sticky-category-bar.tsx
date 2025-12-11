import { useState, useEffect, useRef, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
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
  ChevronUp,
  Sparkles,
  Wrench,
  Paintbrush,
  Zap,
  Droplets,
  Wind,
  Dumbbell,
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
  Briefcase,
  Palette,
  PawPrint,
  Scale,
  type LucideIcon,
} from "lucide-react";
import type { CategoryWithTemporary } from "@/lib/api";
import type { Subcategory } from "@shared/schema";

// Icon mapping for categories by slug/name
const categoryIconMap: Record<string, LucideIcon> = {
  "home-services": Home,
  "home": Home,
  "health-wellness": Heart,
  "wellness-fitness": Dumbbell,
  "health": Heart,
  "education": GraduationCap,
  "education-tutoring": BookOpen,
  "events": PartyPopper,
  "tech-support": Monitor,
  "tech": Monitor,
  "automotive": Car,
  "automotive-services": Car,
  "security": Shield,
  "business": Briefcase,
  "business-support": Briefcase,
  "design": Palette,
  "design-creative": Palette,
  "creative": Palette,
  "pet-care": PawPrint,
  "pets": PawPrint,
  "legal": Scale,
  "legal-financial": Scale,
};

// Icon mapping for subcategories
const subcategoryIconMap: Record<string, LucideIcon> = {
  "plumbing": Droplets,
  "electrical": Zap,
  "painting": Paintbrush,
  "hvac": Wind,
  "repairs": Wrench,
  "cleaning": Sparkles,
  "fitness": Dumbbell,
  "massage": Heart,
  "nutrition": Apple,
  "mental-health": Brain,
  "physiotherapy": Stethoscope,
  "tutoring": BookOpen,
  "languages": Languages,
  "music": Music,
  "math": Calculator,
  "photography": Camera,
  "catering": Cake,
  "dj": Mic,
  "planning": Users,
  "computer": Laptop,
  "phone": Smartphone,
  "network": Wifi,
  "data": HardDrive,
  "mechanics": Wrench,
  "delivery": Truck,
  "courier": Bike,
  "moving": Package,
  "home-security": Home,
  "surveillance": Monitor,
  "guards": Users,
};

function getCategoryIcon(category: CategoryWithTemporary): LucideIcon {
  const slug = category.slug?.toLowerCase() || category.name.toLowerCase().replace(/\s+/g, '-');
  return categoryIconMap[slug] || Sparkles;
}

function getSubcategoryIcon(subcategory: Subcategory): LucideIcon {
  const slug = subcategory.slug?.toLowerCase() || subcategory.name.toLowerCase().replace(/\s+/g, '-');
  return subcategoryIconMap[slug] || ChevronRight;
}

interface StickyCategoryBarProps {
  categories: CategoryWithTemporary[];
  selectedCategory: string | null;
  selectedSubcategory?: string | null;
  onCategoryChange: (categoryId: string | null) => void;
  onSubcategoryChange?: (subcategoryId: string | null) => void;
  serviceCount?: number;
  categoryCounts?: Record<string, number>;
  newCounts?: Record<string, number>;
}

export function StickyCategoryBar({
  categories,
  selectedCategory,
  selectedSubcategory,
  onCategoryChange,
  onSubcategoryChange,
  serviceCount = 0,
  categoryCounts = {},
  newCounts = {},
}: StickyCategoryBarProps) {
  const [isSticky, setIsSticky] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ left: 0 });
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [isSubcategoriesExpanded, setIsSubcategoriesExpanded] = useState(true);

  const navRef = useRef<HTMLDivElement>(null);
  const stickyRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const categoryButtonRefs = useRef<{ [key: string]: HTMLButtonElement | null }>({});
  const dropdownRef = useRef<HTMLDivElement>(null);

  const activeCategory = categories.find((c) => c.id === selectedCategory);

  // Fetch subcategories for selected category
  const { data: subcategories = [] } = useQuery<Subcategory[]>({
    queryKey: [`/api/categories/${selectedCategory}/subcategories`],
    enabled: !!selectedCategory,
  });

  const checkScroll = useCallback(() => {
    const container = scrollContainerRef.current;
    if (container) {
      // Use requestAnimationFrame to avoid ResizeObserver loop limit exceeded error
      requestAnimationFrame(() => {
        const { scrollLeft, scrollWidth, clientWidth } = container;
        setCanScrollLeft(scrollLeft > 5);
        setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 5);
      });
    }
  }, []);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (container) {
      checkScroll();
      container.addEventListener("scroll", checkScroll);

      const resizeObserver = new ResizeObserver(() => {
        checkScroll();
      });
      resizeObserver.observe(container);

      return () => {
        container.removeEventListener("scroll", checkScroll);
        resizeObserver.disconnect();
      };
    }
  }, [checkScroll]);

  useEffect(() => {
    const handleScroll = () => {
      if (navRef.current) {
        const rect = navRef.current.getBoundingClientRect();
        // Account for header height (64px)
        const shouldBeSticky = rect.top <= 64;
        setIsSticky(shouldBeSticky);

        // Close dropdown when becoming non-sticky
        if (!shouldBeSticky && dropdownOpen) {
          setDropdownOpen(false);
        }
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [dropdownOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        const clickedOnCategoryButton = Object.values(categoryButtonRefs.current).some(
          (btn) => btn && btn.contains(event.target as Node)
        );
        if (!clickedOnCategoryButton) {
          setDropdownOpen(false);
        }
      }
    };

    if (dropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [dropdownOpen]);

  const scroll = (direction: "left" | "right") => {
    const container = scrollContainerRef.current;
    if (container) {
      const scrollAmount = 200;
      container.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  const handleCategoryClick = (categoryId: string, buttonElement: HTMLButtonElement) => {
    if (selectedCategory === categoryId) {
      // Only toggle dropdown when sticky
      if (isSticky) {
        setDropdownOpen(!dropdownOpen);
      } else {
        // When not sticky, clicking same category deselects it
        onCategoryChange(null);
        onSubcategoryChange?.(null);
        setIsSubcategoriesExpanded(true);
      }
    } else {
      onCategoryChange(categoryId);
      onSubcategoryChange?.(null);
      setIsSubcategoriesExpanded(true);

      // Only show dropdown when sticky
      if (isSticky) {
        const rect = buttonElement.getBoundingClientRect();
        const dropdownWidth = 280;
        let leftPos = rect.left;

        if (leftPos + dropdownWidth > window.innerWidth - 16) {
          leftPos = window.innerWidth - dropdownWidth - 16;
        }
        if (leftPos < 16) {
          leftPos = 16;
        }

        setDropdownPosition({ left: leftPos });
        setDropdownOpen(true);
      }
    }
  };

  const handleSubcategoryClick = (subcategoryId: string) => {
    onSubcategoryChange?.(subcategoryId);
    setDropdownOpen(false);
  };

  const handleBrowseAllCategory = () => {
    onSubcategoryChange?.(null);
    setDropdownOpen(false);
  };

  const clearSelection = () => {
    onCategoryChange(null);
    onSubcategoryChange?.(null);
    setDropdownOpen(false);
    setIsSubcategoriesExpanded(true);
  };

  return (
    <div ref={navRef} className="relative">
      {/* Placeholder to prevent layout shift when sticky */}
      {isSticky && <div className="h-[52px]" />}

      {/* Main sticky navigation */}
      <div
        ref={stickyRef}
        className={cn(
          "w-full border-b z-40 transition-all duration-300",
          isSticky 
            ? "fixed top-16 left-0 right-0 shadow-lg bg-background/95 dark:bg-background/95 backdrop-blur-md border-border/50" 
            : "relative bg-transparent backdrop-blur-none border-transparent"
        )}
      >
        <div className={cn(
          "container mx-auto transition-all duration-300",
          isSticky ? "px-4" : "px-4"
        )}>
          <div className={cn(
            "relative flex items-center h-[52px]",
            isSticky ? "gap-3" : ""
          )}>
            {/* Left scroll button - OUTSIDE categories when sticky */}
            <div
              className={cn(
                "z-30 transition-all duration-300 flex-shrink-0",
                isSticky ? "relative" : "absolute left-0",
                canScrollLeft ? "opacity-100" : "opacity-0 pointer-events-none"
              )}
            >
              <button
                onClick={() => scroll("left")}
                className="relative w-8 h-8 rounded-full bg-card border border-border/80 flex items-center justify-center
                  hover:border-primary/50 hover:scale-105 transition-all duration-200 group shadow-sm"
                aria-label="Scroll left"
              >
                <ChevronLeft className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors relative z-10" />
              </button>
            </div>

            {/* Scrollable categories - 90% width when sticky */}
            <div
              ref={scrollContainerRef}
              className={cn(
                "flex items-center gap-2 overflow-x-auto flex-1 scrollbar-hide",
                isSticky ? "mx-0 max-w-[90%]" : "px-10"
              )}
              style={{
                scrollbarWidth: "none",
                msOverflowStyle: "none",
              }}
            >
              {/* All Services button */}
              <button
                onClick={() => {
                  onCategoryChange(null);
                  onSubcategoryChange?.(null);
                  setDropdownOpen(false);
                }}
                className={cn(
                  "flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap",
                  "border transition-all duration-200",
                  selectedCategory === null
                    ? "bg-primary text-primary-foreground border-primary shadow-md"
                    : "bg-card/80 dark:bg-card/50 text-muted-foreground border-border/50 hover:bg-card hover:text-foreground hover:border-border shadow-sm"
                )}
                data-testid="category-filter-all"
              >
                <Sparkles className="h-3.5 w-3.5" />
                <span>All Services</span>
                <Badge 
                  variant={selectedCategory === null ? "secondary" : "outline"} 
                  className={cn(
                    "text-[10px] px-1.5",
                    selectedCategory === null && "bg-white/20 text-white border-0"
                  )}
                >
                  {serviceCount}
                </Badge>
              </button>

              {/* Category buttons */}
              {categories.map((category) => {
                const IconComponent = getCategoryIcon(category);
                const count = categoryCounts[category.id] || 0;
                const newCount = newCounts[category.id] || 0;
                
                return (
                  <button
                    key={category.id}
                    ref={(el) => {
                      categoryButtonRefs.current[category.id] = el;
                    }}
                    onClick={(e) => handleCategoryClick(category.id, e.currentTarget)}
                    className={cn(
                      "relative flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap",
                      "border transition-all duration-200",
                      selectedCategory === category.id
                        ? "bg-primary text-primary-foreground border-primary shadow-md"
                        : "bg-card/80 dark:bg-card/50 text-muted-foreground border-border/50 hover:bg-card hover:text-foreground hover:border-border shadow-sm"
                    )}
                    data-testid={`category-filter-${category.slug}`}
                  >
                    {newCount > 0 && (
                      <div className="absolute -top-1 -right-1">
                        <div className="bg-red-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center shadow-md">
                          {newCount}
                        </div>
                      </div>
                    )}
                    <IconComponent className="h-3.5 w-3.5" />
                    <span>{category.name}</span>
                    <ChevronDown
                      className={cn(
                        "h-3 w-3 transition-transform duration-200",
                        selectedCategory === category.id && dropdownOpen && isSticky ? "rotate-180" : ""
                      )}
                    />
                  </button>
                );
              })}
            </div>

            {/* Right scroll button - OUTSIDE categories when sticky */}
            <div
              className={cn(
                "z-30 transition-all duration-300 flex-shrink-0",
                isSticky ? "relative" : "absolute right-0",
                canScrollRight ? "opacity-100" : "opacity-0 pointer-events-none"
              )}
            >
              <button
                onClick={() => scroll("right")}
                className="relative w-8 h-8 rounded-full bg-card border border-border/80 flex items-center justify-center
                  hover:border-primary/50 hover:scale-105 transition-all duration-200 group shadow-sm"
                aria-label="Scroll right"
              >
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

      {/* Dropdown for subcategories - ONLY when sticky */}
      {isSticky && dropdownOpen && activeCategory && subcategories.length > 0 && (
        <div
          ref={dropdownRef}
          className="fixed z-[100] animate-in fade-in slide-in-from-top-2 duration-200"
          style={{
            top: "116px", // 64px header + 52px category bar
            left: dropdownPosition.left,
          }}
        >
          <div className="bg-popover border border-border rounded-xl shadow-xl w-[280px] overflow-hidden">
            <div className="p-2 border-b border-border/50 bg-muted/30">
              <div className="flex items-center justify-between px-2">
                <span className="text-xs font-medium text-muted-foreground">Select a service</span>
                <Badge variant="secondary" className="text-[10px]">
                  {subcategories.length} options
                </Badge>
              </div>
            </div>
            
            {/* Browse all category button */}
            <button
              onClick={handleBrowseAllCategory}
              className="w-full flex items-center justify-between gap-2 px-3 py-2.5 text-sm bg-primary/5 hover:bg-primary/10 transition-colors text-left border-b border-border/30"
            >
              <div className="flex items-center gap-2.5">
                <Search className="h-4 w-4 text-primary" />
                <span className="text-primary font-medium">Browse all {activeCategory.name}</span>
              </div>
              <ChevronRight className="h-3.5 w-3.5 text-primary" />
            </button>
            
            <div className="p-1.5 max-h-[320px] overflow-y-auto">
              {subcategories.map((sub) => {
                const SubIcon = getSubcategoryIcon(sub);
                return (
                  <button
                    key={sub.id}
                    onClick={() => handleSubcategoryClick(sub.id)}
                    className={cn(
                      "w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-lg text-sm",
                      "hover:bg-muted transition-colors text-left group",
                      selectedSubcategory === sub.id && "bg-primary/10"
                    )}
                  >
                    <div className="flex items-center gap-2.5">
                      <SubIcon
                        className={cn(
                          "h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors",
                          selectedSubcategory === sub.id && "text-primary"
                        )}
                      />
                      <span className={cn(
                        "group-hover:text-primary transition-colors",
                        selectedSubcategory === sub.id && "text-primary font-medium"
                      )}>
                        {sub.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <ChevronRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Non-sticky subcategory panel (expanded chips) - ONLY when NOT sticky */}
      {!isSticky && selectedCategory && activeCategory && subcategories.length > 0 && (
        <div className="bg-card/80 dark:bg-card/50 backdrop-blur-sm border-b border-border/30">
          <div className="container mx-auto px-4 py-3">
            {/* Header row with collapse/expand toggle */}
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Choose a service in</span>
                <Badge variant="secondary" className="font-medium text-xs">
                  {activeCategory.name}
                </Badge>
                {/* Collapse/Expand toggle button */}
                <button
                  onClick={() => setIsSubcategoriesExpanded(!isSubcategoriesExpanded)}
                  className="flex items-center gap-1 px-2 py-1 rounded-md text-xs text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                  aria-label={isSubcategoriesExpanded ? "Collapse subcategories" : "Expand subcategories"}
                >
                  {isSubcategoriesExpanded ? (
                    <>
                      <ChevronUp className="h-3.5 w-3.5" />
                      <span>Collapse</span>
                    </>
                  ) : (
                    <>
                      <ChevronDown className="h-3.5 w-3.5" />
                      <span>Expand</span>
                    </>
                  )}
                </button>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleBrowseAllCategory}
                className="text-xs h-7 gap-1.5 border-primary/30 text-primary hover:bg-primary/5 bg-transparent"
              >
                <Search className="h-3 w-3" />
                Browse all {activeCategory.name}
              </Button>
            </div>
            
            {/* Animated subcategories panel */}
            <AnimatePresence>
              {isSubcategoriesExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="flex flex-wrap gap-2 pt-1">
                    {subcategories.map((sub) => {
                      const SubIcon = getSubcategoryIcon(sub);
                      return (
                        <button
                          key={sub.id}
                          onClick={() => handleSubcategoryClick(sub.id)}
                          className={cn(
                            "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium",
                            "transition-all duration-200 border",
                            selectedSubcategory === sub.id
                              ? "bg-primary text-primary-foreground border-primary shadow-md"
                              : "bg-background hover:bg-muted border-border/50 hover:border-primary/30"
                          )}
                        >
                          <ChevronRight className="h-3 w-3" />
                          <span>{sub.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      )}
    </div>
  );
}
