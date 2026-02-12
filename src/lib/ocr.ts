import { createWorker, Worker } from "tesseract.js";
import { logger } from "./logger";
import { ProcessingError } from "@/types/errors";
import { performOCRWithPool } from "./ocr-worker-pool";

export interface OCRResult {
  text: string;
  confidence: number;
  items?: Array<{ name: string; price: number }>;
  total?: number;
  date?: string;
  store?: string;
  processingTime?: number;
  imageQuality?: "low" | "medium" | "high";
  errorDetails?: string;
}

export enum OCRErrorType {
  INITIALIZATION_FAILED = "initialization_failed",
  RECOGNITION_FAILED = "recognition_failed",
  INVALID_IMAGE = "invalid_image",
  LOW_CONFIDENCE = "low_confidence",
  TIMEOUT = "timeout",
  UNKNOWN = "unknown",
}

/**
 * Performs OCR on an image to extract text
 * Uses worker pool by default for better performance
 * @param imageData Base64 encoded image data
 * @param options Configuration options for OCR processing
 * @returns Promise with OCR result containing extracted text and confidence score
 */
export const performOCR = async (
  imageData: string,
  options: {
    timeout?: number;
    minConfidence?: number;
    highQuality?: boolean;
    usePool?: boolean; // Default true - set false to use single worker
  } = {},
): Promise<OCRResult> => {
  const { usePool = true, ...ocrOptions } = options;

  // Use worker pool by default for better performance
  if (usePool) {
    try {
      return await performOCRWithPool(imageData, ocrOptions);
    } catch (error) {
      // If pool fails, fall back to single worker
      logger.warn("Worker pool failed, falling back to single worker:", error);
      return performOCRSingleWorker(imageData, ocrOptions);
    }
  }

  // Use single worker if explicitly requested
  return performOCRSingleWorker(imageData, ocrOptions);
};

/**
 * Performs OCR using a single worker (legacy implementation)
 * Creates and terminates a worker for each request
 * @internal
 */
const performOCRSingleWorker = async (
  imageData: string,
  options: {
    timeout?: number;
    minConfidence?: number;
    highQuality?: boolean;
  } = {},
): Promise<OCRResult> => {
  const startTime = Date.now();
  const { timeout = 30000, minConfidence = 30, highQuality = false } = options;
  let worker: Worker | null = null;
  let timeoutId: NodeJS.Timeout | null = null;

  try {
    // Validate image data
    if (!imageData || !imageData.startsWith("data:image")) {
      throw new ProcessingError(
        "Invalid image data provided",
        OCRErrorType.INVALID_IMAGE,
      );
    }

    // Create a promise that rejects after the timeout
    const timeoutPromise = new Promise<never>((_, reject) => {
      timeoutId = setTimeout(() => {
        reject(
          new ProcessingError(
            "OCR processing timed out. Try with a clearer image or smaller receipt.",
            OCRErrorType.TIMEOUT,
          ),
        );
      }, timeout);
    });

    // Create worker with progress logging
    worker = await createWorker({
      logger: (m: { status: string; progress: number }) => {
        if (m.status === "recognizing text") {
          // Log progress for long receipts
          logger.debug(`OCR Progress: ${Math.floor(m.progress * 100)}%`);
        }
      },
    });

    // Initialize worker with language
    try {
      await Promise.race([worker.loadLanguage("eng"), timeoutPromise]);

      await Promise.race([worker.initialize("eng"), timeoutPromise]);
    } catch (initError) {
      logger.error("Failed to initialize OCR worker", initError);
      throw new ProcessingError(
        "Failed to initialize text recognition. Please try again.",
        OCRErrorType.INITIALIZATION_FAILED,
      );
    }

    // Set recognition parameters for better receipt handling
    await worker.setParameters({
      tessedit_char_whitelist:
        "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ$.,:-/% ", // Common receipt characters
      preserve_interword_spaces: "1",
      tessedit_pageseg_mode: "6", // Assume a single uniform block of text
      tessjs_create_hocr: "0",
      tessjs_create_tsv: "0",
      tessjs_create_box: "0",
      tessjs_create_unlv: "0",
      tessjs_create_osd: "0",
      // Use higher quality settings if requested
      ...(highQuality
        ? {
            tessjs_image_dpi: "300",
            textord_min_linesize: "2.5",
          }
        : {}),
    });

    // Perform OCR recognition with timeout
    const {
      data: { text, confidence },
    } = await Promise.race([worker.recognize(imageData), timeoutPromise]);

    // Clear timeout since we succeeded
    if (timeoutId) clearTimeout(timeoutId);

    // Check confidence level
    if (confidence < minConfidence) {
      logger.warn(`Low OCR confidence: ${confidence}%`);
      return {
        text,
        confidence,
        processingTime: Date.now() - startTime,
        imageQuality:
          confidence < 40 ? "low" : confidence < 70 ? "medium" : "high",
        errorDetails:
          "Low confidence in text recognition. Results may be inaccurate.",
      };
    }

    // Determine image quality based on confidence
    const imageQuality =
      confidence < 60 ? "low" : confidence < 85 ? "medium" : "high";

    return {
      text,
      confidence,
      processingTime: Date.now() - startTime,
      imageQuality,
    };
  } catch (error) {
    // Clear timeout if it exists
    if (timeoutId) clearTimeout(timeoutId);

    logger.error("OCR processing error", error);

    // Determine error type and provide helpful message
    let errorType = OCRErrorType.UNKNOWN;
    let errorMessage = "Failed to process receipt image. Please try again.";

    if (error instanceof ProcessingError) {
      errorType = (error.code as OCRErrorType) || OCRErrorType.UNKNOWN;
      errorMessage = error.message;
    } else if (error instanceof Error) {
      // Try to categorize common errors
      const errorStr = error.toString().toLowerCase();
      if (errorStr.includes("timeout")) {
        errorType = OCRErrorType.TIMEOUT;
        errorMessage = "Processing took too long. Try with a clearer image.";
      } else if (errorStr.includes("memory")) {
        errorType = OCRErrorType.RECOGNITION_FAILED;
        errorMessage =
          "Image is too large or complex. Try cropping or resizing.";
      }
    }

    throw new ProcessingError(errorMessage, errorType);
  } finally {
    // Always terminate the worker to free resources
    if (worker) {
      try {
        await worker.terminate();
      } catch (terminateError) {
        logger.error("Failed to terminate OCR worker", terminateError);
      }
    }
  }
};

/**
 * Extracts structured data from OCR text
 * @param text The OCR extracted text
 * @returns Structured data including items, total, date, and store
 */
export const extractStructuredData = (text: string): OCRResult => {
  // Extract total amount with improved regex
  const totalMatch =
    text.match(/(?:total|amount|sum|balance|due)[^\d$]*(\d+\.\d{2})/i) ||
    text.match(/(?:total|amount|sum|balance|due)[^\d$]*(\d+)/i) ||
    text.match(/(?:\$|\$\s*)(\d+\.\d{2})/i);

  // If no total found, try to find the largest dollar amount
  let total = 0;
  if (totalMatch) {
    total = parseFloat(totalMatch[1]);
  } else {
    // Find all dollar amounts and use the largest one
    const allAmounts = [];
    const amountRegex = /\$?(\d+\.\d{2})/g;
    let match;
    while ((match = amountRegex.exec(text)) !== null) {
      allAmounts.push(parseFloat(match[1]));
    }

    if (allAmounts.length > 0) {
      total = Math.max(...allAmounts);
    }
  }

  // Extract date with improved regex
  const dateMatch =
    text.match(/(\d{1,2}[\/\-\.\s]\d{1,2}[\/\-\.\s]\d{2,4})/) ||
    text.match(
      /(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+\d{1,2}[,\s]+\d{2,4}/i,
    ) ||
    text.match(/(\d{2}\/\d{2}\/\d{2,4})/) ||
    text.match(/(\d{2}\-\d{2}\-\d{2,4})/);

  const date = dateMatch ? dateMatch[1] : new Date().toLocaleDateString();

  // Extract store name with improved logic
  const lines = text.split("\n").filter((line) => line.trim().length > 0);

  // Common store names to look for
  const commonStores = [
    "walmart",
    "target",
    "kroger",
    "costco",
    "walgreens",
    "cvs",
    "home depot",
    "lowes",
    "best buy",
    "safeway",
    "publix",
    "aldi",
    "trader joe",
    "whole foods",
  ];

  // Try to find a line that matches a common store name
  let storeLine = lines.find((line) => {
    const lowerLine = line.toLowerCase();
    return commonStores.some((store) => lowerLine.includes(store));
  });

  // If no common store found, use heuristics
  if (!storeLine) {
    storeLine =
      lines.find(
        (line) =>
          !line.match(/^\d/) && // Doesn't start with a digit
          !line.match(/^\s*\d{1,2}[\/\-\.\s]\d{1,2}/) && // Not a date
          !line.match(/^\s*\$/) && // Not a price
          line.length > 3 && // More than 3 chars
          !line.toLowerCase().includes("receipt") && // Not just the word receipt
          !line.toLowerCase().includes("thank you"), // Not just thank you
      ) || lines[0];
  }

  const store = storeLine ? storeLine.trim() : "Unknown Store";

  // Extract items with prices
  const items = extractItemsFromText(text, total);

  return {
    text,
    confidence: 0, // Will be set by the OCR function
    items,
    total,
    date,
    store,
  };
};

/**
 * Extracts items with prices from OCR text
 * @param text The OCR extracted text
 * @param total The total amount from the receipt
 * @returns Array of items with name and price
 */
export const extractItemsFromText = (
  text: string,
  total: number,
): Array<{ name: string; price: number }> => {
  const items = [];

  // Pattern to match item descriptions followed by prices
  // This regex looks for text followed by a price pattern ($XX.XX or XX.XX)
  const itemRegex = /([A-Za-z\s\&\-\'\"\,\.\d]+)\s+\$?(\d+\.\d{2})/g;
  let itemMatch;

  while ((itemMatch = itemRegex.exec(text)) !== null) {
    const itemName = itemMatch[1].trim();
    const itemPrice = parseFloat(itemMatch[2]);

    // Filter out likely non-items
    if (
      itemName.length > 2 &&
      !itemName.toLowerCase().includes("total") &&
      !itemName.toLowerCase().includes("subtotal") &&
      !itemName.toLowerCase().includes("tax") &&
      !itemName.toLowerCase().includes("change") &&
      !itemName.toLowerCase().includes("balance") &&
      !itemName.toLowerCase().includes("cash") &&
      !itemName.toLowerCase().includes("credit") &&
      !itemName.toLowerCase().includes("card") &&
      itemPrice > 0 &&
      itemPrice < total * 1.2 // Allow some margin for error
    ) {
      items.push({
        name: itemName,
        price: itemPrice,
      });
    }
  }

  return items;
};