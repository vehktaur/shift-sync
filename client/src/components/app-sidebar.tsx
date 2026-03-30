"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { LogOut, Sparkles } from "lucide-react";
import { toast } from "sonner";

import { authQueryKeys, logout } from "@/lib/api/auth";
import { useSession } from "@/hooks/use-auth";
import { getApiErrorMessage } from "@/lib/api/client";
import { WorkspaceNav } from "@/components/workspace-nav";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "../lib/utils";

const getInitials = (name: string) =>
  name
    .split(" ")
    .map((segment) => segment[0] ?? "")
    .join("")
    .slice(0, 2)
    .toUpperCase();

const AppSidebar = () => {
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);
  const { isMobile, open } = useSidebar();
  const router = useRouter();
  const queryClient = useQueryClient();
  const compact = !open && !isMobile;
  const { data: session, error: sessionError } = useSession();

  const {  mutateAsync: logOut, isPending: loggingOut } = useMutation({
    mutationFn: logout,
    onSuccess: () => {
      queryClient.removeQueries({ queryKey: authQueryKeys.currentUser });
      toast.success("Signed out.");
      router.replace("/login");
      router.refresh();
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, "Unable to sign out."));
    },
  });

  useEffect(() => {
    if (
      sessionError &&
      axios.isAxiosError(sessionError) &&
      sessionError.response?.status === 401
    ) {
      router.replace("/login");
      router.refresh();
    }
  }, [router, sessionError]);

  const currentUser = session?.user;
  const initials = currentUser ? getInitials(currentUser.name) : "SS";
  const handleLogout = async () => {
    try {
      await logOut();
      setLogoutDialogOpen(false);
    } catch {
      // The mutation already surfaces API errors to the user.
    }
  };
  const headerAction = isMobile ? (
    <SidebarTrigger
      variant="outline"
      size="icon"
      className="size-11 border-primary/15 bg-primary/10 text-primary shadow-none hover:bg-primary/12"
    />
  ) : (
    <div className="relative flex size-11 items-center justify-center overflow-hidden border border-primary/15 bg-primary/10 text-primary">
      <div className="pointer-events-none flex size-full items-center justify-center transition-opacity duration-200 group-hover:opacity-0">
        <Sparkles className="size-5" />
      </div>
      <SidebarTrigger
        variant="outline"
        size="icon"
        className="absolute inset-0 size-full border-0 bg-transparent text-primary opacity-0 shadow-none transition-opacity duration-200 pointer-events-none group-hover:pointer-events-auto group-hover:opacity-100 hover:bg-transparent"
      />
    </div>
  );

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader
        className={cn(
          "border-b border-sidebar-border/60",
          compact ? "px-3 py-4" : "px-5 py-5",
        )}
      >
        {compact ? (
          <div className="flex justify-center">{headerAction}</div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-2">
                <Badge
                  variant="secondary"
                  className="bg-primary/10 text-primary"
                >
                  Coastal Eats
                </Badge>
                <div>
                  <p className="text-xs font-semibold tracking-[0.2em] text-muted-foreground uppercase">
                    ShiftSync
                  </p>
                  <h1 className="clamp-[text,lg,2xl] font-semibold tracking-tight text-foreground">
                    Workforce control
                  </h1>
                </div>
              </div>
              {headerAction}
            </div>
          </div>
        )}
      </SidebarHeader>

      <SidebarContent
        className={cn("gap-6", compact ? "px-3 py-4" : "px-5 py-5")}
      >
        <WorkspaceNav />
      </SidebarContent>

      <SidebarFooter
        className={cn(
          "border-t border-sidebar-border/60",
          compact ? "px-3 py-3" : "px-5 py-4",
        )}
      >
        {compact ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="flex size-12 items-center justify-center border border-sidebar-border/70 bg-white/85 text-sm font-semibold text-foreground shadow-none transition-colors hover:border-primary/20 hover:bg-primary/8"
              >
                {initials}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent side="right" align="end" className="w-72">
              <DropdownMenuLabel className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                    {initials}
                  </div>
                  <div className="min-w-0 flex-1 space-y-1">
                    <p className="truncate text-sm font-semibold text-foreground">
                      {currentUser?.name ?? "Loading account..."}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {currentUser?.email ?? "Resolving active session"}
                    </p>
                  </div>
                </div>
                {currentUser && (
                  <Badge
                    variant="secondary"
                    className="w-fit uppercase tracking-[0.18em] px-1 py-0.5 text-[0.625rem]"
                  >
                    {currentUser.role}
                  </Badge>
                )}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onSelect={() => setLogoutDialogOpen(true)}
                disabled={loggingOut}
                variant="destructive"
              >
                <LogOut className="size-4" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <div className="border border-sidebar-border/70 bg-white/85 p-4 shadow-[0_1.4rem_3.5rem_-2.8rem_rgba(15,23,42,0.45)]">
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                  {initials}
                </div>
                <div className="min-w-0 flex-1">
                  {currentUser ? (
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center">
                        <p className="truncate text-sm font-semibold text-foreground">
                          {currentUser.name}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                          {currentUser.email}
                        </p>
                        <Badge
                          variant="secondary"
                          className="shrink-0 uppercase mt-2 tracking-[0.18em] px-1 py-0.5 text-[0.625rem]"
                        >
                          {currentUser.role}
                        </Badge>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-28" />
                      <Skeleton className="h-3 w-40" />
                    </div>
                  )}
                </div>
              </div>

              <Button
                variant="destructive"
                size="sm"
                className="w-full gap-2"
                onClick={() => setLogoutDialogOpen(true)}
                loading={loggingOut}
              >
                <LogOut className="size-4" />
                Logout
              </Button>
            </div>
          </div>
        )}
      </SidebarFooter>

      <AlertDialog open={logoutDialogOpen} onOpenChange={setLogoutDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Sign out?</AlertDialogTitle>
            <AlertDialogDescription>
              You&apos;ll be returned to the login screen for ShiftSync.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loggingOut}>
              Stay signed in
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={loggingOut}
              onClick={async (event) => {
                event.preventDefault();
                await handleLogout();
              }}
            >
              {loggingOut ? "Signing out..." : "Sign out"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Sidebar>
  );
};

export default AppSidebar;
