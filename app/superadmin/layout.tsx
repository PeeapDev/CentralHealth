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
    <div className="min-h-screen w-full">
      <SidebarProvider>
        <div className="flex min-h-screen w-full">
          <SuperAdminSidebar />
          <main className="flex-1 ml-[3rem] md:ml-[6rem]">
            <div className="w-full bg-white p-0">
              {children}
            </div>
          </main>
        </div>
      </SidebarProvider>
      <Toaster />
    </div>
  );
}
