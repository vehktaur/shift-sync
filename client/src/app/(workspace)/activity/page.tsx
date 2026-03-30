import type { Metadata } from "next";

import { ActivityView } from "@/components/activity-view";

export const metadata: Metadata = {
  title: "Activity Log",
  description:
    "Inspect shift history and audit exports for schedule changes, publishing events, and coverage activity.",
  alternates: {
    canonical: "/activity",
  },
};

export default function ActivityPage() {
  return <ActivityView />;
}
