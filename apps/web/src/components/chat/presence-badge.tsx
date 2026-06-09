/**
 * Presence Badge Component
 * Shows online/offline/away/dnd status indicator.
 */

"use client";

import React from "react";
import { clsx } from "clsx";
import type { PresenceStatus } from "@/lib/types";

interface PresenceBadgeProps {
  status: PresenceStatus;
  size?: "sm" | "md" | "lg";
}

const statusColors: Record<PresenceStatus, string> = {
  online: "bg-emerald-500",
  away: "bg-kalen-accent",
  dnd: "bg-red-500",
  offline: "bg-kalen-text-muted",
};

const statusLabels: Record<PresenceStatus, string> = {
  online: "Online",
  away: "Away",
  dnd: "Do Not Disturb",
  offline: "Offline",
};

const sizeMap = {
  sm: "w-2.5 h-2.5 border-[1.5px]",
  md: "w-3 h-3 border-2",
  lg: "w-4 h-4 border-2",
};

export function PresenceBadge({ status, size = "md" }: PresenceBadgeProps) {
  return (
    <span
      className={clsx(
        "rounded-full border-kalen-surface inline-block",
        statusColors[status],
        sizeMap[size]
      )}
      title={statusLabels[status]}
      aria-label={`Status: ${statusLabels[status]}`}
    />
  );
}
