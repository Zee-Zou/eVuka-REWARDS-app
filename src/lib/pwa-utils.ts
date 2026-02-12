/**
 * PWA utilities for eVuka Rewards
 * Handles PWA-specific functionality like installation prompts and updates
 */

import { useState, useEffect } from "react";
import { logger } from "./logger";

// Interface for the BeforeInstallPromptEvent which is not in the standard DOM types
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

// Track if the PWA is installed
export function usePwaInstallStatus() {
  const [isInstalled, setIsInstalled] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if running as installed PWA
    const checkIfInstalled = () => {
      const isStandalone =
        window.matchMedia("(display-mode: standalone)").matches ||
        (window.navigator as any).standalone ||
        document.referrer.includes("android-app://");

      setIsStandalone(isStandalone);
      setIsInstalled(isStandalone);
    };

    checkIfInstalled();

    // Listen for display mode changes
    const mediaQuery = window.matchMedia("(display-mode: standalone)");
    const handleChange = (e: MediaQueryListEvent) => setIsStandalone(e.matches);

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener("change", handleChange);
      return () => mediaQuery.removeEventListener("change", handleChange);
    } else {
      // Fallback for older browsers
      mediaQuery.addListener(handleChange);
      return () => mediaQuery.removeListener(handleChange);
    }
  }, []);

  return { isInstalled, isStandalone };
}

// Hook to handle the install prompt
export function usePwaInstall() {
  const [installPrompt, setInstallPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [canInstall, setCanInstall] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Store the event for later use
      setInstallPrompt(e as BeforeInstallPromptEvent);
      setCanInstall(true);

      logger.info("Install prompt captured and ready");
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt,
      );
    };
  }, []);

  const promptInstall = async () => {
    if (!installPrompt) {
      logger.warn("Install prompt not available");
      return;
    }

    // Show the install prompt
    installPrompt.prompt();

    // Wait for the user to respond to the prompt
    const { outcome } = await installPrompt.userChoice;

    logger.info(`User ${outcome} the installation prompt`);

    // Clear the saved prompt as it can only be used once
    setInstallPrompt(null);
    setCanInstall(false);

    return outcome === "accepted";
  };

  return { canInstall, promptInstall };
}

// Check for service worker updates
export function useServiceWorkerUpdates() {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(
    null,
  );

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.ready.then((registration) => {
        // When a new service worker is waiting to activate
        registration.addEventListener("updatefound", () => {
          const newWorker = registration.installing;

          if (!newWorker) return;

          newWorker.addEventListener("statechange", () => {
            if (
              newWorker.state === "installed" &&
              navigator.serviceWorker.controller
            ) {
              logger.info("New service worker installed and waiting");
              setUpdateAvailable(true);
              setWaitingWorker(registration.waiting);
            }
          });
        });
      });
    }
  }, []);

  // Function to update the service worker
  const updateServiceWorker = () => {
    if (!waitingWorker) return;

    // Send message to the waiting service worker to skip waiting
    waitingWorker.postMessage({ type: "SKIP_WAITING" });

    // Reload the page to activate the new service worker
    window.location.reload();
  };

  return { updateAvailable, updateServiceWorker };
}

// Check if the device supports specific PWA features
export function checkPwaFeatureSupport() {
  return {
    serviceWorker: "serviceWorker" in navigator,
    pushManager: "PushManager" in window,
    notificationPermission: Notification.permission,
    backgroundSync: "SyncManager" in window,
    share: navigator.share !== undefined,
    installPrompt: "BeforeInstallPromptEvent" in window,
    webShareTarget: document.querySelector('link[rel="manifest"]') !== null,
    periodicSync: "PeriodicSyncManager" in window,
    persistentStorage:
      navigator.storage && navigator.storage.persist !== undefined,
    deviceMemory: (navigator as Record<string, unknown>).deviceMemory !== undefined,
    networkInformation: (navigator as Record<string, unknown>).connection !== undefined,
    webPayment: "PaymentRequest" in window,
    credentials: "PasswordCredential" in window,
    vibrate: navigator.vibrate !== undefined,
    geolocation: "geolocation" in navigator,
    camera:
      "mediaDevices" in navigator &&
      navigator.mediaDevices.getUserMedia !== undefined,
    bluetooth: "bluetooth" in navigator,
    nfc: "NDEFReader" in window,
    batteryStatus: "getBattery" in navigator,
    wakeLock: "wakeLock" in navigator,
    clipboard: navigator.clipboard !== undefined,
    fileSystem: "showOpenFilePicker" in window,
    contactPicker: "ContactsManager" in window,
  };
}

// Register for push notifications
export async function registerForPushNotifications() {
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
    logger.warn("Push notifications not supported");
    return false;
  }

  try {
    // Request permission
    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      logger.info("Notification permission denied");
      return false;
    }

    // Get service worker registration
    const registration = await navigator.serviceWorker.ready;

    // Subscribe to push notifications
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(
        process.env.VITE_VAPID_PUBLIC_KEY || "",
      ),
    });

    // Send the subscription to your server
    await fetch("/api/push/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(subscription),
    });

    logger.info("Push notification subscription successful");
    return true;
  } catch (error) {
    logger.error("Error registering for push notifications", error);
    return false;
  }
}

// Helper function to convert base64 to Uint8Array for VAPID key
function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }

  return outputArray;
}

/**
 * Register background sync for offline receipt submissions
 * When the user goes offline, receipts are queued and synced when back online
 */
export async function registerBackgroundSync(tag: string = "sync-receipts"): Promise<boolean> {
  if (!("serviceWorker" in navigator)) {
    logger.warn("Service Worker not supported");
    return false;
  }

  // Check if SyncManager is supported
  if (!("SyncManager" in window)) {
    logger.warn("Background Sync not supported - will use fallback");
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.ready;

    // Register for background sync
    await (registration as ServiceWorkerRegistration & { sync: SyncManager }).sync.register(tag);

    logger.info(`Background sync registered: ${tag}`);
    return true;
  } catch (error) {
    logger.error("Error registering background sync:", error);
    return false;
  }
}

/**
 * Hook to manage background sync status
 */
export function useBackgroundSync() {
  const [isSupported, setIsSupported] = useState(false);
  const [isPending, setIsPending] = useState(false);

  useEffect(() => {
    // Check if background sync is supported
    const supported = "serviceWorker" in navigator && "SyncManager" in window;
    setIsSupported(supported);

    if (!supported) return;

    // Check if there are pending syncs
    checkPendingSync();
  }, []);

  const checkPendingSync = async () => {
    try {
      const registration = await navigator.serviceWorker.ready;
      const tags = await (registration as ServiceWorkerRegistration & { sync: SyncManager }).sync.getTags();
      setIsPending(tags.includes("sync-receipts"));
    } catch {
      setIsPending(false);
    }
  };

  const requestSync = async (tag: string = "sync-receipts") => {
    const success = await registerBackgroundSync(tag);
    if (success) {
      setIsPending(true);
    }
    return success;
  };

  return { isSupported, isPending, requestSync, checkPendingSync };
}

/**
 * Interface for SyncManager (not in default TypeScript lib)
 */
interface SyncManager {
  getTags(): Promise<string[]>;
  register(tag: string): Promise<void>;
}

/**
 * Request persistent storage to prevent data eviction
 */
export async function requestPersistentStorage(): Promise<boolean> {
  if (!navigator.storage || !navigator.storage.persist) {
    logger.warn("Persistent storage not supported");
    return false;
  }

  try {
    // Check if already persisted
    const isPersisted = await navigator.storage.persisted();
    if (isPersisted) {
      logger.info("Storage is already persistent");
      return true;
    }

    // Request persistent storage
    const granted = await navigator.storage.persist();
    if (granted) {
      logger.info("Persistent storage granted");
    } else {
      logger.warn("Persistent storage denied");
    }

    return granted;
  } catch (error) {
    logger.error("Error requesting persistent storage:", error);
    return false;
  }
}

/**
 * Get storage quota information
 */
export async function getStorageQuota(): Promise<{
  usage: number;
  quota: number;
  usagePercentage: number;
} | null> {
  if (!navigator.storage || !navigator.storage.estimate) {
    logger.warn("Storage API not supported");
    return null;
  }

  try {
    const estimate = await navigator.storage.estimate();
    const usage = estimate.usage || 0;
    const quota = estimate.quota || 0;
    const usagePercentage = quota > 0 ? (usage / quota) * 100 : 0;

    logger.info("Storage quota:", {
      usage: `${(usage / 1024 / 1024).toFixed(2)} MB`,
      quota: `${(quota / 1024 / 1024).toFixed(2)} MB`,
      usagePercentage: `${usagePercentage.toFixed(2)}%`,
    });

    return { usage, quota, usagePercentage };
  } catch (error) {
    logger.error("Error getting storage quota:", error);
    return null;
  }
}