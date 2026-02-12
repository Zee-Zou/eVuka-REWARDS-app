/**
 * Push notification utilities for eVuka Rewards
 * Handles notification permissions, subscriptions, and sending
 */

import { supabase } from "./supabase";
import { logger } from "./logger";

export interface NotificationPayload {
  title: string;
  body: string;
  url?: string;
  icon?: string;
  badge?: string;
  actions?: NotificationAction[];
  data?: Record<string, unknown>;
}

export interface NotificationAction {
  action: string;
  title: string;
  icon?: string;
}

export type NotificationPermission = "granted" | "denied" | "default";

/**
 * Check if notifications are supported in this browser
 */
export function isNotificationSupported(): boolean {
  return (
    "Notification" in window &&
    "serviceWorker" in navigator &&
    "PushManager" in window
  );
}

/**
 * Get current notification permission status
 */
export function getNotificationPermission(): NotificationPermission {
  if (!isNotificationSupported()) {
    return "denied";
  }
  return Notification.permission as NotificationPermission;
}

/**
 * Request notification permission from user
 * Returns the permission status after request
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!isNotificationSupported()) {
    logger.warn("Notifications not supported in this browser");
    return "denied";
  }

  if (Notification.permission === "granted") {
    return "granted";
  }

  if (Notification.permission === "denied") {
    logger.warn("Notification permission previously denied");
    return "denied";
  }

  try {
    const permission = await Notification.requestPermission();
    logger.info("Notification permission status:", { permission });
    return permission as NotificationPermission;
  } catch (error) {
    logger.error("Failed to request notification permission:", error);
    return "denied";
  }
}

/**
 * Subscribe user to push notifications
 * Returns the push subscription object
 */
export async function subscribeToPushNotifications(): Promise<PushSubscription | null> {
  if (!isNotificationSupported()) {
    logger.warn("Push notifications not supported");
    return null;
  }

  // First ensure we have permission
  const permission = await requestNotificationPermission();
  if (permission !== "granted") {
    logger.warn("Cannot subscribe without notification permission");
    return null;
  }

  try {
    // Get service worker registration
    const registration = await navigator.serviceWorker.ready;

    // Check if already subscribed
    let subscription = await registration.pushManager.getSubscription();
    if (subscription) {
      logger.info("Already subscribed to push notifications");
      return subscription;
    }

    // Get VAPID public key from environment
    const vapidPublicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
    if (!vapidPublicKey) {
      logger.error("VAPID public key not configured");
      return null;
    }

    // Convert base64 VAPID key to Uint8Array
    const convertedVapidKey = urlBase64ToUint8Array(vapidPublicKey);

    // Subscribe to push notifications
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: convertedVapidKey,
    });

    // Save subscription to backend
    await savePushSubscription(subscription);

    logger.info("Successfully subscribed to push notifications");
    return subscription;
  } catch (error) {
    logger.error("Failed to subscribe to push notifications:", error);
    return null;
  }
}

/**
 * Unsubscribe from push notifications
 */
export async function unsubscribeFromPushNotifications(): Promise<boolean> {
  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();

    if (!subscription) {
      logger.info("No active push subscription found");
      return true;
    }

    // Unsubscribe
    const success = await subscription.unsubscribe();

    if (success) {
      // Remove subscription from backend
      await removePushSubscription(subscription);
      logger.info("Successfully unsubscribed from push notifications");
    }

    return success;
  } catch (error) {
    logger.error("Failed to unsubscribe from push notifications:", error);
    return false;
  }
}

/**
 * Save push subscription to Supabase backend
 */
async function savePushSubscription(subscription: PushSubscription): Promise<void> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      logger.warn("Cannot save push subscription - user not authenticated");
      return;
    }

    const subscriptionData = {
      user_id: user.id,
      endpoint: subscription.endpoint,
      keys: subscription.toJSON().keys,
      created_at: new Date().toISOString(),
    };

    const { error } = await supabase
      .from("push_subscriptions")
      .upsert(subscriptionData, { onConflict: "user_id,endpoint" });

    if (error) {
      logger.error("Failed to save push subscription to database:", error);
    } else {
      logger.info("Push subscription saved to database");
    }
  } catch (error) {
    logger.error("Error saving push subscription:", error);
  }
}

/**
 * Remove push subscription from backend
 */
async function removePushSubscription(subscription: PushSubscription): Promise<void> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return;
    }

    const { error } = await supabase
      .from("push_subscriptions")
      .delete()
      .eq("user_id", user.id)
      .eq("endpoint", subscription.endpoint);

    if (error) {
      logger.error("Failed to remove push subscription from database:", error);
    }
  } catch (error) {
    logger.error("Error removing push subscription:", error);
  }
}

/**
 * Show a local notification (doesn't require server push)
 * Useful for immediate feedback
 */
export async function showLocalNotification(
  payload: NotificationPayload
): Promise<void> {
  if (!isNotificationSupported()) {
    logger.warn("Notifications not supported");
    return;
  }

  if (Notification.permission !== "granted") {
    logger.warn("Notification permission not granted");
    return;
  }

  try {
    const registration = await navigator.serviceWorker.ready;

    await registration.showNotification(payload.title, {
      body: payload.body,
      icon: payload.icon || "/icons/icon-192x192.png",
      badge: payload.badge || "/icons/badge-72x72.png",
      data: {
        url: payload.url || "/",
        ...payload.data,
      },
      actions: payload.actions,
      tag: `evuka-${Date.now()}`, // Unique tag to prevent grouping
      requireInteraction: false,
      silent: false,
    });

    logger.info("Local notification shown:", { title: payload.title });
  } catch (error) {
    logger.error("Failed to show local notification:", error);
  }
}

/**
 * Convert VAPID key from base64 string to Uint8Array
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
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
 * Helper hook for notification state (can be used in React components)
 */
export function useNotificationPermission() {
  const [permission, setPermission] = React.useState<NotificationPermission>(
    getNotificationPermission()
  );
  const [isSubscribed, setIsSubscribed] = React.useState(false);

  React.useEffect(() => {
    // Check subscription status on mount
    checkSubscriptionStatus();

    // Listen for permission changes (if browser supports it)
    if ("permissions" in navigator) {
      navigator.permissions
        .query({ name: "notifications" as PermissionName })
        .then((permissionStatus) => {
          permissionStatus.addEventListener("change", () => {
            setPermission(Notification.permission as NotificationPermission);
          });
        })
        .catch(() => {
          // Ignore errors - some browsers don't support this
        });
    }
  }, []);

  const checkSubscriptionStatus = async () => {
    if (!isNotificationSupported()) {
      setIsSubscribed(false);
      return;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      setIsSubscribed(!!subscription);
    } catch {
      setIsSubscribed(false);
    }
  };

  const requestPermission = async () => {
    const newPermission = await requestNotificationPermission();
    setPermission(newPermission);
    return newPermission;
  };

  const subscribe = async () => {
    const subscription = await subscribeToPushNotifications();
    setIsSubscribed(!!subscription);
    return subscription;
  };

  const unsubscribe = async () => {
    const success = await unsubscribeFromPushNotifications();
    if (success) {
      setIsSubscribed(false);
    }
    return success;
  };

  return {
    permission,
    isSubscribed,
    isSupported: isNotificationSupported(),
    requestPermission,
    subscribe,
    unsubscribe,
    showNotification: showLocalNotification,
  };
}

// Import React for the hook
import React from "react";
