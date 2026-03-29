import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { LoginView } from "@/components/login-view";
import { getCurrentSession } from "@/lib/auth/dal";

export const metadata: Metadata = {
  title: "Login",
};

export default async function LoginPage() {
  const currentSession = await getCurrentSession();

  if (currentSession) {
    redirect("/");
  }

  return <LoginView />;
}
