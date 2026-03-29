
import { CalendarRange, Clock3, PencilLine, Send, ShieldAlert, UserPlus, Users } from "lucide-react";

import { useScheduleWorkspace } from "@/components/schedule/schedule-workspace";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { ShiftResponse } from "@/types/scheduling";

import { shiftStateBadgeVariant } from "./schedule.utils";

type ShiftCardProps = {
  shift: ShiftResponse;
};

export function ShiftCard({ shift }: ShiftCardProps) {
  const {
    canManageBoard,
    openEditDialog,
    publishingShiftId,
    togglePublishShift,
    unpublishingShiftId,
  } = useScheduleWorkspace();
  const isPublishing = publishingShiftId === shift.id;
  const isUnpublishing = unpublishingShiftId === shift.id;

  return (
    <Card className="border-white/70 bg-white/85">
      <CardHeader className="gap-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={shiftStateBadgeVariant[shift.state]}>
                {shift.state}
              </Badge>
              <Badge variant={shift.published ? "success" : "neutral"}>
                {shift.published ? "Published" : "Draft"}
              </Badge>
            </div>
            <CardTitle>{shift.title}</CardTitle>
          </div>

          {canManageBoard ? (
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => openEditDialog(shift.id)}
                disabled={!shift.canEdit}
              >
                <PencilLine className="size-4" />
                Edit
              </Button>
              <Button
                size="sm"
                variant={shift.published ? "outline" : "default"}
                onClick={() => togglePublishShift(shift)}
                disabled={!shift.canEdit}
                loading={shift.published ? isUnpublishing : isPublishing}
              >
                <Send className="size-4" />
                {shift.published ? "Unpublish" : "Publish"}
              </Button>
            </div>
          ) : null}
        </div>
      </CardHeader>

      <CardContent className="space-y-5">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-3 border border-border/70 bg-background/70 p-4">
            <div className="flex items-center gap-2">
              <Clock3 className="size-4 text-primary" />
              <p className="text-sm font-semibold text-foreground">Time</p>
            </div>
            <p className="text-sm leading-6 text-muted-foreground">
              {shift.dateLabel} • {shift.timeLabel}
            </p>
          </div>

          <div className="space-y-3 border border-border/70 bg-background/70 p-4">
            <div className="flex items-center gap-2">
              <Users className="size-4 text-primary" />
              <p className="text-sm font-semibold text-foreground">Coverage</p>
            </div>
            <p className="text-sm leading-6 text-muted-foreground">
              {shift.assignees.length}/{shift.headcount} assigned • {shift.openSlots} open
            </p>
            <p className="text-xs leading-6 text-muted-foreground">
              {shift.requiredSkill}
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-sm font-semibold text-foreground">Assignees</p>
          {shift.assignees.length === 0 ? (
            <p className="text-sm leading-6 text-muted-foreground">
              No assignees yet.
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {shift.assignees.map((assignee) => (
                <div
                  key={assignee.id}
                  className="border border-border/70 bg-background/70 px-3 py-2"
                >
                  <p className="text-sm font-medium">{assignee.name}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-2">
          <p className="text-sm font-semibold text-foreground">Notes</p>
          <p className="text-sm leading-6 text-foreground/85">{shift.note}</p>
          {shift.explanation ? (
            <p className="text-sm leading-6 text-muted-foreground">
              {shift.explanation}
            </p>
          ) : null}
          {shift.projectedImpact ? (
            <p className="text-sm leading-6 text-muted-foreground">
              {shift.projectedImpact}
            </p>
          ) : null}
        </div>

        {shift.warningMessages.length ? (
          <div className="space-y-2">
            {shift.warningMessages.map((warning) => (
              <div
                key={warning}
                className="flex gap-2 border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-sm leading-6 text-amber-900"
              >
                <ShieldAlert className="mt-0.5 size-4 shrink-0" />
                <span>{warning}</span>
              </div>
            ))}
          </div>
        ) : null}

        {shift.suggestions?.length ? (
          <div className="space-y-2">
            <p className="text-sm font-semibold text-foreground">Suggested</p>
            <div className="flex flex-wrap gap-2">
              {shift.suggestions.map((staff) => (
                <div
                  key={staff.id}
                  className="border border-border/70 bg-background/70 px-3 py-2 text-sm"
                >
                  {staff.name}
                </div>
              ))}
            </div>
          </div>
        ) : null}

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border/70 pt-4">
          <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <CalendarRange className="size-4 text-primary" />
            Audit {shift.auditCount}
          </div>
          {canManageBoard ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => openEditDialog(shift.id)}
            >
              <UserPlus className="size-4" />
              Manage
            </Button>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
