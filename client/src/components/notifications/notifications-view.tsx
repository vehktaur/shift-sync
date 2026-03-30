"use client";

import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotificationCenter,
  useNotificationPreferences,
  useUpdateNotificationPreferences,
} from "@/hooks/use-notifications";
import { QueryErrorState } from "@/components/shared/query-error-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { NotificationsSkeleton } from "./notifications-skeleton";

const preferenceLabels = [
  { key: "scheduleUpdates", label: "Schedule updates" },
  { key: "coverageUpdates", label: "Coverage updates" },
  { key: "overtimeWarnings", label: "Overtime warnings" },
  { key: "availabilityUpdates", label: "Availability changes" },
] as const;

export function NotificationsFeatureView() {
  const {
    data: center,
    isPending: centerPending,
    isError: centerError,
    refetch: refetchCenter,
  } = useNotificationCenter();
  const {
    data: preferences,
    isPending: preferencesPending,
    isError: preferencesError,
    refetch: refetchPreferences,
  } = useNotificationPreferences();
  const markReadMutation = useMarkNotificationRead();
  const markAllReadMutation = useMarkAllNotificationsRead();
  const updatePreferencesMutation = useUpdateNotificationPreferences();

  if (centerPending || preferencesPending) {
    return <NotificationsSkeleton />;
  }

  if (
    centerError ||
    preferencesError ||
    !center ||
    !preferences
  ) {
    return (
      <QueryErrorState
        badgeLabel="Alerts"
        title="Unable to load notifications"
        description="Notifications or preferences could not be loaded right now."
        onRetry={() => {
          void refetchCenter();
          void refetchPreferences();
        }}
      />
    );
  }

  return (
    <div className="space-y-5">
      <Card
        className="border-white/70 bg-white/85"
        data-tour="notifications-center"
      >
        <CardHeader className="sm:flex-row sm:items-start sm:justify-between">
          <div>
            <Badge variant="outline" className="w-fit">
              Alerts
            </Badge>
            <CardTitle className="mt-3">Notification center</CardTitle>
            <CardDescription>{center.unreadCount} unread</CardDescription>
          </div>
          <Button
            variant="outline"
            loading={markAllReadMutation.isPending}
            onClick={() => {
              markAllReadMutation.mutate();
            }}
          >
            Mark all read
          </Button>
        </CardHeader>
      </Card>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
        <Card className="border-white/70 bg-white/85">
          <CardHeader>
            <Badge variant="warning" className="w-fit">
              Inbox
            </Badge>
            <CardTitle>Recent activity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {center.notifications.length > 0 ? (
              center.notifications.map((notification) => (
                <div
                  key={notification.id}
                  className="border border-border/70 bg-background/70 p-5"
                >
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge
                          variant={notification.read ? "outline" : "warning"}
                        >
                          {notification.read ? "Read" : "Unread"}
                        </Badge>
                      </div>
                      <h3 className="text-lg font-semibold">{notification.title}</h3>
                      <p className="text-sm leading-6 text-muted-foreground">
                        {notification.body}
                      </p>
                    </div>

                    <div className="flex flex-col items-start gap-3 lg:items-end">
                      <p className="text-xs font-semibold tracking-[0.18em] text-muted-foreground uppercase">
                        {notification.createdAtLabel}
                      </p>
                      {!notification.read && (
                        <Button
                          variant="outline"
                          size="sm"
                          loading={
                            markReadMutation.isPending &&
                            markReadMutation.variables === notification.id
                          }
                          onClick={() => {
                            markReadMutation.mutate(notification.id);
                          }}
                        >
                          Mark read
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="border border-dashed border-border/70 bg-background/60 p-5 text-sm text-muted-foreground">
                No notifications yet.
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-white/70 bg-white/85">
          <CardHeader>
            <Badge variant="outline" className="w-fit">
              Preferences
            </Badge>
            <CardTitle>In-app alerts</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {preferenceLabels.map((preference) => {
              const enabled = preferences[preference.key];

              return (
                <div
                  key={preference.key}
                  className="flex items-center justify-between gap-3 border border-border/70 bg-background/70 p-4"
                >
                  <p className="font-medium">{preference.label}</p>
                  <Button
                    variant={enabled ? "default" : "outline"}
                    size="sm"
                    loading={
                      updatePreferencesMutation.isPending &&
                      Object.prototype.hasOwnProperty.call(
                        updatePreferencesMutation.variables ?? {},
                        preference.key,
                      )
                    }
                    onClick={() => {
                      updatePreferencesMutation.mutate({
                        [preference.key]: !enabled,
                      });
                    }}
                  >
                    {enabled ? "On" : "Off"}
                  </Button>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
