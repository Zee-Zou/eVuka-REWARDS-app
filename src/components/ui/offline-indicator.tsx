import React, { useState, useEffect } from "react";
import { Wifi, WifiOff } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface OfflineIndicatorProps {
  className?: string;
  showOfflineOnly?: boolean;
}

const OfflineIndicator: React.FC<OfflineIndicatorProps> = ({
  className = "",
  showOfflineOnly = true,
}) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [visible, setVisible] = useState(true);
  const [animateOut, setAnimateOut] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      // Start fade out animation for online status after 3 seconds
      if (showOfflineOnly) {
        setTimeout(() => setAnimateOut(true), 3000);
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
      setAnimateOut(false);
      setVisible(true);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [showOfflineOnly]);

  // Handle animation completion
  const handleAnimationComplete = () => {
    if (animateOut) {
      setVisible(false);
      setAnimateOut(false);
    }
  };

  // Don't render if we're online and only showing offline state
  if (showOfflineOnly && isOnline && !visible) {
    return null;
  }

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: animateOut ? 0 : 1, y: animateOut ? -20 : 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
          onAnimationComplete={handleAnimationComplete}
          className={`fixed top-0 left-0 right-0 z-50 flex justify-center ${className}`}
        >
          <div
            className={`flex items-center px-4 py-2 rounded-b-lg shadow-md ${isOnline ? "bg-green-500" : "bg-red-500"}`}
          >
            {isOnline ? (
              <>
                <Wifi className="h-4 w-4 text-white mr-2" />
                <span className="text-sm font-medium text-white">
                  Back online
                </span>
              </>
            ) : (
              <>
                <WifiOff className="h-4 w-4 text-white mr-2" />
                <span className="text-sm font-medium text-white">
                  You are offline
                </span>
              </>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default OfflineIndicator;
