import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./card";
import { Switch } from "./switch";
import { Label } from "./label";
import { Settings as SettingsIcon } from "lucide-react";
import { Button } from "./button";
import { useLocalStorage } from "@/lib/utils";

export interface SettingsProps {
  className?: string;
}

export function Settings({ className }: SettingsProps) {
  // Use local storage to persist settings
  const [enableOCR, setEnableOCR] = useLocalStorage("enableOCR", true);
  const [enableAIAnalysis, setEnableAIAnalysis] = useLocalStorage(
    "enableAIAnalysis",
    true,
  );
  const [enableFraudDetection, setEnableFraudDetection] = useLocalStorage(
    "enableFraudDetection",
    true,
  );
  const [highQualityCapture, setHighQualityCapture] = useLocalStorage(
    "highQualityCapture",
    true,
  );

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <SettingsIcon className="h-5 w-5" />
          Application Settings
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="ocr-toggle">Enable OCR Processing</Label>
              <p className="text-sm text-muted-foreground">
                Automatically detect text and products in receipts
              </p>
            </div>
            <Switch
              id="ocr-toggle"
              checked={enableOCR}
              onCheckedChange={setEnableOCR}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="ai-toggle">Enable AI Analysis</Label>
              <p className="text-sm text-muted-foreground">
                Use AI to analyze receipt content and extract data
              </p>
            </div>
            <Switch
              id="ai-toggle"
              checked={enableAIAnalysis}
              onCheckedChange={setEnableAIAnalysis}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="fraud-toggle">Enable Fraud Detection</Label>
              <p className="text-sm text-muted-foreground">
                Automatically detect potentially fraudulent receipts
              </p>
            </div>
            <Switch
              id="fraud-toggle"
              checked={enableFraudDetection}
              onCheckedChange={setEnableFraudDetection}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="quality-toggle">High Quality Capture</Label>
              <p className="text-sm text-muted-foreground">
                Use higher resolution for better OCR results (uses more
                resources)
              </p>
            </div>
            <Switch
              id="quality-toggle"
              checked={highQualityCapture}
              onCheckedChange={setHighQualityCapture}
            />
          </div>
        </div>

        <div className="pt-4">
          <Button
            variant="outline"
            className="w-full"
            onClick={() => {
              setEnableOCR(true);
              setEnableAIAnalysis(true);
              setEnableFraudDetection(true);
              setHighQualityCapture(true);
            }}
          >
            Reset to Defaults
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default Settings;
