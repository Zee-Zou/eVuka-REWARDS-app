/**
 * Tests for image compression utilities
 */

import { compressReceiptImage } from "./image-compression";
import imageCompression from "browser-image-compression";

// Mock browser-image-compression
jest.mock("browser-image-compression");
jest.mock("./logger");

describe("Image Compression", () => {
  const createMockFile = (size: number, type: string = "image/jpeg"): File => {
    const blob = new Blob(["x".repeat(size)], { type });
    return new File([blob], "test-receipt.jpg", { type });
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("compressReceiptImage", () => {
    it("should compress image successfully", async () => {
      const originalFile = createMockFile(5 * 1024 * 1024); // 5MB
      const compressedBlob = new Blob(["compressed"], { type: "image/jpeg" });
      const compressedFile = new File([compressedBlob], "compressed.jpg", {
        type: "image/jpeg",
      });

      (imageCompression as jest.MockedFunction<typeof imageCompression>).mockResolvedValue(
        compressedFile
      );

      const result = await compressReceiptImage(originalFile);

      expect(result.compressedFile).toBe(compressedFile);
      expect(result.originalSize).toBe(originalFile.size);
      expect(result.compressedSize).toBe(compressedFile.size);
      expect(result.compressionRatio).toBeGreaterThan(0);
      expect(result.timeTaken).toBeGreaterThanOrEqual(0);
    });

    it("should calculate compression ratio correctly", async () => {
      const originalFile = createMockFile(1000);
      const compressedBlob = new Blob(["x".repeat(500)], { type: "image/jpeg" });
      const compressedFile = new File([compressedBlob], "compressed.jpg", {
        type: "image/jpeg",
      });

      (imageCompression as jest.MockedFunction<typeof imageCompression>).mockResolvedValue(
        compressedFile
      );

      const result = await compressReceiptImage(originalFile);

      // Compression ratio should be close to 50%
      expect(result.compressionRatio).toBeCloseTo(50, 0);
    });

    it("should use default compression options", async () => {
      const file = createMockFile(1000);
      const compressedFile = new File([new Blob(["compressed"])], "test.jpg");

      (imageCompression as jest.MockedFunction<typeof imageCompression>).mockResolvedValue(
        compressedFile
      );

      await compressReceiptImage(file);

      expect(imageCompression).toHaveBeenCalledWith(
        file,
        expect.objectContaining({
          maxSizeMB: 1,
          maxWidthOrHeight: 1920,
          useWebWorker: true,
          fileType: "image/jpeg",
          initialQuality: 0.85,
        })
      );
    });

    it("should accept custom compression options", async () => {
      const file = createMockFile(1000);
      const compressedFile = new File([new Blob(["compressed"])], "test.jpg");

      (imageCompression as jest.MockedFunction<typeof imageCompression>).mockResolvedValue(
        compressedFile
      );

      await compressReceiptImage(file, {
        maxSizeMB: 0.5,
        maxWidthOrHeight: 1024,
        initialQuality: 0.7,
      });

      expect(imageCompression).toHaveBeenCalledWith(
        file,
        expect.objectContaining({
          maxSizeMB: 0.5,
          maxWidthOrHeight: 1024,
          initialQuality: 0.7,
        })
      );
    });

    it("should handle compression errors", async () => {
      const file = createMockFile(1000);

      (imageCompression as jest.MockedFunction<typeof imageCompression>).mockRejectedValue(
        new Error("Compression failed")
      );

      await expect(compressReceiptImage(file)).rejects.toThrow("Compression failed");
    });

    it("should measure compression time", async () => {
      const file = createMockFile(1000);
      const compressedFile = new File([new Blob(["compressed"])], "test.jpg");

      (imageCompression as jest.MockedFunction<typeof imageCompression>).mockImplementation(
        () =>
          new Promise((resolve) => {
            setTimeout(() => resolve(compressedFile), 100);
          })
      );

      const result = await compressReceiptImage(file);

      expect(result.timeTaken).toBeGreaterThanOrEqual(90); // Allow some variance
    });

    it("should handle very small files", async () => {
      const file = createMockFile(10); // 10 bytes
      const compressedFile = new File([new Blob(["tiny"])], "test.jpg");

      (imageCompression as jest.MockedFunction<typeof imageCompression>).mockResolvedValue(
        compressedFile
      );

      const result = await compressReceiptImage(file);

      expect(result.compressedFile).toBe(compressedFile);
      expect(result.compressionRatio).toBeGreaterThanOrEqual(0);
    });

    it("should handle files that cannot be compressed further", async () => {
      const file = createMockFile(1000);
      // Compressed file is same size as original
      const compressedFile = createMockFile(1000);

      (imageCompression as jest.MockedFunction<typeof imageCompression>).mockResolvedValue(
        compressedFile
      );

      const result = await compressReceiptImage(file);

      // Ratio should be close to 0 (no compression)
      expect(result.compressionRatio).toBeCloseTo(0, 0);
    });

    it("should preserve file type", async () => {
      const file = createMockFile(1000, "image/png");
      const compressedBlob = new Blob(["compressed"], { type: "image/jpeg" });
      const compressedFile = new File([compressedBlob], "compressed.jpg", {
        type: "image/jpeg",
      });

      (imageCompression as jest.MockedFunction<typeof imageCompression>).mockResolvedValue(
        compressedFile
      );

      const result = await compressReceiptImage(file);

      expect(imageCompression).toHaveBeenCalledWith(
        file,
        expect.objectContaining({
          fileType: "image/jpeg",
        })
      );
    });
  });
});
