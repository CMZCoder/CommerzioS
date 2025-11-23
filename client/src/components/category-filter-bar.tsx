import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import type { CategoryWithTemporary } from "@/lib/api";

interface CategoryFilterBarProps {
  categories: CategoryWithTemporary[];
  selectedCategory: string | null;
  onCategoryChange: (categoryId: string | null) => void;
  serviceCount?: number;
  categoryCounts?: Record<string, number>;
}

export function CategoryFilterBar({
  categories,
  selectedCategory,
  onCategoryChange,
  serviceCount = 0,
  categoryCounts = {},
}: CategoryFilterBarProps) {
  return (
    <div className="w-full bg-white border-b sticky top-16 z-40 shadow-sm">
      <div className="container mx-auto px-4 py-4">
        <ScrollArea className="w-full whitespace-nowrap">
          <div className="flex gap-2 pb-2">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onCategoryChange(null)}
              className={cn(
                "inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all shrink-0",
                selectedCategory === null
                  ? "bg-primary text-primary-foreground shadow-md"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              )}
              data-testid="category-filter-all"
            >
              <Sparkles className="w-4 h-4" />
              <span>All Services</span>
              <Badge
                variant={selectedCategory === null ? "secondary" : "outline"}
                className="ml-1"
              >
                {serviceCount}
              </Badge>
            </motion.button>

            {categories.map((category) => (
              <motion.button
                key={category.id}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => onCategoryChange(category.id)}
                className={cn(
                  "inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all shrink-0",
                  selectedCategory === category.id
                    ? "bg-primary text-primary-foreground shadow-md"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                )}
                data-testid={`category-filter-${category.slug}`}
              >
                {category.icon && (
                  <span className="text-lg">{category.icon}</span>
                )}
                <span>{category.name}</span>
                <Badge
                  variant={selectedCategory === category.id ? "secondary" : "outline"}
                  className="ml-1"
                >
                  {categoryCounts[category.id] || 0}
                </Badge>
              </motion.button>
            ))}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </div>
    </div>
  );
}
