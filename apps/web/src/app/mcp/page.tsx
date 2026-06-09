/**
 * MCP Page
 * MCP tools browser for discovering and invoking agent tools.
 */

"use client";

import React, { useState } from "react";
import { Wrench, Server, Activity } from "lucide-react";
import { useMCPServers } from "@/hooks/use-rooms";
import { MCPToolBrowser } from "@/components/mcp/tool-browser";
import { ToolInvocation } from "@/components/mcp/tool-invocation";
import type { MCPCallResult, MCPTool } from "@/lib/types";
import { apiClient } from "@/lib/api-client";

export default function MCPPage() {
  const { servers, isLoading } = useMCPServers();
  const [selectedTool, setSelectedTool] = useState<{
    serverId: string;
    serverName: string;
    tool: MCPTool;
  } | null>(null);

  const handleToolSelect = (serverId: string, toolName: string) => {
    const server = servers.find((s) => s.serverId === serverId);
    const tool = server?.tools.find((t) => t.name === toolName);
    if (tool && server) {
      setSelectedTool({ serverId, serverName: server.name, tool });
    }
  };

  const handleInvoke = async (
    toolName: string,
    args: Record<string, unknown>
  ): Promise<MCPCallResult | null> => {
    // TODO: Connect to actual MCP gateway
    console.log("Invoking tool:", toolName, args);
    return null;
  };

  // Stats
  const totalTools = servers.reduce((sum, s) => sum + s.tools.length, 0);
  const connectedServers = servers.filter((s) => s.status === "connected").length;

  return (
    <div className="h-full overflow-y-auto custom-scrollbar">
      <div className="max-w-6xl mx-auto p-4 sm:p-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-kalen-text flex items-center gap-3">
            <Wrench size={28} className="text-kalen-accent" />
            MCP Tools
          </h1>
          <p className="text-sm text-kalen-text-secondary mt-1">
            Browse and invoke Model Context Protocol tools available to your agents
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          {[
            {
              icon: Server,
              label: "Servers",
              value: servers.length.toString(),
              color: "text-kalen-primary",
              bg: "bg-kalen-primary/10",
            },
            {
              icon: Activity,
              label: "Connected",
              value: connectedServers.toString(),
              color: "text-kalen-success",
              bg: "bg-kalen-success/10",
            },
            {
              icon: Wrench,
              label: "Total Tools",
              value: totalTools.toString(),
              color: "text-kalen-accent",
              bg: "bg-kalen-accent/10",
            },
            {
              icon: Server,
              label: "Disconnected",
              value: (servers.length - connectedServers).toString(),
              color: "text-kalen-error",
              bg: "bg-kalen-error/10",
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

        {/* Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Tool browser */}
          <div className="lg:col-span-2">
            <MCPToolBrowser
              servers={servers}
              isLoading={isLoading}
              onToolSelect={handleToolSelect}
            />
          </div>

          {/* Tool invocation panel */}
          <div className="space-y-4">
            <h2 className="text-sm font-semibold text-kalen-text">Tool Invocation</h2>
            {selectedTool ? (
              <ToolInvocation
                tool={selectedTool.tool}
                serverId={selectedTool.serverId}
                serverName={selectedTool.serverName}
                onInvoke={handleInvoke}
              />
            ) : (
              <div className="rounded-xl border border-dashed border-kalen-border p-8 text-center">
                <Wrench size={24} className="text-kalen-text-muted mx-auto mb-3" />
                <p className="text-sm text-kalen-text-muted">
                  Select a tool from the browser to invoke it
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
