import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, ChevronDown, ChevronUp, ChevronRight } from "lucide-react";
import type { CategoryWithTemporary } from "@/lib/api";
import { useState } from "react";

interface StickyCategoryBarProps {
  categories: CategoryWithTemporary[];
  selectedCategory: string | null;
  onCategoryChange: (categoryId: string | null) => void;
  serviceCount?: number;
  categoryCounts?: Record<string, number>;
  newCounts?: Record<string, number>;
}

export function StickyCategoryBar({
  categories,
  selectedCategory,
  onCategoryChange,
  serviceCount = 0,
  categoryCounts = {},
  newCounts = {},
}: StickyCategoryBarProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [showAllCategories, setShowAllCategories] = useState(false);

  return (
    <div className="sticky top-16 z-40 w-full bg-card border-b shadow-md">
      <div className="container mx-auto px-4 py-2">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold text-muted-foreground">Categories</h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="h-7 px-2 hover:bg-accent transition-colors"
            data-testid="button-toggle-categories"
          >
            {isExpanded ? (
              <>
                <ChevronUp className="w-3.5 h-3.5 mr-1" />
                <span className="text-xs">Hide</span>
              </>
            ) : (
              <>
                <ChevronDown className="w-3.5 h-3.5 mr-1" />
                <span className="text-xs">Show</span>
              </>
            )}
          </Button>
        </div>
        
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="overflow-x-auto overflow-y-hidden pb-3 [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-track]:bg-muted [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-thumb]:bg-border [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-border/80 [&::-webkit-scrollbar-thumb]:transition-colors">
                <div className="flex gap-2 min-w-max">
                  {/* All Services Button */}
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => onCategoryChange(null)}
                    className={cn(
                      "inline-flex items-center gap-2 px-3 py-1.5 rounded-full border-2 transition-all text-xs font-medium whitespace-nowrap",
                      selectedCategory === null
                        ? "bg-primary text-primary-foreground border-primary shadow-sm"
                        : "bg-card text-muted-foreground border-border hover:border-primary/50 hover:bg-accent"
                    )}
                    data-testid="category-filter-all"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    All Services
                    <Badge variant={selectedCategory === null ? "secondary" : "outline"} className="ml-0.5 bg-white/20 text-white border-0">
                      {serviceCount}
                    </Badge>
                  </motion.button>

                  {/* Category Buttons */}
                  {(showAllCategories ? categories : categories.slice(0, 6)).map((category) => (
                    <motion.button
                      key={category.id}
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => onCategoryChange(category.id)}
                      className={cn(
                        "relative inline-flex items-center gap-2 px-3 py-1.5 rounded-full border-2 transition-all text-xs font-medium whitespace-nowrap",
                        selectedCategory === category.id
                          ? "bg-primary text-primary-foreground border-primary shadow-sm"
                          : "bg-card text-muted-foreground border-border hover:border-primary/50 hover:bg-accent"
                      )}
                      data-testid={`category-filter-${category.slug}`}
                    >
                      {newCounts[category.id] > 0 && (
                        <div className="absolute -top-1 -right-1">
                          <div className="bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center shadow-md">
                            {newCounts[category.id]}
                          </div>
                        </div>
                      )}
                      {category.name}
                      <Badge 
                        variant={selectedCategory === category.id ? "secondary" : "outline"} 
                        className={cn(
                          "ml-0.5",
                          selectedCategory === category.id ? "bg-white/20 text-white border-0" : ""
                        )}
                      >
                        {categoryCounts[category.id] || 0}
                      </Badge>
                    </motion.button>
                  ))}

                  {/* Show More/Less Button */}
                  {!showAllCategories && categories.length > 6 && (
                    <motion.button
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => setShowAllCategories(true)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border-2 border-dashed border-border bg-muted hover:border-border/80 hover:bg-accent transition-all text-xs font-medium whitespace-nowrap text-muted-foreground"
                      data-testid="button-show-more-categories"
                    >
                      <span>Show More</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                      <span className="text-xs">+{categories.length - 6}</span>
                    </motion.button>
                  )}

                  {showAllCategories && categories.length > 6 && (
                    <motion.button
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => setShowAllCategories(false)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border-2 border-dashed border-border bg-muted hover:border-border/80 hover:bg-accent transition-all text-xs font-medium whitespace-nowrap text-muted-foreground"
                      data-testid="button-show-less-categories"
                    >
                      <ChevronUp className="w-3.5 h-3.5" />
                      <span>Show Less</span>
                    </motion.button>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
