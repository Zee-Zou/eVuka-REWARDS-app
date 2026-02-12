/**
 * Camera management hook
 * Handles camera stream initialization, permissions, and cleanup
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { logger } from "../lib/logger";

export interface UseCameraOptions {
  facingMode?: "user" | "environment";
  autoStart?: boolean;
  onPermissionDenied?: () => void;
  onError?: (error: Error) => void;
}

export interface UseCameraReturn {
  videoRef: React.RefObject<HTMLVideoElement>;
  stream: MediaStream | null;
  isActive: boolean;
  isLoading: boolean;
  error: Error | null;
  hasPermission: boolean;
  startCamera: () => Promise<void>;
  stopCamera: () => void;
  captureFrame: () => string | null;
  switchCamera: () => Promise<void>;
}

export function useCamera(options: UseCameraOptions = {}): UseCameraReturn {
  const {
    facingMode: initialFacingMode = "environment",
    autoStart = false,
    onPermissionDenied,
    onError,
  } = options;

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isActive, setIsActive] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [hasPermission, setHasPermission] = useState(false);
  const [facingMode, setFacingMode] = useState(initialFacingMode);

  /**
   * Start the camera stream
   */
  const startCamera = useCallback(async () => {
    if (streamRef.current) {
      logger.debug("Camera already active");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      logger.info("Requesting camera access", { facingMode });

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: facingMode },
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      });

      streamRef.current = mediaStream;
      setStream(mediaStream);
      setHasPermission(true);
      setIsActive(true);

      // Attach stream to video element
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }

      logger.info("Camera started successfully");
    } catch (err) {
      const cameraError = err instanceof Error ? err : new Error("Failed to access camera");

      logger.error("Camera access failed:", cameraError);
      setError(cameraError);
      setHasPermission(false);

      if (cameraError.name === "NotAllowedError" || cameraError.name === "PermissionDeniedError") {
        onPermissionDenied?.();
      }

      onError?.(cameraError);
    } finally {
      setIsLoading(false);
    }
  }, [facingMode, onPermissionDenied, onError]);

  /**
   * Stop the camera stream
   */
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      logger.info("Stopping camera");

      streamRef.current.getTracks().forEach((track) => {
        track.stop();
        logger.debug("Camera track stopped:", { kind: track.kind });
      });

      streamRef.current = null;
      setStream(null);
      setIsActive(false);

      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    }
  }, []);

  /**
   * Capture current frame from video as base64 image
   */
  const captureFrame = useCallback((): string | null => {
    if (!videoRef.current || !streamRef.current) {
      logger.warn("Cannot capture frame - camera not active");
      return null;
    }

    try {
      const video = videoRef.current;
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      const context = canvas.getContext("2d");
      if (!context) {
        throw new Error("Failed to get canvas context");
      }

      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      const imageData = canvas.toDataURL("image/jpeg", 0.92);

      logger.info("Frame captured", {
        width: canvas.width,
        height: canvas.height,
      });

      return imageData;
    } catch (err) {
      const captureError = err instanceof Error ? err : new Error("Failed to capture frame");
      logger.error("Frame capture failed:", captureError);
      setError(captureError);
      onError?.(captureError);
      return null;
    }
  }, [onError]);

  /**
   * Switch between front and back camera
   */
  const switchCamera = useCallback(async () => {
    logger.info("Switching camera");

    // Stop current stream
    stopCamera();

    // Switch facing mode
    const newFacingMode = facingMode === "user" ? "environment" : "user";
    setFacingMode(newFacingMode);

    // Start with new facing mode
    // Wait a bit for the stream to fully stop
    await new Promise((resolve) => setTimeout(resolve, 100));
    await startCamera();
  }, [facingMode, startCamera, stopCamera]);

  /**
   * Auto-start camera if requested
   */
  useEffect(() => {
    if (autoStart) {
      startCamera();
    }

    // Cleanup on unmount
    return () => {
      stopCamera();
    };
  }, [autoStart]); // Only run on mount/unmount

  return {
    videoRef,
    stream,
    isActive,
    isLoading,
    error,
    hasPermission,
    startCamera,
    stopCamera,
    captureFrame,
    switchCamera,
  };
}
