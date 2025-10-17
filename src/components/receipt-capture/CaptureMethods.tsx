import React from "react";
import { Button } from "@/components/ui/button";
import { Camera, Barcode, FileText, Mail, Scan } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface CaptureMethodsProps {
  onMethodSelect?: (method: Method) => void;
  onCapture?: (image: string) => void;
  onCancel?: () => void;
  method?: Method;
  className?: string;
}

type Method = "camera" | "barcode" | "manual" | "email" | "ar" | "upload";

const CaptureMethods = ({
  onMethodSelect = () => {},
  onCapture = () => {},
  onCancel = () => {},
  method,
  className = "",
}: CaptureMethodsProps) => {
  const methods = [
    {
      id: "camera",
      icon: Camera,
      label: "Take Photo",
      tooltip: "Capture receipt with camera",
    },
    {
      id: "barcode",
      icon: Barcode,
      label: "Scan QR Code",
      tooltip: "Scan receipt QR code",
    },
    {
      id: "manual",
      icon: FileText,
      label: "Manual Entry",
      tooltip: "Enter receipt details manually",
    },
    {
      id: "email",
      icon: Mail,
      label: "Email / Accounts",
      tooltip: "Submit via email or bank accounts",
    },
    {
      id: "ar",
      icon: Scan,
      label: "AR Scanner",
      tooltip: "Use AR to detect items in real-time",
    },
  ];

  return (
    <div className={`bg-white p-4 rounded-lg shadow-md ${className}`}>
      <TooltipProvider>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {methods.map((method) => (
            <Tooltip key={method.id}>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full h-24 flex flex-col items-center justify-center gap-2 hover:bg-primary/5"
                  onClick={() => onMethodSelect(method.id as Method)}
                >
                  <method.icon className="w-6 h-6" />
                  <span className="text-sm">{method.label}</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{method.tooltip}</p>
              </TooltipContent>
            </Tooltip>
          ))}
        </div>
      </TooltipProvider>
    </div>
  );
};

export default CaptureMethods;
