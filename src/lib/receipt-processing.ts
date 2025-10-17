import { analyzeReceipt, detectFraud } from "./ai-analysis";
import { logger } from "./logger";
import { ProcessingError } from "@/types/errors";
import { checkForDuplicates, extractAdvancedData } from "./duplicate-detection";
import { performOCR, extractStructuredData } from "./ocr";

export interface ProcessedReceipt {
  text: string;
  total: number;
  date: string;
  store: string;
  items?: Array<{ name: string; price: number; category?: string }>;
  fraudScore?: number;
  advancedData?: Record<string, any>;
  isDuplicate?: boolean;
  duplicateScore?: number;
  detectedProducts?: Array<{ name: string; price: number; verified?: boolean }>;
}

// Add a global variable to store the last processed receipt for access in the UI
declare global {
  interface Window {
    _lastProcessedReceipt?: ProcessedReceipt;
  }
}

export const processReceipt = async (
  imageData: string,
  enableOCR: boolean = true,
): Promise<ProcessedReceipt> => {
  try {
    // Skip AI analysis since API key is not available
    // First try OCR if enabled
    if (enableOCR) {
      try {
        logger.info("Using OCR for receipt processing");

        // Perform OCR on the image
        const ocrResult = await performOCR(imageData);

        // Extract structured data from the OCR text
        const structuredData = extractStructuredData(ocrResult.text);

        // Extract advanced data from receipt text
        const advancedData = extractAdvancedData(ocrResult.text);

        // Create the processed receipt object
        const processedReceipt: ProcessedReceipt = {
          text: ocrResult.text,
          total: structuredData.total || 0,
          date: structuredData.date || new Date().toLocaleDateString(),
          store: structuredData.store || "Unknown Store",
          items:
            structuredData.items && structuredData.items.length > 0
              ? structuredData.items
              : undefined,
          advancedData,
          detectedProducts: structuredData.items || [], // Add detected products to the receipt
        };

        // Store the processed receipt for UI access
        window._lastProcessedReceipt = processedReceipt;
        return processedReceipt;
      } catch (error) {
        logger.warn("OCR processing failed, falling back to basic receipt", error);
        // Fall back to basic receipt if OCR fails
      }
    }

    // Fallback to basic receipt
    const basicReceipt: ProcessedReceipt = {
      text: "",
      total: 0,
      date: new Date().toLocaleDateString(),
      store: "Unknown Store",
    };
    window._lastProcessedReceipt = basicReceipt;
    return basicReceipt;
  } catch (error) {
    logger.error("Receipt processing failed", error);
    if (error instanceof ProcessingError) {
      throw error;
    } else {
      throw new ProcessingError(
        "Failed to process receipt. Please try again with a clearer image."
      );
    }
  }
};

export const calculatePoints = (
  total: number,
  timeDiff: number,
  brandMultiplier = 1,
): number => {
  // Base points: 1 point per dollar
  let points = Math.floor(total);

  // Bonus points for larger receipts
  if (total >= 100) {
    points += 25; // $25 bonus for receipts over $100
  } else if (total >= 50) {
    points += 10; // $10 bonus for receipts over $50
  }

  // Apply brand multiplier if applicable
  points = Math.floor(points * brandMultiplier);

  // Time multiplier - exactly as specified in requirements
  if (timeDiff <= 24) {
    // Within 24 hours: 100%
    return points;
  } else if (timeDiff <= 48) {
    // 24-48 hours: 50%
    return Math.floor(points * 0.5);
  } else if (timeDiff <= 72) {
    // 48-72 hours: 10%
    return Math.floor(points * 0.1);
  }

  // After 72 hours: no points
  return 0;
};