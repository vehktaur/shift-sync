"use client";

import { useMemo, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { format, isValid, parseISO } from "date-fns";
import { Download, RotateCcw } from "lucide-react";

import { ActivityDataTable } from "@/components/activity/activity-data-table";
import {
  formatWeekRangeLabel,
  getAdjacentWeekStartDate,
  getCurrentWeekStartDate,
  getWeekEndDate,
} from "@/components/schedule/schedule.utils";
import { QueryErrorState } from "@/components/shared/query-error-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DatePicker } from "@/components/ui/date-picker";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useCurrentUser } from "@/hooks/use-auth";
import { useAuditExport, useShiftAuditHistory } from "@/hooks/use-audit";
import { useLocations, useSchedulingBoard } from "@/hooks/use-scheduling";
import type { AuditExportEntryResponse, ShiftAuditRecord } from "@/types/audit";

const formatSnapshot = (value?: Record<string, unknown>) =>
  value ? JSON.stringify(value, null, 2) : null;

const auditActionLabels: Record<ShiftAuditRecord["action"], string> = {
  "shift.created": "Shift created",
  "shift.updated": "Shift updated",
  "shift.published": "Shift published",
  "shift.unpublished": "Shift moved back to draft",
  "shift.assignee_added": "Staff assigned",
  "shift.assignee_removed": "Staff removed",
  "coverage.created": "Coverage request created",
  "coverage.approved": "Coverage request approved",
  "coverage.cancelled": "Coverage request cancelled",
};

const parseDateValue = (value: string) => {
  const parsed = parseISO(value);
  return isValid(parsed) ? parsed : undefined;
};

const downloadAuditExport = (entries: AuditExportEntryResponse[]) => {
  const csvRows = [
    [
      "Time",
      "Action",
      "Actor",
      "Shift",
      "Location",
      "Summary",
      "Before",
      "After",
    ].join(","),
    ...entries.map((entry) =>
      [
        entry.atUtc,
        entry.action,
        entry.actorName,
        entry.shiftTitle,
        entry.locationName,
        entry.summary,
        JSON.stringify(entry.before ?? {}),
        JSON.stringify(entry.after ?? {}),
      ]
        .map((value) => `"${String(value).replaceAll('"', '""')}"`)
        .join(","),
    ),
  ];

  const blob = new Blob([csvRows.join("\n")], {
    type: "text/csv;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `coastal-eats-audit-export-${Date.now()}.csv`;
  link.click();
  URL.revokeObjectURL(url);
};

const getAuditActionLabel = (action: ShiftAuditRecord["action"]) =>
  auditActionLabels[action];

const shiftHistoryColumns: ColumnDef<ShiftAuditRecord>[] = [
  {
    accessorKey: "atUtc",
    header: "Time",
    cell: ({ row }) => (
      <div className="text-sm">
        {new Date(row.original.atUtc).toLocaleString()}
      </div>
    ),
  },
  {
    accessorKey: "action",
    header: "Action",
    cell: ({ row }) => (
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge variant="outline" className="whitespace-nowrap">
            {getAuditActionLabel(row.original.action)}
          </Badge>
        </TooltipTrigger>
        <TooltipContent>{row.original.action}</TooltipContent>
      </Tooltip>
    ),
  },
  {
    accessorKey: "actorName",
    header: "Actor",
  },
  {
    accessorKey: "summary",
    header: "Summary",
    cell: ({ row }) => (
      <div className="space-y-2">
        <p className="text-sm">{row.original.summary}</p>
        {(row.original.before || row.original.after) && (
          <details className="text-xs text-muted-foreground">
            <summary className="cursor-pointer font-medium">
              View before and after details
            </summary>
            <div className="mt-2 grid gap-3 md:grid-cols-2">
              <pre className="overflow-x-auto border border-border/70 bg-muted/40 p-3">
                {formatSnapshot(row.original.before) ?? "No before snapshot"}
              </pre>
              <pre className="overflow-x-auto border border-border/70 bg-muted/40 p-3">
                {formatSnapshot(row.original.after) ?? "No after snapshot"}
              </pre>
            </div>
          </details>
        )}
      </div>
    ),
  },
];

const exportColumns: ColumnDef<AuditExportEntryResponse>[] = [
  {
    accessorKey: "atUtc",
    header: "Time",
    cell: ({ row }) => (
      <div className="text-sm">
        {new Date(row.original.atUtc).toLocaleString()}
      </div>
    ),
  },
  {
    accessorKey: "locationName",
    header: "Location",
  },
  {
    accessorKey: "shiftTitle",
    header: "Shift",
  },
  {
    accessorKey: "action",
    header: "Action",
    cell: ({ row }) => (
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge variant="outline" className="whitespace-nowrap">
            {getAuditActionLabel(row.original.action)}
          </Badge>
        </TooltipTrigger>
        <TooltipContent>{row.original.action}</TooltipContent>
      </Tooltip>
    ),
  },
  {
    accessorKey: "actorName",
    header: "Actor",
  },
  {
    accessorKey: "summary",
    header: "Summary",
  },
];

export function ActivityFeatureView() {
  const [weekStartDate, setWeekStartDate] = useState(getCurrentWeekStartDate);
  const [selectedShiftId, setSelectedShiftId] = useState<string>("");
  const [exportStartDate, setExportStartDate] = useState(weekStartDate);
  const [exportEndDate, setExportEndDate] = useState(
    getWeekEndDate(weekStartDate),
  );
  const [exportLocationId, setExportLocationId] = useState("all");
  const currentUserQuery = useCurrentUser();
  const scheduleBoardQuery = useSchedulingBoard(weekStartDate);
  const locationsQuery = useLocations();
  const currentUser = currentUserQuery.data?.user ?? null;
  const scheduleBoard = scheduleBoardQuery.data ?? null;
  const visibleShifts = scheduleBoard?.shifts ?? [];
  const activeShiftId = visibleShifts.some(
    (shift) => shift.id === selectedShiftId,
  )
    ? selectedShiftId
    : (visibleShifts[0]?.id ?? null);
  const activeShift =
    visibleShifts.find((shift) => shift.id === activeShiftId) ?? null;
  const shiftHistoryQuery = useShiftAuditHistory(activeShiftId);
  const isAdmin = currentUser?.role === "admin";
  const auditExportQuery = useAuditExport({
    startDate: exportStartDate,
    endDate: exportEndDate,
    locationId: exportLocationId === "all" ? undefined : exportLocationId,
    enabled: isAdmin && Boolean(exportStartDate && exportEndDate),
  });

  const exportLocations = locationsQuery.data ?? [];

  const headerDescription = useMemo(
    () => formatWeekRangeLabel(weekStartDate, getWeekEndDate(weekStartDate)),
    [weekStartDate],
  );

  if (currentUserQuery.isLoading || scheduleBoardQuery.isLoading || locationsQuery.isLoading) {
    return (
      <div className="space-y-5">
        <Card className="border-white/70 bg-white/85">
          <CardHeader>
            <Badge variant="outline" className="w-fit">
              Activity
            </Badge>
            <CardTitle>Loading audit activity</CardTitle>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (
    currentUserQuery.isError ||
    scheduleBoardQuery.isError ||
    locationsQuery.isError ||
    !currentUser ||
    !scheduleBoard
  ) {
    return (
      <QueryErrorState
        badgeLabel="Activity"
        title="Unable to load audit activity"
        description="The activity log could not be loaded right now."
        onRetry={() => {
          void Promise.all([
            currentUserQuery.refetch(),
            scheduleBoardQuery.refetch(),
            locationsQuery.refetch(),
          ]);
        }}
      />
    );
  }

  if (currentUser.role === "staff") {
    return (
      <QueryErrorState
        badgeLabel="Activity"
        title="Manager access required"
        description="Audit history is available to managers and admins only."
        onRetry={() => {}}
      />
    );
  }

  return (
    <div className="space-y-5">
      <Card className="border-white/70 bg-white/85">
        <CardHeader className="gap-4">
          <Badge variant="outline" className="w-fit">
            Activity
          </Badge>
          <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
            <div className="space-y-2">
              <CardTitle>Activity log</CardTitle>
              <p className="text-sm text-muted-foreground">
                {headerDescription}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                onClick={() =>
                  setWeekStartDate((value) =>
                    getAdjacentWeekStartDate(value, -1),
                  )
                }
              >
                Previous week
              </Button>
              <Button
                variant="outline"
                onClick={() => setWeekStartDate(getCurrentWeekStartDate())}
              >
                Current week
              </Button>
              <Button
                variant="outline"
                onClick={() =>
                  setWeekStartDate((value) =>
                    getAdjacentWeekStartDate(value, 1),
                  )
                }
              >
                Next week
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      <Card className="border-white/70 bg-white/85">
        <CardHeader>
          <Badge variant="warning" className="w-fit">
            Shift history
          </Badge>
          <CardTitle>History for a single shift</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-[minmax(0,20rem)_minmax(0,1fr)] items-end">
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="audit-shift">
                Shift
              </label>
              <Select
                value={activeShiftId ?? ""}
                onValueChange={setSelectedShiftId}
                disabled={!visibleShifts.length}
              >
                <SelectTrigger id="audit-shift" className="w-full">
                  <SelectValue placeholder="Choose a shift" />
                </SelectTrigger>
                <SelectContent>
                  {visibleShifts.map((shift) => (
                    <SelectItem key={shift.id} value={shift.id}>
                      {shift.title} • {shift.dateLabel}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {activeShift && (
              <div className="border border-border/70 bg-background/70 px-4 py-1.5 text-sm text-muted-foreground">
                {activeShift.location.name} • {activeShift.location.code} •{" "}
                {activeShift.dateLabel} • {activeShift.timeLabel}
              </div>
            )}
          </div>

          {shiftHistoryQuery.isError ? (
            <div className="border border-dashed border-border/70 bg-background/60 p-5 text-sm text-muted-foreground">
              Unable to load shift history for the selected shift.
            </div>
          ) : shiftHistoryQuery.isLoading ? (
            <div className="border border-dashed border-border/70 bg-background/60 p-5 text-sm text-muted-foreground">
              Loading shift history...
            </div>
          ) : (
            <ActivityDataTable
              columns={shiftHistoryColumns}
              data={shiftHistoryQuery.data?.entries ?? []}
              emptyMessage="No audit entries yet for this shift."
            />
          )}
        </CardContent>
      </Card>

      {isAdmin && (
        <Card className="border-white/70 bg-white/85">
          <CardHeader>
            <Badge variant="success" className="w-fit">
              Admin export
            </Badge>
            <CardTitle>Audit export</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 xl:grid-cols-[repeat(3,minmax(0,1fr))_auto_auto]">
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="export-start">
                  Start date
                </label>
                <DatePicker
                  id="export-start"
                  date={parseDateValue(exportStartDate)}
                  placeholder="Select start date"
                  dateFormat="EEE, MMM d, yyyy"
                  onSelect={(date) => {
                    if (!date) {
                      return;
                    }

                    setExportStartDate(format(date, "yyyy-MM-dd"));
                  }}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="export-end">
                  End date
                </label>
                <DatePicker
                  id="export-end"
                  date={parseDateValue(exportEndDate)}
                  placeholder="Select end date"
                  dateFormat="EEE, MMM d, yyyy"
                  disabled={(date) => {
                    const startDate = parseDateValue(exportStartDate);
                    return startDate ? date < startDate : false;
                  }}
                  onSelect={(date) => {
                    if (!date) {
                      return;
                    }

                    setExportEndDate(format(date, "yyyy-MM-dd"));
                  }}
                />
              </div>
              <div className="space-y-2">
                <label
                  className="text-sm font-medium"
                  htmlFor="export-location"
                >
                  Location
                </label>
                <Select
                  value={exportLocationId}
                  onValueChange={setExportLocationId}
                >
                  <SelectTrigger id="export-location" className="w-full">
                    <SelectValue placeholder="All locations" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All locations</SelectItem>
                    {exportLocations.map((location) => (
                      <SelectItem key={location.id} value={location.id}>
                        {location.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button
                variant="outline"
                className="self-end"
                onClick={() => {
                  setExportStartDate(weekStartDate);
                  setExportEndDate(getWeekEndDate(weekStartDate));
                }}
              >
                <RotateCcw className="size-4" />
                Use visible week
              </Button>
              <Button
                className="self-end"
                onClick={() => {
                  if (auditExportQuery.data) {
                    downloadAuditExport(auditExportQuery.data.entries);
                  }
                }}
                disabled={!auditExportQuery.data?.entries.length}
              >
                <Download className="size-4" />
                Download audit export
              </Button>
            </div>

            {auditExportQuery.isError ? (
              <div className="border border-dashed border-border/70 bg-background/60 p-5 text-sm text-muted-foreground">
                Unable to load export entries for the selected filters.
              </div>
            ) : auditExportQuery.isLoading ? (
              <div className="border border-dashed border-border/70 bg-background/60 p-5 text-sm text-muted-foreground">
                Loading export entries...
              </div>
            ) : (
              <ActivityDataTable
                columns={exportColumns}
                data={auditExportQuery.data?.entries ?? []}
                emptyMessage="No audit entries matched the selected filters."
              />
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
