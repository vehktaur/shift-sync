"use client";

import { useQuery } from "@tanstack/react-query";

import { authQueryKeys, getCurrentUser } from "@/lib/api/auth";

export const useCurrentUser = () =>
  useQuery({
    queryKey: authQueryKeys.currentUser,
    queryFn: getCurrentUser,
  });
