export const USER_ROLES = ["admin", "manager", "staff"] as const;

export type UserRole = (typeof USER_ROLES)[number];

export type NonEmptyArray<T> = [T, ...T[]];

export type StaffSkill =
  | "bartender"
  | "line cook"
  | "server"
  | "host"
  | (string & {});

export type DayOfWeek =
  | "monday"
  | "tuesday"
  | "wednesday"
  | "thursday"
  | "friday"
  | "saturday"
  | "sunday";

export type AvailabilityTimeRange = {
  startTime: string;
  endTime: string;
};

export type RecurringAvailabilityWindow = AvailabilityTimeRange & {
  dayOfWeek: DayOfWeek;
};

export type AvailabilityException = {
  date: string;
  isAvailable: boolean;
  windows: AvailabilityTimeRange[];
};

export type StaffAvailability = {
  recurring: RecurringAvailabilityWindow[];
  exceptions: AvailabilityException[];
};

export type BaseUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
};

export type AdminUser = BaseUser & {
  role: "admin";
  accessScope: "all_locations";
};

export type ManagerUser = BaseUser & {
  role: "manager";
  managedLocationIds: NonEmptyArray<string>;
};

export type StaffUser = BaseUser & {
  role: "staff";
  certifiedLocationIds: NonEmptyArray<string>;
  skills: NonEmptyArray<StaffSkill>;
  availability: StaffAvailability;
};

export type User = AdminUser | ManagerUser | StaffUser;
