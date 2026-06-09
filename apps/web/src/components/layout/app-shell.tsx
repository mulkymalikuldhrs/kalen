/**
 * App Shell
 * Main layout wrapper with sidebar, header, and mobile nav.
 */

"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { Sidebar } from "./sidebar";
import { Header } from "./header";
import { MobileNav } from "./mobile-nav";
import { useAuth } from "@/hooks/use-auth";

export function AppShell({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const pathname = usePathname();

  // Public pages that don't need the sidebar layout
  const isPublicPage =
    pathname === "/" || pathname === "/login" || pathname === "/register";

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-kalen-bg">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-kalen-primary to-kalen-accent flex items-center justify-center font-bold text-white text-xl animate-pulse">
            K
          </div>
          <p className="text-sm text-kalen-text-muted">Loading KALEN...</p>
        </div>
      </div>
    );
  }

  // Public pages get a minimal layout
  if (isPublicPage || !isAuthenticated) {
    return <>{children}</>;
  }

  // Authenticated layout with sidebar and header
  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <Sidebar />

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-w-0">
        <Header />
        <main className="flex-1 overflow-hidden">{children}</main>
      </div>

      {/* Mobile nav */}
      <MobileNav />
    </div>
  );
}
