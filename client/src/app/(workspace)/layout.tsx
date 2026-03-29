import AppSidebar from "@/components/app-sidebar";
import { RealtimeBridge } from "@/components/realtime-bridge";
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { requireCurrentSession } from "@/lib/auth/dal";

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
        <div className="flex justify-end w-full mb-4 mt-2 border-b md:hidden">
          <SidebarTrigger size="icon-lg" />
        </div>
        {children}
      </SidebarInset>
    </div>
  );
}
