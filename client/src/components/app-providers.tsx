"use client";

import { QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import queryClient from "@/lib/query-client";
import { SidebarProvider } from "@/components/ui/sidebar";
import { Toaster } from "@/components/ui/sonner";

const AppProviders = ({
  children,
  defaultSidebarOpen,
}: {
  children: React.ReactNode;
  defaultSidebarOpen: boolean;
}) => {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider
        attribute="class"
        defaultTheme="light"
        enableSystem={false}
        disableTransitionOnChange
      >
        <SidebarProvider defaultOpen={defaultSidebarOpen}>
          {children}
          <Toaster position="top-right" closeButton richColors />
        </SidebarProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default AppProviders;
