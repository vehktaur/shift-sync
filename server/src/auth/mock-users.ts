import { DEMO_PASSWORD } from './auth.constants';
import type { DemoAccount, SessionUser, User, UserRole } from './auth.types';

const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  admin: [
    'view_all_locations',
    'manage_all_users',
    'publish_any_schedule',
    'export_audit_logs',
  ],
  manager: [
    'view_assigned_locations',
    'manage_shifts',
    'publish_schedule',
    'approve_swaps',
  ],
  staff: [
    'view_assigned_shifts',
    'manage_availability',
    'request_swaps',
    'pick_up_eligible_shifts',
  ],
};

const nonEmpty = <T>(...items: [T, ...T[]]) => items;

const recurringAvailability = (
  days: [
    (
      | 'monday'
      | 'tuesday'
      | 'wednesday'
      | 'thursday'
      | 'friday'
      | 'saturday'
      | 'sunday'
    ),
    ...(
      | 'monday'
      | 'tuesday'
      | 'wednesday'
      | 'thursday'
      | 'friday'
      | 'saturday'
      | 'sunday'
    )[],
  ],
  startTime: string,
  endTime: string,
) => ({
  recurring: days.map((dayOfWeek) => ({ dayOfWeek, startTime, endTime })),
  exceptions: [],
});

const seededUsers: User[] = [
  {
    id: 'usr_admin_ava',
    name: 'Ava Thompson',
    email: 'ava.admin@coastaleats.com',
    role: 'admin',
    accessScope: 'all_locations',
  },
  {
    id: 'usr_mgr_lauren',
    name: 'Lauren Price',
    email: 'lauren.manager@coastaleats.com',
    role: 'manager',
    managedLocationIds: nonEmpty('harbor-point-grill', 'boardwalk-kitchen'),
  },
  {
    id: 'usr_mgr_maya',
    name: 'Maya Torres',
    email: 'maya.manager@coastaleats.com',
    role: 'manager',
    managedLocationIds: nonEmpty('sunset-pier', 'tidehouse-cantina'),
  },
  {
    id: 'usr_staff_maria',
    name: 'Maria Gomez',
    email: 'maria.staff@coastaleats.com',
    role: 'staff',
    certifiedLocationIds: nonEmpty('harbor-point-grill', 'boardwalk-kitchen'),
    skills: nonEmpty('server', 'host'),
    availability: recurringAvailability(
      nonEmpty(
        'tuesday',
        'wednesday',
        'thursday',
        'friday',
        'saturday',
        'sunday',
      ),
      '10:00',
      '23:00',
    ),
  },
  {
    id: 'usr_staff_sarah',
    name: 'Sarah Chen',
    email: 'sarah.staff@coastaleats.com',
    role: 'staff',
    certifiedLocationIds: nonEmpty('sunset-pier', 'tidehouse-cantina'),
    skills: nonEmpty('bartender', 'server'),
    availability: recurringAvailability(
      nonEmpty('wednesday', 'thursday', 'friday', 'saturday', 'sunday'),
      '11:00',
      '02:00',
    ),
  },
  {
    id: 'usr_staff_john',
    name: 'John Rivera',
    email: 'john.staff@coastaleats.com',
    role: 'staff',
    certifiedLocationIds: nonEmpty('sunset-pier', 'tidehouse-cantina'),
    skills: nonEmpty('bartender', 'host'),
    availability: recurringAvailability(
      nonEmpty('thursday', 'friday', 'saturday', 'sunday'),
      '14:00',
      '02:00',
    ),
  },
  {
    id: 'usr_staff_devon',
    name: 'Devon Lee',
    email: 'devon.staff@coastaleats.com',
    role: 'staff',
    certifiedLocationIds: nonEmpty(
      'harbor-point-grill',
      'boardwalk-kitchen',
      'sunset-pier',
      'tidehouse-cantina',
    ),
    skills: nonEmpty('bartender', 'server', 'host'),
    availability: recurringAvailability(
      nonEmpty(
        'monday',
        'tuesday',
        'wednesday',
        'thursday',
        'friday',
        'saturday',
        'sunday',
      ),
      '09:00',
      '01:00',
    ),
  },
  {
    id: 'usr_staff_aisha',
    name: 'Aisha Bello',
    email: 'aisha.staff@coastaleats.com',
    role: 'staff',
    certifiedLocationIds: nonEmpty(
      'harbor-point-grill',
      'boardwalk-kitchen',
      'sunset-pier',
      'tidehouse-cantina',
    ),
    skills: nonEmpty('bartender', 'server', 'host'),
    availability: recurringAvailability(
      nonEmpty(
        'monday',
        'tuesday',
        'wednesday',
        'thursday',
        'friday',
        'saturday',
        'sunday',
      ),
      '10:00',
      '00:00',
    ),
  },
  {
    id: 'usr_staff_priya',
    name: 'Priya Nair',
    email: 'priya.staff@coastaleats.com',
    role: 'staff',
    certifiedLocationIds: nonEmpty('harbor-point-grill', 'boardwalk-kitchen'),
    skills: nonEmpty('host', 'server'),
    availability: recurringAvailability(
      nonEmpty('thursday', 'friday', 'saturday', 'sunday'),
      '09:00',
      '22:00',
    ),
  },
  {
    id: 'usr_staff_noah',
    name: 'Noah Kim',
    email: 'noah.staff@coastaleats.com',
    role: 'staff',
    certifiedLocationIds: nonEmpty('boardwalk-kitchen', 'sunset-pier'),
    skills: nonEmpty('host', 'server'),
    availability: recurringAvailability(
      nonEmpty(
        'tuesday',
        'wednesday',
        'thursday',
        'friday',
        'saturday',
        'sunday',
      ),
      '08:00',
      '18:00',
    ),
  },
  {
    id: 'usr_staff_jamal',
    name: 'Jamal Carter',
    email: 'jamal.staff@coastaleats.com',
    role: 'staff',
    certifiedLocationIds: nonEmpty('harbor-point-grill', 'boardwalk-kitchen'),
    skills: nonEmpty('line cook'),
    availability: recurringAvailability(
      nonEmpty('monday', 'tuesday', 'wednesday', 'thursday', 'friday'),
      '08:00',
      '22:00',
    ),
  },
  {
    id: 'usr_staff_olivia',
    name: 'Olivia Brooks',
    email: 'olivia.staff@coastaleats.com',
    role: 'staff',
    certifiedLocationIds: nonEmpty(
      'harbor-point-grill',
      'boardwalk-kitchen',
      'sunset-pier',
    ),
    skills: nonEmpty('line cook'),
    availability: recurringAvailability(
      nonEmpty(
        'monday',
        'tuesday',
        'wednesday',
        'thursday',
        'friday',
        'saturday',
      ),
      '08:00',
      '23:00',
    ),
  },
  {
    id: 'usr_staff_ethan',
    name: 'Ethan Cole',
    email: 'ethan.staff@coastaleats.com',
    role: 'staff',
    certifiedLocationIds: nonEmpty('harbor-point-grill', 'sunset-pier'),
    skills: nonEmpty('server'),
    availability: recurringAvailability(
      nonEmpty(
        'monday',
        'tuesday',
        'wednesday',
        'thursday',
        'friday',
        'saturday',
        'sunday',
      ),
      '09:00',
      '17:00',
    ),
  },
];

const usersByEmail = new Map(
  seededUsers.map((user) => [user.email.toLowerCase(), user] as const),
);

const usersById = new Map(seededUsers.map((user) => [user.id, user] as const));

export const toSessionUser = (user: User): SessionUser => {
  const baseUser = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    permissions: ROLE_PERMISSIONS[user.role],
  } satisfies SessionUser;

  if (user.role === 'manager') {
    return {
      ...baseUser,
      managedLocationIds: [...user.managedLocationIds],
    };
  }

  if (user.role === 'staff') {
    return {
      ...baseUser,
      certifiedLocationIds: [...user.certifiedLocationIds],
      skills: [...user.skills],
    };
  }

  return baseUser;
};

export const getDemoAccounts = (): DemoAccount[] =>
  seededUsers.map((user) => ({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  }));

export const getAllUsers = () => seededUsers.map((user) => user);

export const getUserById = (id: string) => usersById.get(id) ?? null;

export const authenticateSeededUser = (email: string, password: string) => {
  const user = usersByEmail.get(email.trim().toLowerCase()) ?? null;

  if (!user || password !== DEMO_PASSWORD) {
    return null;
  }

  return user;
};

export const getVisibleUsersForViewer = (viewer: User): SessionUser[] => {
  if (viewer.role === 'admin') {
    return seededUsers.map(toSessionUser);
  }

  if (viewer.role === 'manager') {
    const visibleUsers = seededUsers.filter((candidate) => {
      if (candidate.id === viewer.id) {
        return true;
      }

      if (candidate.role !== 'staff') {
        return false;
      }

      return candidate.certifiedLocationIds.some((locationId) =>
        viewer.managedLocationIds.includes(locationId),
      );
    });

    return visibleUsers.map(toSessionUser);
  }

  return [toSessionUser(viewer)];
};

export const getDefaultRedirectPath = () => '/';
