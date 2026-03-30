"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { usePathname, useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, Sparkles, X } from "lucide-react";
import { useShallow } from "zustand/react/shallow";

import { useSession } from "@/hooks/use-auth";
import { useSchedulingBoard } from "@/hooks/use-scheduling";
import { useScheduleUiStore } from "@/stores/schedule-ui-store";
import { useWorkspaceStore } from "@/stores/workspace-store";
import type { UserRole } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useSidebar } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

type TourPlacement = "top" | "right" | "bottom" | "left" | "center";

type TourStep = {
  id: string;
  title: string;
  description: string;
  route?: string;
  selector?: string;
  placement?: TourPlacement;
  spotlightPadding?: number;
  action?: "close-composer" | "open-create-shift" | "open-first-shift";
};

type SpotlightRect = {
  top: number;
  right: number;
  bottom: number;
  left: number;
  width: number;
  height: number;
};

type TourStorageValue = {
  version: string;
  completedRoles: Partial<Record<UserRole, true>>;
};

const TOUR_STORAGE_KEY = "shift-sync:workspace-tour";
const TOUR_VERSION = "2026-03-30";
const VIEWPORT_GUTTER = 16;
const STEP_GAP = 18;

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

const readStoredStatus = () => {
  const rawValue = window.localStorage.getItem(TOUR_STORAGE_KEY);

  if (!rawValue) {
    return null;
  }

  try {
    const parsed = JSON.parse(rawValue) as TourStorageValue;
    return parsed.version === TOUR_VERSION ? parsed : null;
  } catch {
    return null;
  }
};

const hasCompletedTourForRole = (
  value: TourStorageValue | null,
  role: UserRole | null,
) => {
  if (!value || !role || !value.completedRoles) {
    return false;
  }

  return value.completedRoles[role] === true;
};

const buildSpotlightRect = (
  target: HTMLElement,
  padding: number,
): SpotlightRect | null => {
  const rect = target.getBoundingClientRect();

  if (rect.width === 0 || rect.height === 0) {
    return null;
  }

  const left = clamp(
    rect.left - padding,
    8,
    window.innerWidth - 8,
  );
  const right = clamp(
    rect.right + padding,
    8,
    window.innerWidth - 8,
  );
  const top = clamp(
    rect.top - padding,
    8,
    window.innerHeight - 8,
  );
  const bottom = clamp(
    rect.bottom + padding,
    8,
    window.innerHeight - 8,
  );

  return {
    top,
    right,
    bottom,
    left,
    width: Math.max(right - left, 0),
    height: Math.max(bottom - top, 0),
  };
};

const placementFallbacks: Record<TourPlacement, TourPlacement[]> = {
  bottom: ["bottom", "top", "right", "left", "center"],
  center: ["center"],
  left: ["left", "right", "bottom", "top", "center"],
  right: ["right", "left", "bottom", "top", "center"],
  top: ["top", "bottom", "right", "left", "center"],
};

// Guided workspace tour that is aware of role-based steps, route changes, and
// live UI state like the sidebar or schedule composer.
export function WorkspaceTour() {
  const router = useRouter();
  const pathname = usePathname();
  const { isMobile, open, openMobile, setOpen, setOpenMobile } = useSidebar();
  const { data: session, isPending: sessionPending } = useSession();
  const weekStartDate = useWorkspaceStore((state) => state.weekStartDate);
  const [openCreateDialog, openEditDialog, closeComposer] = useScheduleUiStore(
    useShallow((state) => [
      state.openCreateDialog,
      state.openEditDialog,
      state.closeComposer,
    ]),
  );
  const {
    data: scheduleBoard,
    isPending: scheduleBoardPending,
    isFetching: scheduleBoardFetching,
  } = useSchedulingBoard(weekStartDate);
  const cardRef = useRef<HTMLDivElement | null>(null);
  const routedStepRef = useRef<string | null>(null);
  const scrolledStepRef = useRef<string | null>(null);
  const initializedRoleRef = useRef<UserRole | null>(null);
  const [active, setActive] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [hasSeenTour, setHasSeenTour] = useState(false);
  const [spotlightRect, setSpotlightRect] = useState<SpotlightRect | null>(null);
  const [cardPosition, setCardPosition] = useState({
    left: VIEWPORT_GUTTER,
    top: VIEWPORT_GUTTER,
    placement: "center" as TourPlacement,
  });

  const role = session?.user.role ?? null;
  const canManageBoard = role === "admin" || role === "manager";
  const firstShiftId = scheduleBoard?.shifts[0]?.id ?? null;
  const likelyHasExistingShift =
    Boolean(firstShiftId) || scheduleBoardPending || scheduleBoardFetching;
  const tourSteps = useMemo(() => {
    const baseSteps: TourStep[] = [
      {
        id: "welcome",
        title: "Welcome to ShiftSync",
        description:
          "This quick tour walks through the main areas your team uses to monitor staffing, adjust schedules, and stay ahead of coverage issues.",
        placement: "center",
      },
      {
        id: "navigation",
        title: "Everything starts in the workspace menu",
        description:
          "Use this sidebar to jump between the overview, weekly schedule, coverage queue, team balance, activity log, and alerts.",
        selector: '[data-tour="workspace-nav"]',
        placement: "right",
        spotlightPadding: 12,
      },
      {
        id: "overview",
        title: "The overview surfaces the week at a glance",
        description:
          "Start here to spot overtime risk, labor alerts, fairness signals, and which locations are active before you make schedule changes.",
        route: "/",
        selector: '[data-tour="dashboard-overview"]',
        placement: "bottom",
        spotlightPadding: 12,
      },
      {
        id: "schedule-header",
        title: "The schedule board is your command center",
        description:
          "Move between weeks, jump to coverage, and review the current planning window before you make any changes.",
        route: "/schedule",
        selector: '[data-tour="schedule-header"]',
        placement: "bottom",
        spotlightPadding: 12,
        action: "close-composer",
      },
    ];

    if (canManageBoard) {
      baseSteps.push(
        {
          id: "create-shift",
          title: "Create a new shift from here",
          description:
            "Managers can open the composer from the schedule header whenever a new role, location, or time block needs staffing.",
          route: "/schedule",
          selector: '[data-tour="create-shift-button"]',
          placement: "left",
          spotlightPadding: 12,
          action: "close-composer",
        },
        {
          id: "shift-form",
          title: "Enter the shift details first",
          description:
            "Choose the location, set the local start and end times, pick the required skill, and set the headcount before saving.",
          route: "/schedule",
          selector: '[data-tour="shift-form-panel"]',
          placement: "right",
          spotlightPadding: 12,
          action: "open-create-shift",
        },
      );

      if (likelyHasExistingShift) {
        baseSteps.push(
          {
            id: "manage-shift-card",
            title: "Existing shifts are managed from these cards",
            description:
              "Each card shows coverage, warnings, audit activity, and quick actions so you can spot issues before opening a shift.",
            route: "/schedule",
            selector: '[data-tour="shift-card"]',
            placement: "top",
            spotlightPadding: 12,
            action: "close-composer",
          },
          {
            id: "shift-assignments",
            title: "Assign or remove staff in one place",
            description:
              "After opening a saved shift, the assignment panel shows the current crew, eligible staff, projected hours, and override guidance when rules need manager review.",
            route: "/schedule",
            selector: '[data-tour="shift-assignment-panel"]',
            placement: "left",
            spotlightPadding: 12,
            action: "open-first-shift",
          },
          {
            id: "shift-publish",
            title: "Publish when the shift is ready",
            description:
              "Use the publish control after details and staffing look right. You can also move a shift back to draft if more changes are needed.",
            route: "/schedule",
            selector: '[data-tour="shift-publish-button"]',
            placement: "top",
            spotlightPadding: 12,
            action: "open-first-shift",
          },
        );
      }
    }

    baseSteps.push(
      {
        id: "schedule-toolbar",
        title: "Filters keep the weekly board manageable",
        description:
          "Use these controls to narrow the board by location or shift state. Managers can also publish or move the week back to draft here.",
        route: "/schedule",
        selector: '[data-tour="schedule-toolbar"]',
        placement: "bottom",
        spotlightPadding: 12,
        action: "close-composer",
      },
      {
        id: "coverage-queue",
        title: "Coverage requests stay in one queue",
        description:
          "Track swaps and drops here, see what still needs action, and keep the team moving without losing visibility.",
        route: "/coverage",
        selector: '[data-tour="coverage-queue"]',
        placement: "left",
        spotlightPadding: 12,
      },
      {
        id: "team-balance",
        title: "Team balance makes fairness visible",
        description:
          "Review assigned hours versus targets to catch under-scheduled or overloaded staff before the week gets locked in.",
        route: "/team",
        selector: '[data-tour="team-distribution"]',
        placement: "right",
        spotlightPadding: 12,
      },
      {
        id: "notifications",
        title: "Alerts keep everyone aligned",
        description:
          "The notification center collects schedule updates, coverage changes, and overtime warnings so nothing important gets buried.",
        route: "/notifications",
        selector: '[data-tour="notifications-center"]',
        placement: "bottom",
        spotlightPadding: 12,
      },
    );

    return baseSteps;
  }, [canManageBoard, likelyHasExistingShift]);
  const safeStepIndex = Math.min(currentStepIndex, Math.max(tourSteps.length - 1, 0));
  const currentStep = tourSteps[safeStepIndex]!;
  const isBrowser = typeof window !== "undefined";
  const displayedSpotlightRect =
    currentStep.route && pathname !== currentStep.route ? null : spotlightRect;
  const waitingForTarget =
    active &&
    Boolean(currentStep.selector) &&
    (!currentStep.route || pathname === currentStep.route) &&
    !displayedSpotlightRect;

  const totalSteps = tourSteps.length;
  const isLastStep = safeStepIndex === totalSteps - 1;

  const persistCompletionForRole = useCallback((completedRole: UserRole | null) => {
    if (!completedRole) {
      return;
    }

    const currentValue = readStoredStatus();
    const nextValue: TourStorageValue = {
      version: TOUR_VERSION,
      completedRoles: {
        ...currentValue?.completedRoles,
        [completedRole]: true,
      },
    };

    window.localStorage.setItem(
      TOUR_STORAGE_KEY,
      JSON.stringify(nextValue),
    );
    setHasSeenTour(true);
  }, []);

  const closeTour = useCallback((status: "completed" | "dismissed") => {
    if (status === "completed") {
      persistCompletionForRole(role);
    }

    if (status === "dismissed") {
      setHasSeenTour(hasCompletedTourForRole(readStoredStatus(), role));
    }

    setActive(false);
    setSpotlightRect(null);
    closeComposer();
  }, [closeComposer, persistCompletionForRole, role]);

  const startTour = useCallback(() => {
    routedStepRef.current = null;
    scrolledStepRef.current = null;
    setCurrentStepIndex(0);
    setActive(true);
    closeComposer();
  }, [closeComposer]);

  const goToStep = useCallback((nextIndex: number) => {
    routedStepRef.current = null;
    scrolledStepRef.current = null;
    setCurrentStepIndex(nextIndex);
  }, []);

  useEffect(() => {
    if (sessionPending || !role) {
      return;
    }

    if (initializedRoleRef.current === role) {
      return;
    }

    initializedRoleRef.current = role;
    const storedStatus = readStoredStatus();
    const completedForRole = hasCompletedTourForRole(storedStatus, role);
    const syncStoredStatusTimer = window.setTimeout(() => {
      setHasSeenTour(completedForRole);
    }, 0);

    if (completedForRole) {
      return () => window.clearTimeout(syncStoredStatusTimer);
    }

    const timer = window.setTimeout(() => {
      startTour();
    }, 700);

    return () => {
      window.clearTimeout(syncStoredStatusTimer);
      window.clearTimeout(timer);
    };
  }, [role, sessionPending, startTour]);

  useEffect(() => {
    if (!active) {
      return;
    }

    const stepKey = `${currentStep.id}:${pathname}`;

    if (currentStep.id === "navigation") {
      if (isMobile) {
        setOpenMobile(true);
      } else if (!open) {
        setOpen(true);
      }
    } else if (isMobile && openMobile) {
      setOpenMobile(false);
    }

    if (currentStep.route !== "/schedule" || currentStep.action === "close-composer") {
      closeComposer();
    } else if (currentStep.action === "open-create-shift") {
      openCreateDialog();
    } else if (currentStep.action === "open-first-shift" && firstShiftId) {
      openEditDialog(firstShiftId);
    }

    if (currentStep.route && pathname !== currentStep.route) {
      const routeKey = `${currentStep.id}:${currentStep.route}`;

      if (routedStepRef.current !== routeKey) {
        routedStepRef.current = routeKey;
        router.push(currentStep.route);
      }

      return;
    }

    routedStepRef.current = null;

    const syncSpotlight = () => {
      if (!currentStep.selector) {
        setSpotlightRect(null);
        return;
      }

      const target = document.querySelector<HTMLElement>(currentStep.selector);

      if (!target) {
        setSpotlightRect(null);
        return;
      }

      if (scrolledStepRef.current !== stepKey) {
        target.scrollIntoView({
          behavior: "smooth",
          block: "center",
          inline: "nearest",
        });
        scrolledStepRef.current = stepKey;
      }

      setSpotlightRect(
        buildSpotlightRect(target, currentStep.spotlightPadding ?? 10),
      );
    };

    syncSpotlight();

    const intervalId = window.setInterval(syncSpotlight, 250);
    window.addEventListener("resize", syncSpotlight);
    window.addEventListener("scroll", syncSpotlight, true);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener("resize", syncSpotlight);
      window.removeEventListener("scroll", syncSpotlight, true);
    };
  }, [
    active,
    currentStep,
    isMobile,
    open,
    openMobile,
    openCreateDialog,
    openEditDialog,
    pathname,
    router,
    setOpen,
    setOpenMobile,
    closeComposer,
    firstShiftId,
  ]);

  useEffect(() => {
    if (!active) {
      return;
    }

    const updateCardPosition = () => {
      const card = cardRef.current;

      if (!card) {
        return;
      }

      const width = card.offsetWidth;
      const height = card.offsetHeight;
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const preferredPlacement = currentStep.placement ?? "bottom";
      const attempts = placementFallbacks[preferredPlacement];

      const centerPosition = {
        left: clamp(
          (viewportWidth - width) / 2,
          VIEWPORT_GUTTER,
          viewportWidth - width - VIEWPORT_GUTTER,
        ),
        top: clamp(
          (viewportHeight - height) / 2,
          VIEWPORT_GUTTER,
          viewportHeight - height - VIEWPORT_GUTTER,
        ),
        placement: "center" as TourPlacement,
      };

      if (!displayedSpotlightRect) {
        setCardPosition(centerPosition);
        return;
      }

      for (const placement of attempts) {
        if (placement === "center") {
          continue;
        }

        const centeredLeft = clamp(
          displayedSpotlightRect.left + displayedSpotlightRect.width / 2 - width / 2,
          VIEWPORT_GUTTER,
          viewportWidth - width - VIEWPORT_GUTTER,
        );
        const centeredTop = clamp(
          displayedSpotlightRect.top + displayedSpotlightRect.height / 2 - height / 2,
          VIEWPORT_GUTTER,
          viewportHeight - height - VIEWPORT_GUTTER,
        );

        const position =
          placement === "bottom"
            ? {
                left: centeredLeft,
                top: displayedSpotlightRect.bottom + STEP_GAP,
              }
            : placement === "top"
              ? {
                  left: centeredLeft,
                  top: displayedSpotlightRect.top - height - STEP_GAP,
                }
              : placement === "left"
                ? {
                    left: displayedSpotlightRect.left - width - STEP_GAP,
                    top: centeredTop,
                  }
                : {
                    left: displayedSpotlightRect.right + STEP_GAP,
                    top: centeredTop,
                  };

        const fitsHorizontally =
          position.left >= VIEWPORT_GUTTER &&
          position.left + width <= viewportWidth - VIEWPORT_GUTTER;
        const fitsVertically =
          position.top >= VIEWPORT_GUTTER &&
          position.top + height <= viewportHeight - VIEWPORT_GUTTER;

        if (fitsHorizontally && fitsVertically) {
          setCardPosition({ ...position, placement });
          return;
        }
      }

      setCardPosition(centerPosition);
    };

    updateCardPosition();

    const resizeObserver = new ResizeObserver(() => {
      updateCardPosition();
    });

    if (cardRef.current) {
      resizeObserver.observe(cardRef.current);
    }

    window.addEventListener("resize", updateCardPosition);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", updateCardPosition);
    };
  }, [active, currentStep, displayedSpotlightRect]);

  const cardStyles = useMemo(
    () => ({
      left: `${cardPosition.left}px`,
      top: `${cardPosition.top}px`,
    }),
    [cardPosition.left, cardPosition.top],
  );

  return (
    <>
      <Button
        variant={hasSeenTour ? "outline" : "default"}
        size="sm"
        onClick={startTour}
      >
        <Sparkles className="size-4" />
        {hasSeenTour ? "Restart tour" : "Take tour"}
      </Button>

      {isBrowser &&
        active &&
        createPortal(
          <div className="fixed inset-0 z-[90]">
            {displayedSpotlightRect ? (
              <>
                <div
                  className="absolute inset-x-0 top-0 bg-slate-950/48"
                  style={{ height: displayedSpotlightRect.top }}
                />
                <div
                  className="absolute left-0 bg-slate-950/48"
                  style={{
                    top: displayedSpotlightRect.top,
                    width: displayedSpotlightRect.left,
                    height: displayedSpotlightRect.height,
                  }}
                />
                <div
                  className="absolute right-0 bg-slate-950/48"
                  style={{
                    top: displayedSpotlightRect.top,
                    width: Math.max(window.innerWidth - displayedSpotlightRect.right, 0),
                    height: displayedSpotlightRect.height,
                  }}
                />
                <div
                  className="absolute inset-x-0 bottom-0 bg-slate-950/48"
                  style={{ top: displayedSpotlightRect.bottom }}
                />
                <div
                  className="pointer-events-none absolute rounded-xl border border-primary/55 shadow-[0_0_0_1px_rgba(15,23,42,0.08),0_0_0_9999px_rgba(255,255,255,0.02)] transition-all duration-200"
                  style={{
                    height: displayedSpotlightRect.height,
                    left: displayedSpotlightRect.left,
                    top: displayedSpotlightRect.top,
                    width: displayedSpotlightRect.width,
                  }}
                />
              </>
            ) : (
              <div className="absolute inset-0 bg-slate-950/56" />
            )}

            <div
              ref={cardRef}
              className={cn(
                "fixed z-[91] w-[min(22rem,calc(100vw-2rem))] pointer-events-auto transition-[top,left] duration-200",
                cardPosition.placement === "center" && "max-w-md",
              )}
              style={cardStyles}
            >
              <Card className="border-white/70 bg-white/96 shadow-[0_2rem_4rem_-2rem_rgba(15,23,42,0.55)] backdrop-blur">
                <CardHeader className="gap-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-3">
                      <Badge variant="secondary" className="w-fit">
                        Guided tour
                      </Badge>
                      <div className="space-y-2">
                        <CardTitle className="text-xl">{currentStep.title}</CardTitle>
                        <CardDescription className="text-sm leading-6 text-muted-foreground">
                          {currentStep.description}
                        </CardDescription>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => closeTour("dismissed")}
                      aria-label="Close tour"
                    >
                      <X className="size-4" />
                    </Button>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-xs font-semibold tracking-[0.18em] text-muted-foreground uppercase">
                      Step {safeStepIndex + 1} of {totalSteps}
                    </p>
                    {waitingForTarget && (
                      <p className="text-xs text-muted-foreground">
                        Waiting for this section to finish loading...
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {tourSteps.map((step, index) => (
                      <span
                        key={step.id}
                        className={cn(
                          "h-1.5 flex-1 bg-border/70 transition-colors",
                          index <= safeStepIndex && "bg-primary/70",
                        )}
                      />
                    ))}
                  </div>

                  <div className="flex items-center justify-between gap-3">
                    <Button
                      variant="ghost"
                      onClick={() => {
                        if (safeStepIndex === 0) {
                          return;
                        }

                        goToStep(safeStepIndex - 1);
                      }}
                      disabled={safeStepIndex === 0}
                    >
                      <ChevronLeft className="size-4" />
                      Back
                    </Button>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        onClick={() => closeTour("dismissed")}
                      >
                        Skip
                      </Button>
                      <Button
                        onClick={() => {
                          if (isLastStep) {
                            closeTour("completed");
                          return;
                        }

                          goToStep(safeStepIndex + 1);
                        }}
                      >
                        {isLastStep ? "Finish" : "Next"}
                        {!isLastStep && <ChevronRight className="size-4" />}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
