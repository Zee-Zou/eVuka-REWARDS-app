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
    deviceMemory: (navigator as any).deviceMemory !== undefined,
    networkInformation: (navigator as any).connection !== undefined,
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
