/**
 * Typing Indicator Component
 * Shows animated dots when someone is typing.
 */

"use client";

import React from "react";
import { clsx } from "clsx";
import type { TypingIndicator } from "@/lib/types";

interface TypingIndicatorProps {
  typers: TypingIndicator[];
}

export function TypingIndicatorDisplay({ typers }: TypingIndicatorProps) {
  if (typers.length === 0) return null;

  const names = typers.map((t) => t.entityId);
  const text =
    names.length === 1
      ? `${names[0]} is typing`
      : names.length === 2
      ? `${names[0]} and ${names[1]} are typing`
      : `${names[0]} and ${names.length - 1} others are typing`;

  return (
    <div className="flex items-center gap-2 px-4 py-2 text-xs text-kalen-text-muted">
      <div className="flex gap-1">
        <span className="typing-dot" />
        <span className="typing-dot" />
        <span className="typing-dot" />
      </div>
      <span>{text}</span>
    </div>
  );
}
