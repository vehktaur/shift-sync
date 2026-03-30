"use client";

import { useState } from "react";
import { toast } from "sonner";

import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useCoverageRequestOptions,
  useCreateDropRequest,
  useCreateSwapRequest,
} from "@/hooks/use-scheduling";
import { getApiErrorMessage } from "@/lib/api/client";
import type { ShiftResponse } from "@/types/scheduling";

type CoverageRequestDialogProps = {
  mode: "swap" | "drop" | null;
  open: boolean;
  shift: ShiftResponse | null;
  onOpenChange: (open: boolean) => void;
};

const dialogCopy = {
  swap: {
    title: "Request swap",
    description: "Choose a teammate who can take this shift, then send it for acceptance.",
    successMessage: "Swap request sent.",
  },
  drop: {
    title: "Request drop",
    description: "Open this shift for coverage. Eligible staff can claim it before manager approval.",
    successMessage: "Drop request opened.",
  },
} as const;

export function CoverageRequestDialog({
  mode,
  open,
  shift,
  onOpenChange,
}: CoverageRequestDialogProps) {
  const [counterpartUserId, setCounterpartUserId] = useState("");
  const [note, setNote] = useState("");
  const {
    data: options,
    error: optionsError,
    isPending: optionsPending,
    isError: optionsHasError,
  } = useCoverageRequestOptions(open ? shift?.id ?? null : null);
  const createSwapRequestMutation = useCreateSwapRequest();
  const createDropRequestMutation = useCreateDropRequest();
  const isLoadingOptions = optionsPending && Boolean(shift?.id);
  const isSubmitting =
    createSwapRequestMutation.isPending || createDropRequestMutation.isPending;
  const selectedCounterpartUserId =
    counterpartUserId || options?.eligibleSwapTargets[0]?.id || "";

  const handleSubmit = async () => {
    if (!mode || !shift) {
      return;
    }

    try {
      if (mode === "swap") {
        if (!selectedCounterpartUserId) {
          toast.error("Choose a teammate for the swap.");
          return;
        }

        await createSwapRequestMutation.mutateAsync({
          shiftId: shift.id,
          counterpartUserId: selectedCounterpartUserId,
          note: note.trim() || undefined,
        });
      } else {
        await createDropRequestMutation.mutateAsync({
          shiftId: shift.id,
          note: note.trim() || undefined,
        });
      }

      toast.success(dialogCopy[mode].successMessage);
      onOpenChange(false);
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Unable to submit coverage request."));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>{mode ? dialogCopy[mode].title : "Coverage request"}</DialogTitle>
          <DialogDescription>
            {mode ? dialogCopy[mode].description : "Choose how to request coverage."}
          </DialogDescription>
        </DialogHeader>

        {shift && (
          <div className="space-y-4">
            <div className="border border-border/70 bg-background/70 p-4">
              <h3 className="text-sm font-semibold">{shift.title}</h3>
              <p className="text-sm text-muted-foreground">
                {shift.dateLabel} • {shift.timeLabel}
              </p>
              <p className="text-sm text-muted-foreground">
                {shift.location.name} • {shift.location.code}
              </p>
            </div>

            {isLoadingOptions ? (
              <div className="space-y-3">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-24 w-full" />
              </div>
            ) : optionsHasError ? (
              <div className="border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
                {getApiErrorMessage(
                  optionsError,
                  "Unable to load coverage options for this shift.",
                )}
              </div>
            ) : (
              <>
                {mode === "swap" ? (
                  <div className="space-y-2">
                    <Label htmlFor="coverage-counterpart">Swap with</Label>
                    <Select
                      value={selectedCounterpartUserId}
                      onValueChange={setCounterpartUserId}
                    >
                      <SelectTrigger id="coverage-counterpart" className="w-full">
                        <SelectValue placeholder="Choose a teammate" />
                      </SelectTrigger>
                      <SelectContent>
                        {options?.eligibleSwapTargets.map((staff) => (
                          <SelectItem key={staff.id} value={staff.id}>
                            {staff.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {!options?.eligibleSwapTargets.length && (
                      <p className="text-sm text-muted-foreground">
                        No eligible teammates are available for this shift yet.
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Label>Eligible claimants</Label>
                    <div className="border border-border/70 bg-background/70 p-4 text-sm text-muted-foreground">
                      {options?.eligibleDropClaimants.length ? (
                        options.eligibleDropClaimants
                          .map((staff) => staff.name)
                          .join(", ")
                      ) : (
                        "No one is eligible yet, but you can still open the request."
                      )}
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="coverage-note">Note</Label>
                  <Input
                    id="coverage-note"
                    value={note}
                    onChange={(event) => setNote(event.target.value)}
                    placeholder="Add context for the manager or teammate"
                  />
                </div>
              </>
            )}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button
            loading={isSubmitting}
            onClick={() => {
              void handleSubmit();
            }}
            disabled={
              !mode ||
              !shift ||
              optionsHasError ||
              isLoadingOptions ||
              (mode === "swap" && !options?.eligibleSwapTargets.length)
            }
          >
            {mode === "swap" ? "Send swap request" : "Open drop request"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
