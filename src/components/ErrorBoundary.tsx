import React, { Component, ErrorInfo, ReactNode } from "react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { AlertTriangle } from "lucide-react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);

    // Log to monitoring service
    if (import.meta.env.VITE_MONITORING_ENDPOINT) {
      fetch(import.meta.env.VITE_MONITORING_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ error: error.toString(), errorInfo }),
      }).catch((err) => console.error("Failed to log error:", err));
    }
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: undefined });
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <Card className="p-6 max-w-md mx-auto my-8">
          <div className="flex flex-col items-center text-center space-y-4">
            <AlertTriangle className="h-12 w-12 text-destructive" />
            <h2 className="text-xl font-bold">Something went wrong</h2>
            <p className="text-muted-foreground">
              We've encountered an unexpected error. Our team has been notified.
            </p>
            <Button onClick={this.handleReset}>Try Again</Button>
          </div>
        </Card>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
