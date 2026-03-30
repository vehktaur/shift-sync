import { useState } from "react";
import {
  CalendarRange,
  Clock3,
  PencilLine,
  Send,
  ShieldAlert,
  Trash2,
  UserPlus,
  Users,
} from "lucide-react";
import { toast } from "sonner";

import { useScheduleBoardData } from "@/components/schedule/use-schedule-board-data";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  useDeleteShift,
  usePublishShift,
  useUnpublishShift,
} from "@/hooks/use-scheduling";
import { getApiErrorMessage } from "@/lib/api/client";
import { useScheduleUiStore } from "@/stores/schedule-ui-store";
import type { ShiftResponse } from "@/types/scheduling";

import {
  shiftStateBadgeVariant,
  shiftStateDescriptions,
  shiftStateLabels,
} from "./schedule.utils";

type ShiftCardProps = {
  shift: ShiftResponse;
};

export function ShiftCard({ shift }: ShiftCardProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const openEditDialog = useScheduleUiStore((state) => state.openEditDialog);
  const {
    mutateAsync: deleteShift,
    isPending: deletingShift,
    variables: deletingShiftId,
  } = useDeleteShift();
  const {
    mutateAsync: publishShift,
    isPending: publishingShift,
    variables: publishingShiftId,
  } = usePublishShift();
  const {
    mutateAsync: unpublishShift,
    isPending: unpublishingShift,
    variables: unpublishingShiftId,
  } = useUnpublishShift();
  const { canManageBoard } = useScheduleBoardData();
  const isDeleting = deletingShift && deletingShiftId === shift.id;
  const isPublishing = publishingShift && publishingShiftId === shift.id;
  const isUnpublishing = unpublishingShift && unpublishingShiftId === shift.id;

  return (
    <Card className="border-white/70 bg-white/85" data-tour="shift-card">
      <CardHeader className="gap-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge variant={shiftStateBadgeVariant[shift.state]}>
                    {shiftStateLabels[shift.state]}
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>
                  {shiftStateDescriptions[shift.state]}
                </TooltipContent>
              </Tooltip>
              <Badge variant={shift.published ? "success" : "neutral"}>
                {shift.published ? "Published" : "Draft"}
              </Badge>
            </div>
            <CardTitle>{shift.title}</CardTitle>
          </div>

          {canManageBoard && (
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
                data-tour={!shift.published ? "shift-publish-button" : undefined}
                onClick={async () => {
                  try {
                    if (shift.published) {
                      await unpublishShift(shift.id);
                      toast.success(`${shift.title} moved to draft.`);
                      return;
                    }

                    await publishShift(shift.id);
                    toast.success(`${shift.title} published.`);
                  } catch (error) {
                    toast.error(
                      getApiErrorMessage(
                        error,
                        shift.published
                          ? "Unable to unpublish shift."
                          : "Unable to publish shift.",
                      ),
                    );
                  }
                }}
                disabled={!shift.canEdit}
                loading={shift.published ? isUnpublishing : isPublishing}
              >
                <Send className="size-4" />
                {shift.published ? "Unpublish" : "Publish"}
              </Button>
              <AlertDialog
                open={deleteDialogOpen}
                onOpenChange={setDeleteDialogOpen}
              >
                <AlertDialogTrigger asChild>
                  <Button
                    size="sm"
                    variant="destructive"
                    disabled={!shift.canEdit}
                  >
                    <Trash2 className="size-4" />
                    Delete
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete shift?</AlertDialogTitle>
                    <AlertDialogDescription>
                      {shift.published
                        ? `This will remove ${shift.title}, its assignments, and any related coverage requests. Assigned staff will be notified.`
                        : `This will remove ${shift.title} and any related coverage requests.`}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel disabled={isDeleting}>
                      Keep shift
                    </AlertDialogCancel>
                    <AlertDialogAction
                      disabled={isDeleting}
                      onClick={async (event) => {
                        event.preventDefault();

                        try {
                          await deleteShift(shift.id);
                          setDeleteDialogOpen(false);
                          toast.success(`${shift.title} deleted.`);
                        } catch (error) {
                          toast.error(
                            getApiErrorMessage(error, "Unable to delete shift."),
                          );
                        }
                      }}
                    >
                      {isDeleting ? "Deleting..." : "Delete shift"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        <div className="grid gap-3 md:grid-cols-2">
          <div className="space-y-2 border border-border/70 bg-background/70 px-2.5 py-2">
            <div className="flex items-center gap-2">
              <Clock3 className="size-4 text-primary" />
              <h3 className="text-sm font-semibold text-foreground">Time</h3>
            </div>
            <p className="text-sm leading-6 text-muted-foreground">
              {shift.dateLabel} • {shift.timeLabel}
            </p>
          </div>

          <div className="space-y-2 border border-border/70 bg-background/70 px-2.5 py-2">
            <div className="flex items-center gap-2">
              <Users className="size-4 text-primary" />
              <h3 className="text-sm font-semibold text-foreground">
                Coverage
              </h3>
            </div>
            <p className="text-sm leading-6 text-muted-foreground">
              {shift.assignees.length}/{shift.headcount} assigned •{" "}
              {shift.openSlots} open
            </p>
            <p className="text-xs leading-6 text-muted-foreground">
              Required skill: {shift.requiredSkill}
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-foreground">Assignees</h3>
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

        {shift.statusSummary && (
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-foreground">Status</h3>
            <p className="text-sm leading-6 text-foreground/85">
              {shift.statusSummary}
            </p>
          </div>
        )}

        {shift.warningMessages.length > 0 && (
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
        )}

        {shift.suggestions && shift.suggestions?.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-foreground">
              Suggested alternatives
            </h3>
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
        )}

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border/70 pt-4">
          <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <CalendarRange className="size-4 text-primary" />
            Audit history: {shift.auditCount} change
            {shift.auditCount === 1 ? "" : "s"}
          </div>
          {canManageBoard && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => openEditDialog(shift.id)}
            >
              <UserPlus className="size-4" />
              Manage
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
