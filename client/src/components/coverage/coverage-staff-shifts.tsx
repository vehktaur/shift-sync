"use client";

import { ArrowRightLeft, CircleOff } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ShiftResponse } from "@/types/scheduling";

type CoverageStaffShiftsProps = {
  activeRequestSummaryByShiftId: Record<string, string>;
  shifts: ShiftResponse[];
  weekLabel: string;
  onRequestDrop: (shift: ShiftResponse) => void;
  onRequestSwap: (shift: ShiftResponse) => void;
};

export function CoverageStaffShifts({
  activeRequestSummaryByShiftId,
  shifts,
  weekLabel,
  onRequestDrop,
  onRequestSwap,
}: CoverageStaffShiftsProps) {
  return (
    <Card className="border-white/70 bg-white/85">
      <CardHeader>
        <CardTitle>My shifts</CardTitle>
        <p className="text-sm text-muted-foreground">{weekLabel}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        {shifts.length === 0 ? (
          <div className="border border-dashed border-border/70 bg-background/60 p-5 text-sm text-muted-foreground">
            No assigned shifts in this week.
          </div>
        ) : (
          shifts.map((shift) => {
            const activeRequestSummary = activeRequestSummaryByShiftId[shift.id];

            return (
              <div
                key={shift.id}
                className="space-y-4 border border-border/70 bg-background/70 p-4"
              >
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-sm font-semibold">{shift.title}</h3>
                    {Boolean(activeRequestSummary) && (
                      <Badge variant="outline">{activeRequestSummary}</Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {shift.dateLabel} • {shift.timeLabel}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {shift.location.name} • {shift.location.code}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onRequestSwap(shift)}
                    disabled={Boolean(activeRequestSummary)}
                  >
                    <ArrowRightLeft className="size-4" />
                    Request swap
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onRequestDrop(shift)}
                    disabled={Boolean(activeRequestSummary)}
                  >
                    <CircleOff className="size-4" />
                    Request drop
                  </Button>
                </div>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
