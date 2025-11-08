import React from "react";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Card } from "@/components/ui/card";

interface LoadingFallbackProps {
  message?: string;
  fullScreen?: boolean;
}

export const LoadingFallback: React.FC<LoadingFallbackProps> = ({
  message = "Loading...",
  fullScreen = false,
}) => {
  if (fullScreen) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-white/80 backdrop-blur-sm z-50">
        <div className="flex flex-col items-center gap-3">
          <LoadingSpinner size={40} />
          <p className="text-sm text-gray-600">{message}</p>
        </div>
      </div>
    );
  }

  return (
    <Card className="p-8 flex flex-col items-center justify-center gap-3 bg-white">
      <LoadingSpinner size={32} />
      <p className="text-sm text-gray-600">{message}</p>
    </Card>
  );
};

export default LoadingFallback;