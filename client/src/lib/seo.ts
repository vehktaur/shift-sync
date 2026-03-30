import type { Metadata } from "next";

export const siteName = "ShiftSync";
export const siteDescription =
  "Manager-first workforce scheduling for Coastal Eats with shift planning, coverage management, overtime awareness, and team fairness insights.";
export const siteUrl = new URL("https://shift-sync-vehktaur.vercel.app/");

export const privateRouteRobots: Metadata["robots"] = {
  index: false,
  follow: false,
  nocache: true,
  googleBot: {
    index: false,
    follow: false,
    noimageindex: true,
    nosnippet: true,
  },
};
