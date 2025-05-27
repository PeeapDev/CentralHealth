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
    <div className="min-h-screen bg-slate-900">
      <SidebarProvider>
        <SuperAdminSidebar />
        <main className="pl-72 w-full">
          <div className="px-8 py-6">
            {children}
          </div>
        </main>
      </SidebarProvider>
      <Toaster />
    </div>
  );
}
