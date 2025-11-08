import React from "react";
import { AlertCircle } from "lucide-react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";

interface ErrorFallbackProps {
  error?: string;
  onRetry?: () => void;
  title?: string;
  description?: string;
}

export const ErrorFallback: React.FC<ErrorFallbackProps> = ({
  error,
  onRetry,
  title = "Error",
  description = "An error occurred while loading this content.",
}) => {
  return (
    <Card className="p-4 bg-red-50 border border-red-200">
      <div className="flex gap-3">
        <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <h3 className="font-semibold text-red-900">{title}</h3>
          <p className="text-sm text-red-800 mt-1">{description}</p>
          {error && import.meta.env.MODE === "development" && (
            <p className="text-xs text-red-700 mt-2 font-mono break-words">{error}</p>
          )}
          {onRetry && (
            <Button
              onClick={onRetry}
              size="sm"
              variant="outline"
              className="mt-3"
            >
              Try Again
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
};

export default ErrorFallback;
