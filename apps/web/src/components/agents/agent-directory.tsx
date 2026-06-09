/**
 * Agent Directory Component
 * Browsable list of all available agents with filtering.
 */

"use client";

import React, { useState } from "react";
import { Search, Filter, Bot } from "lucide-react";
import { AgentCard } from "./agent-card";
import type { AgentProfile } from "@/lib/types";

interface AgentDirectoryProps {
  agents: AgentProfile[];
  isLoading?: boolean;
}

const statusFilters = [
  { value: "all", label: "All" },
  { value: "online", label: "Online" },
  { value: "busy", label: "Busy" },
  { value: "offline", label: "Offline" },
] as const;

export function AgentDirectory({ agents, isLoading }: AgentDirectoryProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const filteredAgents = agents.filter((agent) => {
    if (statusFilter !== "all" && agent.status !== statusFilter) return false;
    if (
      search &&
      !agent.name.toLowerCase().includes(search.toLowerCase()) &&
      !agent.description.toLowerCase().includes(search.toLowerCase())
    )
      return false;
    return true;
  });

  return (
    <div className="space-y-4">
      {/* Search and filter */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-kalen-text-muted"
          />
          <input
            type="text"
            placeholder="Search agents..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-kalen-bg border border-kalen-border rounded-lg pl-9 pr-4 py-2 text-sm text-kalen-text placeholder:text-kalen-text-muted focus:outline-none focus:border-kalen-primary transition-colors"
          />
        </div>
      </div>

      {/* Status filters */}
      <div className="flex gap-2">
        {statusFilters.map((f) => (
          <button
            key={f.value}
            onClick={() => setStatusFilter(f.value)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              statusFilter === f.value
                ? "bg-kalen-agent-bg text-kalen-agent border border-kalen-agent-border"
                : "text-kalen-text-muted hover:text-kalen-text-secondary hover:bg-kalen-surface-2"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Agent grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="animate-pulse rounded-xl border border-kalen-border bg-kalen-surface p-4">
              <div className="flex gap-3">
                <div className="w-10 h-10 rounded-xl bg-kalen-surface-3" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-32 bg-kalen-surface-3 rounded" />
                  <div className="h-3 w-full bg-kalen-surface-3 rounded" />
                  <div className="h-3 w-2/3 bg-kalen-surface-3 rounded" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : filteredAgents.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 rounded-2xl bg-kalen-surface-2 flex items-center justify-center mx-auto mb-4">
            <Bot size={28} className="text-kalen-text-muted" />
          </div>
          <h3 className="text-lg font-semibold text-kalen-text mb-1">No agents found</h3>
          <p className="text-sm text-kalen-text-muted">
            {search ? "Try a different search query" : "No agents have been registered yet"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filteredAgents.map((agent) => (
            <AgentCard key={agent.agentId} agent={agent} />
          ))}
        </div>
      )}
    </div>
  );
}
