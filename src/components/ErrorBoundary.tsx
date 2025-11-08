import React, { Component, ErrorInfo, ReactNode } from "react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { logger } from "../lib/logger";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  level?: "page" | "section" | "component";
}

interface State {
  hasError: boolean;
  error?: Error;
  errorCount: number;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    errorCount: 0,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorCount: 0 };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const level = this.props.level || "component";
    logger.error(`Uncaught error in ${level}`, { 
      error: error.toString(), 
      errorInfo,
      level,
    });

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Log to monitoring service if configured
    if (import.meta.env.VITE_MONITORING_ENDPOINT) {
      fetch(import.meta.env.VITE_MONITORING_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          error: error.toString(), 
          errorInfo,
          level,
          timestamp: new Date().toISOString(),
        }),
      }).catch(() => {
        // Silently fail if monitoring endpoint is unavailable
      });
    }
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: undefined, errorCount: 0 });
  };

  private handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const level = this.props.level || "component";
      const isDevelopment = import.meta.env.MODE === "development";

      return (
        <Card className="p-6 max-w-md mx-auto my-8 bg-white border-l-4 border-red-600">
          <div className="flex flex-col items-center text-center space-y-4">
            <AlertTriangle className="h-12 w-12 text-red-600" />
            <div>
              <h2 className="text-xl font-bold text-gray-900">Something went wrong</h2>
              <p className="text-sm text-gray-600 mt-1">
                {level === "page" 
                  ? "This page encountered an error. Please try reloading."
                  : level === "section"
                  ? "This section is temporarily unavailable."
                  : "This component encountered an error."}
              </p>
            </div>

            {isDevelopment && this.state.error && (
              <div className="w-full bg-red-50 border border-red-200 rounded p-3 text-left">
                <p className="text-xs font-mono text-red-800 break-words">
                  {this.state.error.message}
                </p>
              </div>
            )}

            <div className="flex gap-2 w-full">
              <Button 
                onClick={this.handleReset} 
                className="flex-1"
                variant="default"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
              {level === "page" && (
                <Button 
                  onClick={this.handleReload} 
                  className="flex-1"
                  variant="outline"
                >
                  Reload Page
                </Button>
              )}
            </div>

            <p className="text-xs text-gray-500">
              If the problem persists, please contact support.
            </p>
          </div>
        </Card>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;