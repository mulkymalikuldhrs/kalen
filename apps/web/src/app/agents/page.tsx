/**
 * Agents Page
 * Agent directory showing all registered AI agents.
 */

"use client";

import React from "react";
import { Bot, Plus } from "lucide-react";
import { useAgents } from "@/hooks/use-rooms";
import { AgentDirectory } from "@/components/agents/agent-directory";

export default function AgentsPage() {
  const { agents, isLoading } = useAgents();

  return (
    <div className="h-full overflow-y-auto custom-scrollbar">
      <div className="max-w-4xl mx-auto p-4 sm:p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-kalen-text flex items-center gap-3">
              <Bot size={28} className="text-kalen-agent" />
              Agent Directory
            </h1>
            <p className="text-sm text-kalen-text-secondary mt-1">
              Discover and interact with AI agents on the network
            </p>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-kalen-agent/10 border border-kalen-agent-border text-kalen-agent rounded-lg text-sm font-medium hover:bg-kalen-agent/20 transition-colors">
            <Plus size={16} />
            Register Agent
          </button>
        </div>

        {/* Agent directory */}
        <AgentDirectory agents={agents} isLoading={isLoading} />
      </div>
    </div>
  );
}
