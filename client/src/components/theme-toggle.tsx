"use client";

import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/components/theme-provider";
import { cn } from "@/lib/utils";

interface ThemeToggleProps {
  className?: string;
  variant?: "default" | "ghost" | "outline";
  size?: "default" | "sm" | "lg" | "icon";
}

export function ThemeToggle({ 
  className, 
  variant = "ghost", 
  size = "icon" 
}: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme();

  return (
    <Button
      variant={variant}
      size={size}
      onClick={toggleTheme}
      className={cn(
        "relative transition-all duration-300 hover:bg-muted",
        className
      )}
      aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
      title={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
    >
      {/* Sun icon - visible in light mode */}
      <Sun 
        className={cn(
          "h-5 w-5 transition-all duration-300",
          theme === "light" 
            ? "rotate-0 scale-100 opacity-100" 
            : "rotate-90 scale-0 opacity-0 absolute"
        )} 
      />
      {/* Moon icon - visible in dark mode */}
      <Moon 
        className={cn(
          "h-5 w-5 transition-all duration-300",
          theme === "dark" 
            ? "rotate-0 scale-100 opacity-100" 
            : "-rotate-90 scale-0 opacity-0 absolute"
        )} 
      />
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}

// Alternative dropdown-based theme toggle for more options
export function ThemeToggleDropdown({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme();

  return (
    <div className={cn("flex items-center gap-1 p-1 rounded-lg bg-muted", className)}>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setTheme("light")}
        className={cn(
          "h-8 px-3 rounded-md transition-all",
          theme === "light" 
            ? "bg-background shadow-sm" 
            : "hover:bg-background/50"
        )}
      >
        <Sun className="h-4 w-4 mr-1.5" />
        Light
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setTheme("dark")}
        className={cn(
          "h-8 px-3 rounded-md transition-all",
          theme === "dark" 
            ? "bg-background shadow-sm" 
            : "hover:bg-background/50"
        )}
      >
        <Moon className="h-4 w-4 mr-1.5" />
        Dark
      </Button>
    </div>
  );
}
