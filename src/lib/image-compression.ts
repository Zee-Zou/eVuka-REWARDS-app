/**
 * Image Compression Utility
 *
 * Compresses receipt images before upload to reduce bandwidth and storage costs
 * Uses browser-image-compression library with optimized settings for receipts
 */

import imageCompression from 'browser-image-compression';
import { logger } from './logger';

/**
 * Compression options optimized for receipt images
 */
export interface CompressionOptions {
  maxSizeMB?: number; // Maximum file size in MB
  maxWidthOrHeight?: number; // Maximum dimension (maintains aspect ratio)
  useWebWorker?: boolean; // Use Web Worker for better performance
  fileType?: string; // Output format (image/jpeg, image/png, image/webp)
  initialQuality?: number; // Initial quality (0-1)
}

/**
 * Default compression options for receipts
 * Optimized for OCR readability while reducing file size
 */
const DEFAULT_OPTIONS: CompressionOptions = {
  maxSizeMB: 1, // Limit to 1MB (sufficient for receipts)
  maxWidthOrHeight: 1920, // Max dimension for high DPI screens
  useWebWorker: true, // Non-blocking compression
  fileType: 'image/jpeg', // JPEG is best for photos
  initialQuality: 0.85, // Good balance of quality vs size
};

/**
 * Compression result with metadata
 */
export interface CompressionResult {
  compressedFile: File;
  originalSize: number;
  compressedSize: number;
  compressionRatio: number; // Percentage reduction
  timeTaken: number; // Milliseconds
}

/**
 * Compress a receipt image file
 *
 * @param file - Original image file
 * @param options - Compression options (optional)
 * @returns Compression result with compressed file and metadata
 *
 * @example
 * ```typescript
 * const result = await compressReceiptImage(imageFile);
 * console.log(`Reduced size by ${result.compressionRatio}%`);
 * // Upload result.compressedFile instead of original
 * ```
 */
export async function compressReceiptImage(
  file: File,
  options?: CompressionOptions
): Promise<CompressionResult> {
  const startTime = performance.now();
  const originalSize = file.size;

  try {
    logger.info('Starting image compression', {
      originalSize: `${(originalSize / 1024 / 1024).toFixed(2)} MB`,
      fileName: file.name,
    });

    // Merge options with defaults
    const compressionOptions = {
      ...DEFAULT_OPTIONS,
      ...options,
    };

    // Perform compression
    const compressedFile = await imageCompression(file, compressionOptions);
    const compressedSize = compressedFile.size;
    const compressionRatio = ((originalSize - compressedSize) / originalSize) * 100;
    const timeTaken = performance.now() - startTime;

    logger.info('Image compression complete', {
      originalSize: `${(originalSize / 1024 / 1024).toFixed(2)} MB`,
      compressedSize: `${(compressedSize / 1024 / 1024).toFixed(2)} MB`,
      compressionRatio: `${compressionRatio.toFixed(1)}%`,
      timeTaken: `${timeTaken.toFixed(0)}ms`,
    });

    return {
      compressedFile,
      originalSize,
      compressedSize,
      compressionRatio,
      timeTaken,
    };
  } catch (error) {
    logger.error('Image compression failed', error);

    // Return original file if compression fails
    // This ensures receipt capture still works even if compression fails
    return {
      compressedFile: file,
      originalSize,
      compressedSize: originalSize,
      compressionRatio: 0,
      timeTaken: performance.now() - startTime,
    };
  }
}

/**
 * Convert a base64 data URL to a File object
 * Useful for compressing images captured from camera
 *
 * @param dataUrl - Base64 data URL (e.g., from canvas.toDataURL())
 * @param fileName - Name for the file
 * @returns File object
 */
export function dataUrlToFile(dataUrl: string, fileName: string = 'receipt.jpg'): File {
  const arr = dataUrl.split(',');
  const mimeMatch = arr[0].match(/:(.*?);/);
  const mime = mimeMatch ? mimeMatch[1] : 'image/jpeg';
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);

  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }

  return new File([u8arr], fileName, { type: mime });
}

/**
 * Convert a File to a base64 data URL
 * Useful for storing compressed images
 *
 * @param file - File to convert
 * @returns Promise resolving to base64 data URL
 */
export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      resolve(reader.result as string);
    };

    reader.onerror = (error) => {
      logger.error('Failed to convert file to data URL', error);
      reject(error);
    };

    reader.readAsDataURL(file);
  });
}

/**
 * Compress a base64 image data URL
 * Convenience function that handles conversion
 *
 * @param dataUrl - Base64 data URL
 * @param options - Compression options
 * @returns Compressed data URL
 */
export async function compressDataUrl(
  dataUrl: string,
  options?: CompressionOptions
): Promise<string> {
  const file = dataUrlToFile(dataUrl);
  const result = await compressReceiptImage(file, options);
  return await fileToDataUrl(result.compressedFile);
}

/**
 * Get estimated compression savings for display to user
 *
 * @param originalSize - Original file size in bytes
 * @param compressionRatio - Compression ratio (0-100)
 * @returns Human-readable savings string
 */
export function getCompressionSavings(
  originalSize: number,
  compressionRatio: number
): string {
  const savedBytes = (originalSize * compressionRatio) / 100;
  const savedMB = savedBytes / 1024 / 1024;

  if (savedMB < 0.1) {
    return `${(savedBytes / 1024).toFixed(0)} KB saved`;
  }

  return `${savedMB.toFixed(1)} MB saved (${compressionRatio.toFixed(0)}% reduction)`;
}
