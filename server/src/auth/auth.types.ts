import type { Request } from 'express';

export const USER_ROLES = ['admin', 'manager', 'staff'] as const;

export type UserRole = (typeof USER_ROLES)[number];

type NonEmptyArray<T> = [T, ...T[]];

type StaffSkill = 'bartender' | 'line cook' | 'server' | 'host' | (string & {});

type DayOfWeek =
  | 'monday'
  | 'tuesday'
  | 'wednesday'
  | 'thursday'
  | 'friday'
  | 'saturday'
  | 'sunday';

type AvailabilityTimeRange = {
  startTime: string;
  endTime: string;
};

type RecurringAvailabilityWindow = AvailabilityTimeRange & {
  dayOfWeek: DayOfWeek;
};

type AvailabilityException = {
  date: string;
  isAvailable: boolean;
  windows: AvailabilityTimeRange[];
};

type StaffAvailability = {
  recurring: RecurringAvailabilityWindow[];
  exceptions: AvailabilityException[];
};

type BaseUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
};

type AdminUser = BaseUser & {
  role: 'admin';
  accessScope: 'all_locations';
};

type ManagerUser = BaseUser & {
  role: 'manager';
  managedLocationIds: NonEmptyArray<string>;
};

type StaffUser = BaseUser & {
  role: 'staff';
  certifiedLocationIds: NonEmptyArray<string>;
  skills: NonEmptyArray<StaffSkill>;
  availability: StaffAvailability;
};

export type User = AdminUser | ManagerUser | StaffUser;

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

export type SessionTokenPayload = {
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

export type LoginRequestBody = {
  email?: unknown;
  password?: unknown;
};

export type AuthenticatedRequest = Request & {
  user?: SessionUser;
};
