import * as React from "react";
import { useState, useEffect } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "./card";
import { Switch } from "./switch";
import { Button } from "./button";
import { offlineStorage } from "@/lib/offline-storage";
import { logger } from "@/lib/logger";

export interface NotificationPreference {
  id: string;
  label: string;
  description?: string;
  enabled: boolean;
}

export interface NotificationPreferencesProps {
  title?: string;
  description?: string;
  preferences?: NotificationPreference[];
  onSave?: (preferences: NotificationPreference[]) => void;
  onCancel?: () => void;
  className?: string;
}

export function NotificationPreferences({
  title = "Notification Preferences",
  description = "Manage how you receive notifications from the app.",
  preferences: initialPreferences,
  onSave,
  onCancel,
  className,
}: NotificationPreferencesProps) {
  // Default preferences if none are provided
  const defaultPreferences: NotificationPreference[] = [
    {
      id: "receipt_processed",
      label: "Receipt Processing",
      description: "Get notified when your receipts are processed",
      enabled: true,
    },
    {
      id: "points_earned",
      label: "Points Earned",
      description: "Get notified when you earn points",
      enabled: true,
    },
    {
      id: "rewards_available",
      label: "Rewards Available",
      description: "Get notified when new rewards are available",
      enabled: true,
    },
    {
      id: "daily_challenges",
      label: "Daily Challenges",
      description: "Get notified about daily challenges",
      enabled: false,
    },
    {
      id: "promotional",
      label: "Promotional",
      description: "Get notified about promotions and special offers",
      enabled: false,
    },
  ];

  const [preferences, setPreferences] = useState<NotificationPreference[]>(
    initialPreferences || defaultPreferences,
  );
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Load saved preferences from offline storage on component mount
  useEffect(() => {
    const loadSavedPreferences = async () => {
      try {
        const savedPreferences = await offlineStorage.getPreference<
          NotificationPreference[]
        >("notification_preferences", initialPreferences || defaultPreferences);
        setPreferences(savedPreferences);
      } catch (error) {
        logger.error("Error loading notification preferences", error);
      }
    };

    loadSavedPreferences();
  }, [initialPreferences]);

  const handleTogglePreference = (id: string) => {
    setPreferences((currentPreferences) =>
      currentPreferences.map((pref) =>
        pref.id === id ? { ...pref, enabled: !pref.enabled } : pref,
      ),
    );
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveError(null);

    try {
      // Save to offline storage
      await offlineStorage.savePreference(
        "notification_preferences",
        preferences,
      );

      // Call onSave callback if provided
      if (onSave) {
        onSave(preferences);
      }

      logger.info("Notification preferences saved successfully");
    } catch (error) {
      logger.error("Error saving notification preferences", error);
      setSaveError("Failed to save preferences. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {preferences.map((preference) => (
          <div
            key={preference.id}
            className="flex items-center justify-between"
          >
            <div className="space-y-0.5">
              <div className="font-medium">{preference.label}</div>
              {preference.description && (
                <div className="text-sm text-muted-foreground">
                  {preference.description}
                </div>
              )}
            </div>
            <Switch
              checked={preference.enabled}
              onCheckedChange={() => handleTogglePreference(preference.id)}
              aria-label={`Toggle ${preference.label}`}
            />
          </div>
        ))}

        {saveError && (
          <div className="text-sm font-medium text-destructive mt-2">
            {saveError}
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-end gap-2">
        {onCancel && (
          <Button variant="outline" onClick={onCancel} disabled={isSaving}>
            Cancel
          </Button>
        )}
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? "Saving..." : "Save Preferences"}
        </Button>
      </CardFooter>
    </Card>
  );
}
