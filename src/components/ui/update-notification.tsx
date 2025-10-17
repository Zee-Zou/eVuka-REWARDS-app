import React, { useState } from "react";
import { Button } from "./button";
import { Card } from "./card";
import { RefreshCw, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useServiceWorkerUpdates } from "@/lib/pwa-utils";

interface UpdateNotificationProps {
  className?: string;
  position?: "top" | "bottom";
  autoUpdate?: boolean;
  onUpdate?: () => void;
  onDismiss?: () => void;
}

const UpdateNotification: React.FC<UpdateNotificationProps> = ({
  className = "",
  position = "bottom",
  autoUpdate = false,
  onUpdate,
  onDismiss,
}) => {
  const [dismissed, setDismissed] = useState(false);
  const { updateAvailable, updateServiceWorker } = useServiceWorkerUpdates();

  // Auto-update if configured
  React.useEffect(() => {
    if (autoUpdate && updateAvailable) {
      handleUpdate();
    }
  }, [autoUpdate, updateAvailable]);

  const handleUpdate = () => {
    updateServiceWorker();
    onUpdate?.();
  };

  const handleDismiss = () => {
    setDismissed(true);
    onDismiss?.();
  };

  // Don't render if no update or already dismissed
  if (!updateAvailable || dismissed) {
    return null;
  }

  const positionClass =
    position === "top" ? "top-4 left-4 right-4" : "bottom-4 left-4 right-4";

  return (
    <AnimatePresence>
      {updateAvailable && !dismissed && (
        <motion.div
          initial={{ opacity: 0, y: position === "top" ? -20 : 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: position === "top" ? -20 : 20 }}
          transition={{ duration: 0.3 }}
          className={`fixed ${positionClass} z-50 max-w-md mx-auto ${className}`}
        >
          <Card className="p-4 shadow-lg border-l-4 border-blue-500 bg-white">
            <div className="flex items-start justify-between">
              <div className="flex items-center">
                <div className="bg-blue-100 p-2 rounded-full mr-3">
                  <RefreshCw className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-bold">Update Available</h3>
                  <p className="text-sm text-gray-600">
                    A new version of eVuka Rewards is available
                  </p>
                </div>
              </div>
              <button
                onClick={handleDismiss}
                className="text-gray-400 hover:text-gray-600 transition-colors"
                aria-label="Dismiss"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mt-3 flex justify-end space-x-3">
              <Button variant="outline" size="sm" onClick={handleDismiss}>
                Later
              </Button>
              <Button
                size="sm"
                onClick={handleUpdate}
                className="bg-blue-600 hover:bg-blue-700 flex items-center"
              >
                <RefreshCw className="mr-1 h-4 w-4" />
                Update Now
              </Button>
            </div>
          </Card>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default UpdateNotification;
