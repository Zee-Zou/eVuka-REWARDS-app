/**
 * Notification Settings Component
 * Allows users to manage push notification preferences
 */

import React from "react";
import { Bell, BellOff, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "../ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Switch } from "../ui/switch";
import { Label } from "../ui/label";
import { useNotificationPermission } from "../../lib/notifications";
import { useBackgroundSync } from "../../lib/pwa-utils";
import { useToast } from "../../hooks/use-toast";

export function NotificationSettings() {
  const { toast } = useToast();
  const {
    permission,
    isSubscribed,
    isSupported,
    requestPermission,
    subscribe,
    unsubscribe,
  } = useNotificationPermission();

  const { isSupported: isSyncSupported, isPending: isSyncPending } = useBackgroundSync();

  const handleToggleNotifications = async (enabled: boolean) => {
    if (!isSupported) {
      toast({
        title: "Not Supported",
        description: "Push notifications are not supported on this device.",
        variant: "destructive",
      });
      return;
    }

    if (enabled) {
      // Request permission first
      if (permission !== "granted") {
        const newPermission = await requestPermission();
        if (newPermission !== "granted") {
          toast({
            title: "Permission Denied",
            description: "You denied notification permissions. Please enable them in your browser settings.",
            variant: "destructive",
          });
          return;
        }
      }

      // Subscribe to push notifications
      const subscription = await subscribe();
      if (subscription) {
        toast({
          title: "Notifications Enabled",
          description: "You'll now receive notifications for points earned and rewards.",
        });
      } else {
        toast({
          title: "Subscription Failed",
          description: "Failed to subscribe to push notifications. Please try again.",
          variant: "destructive",
        });
      }
    } else {
      // Unsubscribe from push notifications
      const success = await unsubscribe();
      if (success) {
        toast({
          title: "Notifications Disabled",
          description: "You won't receive push notifications anymore.",
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to unsubscribe from notifications.",
          variant: "destructive",
        });
      }
    }
  };

  const renderPermissionStatus = () => {
    switch (permission) {
      case "granted":
        return (
          <div className="flex items-center gap-2 text-green-600">
            <CheckCircle2 className="h-4 w-4" />
            <span className="text-sm">Granted</span>
          </div>
        );
      case "denied":
        return (
          <div className="flex items-center gap-2 text-red-600">
            <AlertCircle className="h-4 w-4" />
            <span className="text-sm">Denied</span>
          </div>
        );
      default:
        return (
          <div className="flex items-center gap-2 text-yellow-600">
            <AlertCircle className="h-4 w-4" />
            <span className="text-sm">Not requested</span>
          </div>
        );
    }
  };

  if (!isSupported) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BellOff className="h-5 w-5" />
            Notifications
          </CardTitle>
          <CardDescription>
            Push notifications are not supported on this device or browser.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Notifications
        </CardTitle>
        <CardDescription>
          Manage your notification preferences for eVuka Rewards
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Permission Status */}
        <div className="flex items-center justify-between">
          <div>
            <Label htmlFor="notification-permission" className="text-base font-medium">
              Permission Status
            </Label>
            <p className="text-sm text-muted-foreground">
              Browser permission to show notifications
            </p>
          </div>
          {renderPermissionStatus()}
        </div>

        {/* Push Notifications Toggle */}
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <Label htmlFor="push-notifications" className="text-base font-medium">
              Push Notifications
            </Label>
            <p className="text-sm text-muted-foreground">
              Get notified when you earn points and rewards
            </p>
          </div>
          <Switch
            id="push-notifications"
            checked={isSubscribed}
            onCheckedChange={handleToggleNotifications}
            disabled={permission === "denied"}
          />
        </div>

        {/* Background Sync Status */}
        {isSyncSupported && (
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <Label className="text-base font-medium">Offline Sync</Label>
              <p className="text-sm text-muted-foreground">
                Receipts captured offline will sync automatically when back online
              </p>
            </div>
            <div className="flex items-center gap-2">
              {isSyncPending ? (
                <div className="flex items-center gap-2 text-blue-600">
                  <div className="h-2 w-2 rounded-full bg-blue-600 animate-pulse" />
                  <span className="text-sm">Pending</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle2 className="h-4 w-4" />
                  <span className="text-sm">Active</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Help Text */}
        {permission === "denied" && (
          <div className="rounded-lg bg-yellow-50 p-4 border border-yellow-200">
            <p className="text-sm text-yellow-800">
              <strong>Permission denied:</strong> To enable notifications, please update your
              browser settings and allow notifications for this site.
            </p>
          </div>
        )}

        {permission === "default" && (
          <Button onClick={() => requestPermission()} variant="outline" className="w-full">
            Request Notification Permission
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
