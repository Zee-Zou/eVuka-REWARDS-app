import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import CameraView from "./CameraView";
import CaptureMethods from "./CaptureMethods";
import PointsDisplay from "./PointsDisplay";
import SuccessOverlay from "./SuccessOverlay";
import OfflineCapture from "./OfflineCapture";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import {
  Camera,
  Upload,
  Barcode,
  KeyboardIcon,
  Mail,
  Scan,
  Info,
  WifiOff,
  CloudOff,
  Cloud,
  RefreshCw,
  Gift,
  ChevronRight,
  Check,
  X,
  Edit,
  AlertCircle,
} from "lucide-react";
import { Progress } from "../ui/progress";
import { motion } from "framer-motion";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";
import { offlineStorage } from "@/lib/offline-storage";
import { logger } from "@/lib/logger";
import {
  getRewardRecommendations,
  RewardRecommendation,
} from "@/lib/gamification";
import { supabase } from "@/lib/supabase";
import { ProcessedReceipt } from "@/lib/receipt-processing";
import { useLocalStorage } from "@/lib/utils";

interface CaptureInterfaceProps {
  onCapture: (image: string) => Promise<number>;
  onSuccess: () => void;
  enableOCR?: boolean;
}

const CaptureInterface = (
  { onCapture, onSuccess, enableOCR: propEnableOCR }: CaptureInterfaceProps = {
    onCapture: async () => 50,
    onSuccess: () => {},
    enableOCR: true,
  },
) => {
  // Use the OCR setting from local storage, with prop as fallback
  const [enableOCR] = useLocalStorage("enableOCR", propEnableOCR !== false);
  // Track pending offline receipts
  const [pendingReceipts, setPendingReceipts] = useState<number>(0);
  const [isSyncingReceipts, setIsSyncingReceipts] = useState(false);
  const [captureMethod, setCaptureMethod] = useState<
    "camera" | "upload" | "barcode" | "manual" | "email" | "ar" | null
  >(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [earnedPoints, setEarnedPoints] = useState(0);
  const [dailyProgress, setDailyProgress] = useState(65); // Percentage of daily goal
  const [potentialPoints, setPotentialPoints] = useState(0);
  const [lightCondition, setLightCondition] = useState<"good" | "poor">("good");
  const [streakIncreased, setStreakIncreased] = useState(false);
  const [levelUp, setLevelUp] = useState(false);
  const [newAchievements, setNewAchievements] = useState<string[]>([]);
  const [showTips, setShowTips] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [rewardRecommendations, setRewardRecommendations] = useState<
    RewardRecommendation[]
  >([]);
  const [isLoadingRecommendations, setIsLoadingRecommendations] =
    useState(false);

  // Get high quality capture setting
  const [highQualityCapture] = useLocalStorage("highQualityCapture", true);

  // OCR-related states
  const [detectedProducts, setDetectedProducts] = useState<
    Array<{
      name: string;
      price: number;
      verified: boolean;
      editing: boolean;
    }>
  >([]);
  const [showDetectedProducts, setShowDetectedProducts] = useState(false);
  const [ocrError, setOcrError] = useState<string | null>(null);
  const [isProcessingOCR, setIsProcessingOCR] = useState(false);
  const [processedReceipt, setProcessedReceipt] =
    useState<ProcessedReceipt | null>(null);

  // Monitor online/offline status and check for pending receipts
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      // When coming back online, check if we need to sync receipts
      checkPendingReceipts();
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Initial check for pending receipts
    checkPendingReceipts();

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Load personalized reward recommendations
  useEffect(() => {
    const loadRecommendations = async () => {
      try {
        setIsLoadingRecommendations(true);

        // Get current user
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) return;

        // Get personalized recommendations
        const recommendations = await getRewardRecommendations(user.id, 3);
        setRewardRecommendations(recommendations);
      } catch (error) {
        logger.error("Error loading reward recommendations:", error);
      } finally {
        setIsLoadingRecommendations(false);
      }
    };

    if (isOnline) {
      loadRecommendations();
    }
  }, [isOnline]);

  // Check for pending offline receipts
  const checkPendingReceipts = async () => {
    try {
      const receipts = await offlineStorage.getPendingReceipts();
      setPendingReceipts(receipts.length);
    } catch (error) {
      logger.error("Error checking pending receipts", error);
    }
  };

  // Sync offline receipts when back online
  const syncOfflineReceipts = async () => {
    if (!isOnline || pendingReceipts === 0) return;

    setIsSyncingReceipts(true);
    try {
      const receipts = await offlineStorage.getPendingReceipts();

      // Process each receipt
      for (const receipt of receipts) {
        try {
          // Process the receipt
          const points = await onCapture(receipt.imageData);

          // If successful, remove from offline storage
          await offlineStorage.removeReceipt(receipt.id);

          logger.info("Synced offline receipt", { id: receipt.id, points });
        } catch (error) {
          logger.error("Failed to sync receipt", { id: receipt.id, error });
        }
      }

      // Update pending count
      await checkPendingReceipts();
    } catch (error) {
      logger.error("Error syncing offline receipts", error);
    } finally {
      setIsSyncingReceipts(false);
    }
  };

  // Simulate potential points calculation based on receipt quality
  useEffect(() => {
    const interval = setInterval(() => {
      if (isCapturing && captureMethod === "camera") {
        // Simulate AI analyzing the receipt in real-time
        const basePoints = Math.floor(Math.random() * 30) + 20;
        const qualityBonus = lightCondition === "good" ? 10 : 0;
        setPotentialPoints(basePoints + qualityBonus);

        // Simulate light condition changes
        setLightCondition(Math.random() > 0.7 ? "poor" : "good");
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [isCapturing, captureMethod, lightCondition]);

  const handleMethodSelect = (
    method: "camera" | "upload" | "barcode" | "manual" | "email" | "ar",
  ) => {
    setCaptureMethod(method);
    setIsCapturing(true);
    setPotentialPoints(Math.floor(Math.random() * 30) + 20); // Initial estimate
  };

  const handleCancel = () => {
    setCaptureMethod(null);
    setIsCapturing(false);
    setPotentialPoints(0);
  };

  const handleImageCapture = async (image: string) => {
    try {
      setIsCapturing(false);
      setOcrError(null);

      // Show processing state
      setPotentialPoints(0);
      setIsProcessingOCR(true);

      // Check if we're online
      if (!isOnline) {
        // Store receipt for offline processing
        const receiptId = await offlineStorage.saveReceipt(image, {
          captureMethod: captureMethod,
          timestamp: Date.now(),
        });

        logger.info("Receipt saved for offline processing", { id: receiptId });

        // Update pending count
        await checkPendingReceipts();

        // Show success message but with offline indicator
        setEarnedPoints(0); // We don't know points yet
        setStreakIncreased(false);
        setLevelUp(false);
        setNewAchievements(["Offline Capture"]);
        setShowSuccess(true);
        setIsProcessingOCR(false);

        return;
      }

      try {
        // Process the receipt and get points
        // Pass OCR quality setting to the capture function
        const points = await onCapture(image);
        setEarnedPoints(points);

        // Get the processed receipt data from the global window object
        // This is a temporary solution until we have a proper state management system
        if (enableOCR && (window as Record<string, unknown>)._lastProcessedReceipt) {
          const receipt = (window as Record<string, unknown>)
            ._lastProcessedReceipt as ProcessedReceipt;
          setProcessedReceipt(receipt);

          // Transform detected products to our internal format
          if (receipt.detectedProducts && receipt.detectedProducts.length > 0) {
            const products = receipt.detectedProducts.map((product) => ({
              name: product.name,
              price: product.price,
              verified: false,
              editing: false,
            }));

            setDetectedProducts(products);
            setShowDetectedProducts(true);
          }
        }

        // Simulate streak and level up events (in a real app, this would come from the backend)
        const didStreakIncrease = Math.random() > 0.7;
        const didLevelUp = Math.random() > 0.85;
        const achievements = [];

        if (Math.random() > 0.7) {
          achievements.push("Receipt Master");
        }

        if (points > 75 && Math.random() > 0.8) {
          achievements.push("Big Spender");
        }

        setStreakIncreased(didStreakIncrease);
        setLevelUp(didLevelUp);
        setNewAchievements(achievements);

        // Update daily progress
        setDailyProgress(Math.min(100, dailyProgress + (points / 200) * 100));

        // Only show success overlay if we don't have products to verify
        if (!showDetectedProducts) {
          setShowSuccess(true);

          // Auto-close success after delay if no achievements or level ups
          if (!didStreakIncrease && !didLevelUp && achievements.length === 0) {
            setTimeout(() => {
              setShowSuccess(false);
              onSuccess();
            }, 3000);
          }
        }
      } catch (processingError) {
        logger.error("Error processing receipt:", processingError);
        setOcrError(processingError.message || "Failed to process receipt");
      }
    } catch (error) {
      logger.error("Error capturing receipt:", error);
      setOcrError("Failed to capture receipt. Please try again.");
    } finally {
      setIsProcessingOCR(false);
    }
  };

  const renderCaptureMethodButton = (
    method: "camera" | "upload" | "barcode" | "manual" | "email" | "ar",
    icon: React.ReactNode,
    label: string,
  ) => {
    return (
      <motion.div
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="w-full"
      >
        <Button
          variant="outline"
          className="flex flex-col items-center justify-center h-16 sm:h-20 md:h-24 p-2 sm:p-4 hover:bg-gray-50 w-full"
          onClick={() => handleMethodSelect(method)}
        >
          <div className="text-primary mb-1 sm:mb-2">
            {React.cloneElement(icon as React.ReactElement, {
              size: window.innerWidth < 640 ? 16 : 24,
            })}
          </div>
          <span className="text-xs sm:text-sm">{label}</span>
        </Button>
      </motion.div>
    );
  };

  return (
    <div className="flex flex-col gap-4 sm:gap-6 bg-gray-50 p-3 sm:p-4 rounded-lg">
      {!isCapturing && !showSuccess && (
        <>
          <Card className="p-6 bg-white shadow-md">
            <div className="flex justify-between items-start mb-2 sm:mb-4">
              <div className="flex items-center">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
                  Capture Receipt
                </h2>
                {!isOnline && (
                  <div className="ml-2 px-2 py-1 bg-orange-100 rounded-full flex items-center">
                    <WifiOff size={14} className="text-orange-600 mr-1" />
                    <span className="text-xs font-medium text-orange-600">
                      Offline
                    </span>
                  </div>
                )}
              </div>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setShowTips(!showTips)}
                      className="text-gray-500 hover:text-primary"
                    >
                      <Info size={20} />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Show capture tips</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>

            {showTips && (
              <Alert className="mb-4 bg-blue-50 border-blue-200">
                <AlertDescription>
                  <p className="text-sm text-blue-800 font-medium mb-2">
                    Tips for best results:
                  </p>
                  <ul className="text-xs text-blue-700 list-disc pl-4 space-y-1">
                    <li>Ensure good lighting for clear images</li>
                    <li>Place receipt on a dark, contrasting background</li>
                    <li>Smooth out wrinkles and folds</li>
                    <li>
                      Capture the entire receipt including store name and date
                    </li>
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            <p className="text-gray-600 mb-3 sm:mb-4 text-sm sm:text-base">
              Scan your receipt to earn points. Make sure the receipt is
              well-lit and all text is clearly visible.
            </p>

            {/* Offline receipts notification */}
            {pendingReceipts > 0 && (
              <Alert className="mb-4 bg-yellow-50 border-yellow-200">
                <CloudOff className="h-4 w-4 text-yellow-600 mr-2" />
                <AlertDescription className="flex justify-between items-center">
                  <span className="text-sm text-yellow-800">
                    You have {pendingReceipts} receipt
                    {pendingReceipts !== 1 ? "s" : ""} waiting to be synced
                  </span>
                  {isOnline && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="ml-2 bg-yellow-100 border-yellow-300 text-yellow-800"
                      onClick={syncOfflineReceipts}
                      disabled={isSyncingReceipts}
                    >
                      {isSyncingReceipts ? (
                        <>
                          <RefreshCw className="h-4 w-4 mr-1 animate-spin" />
                          Syncing...
                        </>
                      ) : (
                        <>
                          <Cloud className="h-4 w-4 mr-1" />
                          Sync Now
                        </>
                      )}
                    </Button>
                  )}
                </AlertDescription>
              </Alert>
            )}

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 sm:gap-4">
              {renderCaptureMethodButton(
                "camera",
                <Camera className="h-8 w-8" />,
                "Camera",
              )}
              {renderCaptureMethodButton(
                "upload",
                <Upload className="h-8 w-8" />,
                "Upload",
              )}
              {renderCaptureMethodButton(
                "barcode",
                <Barcode className="h-8 w-8" />,
                "QR Code",
              )}
              {renderCaptureMethodButton(
                "manual",
                <KeyboardIcon className="h-8 w-8" />,
                "Manual",
              )}
              {renderCaptureMethodButton(
                "email",
                <Mail className="h-8 w-8" />,
                "Email / Accounts",
              )}
              {renderCaptureMethodButton(
                "ar",
                <Scan className="h-8 w-8" />,
                "AR Scanner",
              )}
            </div>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-6">
            <Card className="p-6 bg-white shadow-md">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2 sm:mb-4">
                Daily Progress
              </h2>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Today's Goal</span>
                  <span className="font-medium">{dailyProgress}%</span>
                </div>
                <Progress value={dailyProgress} className="h-2" />
                <div className="flex justify-between text-sm text-gray-500">
                  <span>0 pts</span>
                  <span>100 pts</span>
                  <span>200 pts</span>
                </div>
              </div>
            </Card>

            <Card className="p-6 bg-white shadow-md">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2 sm:mb-4">
                Points Overview
              </h2>
              <PointsDisplay
                potentialPoints={isCapturing ? potentialPoints : 0}
              />
            </Card>

            {/* Personalized Reward Recommendations */}
            <Card className="p-3 sm:p-6 bg-white shadow-md md:col-span-2">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
                  <span className="flex items-center">
                    <Gift className="mr-2 text-primary" size={24} />
                    Recommended for You
                  </span>
                </h2>
                <Button variant="ghost" size="sm" className="text-primary">
                  View All <ChevronRight size={16} className="ml-1" />
                </Button>
              </div>

              {isLoadingRecommendations ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : rewardRecommendations.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
                  {rewardRecommendations.map((reward) => (
                    <motion.div
                      key={reward.id}
                      whileHover={{ scale: 1.03 }}
                      className="bg-gray-50 rounded-lg p-4 cursor-pointer hover:bg-gray-100 transition-colors"
                    >
                      <div className="aspect-video bg-gray-200 rounded-md mb-3 overflow-hidden">
                        {reward.image_url ? (
                          <img
                            src={reward.image_url}
                            alt={reward.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-primary/10">
                            <Gift size={32} className="text-primary/50" />
                          </div>
                        )}
                      </div>
                      <h3 className="font-semibold text-gray-900 mb-1">
                        {reward.title}
                      </h3>
                      <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                        {reward.description}
                      </p>
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-primary">
                          {reward.points_cost} pts
                        </span>
                        <Button size="sm" variant="outline" className="text-xs">
                          Redeem
                        </Button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Gift size={32} className="mx-auto mb-2 opacity-50" />
                  <p>Scan more receipts to get personalized recommendations!</p>
                </div>
              )}
            </Card>
          </div>
        </>
      )}

      {isCapturing &&
        captureMethod === "camera" &&
        (isOnline ? (
          <Card className="p-6 bg-white shadow-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
                Camera Capture
              </h2>
              <Button variant="ghost" onClick={handleCancel}>
                Cancel
              </Button>
            </div>

            {potentialPoints > 0 && (
              <div className="mb-4 p-3 bg-green-50 rounded-lg">
                <p className="text-sm text-green-700 flex items-center">
                  <motion.span
                    initial={{ rotate: 0 }}
                    animate={{ rotate: 360 }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                    className="inline-block mr-2"
                  >
                    ✨
                  </motion.span>
                  Potential points from this receipt:{" "}
                  <span className="font-bold ml-1">+{potentialPoints}</span>
                </p>
              </div>
            )}

            <CameraView onCapture={handleImageCapture} />
          </Card>
        ) : (
          <OfflineCapture
            onCapture={handleImageCapture}
            onCancel={handleCancel}
          />
        ))}

      {isCapturing && captureMethod === "upload" && (
        <Card className="p-6 bg-white shadow-md">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
              Upload Receipt
            </h2>
            <Button variant="ghost" onClick={handleCancel}>
              Cancel
            </Button>
          </div>
          <CaptureMethods
            method="upload"
            onCapture={handleImageCapture}
            onCancel={handleCancel}
          />
        </Card>
      )}

      {isCapturing && captureMethod === "barcode" && (
        <Card className="p-6 bg-white shadow-md">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
              Scan QR Code
            </h2>
            <Button variant="ghost" onClick={handleCancel}>
              Cancel
            </Button>
          </div>
          <CaptureMethods
            method="barcode"
            onCapture={handleImageCapture}
            onCancel={handleCancel}
          />
        </Card>
      )}

      {isCapturing && captureMethod === "manual" && (
        <Card className="p-6 bg-white shadow-md">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
              Manual Entry
            </h2>
            <Button variant="ghost" onClick={handleCancel}>
              Cancel
            </Button>
          </div>
          <CaptureMethods
            method="manual"
            onCapture={handleImageCapture}
            onCancel={handleCancel}
          />
        </Card>
      )}

      {isCapturing && captureMethod === "email" && (
        <Card className="p-6 bg-white shadow-md">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
              Emails/Accounts Receipt
            </h2>
            <Button variant="ghost" onClick={handleCancel}>
              Cancel
            </Button>
          </div>
          <CaptureMethods
            method="email"
            onCapture={handleImageCapture}
            onCancel={handleCancel}
          />
        </Card>
      )}

      {isCapturing && captureMethod === "ar" && (
        <Card className="p-6 bg-white shadow-md">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
              AR Scanner
            </h2>
            <Button variant="ghost" onClick={handleCancel}>
              Cancel
            </Button>
          </div>
          <CaptureMethods
            method="ar"
            onCapture={handleImageCapture}
            onCancel={handleCancel}
          />
        </Card>
      )}

      {/* OCR Error Alert */}
      {ocrError && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error Processing Receipt</AlertTitle>
          <AlertDescription>{ocrError}</AlertDescription>
          <Button
            variant="outline"
            size="sm"
            className="mt-2"
            onClick={() => setOcrError(null)}
          >
            Dismiss
          </Button>
        </Alert>
      )}

      {/* OCR Processing Indicator */}
      {isProcessingOCR && (
        <Card className="p-6 bg-white shadow-md">
          <div className="flex flex-col items-center justify-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
            <p className="text-lg font-medium text-gray-700">
              Processing receipt...
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Extracting text and identifying products
            </p>
          </div>
        </Card>
      )}

      {/* Detected Products Display */}
      {showDetectedProducts && detectedProducts.length > 0 && (
        <Card className="p-6 bg-white shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Detected Products</span>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    // Verify all products
                    setDetectedProducts((products) =>
                      products.map((p) => ({ ...p, verified: true })),
                    );
                  }}
                >
                  <Check className="h-4 w-4 mr-1" /> Verify All
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setShowDetectedProducts(false);
                    setShowSuccess(true);
                  }}
                >
                  Continue
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">
              We've detected the following products from your receipt. Please
              verify or edit them.
            </p>

            <div className="space-y-3">
              {detectedProducts.map((product, index) => (
                <div
                  key={`product-${index}`}
                  className={`p-3 rounded-lg border ${product.verified ? "bg-green-50 border-green-200" : "bg-white border-gray-200"}`}
                >
                  {product.editing ? (
                    <div className="flex flex-col space-y-2">
                      <div className="flex space-x-2">
                        <Input
                          value={product.name}
                          onChange={(e) => {
                            const updatedProducts = [...detectedProducts];
                            updatedProducts[index].name = e.target.value;
                            setDetectedProducts(updatedProducts);
                          }}
                          placeholder="Product name"
                          className="flex-grow"
                        />
                        <Input
                          type="number"
                          value={product.price}
                          onChange={(e) => {
                            const updatedProducts = [...detectedProducts];
                            updatedProducts[index].price =
                              parseFloat(e.target.value) || 0;
                            setDetectedProducts(updatedProducts);
                          }}
                          placeholder="Price"
                          className="w-24"
                        />
                      </div>
                      <div className="flex justify-end space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const updatedProducts = [...detectedProducts];
                            updatedProducts[index].editing = false;
                            setDetectedProducts(updatedProducts);
                          }}
                        >
                          Cancel
                        </Button>
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => {
                            const updatedProducts = [...detectedProducts];
                            updatedProducts[index].editing = false;
                            updatedProducts[index].verified = true;
                            setDetectedProducts(updatedProducts);
                          }}
                        >
                          Save
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <div className="flex-grow">
                        <p className="font-medium">{product.name}</p>
                        <p className="text-sm text-gray-600">
                          ${product.price.toFixed(2)}
                        </p>
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            const updatedProducts = [...detectedProducts];
                            updatedProducts[index].editing = true;
                            setDetectedProducts(updatedProducts);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant={product.verified ? "ghost" : "outline"}
                          size="sm"
                          onClick={() => {
                            const updatedProducts = [...detectedProducts];
                            updatedProducts[index].verified =
                              !updatedProducts[index].verified;
                            setDetectedProducts(updatedProducts);
                          }}
                        >
                          {product.verified ? (
                            <Check className="h-4 w-4 text-green-600" />
                          ) : (
                            <Check className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="mt-6 flex justify-end">
              <Button
                onClick={() => {
                  setShowDetectedProducts(false);
                  setShowSuccess(true);
                }}
              >
                Confirm & Continue
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {showSuccess && (
        <SuccessOverlay
          isVisible={showSuccess}
          pointsEarned={earnedPoints}
          onClose={() => {
            setShowSuccess(false);
            onSuccess();
          }}
          streakIncreased={streakIncreased}
          levelUp={levelUp}
          newAchievements={newAchievements}
        />
      )}
    </div>
  );
};

export default CaptureInterface;