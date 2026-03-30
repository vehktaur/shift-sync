import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { LoginView } from "@/components/login-view";
import { getCurrentSession } from "@/lib/auth/dal";
import { siteDescription, siteName } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Login",
  description:
    "Sign in to ShiftSync to manage schedules, coverage requests, overtime risk, and staffing fairness for Coastal Eats.",
  alternates: {
    canonical: "/login",
  },
  openGraph: {
    title: `Login | ${siteName}`,
    description: siteDescription,
    url: "/login",
  },
  twitter: {
    title: `Login | ${siteName}`,
    description: siteDescription,
  },
};

export default async function LoginPage() {
  const currentSession = await getCurrentSession();

  if (currentSession) {
    redirect("/");
  }

  return <LoginView />;
}
