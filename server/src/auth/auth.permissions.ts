import type { UserRole } from './auth.types';

export const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
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
