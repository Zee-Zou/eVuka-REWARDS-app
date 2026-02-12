/**
 * Tests for push notification utilities
 */

import {
  isNotificationSupported,
  getNotificationPermission,
  requestNotificationPermission,
  subscribeToPushNotifications,
  unsubscribeFromPushNotifications,
  showLocalNotification,
} from "./notifications";
import { supabase } from "./supabase";

// Mock dependencies
jest.mock("./supabase");
jest.mock("./logger");

describe("Notification Utilities", () => {
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Mock Notification API
    Object.defineProperty(global, "Notification", {
      writable: true,
      value: {
        permission: "default",
        requestPermission: jest.fn().mockResolvedValue("granted"),
      },
    });

    // Mock service worker
    Object.defineProperty(navigator, "serviceWorker", {
      writable: true,
      value: {
        ready: Promise.resolve({
          pushManager: {
            getSubscription: jest.fn().mockResolvedValue(null),
            subscribe: jest.fn().mockResolvedValue({
              endpoint: "https://example.com/push",
              toJSON: () => ({ keys: { p256dh: "test", auth: "test" } }),
              unsubscribe: jest.fn().mockResolvedValue(true),
            }),
          },
          showNotification: jest.fn().mockResolvedValue(undefined),
        }),
      },
    });

    // Mock PushManager
    Object.defineProperty(window, "PushManager", {
      writable: true,
      value: jest.fn(),
    });
  });

  describe("isNotificationSupported", () => {
    it("should return true when all APIs are supported", () => {
      expect(isNotificationSupported()).toBe(true);
    });

    it("should return false when Notification API is missing", () => {
      // @ts-expect-error - Testing missing API
      delete window.Notification;
      expect(isNotificationSupported()).toBe(false);
    });

    it("should return false when Service Worker is missing", () => {
      // @ts-expect-error - Testing missing API
      delete navigator.serviceWorker;
      expect(isNotificationSupported()).toBe(false);
    });

    it("should return false when PushManager is missing", () => {
      // @ts-expect-error - Testing missing API
      delete window.PushManager;
      expect(isNotificationSupported()).toBe(false);
    });
  });

  describe("getNotificationPermission", () => {
    it('should return "granted" when permission is granted', () => {
      (Notification as { permission: string }).permission = "granted";
      expect(getNotificationPermission()).toBe("granted");
    });

    it('should return "denied" when permission is denied', () => {
      (Notification as { permission: string }).permission = "denied";
      expect(getNotificationPermission()).toBe("denied");
    });

    it('should return "denied" when notifications are not supported', () => {
      // @ts-expect-error - Testing missing API
      delete window.Notification;
      expect(getNotificationPermission()).toBe("denied");
    });
  });

  describe("requestNotificationPermission", () => {
    it("should request permission and return granted", async () => {
      const mockRequestPermission = jest.fn().mockResolvedValue("granted");
      (Notification as { requestPermission: typeof mockRequestPermission }).requestPermission =
        mockRequestPermission;

      const result = await requestNotificationPermission();

      expect(result).toBe("granted");
      expect(mockRequestPermission).toHaveBeenCalled();
    });

    it("should return denied when user denies permission", async () => {
      const mockRequestPermission = jest.fn().mockResolvedValue("denied");
      (Notification as { requestPermission: typeof mockRequestPermission }).requestPermission =
        mockRequestPermission;

      const result = await requestNotificationPermission();

      expect(result).toBe("denied");
    });

    it("should return granted if already granted", async () => {
      (Notification as { permission: string }).permission = "granted";

      const result = await requestNotificationPermission();

      expect(result).toBe("granted");
    });

    it("should return denied if notifications not supported", async () => {
      // @ts-expect-error - Testing missing API
      delete window.Notification;

      const result = await requestNotificationPermission();

      expect(result).toBe("denied");
    });
  });

  describe("subscribeToPushNotifications", () => {
    beforeEach(() => {
      process.env.VITE_VAPID_PUBLIC_KEY = "test-vapid-key";
    });

    it("should subscribe to push notifications successfully", async () => {
      (Notification as { permission: string }).permission = "granted";

      // Mock Supabase
      (supabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: { id: "test-user-id" } },
      });
      (supabase.from as jest.Mock).mockReturnValue({
        upsert: jest.fn().mockResolvedValue({ error: null }),
      });

      const subscription = await subscribeToPushNotifications();

      expect(subscription).toBeTruthy();
      expect(subscription?.endpoint).toBe("https://example.com/push");
    });

    it("should return null if permission is denied", async () => {
      const mockRequestPermission = jest.fn().mockResolvedValue("denied");
      (Notification as { requestPermission: typeof mockRequestPermission }).requestPermission =
        mockRequestPermission;

      const subscription = await subscribeToPushNotifications();

      expect(subscription).toBeNull();
    });

    it("should return null if VAPID key not configured", async () => {
      delete process.env.VITE_VAPID_PUBLIC_KEY;
      (Notification as { permission: string }).permission = "granted";

      const subscription = await subscribeToPushNotifications();

      expect(subscription).toBeNull();
    });

    it("should return existing subscription if already subscribed", async () => {
      (Notification as { permission: string }).permission = "granted";

      const existingSubscription = {
        endpoint: "https://example.com/existing",
        toJSON: () => ({ keys: { p256dh: "test", auth: "test" } }),
      };

      Object.defineProperty(navigator, "serviceWorker", {
        writable: true,
        value: {
          ready: Promise.resolve({
            pushManager: {
              getSubscription: jest.fn().mockResolvedValue(existingSubscription),
            },
          }),
        },
      });

      const subscription = await subscribeToPushNotifications();

      expect(subscription).toBe(existingSubscription);
    });
  });

  describe("unsubscribeFromPushNotifications", () => {
    it("should unsubscribe successfully", async () => {
      const mockUnsubscribe = jest.fn().mockResolvedValue(true);
      const subscription = {
        endpoint: "https://example.com/push",
        unsubscribe: mockUnsubscribe,
        toJSON: () => ({ keys: { p256dh: "test", auth: "test" } }),
      };

      Object.defineProperty(navigator, "serviceWorker", {
        writable: true,
        value: {
          ready: Promise.resolve({
            pushManager: {
              getSubscription: jest.fn().mockResolvedValue(subscription),
            },
          }),
        },
      });

      (supabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: { id: "test-user-id" } },
      });
      (supabase.from as jest.Mock).mockReturnValue({
        delete: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({ error: null }),
          }),
        }),
      });

      const result = await unsubscribeFromPushNotifications();

      expect(result).toBe(true);
      expect(mockUnsubscribe).toHaveBeenCalled();
    });

    it("should return true if no active subscription", async () => {
      Object.defineProperty(navigator, "serviceWorker", {
        writable: true,
        value: {
          ready: Promise.resolve({
            pushManager: {
              getSubscription: jest.fn().mockResolvedValue(null),
            },
          }),
        },
      });

      const result = await unsubscribeFromPushNotifications();

      expect(result).toBe(true);
    });
  });

  describe("showLocalNotification", () => {
    it("should show local notification", async () => {
      (Notification as { permission: string }).permission = "granted";

      const mockShowNotification = jest.fn().mockResolvedValue(undefined);
      Object.defineProperty(navigator, "serviceWorker", {
        writable: true,
        value: {
          ready: Promise.resolve({
            showNotification: mockShowNotification,
          }),
        },
      });

      await showLocalNotification({
        title: "Test Notification",
        body: "Test body",
      });

      expect(mockShowNotification).toHaveBeenCalledWith(
        "Test Notification",
        expect.objectContaining({
          body: "Test body",
        })
      );
    });

    it("should not show notification if permission not granted", async () => {
      (Notification as { permission: string }).permission = "denied";

      const mockShowNotification = jest.fn();
      Object.defineProperty(navigator, "serviceWorker", {
        writable: true,
        value: {
          ready: Promise.resolve({
            showNotification: mockShowNotification,
          }),
        },
      });

      await showLocalNotification({
        title: "Test",
        body: "Test",
      });

      expect(mockShowNotification).not.toHaveBeenCalled();
    });
  });
});
