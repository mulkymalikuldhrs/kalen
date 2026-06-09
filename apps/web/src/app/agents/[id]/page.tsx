/**
 * Agent Profile Page
 * Detailed view of a single agent with capabilities, tools, and task history.
 */

"use client";

import React from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Bot,
  Zap,
  Wrench,
  TrendingUp,
  Clock,
  Shield,
  Activity,
  Hash,
} from "lucide-react";
import { useAgents } from "@/hooks/use-rooms";
import { IdentityBadge } from "@/components/identity/identity-badge";
import { PresenceBadge } from "@/components/chat/presence-badge";
import { clsx } from "clsx";

const statusMap: Record<string, "online" | "offline" | "dnd"> = {
  online: "online",
  offline: "offline",
  busy: "dnd",
};

export default function AgentProfilePage() {
  const params = useParams();
  const router = useRouter();
  const agentId = params.id as string;
  const { agents, isLoading } = useAgents();

  const agent = agents.find((a) => a.agentId === agentId);

  if (isLoading) {
    return (
      <div className="h-full overflow-y-auto custom-scrollbar">
        <div className="max-w-4xl mx-auto p-6">
          <div className="animate-pulse space-y-6">
            <div className="h-8 w-32 bg-kalen-surface-3 rounded" />
            <div className="h-48 bg-kalen-surface-3 rounded-xl" />
            <div className="grid grid-cols-2 gap-4">
              <div className="h-24 bg-kalen-surface-3 rounded-xl" />
              <div className="h-24 bg-kalen-surface-3 rounded-xl" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!agent) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl bg-kalen-surface-2 flex items-center justify-center mx-auto mb-4">
            <Bot size={28} className="text-kalen-text-muted" />
          </div>
          <h3 className="text-lg font-semibold text-kalen-text mb-2">Agent not found</h3>
          <p className="text-sm text-kalen-text-muted mb-4">
            The agent you&apos;re looking for doesn&apos;t exist or has been deactivated.
          </p>
          <button
            onClick={() => router.push("/agents")}
            className="text-kalen-primary hover:text-kalen-primary-hover text-sm font-medium"
          >
            Back to Agent Directory
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto custom-scrollbar">
      <div className="max-w-4xl mx-auto p-4 sm:p-6">
        {/* Back button */}
        <button
          onClick={() => router.push("/agents")}
          className="flex items-center gap-2 text-sm text-kalen-text-muted hover:text-kalen-text transition-colors mb-6"
        >
          <ArrowLeft size={16} />
          Back to Directory
        </button>

        {/* Agent header */}
        <div className="rounded-2xl border border-kalen-border bg-kalen-surface p-6 mb-6">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-2xl bg-kalen-agent-bg border border-kalen-agent-border flex items-center justify-center flex-shrink-0">
              <Bot size={32} className="text-kalen-agent" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl font-bold text-kalen-text">{agent.name}</h1>
                <IdentityBadge kind="agent" size="md" />
                <PresenceBadge status={statusMap[agent.status] || "offline"} size="md" />
              </div>
              <p className="text-sm text-kalen-text-secondary leading-relaxed mb-3">
                {agent.description}
              </p>
              <div className="flex items-center gap-4 text-xs text-kalen-text-muted">
                <span>Created {new Date(agent.createdAt).toLocaleDateString()}</span>
                <span>Owned by {agent.owner}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          {[
            {
              icon: Zap,
              label: "Total Tasks",
              value: agent.taskCount.toString(),
              color: "text-kalen-accent",
              bg: "bg-kalen-accent/10",
            },
            {
              icon: TrendingUp,
              label: "Success Rate",
              value: `${(agent.successRate * 100).toFixed(0)}%`,
              color: "text-kalen-success",
              bg: "bg-kalen-success/10",
            },
            {
              icon: Wrench,
              label: "MCP Tools",
              value: agent.tools.length.toString(),
              color: "text-kalen-agent",
              bg: "bg-kalen-agent/10",
            },
            {
              icon: Shield,
              label: "Capabilities",
              value: agent.capabilities.length.toString(),
              color: "text-kalen-primary",
              bg: "bg-kalen-primary/10",
            },
          ].map((stat) => (
            <div
              key={stat.label}
              className="rounded-xl border border-kalen-border bg-kalen-surface p-4"
            >
              <div className={`w-8 h-8 rounded-lg ${stat.bg} flex items-center justify-center mb-2`}>
                <stat.icon size={16} className={stat.color} />
              </div>
              <div className="text-lg font-bold text-kalen-text">{stat.value}</div>
              <div className="text-xs text-kalen-text-muted">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Capabilities */}
        <div className="rounded-xl border border-kalen-border bg-kalen-surface p-6 mb-6">
          <h2 className="text-sm font-semibold text-kalen-text mb-4 flex items-center gap-2">
            <Activity size={16} className="text-kalen-primary" />
            Capabilities
          </h2>
          <div className="flex flex-wrap gap-2">
            {agent.capabilities.map((cap) => (
              <span
                key={cap}
                className="px-3 py-1.5 rounded-lg bg-kalen-surface-2 border border-kalen-border text-sm text-kalen-text-secondary"
              >
                {cap}
              </span>
            ))}
          </div>
        </div>

        {/* Tools */}
        <div className="rounded-xl border border-kalen-border bg-kalen-surface p-6 mb-6">
          <h2 className="text-sm font-semibold text-kalen-text mb-4 flex items-center gap-2">
            <Wrench size={16} className="text-kalen-accent" />
            MCP Tools
          </h2>
          <div className="space-y-2">
            {agent.tools.map((tool) => (
              <div
                key={tool}
                className="flex items-center gap-3 p-3 rounded-lg bg-kalen-surface-2 border border-kalen-border"
              >
                <Hash size={14} className="text-kalen-text-muted" />
                <span className="text-sm font-mono text-kalen-text-secondary">{tool}</span>
              </div>
            ))}
          </div>
        </div>

        {/* TODO: Task history, A2A tasks, activity timeline */}
        <div className="rounded-xl border border-dashed border-kalen-border p-6 text-center">
          <p className="text-sm text-kalen-text-muted">
            Task history and A2A activity will appear here when the backend is connected.
          </p>
        </div>
      </div>
    </div>
  );
}
