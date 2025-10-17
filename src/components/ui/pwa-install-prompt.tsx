import React, { useState, useEffect } from "react";
import { Button } from "./button";
import { Card } from "./card";
import { Download, X, Smartphone, Check } from "lucide-react";
import { usePwaInstall } from "@/lib/pwa-utils";
import { motion, AnimatePresence } from "framer-motion";

interface PWAInstallPromptProps {
  className?: string;
  position?: "top" | "bottom";
  autoShow?: boolean;
  showDelay?: number;
  onInstall?: () => void;
  onDismiss?: () => void;
}

const PWAInstallPrompt: React.FC<PWAInstallPromptProps> = ({
  className = "",
  position = "bottom",
  autoShow = true,
  showDelay = 5000,
  onInstall,
  onDismiss,
}) => {
  const [showPrompt, setShowPrompt] = useState(false);
  const [installAttempted, setInstallAttempted] = useState(false);
  const { canInstall, promptInstall } = usePwaInstall();

  useEffect(() => {
    // Check if we should show the prompt automatically
    if (autoShow && canInstall) {
      const timer = setTimeout(() => {
        // Check if user has previously dismissed the prompt
        const hasUserDismissed = localStorage.getItem("pwa-prompt-dismissed");
        if (!hasUserDismissed) {
          setShowPrompt(true);
        }
      }, showDelay);

      return () => clearTimeout(timer);
    }
  }, [autoShow, canInstall, showDelay]);

  const handleInstall = async () => {
    setInstallAttempted(true);
    const installed = await promptInstall();

    if (installed) {
      onInstall?.();
    }

    // Hide the prompt regardless of outcome
    setShowPrompt(false);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    // Remember that user dismissed the prompt
    localStorage.setItem("pwa-prompt-dismissed", "true");
    onDismiss?.();
  };

  // Don't render anything if we can't install or shouldn't show the prompt
  if (!canInstall || !showPrompt) {
    return null;
  }

  const positionClass =
    position === "top" ? "top-4 left-4 right-4" : "bottom-4 left-4 right-4";

  return (
    <AnimatePresence>
      {showPrompt && (
        <motion.div
          initial={{ opacity: 0, y: position === "top" ? -20 : 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: position === "top" ? -20 : 20 }}
          transition={{ duration: 0.3 }}
          className={`fixed ${positionClass} z-50 max-w-md mx-auto ${className}`}
        >
          <Card className="p-4 shadow-lg border-t-4 border-primary bg-white">
            <div className="flex items-start justify-between">
              <div className="flex items-center">
                <div className="bg-primary/10 p-2 rounded-full mr-3">
                  <Smartphone className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">Install eVuka Rewards</h3>
                  <p className="text-sm text-gray-600">
                    Add to your home screen for a better experience
                  </p>
                </div>
              </div>
              <button
                onClick={handleDismiss}
                className="text-gray-400 hover:text-gray-600 transition-colors"
                aria-label="Dismiss"
              >
                <X size={20} />
              </button>
            </div>

            <div className="mt-4 flex justify-end space-x-3">
              <Button variant="outline" size="sm" onClick={handleDismiss}>
                Not now
              </Button>
              <Button
                size="sm"
                onClick={handleInstall}
                disabled={installAttempted}
                className="flex items-center"
              >
                {installAttempted ? (
                  <>
                    <Check className="mr-1 h-4 w-4" />
                    Installing...
                  </>
                ) : (
                  <>
                    <Download className="mr-1 h-4 w-4" />
                    Install
                  </>
                )}
              </Button>
            </div>
          </Card>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default PWAInstallPrompt;
