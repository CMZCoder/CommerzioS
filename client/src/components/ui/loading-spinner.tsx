/**
 * LoadingSpinner Component
 * 
 * Reusable loading indicator with different sizes.
 */

import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface LoadingSpinnerProps {
    size?: "sm" | "md" | "lg";
    className?: string;
    text?: string;
}

const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-6 w-6",
    lg: "h-8 w-8",
};

export function LoadingSpinner({ size = "md", className, text }: LoadingSpinnerProps) {
    return (
        <div className={cn("flex items-center justify-center gap-2", className)}>
            <Loader2 className={cn("animate-spin", sizeClasses[size])} />
            {text && <span className="text-muted-foreground text-sm">{text}</span>}
        </div>
    );
}

export function PageLoader({ text = "Loading..." }: { text?: string }) {
    return (
        <div className="flex items-center justify-center min-h-[400px]">
            <LoadingSpinner size="lg" text={text} />
        </div>
    );
}
