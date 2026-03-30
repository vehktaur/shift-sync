"use client";

import { useQuery } from "@tanstack/react-query";

import {
  authQueryKeys,
  getCurrentUser,
  getDemoAccounts,
} from "@/lib/api/auth";

export const useSession = () =>
  useQuery({
    queryKey: authQueryKeys.currentUser,
    queryFn: getCurrentUser,
  });

export const useCurrentUser = useSession;

export const useDemoAccounts = () =>
  useQuery({
    queryKey: authQueryKeys.demoAccounts,
    queryFn: getDemoAccounts,
  });
