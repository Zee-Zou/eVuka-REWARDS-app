/**
 * Tests for PWA utilities
 */

import {
  checkPwaFeatureSupport,
  registerBackgroundSync,
} from "./pwa-utils";

jest.mock("./logger");

describe("PWA Utilities", () => {
  describe("checkPwaFeatureSupport", () => {
    beforeEach(() => {
      // Setup basic browser APIs
      Object.defineProperty(navigator, "serviceWorker", {
        writable: true,
        value: {},
      });

      Object.defineProperty(window, "PushManager", {
        writable: true,
        value: {},
      });

      Object.defineProperty(global, "Notification", {
        writable: true,
        value: { permission: "default" },
      });

      Object.defineProperty(window, "SyncManager", {
        writable: true,
        value: {},
      });

      Object.defineProperty(navigator, "share", {
        writable: true,
        value: jest.fn(),
      });
    });

    it("should detect service worker support", () => {
      const support = checkPwaFeatureSupport();
      expect(support.serviceWorker).toBe(true);
    });

    it("should detect push manager support", () => {
      const support = checkPwaFeatureSupport();
      expect(support.pushManager).toBe(true);
    });

    it("should detect background sync support", () => {
      const support = checkPwaFeatureSupport();
      expect(support.backgroundSync).toBe(true);
    });

    it("should detect share API support", () => {
      const support = checkPwaFeatureSupport();
      expect(support.share).toBe(true);
    });

    it("should return false for unsupported features", () => {
      // @ts-expect-error - Testing missing API
      delete navigator.serviceWorker;

      const support = checkPwaFeatureSupport();
      expect(support.serviceWorker).toBe(false);
    });

    it("should detect notification permission status", () => {
      (Notification as { permission: string }).permission = "granted";

      const support = checkPwaFeatureSupport();
      expect(support.notificationPermission).toBe("granted");
    });
  });

  describe("registerBackgroundSync", () => {
    let mockRegister: jest.Mock;

    beforeEach(() => {
      mockRegister = jest.fn().mockResolvedValue(undefined);

      Object.defineProperty(navigator, "serviceWorker", {
        writable: true,
        value: {
          ready: Promise.resolve({
            sync: {
              register: mockRegister,
            },
          }),
        },
      });

      Object.defineProperty(window, "SyncManager", {
        writable: true,
        value: {},
      });
    });

    it("should register background sync successfully", async () => {
      const result = await registerBackgroundSync("sync-receipts");

      expect(result).toBe(true);
      expect(mockRegister).toHaveBeenCalledWith("sync-receipts");
    });

    it("should use default tag if not provided", async () => {
      await registerBackgroundSync();

      expect(mockRegister).toHaveBeenCalledWith("sync-receipts");
    });

    it("should return false if service worker not supported", async () => {
      // @ts-expect-error - Testing missing API
      delete navigator.serviceWorker;

      const result = await registerBackgroundSync();

      expect(result).toBe(false);
    });

    it("should return false if SyncManager not supported", async () => {
      // @ts-expect-error - Testing missing API
      delete window.SyncManager;

      const result = await registerBackgroundSync();

      expect(result).toBe(false);
    });

    it("should handle registration errors", async () => {
      mockRegister.mockRejectedValue(new Error("Registration failed"));

      const result = await registerBackgroundSync();

      expect(result).toBe(false);
    });
  });

  describe("requestPersistentStorage", () => {
    it("should request persistent storage successfully", async () => {
      const mockPersist = jest.fn().mockResolvedValue(true);
      const mockPersisted = jest.fn().mockResolvedValue(false);

      Object.defineProperty(navigator, "storage", {
        writable: true,
        value: {
          persist: mockPersist,
          persisted: mockPersisted,
        },
      });

      const { requestPersistentStorage } = await import("./pwa-utils");
      const result = await requestPersistentStorage();

      expect(result).toBe(true);
      expect(mockPersist).toHaveBeenCalled();
    });

    it("should return true if already persisted", async () => {
      const mockPersisted = jest.fn().mockResolvedValue(true);

      Object.defineProperty(navigator, "storage", {
        writable: true,
        value: {
          persist: jest.fn(),
          persisted: mockPersisted,
        },
      });

      const { requestPersistentStorage } = await import("./pwa-utils");
      const result = await requestPersistentStorage();

      expect(result).toBe(true);
    });

    it("should return false if not supported", async () => {
      // @ts-expect-error - Testing missing API
      delete navigator.storage;

      const { requestPersistentStorage } = await import("./pwa-utils");
      const result = await requestPersistentStorage();

      expect(result).toBe(false);
    });
  });

  describe("getStorageQuota", () => {
    it("should get storage quota information", async () => {
      const mockEstimate = jest.fn().mockResolvedValue({
        usage: 1024 * 1024 * 10, // 10MB
        quota: 1024 * 1024 * 100, // 100MB
      });

      Object.defineProperty(navigator, "storage", {
        writable: true,
        value: {
          estimate: mockEstimate,
        },
      });

      const { getStorageQuota } = await import("./pwa-utils");
      const result = await getStorageQuota();

      expect(result).not.toBeNull();
      expect(result?.usage).toBe(1024 * 1024 * 10);
      expect(result?.quota).toBe(1024 * 1024 * 100);
      expect(result?.usagePercentage).toBeCloseTo(10, 0);
    });

    it("should handle zero quota", async () => {
      const mockEstimate = jest.fn().mockResolvedValue({
        usage: 0,
        quota: 0,
      });

      Object.defineProperty(navigator, "storage", {
        writable: true,
        value: {
          estimate: mockEstimate,
        },
      });

      const { getStorageQuota } = await import("./pwa-utils");
      const result = await getStorageQuota();

      expect(result?.usagePercentage).toBe(0);
    });

    it("should return null if not supported", async () => {
      // @ts-expect-error - Testing missing API
      delete navigator.storage;

      const { getStorageQuota } = await import("./pwa-utils");
      const result = await getStorageQuota();

      expect(result).toBeNull();
    });
  });
});
