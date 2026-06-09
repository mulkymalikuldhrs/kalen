/**
 * useAuth hook
 * Convenience hook to access the auth context.
 */

"use client";

import { useContext } from "react";
import { AuthContext } from "@/lib/auth-context";

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
