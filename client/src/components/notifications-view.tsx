import { MailCheck, Settings2, ShieldCheck } from "lucide-react";

import { appData, type Tone } from "@/lib/shift-sync-data";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const toneToBadgeVariant = (tone: Tone) => {
  switch (tone) {
    case "critical":
      return "critical";
    case "warning":
      return "warning";
    case "success":
      return "success";
    case "neutral":
      return "neutral";
    default:
      return "default";
  }
};

export function NotificationsView() {
  return (
    <div className="space-y-5">
      <Card className="border-white/70 bg-white/85">
        <CardHeader>
          <Badge variant="default" className="w-fit">
            Notification center
          </Badge>
          <CardTitle className="clamp-[text,3xl,5xl] tracking-tight">
            Persisted updates with read state and delivery intent.
          </CardTitle>
          <CardDescription className="max-w-3xl">
            Notifications are treated as a first-class workflow surface, not
            just transient toasts. Managers and staff can see what changed,
            when, and how it was delivered.
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="grid gap-5 2xl:grid-cols-[minmax(0,1.4fr)_24.375rem]">
        <Card className="border-white/70 bg-white/85">
          <CardHeader>
            <Badge variant="warning" className="w-fit">
              Inbox
            </Badge>
            <CardTitle>Unread first, history beneath</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {appData.notifications.map((notification) => (
              <div
                key={notification.id}
                className=" border border-border/70 bg-background/70 p-5"
              >
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant={toneToBadgeVariant(notification.tone)}>
                        {notification.read ? "Read" : "Unread"}
                      </Badge>
                      <Badge variant="outline">{notification.channel}</Badge>
                    </div>
                    <p className="text-xl font-semibold tracking-tight">
                      {notification.title}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {notification.audience}
                    </p>
                  </div>
                  <p className="text-xs font-semibold tracking-[0.18em] text-muted-foreground uppercase">
                    {notification.time}
                  </p>
                </div>
                <p className="mt-4 text-sm leading-6 text-foreground/85">
                  {notification.body}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="space-y-5">
          <Card className="border-white/70 bg-white/85">
            <CardHeader>
              <Badge variant="default" className="w-fit">
                Preferences
              </Badge>
              <CardTitle>Delivery defaults by audience</CardTitle>
              <CardDescription>
                This is where per-role defaults would fan into per-user
                preferences.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {appData.notificationPreferences.map((preference) => (
                <div
                  key={preference.label}
                  className=" border border-border/70 bg-background/70 p-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-semibold">{preference.label}</p>
                    <Badge variant="outline">{preference.value}</Badge>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    {preference.note}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border-white/70 bg-white/85">
            <CardHeader>
              <Badge variant="warning" className="w-fit">
                Audit readiness
              </Badge>
              <CardTitle>Notifications complement the audit trail</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm leading-6 text-muted-foreground">
              <div className="flex gap-3  border border-border/70 bg-background/70 p-4">
                <MailCheck className="mt-0.5 size-4 text-primary" />
                <p>
                  Every meaningful state change creates a visible event in the
                  notification center so users can reconstruct what happened
                  without refreshing.
                </p>
              </div>
              <div className="flex gap-3  border border-border/70 bg-background/70 p-4">
                <ShieldCheck className="mt-0.5 size-4 text-primary" />
                <p>
                  The final backend can map these same events into immutable
                  audit log records for export and dispute resolution.
                </p>
              </div>
              <div className="flex gap-3  border border-border/70 bg-background/70 p-4">
                <Settings2 className="mt-0.5 size-4 text-primary" />
                <p>
                  Preferences are intentionally simple for now: in-app only or
                  in-app plus email simulation, matching the assessment scope.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
