import type { Metadata } from "next";

import { CoverageView } from "@/components/coverage-view";

export const metadata: Metadata = {
  title: "Coverage Queue",
  description:
    "Track swap and drop requests, review pending actions, and keep schedule coverage moving without losing visibility.",
  alternates: {
    canonical: "/coverage",
  },
};

export default function CoveragePage() {
  return <CoverageView />;
}
