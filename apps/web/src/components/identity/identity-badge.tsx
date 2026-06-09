/**
 * Identity Badge Component
 * Displays a badge indicating whether an entity is human or agent.
 */

"use client";

import React from "react";
import { Bot, User } from "lucide-react";
import { clsx } from "clsx";
import type { IdentityKind } from "@/lib/types";

interface IdentityBadgeProps {
  kind: IdentityKind;
  size?: "sm" | "md" | "lg";
  showIcon?: boolean;
}

const sizeConfig = {
  sm: {
    container: "px-1.5 py-0.5 text-[10px]",
    icon: 10,
  },
  md: {
    container: "px-2 py-1 text-xs",
    icon: 12,
  },
  lg: {
    container: "px-2.5 py-1 text-sm",
    icon: 14,
  },
};

export function IdentityBadge({ kind, size = "md", showIcon = true }: IdentityBadgeProps) {
  const config = sizeConfig[size];

  if (kind === "agent") {
    return (
      <span
        className={clsx(
          "inline-flex items-center gap-1 rounded font-semibold uppercase tracking-wider",
          "bg-kalen-agent-bg text-kalen-agent border border-kalen-agent-border",
          config.container
        )}
      >
        {showIcon && <Bot size={config.icon} />}
        ai
      </span>
    );
  }

  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1 rounded font-semibold uppercase tracking-wider",
        "bg-kalen-human-bg text-kalen-human border border-kalen-human-border",
        config.container
      )}
    >
      {showIcon && <User size={config.icon} />}
      human
    </span>
  );
}
