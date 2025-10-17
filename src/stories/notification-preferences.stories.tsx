import { Meta, StoryObj } from "@storybook/react";
import { NotificationPreferences } from "@/components/ui/notification-preferences";

const meta: Meta<typeof NotificationPreferences> = {
  title: "UI/NotificationPreferences",
  component: NotificationPreferences,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof NotificationPreferences>;

export const Default: Story = {};

export const WithCustomPreferences: Story = {
  args: {
    preferences: [
      {
        id: "important_updates",
        label: "Important Updates",
        description: "Critical app updates and announcements",
        enabled: true,
      },
      {
        id: "new_features",
        label: "New Features",
        description: "Be the first to know about new features",
        enabled: false,
      },
      {
        id: "weekly_summary",
        label: "Weekly Summary",
        description: "Get a weekly summary of your activity",
        enabled: true,
      },
    ],
  },
};

export const WithCustomTitle: Story = {
  args: {
    title: "Communication Settings",
    description: "Control how and when we contact you",
  },
};
