import type { Metadata } from "next";

import { NotificationsView } from "@/components/notifications-view";

export const metadata: Metadata = {
  title: "Notifications",
  description:
    "Manage in-app alert preferences and review unread schedule, coverage, and overtime updates.",
  alternates: {
    canonical: "/notifications",
  },
};

export default function NotificationsPage() {
  return <NotificationsView />;
}
