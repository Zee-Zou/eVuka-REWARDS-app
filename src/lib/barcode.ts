import {
  BrowserMultiFormatReader,
  NotFoundException,
  ChecksumException,
  FormatException,
} from "@zxing/library";
import { logger } from "./logger";
import { ProcessingError } from "@/types/errors";

// Product code types supported by the system
export enum ProductCodeType {
  BARCODE_EAN13 = "EAN_13",
  BARCODE_UPC = "UPC",
  BARCODE_QR = "QR_CODE",
  BARCODE_CODE128 = "CODE_128",
  MANUAL_CODE = "MANUAL_CODE",
}

export interface ProductCode {
  code: string;
  type: ProductCodeType;
  timestamp: string;
  scannedBy: string;
}

/**
 * Scan a barcode from a video element
 * @param videoElement HTML video element containing the barcode
 * @returns The decoded barcode value
 */
export const scanBarcode = async (
  videoElement: HTMLVideoElement,
): Promise<string> => {
  const codeReader = new BrowserMultiFormatReader();
  try {
    const result = await codeReader.decodeOnceFromVideoElement(videoElement);
    return result.getText();
  } finally {
    codeReader.reset();
  }
};

/**
 * Scan a barcode from an image or video stream with enhanced error handling
 * @param imageOrVideoElement HTML image or video element containing the barcode
 * @returns The decoded barcode value and type
 */
export const scanBarcodeEnhanced = async (
  imageOrVideoElement: HTMLImageElement | HTMLVideoElement,
): Promise<ProductCode> => {
  try {
    logger.info("Starting barcode scan");
    const reader = new BrowserMultiFormatReader();

    // Attempt to decode the barcode
    const result = await reader.decodeOnce(imageOrVideoElement);

    logger.info("Barcode scan successful", {
      format: result.getBarcodeFormat(),
    });

    // Map the barcode format to our internal type
    let type: ProductCodeType;
    switch (result.getBarcodeFormat().toString()) {
      case "EAN_13":
        type = ProductCodeType.BARCODE_EAN13;
        break;
      case "UPC_A":
      case "UPC_E":
        type = ProductCodeType.BARCODE_UPC;
        break;
      case "QR_CODE":
        type = ProductCodeType.BARCODE_QR;
        break;
      default:
        type = ProductCodeType.BARCODE_CODE128;
    }

    return {
      code: result.getText(),
      type,
      timestamp: new Date().toISOString(),
      scannedBy: "user", // This would be replaced with actual user ID in production
    };
  } catch (error) {
    // Handle specific barcode scanning errors
    if (error instanceof NotFoundException) {
      logger.warn("No barcode found in the image");
      throw new ProcessingError(
        "No barcode found. Please try again with a clearer image or different angle.",
      );
    } else if (error instanceof ChecksumException) {
      logger.warn("Barcode checksum failed");
      throw new ProcessingError(
        "Invalid barcode detected. The barcode may be damaged or incomplete.",
      );
    } else if (error instanceof FormatException) {
      logger.warn("Barcode format not recognized");
      throw new ProcessingError(
        "Unrecognized barcode format. Please try a different barcode.",
      );
    } else {
      logger.error("Barcode scanning failed", error);
      throw new ProcessingError("Failed to scan barcode. Please try again.");
    }
  }
};

/**
 * Validate a manually entered product code
 * @param code The product code entered by the user
 * @returns Validated product code object
 */
export const validateProductCode = (
  code: string,
  userId: string,
): ProductCode => {
  // Remove any whitespace and normalize
  const normalizedCode = code.trim().toUpperCase();

  if (!normalizedCode) {
    throw new ProcessingError("Product code cannot be empty.");
  }

  // Check for valid format based on common product code patterns
  // EAN-13: 13 digits
  // UPC-A: 12 digits
  // Alphanumeric codes: typically 8-16 characters
  if (/^\d{13}$/.test(normalizedCode)) {
    return {
      code: normalizedCode,
      type: ProductCodeType.BARCODE_EAN13,
      timestamp: new Date().toISOString(),
      scannedBy: userId,
    };
  } else if (/^\d{12}$/.test(normalizedCode)) {
    return {
      code: normalizedCode,
      type: ProductCodeType.BARCODE_UPC,
      timestamp: new Date().toISOString(),
      scannedBy: userId,
    };
  } else if (/^[A-Z0-9]{8,16}$/.test(normalizedCode)) {
    return {
      code: normalizedCode,
      type: ProductCodeType.MANUAL_CODE,
      timestamp: new Date().toISOString(),
      scannedBy: userId,
    };
  } else {
    throw new ProcessingError(
      "Invalid product code format. Please check and try again.",
    );
  }
};

/**
 * Calculate points for a product code submission
 * @param code The product code
 * @param isPromotion Whether the code is part of a promotion
 * @returns The number of points earned
 */
export const calculateProductCodePoints = (
  code: ProductCode,
  isPromotion: boolean = false,
): number => {
  // Base points for different code types
  let points = 0;

  switch (code.type) {
    case ProductCodeType.BARCODE_EAN13:
    case ProductCodeType.BARCODE_UPC:
      points = 25; // Standard points for product barcodes
      break;
    case ProductCodeType.BARCODE_QR:
      points = 50; // Higher points for QR codes (usually promotional)
      break;
    case ProductCodeType.BARCODE_CODE128:
      points = 30; // Points for other barcode types
      break;
    case ProductCodeType.MANUAL_CODE:
      points = 20; // Lower points for manually entered codes
      break;
    default:
      points = 15; // Default fallback
  }

  // Apply promotion multiplier if applicable
  if (isPromotion) {
    points *= 2; // Double points for promotional codes
  }

  return points;
};
