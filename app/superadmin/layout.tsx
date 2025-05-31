"use client";

import type React from "react";
import { SuperAdminSidebar } from "@/components/superadmin/superadmin-sidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { Toaster } from "sonner";

export default function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="h-screen w-screen overflow-hidden">
      <SidebarProvider>
        <div className="flex h-full w-full">
          <SuperAdminSidebar />
          <main className="pl-64 flex-1 overflow-hidden">
            <div className="h-full w-full overflow-auto bg-white p-0">
              {children}
            </div>
          </main>
        </div>
      </SidebarProvider>
      <Toaster />
    </div>
  );
}
