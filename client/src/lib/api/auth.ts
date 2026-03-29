import type { LoginFormValues } from "@/lib/schemas";
import { apiClient } from "@/lib/api/client";
import type {
  DemoAccountsResponse,
  LoginResponse,
  SessionResponse,
  UsersResponse,
} from "@/types/auth";

export const authQueryKeys = {
  currentUser: ["auth", "current-user"] as const,
  demoAccounts: ["auth", "demo-accounts"] as const,
  users: ["users"] as const,
};

export const login = async (payload: LoginFormValues) => {
  const { data } = await apiClient.post<LoginResponse>("/auth/login", payload);
  return data;
};

export const logout = async () => {
  const { data } = await apiClient.post<{ success: boolean }>("/auth/logout");
  return data;
};

export const getCurrentUser = async () => {
  const { data } = await apiClient.get<SessionResponse>("/auth/me");
  return data;
};

export const getDemoAccounts = async () => {
  const { data } =
    await apiClient.get<DemoAccountsResponse>("/auth/demo-accounts");
  return data;
};

export const getScopedUsers = async () => {
  const { data } = await apiClient.get<UsersResponse>("/users");
  return data;
};
