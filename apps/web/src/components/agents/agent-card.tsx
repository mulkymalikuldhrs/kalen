/**
 * Agent Card Component
 * Displays an agent's profile with name(ai), capabilities, and status.
 */

"use client";

import React from "react";
import Link from "next/link";
import {
  Bot,
  Zap,
  Wrench,
  TrendingUp,
  Clock,
  ChevronRight,
} from "lucide-react";
import { clsx } from "clsx";
import type { AgentProfile } from "@/lib/types";
import { PresenceBadge } from "@/components/chat/presence-badge";

interface AgentCardProps {
  agent: AgentProfile;
  compact?: boolean;
}

const statusMap: Record<string, "online" | "offline" | "dnd"> = {
  online: "online",
  offline: "offline",
  busy: "dnd",
};

export function AgentCard({ agent, compact = false }: AgentCardProps) {
  return (
    <Link
      href={`/agents/${agent.agentId}`}
      className={clsx(
        "block rounded-xl border border-kalen-border bg-kalen-surface transition-all",
        "hover:border-kalen-agent-border hover:bg-kalen-surface-2",
        compact ? "p-3" : "p-4"
      )}
    >
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <div className="w-10 h-10 rounded-xl bg-kalen-agent-bg border border-kalen-agent-border flex items-center justify-center flex-shrink-0">
          <Bot size={20} className="text-kalen-agent" />
        </div>

        <div className="flex-1 min-w-0">
          {/* Name and status */}
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-semibold text-kalen-text truncate">
              {agent.name}
            </span>
            <span className="agent-badge">ai</span>
            <PresenceBadge status={statusMap[agent.status] || "offline"} size="sm" />
          </div>

          {/* Description */}
          {!compact && (
            <p className="text-xs text-kalen-text-secondary line-clamp-2 mb-2">
              {agent.description}
            </p>
          )}

          {/* Stats */}
          {!compact && (
            <div className="flex items-center gap-4 text-[11px] text-kalen-text-muted">
              <span className="flex items-center gap-1">
                <Zap size={12} className="text-kalen-accent" />
                {agent.taskCount} tasks
              </span>
              <span className="flex items-center gap-1">
                <TrendingUp size={12} className="text-kalen-success" />
                {(agent.successRate * 100).toFixed(0)}%
              </span>
              <span className="flex items-center gap-1">
                <Wrench size={12} />
                {agent.tools.length} tools
              </span>
            </div>
          )}

          {/* Capabilities */}
          {!compact && (
            <div className="flex flex-wrap gap-1 mt-2">
              {agent.capabilities.slice(0, 4).map((cap) => (
                <span
                  key={cap}
                  className="px-2 py-0.5 rounded-full bg-kalen-surface-3 text-[10px] text-kalen-text-secondary"
                >
                  {cap}
                </span>
              ))}
              {agent.capabilities.length > 4 && (
                <span className="px-2 py-0.5 rounded-full bg-kalen-surface-3 text-[10px] text-kalen-text-muted">
                  +{agent.capabilities.length - 4}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Arrow */}
        <ChevronRight size={16} className="text-kalen-text-muted flex-shrink-0 mt-1" />
      </div>
    </Link>
  );
}
