/**
 * Light condition monitoring hook
 * Monitors ambient light to help users capture better receipt images
 */

import { useState, useEffect, useRef } from "react";
import { logger } from "../lib/logger";

export type LightCondition = "good" | "poor" | "unknown";

export interface UseLightConditionOptions {
  videoRef: React.RefObject<HTMLVideoElement>;
  checkInterval?: number; // Milliseconds between checks
  threshold?: number; // Brightness threshold (0-255)
  enabled?: boolean;
}

export interface UseLightConditionReturn {
  lightCondition: LightCondition;
  brightness: number;
  isMonitoring: boolean;
}

export function useLightCondition(
  options: UseLightConditionOptions
): UseLightConditionReturn {
  const {
    videoRef,
    checkInterval = 1000,
    threshold = 80,
    enabled = true,
  } = options;

  const [lightCondition, setLightCondition] = useState<LightCondition>("unknown");
  const [brightness, setBrightness] = useState(0);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!enabled || !videoRef.current) {
      return;
    }

    // Create off-screen canvas for brightness analysis
    if (!canvasRef.current) {
      canvasRef.current = document.createElement("canvas");
    }

    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");

    if (!context) {
      logger.warn("Could not create canvas context for light monitoring");
      return;
    }

    /**
     * Check current light conditions
     */
    const checkLightCondition = () => {
      const video = videoRef.current;

      if (!video || video.readyState !== video.HAVE_ENOUGH_DATA) {
        return;
      }

      try {
        // Set canvas size to sample from video
        const sampleWidth = 100;
        const sampleHeight = 100;
        canvas.width = sampleWidth;
        canvas.height = sampleHeight;

        // Draw current video frame to canvas
        context.drawImage(video, 0, 0, sampleWidth, sampleHeight);

        // Get image data
        const imageData = context.getImageData(0, 0, sampleWidth, sampleHeight);
        const data = imageData.data;

        // Calculate average brightness
        let totalBrightness = 0;
        const pixelCount = data.length / 4; // RGBA, so 4 values per pixel

        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];

          // Calculate perceived brightness using luminosity formula
          const brightness = 0.299 * r + 0.587 * g + 0.114 * b;
          totalBrightness += brightness;
        }

        const avgBrightness = totalBrightness / pixelCount;
        setBrightness(Math.round(avgBrightness));

        // Determine light condition
        const newCondition: LightCondition = avgBrightness >= threshold ? "good" : "poor";

        if (newCondition !== lightCondition) {
          setLightCondition(newCondition);
          logger.debug("Light condition changed:", {
            condition: newCondition,
            brightness: Math.round(avgBrightness),
          });
        }
      } catch (error) {
        logger.error("Error checking light condition:", error);
      }
    };

    // Start monitoring
    setIsMonitoring(true);
    intervalRef.current = setInterval(checkLightCondition, checkInterval);

    logger.debug("Light condition monitoring started");

    // Cleanup
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      setIsMonitoring(false);
      logger.debug("Light condition monitoring stopped");
    };
  }, [enabled, videoRef, checkInterval, threshold, lightCondition]);

  return {
    lightCondition,
    brightness,
    isMonitoring,
  };
}
