import Link from "next/link";
import { AlertCircle, ArrowRightLeft, TimerReset } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const coverageRules = [
  {
    icon: ArrowRightLeft,
    title: "Swaps stay pending until the teammate accepts and a manager approves",
  },
  {
    icon: TimerReset,
    title: "Drop requests expire before the shift starts",
  },
  {
    icon: AlertCircle,
    title: "Editing a shift cancels active coverage requests for safety",
  },
];

export function CoverageInsights() {
  return (
    <div className="space-y-5">
      <Card className="border-white/70 bg-white/85">
        <CardHeader>
          <Badge variant="warning" className="w-fit">
            Rules
          </Badge>
          <CardTitle>Coverage rules</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {coverageRules.map((rule) => {
            const Icon = rule.icon;

            return (
              <div
                key={rule.title}
                className="flex items-center gap-3 border border-border/70 bg-background/70 p-4"
              >
                <Icon className="size-4 text-primary" />
                <h3 className="text-sm font-medium">{rule.title}</h3>
              </div>
            );
          })}
        </CardContent>
      </Card>

      <Card className="border-white/70 bg-white/85">
        <CardContent className="space-y-3 p-5">
          <Badge variant="outline" className="w-fit">
            Schedule
          </Badge>
          <h3 className="text-lg font-semibold tracking-tight">Weekly board</h3>
          <Button asChild>
            <Link href="/schedule">Open schedule</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
