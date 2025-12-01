import * as React from "react";
import { useState } from "react";
import { Link, useLocation } from "wouter";
import { 
  Plus, 
  MessageCircle, 
  Calendar, 
  Bell, 
  X,
  Briefcase
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface QuickAction {
  icon: React.ReactNode;
  label: string;
  href: string;
  color: string;
}

const quickActions: QuickAction[] = [
  {
    icon: <Briefcase className="h-5 w-5" />,
    label: "New Service",
    href: "/post-service",
    color: "bg-blue-500 hover:bg-blue-600",
  },
  {
    icon: <MessageCircle className="h-5 w-5" />,
    label: "Messages",
    href: "/chat",
    color: "bg-green-500 hover:bg-green-600",
  },
  {
    icon: <Calendar className="h-5 w-5" />,
    label: "Bookings",
    href: "/my-bookings",
    color: "bg-purple-500 hover:bg-purple-600",
  },
  {
    icon: <Bell className="h-5 w-5" />,
    label: "Notifications",
    href: "/notifications",
    color: "bg-orange-500 hover:bg-orange-600",
  },
];

export function QuickActions() {
  const [isOpen, setIsOpen] = useState(false);
  const [location] = useLocation();

  // Don't show on certain pages
  const hiddenPaths = ["/login", "/register", "/forgot-password", "/reset-password"];
  if (hiddenPaths.some(path => location.startsWith(path))) {
    return null;
  }

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Quick action menu */}
      <div
        className={cn(
          "absolute bottom-16 right-0 flex flex-col gap-3 transition-all duration-300",
          isOpen ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"
        )}
      >
        {quickActions.map((action, index) => (
          <Link key={action.href} href={action.href}>
            <div
              className={cn(
                "flex items-center gap-3 rounded-full pr-4 pl-3 py-2 text-white shadow-lg transition-all duration-200 hover:scale-105",
                action.color
              )}
              style={{
                transitionDelay: isOpen ? `${index * 50}ms` : "0ms",
              }}
              onClick={() => setIsOpen(false)}
            >
              {action.icon}
              <span className="text-sm font-medium whitespace-nowrap">
                {action.label}
              </span>
            </div>
          </Link>
        ))}
      </div>

      {/* Main FAB button */}
      <Button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "h-14 w-14 rounded-full shadow-lg transition-all duration-300",
          isOpen 
            ? "bg-gray-600 hover:bg-gray-700 rotate-45" 
            : "bg-primary hover:bg-primary/90"
        )}
        size="icon"
      >
        {isOpen ? (
          <X className="h-6 w-6" />
        ) : (
          <Plus className="h-6 w-6" />
        )}
      </Button>
    </div>
  );
}

export default QuickActions;
