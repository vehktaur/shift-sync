import type { Metadata } from "next";

import { DashboardView } from "@/components/dashboard-view";

export const metadata: Metadata = {
  title: "Overview",
  description:
    "Monitor overtime, compliance alerts, fairness, and location status across the current workforce planning week.",
  alternates: {
    canonical: "/",
  },
};

export default function Home() {
  return <DashboardView />;
}
