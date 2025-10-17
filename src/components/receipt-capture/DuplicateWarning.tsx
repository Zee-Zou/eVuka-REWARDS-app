import React from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DuplicateWarningProps {
  score: number;
  onProceed: () => void;
  onCancel: () => void;
}

const DuplicateWarning = ({
  score,
  onProceed,
  onCancel,
}: DuplicateWarningProps) => {
  // Format the score as a percentage
  const percentage = Math.round(score * 100);

  return (
    <Alert variant="warning" className="mb-4 border-yellow-500 bg-yellow-50">
      <AlertTriangle className="h-5 w-5 text-yellow-600" />
      <AlertTitle className="text-yellow-800 font-bold">
        Potential Duplicate Receipt Detected
      </AlertTitle>
      <AlertDescription className="text-yellow-700">
        <p className="mb-2">
          This receipt appears to be similar to one you've already submitted
          (Similarity: {percentage}%).
        </p>
        <div className="flex gap-2 mt-4">
          <Button
            variant="outline"
            size="sm"
            className="border-yellow-600 text-yellow-700 hover:bg-yellow-100"
            onClick={onCancel}
          >
            Cancel Submission
          </Button>
          <Button
            variant="default"
            size="sm"
            className="bg-yellow-600 hover:bg-yellow-700 text-white"
            onClick={onProceed}
          >
            Submit Anyway
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );
};

export default DuplicateWarning;
