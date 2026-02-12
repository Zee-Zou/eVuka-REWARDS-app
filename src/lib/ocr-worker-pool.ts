/**
 * OCR Worker Pool Manager
 * Manages a pool of Tesseract workers for parallel processing
 * Prevents UI blocking by reusing workers instead of creating/terminating each time
 */

import { createWorker, Worker } from "tesseract.js";
import { logger } from "./logger";
import { ProcessingError } from "@/types/errors";
import { OCRErrorType, OCRResult } from "./ocr";

interface WorkerTask {
  imageData: string;
  options: {
    timeout?: number;
    minConfidence?: number;
    highQuality?: boolean;
  };
  resolve: (result: OCRResult) => void;
  reject: (error: Error) => void;
}

class OCRWorkerPool {
  private workers: Worker[] = [];
  private availableWorkers: Worker[] = [];
  private taskQueue: WorkerTask[] = [];
  private readonly maxWorkers = 2; // Max concurrent OCR operations
  private isInitialized = false;
  private initPromise: Promise<void> | null = null;

  /**
   * Initialize the worker pool
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    if (this.initPromise) {
      return this.initPromise;
    }

    this.initPromise = this.doInitialize();
    return this.initPromise;
  }

  private async doInitialize(): Promise<void> {
    try {
      logger.info("Initializing OCR worker pool", { maxWorkers: this.maxWorkers });

      // Create workers
      for (let i = 0; i < this.maxWorkers; i++) {
        try {
          const worker = await createWorker({
            logger: (m: { status: string; progress: number }) => {
              if (m.status === "recognizing text") {
                logger.debug(`OCR Worker ${i} Progress: ${Math.floor(m.progress * 100)}%`);
              }
            },
          });

          // Pre-load language
          await worker.loadLanguage("eng");
          await worker.initialize("eng");

          this.workers.push(worker);
          this.availableWorkers.push(worker);

          logger.debug(`OCR Worker ${i} initialized successfully`);
        } catch (error) {
          logger.error(`Failed to initialize OCR worker ${i}:`, error);
          // Continue with fewer workers rather than failing completely
        }
      }

      if (this.workers.length === 0) {
        throw new Error("Failed to initialize any OCR workers");
      }

      this.isInitialized = true;
      logger.info(`OCR worker pool initialized with ${this.workers.length} workers`);
    } catch (error) {
      this.initPromise = null;
      throw error;
    }
  }

  /**
   * Process an image with OCR using the worker pool
   */
  async processImage(
    imageData: string,
    options: {
      timeout?: number;
      minConfidence?: number;
      highQuality?: boolean;
    } = {}
  ): Promise<OCRResult> {
    // Ensure pool is initialized
    await this.initialize();

    return new Promise((resolve, reject) => {
      const task: WorkerTask = { imageData, options, resolve, reject };

      // If worker available, process immediately
      if (this.availableWorkers.length > 0) {
        this.processTask(task);
      } else {
        // Otherwise queue the task
        this.taskQueue.push(task);
        logger.debug(`Task queued. Queue length: ${this.taskQueue.length}`);
      }
    });
  }

  /**
   * Process a task with an available worker
   */
  private async processTask(task: WorkerTask): Promise<void> {
    const worker = this.availableWorkers.shift();
    if (!worker) {
      // This shouldn't happen, but queue the task just in case
      this.taskQueue.push(task);
      return;
    }

    const startTime = Date.now();
    const { imageData, options, resolve, reject } = task;
    const { timeout = 30000, minConfidence = 30, highQuality = false } = options;

    try {
      // Validate image data
      if (!imageData || !imageData.startsWith("data:image")) {
        throw new ProcessingError(
          "Invalid image data provided",
          OCRErrorType.INVALID_IMAGE
        );
      }

      // Create timeout promise
      const timeoutPromise = new Promise<never>((_, rejectTimeout) => {
        setTimeout(() => {
          rejectTimeout(
            new ProcessingError(
              "OCR processing timed out. Try with a clearer image or smaller receipt.",
              OCRErrorType.TIMEOUT
            )
          );
        }, timeout);
      });

      // Set recognition parameters
      await worker.setParameters({
        tessedit_char_whitelist:
          "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ$.,:-/% ",
        preserve_interword_spaces: "1",
        tessedit_pageseg_mode: "6",
        tessjs_create_hocr: "0",
        tessjs_create_tsv: "0",
        tessjs_create_box: "0",
        tessjs_create_unlv: "0",
        tessjs_create_osd: "0",
        ...(highQuality
          ? {
              tessjs_image_dpi: "300",
              textord_min_linesize: "2.5",
            }
          : {}),
      });

      // Perform OCR with timeout
      const {
        data: { text, confidence },
      } = await Promise.race([worker.recognize(imageData), timeoutPromise]);

      const processingTime = Date.now() - startTime;

      // Check confidence level
      if (confidence < minConfidence) {
        logger.warn(`Low OCR confidence: ${confidence}%`);
        resolve({
          text,
          confidence,
          processingTime,
          imageQuality: confidence < 40 ? "low" : confidence < 70 ? "medium" : "high",
          errorDetails: "Low confidence in text recognition. Results may be inaccurate.",
        });
      } else {
        const imageQuality =
          confidence < 60 ? "low" : confidence < 85 ? "medium" : "high";

        resolve({
          text,
          confidence,
          processingTime,
          imageQuality,
        });
      }
    } catch (error) {
      logger.error("OCR processing error in worker pool:", error);

      let errorType = OCRErrorType.UNKNOWN;
      let errorMessage = "Failed to process receipt image. Please try again.";

      if (error instanceof ProcessingError) {
        errorType = (error.code as OCRErrorType) || OCRErrorType.UNKNOWN;
        errorMessage = error.message;
      } else if (error instanceof Error) {
        const errorStr = error.toString().toLowerCase();
        if (errorStr.includes("timeout")) {
          errorType = OCRErrorType.TIMEOUT;
          errorMessage = "Processing took too long. Try with a clearer image.";
        } else if (errorStr.includes("memory")) {
          errorType = OCRErrorType.RECOGNITION_FAILED;
          errorMessage = "Image is too large or complex. Try cropping or resizing.";
        }
      }

      reject(new ProcessingError(errorMessage, errorType));
    } finally {
      // Return worker to pool
      this.availableWorkers.push(worker);

      // Process next task in queue if any
      if (this.taskQueue.length > 0) {
        const nextTask = this.taskQueue.shift();
        if (nextTask) {
          this.processTask(nextTask);
        }
      }
    }
  }

  /**
   * Terminate all workers and reset the pool
   */
  async terminate(): Promise<void> {
    logger.info("Terminating OCR worker pool");

    // Clear queue
    this.taskQueue = [];

    // Terminate all workers
    await Promise.all(
      this.workers.map(async (worker) => {
        try {
          await worker.terminate();
        } catch (error) {
          logger.error("Error terminating worker:", error);
        }
      })
    );

    this.workers = [];
    this.availableWorkers = [];
    this.isInitialized = false;
    this.initPromise = null;

    logger.info("OCR worker pool terminated");
  }

  /**
   * Get pool statistics
   */
  getStats() {
    return {
      totalWorkers: this.workers.length,
      availableWorkers: this.availableWorkers.length,
      queuedTasks: this.taskQueue.length,
      isInitialized: this.isInitialized,
    };
  }
}

// Export singleton instance
export const ocrWorkerPool = new OCRWorkerPool();

/**
 * Perform OCR using the worker pool (new recommended API)
 */
export const performOCRWithPool = async (
  imageData: string,
  options: {
    timeout?: number;
    minConfidence?: number;
    highQuality?: boolean;
  } = {}
): Promise<OCRResult> => {
  return ocrWorkerPool.processImage(imageData, options);
};
