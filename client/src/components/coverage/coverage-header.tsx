import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";

export function CoverageHeader() {
  return (
    <Card className="border-white/70 bg-white/85">
      <CardHeader className="gap-4">
        <Badge variant="critical" className="w-fit">
          Coverage
        </Badge>
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div className="space-y-2">
            <CardTitle className="clamp-[text,2rem,3.5rem] tracking-tight">
              Swaps and drops
            </CardTitle>
            <p className="text-sm leading-6 text-muted-foreground">Coverage requests.</p>
          </div>
          <Button variant="outline" asChild>
            <Link href="/schedule">Weekly board</Link>
          </Button>
        </div>
      </CardHeader>
    </Card>
  );
}
