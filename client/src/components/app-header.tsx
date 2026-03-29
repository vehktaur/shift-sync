"use client";

import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SidebarTrigger, useSidebar } from "./ui/sidebar";

const AppHeader = () => {
  const { isMobile } = useSidebar();

  return (
    <header className="mb-5 border border-white/70 bg-white/80 px-5 py-4 shadow-[0_1.5rem_5rem_-3.25rem_rgba(15,23,42,0.45)] backdrop-blur-md">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        {isMobile && (
          <SidebarTrigger
            variant="outline"
            size="icon"
            className="mt-0.5 mb-3 shrink-0 border-white/70 bg-white/85 shadow-none backdrop-blur-sm hover:bg-white"
          />
        )}
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline">Coastal Eats</Badge>
            <Badge variant="secondary">Operations</Badge>
          </div>
          <div className="space-y-1">
            <p className="text-lg font-semibold tracking-tight">
              Scheduling workspace
            </p>
            <p className="text-sm text-muted-foreground">
              Schedule, coverage, alerts.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 lg:justify-end">
          <Button variant="outline" asChild>
            <Link href="/notifications">Review alerts</Link>
          </Button>
          <Button asChild className=" px-5">
            <Link href="/schedule">Open weekly board</Link>
          </Button>
        </div>
      </div>
    </header>
  );
};
export default AppHeader;
