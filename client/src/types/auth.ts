import type { UserRole } from "@/types";

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  permissions: string[];
  managedLocationIds?: string[];
  certifiedLocationIds?: string[];
  skills?: string[];
};

export type DemoAccount = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
};

export type SessionPayload = {
  sub: string;
  email: string;
  role: UserRole;
  name: string;
  exp?: number;
  iat?: number;
};

export type SessionResponse = {
  user: SessionUser;
};

export type LoginResponse = SessionResponse & {
  redirectTo: string;
};

export type DemoAccountsResponse = {
  accounts: DemoAccount[];
  sharedPassword: string;
};

export type UsersResponse = {
  viewer: SessionUser;
  users: SessionUser[];
};

export type ApiErrorResponse = {
  message: string;
  fieldErrors?: Record<string, string[] | undefined>;
};
