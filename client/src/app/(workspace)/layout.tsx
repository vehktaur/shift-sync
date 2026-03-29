import AppHeader from "@/components/app-header";
import AppSidebar from "@/components/app-sidebar";
import { SidebarInset } from "@/components/ui/sidebar";
import { requireCurrentSession } from "@/lib/auth/dal";

export default async function WorkspaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireCurrentSession();

  return (
    <div className="flex min-h-screen w-full">
      <AppSidebar />
      <SidebarInset className="min-w-0 flex-1 clamp-[p,2,5]">
        <AppHeader />
        {children}
      </SidebarInset>
    </div>
  );
}
