import "server-only";

import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { getApiBaseUrl } from "@/lib/api/base-url";
import type { SessionResponse } from "@/types/auth";

export const getCurrentSession = cache(async () => {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore.toString();
  const response = await fetch(`${getApiBaseUrl()}/auth/me`, {
    method: "GET",
    cache: "no-store",
    headers: cookieHeader ? { cookie: cookieHeader } : undefined,
  });

  if (response.status === 401) {
    return null;
  }

  if (!response.ok) {
    throw new Error("Unable to resolve the current session.");
  }

  return (await response.json()) as SessionResponse;
});

export const requireCurrentSession = cache(async () => {
  const currentSession = await getCurrentSession();

  if (!currentSession) {
    redirect("/login");
  }

  return currentSession;
});
