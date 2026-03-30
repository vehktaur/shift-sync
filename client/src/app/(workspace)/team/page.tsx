import type { Metadata } from "next";

import { TeamView } from "@/components/team-view";

export const metadata: Metadata = {
  title: "Team Balance",
  description:
    "Review assigned hours, target hours, and scheduling fairness across the team for the active planning window.",
  alternates: {
    canonical: "/team",
  },
};

export default function TeamPage() {
  return <TeamView />;
}
