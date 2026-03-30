import type { Metadata, Viewport } from "next";
import { cookies } from "next/headers";
import { Outfit } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import AppProviders from "../components/app-providers";
import {
  siteDescription,
  siteName,
  siteUrl,
} from "@/lib/seo";

const SIDEBAR_COOKIE_NAME = "sidebar_state";

const outfit = Outfit({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  metadataBase: siteUrl,
  applicationName: siteName,
  title: {
    default: "ShiftSync",
    template: "%s | ShiftSync",
  },
  description: siteDescription,
  alternates: {
    canonical: "/login",
  },
  icons: {
    icon: "/favicon.ico",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName,
    title: siteName,
    description: siteDescription,
    url: "/login",
  },
  twitter: {
    card: "summary_large_image",
    title: siteName,
    description: siteDescription,
  },
};

export const viewport: Viewport = {
  themeColor: "#428995",
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
