/**
 * Tests for OCR Worker Pool
 */

import { ocrWorkerPool, performOCRWithPool } from "./ocr-worker-pool";
import { createWorker } from "tesseract.js";
import { OCRErrorType } from "./ocr";

// Mock tesseract.js
jest.mock("tesseract.js");
jest.mock("./logger");

describe("OCR Worker Pool", () => {
  const mockWorker = {
    loadLanguage: jest.fn().mockResolvedValue(undefined),
    initialize: jest.fn().mockResolvedValue(undefined),
    setParameters: jest.fn().mockResolvedValue(undefined),
    recognize: jest.fn().mockResolvedValue({
      data: {
        text: "Test receipt text",
        confidence: 85,
      },
    }),
    terminate: jest.fn().mockResolvedValue(undefined),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (createWorker as jest.Mock).mockResolvedValue(mockWorker);
  });

  afterEach(async () => {
    // Cleanup pool after each test
    await ocrWorkerPool.terminate();
  });

  describe("Worker Pool Initialization", () => {
    it("should initialize worker pool successfully", async () => {
      await ocrWorkerPool.initialize();

      const stats = ocrWorkerPool.getStats();

      expect(stats.totalWorkers).toBeGreaterThan(0);
      expect(stats.isInitialized).toBe(true);
      expect(createWorker).toHaveBeenCalled();
    });

    it("should only initialize once", async () => {
      await ocrWorkerPool.initialize();
      await ocrWorkerPool.initialize();

      // Should not create duplicate workers
      expect(createWorker).toHaveBeenCalledTimes(2); // Max workers = 2
    });

    it("should continue with fewer workers if some fail to initialize", async () => {
      let callCount = 0;
      (createWorker as jest.Mock).mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return Promise.reject(new Error("Worker initialization failed"));
        }
        return Promise.resolve(mockWorker);
      });

      await ocrWorkerPool.initialize();

      const stats = ocrWorkerPool.getStats();
      expect(stats.totalWorkers).toBe(1); // Only 1 succeeded
    });
  });

  describe("Image Processing", () => {
    it("should process image successfully", async () => {
      const imageData = "data:image/jpeg;base64,test";

      const result = await performOCRWithPool(imageData);

      expect(result.text).toBe("Test receipt text");
      expect(result.confidence).toBe(85);
      expect(result.processingTime).toBeGreaterThan(0);
      expect(result.imageQuality).toBe("medium");
    });

    it("should handle high confidence results", async () => {
      mockWorker.recognize.mockResolvedValueOnce({
        data: {
          text: "High quality text",
          confidence: 95,
        },
      });

      const result = await performOCRWithPool("data:image/jpeg;base64,test");

      expect(result.imageQuality).toBe("high");
      expect(result.errorDetails).toBeUndefined();
    });

    it("should handle low confidence results", async () => {
      mockWorker.recognize.mockResolvedValueOnce({
        data: {
          text: "Low quality text",
          confidence: 35,
        },
      });

      const result = await performOCRWithPool("data:image/jpeg;base64,test", {
        minConfidence: 30,
      });

      expect(result.imageQuality).toBe("low");
      expect(result.errorDetails).toContain("Low confidence");
    });

    it("should reject invalid image data", async () => {
      await expect(performOCRWithPool("invalid-data")).rejects.toThrow("Invalid image data");
    });

    it("should apply high quality settings when requested", async () => {
      await performOCRWithPool("data:image/jpeg;base64,test", { highQuality: true });

      expect(mockWorker.setParameters).toHaveBeenCalledWith(
        expect.objectContaining({
          tessjs_image_dpi: "300",
        })
      );
    });

    it("should handle timeout", async () => {
      mockWorker.recognize.mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 10000))
      );

      await expect(
        performOCRWithPool("data:image/jpeg;base64,test", { timeout: 100 })
      ).rejects.toThrow("timed out");
    });
  });

  describe("Worker Pool Management", () => {
    it("should queue tasks when all workers are busy", async () => {
      // Make recognition take a while
      mockWorker.recognize.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({
          data: { text: "Test", confidence: 85 }
        }), 100))
      );

      const promises = [
        performOCRWithPool("data:image/jpeg;base64,test1"),
        performOCRWithPool("data:image/jpeg;base64,test2"),
        performOCRWithPool("data:image/jpeg;base64,test3"),
      ];

      await Promise.all(promises);

      // All should succeed
      expect(promises).toHaveLength(3);
    });

    it("should process queued tasks after worker becomes available", async () => {
      let resolveFirst: ((value: { data: { text: string; confidence: number } }) => void) | null = null;
      let callCount = 0;

      mockWorker.recognize.mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return new Promise((resolve) => {
            resolveFirst = resolve;
          });
        }
        return Promise.resolve({
          data: { text: "Test", confidence: 85 }
        });
      });

      const promise1 = performOCRWithPool("data:image/jpeg;base64,test1");
      const promise2 = performOCRWithPool("data:image/jpeg;base64,test2");

      // Wait a bit for promise2 to be queued
      await new Promise(resolve => setTimeout(resolve, 50));

      const stats = ocrWorkerPool.getStats();
      expect(stats.queuedTasks).toBeGreaterThan(0);

      // Complete first task
      resolveFirst?.({ data: { text: "First", confidence: 85 } });

      await Promise.all([promise1, promise2]);
    });

    it("should provide accurate pool statistics", async () => {
      await ocrWorkerPool.initialize();

      const stats = ocrWorkerPool.getStats();

      expect(stats).toHaveProperty("totalWorkers");
      expect(stats).toHaveProperty("availableWorkers");
      expect(stats).toHaveProperty("queuedTasks");
      expect(stats).toHaveProperty("isInitialized");
    });
  });

  describe("Worker Pool Termination", () => {
    it("should terminate all workers", async () => {
      await ocrWorkerPool.initialize();
      await ocrWorkerPool.terminate();

      const stats = ocrWorkerPool.getStats();

      expect(stats.totalWorkers).toBe(0);
      expect(stats.isInitialized).toBe(false);
      expect(mockWorker.terminate).toHaveBeenCalled();
    });

    it("should clear task queue on termination", async () => {
      await ocrWorkerPool.initialize();

      // Add a task to queue
      mockWorker.recognize.mockImplementation(
        () => new Promise(() => {}) // Never resolves
      );

      performOCRWithPool("data:image/jpeg;base64,test"); // This will queue

      await ocrWorkerPool.terminate();

      const stats = ocrWorkerPool.getStats();
      expect(stats.queuedTasks).toBe(0);
    });
  });

  describe("Error Handling", () => {
    it("should handle worker recognition errors", async () => {
      mockWorker.recognize.mockRejectedValueOnce(new Error("Recognition failed"));

      await expect(performOCRWithPool("data:image/jpeg;base64,test")).rejects.toThrow();
    });

    it("should return worker to pool even if processing fails", async () => {
      mockWorker.recognize.mockRejectedValueOnce(new Error("Failed"));

      try {
        await performOCRWithPool("data:image/jpeg;base64,test");
      } catch (error) {
        // Expected to fail
      }

      const stats = ocrWorkerPool.getStats();
      // Worker should be returned to available pool
      expect(stats.availableWorkers).toBeGreaterThan(0);
    });
  });
});
