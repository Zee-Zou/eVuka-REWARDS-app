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
  maxRetries?: number; // Maximum retry attempts before circuit breaker trips
  resetTimeout?: number; // Time in ms to reset error count
}

interface State {
  hasError: boolean;
  error?: Error;
  errorCount: number;
  lastErrorTime?: number;
  isCircuitBreakerOpen: boolean; // Prevents rapid repeated failures
}

class ErrorBoundary extends Component<Props, State> {
  private readonly MAX_RETRIES = this.props.maxRetries || 3;
  private readonly RESET_TIMEOUT = this.props.resetTimeout || 30000; // 30 seconds
  private resetTimer?: NodeJS.Timeout;

  public state: State = {
    hasError: false,
    errorCount: 0,
    isCircuitBreakerOpen: false,
  };

  public static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentWillUnmount() {
    // Clean up reset timer
    if (this.resetTimer) {
      clearTimeout(this.resetTimer);
    }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const level = this.props.level || "component";
    const now = Date.now();

    // Circuit Breaker Logic
    const timeSinceLastError = this.state.lastErrorTime
      ? now - this.state.lastErrorTime
      : Infinity;

    // Reset error count if enough time has passed
    let newErrorCount = this.state.errorCount + 1;
    if (timeSinceLastError > this.RESET_TIMEOUT) {
      newErrorCount = 1;
      logger.info("Error count reset after timeout", { level });
    }

    // Trip circuit breaker if too many errors
    const isCircuitBreakerOpen = newErrorCount >= this.MAX_RETRIES;

    this.setState({
      errorCount: newErrorCount,
      lastErrorTime: now,
      isCircuitBreakerOpen,
    });

    logger.error(`Uncaught error in ${level}`, {
      error: error.toString(),
      errorInfo,
      level,
      errorCount: newErrorCount,
      maxRetries: this.MAX_RETRIES,
      circuitBreakerOpen: isCircuitBreakerOpen,
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
          errorCount: newErrorCount,
          circuitBreakerOpen: isCircuitBreakerOpen,
          timestamp: new Date().toISOString(),
        }),
      }).catch(() => {
        // Silently fail if monitoring endpoint is unavailable
      });
    }

    // Schedule automatic reset of circuit breaker
    if (isCircuitBreakerOpen) {
      if (this.resetTimer) {
        clearTimeout(this.resetTimer);
      }
      this.resetTimer = setTimeout(() => {
        logger.info("Circuit breaker reset after cooldown", { level });
        this.setState({
          errorCount: 0,
          isCircuitBreakerOpen: false
        });
      }, this.RESET_TIMEOUT);
    }
  }

  private handleReset = () => {
    // Check if circuit breaker is open
    if (this.state.isCircuitBreakerOpen) {
      logger.warn("Circuit breaker open - retry blocked", {
        errorCount: this.state.errorCount,
        maxRetries: this.MAX_RETRIES,
      });
      return;
    }

    // Exponential backoff: wait before retry based on error count
    const backoffDelay = Math.min(1000 * Math.pow(2, this.state.errorCount - 1), 10000);

    if (this.state.errorCount > 0) {
      logger.info(`Retrying with exponential backoff: ${backoffDelay}ms`, {
        errorCount: this.state.errorCount,
      });

      setTimeout(() => {
        this.setState({ hasError: false, error: undefined });
      }, backoffDelay);
    } else {
      // First error - retry immediately
      this.setState({ hasError: false, error: undefined });
    }
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
              <h2 className="text-xl font-bold text-gray-900">
                {this.state.isCircuitBreakerOpen
                  ? "Too many errors detected"
                  : "Something went wrong"}
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                {this.state.isCircuitBreakerOpen ? (
                  <>
                    The system is taking a break to prevent further issues.
                    Please wait {Math.ceil(this.RESET_TIMEOUT / 1000)} seconds before trying again.
                  </>
                ) : level === "page" ? (
                  "This page encountered an error. Please try reloading."
                ) : level === "section" ? (
                  "This section is temporarily unavailable."
                ) : (
                  "This component encountered an error."
                )}
              </p>
              {this.state.errorCount > 0 && !this.state.isCircuitBreakerOpen && (
                <p className="text-xs text-orange-600 mt-2">
                  Retry attempt {this.state.errorCount} of {this.MAX_RETRIES}
                </p>
              )}
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
                disabled={this.state.isCircuitBreakerOpen}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                {this.state.isCircuitBreakerOpen ? "Please Wait..." : "Try Again"}
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