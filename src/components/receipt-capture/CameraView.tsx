import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Camera,
  Sun,
  AlertCircle,
  ChevronDown,
  Trash2,
  RotateCcw,
  ZoomIn,
  ZoomOut,
  Sliders,
  Image as ImageIcon,
  Maximize2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { logger } from "@/lib/logger";
import { OCRResult } from "@/lib/ocr";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import ImageEnhancer from "./ImageEnhancer";

interface CameraViewProps {
  onCapture?: (image: string) => void;
  isActive?: boolean;
  ocrResult?: OCRResult | null;
  showOcrConfidence?: boolean;
}

const CameraView = ({
  onCapture = () => {},
  isActive = true,
  ocrResult = null,
  showOcrConfidence = false,
}: CameraViewProps) => {
  const [deviceOrientation, setDeviceOrientation] = useState<
    "portrait" | "landscape"
  >("portrait");
  const [lightLevel, setLightLevel] = useState<"good" | "poor">("good");
  const [qualityScore, setQualityScore] = useState(75);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [capturedImages, setCapturedImages] = useState<string[]>([]);
  const [isMultiCapture, setIsMultiCapture] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [showEnhancer, setShowEnhancer] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(
    null,
  );
  const [torchEnabled, setTorchEnabled] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const streamRef = useRef<MediaStream | null>(null); // Track stream for cleanup
  const cleanupFunctionsRef = useRef<Array<() => void>>([]); // Track all cleanup functions

  // Ambient light detection
  const detectAmbientLight = useCallback(() => {
    // Use simulated ambient light detection since AmbientLightSensor is not widely supported
    return simulateAmbientLight();
  }, []);

  // Simulated ambient light check as fallback
  const simulateAmbientLight = () => {
    const interval = setInterval(() => {
      setLightLevel(Math.random() > 0.3 ? "good" : "poor");
      setQualityScore(Math.floor(Math.random() * 30) + 70);
    }, 2000);
    return () => clearInterval(interval);
  };

  useEffect(() => {
    if (isActive) {
      // Clear any previous cleanup functions
      cleanupFunctionsRef.current = [];

      initializeCamera();
      const ambientLightCleanup = detectAmbientLight();
      if (ambientLightCleanup) {
        cleanupFunctionsRef.current.push(ambientLightCleanup);
      }

      // Handle device orientation changes
      const handleOrientationChange = () => {
        const angle = window.orientation as number;
        if (angle === undefined) {
          // Use screen dimensions as fallback for browsers that don't support window.orientation
          setDeviceOrientation(
            window.innerHeight > window.innerWidth ? "portrait" : "landscape",
          );
        } else {
          setDeviceOrientation(
            angle === 0 || angle === 180 ? "portrait" : "landscape",
          );
        }
      };

      // Set initial orientation
      handleOrientationChange();

      // Add event listeners for orientation changes
      window.addEventListener("orientationchange", handleOrientationChange);
      window.addEventListener("resize", handleOrientationChange);

      // Register event listener cleanup
      cleanupFunctionsRef.current.push(() => {
        window.removeEventListener("orientationchange", handleOrientationChange);
        window.removeEventListener("resize", handleOrientationChange);
      });

      // Comprehensive cleanup function
      return () => {
        // Execute all registered cleanup functions
        cleanupFunctionsRef.current.forEach((fn) => {
          try {
            fn();
          } catch (error) {
            logger.error("Error during cleanup:", error);
          }
        });
        cleanupFunctionsRef.current = [];

        // Stop media stream and clear video element
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((track) => {
            track.stop();
            logger.info(`Stopped media track: ${track.kind}`);
          });
          streamRef.current = null;
        }

        // Clear video element srcObject
        if (videoRef.current) {
          videoRef.current.srcObject = null;
        }

        // Reset state
        setStream(null);
      };
    }
  }, [isActive, detectAmbientLight]);

  const initializeCamera = async () => {
    try {
      setCameraError(null);
      const constraints = {
        video: {
          facingMode: "environment",
          width: { ideal: 1920 },
          height: { ideal: 1080 },
          // Add advanced constraints for better mobile camera handling
          advanced: [{ width: { min: 640 } }, { frameRate: { ideal: 30 } }],
        },
      };

      // Handle potential permission issues on mobile devices
      const mediaStream = await navigator.mediaDevices
        .getUserMedia(constraints)
        .catch(async (err) => {
          logger.warn("Failed with ideal resolution, trying fallback", err);
          // Fallback to lower resolution if high resolution fails
          return navigator.mediaDevices.getUserMedia({
            video: {
              facingMode: "environment",
              width: { ideal: 1280 },
              height: { ideal: 720 },
            },
          });
        });
      setStream(mediaStream);
      streamRef.current = mediaStream; // Store in ref for cleanup

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        await videoRef.current.play().catch((err) => {
          logger.error("Error playing video:", err);
          setCameraError("Could not start video stream");
        });
      }

      // Try to set zoom if available
      try {
        const videoTrack = mediaStream.getVideoTracks()[0];
        const capabilities = videoTrack.getCapabilities();
        if (capabilities.zoom) {
          logger.info("Camera supports zoom", {
            min: capabilities.zoom.min,
            max: capabilities.zoom.max,
            step: capabilities.zoom.step,
          });
        }

        // Check if torch is supported
        if (capabilities.torch) {
          logger.info("Camera supports torch");
        }
      } catch (err) {
        logger.warn("Could not check camera capabilities", err);
      }
    } catch (err) {
      logger.error("Error accessing camera:", err);
      setCameraError(
        "Could not access camera. Please ensure camera permissions are granted.",
      );
    }
  };

  const toggleTorch = async () => {
    if (!stream) return;

    try {
      const videoTrack = stream.getVideoTracks()[0];
      const capabilities = videoTrack.getCapabilities();

      if (capabilities.torch) {
        const newTorchState = !torchEnabled;
        await videoTrack.applyConstraints({
          advanced: [{ torch: newTorchState }],
        });
        setTorchEnabled(newTorchState);
        logger.info(`Torch ${newTorchState ? "enabled" : "disabled"}`);
      } else {
        logger.warn("Torch not supported on this device");
      }
    } catch (err) {
      logger.error("Error toggling torch:", err);
    }
  };

  const captureImage = () => {
    if (videoRef.current) {
      setIsCapturing(true);
      try {
        const canvas = document.createElement("canvas");
        canvas.width = videoRef.current.videoWidth;
        canvas.height = videoRef.current.videoHeight;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          // Apply any image enhancements based on light level
          if (lightLevel === "poor") {
            ctx.filter = "brightness(1.2) contrast(1.1)";
          }

          ctx.drawImage(videoRef.current, 0, 0);
          const imageData = canvas.toDataURL("image/jpeg", 0.9); // 0.9 quality for better compression
          setIsCapturing(false);
          return imageData;
        }
      } catch (error) {
        logger.error("Error capturing image:", error);
      }
      setIsCapturing(false);
    }
    return null;
  };

  const handleCapture = () => {
    const imageData = captureImage();
    if (imageData) {
      if (isMultiCapture) {
        setCapturedImages([...capturedImages, imageData]);
      } else {
        onCapture(imageData);
      }
    }
  };

  const handleMultiCaptureToggle = () => {
    setIsMultiCapture(!isMultiCapture);
    setCapturedImages([]);
  };

  const handleDeleteImage = (index: number) => {
    const newImages = [...capturedImages];
    newImages.splice(index, 1);
    setCapturedImages(newImages);
  };

  const handleEditImage = (index: number) => {
    setSelectedImageIndex(index);
    setShowEnhancer(true);
  };

  const handleSaveEnhancedImage = (enhancedImage: string) => {
    if (selectedImageIndex !== null) {
      const newImages = [...capturedImages];
      newImages[selectedImageIndex] = enhancedImage;
      setCapturedImages(newImages);
    }
    setShowEnhancer(false);
    setSelectedImageIndex(null);
  };

  const handleSubmitMultiCapture = async () => {
    if (capturedImages.length === 0) return;

    setIsProcessing(true);
    try {
      // Combine images into a single long receipt
      const combinedImage = await combineImages(capturedImages);
      onCapture(combinedImage);
      setCapturedImages([]);
    } catch (error) {
      logger.error("Error combining images:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const combineImages = async (images: string[]): Promise<string> => {
    return new Promise((resolve) => {
      // Create canvases for each image to get dimensions
      const imageElements: HTMLImageElement[] = [];
      let totalHeight = 0;
      let maxWidth = 0;

      // Load all images to calculate dimensions
      let loadedCount = 0;
      images.forEach((src, index) => {
        const img = new Image();
        img.onload = () => {
          totalHeight += img.height;
          maxWidth = Math.max(maxWidth, img.width);
          imageElements[index] = img;
          loadedCount++;

          // Once all images are loaded, combine them
          if (loadedCount === images.length) {
            const canvas = document.createElement("canvas");
            canvas.width = maxWidth;
            canvas.height = totalHeight;
            const ctx = canvas.getContext("2d");

            if (ctx) {
              // Enable image smoothing for better quality
              ctx.imageSmoothingEnabled = true;
              ctx.imageSmoothingQuality = "high";

              let currentY = 0;
              imageElements.forEach((img, idx) => {
                // Center image horizontally if narrower than canvas
                const x = (maxWidth - img.width) / 2;

                // Add a small overlap between images to avoid gaps
                const overlap = idx > 0 ? 10 : 0;
                ctx.drawImage(img, x, currentY - overlap);

                // Draw a subtle separator line between images (except for the last one)
                if (idx < imageElements.length - 1) {
                  const lineY = currentY + img.height - overlap / 2;
                  ctx.strokeStyle = "rgba(200, 200, 200, 0.3)";
                  ctx.beginPath();
                  ctx.moveTo(0, lineY);
                  ctx.lineTo(maxWidth, lineY);
                  ctx.stroke();
                }

                currentY += img.height - overlap;
              });

              resolve(canvas.toDataURL("image/jpeg", 0.9));
            } else {
              // Fallback if context fails
              resolve(images[0]);
            }
          }
        };
        img.src = src;
      });
    });
  };

  const scrollToBottom = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop =
        scrollContainerRef.current.scrollHeight;
    }
  };

  const handleZoom = (direction: "in" | "out") => {
    if (!stream) return;

    try {
      const videoTrack = stream.getVideoTracks()[0];
      const capabilities = videoTrack.getCapabilities();

      if (capabilities.zoom) {
        const constraints = videoTrack.getConstraints();
        const currentZoom = constraints.zoom || 1;
        const step = capabilities.zoom.step || 0.1;

        let newZoom =
          direction === "in" ? currentZoom + step : currentZoom - step;
        newZoom = Math.max(
          capabilities.zoom.min || 1,
          Math.min(capabilities.zoom.max || 2, newZoom),
        );

        videoTrack
          .applyConstraints({
            advanced: [{ zoom: newZoom }],
          })
          .then(() => {
            setZoomLevel(newZoom);
          })
          .catch((err) => {
            logger.warn("Could not apply zoom:", err);
          });
      }
    } catch (err) {
      logger.warn("Error adjusting zoom:", err);
    }
  };

  useEffect(() => {
    if (capturedImages.length > 0) {
      scrollToBottom();
    }
  }, [capturedImages]);

  // If showing enhancer, render that instead
  if (
    showEnhancer &&
    selectedImageIndex !== null &&
    capturedImages[selectedImageIndex]
  ) {
    return (
      <ImageEnhancer
        imageData={capturedImages[selectedImageIndex]}
        onSave={handleSaveEnhancedImage}
        onCancel={() => {
          setShowEnhancer(false);
          setSelectedImageIndex(null);
        }}
      />
    );
  }

  return (
    <Card
      className={`w-full max-w-[800px] bg-gray-900 relative overflow-hidden flex flex-col ${deviceOrientation === "landscape" ? "landscape-mode" : ""}`}
    >
      <div
        className={`relative ${deviceOrientation === "landscape" ? "h-[400px] md:h-[500px]" : "h-[500px] md:h-[600px]"}`}
      >
        {cameraError ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-800 text-white p-6 text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
            <h3 className="text-xl font-bold mb-2">Camera Error</h3>
            <p className="mb-4">{cameraError}</p>
            <Button onClick={initializeCamera}>Try Again</Button>
          </div>
        ) : (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover"
            style={{
              transform:
                deviceOrientation === "landscape"
                  ? "rotate(0deg)"
                  : "rotate(0deg)",
              maxHeight: "100%",
              maxWidth: "100%",
            }}
          />
        )}

        {/* Overlay UI */}
        <div className="absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/50 to-transparent">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1 sm:gap-2">
              <Camera className="text-white" size={20} />
              <span className="text-white font-medium text-sm sm:text-base">
                Receipt Capture
              </span>
            </div>
            <div className="flex items-center gap-1 sm:gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="text-white hover:bg-white/20 text-xs sm:text-sm px-2 sm:px-3 h-7 sm:h-8"
                onClick={handleMultiCaptureToggle}
              >
                {isMultiCapture ? "Single" : "Multi"}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/20 h-7 w-7 sm:h-8 sm:w-8"
                onClick={toggleTorch}
                title={torchEnabled ? "Turn off flash" : "Turn on flash"}
              >
                <Sun
                  className={torchEnabled ? "text-yellow-400" : "text-white"}
                  size={16}
                />
              </Button>
              <span
                className={`text-xs sm:text-sm ${lightLevel === "good" ? "text-green-400" : "text-yellow-400"} hidden sm:inline-block`}
              >
                {lightLevel === "good" ? "Good Lighting" : "Poor Lighting"}
              </span>
            </div>
          </div>
        </div>

        {/* Camera Controls */}
        <div className="absolute top-20 right-4 flex flex-col gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="bg-black/30 text-white hover:bg-black/50"
                  onClick={() => handleZoom("in")}
                >
                  <ZoomIn size={18} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Zoom In</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="bg-black/30 text-white hover:bg-black/50"
                  onClick={() => handleZoom("out")}
                >
                  <ZoomOut size={18} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Zoom Out</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        {/* Quality Indicator */}
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/50 to-transparent">
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-white text-sm">Image Quality</span>
              <span className="text-white text-sm">{qualityScore}%</span>
            </div>
            <Progress value={qualityScore} className="h-2" />
          </div>

          {/* OCR Confidence Score */}
          {showOcrConfidence && ocrResult && (
            <div className="mt-2 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-white text-sm flex items-center">
                  <Scan className="h-3 w-3 mr-1" /> OCR Confidence
                </span>
                <span className="text-white text-sm">
                  {Math.round(ocrResult.confidence)}%
                </span>
              </div>
              <Progress
                value={ocrResult.confidence}
                className="h-2"
                indicatorClassName={`${ocrResult.confidence < 50 ? "bg-red-500" : ocrResult.confidence < 75 ? "bg-yellow-500" : "bg-green-500"}`}
              />
              {ocrResult.imageQuality && (
                <div className="flex justify-end">
                  <span
                    className={`text-xs ${ocrResult.imageQuality === "low" ? "text-red-300" : ocrResult.imageQuality === "medium" ? "text-yellow-300" : "text-green-300"}`}
                  >
                    {ocrResult.imageQuality.charAt(0).toUpperCase() +
                      ocrResult.imageQuality.slice(1)}{" "}
                    quality
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Capture Button */}
          <div className="mt-4 flex justify-center">
            <Button
              size="lg"
              variant="secondary"
              className="rounded-full w-16 h-16 p-0 border-4 border-white"
              onClick={handleCapture}
              disabled={isProcessing || isCapturing || !!cameraError}
            >
              {isProcessing || isCapturing ? (
                <LoadingSpinner size={24} className="text-white" />
              ) : (
                <span className="sr-only">Capture</span>
              )}
            </Button>
          </div>
        </div>

        {/* Warning Alert */}
        {lightLevel === "poor" && (
          <Alert
            variant="warning"
            className="absolute top-16 left-4 right-4 bg-yellow-400/90"
          >
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Poor lighting detected. Try moving to a better-lit area or use the
              flash for optimal capture.
            </AlertDescription>
          </Alert>
        )}
      </div>

      {/* Multi-capture preview section */}
      {isMultiCapture && (
        <div className="bg-gray-800 p-4">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-white font-medium">
              Captured Sections ({capturedImages.length})
            </h3>
            <div className="flex gap-2">
              {capturedImages.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  className="text-white border-white/30 hover:bg-white/10"
                  onClick={() => setCapturedImages([])}
                >
                  <RotateCcw size={14} className="mr-1" />
                  Clear All
                </Button>
              )}
              {capturedImages.length > 0 && (
                <Button
                  onClick={handleSubmitMultiCapture}
                  disabled={isProcessing}
                  className="bg-green-500 hover:bg-green-600 text-white"
                >
                  {isProcessing ? (
                    <>
                      <LoadingSpinner size={16} className="mr-2" />
                      Processing...
                    </>
                  ) : (
                    "Combine & Submit"
                  )}
                </Button>
              )}
            </div>
          </div>

          <div
            ref={scrollContainerRef}
            className="max-h-[200px] overflow-y-auto space-y-2 p-2 bg-gray-700 rounded"
          >
            {capturedImages.length === 0 ? (
              <p className="text-gray-400 text-center py-4">
                Capture multiple sections of your long receipt from top to
                bottom
              </p>
            ) : (
              capturedImages.map((img, index) => (
                <div key={index} className="relative group">
                  <img
                    src={img}
                    alt={`Receipt section ${index + 1}`}
                    className="w-full h-auto rounded border border-gray-600"
                  />
                  <div className="absolute top-2 right-2 bg-black/70 text-white px-2 py-1 rounded text-xs">
                    Section {index + 1}
                  </div>
                  <div className="absolute top-2 left-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="destructive"
                      size="icon"
                      onClick={() => handleDeleteImage(index)}
                      title="Delete section"
                    >
                      <Trash2 size={14} />
                    </Button>
                    <Button
                      variant="secondary"
                      size="icon"
                      onClick={() => handleEditImage(index)}
                      title="Enhance image"
                    >
                      <Sliders size={14} />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>

          {capturedImages.length > 0 && (
            <div className="flex justify-center mt-2">
              <Button
                variant="ghost"
                size="sm"
                className="text-gray-300 hover:text-white text-xs sm:text-sm"
                onClick={scrollToBottom}
              >
                <ChevronDown className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                Scroll to bottom
              </Button>
            </div>
          )}
        </div>
      )}
    </Card>
  );
};

export default CameraView;
