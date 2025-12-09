/**
 * ErrorBoundary Component
 * 
 * Catches JavaScript errors in child components and displays fallback UI.
 */

import React, { Component, ErrorInfo, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error("ErrorBoundary caught an error:", error, errorInfo);
    }

    private handleRetry = () => {
        this.setState({ hasError: false, error: undefined });
    };

    public render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }

            return (
                <div className="flex flex-col items-center justify-center min-h-[400px] p-8 text-center">
                    <div className="rounded-full bg-destructive/10 p-4 mb-4">
                        <AlertTriangle className="h-8 w-8 text-destructive" />
                    </div>
                    <h2 className="font-semibold text-lg mb-2">Something went wrong</h2>
                    <p className="text-muted-foreground text-sm mb-4 max-w-md">
                        An unexpected error occurred. Please try again.
                    </p>
                    <Button onClick={this.handleRetry}>Try Again</Button>
                </div>
            );
        }

        return this.props.children;
    }
}
