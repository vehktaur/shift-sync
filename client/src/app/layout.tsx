import type { Metadata } from "next";
import { cookies } from "next/headers";
import { Geist, Geist_Mono, Outfit } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import AppProviders from "../components/app-providers";

const SIDEBAR_COOKIE_NAME = "sidebar_state";

const outfit = Outfit({ subsets: ["latin"], variable: "--font-sans" });

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

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
    <html
      lang="en"
      className={cn(
        "h-full",
        "antialiased",
        geistSans.variable,
        geistMono.variable,
        "font-sans",
        outfit.variable,
      )}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground size-full">
        <AppProviders defaultSidebarOpen={defaultSidebarOpen}>
          {children}
        </AppProviders>
      </body>
    </html>
  );
}
