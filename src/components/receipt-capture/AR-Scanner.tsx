import React, { useState, useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Camera, Crosshair, ZoomIn, ZoomOut, Scan } from "lucide-react";

interface ARScannerProps {
  onCapture: (data: string) => void;
  onClose: () => void;
}

const ARScanner = ({ onCapture, onClose }: ARScannerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [isScanning, setIsScanning] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [detectedItems, setDetectedItems] = useState<
    Array<{
      name: string;
      price: number;
      confidence: number;
      position: { x: number; y: number; width: number; height: number };
    }>
  >([]);

  // Initialize camera
  useEffect(() => {
    const initCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: "environment",
            width: { ideal: 1920 },
            height: { ideal: 1080 },
          },
        });

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
          setIsInitializing(false);
          // Start scanning after camera is initialized
          setIsScanning(true);
        }
      } catch (error) {
        console.error("Error accessing camera:", error);
        setIsInitializing(false);
      }
    };

    initCamera();

    return () => {
      // Clean up video stream
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  // Simulated AR scanning effect
  useEffect(() => {
    if (!isScanning) return;

    // Simulate detecting items with AR
    const scanInterval = setInterval(() => {
      // Generate random items for demo purposes
      const mockItems = [
        {
          name: "Organic Milk",
          price: 4.99,
          confidence: 0.92,
          position: {
            x: Math.random() * 70 + 10,
            y: Math.random() * 70 + 10,
            width: 20,
            height: 10,
          },
        },
        {
          name: "Bread",
          price: 3.49,
          confidence: 0.88,
          position: {
            x: Math.random() * 70 + 10,
            y: Math.random() * 70 + 10,
            width: 20,
            height: 10,
          },
        },
        {
          name: "Eggs (12)",
          price: 5.29,
          confidence: 0.95,
          position: {
            x: Math.random() * 70 + 10,
            y: Math.random() * 70 + 10,
            width: 20,
            height: 10,
          },
        },
      ];

      // Only show some items randomly to simulate real-time detection
      const itemsToShow = mockItems.filter(() => Math.random() > 0.3);
      setDetectedItems(itemsToShow);
    }, 2000);

    return () => clearInterval(scanInterval);
  }, [isScanning]);

  // Draw AR overlays
  useEffect(() => {
    if (!canvasRef.current || !videoRef.current || detectedItems.length === 0)
      return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Clear previous drawings
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Set canvas dimensions to match video
    canvas.width = videoRef.current.clientWidth;
    canvas.height = videoRef.current.clientHeight;

    // Draw item boxes and labels
    detectedItems.forEach((item) => {
      const { x, y, width, height } = item.position;
      const xPos = (x / 100) * canvas.width;
      const yPos = (y / 100) * canvas.height;
      const boxWidth = (width / 100) * canvas.width;
      const boxHeight = (height / 100) * canvas.height;

      // Draw box
      ctx.strokeStyle = "#00ff00";
      ctx.lineWidth = 2;
      ctx.strokeRect(xPos, yPos, boxWidth, boxHeight);

      // Draw label background
      ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
      ctx.fillRect(xPos, yPos - 25, boxWidth, 25);

      // Draw text
      ctx.fillStyle = "#ffffff";
      ctx.font = "12px Arial";
      ctx.fillText(
        `${item.name} - $${item.price.toFixed(2)}`,
        xPos + 5,
        yPos - 10,
      );
    });

    // Draw scanning effect
    ctx.strokeStyle = "rgba(0, 255, 0, 0.5)";
    ctx.lineWidth = 1;
    const scanLineY = ((Date.now() % 2000) / 2000) * canvas.height;
    ctx.beginPath();
    ctx.moveTo(0, scanLineY);
    ctx.lineTo(canvas.width, scanLineY);
    ctx.stroke();
  }, [detectedItems]);

  const handleZoom = (direction: "in" | "out") => {
    if (direction === "in") {
      setZoomLevel((prev) => Math.min(prev + 0.1, 2));
    } else {
      setZoomLevel((prev) => Math.max(prev - 0.1, 1));
    }
  };

  const handleCapture = () => {
    // Create a receipt-like data structure from detected items
    const receiptData = {
      store: "AR Detected Store",
      date: new Date().toISOString(),
      items: detectedItems.map((item) => ({
        name: item.name,
        price: item.price,
        category: "AR Detected",
      })),
      total: detectedItems.reduce((sum, item) => sum + item.price, 0),
      text: "AR Detected Items",
    };

    onCapture(JSON.stringify(receiptData));
  };

  return (
    <Card className="relative overflow-hidden bg-black w-full max-w-2xl mx-auto">
      <div className="relative h-[600px]">
        {/* Video feed */}
        <video
          ref={videoRef}
          className="w-full h-full object-cover"
          style={{ transform: `scale(${zoomLevel})` }}
          playsInline
        />

        {/* AR overlay canvas */}
        <canvas
          ref={canvasRef}
          className="absolute top-0 left-0 w-full h-full pointer-events-none"
        />

        {/* Loading overlay */}
        {isInitializing && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <div className="text-center text-white">
              <LoadingSpinner size={40} className="mb-4" />
              <p>Initializing AR Scanner...</p>
            </div>
          </div>
        )}

        {/* Controls overlay */}
        <div className="absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/70 to-transparent">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2 text-white">
              <Scan className="h-5 w-5" />
              <span className="font-medium">AR Receipt Scanner</span>
            </div>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/20"
                onClick={() => handleZoom("in")}
              >
                <ZoomIn size={18} />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/20"
                onClick={() => handleZoom("out")}
              >
                <ZoomOut size={18} />
              </Button>
            </div>
          </div>
        </div>

        {/* Scanning guide */}
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
          <div className="border-2 border-dashed border-white/50 rounded-md w-4/5 h-3/5 flex items-center justify-center">
            <Crosshair className="text-white/70 h-8 w-8" />
          </div>
        </div>

        {/* Item count */}
        <div className="absolute top-16 right-4 bg-black/70 text-white px-3 py-1 rounded-full text-sm">
          {detectedItems.length} items detected
        </div>

        {/* Bottom controls */}
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/70 to-transparent">
          <div className="flex justify-between items-center">
            <Button
              variant="outline"
              className="text-white border-white/30"
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button
              className="bg-green-600 hover:bg-green-700 text-white"
              disabled={detectedItems.length === 0}
              onClick={handleCapture}
            >
              <Camera className="mr-2 h-4 w-4" />
              Capture ({detectedItems.length})
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default ARScanner;
