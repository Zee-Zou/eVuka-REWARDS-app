import React, { useState } from "react";
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import { Alert, AlertDescription } from "../ui/alert";
import { LoadingSpinner } from "../ui/loading-spinner";
import { WifiOff, Camera, Upload, Save, AlertCircle } from "lucide-react";
import { offlineStorage } from "@/lib/offline-storage";
import { logger } from "@/lib/logger";

interface OfflineCaptureProps {
  onCapture: (image: string) => void;
  onCancel: () => void;
}

const OfflineCapture: React.FC<OfflineCaptureProps> = ({
  onCapture,
  onCancel,
}) => {
  const [captureMethod, setCaptureMethod] = useState<
    "camera" | "upload" | null
  >(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleCameraCapture = () => {
    setCaptureMethod("camera");
    setIsCapturing(true);
  };

  const handleFileUpload = () => {
    setCaptureMethod("upload");
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsCapturing(true);
    setError(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      const imageData = e.target?.result as string;
      setCapturedImage(imageData);
      setIsCapturing(false);
    };
    reader.onerror = () => {
      setError("Failed to read the image file");
      setIsCapturing(false);
    };
    reader.readAsDataURL(file);
  };

  const takePicture = () => {
    // In a real implementation, this would use the camera API
    // For this example, we'll simulate a camera capture
    setIsCapturing(true);
    setTimeout(() => {
      // Simulate a captured image (base64 placeholder)
      const placeholderImage =
        "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";
      setCapturedImage(placeholderImage);
      setIsCapturing(false);
    }, 1500);
  };

  const handleSaveOffline = async () => {
    if (!capturedImage) return;

    setIsSaving(true);
    setError(null);

    // Validate image data before saving
    if (!validateImageData(capturedImage)) {
      setError("Invalid image data. Please capture the receipt again.");
      setIsSaving(false);
      return;
    }

    try {
      // Compress image if it's too large (over 1MB)
      const processedImage = await processImageForStorage(capturedImage);

      // Save the receipt to IndexedDB for later processing
      await offlineStorage.saveReceipt(processedImage, {
        captureTime: new Date().toISOString(),
        source: captureMethod,
        deviceInfo: getDeviceInfo(),
        appVersion: import.meta.env.VITE_APP_VERSION || "1.0.0",
      });

      logger.info("Receipt saved for offline processing");
      onCapture(processedImage);
    } catch (err) {
      setError("Failed to save receipt for offline processing");
      logger.error("Failed to save receipt offline", err);
    } finally {
      setIsSaving(false);
    }
  };

  // Validate image data to ensure it's a proper base64 image
  const validateImageData = (imageData: string): boolean => {
    // Check if it's a valid base64 image string
    return (
      !!imageData &&
      (imageData.startsWith("data:image/") ||
        imageData.startsWith("data:application/octet-stream"))
    );
  };

  // Get basic device info for troubleshooting
  const getDeviceInfo = (): Record<string, any> => {
    return {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      screenSize: `${window.screen.width}x${window.screen.height}`,
      isOnline: navigator.onLine,
      timestamp: new Date().toISOString(),
    };
  };

  // Process and optimize image for storage
  const processImageForStorage = async (imageData: string): Promise<string> => {
    // For large images, we might want to compress them
    if (imageData.length > 1000000) {
      // If larger than ~1MB
      try {
        // Create an image element to draw to canvas for compression
        const img = new Image();
        const loadPromise = new Promise<void>((resolve, reject) => {
          img.onload = () => resolve();
          img.onerror = () =>
            reject(new Error("Failed to load image for compression"));
        });
        img.src = imageData;
        await loadPromise;

        // Create canvas for compression
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        if (!ctx) throw new Error("Could not get canvas context");

        // Set dimensions (optionally scale down very large images)
        const maxDimension = 1200; // Max width or height
        let width = img.width;
        let height = img.height;

        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round(height * (maxDimension / width));
            width = maxDimension;
          } else {
            width = Math.round(width * (maxDimension / height));
            height = maxDimension;
          }
        }

        canvas.width = width;
        canvas.height = height;

        // Draw and compress
        ctx.drawImage(img, 0, 0, width, height);
        return canvas.toDataURL("image/jpeg", 0.7); // Adjust quality as needed
      } catch (error) {
        logger.error("Image compression failed, using original", error);
        return imageData; // Fall back to original if compression fails
      }
    }

    return imageData; // Return original for smaller images
  };

  const handleRetry = () => {
    setCapturedImage(null);
    setCaptureMethod(null);
    setError(null);
  };

  return (
    <Card className="p-6 bg-white shadow-md">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <WifiOff className="h-5 w-5 text-orange-500 mr-2" />
          <h2 className="text-xl font-bold text-gray-900">Offline Mode</h2>
        </div>
        <Button variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
      </div>

      <Alert className="mb-4 bg-blue-50 border-blue-200">
        <AlertDescription>
          <p className="text-sm text-blue-800">
            You're currently offline. Your receipt will be saved locally and
            processed when you're back online.
          </p>
        </AlertDescription>
      </Alert>

      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {!capturedImage ? (
        <div className="space-y-4">
          <p className="text-gray-600 mb-4">
            Choose how you want to capture your receipt:
          </p>

          <div className="grid grid-cols-2 gap-4">
            <Button
              variant="outline"
              className="flex flex-col items-center justify-center h-24 p-4 hover:bg-gray-50"
              onClick={handleCameraCapture}
              disabled={isCapturing}
            >
              <Camera className="h-8 w-8 mb-2 text-primary" />
              <span>Camera</span>
            </Button>

            <Button
              variant="outline"
              className="flex flex-col items-center justify-center h-24 p-4 hover:bg-gray-50"
              onClick={handleFileUpload}
              disabled={isCapturing}
            >
              <Upload className="h-8 w-8 mb-2 text-primary" />
              <span>Upload</span>
            </Button>
          </div>

          <input
            type="file"
            ref={fileInputRef}
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />

          {captureMethod === "camera" && isCapturing && (
            <div className="mt-4 p-4 border rounded-lg bg-gray-50 flex flex-col items-center justify-center">
              <LoadingSpinner size={32} className="mb-2" />
              <p className="text-gray-600">Initializing camera...</p>
              <Button className="mt-4" onClick={takePicture}>
                Take Picture
              </Button>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="border rounded-lg overflow-hidden">
            <img
              src={capturedImage}
              alt="Captured receipt"
              className="w-full h-auto object-contain max-h-[300px]"
            />
          </div>

          <div className="flex justify-between">
            <Button variant="outline" onClick={handleRetry}>
              Retake
            </Button>
            <Button
              onClick={handleSaveOffline}
              disabled={isSaving}
              className="bg-green-600 hover:bg-green-700"
            >
              {isSaving ? (
                <>
                  <LoadingSpinner size={16} className="mr-2" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save for Later
                </>
              )}
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
};

export default OfflineCapture;
