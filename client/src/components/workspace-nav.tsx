"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BellRing,
  CalendarRange,
  LayoutDashboard,
  RefreshCcw,
  UsersRound,
} from "lucide-react";

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

const navItems = [
  { href: "/", label: "Overview", icon: LayoutDashboard },
  { href: "/schedule", label: "Schedule", icon: CalendarRange },
  { href: "/coverage", label: "Coverage", icon: RefreshCcw },
  { href: "/team", label: "Team", icon: UsersRound },
  { href: "/notifications", label: "Alerts", icon: BellRing },
];

export function WorkspaceNav() {
  const pathname = usePathname();
  const { isMobile, setOpenMobile } = useSidebar();

  return (
    <SidebarGroup className="p-0">
      <SidebarGroupLabel className="px-1 text-xs font-semibold tracking-[0.18em] text-sidebar-foreground/60 uppercase">
        Workspace
      </SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {navItems.map((item) => {
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
                    <span>{item.label}</span>
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
