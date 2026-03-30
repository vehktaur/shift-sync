import type { Metadata } from "next";

import { ScheduleView } from "@/components/schedule-view";

export const metadata: Metadata = {
  title: "Schedule Board",
  description:
    "Create, edit, assign, and publish shifts for the selected week across every Coastal Eats location.",
  alternates: {
    canonical: "/schedule",
  },
};

export default function SchedulePage() {
  return <ScheduleView />;
}
