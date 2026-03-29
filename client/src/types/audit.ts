import type { ScheduleLocationResponse } from "@/types/scheduling";

export type ShiftAuditRecord = {
  id: string;
  action:
    | "shift.created"
    | "shift.updated"
    | "shift.published"
    | "shift.unpublished"
    | "shift.assignee_added"
    | "shift.assignee_removed"
    | "coverage.created"
    | "coverage.approved"
    | "coverage.cancelled";
  actorUserId: string;
  actorName: string;
  atUtc: string;
  summary: string;
  before?: Record<string, unknown>;
  after?: Record<string, unknown>;
};

export type ShiftAuditHistoryResponse = {
  shiftId: string;
  shiftTitle: string;
  location: ScheduleLocationResponse;
  entries: ShiftAuditRecord[];
};

export type AuditExportEntryResponse = ShiftAuditRecord & {
  shiftId: string;
  shiftTitle: string;
  locationId: string;
  locationName: string;
};

export type AuditExportResponse = {
  filters: {
    startDate: string;
    endDate: string;
    locationId?: string;
  };
  entries: AuditExportEntryResponse[];
};
