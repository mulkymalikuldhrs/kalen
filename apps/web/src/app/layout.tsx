/**
 * Root Layout
 * Wraps the entire app with AuthProvider and main layout structure.
 */

import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";
import { AppShell } from "@/components/layout/app-shell";

export const metadata: Metadata = {
  title: "KALEN — Kinetic Autonomous Layer for Entity Networking",
  description:
    "Sovereign, AI-native communication platform where humans and agents coexist as first-class citizens.",
  keywords: ["KALEN", "AI", "messaging", "agents", "MCP", "A2A", "WebAuthn"],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-kalen-bg text-kalen-text font-sans antialiased">
        <AuthProvider>
          <AppShell>{children}</AppShell>
        </AuthProvider>
      </body>
    </html>
  );
}
