import type { Metadata } from "next";

import AppSidebar from "@/components/app-sidebar";
import { RealtimeBridge } from "@/components/realtime-bridge";
import { WorkspaceTour } from "@/components/workspace-tour";
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { requireCurrentSession } from "@/lib/auth/dal";
import { privateRouteRobots } from "@/lib/seo";

export const metadata: Metadata = {
  robots: privateRouteRobots,
};

export default async function WorkspaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireCurrentSession();

  return (
    <div className="flex min-h-screen w-full">
      <RealtimeBridge />
      <AppSidebar />
      <SidebarInset className="min-w-0 flex-1 clamp-[p,2,5]">
        <div className="mb-4 mt-2 flex w-full items-center justify-between gap-3 border-b pb-4">
          <div className="md:hidden">
            <SidebarTrigger size="icon-lg" />
          </div>
          <div className="ml-auto">
            <WorkspaceTour />
          </div>
        </div>
        {children}
      </SidebarInset>
    </div>
  );
}
