import React, { useState } from "react";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import {
  Sliders,
  Sun,
  Contrast,
  Maximize,
  RotateCw,
  RotateCcw,
  Check,
} from "lucide-react";

interface ImageEnhancerProps {
  imageData: string;
  onSave: (enhancedImage: string) => void;
  onCancel: () => void;
}

const ImageEnhancer = ({ imageData, onSave, onCancel }: ImageEnhancerProps) => {
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [rotation, setRotation] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [previewImage, setPreviewImage] = useState(imageData);

  const applyEnhancements = () => {
    setIsProcessing(true);

    // Use canvas to apply image enhancements
    const canvas = document.createElement("canvas");
    const img = new Image();

    img.onload = () => {
      // Set canvas dimensions based on rotation
      const useSwappedDimensions = rotation === 90 || rotation === 270;
      canvas.width = useSwappedDimensions ? img.height : img.width;
      canvas.height = useSwappedDimensions ? img.width : img.height;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        setIsProcessing(false);
        return;
      }

      // Apply rotation
      ctx.save();
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate((rotation * Math.PI) / 180);
      ctx.drawImage(img, -img.width / 2, -img.height / 2);
      ctx.restore();

      // Apply filters
      ctx.filter = `brightness(${brightness}%) contrast(${contrast}%)`;

      // Draw the image again with filters
      if (rotation !== 0) {
        // Clear canvas and redraw with filters
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.save();
        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.rotate((rotation * Math.PI) / 180);
        ctx.drawImage(img, -img.width / 2, -img.height / 2);
        ctx.restore();
      } else {
        // Just apply filters to the existing image
        ctx.drawImage(img, 0, 0);
      }

      // Get the enhanced image
      const enhancedImage = canvas.toDataURL("image/jpeg", 0.9);
      setPreviewImage(enhancedImage);
      setIsProcessing(false);
    };

    img.src = imageData;
  };

  // Apply enhancements when sliders change
  React.useEffect(() => {
    const timer = setTimeout(() => {
      applyEnhancements();
    }, 300); // Debounce to avoid too many redraws

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [brightness, contrast, rotation]);

  const handleSave = () => {
    onSave(previewImage);
  };

  const handleRotate = (direction: "cw" | "ccw") => {
    let newRotation = rotation;
    if (direction === "cw") {
      newRotation = (rotation + 90) % 360;
    } else {
      newRotation = (rotation - 90 + 360) % 360;
    }
    setRotation(newRotation);
  };

  return (
    <Card className="p-6 bg-white shadow-lg w-full max-w-md mx-auto">
      <div className="space-y-6">
        <h3 className="text-xl font-bold text-center">Enhance Receipt Image</h3>

        {/* Preview */}
        <div className="relative bg-gray-100 rounded-md overflow-hidden">
          {isProcessing && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/30">
              <LoadingSpinner size={32} className="text-white" />
            </div>
          )}
          <img
            src={previewImage}
            alt="Receipt preview"
            className="w-full h-auto object-contain max-h-[300px] mx-auto"
          />
        </div>

        {/* Controls */}
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium flex items-center gap-2">
                <Sun size={16} /> Brightness
              </label>
              <span className="text-sm">{brightness}%</span>
            </div>
            <Slider
              value={[brightness]}
              min={50}
              max={150}
              step={5}
              onValueChange={(value) => setBrightness(value[0])}
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium flex items-center gap-2">
                <Contrast size={16} /> Contrast
              </label>
              <span className="text-sm">{contrast}%</span>
            </div>
            <Slider
              value={[contrast]}
              min={50}
              max={150}
              step={5}
              onValueChange={(value) => setContrast(value[0])}
            />
          </div>

          <div className="flex justify-center gap-4 pt-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => handleRotate("ccw")}
              title="Rotate counterclockwise"
            >
              <RotateCcw size={16} />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => handleRotate("cw")}
              title="Rotate clockwise"
            >
              <RotateCw size={16} />
            </Button>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-between pt-2">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isProcessing}>
            <Check size={16} className="mr-2" /> Save Changes
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default ImageEnhancer;
