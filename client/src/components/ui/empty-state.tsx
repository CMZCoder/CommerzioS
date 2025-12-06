/**
 * EmptyState Component
 * 
 * Reusable empty state placeholder with optional action.
 */

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface EmptyStateProps {
    icon?: LucideIcon;
    title: string;
    description?: string;
    action?: {
        label: string;
        onClick: () => void;
    };
    className?: string;
}

export function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
    return (
        <div className={cn("flex flex-col items-center justify-center py-12 text-center", className)}>
            {Icon && (
                <div className="rounded-full bg-muted p-4 mb-4">
                    <Icon className="h-8 w-8 text-muted-foreground" />
                </div>
            )}
            <h3 className="font-semibold text-lg mb-1">{title}</h3>
            {description && (
                <p className="text-muted-foreground text-sm max-w-sm mb-4">{description}</p>
            )}
            {action && (
                <Button onClick={action.onClick}>{action.label}</Button>
            )}
        </div>
    );
}
