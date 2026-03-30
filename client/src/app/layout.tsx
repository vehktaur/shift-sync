import type { Metadata } from "next";
import { cookies } from "next/headers";
import { Outfit } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import AppProviders from "../components/app-providers";

const SIDEBAR_COOKIE_NAME = "sidebar_state";

const outfit = Outfit({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: {
    default: "ShiftSync",
    template: "%s | ShiftSync",
  },
  description:
    "Manager-first scheduling workspace for Coastal Eats with coverage, fairness, overtime, and timezone-aware shift planning.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const defaultSidebarOpen =
    cookieStore.get(SIDEBAR_COOKIE_NAME)?.value !== "false";

  return (
    <html lang="en" className={cn("h-full", "antialiased", outfit.variable)}>
      <body className="min-h-full flex flex-col bg-background text-foreground size-full">
        <AppProviders defaultSidebarOpen={defaultSidebarOpen}>
          {children}
        </AppProviders>
      </body>
    </html>
  );
}
