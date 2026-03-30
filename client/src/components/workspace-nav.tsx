"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  History,
  BellRing,
  CalendarRange,
  LayoutDashboard,
  RefreshCcw,
  UsersRound,
} from "lucide-react";

import { useCurrentUser } from "@/hooks/use-auth";
import { useNotificationCenter } from "@/hooks/use-notifications";
import { Badge } from "@/components/ui/badge";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

export function WorkspaceNav() {
  const pathname = usePathname();
  const { isMobile, setOpenMobile } = useSidebar();
  const { data: session } = useCurrentUser();
  const { data: notifications } = useNotificationCenter();
  const unreadCount = notifications?.unreadCount ?? 0;
  const role = session?.user.role ?? null;

  const navItems = [
    { href: "/", label: "Overview", icon: LayoutDashboard },
    { href: "/schedule", label: "Schedule", icon: CalendarRange },
    { href: "/coverage", label: "Coverage", icon: RefreshCcw },
    { href: "/team", label: "Team", icon: UsersRound },
    { href: "/activity", label: "Activity", icon: History, managerOnly: true },
    {
      href: "/notifications",
      label: "Alerts",
      icon: BellRing,
      badge: (
        <Badge
          variant="warning"
          className="ml-auto group-data-[collapsible=icon]:hidden"
        >
          {unreadCount}
        </Badge>
      ),
    },
  ];

  return (
    <SidebarGroup className="p-0">
      <SidebarGroupLabel className="px-1 text-xs font-semibold tracking-[0.18em] text-sidebar-foreground/60 uppercase">
        Workspace
      </SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {navItems
            .filter((item) =>
              item.managerOnly ? role === "admin" || role === "manager" : true,
            )
            .map((item) => {
              const isActive =
                item.href === "/"
                  ? pathname === item.href
                  : pathname.startsWith(item.href);
              const Icon = item.icon;

              return (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive}
                    size="lg"
                    tooltip={item.label}
                  >
                    <Link
                      href={item.href}
                      aria-label={item.label}
                      onClick={() => {
                        if (isMobile) {
                          setOpenMobile(false);
                        }
                      }}
                    >
                      <Icon className="size-4 shrink-0" />
                      <span className="group-data-[collapsible=icon]:hidden">{item.label}</span>
                      {item.badge}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
